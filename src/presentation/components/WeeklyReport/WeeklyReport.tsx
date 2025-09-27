import { useState, useCallback } from 'react';
import { motion } from 'motion/react';
import { AlertTriangle, FileText } from 'lucide-react';

import { useAIGeneration } from '@/presentation/hooks/useAIGeneration';

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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
            Weekly Reports
          </h2>
          <p className="text-gray-600 dark:text-gray-400">Automatically generated standup summaries with AI insights</p>
        </div>
        {toGenerateReportManually && (
          <button
            onClick={onGenerateReportManually}
            disabled={generatingReport}
            className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-white dark:text-white bg-blue-600 dark:bg-blue-500 border border-blue-600 dark:border-blue-500 rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {generatingReport ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Generating...</span>
              </>
            ) : (
              <>
                <FileText className="w-4 h-4" />
                <span>Generate This Week</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Generation Info */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700/50 rounded-md p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">Weekly Report Generation</h3>
            <p className="mt-1 text-sm text-blue-700 dark:text-blue-300">
              Weekly reports are automatically generated every Friday at 12:00 PM PST.
            </p>
          </div>
        </div>
      </div>

      {/* Stored Reports */}
      <StoredWeeklyReports
        reports={storedReports}
        loading={storedReportsLoading}
        onViewReport={onViewStoredReport}
        onGenerateReportManually={onGenerateReportManually}
        generatingReport={generatingReport}
      />
    </div>
  );
}
