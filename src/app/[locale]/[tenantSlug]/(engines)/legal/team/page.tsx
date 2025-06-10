'use client';

import React, { useState } from 'react';
import PageHeader from '@/components/PageHeader';
import { 
  Users,
  Search,
  Mail,
  Phone,
  Calendar,
  TrendingUp,
  MapPin,
  Clock,
  CheckCircle2,
} from 'lucide-react';

// Extended team members data
const teamMembers = [
  {
    id: 1,
    name: "María González",
    role: "Senior Legal Analyst",
    avatar: "MG",
    email: "maria.gonzalez@nuolegal.com",
    phone: "+51 987 654 321",
    office: "Peru",
    joinDate: "2022-03-15",
    activeIncorporations: 5,
    completedThisMonth: 3,
    completedTotal: 45,
    efficiency: 92,
    status: "available",
    workload: 75,
    specializations: ["Corporate Law", "SUNARP Processes", "Notarial Services"],
    languages: ["Spanish", "English"],
    certifications: ["Certified Corporate Lawyer", "SUNARP Specialist"]
  },
  {
    id: 2,
    name: "Carlos Mendez",
    role: "Legal Analyst",
    avatar: "CM",
    email: "carlos.mendez@nuolegal.com",
    phone: "+51 987 654 322",
    office: "Peru",
    joinDate: "2023-01-20",
    activeIncorporations: 4,
    completedThisMonth: 2,
    completedTotal: 28,
    efficiency: 88,
    status: "busy",
    workload: 90,
    specializations: ["Commercial Law", "Document Processing"],
    languages: ["Spanish", "English"],
    certifications: ["Legal Process Specialist"]
  },
  {
    id: 3,
    name: "Ana Vargas",
    role: "Senior Legal Analyst",
    avatar: "AV",
    email: "ana.vargas@nuolegal.com",
    phone: "+52 555 123 456",
    office: "Mexico",
    joinDate: "2021-11-10",
    activeIncorporations: 6,
    completedThisMonth: 4,
    completedTotal: 67,
    efficiency: 95,
    status: "available",
    workload: 80,
    specializations: ["International Law", "Cross-border Transactions", "Tax Law"],
    languages: ["Spanish", "English", "Portuguese"],
    certifications: ["International Legal Expert", "Tax Consultant"]
  },
  {
    id: 4,
    name: "José Rodriguez",
    role: "Junior Legal Analyst",
    avatar: "JR",
    email: "jose.rodriguez@nuolegal.com",
    phone: "+57 300 123 456",
    office: "Colombia",
    joinDate: "2023-06-01",
    activeIncorporations: 3,
    completedThisMonth: 1,
    completedTotal: 12,
    efficiency: 85,
    status: "available",
    workload: 60,
    specializations: ["Basic Corporate Law", "Document Review"],
    languages: ["Spanish"],
    certifications: ["Junior Legal Associate"]
  }
];

export default function TeamPage() {
  const [selectedMember, setSelectedMember] = useState<typeof teamMembers[0] | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterOffice, setFilterOffice] = useState('all');

  const filteredMembers = teamMembers.filter(member => {
    const matchesSearch = member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.role.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesOffice = filterOffice === 'all' || member.office.toLowerCase() === filterOffice.toLowerCase();
    return matchesSearch && matchesOffice;
  });

  return (
    <>
      <PageHeader
        title="Team Management"
        description="Manage team members, performance, and assignments"
        onMenuClick={() => {}}
        showNewButton={true}
        newButtonText="Add Team Member"
        onNewClick={() => console.log('Add team member clicked')}
      />

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-6">
        {/* Team Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Members</p>
                <p className="text-2xl font-bold text-gray-900">{teamMembers.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center">
              <CheckCircle2 className="h-8 w-8 text-green-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Available</p>
                <p className="text-2xl font-bold text-gray-900">
                  {teamMembers.filter(m => m.status === 'available').length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-purple-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Avg. Efficiency</p>
                <p className="text-2xl font-bold text-gray-900">
                  {Math.round(teamMembers.reduce((acc, m) => acc + m.efficiency, 0) / teamMembers.length)}%
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-orange-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Active Cases</p>
                <p className="text-2xl font-bold text-gray-900">
                  {teamMembers.reduce((acc, m) => acc + m.activeIncorporations, 0)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Team Directory</h2>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search team members..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-3 py-2 border border-gray-300 rounded-lg w-64"
                />
              </div>
              <select 
                value={filterOffice}
                onChange={(e) => setFilterOffice(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="all">All Offices</option>
                <option value="peru">Peru</option>
                <option value="mexico">Mexico</option>
                <option value="colombia">Colombia</option>
              </select>
            </div>
          </div>
        </div>

        {/* Team Members Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredMembers.map(member => (
            <div key={member.id} className="bg-white rounded-xl shadow-sm border hover:shadow-md transition-shadow">
              {/* Member Header */}
              <div className="p-6 border-b">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      <div className="h-16 w-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold text-xl">{member.avatar}</span>
                      </div>
                      <div className={`absolute bottom-0 right-0 h-4 w-4 rounded-full border-2 border-white ${
                        member.status === 'available' ? 'bg-green-400' : 'bg-yellow-400'
                      }`} />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{member.name}</h3>
                      <p className="text-sm text-gray-500">{member.role}</p>
                      <div className="flex items-center space-x-1 mt-1">
                        <MapPin className="h-3 w-3 text-gray-400" />
                        <span className="text-xs text-gray-500">{member.office} Office</span>
                      </div>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    member.status === 'available' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {member.status}
                  </span>
                </div>
              </div>

              {/* Member Stats */}
              <div className="p-6">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900">{member.activeIncorporations}</p>
                    <p className="text-xs text-gray-500">Active Cases</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900">{member.completedThisMonth}</p>
                    <p className="text-xs text-gray-500">Completed MTD</p>
                  </div>
                </div>

                <div className="space-y-3 mb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Efficiency</span>
                    <span className="text-sm font-medium">{member.efficiency}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${member.efficiency}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Workload</span>
                    <span className="text-sm font-medium">{member.workload}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${
                        member.workload > 85 ? 'bg-red-500' : 
                        member.workload > 70 ? 'bg-yellow-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${member.workload}%` }}
                    />
                  </div>
                </div>

                {/* Contact Actions */}
                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="flex items-center space-x-2">
                    <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
                      <Mail className="h-4 w-4" />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg">
                      <Phone className="h-4 w-4" />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg">
                      <Calendar className="h-4 w-4" />
                    </button>
                  </div>
                  <button 
                    onClick={() => setSelectedMember(member)}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    View Details →
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredMembers.length === 0 && (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No team members found</h3>
            <p className="text-gray-500">Try adjusting your search criteria or filters.</p>
          </div>
        )}
      </main>

      {/* Member Detail Modal (simplified) */}
      {selectedMember && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold">Team Member Details</h3>
                <button 
                  onClick={() => setSelectedMember(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="text-center mb-6">
                <div className="h-20 w-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-white font-bold text-2xl">{selectedMember.avatar}</span>
                </div>
                <h4 className="text-xl font-semibold text-gray-900">{selectedMember.name}</h4>
                <p className="text-gray-500">{selectedMember.role}</p>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h5 className="font-medium text-gray-900 mb-2">Contact Information</h5>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                    <p className="text-sm"><span className="font-medium">Email:</span> {selectedMember.email}</p>
                    <p className="text-sm"><span className="font-medium">Phone:</span> {selectedMember.phone}</p>
                    <p className="text-sm"><span className="font-medium">Office:</span> {selectedMember.office}</p>
                  </div>
                </div>
                
                <div>
                  <h5 className="font-medium text-gray-900 mb-2">Specializations</h5>
                  <div className="flex flex-wrap gap-2">
                    {selectedMember.specializations.map((spec, idx) => (
                      <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                        {spec}
                      </span>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h5 className="font-medium text-gray-900 mb-2">Languages</h5>
                  <div className="flex flex-wrap gap-2">
                    {selectedMember.languages.map((lang, idx) => (
                      <span key={idx} className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                        {lang}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
} 