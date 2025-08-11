import React from 'react';
import { Calendar, ChevronDown, ChevronRight, Users, CheckCircle, AlertTriangle } from 'lucide-react';
import { StandupEntry } from '../types';

interface StandupHistoryProps {
  history: StandupEntry[];
  isOpen: boolean;
  onToggle: () => void;
}

export default function StandupHistory({ history, isOpen, onToggle }: StandupHistoryProps) {
  const [expandedEntry, setExpandedEntry] = React.useState<string | null>(null);

  const toggleEntry = (entryId: string) => {
    setExpandedEntry(expandedEntry === entryId ? null : entryId);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (!isOpen) return null;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-8">
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <Calendar size={24} className="text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-900">Standup History</h2>
          <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
            {history.length} meetings
          </span>
        </div>
      </div>

      <div className="max-h-96 overflow-y-auto">
        {history.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            <Calendar size={48} className="text-gray-300 mx-auto mb-4" />
            <p>No previous standups yet</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {history.map((entry) => (
              <div key={entry.id} className="p-4">
                <button
                  onClick={() => toggleEntry(entry.id)}
                  className="w-full flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg transition-colors duration-200"
                >
                  <div className="flex items-center gap-3">
                    {expandedEntry === entry.id ? (
                      <ChevronDown size={16} className="text-gray-400" />
                    ) : (
                      <ChevronRight size={16} className="text-gray-400" />
                    )}
                    <div className="text-left">
                      <p className="font-medium text-gray-900">{formatDate(entry.date)}</p>
                      <p className="text-sm text-gray-500">{entry.teamMembers.length} participants</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users size={16} className="text-gray-400" />
                    <span className="text-sm text-gray-500">{entry.teamMembers.length}</span>
                  </div>
                </button>

                {expandedEntry === entry.id && (
                  <div className="mt-4 pl-6 space-y-4">
                    {entry.teamMembers.map((member) => (
                      <div key={member.id} className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-teal-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                            {member.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900">{member.name}</h4>
                            <p className="text-xs text-gray-500">{member.role}</p>
                          </div>
                        </div>

                        <div className="space-y-2 text-sm">
                          <div className="flex items-start gap-2">
                            <CheckCircle size={14} className="text-green-500 mt-0.5 flex-shrink-0" />
                            <div>
                              <span className="font-medium text-gray-700">Previous day: </span>
                              <span className="text-gray-600">{member.yesterday || "No updates"}</span>
                            </div>
                          </div>
                          <div className="flex items-start gap-2">
                            <CheckCircle size={14} className="text-blue-500 mt-0.5 flex-shrink-0" />
                            <div>
                              <span className="font-medium text-gray-700">Today: </span>
                              <span className="text-gray-600">{member.today || "No plans"}</span>
                            </div>
                          </div>
                          <div className="flex items-start gap-2">
                            <AlertTriangle size={14} className="text-orange-500 mt-0.5 flex-shrink-0" />
                            <div>
                              <span className="font-medium text-gray-700">Blockers: </span>
                              <span className="text-gray-600">{member.blockers || "No blockers"}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}