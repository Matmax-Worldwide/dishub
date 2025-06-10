'use client';

import { useState } from 'react';
import { 
  Search, 
  Filter, 
  Send, 
  User, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Calendar,
  MoreVertical,
  Plus,
  FileText,
  MessageSquare,
  Paperclip,
  Flag,
  Eye,
  Edit,
  Star,
  Archive,
  Trash2,
  Users,
  ChevronDown,
  ChevronRight,
  Target,
  BarChart3,
  Timer,
  MapPin,
  Building2,
  CheckSquare,
  Circle,
  PlayCircle,
  PauseCircle,
  XCircle,
  RotateCcw,
  TrendingUp,
  Globe
} from 'lucide-react';

// Comprehensive Legal Case Management Data
const incorporationProjects = [
  {
    id: 'INC-2024-015',
    clientName: 'TechVenture Solutions',
    companyName: 'TechVenture Peru S.A.C.',
    country: 'Peru',
    flag: '🇵🇪',
    type: 'S.A.C.',
    status: 'in-progress',
    priority: 'high',
    startDate: '2024-01-15',
    targetDate: '2024-02-28',
    progress: 75,
    assignedLead: { name: 'Carlos Mendoza', id: 1, avatar: 'CM' },
    client: { name: 'Maria Rodriguez', email: 'maria@techventure.pe' },
    value: 12500,
    stage: 'documentation-review'
  },
  {
    id: 'INC-2024-032',
    clientName: 'TechVenture Solutions',
    companyName: 'TechVenture Mexico S.A. de C.V.',
    country: 'Mexico',
    flag: '🇲🇽',
    type: 'S.A. de C.V.',
    status: 'completed',
    priority: 'medium',
    startDate: '2024-01-10',
    targetDate: '2024-02-15',
    completedDate: '2024-02-15',
    progress: 100,
    assignedLead: { name: 'Miguel Santos', id: 2, avatar: 'MS' },
    client: { name: 'Maria Rodriguez', email: 'maria@techventure.pe' },
    value: 15200,
    stage: 'completed'
  },
  {
    id: 'INC-2024-048',
    clientName: 'TechVenture Solutions',
    companyName: 'TechVenture Colombia S.A.S.',
    country: 'Colombia',
    flag: '🇨🇴',
    type: 'S.A.S.',
    status: 'in-progress',
    priority: 'high',
    startDate: '2024-02-01',
    targetDate: '2024-03-15',
    progress: 65,
    assignedLead: { name: 'Diana Castro', id: 3, avatar: 'DC' },
    client: { name: 'Maria Rodriguez', email: 'maria@techventure.pe' },
    value: 4900,
    stage: 'final-documents'
  }
];

const tasks = [
  // Peru Project Tasks
  {
    id: 1,
    title: 'Review final incorporation documents',
    description: 'Complete final review of Articles of Incorporation and shareholder agreements for TechVenture Peru S.A.C.',
    projectId: 'INC-2024-015',
    project: 'TechVenture Peru S.A.C.',
    assignedTo: { name: 'Carlos Mendoza', avatar: 'CM', id: 1 },
    assignedBy: { name: 'Senior Partner', avatar: 'SP' },
    priority: 'high',
    status: 'in-progress',
    stage: 'legal-review',
    dueDate: '2024-02-25',
    createdAt: '2024-02-20',
    timeEstimate: '4 hours',
    timeSpent: '2.5 hours',
    progress: 60,
    tags: ['legal-review', 'articles', 'urgent'],
    attachments: ['Articles_Final_Draft.pdf', 'Shareholder_Agreement.pdf'],
    comments: 3,
    dependencies: [],
    checklist: [
      { item: 'Review capital structure', completed: true },
      { item: 'Verify shareholder details', completed: true },
      { item: 'Check compliance requirements', completed: false },
      { item: 'Final legal review', completed: false }
    ]
  },
  {
    id: 2,
    title: 'Prepare SUNARP filing documents',
    description: 'Prepare and compile all required documents for SUNARP public registry filing',
    projectId: 'INC-2024-015',
    project: 'TechVenture Peru S.A.C.',
    assignedTo: { name: 'Ana Torres', avatar: 'AT', id: 4 },
    assignedBy: { name: 'Carlos Mendoza', avatar: 'CM' },
    priority: 'high',
    status: 'pending',
    stage: 'documentation',
    dueDate: '2024-02-26',
    createdAt: '2024-02-21',
    timeEstimate: '3 hours',
    timeSpent: '0 hours',
    progress: 0,
    tags: ['sunarp', 'filing', 'documentation'],
    attachments: ['SUNARP_Checklist.pdf'],
    comments: 1,
    dependencies: [1],
    checklist: [
      { item: 'Collect all incorporation documents', completed: false },
      { item: 'Prepare SUNARP forms', completed: false },
      { item: 'Schedule filing appointment', completed: false }
    ]
  },
  // Colombia Project Tasks
  {
    id: 3,
    title: 'Client signature collection - Final documents',
    description: 'Coordinate with client to obtain digital signatures on final incorporation documents',
    projectId: 'INC-2024-048',
    project: 'TechVenture Colombia S.A.S.',
    assignedTo: { name: 'Diana Castro', avatar: 'DC', id: 3 },
    assignedBy: { name: 'Lead Partner', avatar: 'LP' },
    priority: 'high',
    status: 'waiting-client',
    stage: 'client-action',
    dueDate: '2024-02-25',
    createdAt: '2024-02-22',
    timeEstimate: '1 hour',
    timeSpent: '0.5 hours',
    progress: 50,
    tags: ['client-signatures', 'urgent', 'colombia'],
    attachments: ['Colombia_Final_Articles.pdf', 'Signature_Instructions.pdf'],
    comments: 2,
    dependencies: [],
    checklist: [
      { item: 'Send documents to client', completed: true },
      { item: 'Schedule signature meeting', completed: false },
      { item: 'Collect signed documents', completed: false }
    ]
  },
  {
    id: 4,
    title: 'Chamber of Commerce registration',
    description: 'Submit incorporation documents to Colombian Chamber of Commerce',
    projectId: 'INC-2024-048',
    project: 'TechVenture Colombia S.A.S.',
    assignedTo: { name: 'Luis Rodriguez', avatar: 'LR', id: 5 },
    assignedBy: { name: 'Diana Castro', avatar: 'DC' },
    priority: 'medium',
    status: 'pending',
    stage: 'government-filing',
    dueDate: '2024-03-01',
    createdAt: '2024-02-20',
    timeEstimate: '2 hours',
    timeSpent: '0 hours',
    progress: 0,
    tags: ['chamber-commerce', 'filing', 'colombia'],
    attachments: [],
    comments: 0,
    dependencies: [3],
    checklist: [
      { item: 'Prepare filing documents', completed: false },
      { item: 'Submit to Chamber of Commerce', completed: false },
      { item: 'Track filing status', completed: false }
    ]
  },
  // Completed Tasks
  {
    id: 5,
    title: 'Mexico banking account setup',
    description: 'Coordinate corporate banking account setup with Banco Santander Mexico',
    projectId: 'INC-2024-032',
    project: 'TechVenture Mexico S.A. de C.V.',
    assignedTo: { name: 'Miguel Santos', avatar: 'MS', id: 2 },
    assignedBy: { name: 'Banking Team', avatar: 'BT' },
    priority: 'medium',
    status: 'completed',
    stage: 'banking',
    dueDate: '2024-02-20',
    createdAt: '2024-02-15',
    completedAt: '2024-02-21',
    timeEstimate: '3 hours',
    timeSpent: '2.5 hours',
    progress: 100,
    tags: ['banking', 'mexico', 'completed'],
    attachments: ['Bank_Account_Confirmation.pdf'],
    comments: 4,
    dependencies: [],
    checklist: [
      { item: 'Contact bank representative', completed: true },
      { item: 'Submit required documentation', completed: true },
      { item: 'Account activation', completed: true }
    ]
  }
];

const teamMembers = [
  { 
    id: 1, 
    name: 'Carlos Mendoza', 
    avatar: 'CM', 
    role: 'Senior Legal Advisor', 
    department: 'Peru Office',
    workload: 85,
    activeTasks: 3,
    completedThisWeek: 5,
    efficiency: 92,
    specializations: ['Corporate Law', 'Peru Regulations', 'SUNARP']
  },
  { 
    id: 2, 
    name: 'Miguel Santos', 
    avatar: 'MS', 
    role: 'Legal Analyst', 
    department: 'Mexico Office',
    workload: 70,
    activeTasks: 2,
    completedThisWeek: 8,
    efficiency: 88,
    specializations: ['Mexico Incorporation', 'SAT Filing', 'Banking']
  },
  { 
    id: 3, 
    name: 'Diana Castro', 
    avatar: 'DC', 
    role: 'Legal Analyst', 
    department: 'Colombia Office',
    workload: 75,
    activeTasks: 4,
    completedThisWeek: 6,
    efficiency: 95,
    specializations: ['Colombia Law', 'S.A.S. Formation', 'Chamber Commerce']
  },
  { 
    id: 4, 
    name: 'Ana Torres', 
    avatar: 'AT', 
    role: 'Junior Associate', 
    department: 'Peru Office',
    workload: 60,
    activeTasks: 2,
    completedThisWeek: 4,
    efficiency: 82,
    specializations: ['Documentation', 'Filing', 'Client Communication']
  },
  { 
    id: 5, 
    name: 'Luis Rodriguez', 
    avatar: 'LR', 
    role: 'Legal Assistant', 
    department: 'Colombia Office',
    workload: 45,
    activeTasks: 1,
    completedThisWeek: 3,
    efficiency: 78,
    specializations: ['Administrative', 'Government Filing', 'Documentation']
  }
];

export default function TaskDelegationPage() {
  const [view, setView] = useState('board'); // 'board', 'list', 'timeline', 'kanban'
  const [selectedPriority, setSelectedPriority] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedAssignee, setSelectedAssignee] = useState('all');
  const [selectedProject, setSelectedProject] = useState('all');
  const [showNewTaskModal, setShowNewTaskModal] = useState(false);
  const [expandedTasks, setExpandedTasks] = useState<Set<number>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTasks = tasks.filter(task => {
    if (selectedPriority !== 'all' && task.priority !== selectedPriority) return false;
    if (selectedStatus !== 'all' && task.status !== selectedStatus) return false;
    if (selectedAssignee !== 'all' && task.assignedTo.id !== parseInt(selectedAssignee)) return false;
    if (selectedProject !== 'all' && task.projectId !== selectedProject) return false;
    if (searchQuery && !task.title.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !task.description.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-700 border-green-200';
      case 'in-progress': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'pending': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'waiting-client': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'blocked': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return CheckCircle2;
      case 'in-progress': return PlayCircle;
      case 'pending': return Circle;
      case 'waiting-client': return PauseCircle;
      case 'blocked': return XCircle;
      default: return Circle;
    }
  };

  const toggleTaskExpansion = (taskId: number) => {
    const newExpanded = new Set(expandedTasks);
    if (newExpanded.has(taskId)) {
      newExpanded.delete(taskId);
    } else {
      newExpanded.add(taskId);
    }
    setExpandedTasks(newExpanded);
  };

  const getTasksByStatus = () => {
    const statuses = ['pending', 'in-progress', 'waiting-client', 'blocked', 'completed'];
    return statuses.map(status => ({
      status,
      tasks: filteredTasks.filter(task => task.status === status),
      count: filteredTasks.filter(task => task.status === status).length
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header with enhanced controls */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Legal Task Management</h1>
          <p className="text-sm text-gray-500">Complete legal project management for incorporation cases</p>
        </div>
        <div className="flex items-center space-x-3">
          {/* View Toggle */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setView('board')}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                view === 'board' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <BarChart3 className="h-4 w-4 inline mr-1" />
              Board
            </button>
            <button
              onClick={() => setView('list')}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                view === 'list' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <FileText className="h-4 w-4 inline mr-1" />
              List
            </button>
          </div>
          <button 
            onClick={() => setShowNewTaskModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>New Task</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center">
            <Send className="h-8 w-8 text-blue-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Active Tasks</p>
              <p className="text-2xl font-bold text-gray-900">
                {tasks.filter(t => t.status !== 'completed').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center">
            <Clock className="h-8 w-8 text-orange-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">In Progress</p>
              <p className="text-2xl font-bold text-gray-900">
                {tasks.filter(t => t.status === 'in-progress').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center">
            <AlertCircle className="h-8 w-8 text-red-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Blocked</p>
              <p className="text-2xl font-bold text-gray-900">
                {tasks.filter(t => t.status === 'blocked').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center">
            <CheckCircle2 className="h-8 w-8 text-green-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Completed Today</p>
              <p className="text-2xl font-bold text-gray-900">2</p>
            </div>
          </div>
        </div>
      </div>

      {/* Team Workload Overview */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Team Workload</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {teamMembers.map((member) => (
            <div key={member.id} className="border rounded-lg p-4">
              <div className="flex items-center space-x-3 mb-3">
                <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-medium text-sm">{member.avatar}</span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">{member.name}</p>
                  <p className="text-sm text-gray-500">{member.role}</p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Workload</span>
                  <span className="font-medium">{member.workload}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      member.workload > 80 ? 'bg-red-500' : 
                      member.workload > 60 ? 'bg-yellow-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${member.workload}%` }}
                  ></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Project Overview Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {incorporationProjects.map((project) => (
          <div key={project.id} className="bg-white rounded-xl shadow-sm border-l-4 border-blue-500 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">{project.flag}</span>
                <div>
                  <h3 className="font-semibold text-gray-800">{project.companyName}</h3>
                  <p className="text-sm text-gray-500">{project.type} • {project.country}</p>
                </div>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                {project.status.replace('-', ' ')}
              </span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Progress</span>
                <span className="font-medium">{project.progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full"
                  style={{ width: `${project.progress}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-2">
                <span>Lead: {project.assignedLead.name}</span>
                <span>${project.value.toLocaleString()}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Enhanced Filters */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <h2 className="text-lg font-semibold text-gray-800">Legal Tasks & Activities</h2>
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
              />
            </div>
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="all">All Projects</option>
              {incorporationProjects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.companyName}
                </option>
              ))}
            </select>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="in-progress">In Progress</option>
              <option value="waiting-client">Waiting Client</option>
              <option value="blocked">Blocked</option>
              <option value="completed">Completed</option>
            </select>
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="all">All Priorities</option>
              <option value="high">High Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="low">Low Priority</option>
            </select>
            <select
              value={selectedAssignee}
              onChange={(e) => setSelectedAssignee(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="all">All Team Members</option>
              {teamMembers.map((member) => (
                <option key={member.id} value={member.id.toString()}>
                  {member.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Task Management Board */}
      {view === 'board' ? (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {getTasksByStatus().map(({ status, tasks, count }) => (
            <div key={status} className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-700 capitalize">
                  {status.replace('-', ' ')} ({count})
                </h3>
                <div className={`w-3 h-3 rounded-full ${
                  status === 'completed' ? 'bg-green-500' :
                  status === 'in-progress' ? 'bg-blue-500' :
                  status === 'waiting-client' ? 'bg-orange-500' :
                  status === 'blocked' ? 'bg-red-500' :
                  'bg-yellow-500'
                }`}></div>
              </div>
              <div className="space-y-3">
                {tasks.map((task) => {
                  const StatusIcon = getStatusIcon(task.status);
                  const isExpanded = expandedTasks.has(task.id);
                  return (
                    <div key={task.id} className="bg-white rounded-lg border p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <div className={`w-2 h-2 rounded-full ${getPriorityColor(task.priority)}`}></div>
                          <span className="text-xs text-gray-500 uppercase font-medium">{task.projectId}</span>
                        </div>
                        <button
                          onClick={() => toggleTaskExpansion(task.id)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        </button>
                      </div>
                      
                      <h4 className="font-medium text-gray-900 mb-2 line-clamp-2">{task.title}</h4>
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">{task.description}</p>
                      
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <div className="h-6 w-6 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                            <span className="text-white font-medium text-xs">{task.assignedTo.avatar}</span>
                          </div>
                          <span className="text-xs text-gray-600">{task.assignedTo.name}</span>
                        </div>
                        <div className="flex items-center space-x-1 text-xs text-gray-500">
                          <Calendar className="h-3 w-3" />
                          <span>{new Date(task.dueDate).toLocaleDateString()}</span>
                        </div>
                      </div>

                      {task.progress !== undefined && task.status === 'in-progress' && (
                        <div className="mb-3">
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-gray-600">Progress</span>
                            <span className="font-medium">{task.progress}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-1.5">
                            <div
                              className="bg-blue-500 h-1.5 rounded-full"
                              style={{ width: `${task.progress}%` }}
                            ></div>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center space-x-1 text-gray-500">
                          <Timer className="h-3 w-3" />
                          <span>{task.timeEstimate}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          {task.attachments && task.attachments.length > 0 && (
                            <div className="flex items-center space-x-1 text-gray-500">
                              <Paperclip className="h-3 w-3" />
                              <span>{task.attachments.length}</span>
                            </div>
                          )}
                          {task.comments > 0 && (
                            <div className="flex items-center space-x-1 text-gray-500">
                              <MessageSquare className="h-3 w-3" />
                              <span>{task.comments}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="mt-4 pt-4 border-t space-y-3">
                          {/* Tags */}
                          <div className="flex flex-wrap gap-1">
                            {task.tags.map((tag) => (
                              <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                                {tag}
                              </span>
                            ))}
                          </div>

                          {/* Checklist */}
                          <div className="space-y-2">
                            <h5 className="text-xs font-medium text-gray-700">Checklist:</h5>
                            {task.checklist.map((item, index) => (
                              <div key={index} className="flex items-center space-x-2 text-xs">
                                <div className={`w-3 h-3 rounded border flex items-center justify-center ${
                                  item.completed ? 'bg-green-500 border-green-500' : 'border-gray-300'
                                }`}>
                                  {item.completed && <CheckSquare className="h-2 w-2 text-white" />}
                                </div>
                                <span className={item.completed ? 'line-through text-gray-500' : 'text-gray-700'}>
                                  {item.item}
                                </span>
                              </div>
                            ))}
                          </div>

                          {/* Dependencies */}
                          {task.dependencies.length > 0 && (
                            <div className="space-y-1">
                              <h5 className="text-xs font-medium text-gray-700">Dependencies:</h5>
                              <div className="flex items-center space-x-1 text-xs text-orange-600">
                                <AlertCircle className="h-3 w-3" />
                                <span>Waiting for {task.dependencies.length} task(s)</span>
                              </div>
                            </div>
                          )}

                          {/* Time tracking */}
                          <div className="flex justify-between text-xs text-gray-500">
                            <span>Estimated: {task.timeEstimate}</span>
                            <span>Spent: {task.timeSpent}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
                {tasks.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Circle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No tasks in this status</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* List View */
        <div className="bg-white rounded-xl shadow-sm">
          <div className="divide-y divide-gray-200">
            {filteredTasks.map((task) => {
              const StatusIcon = getStatusIcon(task.status);
              const isExpanded = expandedTasks.has(task.id);
              return (
                <div key={task.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                      <div className={`p-2 rounded-lg border ${getStatusColor(task.status)}`}>
                        <StatusIcon className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="font-medium text-gray-900">{task.title}</h3>
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">{task.projectId}</span>
                          <div className="flex items-center space-x-2">
                            <div className={`w-2 h-2 rounded-full ${getPriorityColor(task.priority)}`}></div>
                            <span className="text-xs text-gray-500 capitalize">{task.priority} priority</span>
                          </div>
                        </div>
                        <p className="text-gray-600 mb-3">{task.description}</p>
                        <div className="flex items-center space-x-6 text-sm text-gray-500 mb-3">
                          <div className="flex items-center space-x-1">
                            <User className="h-4 w-4" />
                            <span>{task.assignedTo.name}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Calendar className="h-4 w-4" />
                            <span>Due {new Date(task.dueDate).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Timer className="h-4 w-4" />
                            <span>{task.timeEstimate}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Building2 className="h-4 w-4" />
                            <span>{task.project}</span>
                          </div>
                          {task.attachments && task.attachments.length > 0 && (
                            <div className="flex items-center space-x-1">
                              <Paperclip className="h-4 w-4" />
                              <span>{task.attachments.length} files</span>
                            </div>
                          )}
                          {task.comments > 0 && (
                            <div className="flex items-center space-x-1">
                              <MessageSquare className="h-4 w-4" />
                              <span>{task.comments} comments</span>
                            </div>
                          )}
                        </div>
                        {task.status === 'in-progress' && (
                          <div className="mb-3">
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-gray-600">Progress</span>
                              <span className="font-medium">{task.progress}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-blue-500 h-2 rounded-full"
                                style={{ width: `${task.progress}%` }}
                              ></div>
                            </div>
                          </div>
                        )}
                        <div className="flex flex-wrap gap-1">
                          {task.tags.map((tag) => (
                            <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => toggleTaskExpansion(task.id)}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                      >
                        {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      </button>
                      <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
                        <MoreVertical className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  
                  {isExpanded && (
                    <div className="mt-4 ml-16 pt-4 border-t space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h5 className="text-sm font-medium text-gray-700 mb-2">Checklist Progress:</h5>
                          <div className="space-y-2">
                            {task.checklist.map((item, index) => (
                              <div key={index} className="flex items-center space-x-2 text-sm">
                                <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                                  item.completed ? 'bg-green-500 border-green-500' : 'border-gray-300'
                                }`}>
                                  {item.completed && <CheckSquare className="h-3 w-3 text-white" />}
                                </div>
                                <span className={item.completed ? 'line-through text-gray-500' : 'text-gray-700'}>
                                  {item.item}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div>
                          <h5 className="text-sm font-medium text-gray-700 mb-2">Time Tracking:</h5>
                          <div className="space-y-1 text-sm text-gray-600">
                            <div className="flex justify-between">
                              <span>Estimated:</span>
                              <span>{task.timeEstimate}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Time Spent:</span>
                              <span>{task.timeSpent}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Stage:</span>
                              <span className="capitalize">{task.stage?.replace('-', ' ')}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {task.dependencies.length > 0 && (
                        <div>
                          <h5 className="text-sm font-medium text-gray-700 mb-2">Dependencies:</h5>
                          <div className="flex items-center space-x-2 text-sm text-orange-600">
                            <AlertCircle className="h-4 w-4" />
                            <span>This task depends on {task.dependencies.length} other task(s)</span>
                          </div>
                        </div>
                      )}

                      {task.attachments && task.attachments.length > 0 && (
                        <div>
                          <h5 className="text-sm font-medium text-gray-700 mb-2">Attachments:</h5>
                          <div className="space-y-1">
                            {task.attachments.map((file, index) => (
                              <div key={index} className="flex items-center space-x-2 text-sm text-gray-600">
                                <FileText className="h-4 w-4" />
                                <span>{file}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
} 