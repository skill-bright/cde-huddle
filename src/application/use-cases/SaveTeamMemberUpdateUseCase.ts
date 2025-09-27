import { StandupRepository } from '@/domain/repositories/StandupRepository';
import { TeamMember } from '@/domain/entities/TeamMember';

/**
 * Use case for saving a team member's standup update
 * Encapsulates the business logic for persisting team member updates
 */
export class SaveTeamMemberUpdateUseCase {
  constructor(private readonly standupRepository: StandupRepository) {}

  /**
   * Execute the use case
   * @param member The team member update to save
   * @returns Promise<void>
   */
  async execute(member: TeamMember): Promise<void> {
    try {
      // Validate the member data
      this.validateMemberData(member);
      
      // Save the update
      await this.standupRepository.saveTeamMemberUpdate(member);
    } catch (error) {
      console.error('Failed to save team member update:', error);
      throw new Error('Failed to save team member update');
    }
  }

  /**
   * Validate team member data before saving
   * @param member The team member to validate
   */
  private validateMemberData(member: TeamMember): void {
    if (!member.id || member.id.trim() === '') {
      throw new Error('Team member ID is required');
    }
    
    if (!member.name || member.name.trim() === '') {
      throw new Error('Team member name is required');
    }
    
    if (!member.role || member.role.trim() === '') {
      throw new Error('Team member role is required');
    }
    
    // At least one field should have content
    if (!member.yesterday && !member.today && !member.blockers) {
      throw new Error('At least one update field (yesterday, today, or blockers) must be provided');
    }
  }
}
