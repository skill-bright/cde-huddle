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
      whileHover={{ scale: 1.02, y: -8 }}
      className="group bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-3xl p-6 border border-white/30 dark:border-slate-700/30 shadow-xl hover:shadow-2xl transition-all duration-500 hover:border-blue-200/50 dark:hover:border-blue-700/50"
    >
      {/* Header */}
      <div className="flex items-start gap-4 mb-6">
        <div className="relative">
          <div className="w-14 h-14 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-blue-500/25 transition-all duration-300">
            <User className="w-7 h-7 text-white" />
          </div>
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-900"></div>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white truncate mb-1">
            {member.name}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 truncate font-medium">
            {member.role}
          </p>
        </div>
        <motion.div
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <ParticleButton
            onClick={() => onEdit(member)}
            className="p-3 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-all duration-300 group-hover:bg-blue-50/80 dark:group-hover:bg-blue-900/30"
          >
            <Edit size={18} />
          </ParticleButton>
        </motion.div>
      </div>

      {/* Content */}
      <div className="space-y-6">
        {member.yesterday && (
          <div className="bg-gradient-to-r from-blue-50/60 to-blue-100/40 dark:from-blue-900/20 dark:to-blue-800/20 rounded-2xl p-4 border border-blue-200/40 dark:border-blue-700/30">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <h4 className="text-sm font-bold text-blue-700 dark:text-blue-300 uppercase tracking-wide">Yesterday</h4>
            </div>
            <div className="text-sm text-blue-800 dark:text-blue-200 leading-relaxed">
              {renderHtmlContent(member.yesterday)}
            </div>
          </div>
        )}

        {member.today && (
          <div className="bg-gradient-to-r from-emerald-50/60 to-emerald-100/40 dark:from-emerald-900/20 dark:to-emerald-800/20 rounded-2xl p-4 border border-emerald-200/40 dark:border-emerald-700/30">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
              <h4 className="text-sm font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wide">Today</h4>
            </div>
            <div className="text-sm text-emerald-800 dark:text-emerald-200 leading-relaxed">
              {renderHtmlContent(member.today)}
            </div>
          </div>
        )}

        {member.blockers && (
          <div className="bg-gradient-to-r from-orange-50/60 to-orange-100/40 dark:from-orange-900/20 dark:to-orange-800/20 rounded-2xl p-4 border border-orange-200/40 dark:border-orange-700/30">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
              <h4 className="text-sm font-bold text-orange-700 dark:text-orange-300 uppercase tracking-wide">Blockers</h4>
            </div>
            <div className="text-sm text-orange-800 dark:text-orange-200 leading-relaxed">
              {renderHtmlContent(member.blockers)}
            </div>
          </div>
        )}

        {!member.yesterday && !member.today && !member.blockers && (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gray-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <User className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">No update provided</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-200/50 dark:border-slate-700/50">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
          <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">Active</span>
        </div>
        <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
          Updated {new Date(member.lastUpdated).toLocaleDateString()}
        </span>
      </div>
    </motion.div>
  );
}
