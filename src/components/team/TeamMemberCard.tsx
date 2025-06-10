import React from 'react';
import { TeamMember } from '../../types';

interface TeamMemberCardProps {
  member: TeamMember;
  onAssign: (member: TeamMember) => void;
}

export function TeamMemberCard({ member, onAssign }: TeamMemberCardProps) {
  const workloadColor = member.workload > 80 ? 'bg-red-500' : member.workload > 60 ? 'bg-yellow-500' : 'bg-green-500';
  const statusColor = member.status === 'available' ? 'bg-green-400' : 'bg-yellow-400';

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white font-medium">{member.avatar}</span>
            </div>
            <div className={`absolute bottom-0 right-0 h-3 w-3 ${statusColor} rounded-full border-2 border-white`} />
          </div>
          <div>
            <h4 className="font-medium text-gray-900">{member.name}</h4>
            <p className="text-xs text-gray-500">{member.role}</p>
          </div>
        </div>
        <button
          onClick={() => onAssign(member)}
          className="px-3 py-1 bg-blue-50 text-blue-600 text-xs font-medium rounded-lg hover:bg-blue-100"
        >
          Assign
        </button>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">Active Cases</span>
          <span className="font-medium">{member.activeIncorporations}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">Completed (Month)</span>
          <span className="font-medium">{member.completedThisMonth}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">Efficiency</span>
          <span className="font-medium text-green-600">{member.efficiency}%</span>
        </div>
        <div>
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="text-gray-500">Workload</span>
            <span className="font-medium">{member.workload}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`${workloadColor} h-2 rounded-full transition-all duration-300`}
              style={{ width: `${member.workload}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
} 