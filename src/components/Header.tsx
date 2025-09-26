import { motion } from 'motion/react';
import { Calendar, Sparkles, TrendingUp, BarChart3, Users2, MessageSquare } from 'lucide-react';
import { ColorSchemeToggle } from './ColorSchemeToggle';
import GradientButton from './kokonutui/gradient-button';

interface HeaderProps {
  today: string;
  teamMembersCount: number;
  yesterdayCount: number;
  teamEngagement: string;
  onAddMember: () => void;
  saving: boolean;
}

export default function Header({
  today,
  teamMembersCount,
  yesterdayCount,
  teamEngagement,
  onAddMember,
  saving
}: HeaderProps) {
  return (
    <div className="relative mb-4">
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-to-br from-violet-50 via-purple-50 to-fuchsia-50 dark:from-violet-950/20 dark:via-purple-950/10 dark:to-fuchsia-950/20 rounded-3xl blur-3xl" />
      
      {/* Main container */}
      <div className="relative bg-gradient-to-br from-white/90 via-white/70 to-white/50 dark:from-gray-900/90 dark:via-gray-900/70 dark:to-gray-900/50 backdrop-blur-2xl rounded-3xl border border-white/30 dark:border-gray-700/30 shadow-2xl overflow-hidden">
        
        {/* Hero section */}
        <div className="relative p-8 pb-6">
          {/* Floating particles background */}
          <div className="absolute inset-0 overflow-hidden">
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 bg-gradient-to-r from-violet-400 to-purple-400 rounded-full opacity-60"
                style={{
                  left: `${20 + i * 15}%`,
                  top: `${30 + (i % 2) * 20}%`,
                }}
                animate={{
                  y: [0, -20, 0],
                  opacity: [0.3, 0.8, 0.3],
                  scale: [1, 1.2, 1],
                }}
                transition={{
                  duration: 3 + i * 0.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: i * 0.3,
                }}
              />
            ))}
          </div>

          {/* Header content */}
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-6">
              {/* Modern logo */}
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 15 }}
                className="relative group"
              >
                <div className="relative w-20 h-20">
                  {/* Outer ring */}
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0 bg-gradient-to-r from-violet-400 via-purple-400 to-fuchsia-400 rounded-full opacity-20 blur-sm"
                  />
                  
                  {/* Main logo */}
                  <div className="relative w-20 h-20 bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-500 rounded-2xl flex items-center justify-center shadow-2xl group-hover:shadow-violet-500/25 transition-all duration-300">
                    <motion.div
                      animate={{ 
                        scale: [1, 1.1, 1],
                        rotate: [0, 5, -5, 0]
                      }}
                      transition={{ 
                        duration: 4, 
                        repeat: Infinity, 
                        ease: "easeInOut" 
                      }}
                    >
                      <MessageSquare className="text-white drop-shadow-lg" size={32} />
                    </motion.div>
                    
                    {/* Inner glow */}
                    <motion.div
                      animate={{ 
                        scale: [1, 1.2, 1],
                        opacity: [0.3, 0.6, 0.3]
                      }}
                      transition={{ 
                        duration: 2, 
                        repeat: Infinity, 
                        ease: "easeInOut" 
                      }}
                      className="absolute inset-2 border border-white/30 rounded-xl"
                    />
                  </div>
                  
                  {/* Floating elements */}
                  <motion.div
                    animate={{ 
                      y: [0, -8, 0],
                      rotate: [0, 180, 360]
                    }}
                    transition={{ 
                      duration: 3, 
                      repeat: Infinity, 
                      ease: "easeInOut" 
                    }}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-emerald-400 to-cyan-400 rounded-full flex items-center justify-center shadow-lg"
                  >
                    <Sparkles className="text-white" size={12} />
                  </motion.div>
                </div>
              </motion.div>
              
              {/* Title section */}
              <div>
                <motion.h1
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 }}
                  className="text-4xl font-bold bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 dark:from-violet-400 dark:via-purple-400 dark:to-fuchsia-400 bg-clip-text text-transparent mb-1"
                >
                  Huddle
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 }}
                  className="text-lg text-gray-600 dark:text-gray-400 font-medium"
                >
                  Smart team standups
                </motion.p>
              </div>
            </div>
            
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.8 }}
            >
              <ColorSchemeToggle />
            </motion.div>
          </div>
        </div>

        {/* Stats section */}
        <div className="px-8 pb-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.0 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-4"
          >
            {/* Today's Updates */}
            <motion.div
              whileHover={{ scale: 1.02, y: -2 }}
              className="group relative bg-gradient-to-br from-blue-50/60 to-blue-100/40 dark:from-blue-950/30 dark:to-blue-900/20 backdrop-blur-sm rounded-xl p-4 border border-blue-200/40 dark:border-blue-800/20 shadow-sm hover:shadow-md transition-all duration-300"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                  <BarChart3 size={20} className="text-white" />
                </div>
                <div>
                  <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold">Today</p>
                  <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{teamMembersCount}</p>
                </div>
              </div>
            </motion.div>

            {/* Yesterday's Updates */}
            <motion.div
              whileHover={{ scale: 1.02, y: -2 }}
              className="group relative bg-gradient-to-br from-emerald-50/60 to-emerald-100/40 dark:from-emerald-950/30 dark:to-emerald-900/20 backdrop-blur-sm rounded-xl p-4 border border-emerald-200/40 dark:border-emerald-800/20 shadow-sm hover:shadow-md transition-all duration-300"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                  <TrendingUp size={20} className="text-white" />
                </div>
                <div>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">Previous</p>
                  <p className="text-2xl font-bold text-emerald-900 dark:text-emerald-100">{yesterdayCount}</p>
                </div>
              </div>
            </motion.div>

            {/* Team Engagement */}
            <motion.div
              whileHover={{ scale: 1.02, y: -2 }}
              className="group relative bg-gradient-to-br from-purple-50/60 to-purple-100/40 dark:from-purple-950/30 dark:to-purple-900/20 backdrop-blur-sm rounded-xl p-4 border border-purple-200/40 dark:border-purple-800/20 shadow-sm hover:shadow-md transition-all duration-300"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Users2 size={20} className="text-white" />
                </div>
                <div>
                  <p className="text-xs text-purple-600 dark:text-purple-400 font-semibold">Engagement</p>
                  <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">{teamEngagement}</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>

        {/* Bottom section */}
        <div className="px-8 pb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2 }}
            className="flex items-center justify-between"
          >
            {/* Date and status */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3 bg-gradient-to-r from-gray-50/60 to-gray-100/40 dark:from-gray-800/60 dark:to-gray-700/40 backdrop-blur-sm rounded-xl px-4 py-3 border border-gray-200/40 dark:border-gray-700/30">
                <Calendar size={18} className="text-indigo-500" />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{today}</p>
                </div>
                <div className="flex items-center gap-2">
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    className="w-2 h-2 bg-emerald-400 rounded-full"
                  />
                  <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">Live</span>
                </div>
              </div>
            </div>

            {/* Action button */}
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <GradientButton
                label="Add Update"
                variant="emerald"
                className="px-6 py-3 text-base font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                onClick={onAddMember}
                disabled={saving}
              />
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
