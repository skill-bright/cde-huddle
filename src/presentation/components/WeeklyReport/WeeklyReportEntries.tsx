import { useState } from 'react';
import { motion } from 'motion/react';
import { Users, User } from 'lucide-react';

import { useDateUtils } from '@/presentation/hooks/useDateUtils';

import { WeeklyReport } from '@/domain/entities/WeeklyReport';

interface WeeklyReportEntriesProps {
  report: WeeklyReport;
}

/**
 * Daily entries component for weekly reports
 * Displays the daily standup entries with filtering by team member
 */
export function WeeklyReportEntries({ report }: WeeklyReportEntriesProps) {
  const [activeTab, setActiveTab] = useState<string>('all');
  const { formatDate } = useDateUtils();

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

  // Get unique team members from the report
  const getUniqueTeamMembers = () => {
    const memberMap = new Map<string, { name: string; role: string }>();
    
    report.entries.forEach(entry => {
      entry.teamMembers.forEach(member => {
        if (!memberMap.has(member.name)) {
          memberMap.set(member.name, {
            name: member.name,
            role: member.role
          });
        }
      });
    });
    
    return Array.from(memberMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  };

  // Get entries for a specific team member
  const getMemberEntries = (memberName: string) => {
    return report.entries.map(entry => ({
      ...entry,
      teamMembers: entry.teamMembers.filter(member => member.name === memberName)
    })).filter(entry => entry.teamMembers.length > 0);
  };

  const uniqueMembers = getUniqueTeamMembers();
  const filteredEntries = activeTab === 'all' ? report.entries : getMemberEntries(activeTab);

  return (
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
              All Members ({report.getUniqueMembers()})
            </div>
          </motion.button>
          {uniqueMembers.map((member) => (
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
        {filteredEntries.map((entry) => (
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
  );
}
