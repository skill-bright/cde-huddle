import { useState, useCallback } from 'react';
import { motion } from 'motion/react';
import { AlertTriangle, FileText } from 'lucide-react';

import { useAIGeneration } from '@/presentation/hooks/useAIGeneration';
import { PasskeyModal } from '@/components/PasskeyModal';
import { usePasskey } from '@/presentation/hooks/usePasskey';

import { WeeklyReport as WeeklyReportType } from '@/domain/entities/WeeklyReport';
import { StoredWeeklyReport } from '@/domain/repositories/StandupRepository';
import { WeeklyReportHeader } from '@/presentation/components/WeeklyReport/WeeklyReportHeader';
import { WeeklyReportStats } from '@/presentation/components/WeeklyReport/WeeklyReportStats';
import { WeeklyReportSummary } from '@/presentation/components/WeeklyReport/WeeklyReportSummary';
import { WeeklyReportEntries } from '@/presentation/components/WeeklyReport/WeeklyReportEntries';
import { StoredWeeklyReports } from '@/components/StoredWeeklyReports';

interface WeeklyReportProps {
  report: WeeklyReportType | null;
  loading: boolean;
  error: string | null;
  getPreviousWeekDates: () => { weekStart: string; weekEnd: string };
  storedReports: StoredWeeklyReport[];
  storedReportsLoading: boolean;
  onViewStoredReport: (report: StoredWeeklyReport) => void;
  setWeeklyReport: (report: WeeklyReportType | null) => void;
  onGenerateReportManually?: () => Promise<void>;
  toGenerateReportManually?: boolean; 
  generatingReport?: boolean;
}

/**
 * Main WeeklyReport component
 * Orchestrates the display of weekly reports with proper separation of concerns
 */
export function WeeklyReport({ 
  report, 
  error, 
  storedReports,
  storedReportsLoading,
  onViewStoredReport,
  setWeeklyReport,
  onGenerateReportManually,
  toGenerateReportManually = false,
  generatingReport = false
}: WeeklyReportProps) {
  const [regeneratingSummary, setRegeneratingSummary] = useState<boolean>(false);
  const { regenerateWeeklySummary } = useAIGeneration();
  const { isModalOpen, modalConfig, showPasskeyModal, handlePasskeyConfirm, handlePasskeyCancel } = usePasskey();

  const handleGenerateWithPasskey = useCallback(() => {
    if (!onGenerateReportManually) return;
    
    showPasskeyModal(
      onGenerateReportManually,
      'Generate Weekly Report',
      'Please enter the passkey to generate this week\'s report. This action will create a new weekly report with AI analysis.',
      'Generate Report'
    );
  }, [onGenerateReportManually, showPasskeyModal]);

  const handleRegenerateSummary = useCallback(async () => {
    if (!report) return;
    
    try {
      setRegeneratingSummary(true);
      console.log('🔄 Regenerating AI summary for report:', report.weekStart, 'to', report.weekEnd);
      
      const newSummary = await regenerateWeeklySummary(report);
      
      // Update the report with the new summary
      const updatedReport = new WeeklyReportType(
        report.weekStart,
        report.weekEnd,
        report.entries,
        newSummary
      );
      
      setWeeklyReport(updatedReport);
      console.log('✅ Successfully regenerated and updated AI summary');
      
    } catch (error) {
      console.error('❌ Failed to regenerate AI summary:', error);
    } finally {
      setRegeneratingSummary(false);
    }
  }, [report, regenerateWeeklySummary, setWeeklyReport]);

  const handleExportToCSV = useCallback(() => {
    if (!report) return;

    const csvContent = [
      ['Date', 'Team Member', 'Role', 'Yesterday', 'Today', 'Blockers'],
      ...report.entries.flatMap(entry =>
        entry.teamMembers.map(member => [
          entry.date,
          member.name,
          member.role,
          member.yesterday,
          member.today,
          member.blockers
        ])
      )
    ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `weekly-report-${report.weekStart}-${report.weekEnd}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  }, [report]);

  const handleBack = useCallback(() => {
    setWeeklyReport(null);
    // Clear the URL query parameter to prevent re-triggering the report
    const url = new URL(window.location.href);
    url.searchParams.delete('report');
    window.history.replaceState({}, '', url.toString());
  }, [setWeeklyReport]);

  // If we have a report to display, show it
  if (report) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <WeeklyReportHeader
          report={report}
          onBack={handleBack}
          onExport={handleExportToCSV}
          onGenerateReport={onGenerateReportManually}
          generatingReport={generatingReport}
          showGenerateButton={toGenerateReportManually}
        />

        {/* Error */}
        {error && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-red-50/80 dark:bg-red-900/20 border border-red-200/50 dark:border-red-700/50 rounded-xl p-4 backdrop-blur-sm"
          >
            <div className="flex">
              <AlertTriangle className="w-5 h-5 text-red-500 dark:text-red-400" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800 dark:text-red-300">Error generating report</h3>
                <p className="mt-1 text-sm text-red-700 dark:text-red-400">{error}</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Report Content */}
        <div className="space-y-6">
          {/* Statistics */}
          <WeeklyReportStats report={report} />

          {/* AI Summary */}
          {report.summary && (
            <WeeklyReportSummary
              summary={report.summary}
              onRegenerate={handleRegenerateSummary}
              regenerating={regeneratingSummary}
            />
          )}

          {/* Daily Entries */}
          <WeeklyReportEntries report={report} />
        </div>
      </div>
    );
  }

  // Default view: Show stored reports with generation options
  return (
    <div className="space-y-8">
      {/* Header Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="flex items-center justify-between"
      >
        <div>
          <h2 className="section-header">Weekly Reports</h2>
          <p className="section-subtitle">AI-powered insights from your team's standup data</p>
        </div>
        {toGenerateReportManually && (
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <button
              onClick={handleGenerateWithPasskey}
              disabled={generatingReport}
              className="btn-modern btn-primary flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {generatingReport ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <FileText className="w-5 h-5" />
                  <span>Generate This Week</span>
                </>
              )}
            </button>
          </motion.div>
        )}
      </motion.div>

      {/* Generation Info Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="card-modern p-6 bg-gradient-to-r from-blue-50/60 to-blue-100/40 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200/50 dark:border-blue-700/30"
      >
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center flex-shrink-0">
            <FileText className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-blue-800 dark:text-blue-200 mb-2">Automated Report Generation</h3>
            <p className="text-blue-700 dark:text-blue-300 leading-relaxed">
              Weekly reports are automatically generated every Friday at 12:00 PM PST using AI to analyze your team's standup data and provide actionable insights.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Stored Reports */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
      >
        <StoredWeeklyReports
          reports={storedReports}
          loading={storedReportsLoading}
          onViewReport={onViewStoredReport}
          onGenerateReportManually={onGenerateReportManually}
          generatingReport={generatingReport}
        />
      </motion.div>

      {/* Passkey Modal */}
      <PasskeyModal
        isOpen={isModalOpen}
        onClose={handlePasskeyCancel}
        onConfirm={handlePasskeyConfirm}
        title={modalConfig.title}
        description={modalConfig.description}
        actionLabel={modalConfig.actionLabel}
        loading={generatingReport}
      />
    </div>
  );
}
