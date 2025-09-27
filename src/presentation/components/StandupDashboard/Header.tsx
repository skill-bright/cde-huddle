import { motion } from 'motion/react';
import { Plus } from 'lucide-react';

import ParticleButton from '@/components/kokonutui/particle-button';

interface HeaderProps {
  today: string;
  teamMembersCount: number;
  yesterdayCount: number;
  teamEngagement: string;
  onAddMember: () => void;
  saving: boolean;
}

/**
 * Header component for the standup dashboard
 * Displays key metrics and the add member button
 */
export function Header({
  today,
  teamMembersCount,
  yesterdayCount,
  teamEngagement,
  onAddMember,
  saving
}: HeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="mb-12"
    >
      <div className="flex items-center gap-4 mb-6">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="w-16 h-16 bg-gradient-to-br from-blue-400 to-purple-500 rounded-2xl flex items-center justify-center shadow-lg"
        >
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </motion.div>
        <div>
          <motion.h1
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-purple-900 dark:from-white dark:via-blue-100 dark:to-purple-100 bg-clip-text text-transparent"
          >
            Standup Dashboard
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="text-gray-600 dark:text-gray-400"
          >
            {today}
          </motion.p>
        </div>
      </div>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm rounded-xl p-4 border border-white/20 dark:border-gray-700/20 shadow-lg"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{teamMembersCount}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Today's Updates</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">{yesterdayCount}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Yesterday's Updates</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{teamEngagement}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Team Engagement</div>
            </div>
          </div>
          <ParticleButton
            onClick={onAddMember}
            disabled={saving}
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl hover:from-blue-600 hover:to-purple-600 transition-all duration-200 flex items-center gap-2 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus size={20} />
            {saving ? 'Saving...' : 'Add Update'}
          </ParticleButton>
        </div>
      </motion.div>
    </motion.div>
  );
}
