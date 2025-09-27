import { useState, useCallback, useEffect, useMemo } from 'react';
import { TeamMember } from '@/domain/entities/TeamMember';
import { useDateUtils } from './useDateUtils';
import { useAIGeneration } from './useAIGeneration';
import { ManageStandupFormUseCase } from '@/application/use-cases/ManageStandupFormUseCase';

/**
 * Custom hook for managing standup form
 * Encapsulates all form logic and AI generation
 */
export function useStandupForm(member?: TeamMember, previousEntries: TeamMember[] = []) {
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

  // Initialize hooks
  const dateUtils = useDateUtils();
  const aiGeneration = useAIGeneration();

  // Initialize use case
  const formUseCase = useMemo(
    () => new ManageStandupFormUseCase(dateUtils, aiGeneration),
    [dateUtils, aiGeneration]
  );

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

  // Form handlers
  const handleNameChange = useCallback((selectedName: string) => {
    const selectedMember = formUseCase.findTeamMemberByName(selectedName);
    setFormData(prev => ({
      ...prev,
      name: selectedName,
      role: selectedMember?.role || ''
    }));
  }, [formUseCase]);

  const handleYesterdayChange = useCallback((value: string) => {
    setFormData(prev => ({ ...prev, yesterday: value }));
  }, []);

  const handleTodayChange = useCallback((value: string) => {
    setFormData(prev => ({ ...prev, today: value }));
  }, []);

  const handleBlockersChange = useCallback((value: string) => {
    setFormData(prev => ({ ...prev, blockers: value }));
  }, []);

  // AI generation handlers
  const handleGenerateField = useCallback(async (fieldType: 'yesterday' | 'today' | 'blockers') => {
    if (!formData.name || !formData.role) {
      alert('Please select your name first');
      return;
    }

    setAiLoading(true);
    try {
      const content = await formUseCase.generateFieldContent(
        formData.name,
        formData.role,
        fieldType,
        previousEntries
      );
      
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
  }, [formData.name, formData.role, previousEntries, formUseCase]);

  const handleGenerateFullReport = useCallback(async () => {
    if (!formData.name || !formData.role) {
      alert('Please select your name first');
      return;
    }

    setAiLoading(true);
    try {
      const content = await formUseCase.generateFullReport(
        formData.name,
        formData.role,
        previousEntries
      );
      setAiGeneratedContent(content);
      setAiPreviewOpen(true);
    } catch (error) {
      console.error('AI generation failed:', error);
      alert('Failed to generate AI content. Please try again.');
    } finally {
      setAiLoading(false);
    }
  }, [formData.name, formData.role, previousEntries, formUseCase]);

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

  // Create team member from form data
  const createTeamMember = useCallback(() => {
    return formUseCase.createTeamMemberFromForm(formData, member?.id);
  }, [formData, member?.id, formUseCase]);

  // Validate form
  const validateForm = useCallback(() => {
    return formUseCase.validateFormData(formData);
  }, [formData, formUseCase]);

  return {
    // Form data
    formData,
    setFormData,
    
    // Form handlers
    handleNameChange,
    handleYesterdayChange,
    handleTodayChange,
    handleBlockersChange,
    
    // AI generation
    aiPreviewOpen,
    setAiPreviewOpen,
    aiGeneratedContent,
    aiLoading,
    handleGenerateField,
    handleGenerateFullReport,
    handleAcceptAIContent,
    handleAcceptAllAI,
    
    // Business logic
    availableTeamMembers: formUseCase.getAvailableTeamMembers(),
    getPreviousBusinessDayLabel: formUseCase.getPreviousBusinessDayLabel(),
    getTodayPlanLabel: formUseCase.getTodayPlanLabel(),
    createTeamMember,
    validateForm
  };
}
