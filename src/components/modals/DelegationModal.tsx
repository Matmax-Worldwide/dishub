import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Incorporation, TeamMember } from '../../types';

interface DelegationModalProps {
  isOpen: boolean;
  onClose: () => void;
  incorporation: Incorporation | null;
  teamMembers: TeamMember[];
}

export function DelegationModal({ isOpen, onClose, incorporation, teamMembers }: DelegationModalProps) {
  const [selectedMembers, setSelectedMembers] = useState<number[]>([]);
  const [leadAnalyst, setLeadAnalyst] = useState('');
  const [notes, setNotes] = useState('');

  if (!isOpen || !incorporation) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold">Delegate Incorporation</h3>
            <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="mb-6">
            <h4 className="font-medium text-gray-900 mb-2">Incorporation Details</h4>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="font-medium">{incorporation.companyName}</p>
              <p className="text-sm text-gray-500">Client: {incorporation.client}</p>
              <p className="text-sm text-gray-500">Type: {incorporation.type}</p>
              <p className="text-sm text-gray-500">Location: {incorporation.location}</p>
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Team Members
            </label>
            <div className="space-y-2">
              {teamMembers.map(member => (
                <label key={member.id} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    value={member.id}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedMembers([...selectedMembers, member.id]);
                      } else {
                        setSelectedMembers(selectedMembers.filter(id => id !== member.id));
                      }
                    }}
                    className="h-4 w-4 text-blue-600 rounded"
                  />
                  <div className="flex-1">
                    <p className="font-medium">{member.name}</p>
                    <p className="text-xs text-gray-500">{member.role} • Workload: {member.workload}%</p>
                  </div>
                  <div className={`px-2 py-1 rounded text-xs font-medium ${
                    member.status === 'available' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {member.status}
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Lead Analyst
            </label>
            <select 
              value={leadAnalyst}
              onChange={(e) => setLeadAnalyst(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">Select lead analyst</option>
              {teamMembers
                .filter(member => selectedMembers.includes(member.id))
                .map(member => (
                  <option key={member.id} value={member.id}>{member.name}</option>
                ))
              }
            </select>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Assignment Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              placeholder="Add any special instructions or notes..."
            />
          </div>

          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                // Handle delegation logic
                onClose();
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Assign Team
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 