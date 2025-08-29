import React, { useState, useEffect, useCallback } from 'react';
import { X, Save, Loader2 } from 'lucide-react';
import { TeamMember } from '../types';
import { getPreviousBusinessDayLabel, getTodayPlanLabel } from '../utils/dateUtils';
import RichTextEditor from './RichTextEditor';

// Predefined team members - you can modify this list
const TEAM_MEMBERS = [
  { id: '1', name: 'Ibrahim', role: 'Boss' },
  { id: '2', name: 'Aurelio', role: 'Developer' },
  { id: '3', name: 'Francois', role: 'Developer' },
  { id: '4', name: 'Isik', role: 'Marketing' },
  { id: '5', name: 'Atena', role: 'Developer' },
];

interface AddUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (member: TeamMember) => void;
  member?: TeamMember;
  saving?: boolean;
}

// Rich text editor component wrapper - moved outside to prevent recreation
const RichTextArea = React.memo(({ 
  value, 
  onChange, 
  placeholder, 
  minHeight = '120px'
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  minHeight?: string;
}) => {
  return (
    <RichTextEditor
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      minHeight={minHeight}
    />
  );
});

const AddUpdateModal = React.memo(function AddUpdateModal({ isOpen, onClose, onSave, member, saving = false }: AddUpdateModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    role: '',
    yesterday: '',
    today: '',
    blockers: ''
  });

  const handleNameChange = useCallback((selectedName: string) => {
    const selectedMember = TEAM_MEMBERS.find(member => member.name === selectedName);
    setFormData(prev => ({
      ...prev,
      name: selectedName,
      role: selectedMember?.role || ''
    }));
  }, []);

  const handleYesterdayChange = useCallback((value: string) => {
    setFormData(prev => ({ ...prev, yesterday: value }));
  }, []);

  const handleTodayChange = useCallback((value: string) => {
    setFormData(prev => ({ ...prev, today: value }));
  }, []);

  const handleBlockersChange = useCallback((value: string) => {
    setFormData(prev => ({ ...prev, blockers: value }));
  }, []);

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

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    const updatedMember: TeamMember = {
      id: member?.id || crypto.randomUUID(),
      name: formData.name,
      role: formData.role,
      avatar: '',
      yesterday: formData.yesterday,
      today: formData.today,
      blockers: formData.blockers,
      lastUpdated: new Date().toISOString()
    };
    
    try {
      await onSave(updatedMember);
      // Close modal after successful save
      onClose();
    } catch (error) {
      // Error handling is done in the parent component
      console.error('Failed to save member:', error);
    }
  }, [formData, member?.id, onSave, onClose]);

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">
            {member ? 'Edit My Update' : 'Add My Update'}
          </h2>
          <button
            onClick={handleClose}
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
              <select
                value={formData.name}
                onChange={(e) => handleNameChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                required
              >
                <option value="">Select your name...</option>
                {TEAM_MEMBERS.map((member) => (
                  <option key={member.id} value={member.name}>
                    {member.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Role
              </label>
              <input
                type="text"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50"
                required
                readOnly
                placeholder="Auto-filled when name is selected"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {getPreviousBusinessDayLabel()}
            </label>
            <RichTextArea
              value={formData.yesterday}
              onChange={handleYesterdayChange}
              placeholder={`Describe your accomplishments from ${getPreviousBusinessDayLabel().includes('Friday') ? 'Friday' : 'yesterday'}...`}
              minHeight="180px"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {getTodayPlanLabel()}
            </label>
            <RichTextArea
              value={formData.today}
              onChange={handleTodayChange}
              placeholder="Describe your plans for today..."
              minHeight="180px"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Any blockers or challenges?
            </label>
            <RichTextArea
              value={formData.blockers}
              onChange={handleBlockersChange}
              placeholder="Any obstacles or challenges you're facing..."
              minHeight="180px"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
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
});

export default AddUpdateModal;