import { WeeklyReport as WeeklyReportType, StoredWeeklyReport, TeamMember } from '../types';
import { Calendar, FileText, Users, TrendingUp, AlertTriangle, Lightbulb, Download, User, Clock, ArrowLeft, RefreshCw } from 'lucide-react';
import { StoredWeeklyReports } from './StoredWeeklyReports';
import { useState } from 'react';
import { regenerateWeeklySummary } from '../utils/aiUtils';
import ParticleButton from './kokonutui/particle-button';
import { motion } from 'motion/react';

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
      className="prose prose-sm max-w-none text-gray-700 dark:text-gray-200 prose-strong:text-blue-600 dark:prose-strong:text-blue-400"
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
  onGenerateReportManually?: () => Promise<void>;
  toGenerateReportManually?: boolean; 
  generatingReport?: boolean;
}

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
  const [activeTab, setActiveTab] = useState<string>('all');
  const [regeneratingSummary, setRegeneratingSummary] = useState<boolean>(false);

  // Get unique team members from the report
  const getUniqueTeamMembers = (report: WeeklyReportType): TeamMember[] => {
    const memberMap = new Map<string, TeamMember>();
    
    report.entries.forEach(entry => {
      entry.teamMembers.forEach(member => {
        // Use name as the key to ensure we don't get duplicates with same name but different IDs
        if (!memberMap.has(member.name)) {
          memberMap.set(member.name, member);
        }
      });
    });
    
    return Array.from(memberMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  };

  // Get entries for a specific team member
  const getMemberEntries = (report: WeeklyReportType, memberName: string) => {
    return report.entries.map(entry => ({
      ...entry,
      teamMembers: entry.teamMembers.filter(member => member.name === memberName)
    })).filter(entry => entry.teamMembers.length > 0);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleRegenerateSummary = async () => {
    if (!report) return;
    
    try {
      setRegeneratingSummary(true);
      console.log('🔄 Regenerating AI summary for report:', report.weekStart, 'to', report.weekEnd);
      
      const newSummary = await regenerateWeeklySummary(report);
      
      // Update the report with the new summary
      const updatedReport = {
        ...report,
        summary: newSummary
      };
      
      setWeeklyReport(updatedReport);
      console.log('✅ Successfully regenerated and updated AI summary');
      
    } catch (error) {
      console.error('❌ Failed to regenerate AI summary:', error);
      // You could add a toast notification here
    } finally {
      setRegeneratingSummary(false);
    }
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
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div className="flex items-center gap-4">
            <ParticleButton
              onClick={() => {
                setWeeklyReport(null);
                // Clear the URL query parameter to prevent re-triggering the report
                const url = new URL(window.location.href);
                url.searchParams.delete('report');
                window.history.replaceState({}, '', url.toString());
              }}
              className="px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl hover:from-orange-600 hover:to-red-600 transition-all duration-200 flex items-center gap-2 shadow-lg hover:shadow-xl"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Reports
            </ParticleButton>
            <div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-purple-900 dark:from-white dark:via-blue-100 dark:to-purple-100 bg-clip-text text-transparent">Weekly Report</h2>
              <p className="text-gray-600 dark:text-gray-400">Week of {formatDate(report.weekStart)} - {formatDate(report.weekEnd)}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {toGenerateReportManually && (
              <ParticleButton
                onClick={onGenerateReportManually}
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
              onClick={exportToCSV}
              className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-green-500 text-white rounded-xl hover:from-emerald-600 hover:to-green-600 transition-all duration-200 flex items-center gap-2 shadow-lg hover:shadow-xl"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </ParticleButton>
          </div>
        </motion.div>

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
          {/* Report Header */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm rounded-2xl border border-white/20 dark:border-slate-700/20 p-6 shadow-lg"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Week of {formatDate(report.weekStart)} - {formatDate(report.weekEnd)}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">Generated on {new Date().toLocaleDateString()}</p>
              </div>
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <motion.div 
                whileHover={{ scale: 1.05, y: -5 }}
                className="bg-blue-50/80 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-200/50 dark:border-blue-700/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300"
              >
                <div className="flex items-center">
                  <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Total Updates</p>
                    <p className="text-2xl font-bold text-blue-900 dark:text-blue-300">{report.totalUpdates}</p>
                  </div>
                </div>
              </motion.div>
              <motion.div 
                whileHover={{ scale: 1.05, y: -5 }}
                className="bg-green-50/80 dark:bg-green-900/20 p-4 rounded-xl border border-green-200/50 dark:border-green-700/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300"
              >
                <div className="flex items-center">
                  <Users className="w-5 h-5 text-green-600 dark:text-green-400" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-green-600 dark:text-green-400">Active Members</p>
                    <p className="text-2xl font-bold text-green-900 dark:text-green-300">{report.uniqueMembers}</p>
                  </div>
                </div>
              </motion.div>
              <motion.div 
                whileHover={{ scale: 1.05, y: -5 }}
                className="bg-purple-50/80 dark:bg-purple-900/20 p-4 rounded-xl border border-purple-200/50 dark:border-purple-700/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300"
              >
                <div className="flex items-center">
                  <Calendar className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-purple-600 dark:text-purple-400">Days with Data</p>
                    <p className="text-2xl font-bold text-purple-900 dark:text-purple-300">{report.entries.length}</p>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>

          {/* AI Summary with Tabs */}
          {report.summary && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm rounded-2xl border border-white/20 dark:border-slate-700/20 p-6 shadow-lg"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                  <Lightbulb className="w-5 h-5 text-yellow-500 dark:text-yellow-400 mr-2" />
                  AI-Generated Summary
                </h3>
                <ParticleButton
                  onClick={handleRegenerateSummary}
                  disabled={regeneratingSummary}
                  className="px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl hover:from-orange-600 hover:to-red-600 transition-all duration-200 flex items-center gap-2 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {regeneratingSummary ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <RefreshCw className="w-4 h-4" />
                  )}
                  {regeneratingSummary ? "Regenerating..." : "Regenerate Summary"}
                </ParticleButton>
              </div>

              {/* Summary Tabs */}
              <div className="border-b border-white/20 dark:border-slate-700/20 mb-6">
                <nav className="-mb-px flex space-x-8 overflow-x-auto">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setActiveTab('all')}
                    className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm transition-all duration-200 ${
                      activeTab === 'all'
                        ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                        : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Team Overview
                    </div>
                  </motion.button>
                  {getUniqueTeamMembers(report).map((member) => (
                    <motion.button
                      key={member.name}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setActiveTab(member.name)}
                      className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm transition-all duration-200 ${
                        activeTab === member.name
                          ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                          : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-slate-600'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        {member.name}
                      </div>
                    </motion.button>
                  ))}
                </nav>
              </div>

              {/* Summary Content */}
              {activeTab === 'all' ? (
                // Team Overview Tab
                <div className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Key Accomplishments */}
                    <div>
                      <h4 className="text-md font-medium text-gray-900 dark:text-white mb-3 flex items-center">
                        <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400 mr-2" />
                        Key Accomplishments
                      </h4>
                      <ul className="space-y-2">
                        {report.summary.keyAccomplishments && report.summary.keyAccomplishments.length > 0 ? (
                          report.summary.keyAccomplishments.map((accomplishment, index) => (
                            <li key={index} className="text-sm text-gray-700 dark:text-green-900 bg-green-50/80 dark:bg-green-100/20 p-3 rounded-lg border border-green-200/50 dark:border-green-300/50 backdrop-blur-sm">
                              {renderHtmlContent(accomplishment)}
                            </li>
                          ))
                        ) : (
                          <li className="text-sm text-gray-500 dark:text-gray-400 italic">No accomplishments recorded</li>
                        )}
                      </ul>
                    </div>

                    {/* Ongoing Work */}
                    <div>
                      <h4 className="text-md font-medium text-gray-900 dark:text-white mb-3 flex items-center">
                        <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400 mr-2" />
                        Ongoing Work
                      </h4>
                      <ul className="space-y-2">
                        {report.summary.ongoingWork && report.summary.ongoingWork.length > 0 ? (
                          report.summary.ongoingWork.map((work, index) => (
                            <li key={index} className="text-sm text-gray-700 dark:text-blue-900 bg-blue-50/80 dark:bg-blue-100/20 p-3 rounded-lg border border-blue-200/50 dark:border-blue-300/50 backdrop-blur-sm">
                              {renderHtmlContent(work)}
                            </li>
                          ))
                        ) : (
                          <li className="text-sm text-gray-500 dark:text-gray-400 italic">No ongoing work recorded</li>
                        )}
                      </ul>
                    </div>

                    {/* Blockers */}
                    <div>
                      <h4 className="text-md font-medium text-gray-900 dark:text-white mb-3 flex items-center">
                        <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400 mr-2" />
                        Blockers & Issues
                      </h4>
                      <ul className="space-y-2">
                        {report.summary.blockers && report.summary.blockers.length > 0 ? (
                          report.summary.blockers.map((blocker, index) => (
                            <li key={index} className="text-sm text-gray-700 dark:text-red-900 bg-red-50/80 dark:bg-red-100/20 p-3 rounded-lg border border-red-200/50 dark:border-red-300/50 backdrop-blur-sm">
                              {renderHtmlContent(blocker)}
                            </li>
                          ))
                        ) : (
                          <li className="text-sm text-gray-500 dark:text-gray-400 italic">No blockers recorded</li>
                        )}
                      </ul>
                    </div>

                    {/* Team Insights */}
                    <div>
                      <h4 className="text-md font-medium text-gray-900 dark:text-white mb-3 flex items-center">
                        <Users className="w-4 h-4 text-purple-600 dark:text-purple-400 mr-2" />
                        Team Insights
                      </h4>
                      <div className="text-sm text-gray-700 dark:text-purple-900 bg-purple-50/80 dark:bg-purple-100/20 p-3 rounded-lg border border-purple-200/50 dark:border-purple-300/50 backdrop-blur-sm">
                        {report.summary.teamInsights ? renderHtmlContent(report.summary.teamInsights) : 'No team insights available'}
                      </div>
                    </div>
                  </div>

                  {/* Recommendations */}
                  {report.summary.recommendations && report.summary.recommendations.length > 0 && (
                    <div>
                      <h4 className="text-md font-medium text-gray-900 dark:text-white mb-3 flex items-center">
                        <Lightbulb className="w-4 h-4 text-yellow-600 dark:text-yellow-400 mr-2" />
                        Recommendations
                      </h4>
                      <ul className="space-y-2">
                        {report.summary.recommendations.map((recommendation, index) => (
                          <li key={index} className="text-sm text-gray-700 dark:text-yellow-900 bg-yellow-50/80 dark:bg-yellow-100/20 p-3 rounded-lg border border-yellow-200/50 dark:border-yellow-300/50 backdrop-blur-sm">
                            {renderHtmlContent(recommendation)}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                // Individual Member Summary Tab
                <div className="space-y-6">
                  {(() => {
                    const memberSummary = report.summary.memberSummaries?.[activeTab];
                    if (!memberSummary) {
                      return (
                        <div className="text-center py-8">
                          <User className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                          <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No individual summary available</h4>
                          <p className="text-gray-500 dark:text-gray-400">AI summary for {activeTab} is not available.</p>
                          <div className="mt-4 text-xs text-gray-400 dark:text-gray-500">
                            <p>Available member summaries: {Object.keys(report.summary.memberSummaries || {}).join(', ')}</p>
                            <p>Looking for: {activeTab}</p>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <>
                        {/* Member Role */}
                        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                          <h4 className="text-md font-medium text-blue-900 dark:text-blue-100 mb-2">Role</h4>
                          <p className="text-blue-800 dark:text-blue-200">{memberSummary.role}</p>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          {/* Key Contributions */}
                          <div>
                            <h4 className="text-md font-medium text-gray-900 dark:text-white mb-3 flex items-center">
                              <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400 mr-2" />
                              Key Contributions
                            </h4>
                            <ul className="space-y-2">
                              {memberSummary.keyContributions && memberSummary.keyContributions.length > 0 ? (
                                memberSummary.keyContributions.map((contribution, index) => (
                                  <li key={index} className="text-sm text-gray-700 dark:text-green-900 bg-green-50 dark:bg-green-100/20 p-3 rounded-md">
                                    {renderHtmlContent(contribution)}
                                  </li>
                                ))
                              ) : (
                                <li className="text-sm text-gray-500 dark:text-gray-400 italic">No contributions recorded</li>
                              )}
                            </ul>
                          </div>

                          {/* Progress */}
                          <div>
                            <h4 className="text-md font-medium text-gray-900 dark:text-white mb-3 flex items-center">
                              <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400 mr-2" />
                              Progress
                            </h4>
                            <div className="text-sm text-gray-700 dark:text-blue-900 bg-blue-50 dark:bg-blue-100/20 p-3 rounded-md">
                              {memberSummary.progress ? renderHtmlContent(memberSummary.progress) : 'No progress information available'}
                            </div>
                          </div>

                          {/* Concerns */}
                          <div>
                            <h4 className="text-md font-medium text-gray-900 dark:text-white mb-3 flex items-center">
                              <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400 mr-2" />
                              Concerns
                            </h4>
                            <ul className="space-y-2">
                              {memberSummary.concerns && memberSummary.concerns.length > 0 ? (
                                memberSummary.concerns.map((concern, index) => (
                                  <li key={index} className="text-sm text-gray-700 dark:text-red-900 bg-red-50 dark:bg-red-100/20 p-3 rounded-md">
                                    {renderHtmlContent(concern)}
                                  </li>
                                ))
                              ) : (
                                <li className="text-sm text-gray-500 dark:text-gray-400 italic">No concerns recorded</li>
                              )}
                            </ul>
                          </div>

                          {/* Next Week Focus */}
                          <div>
                            <h4 className="text-md font-medium text-gray-900 dark:text-white mb-3 flex items-center">
                              <Lightbulb className="w-4 h-4 text-yellow-600 dark:text-yellow-400 mr-2" />
                              Next Week Focus
                            </h4>
                            <div className="text-sm text-gray-700 dark:text-yellow-900 bg-yellow-50 dark:bg-yellow-100/20 p-3 rounded-md">
                              {memberSummary.nextWeekFocus ? renderHtmlContent(memberSummary.nextWeekFocus) : 'No focus areas defined'}
                            </div>
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </div>
              )}
            </motion.div>
          )}

          {/* Daily Entries with Tabs */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm rounded-2xl border border-white/20 dark:border-slate-700/20 p-6 shadow-lg"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Daily Standup Entries</h3>
            </div>

            {/* Tabs */}
            <div className="border-b border-white/20 dark:border-slate-700/20 mb-6">
              <nav className="-mb-px flex space-x-8 overflow-x-auto">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setActiveTab('all')}
                  className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm transition-all duration-200 ${
                    activeTab === 'all'
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    All Members ({report.uniqueMembers})
                  </div>
                </motion.button>
                {getUniqueTeamMembers(report).map((member) => (
                  <motion.button
                    key={member.name}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setActiveTab(member.name)}
                    className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm transition-all duration-200 ${
                      activeTab === member.name
                        ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                        : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      {member.name}
                    </div>
                  </motion.button>
                ))}
              </nav>
            </div>

            {/* Tab Content */}
            <div className="space-y-4">
              {(activeTab === 'all' ? report.entries : getMemberEntries(report, activeTab)).map((entry) => (
                <motion.div 
                  key={entry.id} 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="border border-white/20 dark:border-slate-700/20 rounded-xl p-4 bg-white/40 dark:bg-slate-800/40 backdrop-blur-sm hover:shadow-lg transition-all duration-300"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-md font-medium text-gray-900 dark:text-white">
                      {formatDate(entry.date)}
                    </h4>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {entry.teamMembers.length} team member{entry.teamMembers.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="space-y-3">
                    {entry.teamMembers.map((member) => (
                      <div key={member.id} className="bg-white/60 dark:bg-slate-700/60 rounded-lg p-3 border border-white/30 dark:border-slate-600/30 backdrop-blur-sm">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 bg-blue-100/80 dark:bg-blue-900/30 rounded-full flex items-center justify-center flex-shrink-0 border border-blue-200/50 dark:border-blue-700/50">
                            <User className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="font-medium text-gray-900 dark:text-white">{member.name}</span>
                              <span className="text-sm text-gray-500 dark:text-gray-400">({member.role})</span>
                            </div>
                            {member.yesterday && (
                              <div className="mb-2">
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Yesterday:</span>
                                <div className="text-sm text-gray-600 dark:text-gray-200 mt-1">
                                  {renderHtmlContent(member.yesterday)}
                                </div>
                              </div>
                            )}
                            {member.today && (
                              <div className="mb-2">
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Today:</span>
                                <div className="text-sm text-gray-600 dark:text-gray-200 mt-1">
                                  {renderHtmlContent(member.today)}
                                </div>
                              </div>
                            )}
                            {member.blockers && (
                              <div>
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Blockers:</span>
                                <div className="text-sm text-gray-600 dark:text-gray-200 mt-1">
                                  {renderHtmlContent(member.blockers)}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
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
          <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">Weekly Reports</h2>
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
