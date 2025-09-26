
import { useState, useMemo, useEffect, useRef } from 'react';
import { Calendar, Users, CheckCircle, AlertTriangle, ChevronRight, ChevronDown, X } from 'lucide-react';
import { StandupEntry } from '../types';
import { Sheet } from './ui/sheet';
import { motion, AnimatePresence } from 'motion/react';

interface StandupHistoryProps {
  history: StandupEntry[];
  isOpen: boolean;
  onClose: () => void;
}

export default function StandupHistory({ history, isOpen, onClose }: StandupHistoryProps) {
  const [expandedEntry, setExpandedEntry] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  const toggleEntry = (entryId: string) => {
    setExpandedEntry(expandedEntry === entryId ? null : entryId);
  };

  // Get unique months from history
  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    history.forEach(entry => {
      const [year, month] = entry.date.split('-');
      months.add(`${year}-${month}`);
    });
    return Array.from(months).sort().reverse();
  }, [history]);

  // Filter history by selected month
  const filteredHistory = useMemo(() => {
    if (selectedMonth === 'all') return history;
    return history.filter(entry => entry.date.startsWith(selectedMonth));
  }, [history, selectedMonth]);

  // Get month display name
  const getMonthDisplayName = (monthKey: string) => {
    if (monthKey === 'all') return 'All Months';
    const [year, month] = monthKey.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
  };

  const formatDate = (dateString: string) => {
    // Parse the date string as Vancouver timezone to avoid timezone shifts
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day); // month is 0-indexed
    
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatCreationDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const customHeader = (
    <div className="flex items-center justify-between w-full">
      <div className="flex items-center gap-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Standup History</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">{filteredHistory.length} meetings</p>
        </div>
        
        {/* Month Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-2 px-3 py-2 bg-white/60 dark:bg-gray-800/60 hover:bg-white/80 dark:hover:bg-gray-700/80 rounded-lg border border-white/20 dark:border-gray-700/20 transition-all duration-200 text-sm"
          >
            <Calendar size={16} className="text-gray-600 dark:text-gray-400" />
            <span className="text-gray-900 dark:text-white">{getMonthDisplayName(selectedMonth)}</span>
            <motion.div
              animate={{ rotate: isDropdownOpen ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown size={16} className="text-gray-500 dark:text-gray-400" />
            </motion.div>
          </button>

          <AnimatePresence>
            {isDropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="absolute top-full left-0 mt-2 w-48 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-lg border border-white/20 dark:border-gray-700/20 shadow-lg z-20"
              >
                <div className="py-2">
                  <button
                    onClick={() => {
                      setSelectedMonth('all');
                      setIsDropdownOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-white/60 dark:hover:bg-gray-700/60 transition-colors ${
                      selectedMonth === 'all' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' : 'text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    All Months
                  </button>
                  {availableMonths.map((month) => (
                    <button
                      key={month}
                      onClick={() => {
                        setSelectedMonth(month);
                        setIsDropdownOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-white/60 dark:hover:bg-gray-700/60 transition-colors ${
                        selectedMonth === month ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' : 'text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {getMonthDisplayName(month)}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      
      <button
        onClick={onClose}
        className="p-2 hover:bg-white/60 dark:hover:bg-gray-800/60 rounded-lg transition-all duration-200 border border-white/20 dark:border-gray-700/20"
      >
        <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
      </button>
    </div>
  );

  return (
    <Sheet
      isOpen={isOpen}
      onClose={onClose}
      title="Standup History"
      description={`${filteredHistory.length} previous meetings`}
      customHeader={customHeader}
    >
      {filteredHistory.length === 0 ? (
        <div className="text-center text-gray-500 dark:text-gray-400 py-12">
          <Calendar size={48} className="text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <p>{selectedMonth === 'all' ? 'No previous standups yet' : 'No standups for this month'}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredHistory.map((entry) => (
            <div key={entry.id} className="bg-white/40 dark:bg-gray-800/40 backdrop-blur-sm rounded-xl border border-white/30 dark:border-gray-700/30">
              <button
                onClick={() => toggleEntry(entry.id)}
                className="w-full flex items-center justify-between p-4 hover:bg-white/40 dark:hover:bg-gray-800/40 rounded-xl transition-all duration-200 border border-transparent hover:border-white/20 dark:hover:border-gray-700/20"
              >
                <div className="flex items-center gap-3">
                  <motion.div
                    animate={{ rotate: expandedEntry === entry.id ? 90 : 0 }}
                    transition={{ duration: 0.2, ease: [0.4, 0.0, 0.2, 1] }}
                  >
                    <ChevronRight size={16} className="text-gray-500 dark:text-gray-400" />
                  </motion.div>
                  <div className="text-left">
                    <div className="flex items-center gap-2">
                      <Calendar size={16} className="text-blue-600 dark:text-blue-400" />
                      <p className="font-medium text-gray-900 dark:text-white">{formatDate(entry.date)}</p>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1">
                      <Users size={14} />
                      {entry.teamMembers.length} participants
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Users size={16} className="text-gray-500 dark:text-gray-400" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">{entry.teamMembers.length}</span>
                </div>
              </button>

              <AnimatePresence>
                {expandedEntry === entry.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ 
                      duration: 0.3, 
                      ease: [0.4, 0.0, 0.2, 1],
                      opacity: { duration: 0.2 }
                    }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4 space-y-4 mt-4">
                      {entry.teamMembers.map((member, index) => (
                        <motion.div
                          key={member.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ 
                            duration: 0.2, 
                            delay: index * 0.1,
                            ease: [0.4, 0.0, 0.2, 1]
                          }}
                          className="bg-white/60 dark:bg-gray-700/60 backdrop-blur-sm rounded-lg p-4 border border-white/40 dark:border-gray-600/40"
                        >
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-teal-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                              {member.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-900 dark:text-white">{member.name}</h4>
                              <p className="text-xs text-gray-600 dark:text-gray-400">{member.role}</p>
                            </div>
                          </div>

                          <div className="space-y-3 text-sm">
                            <div>
                              <div className="flex items-center gap-2 mb-2">
                                <CheckCircle size={14} className="text-green-500 dark:text-green-400" />
                                <span className="font-medium text-gray-700 dark:text-gray-300">Previous day:</span>
                              </div>
                              <div 
                                className="text-gray-600 dark:text-gray-400 pl-6 prose prose-sm max-w-none dark:prose-invert"
                                dangerouslySetInnerHTML={{ __html: member.yesterday || "No updates" }}
                              />
                            </div>
                            <div>
                              <div className="flex items-center gap-2 mb-2">
                                <CheckCircle size={14} className="text-blue-500 dark:text-blue-400" />
                                <span className="font-medium text-gray-700 dark:text-gray-300">Today:</span>
                              </div>
                              <div 
                                className="text-gray-600 dark:text-gray-400 pl-6 prose prose-sm max-w-none dark:prose-invert"
                                dangerouslySetInnerHTML={{ __html: member.today || "No plans" }}
                              />
                            </div>
                            <div>
                              <div className="flex items-center gap-2 mb-2">
                                <AlertTriangle size={14} className="text-orange-500 dark:text-orange-400" />
                                <span className="font-medium text-gray-700 dark:text-gray-300">Blockers:</span>
                              </div>
                              <div 
                                className="text-gray-600 dark:text-gray-400 pl-6 prose prose-sm max-w-none dark:prose-invert"
                                dangerouslySetInnerHTML={{ __html: member.blockers || "No blockers" }}
                              />
                            </div>
                            <div className="pt-2 border-t border-white/30 dark:border-gray-700/30">
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                Submitted {formatCreationDate(member.lastUpdated)}
                              </p>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      )}
    </Sheet>
  );
}