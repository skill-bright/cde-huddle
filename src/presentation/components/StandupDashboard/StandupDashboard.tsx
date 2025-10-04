import { useState, useCallback, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Plus, Users, History, ChevronRight, FileText, MessageSquare, Calendar, TrendingUp, BarChart3 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

import { useStandupData } from '@/presentation/hooks/useStandupData';
import { useDateUtils } from '@/presentation/hooks/useDateUtils';

import { TeamMember } from '@/domain/entities/TeamMember';
import { WeeklyReport as WeeklyReportEntity } from '@/domain/entities/WeeklyReport';
import { StoredWeeklyReport } from '@/domain/repositories/StandupRepository';
import { LightRaysContainer } from '@/components/bits/light-ray';
import ParticleButton from '@/components/kokonutui/particle-button';
import GradientButton from '@/components/kokonutui/gradient-button';
import { WeeklyReport } from '@/presentation/components/WeeklyReport/WeeklyReport';
import { TeamMemberCard } from './TeamMemberCard';
import { AddUpdateModal } from './AddUpdateModal';
import { StandupHistory } from './StandupHistory';

interface StandupDashboardProps {
  initialTab?: 'daily' | 'weekly';
}

/**
 * Main dashboard component
 * Orchestrates the display of daily standup and weekly reports
 */
export default function StandupDashboard({ initialTab = 'daily' }: StandupDashboardProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { getTodayFormatted } = useDateUtils();

  const {
    teamMembers,
    standupHistory,
    yesterdayCount,
    teamEngagement,
    loading,
    error,
    saveMember,
    refreshData,
    weeklyReport,
    weeklyReportLoading,
    weeklyReportError,
    setWeeklyReport,
    generateCurrentWeekReportManually,
    getPreviousWeekDates,
    storedWeeklyReports,
    storedReportsLoading,
  } = useStandupData();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | undefined>();
  const [showHistory, setShowHistory] = useState(false);
  const [saving, setSaving] = useState(false);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [activeTab, setActiveTab] = useState<'daily' | 'weekly'>(initialTab);

  // Handle URL changes and sync with active tab
  useEffect(() => {
    if (location.pathname === '/weekly-reports' && activeTab !== 'weekly') {
      setActiveTab('weekly');
    } else if (location.pathname === '/' && activeTab !== 'daily') {
      setActiveTab('daily');
    }
  }, [location.pathname, activeTab]);

  // Handle loading reports from URL parameters
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const reportId = searchParams.get('report');
    if (reportId && storedWeeklyReports.length > 0) {
      const report = storedWeeklyReports.find(r => r.id === reportId);
      if (report && report.reportData) {
        setWeeklyReport(report.reportData as unknown as WeeklyReportEntity);
      }
    } else if (!reportId) {
      setWeeklyReport(null);
    }
  }, [location.search, storedWeeklyReports, setWeeklyReport]);

  // Handle tab changes and update URL
  const handleTabChange = useCallback((tab: 'daily' | 'weekly') => {
    setActiveTab(tab);
    if (tab === 'weekly') {
      navigate('/weekly-reports');
    } else {
      navigate('/');
    }
  }, [navigate]);

  const handleSaveMember = useCallback(async (member: TeamMember) => {
    setSaving(true);
    try {
      await saveMember(member);
      setEditingMember(undefined);
    } catch (err) {
      console.error('Failed to save member:', err);
    } finally {
      setSaving(false);
    }
  }, [saveMember]);

  const handleEditMember = useCallback((member: TeamMember) => {
    setEditingMember(member);
    setIsModalOpen(true);
  }, []);

  const handleAddMember = useCallback(async () => {
    setEditingMember(undefined);
    setIsModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  const handleViewStoredReport = useCallback((report: StoredWeeklyReport) => {
    if (report.reportData) {
      // The reportData is already a WeeklyReport domain entity
      setWeeklyReport(report.reportData);
      navigate(`/weekly-reports?report=${report.id}`);
    }
  }, [setWeeklyReport, navigate]);

  const handleGenerateReportManually = useCallback(async () => {
    setGeneratingReport(true);
    try {
      await generateCurrentWeekReportManually();
    } catch (error) {
      console.error('Failed to generate weekly report:', error);
    } finally {
      setGeneratingReport(false);
    }
  }, [generateCurrentWeekReportManually]);

  const today = getTodayFormatted();

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (error) {
    return <ErrorState error={error} onRetry={refreshData} />;
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <LightRaysContainer />

      {/* Modern Layout Container */}
      <div className="relative z-10 min-h-screen flex">
        {/* Sidebar Navigation */}
        <SidebarNavigation
          activeTab={activeTab}
          onTabChange={handleTabChange}
          teamMembersCount={teamMembers.length}
          yesterdayCount={yesterdayCount}
          teamEngagement={teamEngagement.toString()}
        />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col ml-60">
          {/* Top Header Bar */}
          <TopHeaderBar
            today={today}
            onAddMember={handleAddMember}
            saving={saving}
          />

          {/* Content Area */}
          <div className="flex-1 p-6 lg:p-8">
            <div className="max-w-8xl mx-auto">
              {/* Daily Standup Tab */}
              {activeTab === 'daily' && (
                <DailyStandupTab
                  teamMembers={teamMembers}
                  showHistory={showHistory}
                  onToggleHistory={() => setShowHistory(!showHistory)}
                  onEditMember={handleEditMember}
                  onAddMember={handleAddMember}
                />
              )}

              {/* Weekly Report Tab */}
              {activeTab === 'weekly' && (
                <WeeklyReport
                  report={weeklyReport}
                  loading={weeklyReportLoading}
                  error={weeklyReportError}
                  setWeeklyReport={setWeeklyReport}
                  getPreviousWeekDates={getPreviousWeekDates}
                  storedReports={storedWeeklyReports}
                  storedReportsLoading={storedReportsLoading}
                  onViewStoredReport={handleViewStoredReport}
                  onGenerateReportManually={handleGenerateReportManually}
                  generatingReport={generatingReport}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      <AddUpdateModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSaveMember}
        member={editingMember}
        saving={saving}
        previousEntries={standupHistory.flatMap((entry) => entry.teamMembers)}
      />
    </div>
  );
}

// Loading skeleton component
function LoadingSkeleton() {
  return (
    <div className="min-h-screen relative overflow-hidden">
      <LightRaysContainer />
      
      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Header Skeleton */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-12"
        >
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-white/20 dark:bg-gray-800/20 rounded-2xl animate-pulse backdrop-blur-sm"></div>
            <div>
              <div className="h-10 w-64 bg-white/20 dark:bg-gray-800/20 rounded-lg animate-pulse mb-2"></div>
              <div className="h-4 w-48 bg-white/20 dark:bg-gray-800/20 rounded animate-pulse"></div>
            </div>
          </div>
          <div className="bg-white/20 dark:bg-gray-800/20 backdrop-blur-sm rounded-xl p-4 animate-pulse">
            <div className="h-6 w-40 bg-white/30 dark:bg-gray-700/30 rounded animate-pulse"></div>
          </div>
        </motion.div>

        {/* Navigation Tabs Skeleton */}
        <div className="mb-12">
          <div className="bg-white/20 dark:bg-gray-800/20 backdrop-blur-sm rounded-2xl p-2">
            <div className="flex space-x-2">
              <div className="flex-1 h-12 bg-white/30 dark:bg-gray-700/30 rounded-xl animate-pulse"></div>
              <div className="flex-1 h-12 bg-white/30 dark:bg-gray-700/30 rounded-xl animate-pulse"></div>
            </div>
          </div>
        </div>

        {/* Stats Bar Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white/20 dark:bg-gray-800/20 backdrop-blur-sm rounded-2xl p-6 animate-pulse">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-white/30 dark:bg-gray-700/30 rounded-xl animate-pulse"></div>
                <div className="flex-1">
                  <div className="h-4 w-24 bg-white/30 dark:bg-gray-700/30 rounded animate-pulse mb-2"></div>
                  <div className="h-8 w-16 bg-white/30 dark:bg-gray-700/30 rounded animate-pulse"></div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Section Header Skeleton */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-6">
            <div className="h-8 w-40 bg-white/20 dark:bg-gray-800/20 rounded animate-pulse"></div>
            <div className="h-10 w-20 bg-white/20 dark:bg-gray-800/20 rounded-xl animate-pulse"></div>
          </div>
          <div className="h-12 w-36 bg-white/20 dark:bg-gray-800/20 rounded-xl animate-pulse"></div>
        </div>

        {/* Team Members Grid Skeleton - Masonry Layout */}
        <div className="columns-1 md:columns-2 xl:columns-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="break-inside-avoid mb-6">
              <div className="bg-white/20 dark:bg-gray-800/20 backdrop-blur-sm rounded-2xl p-6 animate-pulse">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 bg-white/30 dark:bg-gray-700/30 rounded-full animate-pulse flex-shrink-0"></div>
                  <div className="flex-1">
                    <div className="h-5 w-24 bg-white/30 dark:bg-gray-700/30 rounded animate-pulse mb-2"></div>
                    <div className="h-4 w-16 bg-white/30 dark:bg-gray-700/30 rounded animate-pulse"></div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="h-4 w-full bg-white/30 dark:bg-gray-700/30 rounded animate-pulse"></div>
                  <div className="h-4 w-3/4 bg-white/30 dark:bg-gray-700/30 rounded animate-pulse"></div>
                  <div className="h-4 w-1/2 bg-white/30 dark:bg-gray-700/30 rounded animate-pulse"></div>
                </div>
                <div className="flex justify-between items-center mt-4 pt-4">
                  <div className="h-4 w-20 bg-white/30 dark:bg-gray-700/30 rounded animate-pulse"></div>
                  <div className="h-8 w-16 bg-white/30 dark:bg-gray-700/30 rounded-lg animate-pulse"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Error state component
function ErrorState({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center">
      <LightRaysContainer />

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative z-10 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 dark:border-gray-700/20 p-8 max-w-md mx-4"
      >
        <div className="text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="w-16 h-16 bg-gradient-to-br from-red-400 to-red-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg"
          >
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </motion.div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Connection Error</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
          <ParticleButton
            onClick={onRetry}
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl hover:from-blue-600 hover:to-purple-600 transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            Retry Connection
          </ParticleButton>
        </div>
      </motion.div>
    </div>
  );
}

// Sidebar Navigation component
function SidebarNavigation({ 
  activeTab, 
  onTabChange,
  teamMembersCount,
  yesterdayCount,
  teamEngagement
}: { 
  activeTab: 'daily' | 'weekly'; 
  onTabChange: (tab: 'daily' | 'weekly') => void;
  teamMembersCount: number;
  yesterdayCount: number;
  teamEngagement: string;
}) {
  return (
    <motion.div
      initial={{ x: -300, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ delay: 0.2, type: "spring", stiffness: 100 }}
      className="fixed left-0 top-0 h-screen w-60 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-r border-white/20 dark:border-slate-700/20 shadow-2xl flex flex-col overflow-hidden z-20"
    >
      {/* Logo Section */}
      <div className="p-8 border-b border-white/20 dark:border-slate-700/20">
        <div
          className="flex items-center gap-4"
        >
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
            <MessageSquare className="text-white" size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Huddle
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">Team Standups</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 p-6 overflow-y-auto">
        <nav className="space-y-2">
          <motion.button
            onClick={() => onTabChange('daily')}
            className={`w-full flex items-center gap-4 p-4 rounded-xl font-medium transition-all duration-300 ${
              activeTab === 'daily'
                ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg'
                : 'text-gray-600 dark:text-gray-400 hover:bg-white/60 dark:hover:bg-slate-800/60 hover:text-gray-900 dark:hover:text-white'
            }`}
            whileHover={{ scale: 1.02, x: 4 }}
            whileTap={{ scale: 0.98 }}
          >
            <Users size={20} />
            <span>Daily Standup</span>
          </motion.button>
          
          <motion.button
            onClick={() => onTabChange('weekly')}
            className={`w-full flex items-center gap-4 p-4 rounded-xl font-medium transition-all duration-300 ${
              activeTab === 'weekly'
                ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg'
                : 'text-gray-600 dark:text-gray-400 hover:bg-white/60 dark:hover:bg-slate-800/60 hover:text-gray-900 dark:hover:text-white'
            }`}
            whileHover={{ scale: 1.02, x: 4 }}
            whileTap={{ scale: 0.98 }}
          >
            <FileText size={20} />
            <span>Weekly Reports</span>
          </motion.button>
        </nav>
      </div>

      {/* Stats Section */}
      <div className="p-6 border-t border-white/20 dark:border-slate-700/20">
        <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-4">Team Stats</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-blue-50/60 dark:bg-blue-900/20 rounded-lg">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-sm text-blue-700 dark:text-blue-300">Today</span>
            </div>
            <span className="text-lg font-bold text-blue-900 dark:text-blue-100">{teamMembersCount}</span>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-emerald-50/60 dark:bg-emerald-900/20 rounded-lg">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
              <span className="text-sm text-emerald-700 dark:text-emerald-300">Previous</span>
            </div>
            <span className="text-lg font-bold text-emerald-900 dark:text-emerald-100">{yesterdayCount}</span>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-purple-50/60 dark:bg-purple-900/20 rounded-lg">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <span className="text-sm text-purple-700 dark:text-purple-300">Engagement</span>
            </div>
            <span className="text-lg font-bold text-purple-900 dark:text-purple-100">{teamEngagement}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// Top Header Bar component
function TopHeaderBar({
  today,
  onAddMember,
  saving
}: {
  today: string;
  onAddMember: () => void;
  saving: boolean;
}) {
  return (
    <motion.div
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.3 }}
      className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border-b border-white/20 dark:border-slate-700/20 px-6 py-4"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 bg-gradient-to-r from-gray-50/60 to-gray-100/40 dark:from-slate-800/60 dark:to-slate-700/40 backdrop-blur-sm rounded-xl px-4 py-2 border border-gray-200/40 dark:border-slate-700/30">
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
      </div>
    </motion.div>
  );
}

// Daily standup tab component
function DailyStandupTab({
  teamMembers,
  showHistory,
  onToggleHistory,
  onEditMember,
  onAddMember
}: {
  teamMembers: TeamMember[];
  showHistory: boolean;
  onToggleHistory: () => void;
  onEditMember: (member: TeamMember) => void;
  onAddMember: () => void;
}) {
  return (
    <>
      {/* Header Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="mb-8"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent mb-2">
              Today's Updates
            </h2>
            <p className="text-gray-600 dark:text-gray-400">Team standup progress and insights</p>
          </div>
          
          <motion.button
            onClick={onToggleHistory}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-6 py-3 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-white/90 dark:hover:bg-slate-900/90 rounded-xl transition-all duration-200 flex items-center gap-3 border border-white/20 dark:border-slate-700/20 shadow-lg hover:shadow-xl"
          >
            <History size={20} />
            <span>View History</span>
            <motion.div
              animate={{ rotate: showHistory ? 90 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronRight size={18} />
            </motion.div>
          </motion.button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl p-4 border border-blue-200/50 dark:border-blue-700/30">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                <Users size={20} className="text-white" />
              </div>
              <div>
                <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">Team Members</p>
                <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{teamMembers.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20 rounded-xl p-4 border border-emerald-200/50 dark:border-emerald-700/30">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center">
                <TrendingUp size={20} className="text-white" />
              </div>
              <div>
                <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">Updates Today</p>
                <p className="text-2xl font-bold text-emerald-900 dark:text-emerald-100">{teamMembers.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-xl p-4 border border-purple-200/50 dark:border-purple-700/30">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
                <BarChart3 size={20} className="text-white" />
              </div>
              <div>
                <p className="text-sm text-purple-600 dark:text-purple-400 font-medium">Engagement</p>
                <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">High</p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Standup History */}
      <StandupHistory
        isOpen={showHistory}
        onClose={() => onToggleHistory()}
      />

      {/* Team Members Grid - Modern Card Layout */}
      {teamMembers.length > 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6"
        >
          <AnimatePresence>
            {teamMembers.map((member, index) => (
              <motion.div
                key={member.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.1 }}
              >
                <TeamMemberCard
                  member={member}
                  onEdit={onEditMember}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6 }}
          className="text-center py-20"
        >
          <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm rounded-3xl p-12 border border-white/20 dark:border-slate-700/20 shadow-2xl max-w-lg mx-auto">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.8, type: "spring", stiffness: 200 }}
              className="w-24 h-24 bg-gradient-to-br from-blue-400 to-purple-500 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl"
            >
              <Users size={40} className="text-white" />
            </motion.div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">No updates yet</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-8 text-lg">Start your team's standup by adding the first update</p>
            <ParticleButton
              onClick={onAddMember}
              className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl hover:from-blue-600 hover:to-purple-600 transition-all duration-200 flex items-center gap-3 mx-auto shadow-lg hover:shadow-xl text-lg font-semibold"
            >
              <Plus size={24} />
              Add First Update
            </ParticleButton>
          </div>
        </motion.div>
      )}
    </>
  );
}
