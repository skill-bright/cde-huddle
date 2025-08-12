import { useState, useCallback } from 'react';
import { Plus, Users, Calendar, Target, History, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import TeamMemberCard from './TeamMemberCard';
import AddUpdateModal from './AddUpdateModal';
import StandupHistory from './StandupHistory';
import { TeamMember } from '../types';
import { useStandupData } from '../hooks/useStandupData';
import { getPreviousBusinessDay } from '../utils/dateUtils';

export default function StandupDashboard() {
  const { teamMembers, standupHistory, yesterdayCount, teamEngagement, loading, error, saveMember, refreshData } = useStandupData();



  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | undefined>();
  const [showHistory, setShowHistory] = useState(false);
  const [saving, setSaving] = useState(false);

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

  const handleAddMember = useCallback(() => {
    setEditingMember(undefined);
    setIsModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Debug logging


  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
        <div className="flex items-center gap-3 text-gray-600">
          <Loader2 className="animate-spin" size={24} />
          <span>Loading standup data...</span>
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
            onClick={() => refreshData()}
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
            <h1 className="text-3xl font-bold text-gray-900">Daily Standup</h1>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <Calendar size={16} />
            <span>{today}</span>
          </div>
        </div>

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
              onClick={() => setShowHistory(!showHistory)}
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
      </div>

      <AddUpdateModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSaveMember}
        member={editingMember}
        saving={saving}
      />
    </div>
  );
}