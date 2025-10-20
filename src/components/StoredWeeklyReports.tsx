import { StoredWeeklyReport } from '@/domain/repositories/StandupRepository';
import { Calendar, FileText, Users, Clock, CheckCircle, XCircle, AlertTriangle, Eye } from 'lucide-react';
import { PasskeyModal } from './PasskeyModal';
import { usePasskey } from '@/presentation/hooks/usePasskey';

interface StoredWeeklyReportsProps {
  reports: StoredWeeklyReport[];
  loading: boolean;
  onViewReport: (report: StoredWeeklyReport) => void;
  onGenerateReportManually?: () => Promise<void>;
  onGenerateLastWeekReportManually?: () => Promise<void>;
  toGenerateReportManually?: boolean;
  generatingReport?: boolean;
}

export function StoredWeeklyReports({ reports, loading, onViewReport, onGenerateReportManually, onGenerateLastWeekReportManually, toGenerateReportManually = false, generatingReport = false }: StoredWeeklyReportsProps) {
  const { isModalOpen, modalConfig, showPasskeyModal, handlePasskeyConfirm, handlePasskeyCancel } = usePasskey();
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'America/Vancouver'
    });
  };

  const handleGenerateWithPasskey = () => {
    if (!onGenerateReportManually) return;
    
    showPasskeyModal(
      onGenerateReportManually,
      'Generate Weekly Report',
      'Please enter the passkey to generate this week\'s report. This action will create a new weekly report with AI analysis.',
      'Generate Report'
    );
  };

  const handleGenerateLastWeekWithPasskey = () => {
    if (!onGenerateLastWeekReportManually) return;
    
    showPasskeyModal(
      onGenerateLastWeekReportManually,
      'Generate Last Week Report',
      'Please enter the passkey to generate last week\'s report. This action will create a new weekly report with AI analysis for the previous week.',
      'Generate Last Week Report'
    );
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'generated':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'pending':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'generated':
        return 'Generated';
      case 'failed':
        return 'Failed';
      case 'pending':
        return 'Pending';
      default:
        return 'Unknown';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'generated':
        return 'text-green-700 bg-green-50 border-green-200';
      case 'failed':
        return 'text-red-700 bg-red-50 border-red-200';
      case 'pending':
        return 'text-yellow-700 bg-yellow-50 border-yellow-200';
      default:
        return 'text-gray-700 bg-gray-50 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-2xl border border-white/20 dark:border-gray-700/20 p-6 shadow-lg">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400"></div>
          <span className="ml-3 text-gray-600 dark:text-gray-400">Loading stored reports...</span>
        </div>
      </div>
    );
  }

  if (reports.length === 0) {
    return (
      <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-2xl border border-white/20 dark:border-gray-700/20 p-6 shadow-lg">
        <div className="text-center py-8">
          <FileText className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No stored reports yet</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            Weekly reports are automatically generated every Friday at 12:00 PM PST.
          </p>
          
          {/* Information about automatic generation */}
          <div className="bg-blue-50/80 dark:bg-blue-900/20 border border-blue-200/50 dark:border-blue-700/50 rounded-xl p-4 mb-4 backdrop-blur-sm">
            <div className="flex items-start">
              <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 mr-3" />
              <div className="text-left flex-1">
                <h4 className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-1">Automatic Weekly Reports</h4>
                <p className="text-sm text-blue-700 dark:text-blue-400 mb-2">
                  Weekly reports are automatically generated every Friday at 12:00 PM PST. 
                  The first report will be created after the next scheduled run.
                </p>
                <div className="text-xs text-blue-600 dark:text-blue-400 space-y-1">
                  <p><strong>Next automatic generation:</strong> This Friday at 12:00 PM PST</p>
                  {toGenerateReportManually && onGenerateReportManually && (
                    <p><strong>Manual generation:</strong> You can also generate reports manually using the button below</p>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {/* Manual generation buttons for when there are no reports */}
          {toGenerateReportManually && onGenerateReportManually && (
            <div className="flex justify-center gap-3 mb-4">
              <button
                onClick={handleGenerateWithPasskey}
                disabled={generatingReport}
                className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 dark:bg-blue-500 border border-blue-600 dark:border-blue-500 rounded-xl hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md"
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
              
              {onGenerateLastWeekReportManually && (
                <button
                  onClick={handleGenerateLastWeekWithPasskey}
                  disabled={generatingReport}
                  className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-white bg-gray-600 dark:bg-gray-500 border border-gray-600 dark:border-gray-500 rounded-xl hover:bg-gray-700 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  {generatingReport ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Generating...</span>
                    </>
                  ) : (
                    <>
                      <FileText className="w-4 h-4" />
                      <span>Generate Last Week</span>
                    </>
                  )}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-2xl border border-white/20 dark:border-gray-700/20 p-6 shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Stored Weekly Reports</h3>
        <div className="flex items-center gap-3">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {reports.length} report{reports.length !== 1 ? 's' : ''}
          </div>
          {toGenerateReportManually && (
            <div className="flex items-center gap-2">
              <button
                onClick={handleGenerateWithPasskey}
                disabled={generatingReport}
                className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-white bg-blue-600 dark:bg-blue-500 border border-blue-600 dark:border-blue-500 rounded-xl hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md"
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
              
              {onGenerateLastWeekReportManually && (
                <button
                  onClick={handleGenerateLastWeekWithPasskey}
                  disabled={generatingReport}
                  className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-white bg-gray-600 dark:bg-gray-500 border border-gray-600 dark:border-gray-500 rounded-xl hover:bg-gray-700 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  {generatingReport ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Generating...</span>
                    </>
                  ) : (
                    <>
                      <FileText className="w-4 h-4" />
                      <span>Generate Last Week</span>
                    </>
                  )}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="space-y-4">
        {reports.map((report) => (
          <div
            key={report.id}
            className="border border-white/20 dark:border-gray-700/20 rounded-xl p-4 hover:bg-white/40 dark:hover:bg-gray-800/40 transition-all duration-200 backdrop-blur-sm bg-white/20 dark:bg-gray-800/20"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <Calendar className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                  <span className="font-medium text-gray-900 dark:text-white">
                    Week of {formatDate(report.weekStart)} - {formatDate(report.weekEnd)}
                  </span>
                  <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs border ${getStatusColor(report.status)}`}>
                    {getStatusIcon(report.status)}
                    <span>{getStatusText(report.status)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-6 text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex items-center gap-1">
                    <FileText className="w-4 h-4" />
                    <span>{report.totalUpdates} updates</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    <span>{report.uniqueMembers} members</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>Generated {formatTime(report.generatedAt)}</span>
                  </div>
                </div>

                {report.error && (
                  <div className="mt-2 text-sm text-red-600 dark:text-red-400 bg-red-50/80 dark:bg-red-900/20 p-2 rounded-lg border border-red-200/50 dark:border-red-700/50">
                    <strong>Error:</strong> {report.error}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                {report.status === 'generated' && (
                  <button
                    onClick={() => onViewReport(report)}
                    className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-50/80 dark:bg-blue-900/20 border border-blue-200/50 dark:border-blue-700/50 rounded-xl hover:bg-blue-100/80 dark:hover:bg-blue-800/30 transition-all duration-200"
                  >
                    <Eye className="w-4 h-4" />
                    View
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 pt-4 border-t border-white/20 dark:border-gray-700/20">
        <div className="text-sm text-gray-500 dark:text-gray-400">
          <p>📅 <strong>Automatic Generation:</strong> Reports are automatically generated every Friday at 12:00 PM PST</p>
        </div>
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
    </div>
  );
}
