import React, { useState } from 'react';
import { WeeklyReport as WeeklyReportType, WeeklyReportFilters, StoredWeeklyReport } from '../types';
import { Calendar, FileText, Users, TrendingUp, AlertTriangle, Lightbulb, Download, Settings, User, Clock } from 'lucide-react';
import { StoredWeeklyReports } from './StoredWeeklyReports';

interface WeeklyReportProps {
  report: WeeklyReportType | null;
  loading: boolean;
  error: string | null;
  getPreviousWeekDates: () => { weekStart: string; weekEnd: string };
  storedReports: StoredWeeklyReport[];
  storedReportsLoading: boolean;
  onViewStoredReport: (report: StoredWeeklyReport) => void;
}

export function WeeklyReport({ 
  report, 
  loading, 
  error, 
  getPreviousWeekDates,
  storedReports,
  storedReportsLoading,
  onViewStoredReport
}: WeeklyReportProps) {
  const [showFilters, setShowFilters] = useState(false);
  const [activeTab, setActiveTab] = useState<'generate' | 'stored'>('generate');
  const [filters, setFilters] = useState<WeeklyReportFilters>({
    includeAI: true,
    weekStart: getPreviousWeekDates().weekStart,
    weekEnd: getPreviousWeekDates().weekEnd
  });



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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Weekly Reports</h2>
          <p className="text-gray-600">Automatically generated standup summaries with AI insights</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('generate')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'generate'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Report Info
            </div>
          </button>
          <button
            onClick={() => setActiveTab('stored')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'stored'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Stored Reports
            </div>
          </button>
        </nav>
      </div>

      {/* Generate Report Tab */}
      {activeTab === 'generate' && (
        <>
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">Automatic Report Generation</h3>
                <p className="mt-1 text-sm text-blue-700">
                  Weekly reports are automatically generated every Friday at 12:00 PM PST. 
                  Manual generation is not available. Check the "Stored Reports" tab to view 
                  previously generated reports.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end space-x-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Settings className="w-4 h-4" />
              <span>Report Settings</span>
            </button>
          </div>

      {/* Filters */}
      {showFilters && (
        <div className="bg-white p-6 rounded-lg border border-gray-200 space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Report Settings</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Week Start</label>
              <input
                type="date"
                value={filters.weekStart || ''}
                onChange={(e) => setFilters({ ...filters, weekStart: e.target.value })}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Week End</label>
              <input
                type="date"
                value={filters.weekEnd || ''}
                onChange={(e) => setFilters({ ...filters, weekEnd: e.target.value })}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="includeAI"
                checked={filters.includeAI}
                onChange={(e) => setFilters({ ...filters, includeAI: e.target.checked })}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="includeAI" className="ml-2 block text-sm text-gray-900">
                Include AI Analysis
              </label>
            </div>
          </div>
          {filters.includeAI && (
            <div>
              <label className="block text-sm font-medium text-gray-700">Custom AI Prompt (Optional)</label>
              <textarea
                value={filters.customPrompt || ''}
                onChange={(e) => setFilters({ ...filters, customPrompt: e.target.value })}
                placeholder="Add a custom prompt to guide the AI analysis..."
                rows={3}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          )}
        </div>
      )}

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
      {report && (
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
              <button
                onClick={exportToCSV}
                className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                <Download className="w-4 h-4" />
                <span>Export CSV</span>
              </button>
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
                    <TrendingUp className="w-4 h-4 text-green-500 mr-2" />
                    Key Accomplishments
                  </h4>
                  {report.summary.keyAccomplishments.length > 0 ? (
                    <ul className="space-y-2">
                      {report.summary.keyAccomplishments.map((accomplishment, index) => (
                        <li key={index} className="text-sm text-gray-700 bg-green-50 p-3 rounded-md">
                          {accomplishment}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-gray-500 italic">No accomplishments recorded</p>
                  )}
                </div>

                {/* Ongoing Work */}
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-3 flex items-center">
                    <FileText className="w-4 h-4 text-blue-500 mr-2" />
                    Ongoing Work
                  </h4>
                  {report.summary.ongoingWork.length > 0 ? (
                    <ul className="space-y-2">
                      {report.summary.ongoingWork.map((work, index) => (
                        <li key={index} className="text-sm text-gray-700 bg-blue-50 p-3 rounded-md">
                          {work}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-gray-500 italic">No ongoing work recorded</p>
                  )}
                </div>

                {/* Blockers */}
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-3 flex items-center">
                    <AlertTriangle className="w-4 h-4 text-red-500 mr-2" />
                    Blockers & Challenges
                  </h4>
                  {report.summary.blockers.length > 0 ? (
                    <ul className="space-y-2">
                      {report.summary.blockers.map((blocker, index) => (
                        <li key={index} className="text-sm text-gray-700 bg-red-50 p-3 rounded-md">
                          {blocker}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-gray-500 italic">No blockers recorded</p>
                  )}
                </div>

                {/* Recommendations */}
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-3 flex items-center">
                    <Lightbulb className="w-4 h-4 text-yellow-500 mr-2" />
                    Recommendations
                  </h4>
                  {report.summary.recommendations.length > 0 ? (
                    <ul className="space-y-2">
                      {report.summary.recommendations.map((recommendation, index) => (
                        <li key={index} className="text-sm text-gray-700 bg-yellow-50 p-3 rounded-md">
                          {recommendation}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-gray-500 italic">No recommendations generated</p>
                  )}
                </div>
              </div>

              {/* Team Insights */}
              {report.summary.teamInsights && (
                <div className="mt-6">
                  <h4 className="text-md font-medium text-gray-900 mb-3">Team Insights</h4>
                  <div className="bg-gray-50 p-4 rounded-md">
                    <p className="text-sm text-gray-700">{report.summary.teamInsights}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Member Summaries */}
          {report.summary.memberSummaries && Object.keys(report.summary.memberSummaries).length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <User className="w-5 h-5 text-blue-500 mr-2" />
                Individual Member Summaries
              </h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {Object.entries(report.summary.memberSummaries).map(([memberName, summary]) => (
                  <div key={memberName} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">{memberName}</h4>
                        <p className="text-sm text-gray-500">{summary.role}</p>
                      </div>
                    </div>
                    
                    {/* Key Contributions */}
                    {summary.keyContributions.length > 0 && (
                      <div className="mb-3">
                        <h5 className="text-sm font-medium text-gray-700 mb-2">Key Contributions</h5>
                        <ul className="space-y-1">
                          {summary.keyContributions.map((contribution, index) => (
                            <li key={index} className="text-sm text-gray-600 bg-green-50 p-2 rounded">
                              {contribution}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Progress */}
                    {summary.progress && (
                      <div className="mb-3">
                        <h5 className="text-sm font-medium text-gray-700 mb-2">Progress</h5>
                        <p className="text-sm text-gray-600 bg-blue-50 p-2 rounded">
                          {summary.progress}
                        </p>
                      </div>
                    )}

                    {/* Concerns */}
                    {summary.concerns.length > 0 && (
                      <div className="mb-3">
                        <h5 className="text-sm font-medium text-gray-700 mb-2">Concerns</h5>
                        <ul className="space-y-1">
                          {summary.concerns.map((concern, index) => (
                            <li key={index} className="text-sm text-gray-600 bg-red-50 p-2 rounded">
                              {concern}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Next Week Focus */}
                    {summary.nextWeekFocus && (
                      <div>
                        <h5 className="text-sm font-medium text-gray-700 mb-2">Next Week Focus</h5>
                        <p className="text-sm text-gray-600 bg-purple-50 p-2 rounded">
                          {summary.nextWeekFocus}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Daily Breakdown */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily Breakdown</h3>
            <div className="space-y-4">
              {report.entries.map((entry) => (
                <div key={entry.id} className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3">
                    {formatDate(entry.date)} ({entry.teamMembers.length} updates)
                  </h4>
                  <div className="space-y-3">
                    {entry.teamMembers.map((member) => (
                      <div key={member.id} className="bg-gray-50 p-3 rounded-md">
                        <div className="flex items-start space-x-3">
                          <div className="flex-shrink-0">
                            {member.avatar ? (
                              <img
                                src={member.avatar}
                                alt={member.name}
                                className="w-8 h-8 rounded-full"
                              />
                            ) : (
                              <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                                <span className="text-xs font-medium text-gray-600">
                                  {member.name.charAt(0)}
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900">{member.name}</p>
                            <p className="text-xs text-gray-500">{member.role}</p>
                            {member.yesterday && (
                              <p className="text-sm text-gray-700 mt-1">
                                <span className="font-medium">Yesterday:</span> {member.yesterday}
                              </p>
                            )}
                            {member.today && (
                              <p className="text-sm text-gray-700">
                                <span className="font-medium">Today:</span> {member.today}
                              </p>
                            )}
                            {member.blockers && (
                              <p className="text-sm text-red-700 mt-1">
                                <span className="font-medium">Blockers:</span> {member.blockers}
                              </p>
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
      )}

              {/* Empty State */}
        {!report && !loading && !error && (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <FileText className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No current report</h3>
            <p className="mt-1 text-sm text-gray-500">
              Weekly reports are automatically generated every Friday at 12:00 PM PST. 
              Check the "Stored Reports" tab to view previously generated reports.
            </p>
            <div className="mt-6">
              <button
                onClick={() => setActiveTab('stored')}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                View Stored Reports
              </button>
            </div>
          </div>
        )}
        </>
      )}

      {/* Stored Reports Tab */}
      {activeTab === 'stored' && (
        <StoredWeeklyReports
          reports={storedReports}
          loading={storedReportsLoading}
          onViewReport={onViewStoredReport}
        />
      )}
    </div>
  );
}
