import { Edit, AlertTriangle, CheckCircle, Sparkles, Clock, Zap } from 'lucide-react';
import { TeamMember } from '../types';
import { getPreviousBusinessDay } from '../utils/dateUtils';
import { motion } from 'motion/react';
import { useState } from 'react';
import CardFlip from './kokonutui/card-flip';

interface TeamMemberCardProps {
  member: TeamMember;
  onEdit: (member: TeamMember) => void;
}

export default function TeamMemberCard({ member, onEdit }: TeamMemberCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  // Create features list for the card flip
  const features = [
    member.yesterday ? `${getPreviousBusinessDay() === 'Friday' ? 'Friday' : 'Yesterday'} updates` : 'No updates yet',
    member.today ? 'Today plans' : 'No plans yet',
    member.blockers ? 'Has blockers' : 'No blockers',
    `Updated ${new Date(member.lastUpdated).toLocaleDateString()}`
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -8, scale: 1.02 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="relative group"
    >
      <div className="relative">
        {/* Edit Button */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => onEdit(member)}
          className="absolute top-4 right-4 z-20 p-2 bg-white/80 dark:bg-gray-800/80 hover:bg-white dark:hover:bg-gray-800 rounded-lg transition-all duration-200 border border-white/20 dark:border-gray-700/20 shadow-sm backdrop-blur-sm"
        >
          <Edit size={16} className="text-gray-600 dark:text-gray-400" />
        </motion.button>

        {/* Card Flip Component */}
        <CardFlip
          title={member.name}
          subtitle={member.role}
          description={`${member.yesterday ? 'Has updates from ' + (getPreviousBusinessDay() === 'Friday' ? 'Friday' : 'yesterday') : 'No updates yet'}. ${member.today ? 'Has plans for today' : 'No plans yet'}. ${member.blockers ? 'Has blockers to address' : 'No blockers reported'}.`}
          features={features}
        />

        {/* Status Indicator */}
        <motion.div
          animate={{ 
            scale: isHovered ? 1 : 0.8,
            opacity: isHovered ? 1 : 0.6 
          }}
          className="absolute bottom-4 left-4 w-3 h-3 bg-gradient-to-r from-emerald-400 to-cyan-400 rounded-full shadow-lg"
        />
      </div>
    </motion.div>
  );
}