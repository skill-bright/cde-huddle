import { useState, useCallback, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Plus, Users, History, ChevronDown, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

import { useStandupData } from '@/presentation/hooks/useStandupData';
import { useDateUtils } from '@/presentation/hooks/useDateUtils';

import { TeamMember } from '@/domain/entities/TeamMember';
import { WeeklyReport as WeeklyReportEntity } from '@/domain/entities/WeeklyReport';
import { StoredWeeklyReport } from '@/domain/repositories/StandupRepository';
import { LightRaysContainer } from '@/components/bits/light-ray';
import ParticleButton from '@/components/kokonutui/particle-button';
import { WeeklyReport } from '@/presentation/components/WeeklyReport/WeeklyReport';
import { Header } from './Header';
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
    <div className="min-h-screen relative overflow-hidden">
      <LightRaysContainer />

      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Header */}
        <Header
          today={today}
          teamMembersCount={teamMembers.length}
          yesterdayCount={yesterdayCount}
          teamEngagement={teamEngagement.toString()}
          onAddMember={handleAddMember}
          saving={saving}
        />

        {/* Navigation Tabs */}
        <NavigationTabs
          activeTab={activeTab}
          onTabChange={handleTabChange}
        />

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

// Navigation tabs component
function NavigationTabs({ 
  activeTab, 
  onTabChange 
}: { 
  activeTab: 'daily' | 'weekly'; 
  onTabChange: (tab: 'daily' | 'weekly') => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6 }}
      className="mb-12"
    >
      <div className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm rounded-2xl p-2 border border-white/20 dark:border-gray-700/20 shadow-lg">
        <nav className="flex space-x-2">
          <motion.button
            onClick={() => onTabChange('daily')}
            className={`relative flex-1 py-3 px-6 rounded-xl font-medium text-sm transition-all duration-300 ${
              activeTab === 'daily'
                ? 'text-white'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {activeTab === 'daily' && (
              <motion.div
                layoutId="activeTab"
                className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl shadow-lg"
                initial={false}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            )}
            <div className="relative flex items-center justify-center gap-2">
              <Users size={18} />
              Daily Standup
            </div>
          </motion.button>
          <motion.button
            onClick={() => onTabChange('weekly')}
            className={`relative flex-1 py-3 px-6 rounded-xl font-medium text-sm transition-all duration-300 ${
              activeTab === 'weekly'
                ? 'text-white'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {activeTab === 'weekly' && (
              <motion.div
                layoutId="activeTab"
                className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl shadow-lg"
                initial={false}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            )}
            <div className="relative flex items-center justify-center gap-2">
              <FileText size={18} />
              Weekly Reports
            </div>
          </motion.button>
        </nav>
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
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.0 }}
        className="flex justify-between items-center mb-8"
      >
        <div className="flex items-center gap-6">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
            Today's Updates
          </h2>
          <motion.button
            onClick={onToggleHistory}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-4 py-2 bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-white/80 dark:hover:bg-gray-900/80 rounded-xl transition-all duration-200 flex items-center gap-2 border border-white/20 dark:border-gray-700/20 shadow-sm"
          >
            <History size={18} />
            History
            <motion.div
              animate={{ rotate: showHistory ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown size={16} />
            </motion.div>
          </motion.button>
        </div>
      </motion.div>

      {/* Standup History */}
      <StandupHistory
        isOpen={showHistory}
        onClose={() => onToggleHistory()}
      />

      {/* Team Members Grid - Masonry Layout */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="columns-1 md:columns-2 xl:columns-3 gap-6"
      >
        <AnimatePresence>
          {teamMembers.map((member, index) => (
            <motion.div
              key={member.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: index * 0.1 }}
              className="break-inside-avoid mb-6"
            >
              <TeamMemberCard
                member={member}
                onEdit={onEditMember}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {teamMembers.length === 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1.2 }}
          className="text-center py-16"
        >
          <div className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm rounded-3xl p-12 border border-white/20 dark:border-gray-700/20 shadow-lg max-w-md mx-auto">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 1.4, type: "spring", stiffness: 200 }}
              className="w-20 h-20 bg-gradient-to-br from-blue-400 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg"
            >
              <Users size={32} className="text-white" />
            </motion.div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">No updates yet</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">Add your update to get started with today's standup</p>
            <ParticleButton
              onClick={onAddMember}
              className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl hover:from-blue-600 hover:to-purple-600 transition-all duration-200 flex items-center gap-2 mx-auto shadow-lg hover:shadow-xl"
            >
              <Plus size={20} />
              Add My Update
            </ParticleButton>
          </div>
        </motion.div>
      )}
    </>
  );
}
