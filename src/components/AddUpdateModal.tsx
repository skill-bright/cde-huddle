import React, { useState, useEffect, useCallback } from 'react';
import { X, Save, Loader2, Sparkles } from 'lucide-react';
import { TeamMember } from '../types';
import { getPreviousBusinessDayLabel, getTodayPlanLabel, getPreviousBusinessDay } from '../utils/dateUtils';
import { generateFieldContent, generateFullReport } from '../utils/aiUtils';
import RichTextEditor from './RichTextEditor';
import { AIPreviewPanel } from './AIPreviewPanel';

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
  previousEntries?: TeamMember[];
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

const AddUpdateModal = React.memo(function AddUpdateModal({ isOpen, onClose, onSave, member, saving = false, previousEntries = [] }: AddUpdateModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    role: '',
    yesterday: '',
    today: '',
    blockers: ''
  });

  // AI generation state
  const [aiPreviewOpen, setAiPreviewOpen] = useState(false);
  const [aiGeneratedContent, setAiGeneratedContent] = useState<{
    yesterday?: string;
    today?: string;
    blockers?: string;
  }>({});
  const [aiLoading, setAiLoading] = useState(false);

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

  // AI generation handlers
  const handleGenerateField = useCallback(async (fieldType: 'yesterday' | 'today' | 'blockers') => {
    if (!formData.name || !formData.role) {
      alert('Please select your name first');
      return;
    }

    setAiLoading(true);
    try {
      const targetDate = fieldType === 'yesterday' ? getPreviousBusinessDay() : undefined;
      
      // Console log for debugging
      if (fieldType === 'yesterday') {
        console.log('🔍 AI Generate "What did you do yesterday?" - Target Date:', targetDate);
        console.log('📅 Current date:', new Date().toLocaleDateString('en-CA', { timeZone: 'America/Vancouver' }));
        console.log('👤 Member:', formData.name, 'Role:', formData.role);
      }
      
      const content = await generateFieldContent({
        memberName: formData.name,
        memberRole: formData.role,
        fieldType,
        previousEntries,
        targetDate
      });
      
      setAiGeneratedContent(prev => ({
        ...prev,
        [fieldType]: content
      }));
      setAiPreviewOpen(true);
    } catch (error) {
      console.error('AI generation failed:', error);
      alert('Failed to generate AI content. Please try again.');
    } finally {
      setAiLoading(false);
    }
  }, [formData.name, formData.role, previousEntries]);

  const handleGenerateFullReport = useCallback(async () => {
    if (!formData.name || !formData.role) {
      alert('Please select your name first');
      return;
    }

    setAiLoading(true);
    try {
      const targetDate = getPreviousBusinessDay();
      
      // Console log for debugging
      console.log('🔍 AI Generate Full Report - Target Date for "yesterday":', targetDate);
      console.log('📅 Current date:', new Date().toLocaleDateString('en-CA', { timeZone: 'America/Vancouver' }));
      console.log('👤 Member:', formData.name, 'Role:', formData.role);
      
      const content = await generateFullReport(formData.name, formData.role, previousEntries, targetDate);
      setAiGeneratedContent(content);
      setAiPreviewOpen(true);
    } catch (error) {
      console.error('AI generation failed:', error);
      alert('Failed to generate AI content. Please try again.');
    } finally {
      setAiLoading(false);
    }
  }, [formData.name, formData.role, previousEntries]);

  const handleAcceptAIContent = useCallback((field: 'yesterday' | 'today' | 'blockers', content: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: content
    }));
    
    // Remove the accepted content from preview
    setAiGeneratedContent(prev => {
      const updated = { ...prev };
      delete updated[field];
      return updated;
    });
  }, []);

  const handleAcceptAllAI = useCallback(() => {
    if (aiGeneratedContent.yesterday) {
      setFormData(prev => ({ ...prev, yesterday: aiGeneratedContent.yesterday! }));
    }
    if (aiGeneratedContent.today) {
      setFormData(prev => ({ ...prev, today: aiGeneratedContent.today! }));
    }
    if (aiGeneratedContent.blockers) {
      setFormData(prev => ({ ...prev, blockers: aiGeneratedContent.blockers! }));
    }
    
    setAiGeneratedContent({});
    setAiPreviewOpen(false);
  }, [aiGeneratedContent]);

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
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                {getPreviousBusinessDayLabel()}
              </label>
              <button
                type="button"
                onClick={() => handleGenerateField('yesterday')}
                disabled={aiLoading || !formData.name}
                className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-purple-700 bg-purple-50 border border-purple-200 rounded-md hover:bg-purple-100 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Sparkles className="w-3 h-3" />
                {aiLoading ? 'Generating...' : 'AI Generate'}
              </button>
            </div>
            <RichTextArea
              value={formData.yesterday}
              onChange={handleYesterdayChange}
              placeholder={`Describe your accomplishments from ${getPreviousBusinessDayLabel().includes('Friday') ? 'Friday' : 'yesterday'}...`}
              minHeight="180px"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                {getTodayPlanLabel()}
              </label>
              {/* <button
                type="button"
                onClick={() => handleGenerateField('today')}
                disabled={aiLoading || !formData.name}
                className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-purple-700 bg-purple-50 border border-purple-200 rounded-md hover:bg-purple-100 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Sparkles className="w-3 h-3" />
                {aiLoading ? 'Generating...' : 'AI Generate'}
              </button> */}
            </div>
            <RichTextArea
              value={formData.today}
              onChange={handleTodayChange}
              placeholder="Describe your plans for today..."
              minHeight="180px"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Any blockers or challenges?
              </label>
              {/* <button
                type="button"
                onClick={() => handleGenerateField('blockers')}
                disabled={aiLoading || !formData.name}
                className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-purple-700 bg-purple-50 border border-purple-200 rounded-md hover:bg-purple-100 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Sparkles className="w-3 h-3" />
                {aiLoading ? 'Generating...' : 'AI Generate'}
              </button> */}
            </div>
            <RichTextArea
              value={formData.blockers}
              onChange={handleBlockersChange}
              placeholder="Any obstacles or challenges you're facing..."
              minHeight="180px"
            />
          </div>

          {/* AI Generation Section */}
          {formData.name && formData.role && (
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-purple-900">AI Assistant</h3>
                  <p className="text-xs text-purple-700">Let AI help generate your standup content</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleGenerateFullReport}
                disabled={aiLoading}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-purple-700 bg-white border border-purple-300 rounded-lg hover:bg-purple-50 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {aiLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating AI content...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Let AI generate for you
                  </>
                )}
              </button>
            </div>
          )}

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

      {/* AI Preview Panel */}
      <AIPreviewPanel
        isOpen={aiPreviewOpen}
        onClose={() => setAiPreviewOpen(false)}
        generatedContent={aiGeneratedContent}
        onAccept={handleAcceptAIContent}
        onAcceptAll={handleAcceptAllAI}
        loading={aiLoading}
        fieldType="full"
      />
    </div>
  );
});

export default AddUpdateModal;