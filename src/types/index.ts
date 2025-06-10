export interface TeamMember {
    id: number;
    name: string;
    role: string;
    avatar: string;
    activeIncorporations: number;
    completedThisMonth: number;
    efficiency: number;
    status: 'available' | 'busy';
    workload: number;
  }
  
  export interface Incorporation {
    id: number;
    companyName: string;
    client: string;
    type: string;
    status: 'in-progress' | 'pending-documents' | 'completed' | 'on-hold' | 'at-risk' | 'on-track';
    progress: number;
    startDate: string;
    expectedDate: string;
    assignedTeam: string[];
    leadAnalyst: string;
    currentStep: string;
    location: string;
    capital: string;
    priority: 'critical' | 'high' | 'medium' | 'low';
    lastUpdate: string;
    blockers: string[];
    clientSatisfaction: number;
  }
  
  export interface PerformanceMetrics {
    overall: {
      incorporationsCompleted: number;
      averageTimeToComplete: number;
      clientSatisfaction: number;
      onTimeDelivery: number;
    };
    byOffice: {
      [key: string]: {
        active: number;
        completed: number;
        efficiency: number;
      };
    };
  }
  
  export interface NavigationItem {
    id: string;
    label: string;
    icon: React.ElementType;
    href: string;
    badge?: string;
    badgeColor?: string;
  }

  export interface NavigationSection {
    section: string;
    title?: string;
    items: NavigationItem[];
  }
  
  export interface Office {
    id: string;
    label: string;
    flag: string;
  }
  
  export interface Metric {
    label: string;
    value: string;
    change: string;
    trend: 'up' | 'down';
    icon: React.ElementType;
    alert?: boolean;
  } 