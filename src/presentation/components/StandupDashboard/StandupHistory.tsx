import { motion, AnimatePresence } from 'motion/react';
import { X, Calendar, Users } from 'lucide-react';

import { useDateUtils } from '@/presentation/hooks/useDateUtils';

import { StandupEntry } from '@/domain/entities/StandupEntry';

interface StandupHistoryProps {
  history: StandupEntry[];
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Standup history component
 * Displays historical standup entries in a collapsible panel
 */
export function StandupHistory({ history, isOpen, onClose }: StandupHistoryProps) {
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

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="mb-8 bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm rounded-2xl border border-white/20 dark:border-gray-700/20 shadow-lg overflow-hidden"
        >
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                Standup History
              </h3>
              <button
                onClick={onClose}
                className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {history.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No history available</h4>
                <p className="text-gray-500 dark:text-gray-400">Standup history will appear here once team members start providing updates.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {history.map((entry, index) => (
                  <motion.div
                    key={entry.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-white/40 dark:bg-slate-800/40 rounded-xl p-4 border border-white/30 dark:border-slate-600/30 backdrop-blur-sm"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                        {formatDate(entry.date)}
                      </h4>
                      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                        <Users size={16} />
                        {entry.teamMembers.length} member{entry.teamMembers.length !== 1 ? 's' : ''}
                      </div>
                    </div>

                    <div className="space-y-3">
                      {entry.teamMembers.map((member) => (
                        <div key={member.id} className="bg-white/60 dark:bg-slate-700/60 rounded-lg p-3 border border-white/30 dark:border-slate-600/30 backdrop-blur-sm">
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 bg-blue-100/80 dark:bg-blue-900/30 rounded-full flex items-center justify-center flex-shrink-0 border border-blue-200/50 dark:border-blue-700/50">
                              <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
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
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
