import { TeamMember } from '../entities/TeamMember';

/**
 * TeamMemberService Domain Service
 * Handles team member business logic and operations
 */
export class TeamMemberService {
  // Predefined team members - you can modify this list
  private static readonly TEAM_MEMBERS = [
    { id: '1', name: 'Ibrahim', role: 'Boss' },
    { id: '2', name: 'Aurelio', role: 'Developer' },
    { id: '3', name: 'Francois', role: 'Developer' },
    { id: '4', name: 'Isik', role: 'Marketing' },
    { id: '5', name: 'Atena', role: 'Developer' },
  ];

  /**
   * Get all available team members
   */
  static getAvailableTeamMembers(): Array<{ id: string; name: string; role: string }> {
    return [...this.TEAM_MEMBERS];
  }

  /**
   * Find team member by name
   */
  static findTeamMemberByName(name: string): { id: string; name: string; role: string } | undefined {
    return this.TEAM_MEMBERS.find(member => member.name === name);
  }

  /**
   * Create a new team member from form data
   */
  static createTeamMemberFromForm(
    formData: {
      name: string;
      role: string;
      yesterday: string;
      today: string;
      blockers: string;
    },
    existingId?: string
  ): TeamMember {
    return new TeamMember(
      existingId || crypto.randomUUID(),
      formData.name,
      formData.role,
      '', // avatar
      formData.yesterday,
      formData.today,
      formData.blockers,
      new Date().toISOString()
    );
  }

  /**
   * Validate form data
   */
  static validateFormData(formData: {
    name: string;
    role: string;
    yesterday: string;
    today: string;
    blockers: string;
  }): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!formData.name.trim()) {
      errors.push('Name is required');
    }

    if (!formData.role.trim()) {
      errors.push('Role is required');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}
