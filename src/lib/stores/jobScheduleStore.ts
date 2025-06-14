import { create } from 'zustand';
import { JobTemplate, JobSchedule, ScheduledJobInstance } from '../../types';
import { jobScheduleService } from '../services/jobScheduleService';

interface JobScheduleState {
  // Job Templates
  jobTemplates: JobTemplate[];
  jobSchedules: JobSchedule[];
  scheduledInstances: ScheduledJobInstance[];
  loading: boolean;
  error: string | null;
  
  // Job Template actions
  fetchJobTemplates: (includeInactive?: boolean) => Promise<void>;
  createJobTemplate: (template: Omit<JobTemplate, 'id' | 'createdAt' | 'updatedAt' | 'siteName' | 'siteOwnerName' | 'assignedCompanyName' | 'assignedContactName'>) => Promise<void>;
  updateJobTemplate: (id: string, template: Partial<JobTemplate>) => Promise<void>;
  
  // Job Schedule actions
  fetchJobSchedules: (includeInactive?: boolean) => Promise<void>;
  createJobSchedule: (schedule: Omit<JobSchedule, 'id' | 'createdAt' | 'updatedAt' | 'templateName'>) => Promise<void>;
  updateJobSchedule: (id: string, schedule: Partial<JobSchedule>) => Promise<void>;
  
  // Scheduled Instance actions
  fetchScheduledInstances: () => Promise<void>;
  generateScheduledTickets: () => Promise<number>;
}

export const useJobScheduleStore = create<JobScheduleState>((set) => ({
  jobTemplates: [],
  jobSchedules: [],
  scheduledInstances: [],
  loading: false,
  error: null,

  // Job Templates
  fetchJobTemplates: async (includeInactive = false) => {
    try {
      set({ loading: true, error: null });
      const templates = await jobScheduleService.getJobTemplates(includeInactive);
      set({ jobTemplates: templates, loading: false });
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },

  createJobTemplate: async (template) => {
    try {
      set({ loading: true, error: null });
      const newTemplate = await jobScheduleService.createJobTemplate(template);
      set(state => ({
        jobTemplates: [newTemplate, ...state.jobTemplates],
        loading: false
      }));
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
      throw error;
    }
  },

  updateJobTemplate: async (id, template) => {
    try {
      set({ loading: true, error: null });
      const updatedTemplate = await jobScheduleService.updateJobTemplate(id, template);
      set(state => ({
        jobTemplates: state.jobTemplates.map(t => t.id === id ? updatedTemplate : t),
        loading: false
      }));
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
      throw error;
    }
  },

  // Job Schedules
  fetchJobSchedules: async (includeInactive = false) => {
    try {
      set({ loading: true, error: null });
      const schedules = await jobScheduleService.getJobSchedules(includeInactive);
      set({ jobSchedules: schedules, loading: false });
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },

  createJobSchedule: async (schedule) => {
    try {
      set({ loading: true, error: null });
      const newSchedule = await jobScheduleService.createJobSchedule(schedule);
      set(state => ({
        jobSchedules: [newSchedule, ...state.jobSchedules],
        loading: false
      }));
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
      throw error;
    }
  },

  updateJobSchedule: async (id, schedule) => {
    try {
      set({ loading: true, error: null });
      const updatedSchedule = await jobScheduleService.updateJobSchedule(id, schedule);
      set(state => ({
        jobSchedules: state.jobSchedules.map(s => s.id === id ? updatedSchedule : s),
        loading: false
      }));
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
      throw error;
    }
  },

  // Scheduled Instances
  fetchScheduledInstances: async () => {
    try {
      set({ loading: true, error: null });
      const instances = await jobScheduleService.getScheduledJobInstances();
      set({ scheduledInstances: instances, loading: false });
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },

  generateScheduledTickets: async () => {
    try {
      set({ loading: true, error: null });
      const ticketsCreated = await jobScheduleService.generateScheduledTickets();
      set({ loading: false });
      return ticketsCreated;
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
      throw error;
    }
  }
}));