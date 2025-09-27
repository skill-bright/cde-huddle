import { motion } from 'motion/react';
import { FileText, Users, Calendar } from 'lucide-react';

import { WeeklyReport } from '@/domain/entities/WeeklyReport';

/**
 * Ensure the report is a proper WeeklyReport domain entity
 * If it's a plain object, recreate it as a domain entity
 */
function ensureWeeklyReportEntity(report: WeeklyReport | Record<string, unknown>): WeeklyReport {
  // If it already has the methods, return as is
  if (report && typeof (report as WeeklyReport).getTotalUpdates === 'function' && typeof (report as WeeklyReport).getUniqueMembers === 'function') {
    return report as WeeklyReport;
  }
  
  // If it's a plain object, recreate it as a domain entity
  if (report && (report as Record<string, unknown>).weekStart && (report as Record<string, unknown>).weekEnd && (report as Record<string, unknown>).entries && (report as Record<string, unknown>).summary) {
    return WeeklyReport.fromJSON(report as Record<string, unknown>);
  }
  
  throw new Error('Invalid report object provided');
}

interface WeeklyReportStatsProps {
  report: WeeklyReport;
}

/**
 * Statistics component for weekly reports
 * Displays key metrics about the report
 */
export function WeeklyReportStats({ report }: WeeklyReportStatsProps) {
  if (!report) {
    return <div>No report available</div>;
  }
  
  // Ensure the report is a proper domain entity
  const weeklyReport = ensureWeeklyReportEntity(report);
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm rounded-2xl border border-white/20 dark:border-slate-700/20 p-6 shadow-lg"
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            Week of {weeklyReport.weekStart} - {weeklyReport.weekEnd}
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
              <p className="text-2xl font-bold text-blue-900 dark:text-blue-300">{weeklyReport.getTotalUpdates()}</p>
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
              <p className="text-2xl font-bold text-green-900 dark:text-green-300">{weeklyReport.getUniqueMembers()}</p>
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
              <p className="text-2xl font-bold text-purple-900 dark:text-purple-300">{weeklyReport.entries.length}</p>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
