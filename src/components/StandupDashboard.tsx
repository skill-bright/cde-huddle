import { useState, useCallback, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Plus, Users, Calendar, Target, History, ChevronDown, ChevronUp, Loader2, FileText } from 'lucide-react';
import TeamMemberCard from './TeamMemberCard';
import AddUpdateModal from './AddUpdateModal';
import StandupHistory from './StandupHistory';
import { WeeklyReport } from './WeeklyReport';
import { TeamMember, StoredWeeklyReport } from '../types';
import { useStandupData } from '../hooks/useStandupData';
import { getPreviousBusinessDay } from '../utils/dateUtils';

interface StandupDashboardProps {
  initialTab?: 'daily' | 'weekly';
}

export default function StandupDashboard({ initialTab = 'daily' }: StandupDashboardProps) {
  const navigate = useNavigate();
  const location = useLocation();
  
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
    getPreviousWeekDates,
    storedWeeklyReports,
    storedReportsLoading,
  } = useStandupData();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | undefined>();
  const [showHistory, setShowHistory] = useState(false);
  const [saving, setSaving] = useState(false);
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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setWeeklyReport(report.reportData as any);
      }
    } else if (!reportId) {
      // Clear the report when there's no report ID in the URL
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
    // Set the stored report as the current report
    if (report.reportData) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setWeeklyReport(report.reportData as any);
      // Update URL to include report ID
      navigate(`/weekly-reports?report=${report.id}`);
    }
  }, [setWeeklyReport, navigate]);

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="container mx-auto px-4 py-8">
          {/* Header Skeleton */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-gray-200 rounded-xl animate-pulse"></div>
              <div className="h-8 w-48 bg-gray-200 rounded animate-pulse"></div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>

          {/* Navigation Tabs Skeleton */}
          <div className="mb-8">
            <div className="border-b border-gray-200">
              <div className="-mb-px flex space-x-8">
                <div className="py-2 px-1">
                  <div className="h-6 w-24 bg-gray-200 rounded animate-pulse"></div>
                </div>
                <div className="py-2 px-1">
                  <div className="h-6 w-28 bg-gray-200 rounded animate-pulse"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Bar Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-lg animate-pulse"></div>
                  <div className="flex-1">
                    <div className="h-4 w-20 bg-gray-200 rounded animate-pulse mb-2"></div>
                    <div className="h-6 w-12 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Section Header Skeleton */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-4">
              <div className="h-6 w-32 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-8 w-16 bg-gray-200 rounded-lg animate-pulse"></div>
            </div>
            <div className="h-10 w-32 bg-gray-200 rounded-lg animate-pulse"></div>
          </div>

          {/* Team Members Grid Skeleton - Masonry Layout */}
          <div className="columns-1 md:columns-2 xl:columns-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="break-inside-avoid mb-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-12 h-12 bg-gray-200 rounded-full animate-pulse flex-shrink-0"></div>
                    <div className="flex-1">
                      <div className="h-5 w-24 bg-gray-200 rounded animate-pulse mb-2"></div>
                      <div className="h-4 w-16 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="h-4 w-full bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-4 w-1/2 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                  <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-100">
                    <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-8 w-16 bg-gray-200 rounded-lg animate-pulse"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-sm border border-red-200 p-6 max-w-md">
          <div className="text-red-600 mb-2">Database Connection Error</div>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={async () => {
              refreshData();
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-teal-600 rounded-xl flex items-center justify-center">
              <Users className="text-white" size={24} />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Team Standup</h1>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <Calendar size={16} />
            <span>{today}</span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => handleTabChange('daily')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'daily'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Users size={16} />
                  Daily Standup
                </div>
              </button>
              <button
                onClick={() => handleTabChange('weekly')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'weekly'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <FileText size={16} />
                  Weekly Reports
                </div>
              </button>
            </nav>
          </div>
        </div>

        {/* Daily Standup Tab */}
        {activeTab === 'daily' && (
          <>
            {/* Stats Bar */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Users size={20} className="text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Updates Today</p>
                    <p className="text-xl font-semibold text-gray-900">{teamMembers.length}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <Target size={20} className="text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">
                      {getPreviousBusinessDay() === 'Friday' ? 'Friday Updates' : 'Yesterday Updates'}
                    </p>
                    <p className="text-xl font-semibold text-gray-900">
                      {yesterdayCount}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Users size={20} className="text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Team Engagement</p>
                    <p className="text-xl font-semibold text-gray-900">
                      {teamEngagement}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-4">
                <h2 className="text-xl font-semibold text-gray-900">Today's Updates</h2>
                <button
                  onClick={async () => {
                    setShowHistory(!showHistory);
                  }}
                  className="px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors duration-200 flex items-center gap-2"
                >
                  <History size={18} />
                  History
                  {showHistory ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleAddMember}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center gap-2 shadow-sm"
                  disabled={saving}
                >
                  {saving ? <Loader2 className="animate-spin" size={18} /> : <Plus size={18} />}
                  Add My Update
                </button>
              </div>
            </div>

            {/* Standup History */}
            <StandupHistory 
              history={standupHistory}
              isOpen={showHistory}
              onToggle={() => setShowHistory(!showHistory)}
            />

            {/* Team Members Grid - Masonry Layout */}
            <div className="columns-1 md:columns-2 xl:columns-3 gap-6">
              {teamMembers.map((member) => (
                <div key={member.id} className="break-inside-avoid mb-6">
                  <TeamMemberCard
                    member={member}
                    onEdit={handleEditMember}
                  />
                </div>
              ))}
            </div>

            {teamMembers.length === 0 && (
              <div className="text-center py-12">
                <Users size={48} className="text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No updates yet</h3>
                <p className="text-gray-500 mb-4">Add your update to get started with today's standup</p>
                <button
                  onClick={handleAddMember}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center gap-2 mx-auto"
                >
                  <Plus size={20} />
                  Add My Update
                </button>
              </div>
            )}
          </>
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