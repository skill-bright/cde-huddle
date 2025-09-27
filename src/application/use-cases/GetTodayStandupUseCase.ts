import { StandupRepository } from '@/domain/repositories/StandupRepository';
import { TeamMember } from '@/domain/entities/TeamMember';

/**
 * Use case for getting today's standup data
 * Encapsulates the business logic for retrieving today's team member updates
 */
export class GetTodayStandupUseCase {
  constructor(private readonly standupRepository: StandupRepository) {}

  /**
   * Execute the use case
   * @returns Promise<TeamMember[]> Today's team member updates
   */
  async execute(): Promise<TeamMember[]> {
    try {
      const teamMembers = await this.standupRepository.getTodayStandup();
      return teamMembers;
    } catch (error) {
      console.error('Failed to get today\'s standup:', error);
      throw new Error('Failed to retrieve today\'s standup data');
    }
  }
}
