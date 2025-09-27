import { useState } from 'react';
import { motion } from 'motion/react';
import { Lightbulb, TrendingUp, Clock, AlertTriangle, Users, User, RefreshCw } from 'lucide-react';

import ParticleButton from '@/components/kokonutui/particle-button';
import { WeeklyReportSummary as WeeklyReportSummaryType } from '@/domain/value-objects/WeeklyReportSummary';

interface WeeklyReportSummaryProps {
  summary: WeeklyReportSummaryType;
  onRegenerate: () => void;
  regenerating: boolean;
}

/**
 * AI-generated summary component for weekly reports
 * Displays the summary with tabs for team overview and individual members
 */
export function WeeklyReportSummary({ summary, onRegenerate, regenerating }: WeeklyReportSummaryProps) {
  const [activeTab, setActiveTab] = useState<string>('all');

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

  // Get unique team members from the summary
  const getUniqueTeamMembers = () => {
    return Object.keys(summary.memberSummaries).sort();
  };

  return (
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
          onClick={onRegenerate}
          disabled={regenerating}
          className="px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl hover:from-orange-600 hover:to-red-600 transition-all duration-200 flex items-center gap-2 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {regenerating ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
          {regenerating ? "Regenerating..." : "Regenerate Summary"}
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
          {getUniqueTeamMembers().map((memberName) => (
            <motion.button
              key={memberName}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveTab(memberName)}
              className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm transition-all duration-200 ${
                activeTab === memberName
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-slate-600'
              }`}
            >
              <div className="flex items-center gap-2">
                <User className="w-4 h-4" />
                {memberName}
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
                {summary.keyAccomplishments && summary.keyAccomplishments.length > 0 ? (
                  summary.keyAccomplishments.map((accomplishment, index) => (
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
                {summary.ongoingWork && summary.ongoingWork.length > 0 ? (
                  summary.ongoingWork.map((work, index) => (
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
                {summary.blockers && summary.blockers.length > 0 ? (
                  summary.blockers.map((blocker, index) => (
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
                {summary.teamInsights ? renderHtmlContent(summary.teamInsights) : 'No team insights available'}
              </div>
            </div>
          </div>

          {/* Recommendations */}
          {summary.recommendations && summary.recommendations.length > 0 && (
            <div>
              <h4 className="text-md font-medium text-gray-900 dark:text-white mb-3 flex items-center">
                <Lightbulb className="w-4 h-4 text-yellow-600 dark:text-yellow-400 mr-2" />
                Recommendations
              </h4>
              <ul className="space-y-2">
                {summary.recommendations.map((recommendation, index) => (
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
            const memberSummary = summary.memberSummaries[activeTab];
            if (!memberSummary) {
              return (
                <div className="text-center py-8">
                  <User className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No individual summary available</h4>
                  <p className="text-gray-500 dark:text-gray-400">AI summary for {activeTab} is not available.</p>
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
  );
}
