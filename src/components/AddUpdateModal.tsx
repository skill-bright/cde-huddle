import React, { useState, useEffect, useCallback } from 'react';
import { X, Save, Loader2, Sparkles, Zap, Target, AlertTriangle } from 'lucide-react';
import { TeamMember } from '../types';
import { getPreviousBusinessDayLabel, getTodayPlanLabel, getPreviousBusinessDay } from '../utils/dateUtils';
import { generateFieldContent, generateFullReport } from '../utils/aiUtils';
import RichTextEditor from './RichTextEditor';
import { AIPreviewPanel } from './AIPreviewPanel';
import { motion, AnimatePresence } from 'motion/react';
import ParticleButton from './kokonutui/particle-button';

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
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      >
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-white/20 dark:border-gray-700/20"
        >
          <div className="sticky top-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-white/20 dark:border-gray-700/20 px-8 py-6 flex items-center justify-between rounded-t-3xl">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 via-purple-500 to-teal-500 rounded-2xl flex items-center justify-center shadow-lg">
                <Sparkles className="text-white" size={24} />
              </div>
              <div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                  {member ? 'Edit My Update' : 'Add My Update'}
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">AI-powered standup assistant</p>
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleClose}
              className="p-3 bg-white/60 dark:bg-gray-800/60 hover:bg-white/80 dark:hover:bg-gray-800/80 rounded-xl transition-all duration-200 border border-white/20 dark:border-gray-700/20 shadow-sm"
            >
              <X size={20} className="text-gray-600 dark:text-gray-400" />
            </motion.button>
          </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            <div>
              <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3">
                Team Member
              </label>
              <select
                value={formData.name}
                onChange={(e) => handleNameChange(e.target.value)}
                className="w-full px-4 py-3 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-white/30 dark:border-gray-700/30 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 dark:text-white shadow-sm hover:shadow-md"
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
              <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3">
                Role
              </label>
              <input
                type="text"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full px-4 py-3 bg-white/40 dark:bg-gray-800/40 backdrop-blur-sm border border-white/30 dark:border-gray-700/30 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 dark:text-white shadow-sm"
                required
                readOnly
                placeholder="Auto-filled when name is selected"
              />
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white/40 dark:bg-gray-800/40 backdrop-blur-sm rounded-2xl p-6 border border-white/30 dark:border-gray-700/30"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-lg flex items-center justify-center shadow-sm">
                  <Target size={16} className="text-white" />
                </div>
                <label className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                  {getPreviousBusinessDayLabel()}
                </label>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type="button"
                onClick={() => handleGenerateField('yesterday')}
                disabled={aiLoading || !formData.name}
                className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-purple-700 dark:text-purple-300 bg-purple-100/80 dark:bg-purple-900/30 border border-purple-200/50 dark:border-purple-700/50 rounded-lg hover:bg-purple-200/80 dark:hover:bg-purple-800/40 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed backdrop-blur-sm"
              >
                <Sparkles className="w-3 h-3" />
                {aiLoading ? 'Generating...' : 'AI Generate'}
              </motion.button>
            </div>
            <RichTextArea
              value={formData.yesterday}
              onChange={handleYesterdayChange}
              placeholder={`Describe your accomplishments from ${getPreviousBusinessDayLabel().includes('Friday') ? 'Friday' : 'yesterday'}...`}
              minHeight="180px"
            />
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white/40 dark:bg-gray-800/40 backdrop-blur-sm rounded-2xl p-6 border border-white/30 dark:border-gray-700/30"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center shadow-sm">
                <Zap size={16} className="text-white" />
              </div>
              <label className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                {getTodayPlanLabel()}
              </label>
            </div>
            <RichTextArea
              value={formData.today}
              onChange={handleTodayChange}
              placeholder="Describe your plans for today..."
              minHeight="180px"
            />
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white/40 dark:bg-gray-800/40 backdrop-blur-sm rounded-2xl p-6 border border-white/30 dark:border-gray-700/30"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-orange-600 rounded-lg flex items-center justify-center shadow-sm">
                <AlertTriangle size={16} className="text-white" />
              </div>
              <label className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                Any blockers or challenges?
              </label>
            </div>
            <RichTextArea
              value={formData.blockers}
              onChange={handleBlockersChange}
              placeholder="Any obstacles or challenges you're facing..."
              minHeight="180px"
            />
          </motion.div>

          {/* AI Generation Section */}
          {formData.name && formData.role && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-gradient-to-r from-purple-100/80 to-blue-100/80 dark:from-purple-900/30 dark:to-blue-900/30 backdrop-blur-sm border border-purple-200/50 dark:border-purple-700/50 rounded-2xl p-6"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-2xl flex items-center justify-center shadow-lg">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-purple-900 dark:text-purple-200">AI Assistant</h3>
                  <p className="text-sm text-purple-700 dark:text-purple-400">Let AI help generate your standup content</p>
                </div>
              </div>
              <ParticleButton
                type="button"
                onClick={handleGenerateFullReport}
                disabled={aiLoading}
                className="w-full flex items-center justify-center gap-3 px-6 py-4 text-sm font-semibold text-purple-700 dark:text-purple-300 bg-white/80 dark:bg-gray-800/80 border border-purple-300/50 dark:border-purple-600/50 rounded-xl hover:bg-purple-50/80 dark:hover:bg-purple-900/40 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed backdrop-blur-sm shadow-lg hover:shadow-xl"
              >
                {aiLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Generating AI content...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    Let AI generate for you
                  </>
                )}
              </ParticleButton>
            </motion.div>
          )}

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="flex gap-4 pt-6"
          >
            <ParticleButton
              type="button"
              onClick={handleClose}
              className="flex-1 px-6 py-4 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-xl hover:from-gray-600 hover:to-gray-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={saving}
            >
              Cancel
            </ParticleButton>
            <ParticleButton
              type="submit"
              className="flex-1 px-6 py-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl hover:from-blue-600 hover:to-purple-600 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed font-semibold shadow-lg hover:shadow-xl"
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
            </ParticleButton>
          </motion.div>
        </form>
        </motion.div>

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
      </motion.div>
    </AnimatePresence>
  );
});

export default AddUpdateModal;