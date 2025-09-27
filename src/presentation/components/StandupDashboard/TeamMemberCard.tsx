import { motion } from 'motion/react';
import { Edit, User } from 'lucide-react';

import { TeamMember } from '@/domain/entities/TeamMember';
import ParticleButton from '@/components/kokonutui/particle-button';

interface TeamMemberCardProps {
  member: TeamMember;
  onEdit: (member: TeamMember) => void;
}

/**
 * Team member card component
 * Displays a team member's standup update in a card format
 */
export function TeamMemberCard({ member, onEdit }: TeamMemberCardProps) {
  // Helper function to safely render HTML content
  const renderHtmlContent = (content: string) => {
    if (!content) return null;
    
    // Create a temporary div to parse and clean the HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = content;
    
    // Remove any script tags for security
    const scripts = tempDiv.querySelectorAll('script');
    scripts.forEach(script => script.remove());
    
    // Get the cleaned HTML
    const cleanedHtml = tempDiv.innerHTML;
    
    return (
      <div 
        className="prose prose-sm max-w-none text-gray-700 dark:text-gray-200 prose-strong:text-blue-600 dark:prose-strong:text-blue-400"
        dangerouslySetInnerHTML={{ __html: cleanedHtml }}
      />
    );
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -5 }}
      className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm rounded-2xl p-6 border border-white/20 dark:border-slate-700/20 shadow-lg hover:shadow-xl transition-all duration-300"
    >
      <div className="flex items-start gap-4 mb-4">
        <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg">
          <User className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
            {member.name}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
            {member.role}
          </p>
        </div>
        <ParticleButton
          onClick={() => onEdit(member)}
          className="p-2 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all duration-200"
        >
          <Edit size={16} />
        </ParticleButton>
      </div>

      <div className="space-y-4">
        {member.yesterday && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Yesterday</h4>
            <div className="text-sm text-gray-600 dark:text-gray-200">
              {renderHtmlContent(member.yesterday)}
            </div>
          </div>
        )}

        {member.today && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Today</h4>
            <div className="text-sm text-gray-600 dark:text-gray-200">
              {renderHtmlContent(member.today)}
            </div>
          </div>
        )}

        {member.blockers && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Blockers</h4>
            <div className="text-sm text-gray-600 dark:text-gray-200">
              {renderHtmlContent(member.blockers)}
            </div>
          </div>
        )}

        {!member.yesterday && !member.today && !member.blockers && (
          <div className="text-center py-4">
            <p className="text-gray-500 dark:text-gray-400 text-sm">No update provided</p>
          </div>
        )}
      </div>

      <div className="flex justify-between items-center mt-4 pt-4 border-t border-white/20 dark:border-slate-700/20">
        <span className="text-xs text-gray-500 dark:text-gray-400">
          Updated {new Date(member.lastUpdated).toLocaleDateString()}
        </span>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span className="text-xs text-green-600 dark:text-green-400">Active</span>
        </div>
      </div>
    </motion.div>
  );
}
