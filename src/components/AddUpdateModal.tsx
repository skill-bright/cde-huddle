import React, { useState, useEffect } from 'react';
import { X, Save, Loader2 } from 'lucide-react';
import { TeamMember } from '../types';
import { getPreviousBusinessDayLabel, getTodayPlanLabel } from '../utils/dateUtils';

interface AddUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (member: TeamMember) => void;
  member?: TeamMember;
  saving?: boolean;
}

export default function AddUpdateModal({ isOpen, onClose, onSave, member, saving = false }: AddUpdateModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    role: '',
    yesterday: '',
    today: '',
    blockers: ''
  });

  useEffect(() => {
    if (member) {
      setFormData({
        name: member.name,
        role: member.role,
        yesterday: member.yesterday,
        today: member.today,
        blockers: member.blockers
      });
    } else {
      setFormData({
        name: '',
        role: '',
        yesterday: '',
        today: '',
        blockers: ''
      });
    }
  }, [member, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedMember: TeamMember = {
      id: member?.id || Date.now().toString(),
      name: formData.name,
      role: formData.role,
      avatar: '',
      yesterday: formData.yesterday,
      today: formData.today,
      blockers: formData.blockers,
      lastUpdated: new Date().toISOString()
    };
    onSave(updatedMember);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">
            {member ? 'Edit My Update' : 'Add My Update'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Role
              </label>
              <input
                type="text"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {getPreviousBusinessDayLabel()}
            </label>
            <textarea
              value={formData.yesterday}
              onChange={(e) => setFormData({ ...formData, yesterday: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none"
              placeholder={`Describe your accomplishments from ${getPreviousBusinessDayLabel().includes('Friday') ? 'Friday' : 'yesterday'}...`}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {getTodayPlanLabel()}
            </label>
            <textarea
              value={formData.today}
              onChange={(e) => setFormData({ ...formData, today: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none"
              placeholder="Describe your plans for today..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Any blockers or challenges?
            </label>
            <textarea
              value={formData.blockers}
              onChange={(e) => setFormData({ ...formData, blockers: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none"
              placeholder="Any obstacles or challenges you're facing..."
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200"
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={saving}
            >
              {saving ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={18} />
                  Save Update
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}