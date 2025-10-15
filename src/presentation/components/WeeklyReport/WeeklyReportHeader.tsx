import { motion } from 'motion/react';
import { ArrowLeft, FileText, Download } from 'lucide-react';

import { useDateUtils } from '@/presentation/hooks/useDateUtils';

import ParticleButton from '@/components/kokonutui/particle-button';
import { WeeklyReport } from '@/domain/entities/WeeklyReport';
import { PasskeyModal } from '@/components/PasskeyModal';
import { usePasskey } from '@/presentation/hooks/usePasskey';


interface WeeklyReportHeaderProps {
  report: WeeklyReport;
  onBack: () => void;
  onExport: () => void;
  onGenerateReport?: () => void;
  generatingReport?: boolean;
  showGenerateButton?: boolean;
}

/**
 * Header component for weekly reports
 * Displays report title, date range, and action buttons
 */
export function WeeklyReportHeader({
  report,
  onBack,
  onExport,
  onGenerateReport,
  generatingReport = false,
  showGenerateButton = false
}: WeeklyReportHeaderProps) {
  const { formatDate } = useDateUtils();
  const { isModalOpen, modalConfig, showPasskeyModal, handlePasskeyConfirm, handlePasskeyCancel } = usePasskey();

  const handleGenerateWithPasskey = () => {
    if (!onGenerateReport) return;
    
    showPasskeyModal(
      onGenerateReport,
      'Generate Weekly Report',
      'Please enter the passkey to generate this week\'s report. This action will create a new weekly report with AI analysis.',
      'Generate Report'
    );
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center justify-between"
    >
      <div className="flex items-center gap-4">
        <ParticleButton
          onClick={onBack}
          className="px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl hover:from-orange-600 hover:to-red-600 transition-all duration-200 flex items-center gap-2 shadow-lg hover:shadow-xl"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Reports
        </ParticleButton>
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-purple-900 dark:from-white dark:via-blue-100 dark:to-purple-100 bg-clip-text text-transparent">
            Weekly Report
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Week of {formatDate(report.weekStart)} - {formatDate(report.weekEnd)}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        {showGenerateButton && onGenerateReport && (
          <ParticleButton
            onClick={handleGenerateWithPasskey}
            disabled={generatingReport}
            className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 dark:bg-blue-500 border border-blue-600 dark:border-blue-500 rounded-xl hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
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
          </ParticleButton>
        )}
        <ParticleButton
          onClick={onExport}
          className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-green-500 text-white rounded-xl hover:from-emerald-600 hover:to-green-600 transition-all duration-200 flex items-center gap-2 shadow-lg hover:shadow-xl"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </ParticleButton>
      </div>

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
    </motion.div>
  );
}
