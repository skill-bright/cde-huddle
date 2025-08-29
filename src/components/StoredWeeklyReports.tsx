import { StoredWeeklyReport } from '../types';
import { Calendar, FileText, Users, Clock, CheckCircle, XCircle, AlertTriangle, Eye } from 'lucide-react';

interface StoredWeeklyReportsProps {
  reports: StoredWeeklyReport[];
  loading: boolean;
  onViewReport: (report: StoredWeeklyReport) => void;
}

export function StoredWeeklyReports({ reports, loading, onViewReport }: StoredWeeklyReportsProps) {
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
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading stored reports...</span>
        </div>
      </div>
    );
  }

  if (reports.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="text-center py-8">
          <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No stored reports yet</h3>
          <p className="text-gray-500 mb-4">
            Weekly reports are automatically generated every Friday at 12:00 PM PST.
          </p>
          
          {/* Setup Message - Check if this is due to missing table */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-4">
            <div className="flex items-start">
              <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 mr-3" />
              <div className="text-left">
                <h4 className="text-sm font-medium text-yellow-800 mb-1">Database Setup Required</h4>
                <p className="text-sm text-yellow-700 mb-2">
                  The weekly reports feature requires the database to be properly set up. 
                  If you're seeing this message, the weekly_reports table may not exist.
                </p>
                <div className="text-xs text-yellow-600 space-y-1">
                  <p><strong>To fix this:</strong></p>
                  <ol className="list-decimal list-inside space-y-1 ml-2">
                    <li>Ensure Supabase is properly configured with environment variables</li>
                    <li>Run the database migrations in the supabase/migrations/ directory</li>
                    <li>Apply the 20250813000000_add_weekly_reports.sql migration</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
            <p className="text-sm text-blue-700">
              <strong>Next automatic generation:</strong> Friday at 12:00 PM PST
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Stored Weekly Reports</h3>
        <div className="text-sm text-gray-500">
          {reports.length} report{reports.length !== 1 ? 's' : ''}
        </div>
      </div>

      <div className="space-y-4">
        {reports.map((report) => (
          <div
            key={report.id}
            className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors duration-200"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <span className="font-medium text-gray-900">
                    Week of {formatDate(report.weekStart)} - {formatDate(report.weekEnd)}
                  </span>
                  <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs border ${getStatusColor(report.status)}`}>
                    {getStatusIcon(report.status)}
                    <span>{getStatusText(report.status)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-6 text-sm text-gray-600">
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
                  <div className="mt-2 text-sm text-red-600 bg-red-50 p-2 rounded">
                    <strong>Error:</strong> {report.error}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                {report.status === 'generated' && (
                  <button
                    onClick={() => onViewReport(report)}
                    className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 transition-colors duration-200"
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

      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="text-sm text-gray-500">
          <p>📅 <strong>Automatic Generation:</strong> Reports are automatically generated every Friday at 12:00 PM PST</p>
        </div>
      </div>
    </div>
  );
}
