import { Database } from './database';

export type Role = 'admin' | 'edit' | 'read' | 'external';

export interface User {
  id: string;
  email: string;
  name: string;
  firstName: string;
  lastName: string;
  roles: Role[];
  company?: string;
  createdAt: string;
}

export type TicketType = 'job' | 'fault';
export type TicketStatus =
  | 'open'
  | 'assigned'
  | 'resolved'
  | 'cancelled'
  | 'closed';
export type Priority = 'low' | 'medium' | 'high' | 'critical';

export interface Ticket {
  id: string;
  ticketNumber: string;
  site: string;
  siteOwnerCompany: string;
  siteOwnerCompanyId?: string;
  type: TicketType;
  priority: string;
  dateRaised: string;
  whoRaisedId: string;
  whoRaised: string;
  targetCompletionDate: string;
  companyToAssign: string;
  companyToAssignId?: string;
  companyContact: string;
  companyContactId?: string;
  subject: string;
  description: string;
  status: TicketStatus;
  createdAt: string;
  updatedAt: string;
}

export type JobStatus = 'pending' | 'in_progress' | 'completed' | 'on_hold';

export interface Job {
  id: string;
  ticketId: string;
  jobNumber: string;
  assignedToUserId: string;
  assignedToUserName: string;
  assignedCompanyId: string;
  assignedCompanyName: string;
  status: JobStatus;
  scheduledStartDate: string;
  scheduledEndDate: string;
  actualStartDate?: string;
  actualEndDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  // Related ticket information
  ticket?: {
    ticketNumber: string;
    subject: string;
    site: string;
    priority: string;
  };
}



export interface Company {
  id: string;
  companyName: string;
  active?: boolean;
  createdAt: string;
}

export interface Site {
  id: string;
  siteName: string;
  siteOwnerCompanyId: string;
  siteOwnerCompanyName?: string;
  active?: boolean;
  createdAt: string;
}

export interface CompanyContact {
  id: string;
  companyId: string;
  companyName: string;
  contactName: string;
  contactEmail: string;
  active: boolean;
  createdAt: string;
}

export interface DropdownItem {
  id: string;
  value: string;
  category: string;
  createdAt: string;
}

export interface SiteSettings {
  id: string;
  managementEmail: string;
  maxFileSize: number;
  createdAt: string;
  updatedAt: string;
}

// Job Schedule Types
export type FrequencyType =
  | 'monthly'
  | 'quarterly'
  | 'semi_annually'
  | 'annually'
  | 'custom';

export interface JobTemplate {
  id: string;
  name: string;
  description?: string;
  siteId: string;
  siteName: string;
  siteOwnerCompanyId: string;
  siteOwnerCompanyName: string;
  ticketType: 'Job' | 'Fault';
  priority: string;
  assignedCompanyId: string;
  assignedCompanyName: string;
  assignedContactId: string;
  assignedContactName: string;
  subjectTitle: string;
  descriptionTemplate?: string;
  estimatedDurationDays: number;
  active: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface JobSchedule {
  id: string;
  jobTemplateId: string;
  templateName: string;
  name: string;
  frequencyType: FrequencyType;
  frequencyValue?: number;
  startDate: string;
  endDate?: string;
  advanceNoticeDays: number;
  nextDueDate: string;
  active: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  template?: JobTemplate;
}

export interface ScheduledJobInstance {
  id: string;
  jobScheduleId: string;
  ticketId?: string;
  dueDate: string;
  createdDate: string;
  status: 'created' | 'completed' | 'cancelled';
  createdAt: string;
  schedule?: JobSchedule;
  ticket?: {
    ticketNumber: string;
    subject: string;
    status: TicketStatus;
  };
}
