import React, { useState, useEffect, useRef } from 'react';
import { X, Save, Loader2, GripVertical } from 'lucide-react';
import { TeamMember } from '../types';
import { getPreviousBusinessDayLabel, getTodayPlanLabel } from '../utils/dateUtils';

// Predefined team members - you can modify this list
const TEAM_MEMBERS = [
  { id: '1', name: 'Ibrahim', role: 'Boss' },
  { id: '2', name: 'Aurelio', role: 'Developer' },
  { id: '3', name: 'Francois Polo', role: 'Developer' },
  { id: '4', name: 'Isik', role: 'PR' },
  { id: '5', name: 'Atena', role: 'Developer' },
];

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

  const handleNameChange = (selectedName: string) => {
    const selectedMember = TEAM_MEMBERS.find(member => member.name === selectedName);
    setFormData({
      ...formData,
      name: selectedName,
      role: selectedMember?.role || ''
    });
  };

  // Resizable textarea component
  const ResizableTextarea = ({ 
    value, 
    onChange, 
    placeholder, 
    minRows = 3, 
    maxRows = 10 
  }: {
    value: string;
    onChange: (value: string) => void;
    placeholder: string;
    minRows?: number;
    maxRows?: number;
  }) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [isResizing, setIsResizing] = useState(false);

    const handleMouseDown = (e: React.MouseEvent) => {
      e.preventDefault();
      setIsResizing(true);
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing || !textareaRef.current) return;
      
      const rect = textareaRef.current.getBoundingClientRect();
      const newHeight = e.clientY - rect.top;
      const minHeight = minRows * 24; // Approximate line height
      const maxHeight = maxRows * 24;
      
      if (newHeight >= minHeight && newHeight <= maxHeight) {
        textareaRef.current.style.height = `${newHeight}px`;
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    useEffect(() => {
      if (isResizing) {
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        return () => {
          document.removeEventListener('mousemove', handleMouseMove);
          document.removeEventListener('mouseup', handleMouseUp);
        };
      }
    }, [isResizing]);

    return (
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={minRows}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none"
          style={{ minHeight: `${minRows * 24}px` }}
        />
        <div
          className="absolute bottom-1 right-1 cursor-ns-resize p-1 hover:bg-gray-100 rounded transition-colors duration-200"
          onMouseDown={handleMouseDown}
        >
          <GripVertical size={12} className="text-gray-400" />
        </div>
      </div>
    );
  };

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
      id: member?.id || crypto.randomUUID(),
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
            <ResizableTextarea
              value={formData.yesterday}
              onChange={(value) => setFormData({ ...formData, yesterday: value })}
              placeholder={`Describe your accomplishments from ${getPreviousBusinessDayLabel().includes('Friday') ? 'Friday' : 'yesterday'}...`}
              minRows={3}
              maxRows={8}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {getTodayPlanLabel()}
            </label>
            <ResizableTextarea
              value={formData.today}
              onChange={(value) => setFormData({ ...formData, today: value })}
              placeholder="Describe your plans for today..."
              minRows={3}
              maxRows={8}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Any blockers or challenges?
            </label>
            <ResizableTextarea
              value={formData.blockers}
              onChange={(value) => setFormData({ ...formData, blockers: value })}
              placeholder="Any obstacles or challenges you're facing..."
              minRows={2}
              maxRows={6}
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