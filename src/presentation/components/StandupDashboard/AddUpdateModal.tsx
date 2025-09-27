import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Sparkles } from 'lucide-react';

import { useAIGeneration } from '@/presentation/hooks/useAIGeneration';

import { TeamMember } from '@/domain/entities/TeamMember';
import ParticleButton from '@/components/kokonutui/particle-button';

interface AddUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (member: TeamMember) => Promise<void>;
  member?: TeamMember;
  saving: boolean;
  previousEntries?: TeamMember[];
}

/**
 * Modal component for adding/editing team member updates
 * Supports AI generation for content fields
 */
export function AddUpdateModal({
  isOpen,
  onClose,
  onSave,
  member,
  saving,
  previousEntries = []
}: AddUpdateModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    role: '',
    yesterday: '',
    today: '',
    blockers: ''
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatingField, setGeneratingField] = useState<string | null>(null);
  
  const { generateFieldContent, generateFullReport, error } = useAIGeneration();

  // Initialize form data when member changes
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
  }, [member]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.role.trim()) {
      return;
    }

    const teamMember = new TeamMember(
      member?.id || crypto.randomUUID(),
      formData.name.trim(),
      formData.role.trim(),
      '', // avatar
      formData.yesterday,
      formData.today,
      formData.blockers,
      new Date().toISOString()
    );

    await onSave(teamMember);
  };

  const handleGenerateField = async (field: 'yesterday' | 'today' | 'blockers') => {
    if (!formData.name.trim() || !formData.role.trim()) {
      alert('Please enter name and role first');
      return;
    }

    try {
      setIsGenerating(true);
      setGeneratingField(field);
      
      const content = await generateFieldContent(
        formData.name,
        formData.role,
        field,
        undefined,
        previousEntries
      );
      
      setFormData(prev => ({ ...prev, [field]: content }));
    } catch (err) {
      console.error('Failed to generate content:', err);
    } finally {
      setIsGenerating(false);
      setGeneratingField(null);
    }
  };

  const handleGenerateAll = async () => {
    if (!formData.name.trim() || !formData.role.trim()) {
      alert('Please enter name and role first');
      return;
    }

    try {
      setIsGenerating(true);
      
      const report = await generateFullReport(
        formData.name,
        formData.role,
        previousEntries
      );
      
      setFormData(prev => ({
        ...prev,
        yesterday: report.yesterday,
        today: report.today,
        blockers: report.blockers
      }));
    } catch (err) {
      console.error('Failed to generate full report:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-white/20 dark:border-gray-700/20 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {member ? 'Edit Update' : 'Add Update'}
              </h2>
              <button
                onClick={onClose}
                className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700/50 rounded-lg">
                <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Role *
                  </label>
                  <input
                    type="text"
                    value={formData.role}
                    onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    What did you do yesterday?
                  </label>
                  <ParticleButton
                    onClick={() => handleGenerateField('yesterday')}
                    disabled={isGenerating}
                    className="px-3 py-1 text-xs bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                  >
                    <Sparkles size={12} />
                    {generatingField === 'yesterday' ? 'Generating...' : 'AI Generate'}
                  </ParticleButton>
                </div>
                <textarea
                  value={formData.yesterday}
                  onChange={(e) => setFormData(prev => ({ ...prev, yesterday: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Describe what you accomplished yesterday..."
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    What will you do today?
                  </label>
                  <ParticleButton
                    onClick={() => handleGenerateField('today')}
                    disabled={isGenerating}
                    className="px-3 py-1 text-xs bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                  >
                    <Sparkles size={12} />
                    {generatingField === 'today' ? 'Generating...' : 'AI Generate'}
                  </ParticleButton>
                </div>
                <textarea
                  value={formData.today}
                  onChange={(e) => setFormData(prev => ({ ...prev, today: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Describe your plans for today..."
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Any blockers or challenges?
                  </label>
                  <ParticleButton
                    onClick={() => handleGenerateField('blockers')}
                    disabled={isGenerating}
                    className="px-3 py-1 text-xs bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                  >
                    <Sparkles size={12} />
                    {generatingField === 'blockers' ? 'Generating...' : 'AI Generate'}
                  </ParticleButton>
                </div>
                <textarea
                  value={formData.blockers}
                  onChange={(e) => setFormData(prev => ({ ...prev, blockers: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Describe any blockers or challenges..."
                />
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                <ParticleButton
                  onClick={handleGenerateAll}
                  disabled={isGenerating}
                  className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <Sparkles size={16} />
                  {isGenerating ? 'Generating All...' : 'Generate All with AI'}
                </ParticleButton>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <ParticleButton
                    type="submit"
                    disabled={saving || isGenerating}
                    className="px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:from-blue-600 hover:to-purple-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? 'Saving...' : (member ? 'Update' : 'Save')}
                  </ParticleButton>
                </div>
              </div>
            </form>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
