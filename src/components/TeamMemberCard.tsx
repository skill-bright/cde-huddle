import { Edit, AlertTriangle, CheckCircle } from 'lucide-react';
import { TeamMember } from '../types';
import { getPreviousBusinessDay } from '../utils/dateUtils';

interface TeamMemberCardProps {
  member: TeamMember;
  onEdit: (member: TeamMember) => void;
}

export default function TeamMemberCard({ member, onEdit }: TeamMemberCardProps) {

  
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all duration-300 hover:scale-[1.02]">
      <div className="flex items-center gap-4 mb-4">
        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-teal-500 rounded-full flex items-center justify-center text-white font-semibold text-lg">
          {member.name.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 text-lg">{member.name}</h3>
          <p className="text-gray-500 text-sm">{member.role}</p>
        </div>
        <button
          onClick={() => onEdit(member)}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
        >
          <Edit size={18} className="text-gray-400" />
        </button>
      </div>

      <div className="space-y-4">
        <div className="group">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle size={16} className="text-green-500" />
            <h4 className="font-medium text-gray-700 text-sm">
              {getPreviousBusinessDay() === 'Friday' ? 'Friday' : 'Yesterday'}
            </h4>
          </div>
          <div 
            className="text-gray-600 text-sm leading-relaxed pl-6 prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: member.yesterday || "No updates yet" }}
          />
        </div>

        <div className="group">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle size={16} className="text-blue-500" />
            <h4 className="font-medium text-gray-700 text-sm">Today</h4>
          </div>
          <div 
            className="text-gray-600 text-sm leading-relaxed pl-6 prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: member.today || "No plans yet" }}
          />
        </div>

        <div className="group">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={16} className="text-orange-500" />
            <h4 className="font-medium text-gray-700 text-sm">Blockers</h4>
          </div>
          <div 
            className="text-gray-600 text-sm leading-relaxed pl-6 prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: member.blockers || "No blockers" }}
          />
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-50">
        <p className="text-xs text-gray-400">
          Last updated: {new Date(member.lastUpdated).toLocaleDateString()}
        </p>
      </div>
    </div>
  );
}