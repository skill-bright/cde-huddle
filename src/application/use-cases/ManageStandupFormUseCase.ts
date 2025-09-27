import { TeamMember } from '@/domain/entities/TeamMember';
import { TeamMemberService } from '@/domain/services/TeamMemberService';
import { useDateUtils } from '@/presentation/hooks/useDateUtils';
import { useAIGeneration } from '@/presentation/hooks/useAIGeneration';

/**
 * Manage Standup Form Use Case
 * Handles form management and AI generation for standup updates
 */
export class ManageStandupFormUseCase {
  constructor(
    private readonly dateUtils: ReturnType<typeof useDateUtils>,
    private readonly aiGeneration: ReturnType<typeof useAIGeneration>
  ) {}

  /**
   * Get available team members
   */
  getAvailableTeamMembers() {
    return TeamMemberService.getAvailableTeamMembers();
  }

  /**
   * Find team member by name
   */
  findTeamMemberByName(name: string) {
    return TeamMemberService.findTeamMemberByName(name);
  }

  /**
   * Get previous business day label
   */
  getPreviousBusinessDayLabel(): string {
    const today = new Date();
    const dayOfWeek = today.getDay();
    
    if (dayOfWeek === 1) { // Monday
      return 'What did you do on Friday?';
    } else if (dayOfWeek === 0) { // Sunday
      return 'What did you do on Friday?';
    } else {
      return 'What did you do yesterday?';
    }
  }

  /**
   * Get today plan label
   */
  getTodayPlanLabel(): string {
    return 'What will you do today?';
  }

  /**
   * Create team member from form data
   */
  createTeamMemberFromForm(
    formData: {
      name: string;
      role: string;
      yesterday: string;
      today: string;
      blockers: string;
    },
    existingId?: string
  ): TeamMember {
    return TeamMemberService.createTeamMemberFromForm(formData, existingId);
  }

  /**
   * Validate form data
   */
  validateFormData(formData: {
    name: string;
    role: string;
    yesterday: string;
    today: string;
    blockers: string;
  }): { isValid: boolean; errors: string[] } {
    return TeamMemberService.validateFormData(formData);
  }

  /**
   * Generate AI content for a specific field
   */
  async generateFieldContent(
    memberName: string,
    memberRole: string,
    fieldType: 'yesterday' | 'today' | 'blockers',
    previousEntries: TeamMember[]
  ): Promise<string> {
    const targetDate = fieldType === 'yesterday' ? this.dateUtils.getPreviousBusinessDay() : undefined;
    
    return await this.aiGeneration.generateFieldContent(
      memberName,
      memberRole,
      fieldType,
      targetDate,
      previousEntries
    );
  }

  /**
   * Generate full AI report
   */
  async generateFullReport(
    memberName: string,
    memberRole: string,
    previousEntries: TeamMember[]
  ): Promise<{ yesterday?: string; today?: string; blockers?: string }> {
    return await this.aiGeneration.generateFullReport(memberName, memberRole, previousEntries);
  }
}
