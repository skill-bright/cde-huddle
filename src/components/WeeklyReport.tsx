import { WeeklyReport as WeeklyReportType, StoredWeeklyReport } from '../types';
import { Calendar, FileText, Users, TrendingUp, AlertTriangle, Lightbulb, Download, User, Clock, ArrowLeft } from 'lucide-react';
import { StoredWeeklyReports } from './StoredWeeklyReports';

// Helper function to safely render HTML content
const renderHtmlContent = (content: string) => {
  if (!content) return null;
  
  // Create a temporary div to parse and clean the HTML
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = content;
  
  // Remove any script tags for security
  const scripts = tempDiv.querySelectorAll('script');
  scripts.forEach(script => script.remove());
  
  // Get the cleaned HTML
  const cleanedHtml = tempDiv.innerHTML;
  
  return (
    <div 
      className="prose prose-sm max-w-none"
      dangerouslySetInnerHTML={{ __html: cleanedHtml }}
    />
  );
};

interface WeeklyReportProps {
  report: WeeklyReportType | null;
  loading: boolean;
  error: string | null;
  getPreviousWeekDates: () => { weekStart: string; weekEnd: string };
  storedReports: StoredWeeklyReport[];
  storedReportsLoading: boolean;
  onViewStoredReport: (report: StoredWeeklyReport) => void;
  setWeeklyReport: (report: WeeklyReportType | null) => void;
}

export function WeeklyReport({ 
  report, 
  error, 
  storedReports,
  storedReportsLoading,
  onViewStoredReport,
  setWeeklyReport
}: WeeklyReportProps) {
  

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const exportToCSV = () => {
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
  };

  // If we have a report to display, show it
  if (report) {
    return (
      <div className="space-y-6">
        {/* Header with Back Button */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setWeeklyReport(null)}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors duration-200"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Reports
            </button>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Weekly Report</h2>
              <p className="text-gray-600">Week of {formatDate(report.weekStart)} - {formatDate(report.weekEnd)}</p>
            </div>
          </div>
          <button
            onClick={exportToCSV}
            className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <AlertTriangle className="w-5 h-5 text-red-400" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error generating report</h3>
                <p className="mt-1 text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Report Content */}
        <div className="space-y-6">
          {/* Report Header */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">
                  Week of {formatDate(report.weekStart)} - {formatDate(report.weekEnd)}
                </h3>
                <p className="text-gray-600">Generated on {new Date().toLocaleDateString()}</p>
              </div>
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center">
                  <FileText className="w-5 h-5 text-blue-600" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-blue-600">Total Updates</p>
                    <p className="text-2xl font-bold text-blue-900">{report.totalUpdates}</p>
                  </div>
                </div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex items-center">
                  <Users className="w-5 h-5 text-green-600" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-green-600">Active Members</p>
                    <p className="text-2xl font-bold text-green-900">{report.uniqueMembers}</p>
                  </div>
                </div>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="flex items-center">
                  <Calendar className="w-5 h-5 text-purple-600" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-purple-600">Days with Data</p>
                    <p className="text-2xl font-bold text-purple-900">{report.entries.length}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* AI Summary */}
          {report.summary && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Lightbulb className="w-5 h-5 text-yellow-500 mr-2" />
                AI-Generated Summary
              </h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Key Accomplishments */}
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-3 flex items-center">
                    <TrendingUp className="w-4 h-4 text-green-600 mr-2" />
                    Key Accomplishments
                  </h4>
                  <ul className="space-y-2">
                    {report.summary.keyAccomplishments && report.summary.keyAccomplishments.length > 0 ? (
                      report.summary.keyAccomplishments.map((accomplishment, index) => (
                        <li key={index} className="text-sm text-gray-700 bg-green-50 p-3 rounded-md">
                          {renderHtmlContent(accomplishment)}
                        </li>
                      ))
                    ) : (
                      <li className="text-sm text-gray-500 italic">No accomplishments recorded</li>
                    )}
                  </ul>
                </div>

                {/* Ongoing Work */}
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-3 flex items-center">
                    <Clock className="w-4 h-4 text-blue-600 mr-2" />
                    Ongoing Work
                  </h4>
                  <ul className="space-y-2">
                    {report.summary.ongoingWork && report.summary.ongoingWork.length > 0 ? (
                      report.summary.ongoingWork.map((work, index) => (
                        <li key={index} className="text-sm text-gray-700 bg-blue-50 p-3 rounded-md">
                          {renderHtmlContent(work)}
                        </li>
                      ))
                    ) : (
                      <li className="text-sm text-gray-500 italic">No ongoing work recorded</li>
                    )}
                  </ul>
                </div>

                {/* Blockers */}
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-3 flex items-center">
                    <AlertTriangle className="w-4 h-4 text-red-600 mr-2" />
                    Blockers & Issues
                  </h4>
                  <ul className="space-y-2">
                    {report.summary.blockers && report.summary.blockers.length > 0 ? (
                      report.summary.blockers.map((blocker, index) => (
                        <li key={index} className="text-sm text-gray-700 bg-red-50 p-3 rounded-md">
                          {renderHtmlContent(blocker)}
                        </li>
                      ))
                    ) : (
                      <li className="text-sm text-gray-500 italic">No blockers recorded</li>
                    )}
                  </ul>
                </div>

                {/* Team Insights */}
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-3 flex items-center">
                    <Users className="w-4 h-4 text-purple-600 mr-2" />
                    Team Insights
                  </h4>
                  <div className="text-sm text-gray-700 bg-purple-50 p-3 rounded-md">
                    {report.summary.teamInsights ? renderHtmlContent(report.summary.teamInsights) : 'No team insights available'}
                  </div>
                </div>
              </div>

              {/* Recommendations */}
              {report.summary.recommendations && report.summary.recommendations.length > 0 && (
                <div className="mt-6">
                  <h4 className="text-md font-medium text-gray-900 mb-3 flex items-center">
                    <Lightbulb className="w-4 h-4 text-yellow-600 mr-2" />
                    Recommendations
                  </h4>
                  <ul className="space-y-2">
                    {report.summary.recommendations.map((recommendation, index) => (
                      <li key={index} className="text-sm text-gray-700 bg-yellow-50 p-3 rounded-md">
                        {renderHtmlContent(recommendation)}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Daily Entries */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily Standup Entries</h3>
            <div className="space-y-4">
              {report.entries.map((entry) => (
                <div key={entry.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-md font-medium text-gray-900">
                      {formatDate(entry.date)}
                    </h4>
                    <span className="text-sm text-gray-500">
                      {entry.teamMembers.length} team members
                    </span>
                  </div>
                  <div className="space-y-3">
                    {entry.teamMembers.map((member) => (
                      <div key={member.id} className="bg-gray-50 rounded-md p-3">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <User className="w-4 h-4 text-blue-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="font-medium text-gray-900">{member.name}</span>
                              <span className="text-sm text-gray-500">({member.role})</span>
                            </div>
                            {member.yesterday && (
                              <div className="mb-2">
                                <span className="text-sm font-medium text-gray-700">Yesterday:</span>
                                <div className="text-sm text-gray-600 mt-1">
                                  {renderHtmlContent(member.yesterday)}
                                </div>
                              </div>
                            )}
                            {member.today && (
                              <div className="mb-2">
                                <span className="text-sm font-medium text-gray-700">Today:</span>
                                <div className="text-sm text-gray-600 mt-1">
                                  {renderHtmlContent(member.today)}
                                </div>
                              </div>
                            )}
                            {member.blockers && (
                              <div>
                                <span className="text-sm font-medium text-gray-700">Blockers:</span>
                                <div className="text-sm text-gray-600 mt-1">
                                  {renderHtmlContent(member.blockers)}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
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
          <h2 className="text-2xl font-bold text-gray-900">Weekly Reports</h2>
          <p className="text-gray-600">Automatically generated standup summaries with AI insights</p>
        </div>
      </div>

      {/* Generation Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <FileText className="w-5 h-5 text-blue-600" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">Weekly Report Generation</h3>
            <p className="mt-1 text-sm text-blue-700">
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
      />
    </div>
  );
}
