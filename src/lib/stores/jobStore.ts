import { create } from 'zustand';
import { Job, JobStatus } from '../../types';
import { jobService } from '../services/jobService';

interface JobCounts {
  total: number;
  pending: number;
  in_progress: number;
  completed: number;
  on_hold: number;
}

interface JobState {
  jobs: Job[];
  jobCounts: JobCounts;
  isLoading: boolean;
  error: string | null;
  fetchJobs: (filters?: Record<string, string>, searchQuery?: string, page?: number, pageSize?: number) => Promise<{ data: Job[]; count: number }>;
  fetchJobCounts: () => Promise<void>;
  createJob: (job: Omit<Job, 'id' | 'jobNumber' | 'createdAt' | 'updatedAt' | 'assignedToUserName' | 'assignedCompanyName' | 'ticket'>) => Promise<Job>;
  updateJob: (id: string, job: Partial<Job>) => Promise<void>;
  deleteJob: (id: string) => Promise<void>;
  createJobFromTicket: (ticketId: string, assignedToUserId: string, scheduledStartDate: string, scheduledEndDate: string) => Promise<Job>;
}

export const useJobStore = create<JobState>((set, get) => ({
  jobs: [],
  jobCounts: {
    total: 0,
    pending: 0,
    in_progress: 0,
    completed: 0,
    on_hold: 0
  },
  isLoading: false,
  error: null,

  fetchJobs: async (filters, searchQuery, page = 1, pageSize = 10) => {
    try {
      set({ isLoading: true, error: null });
      const response = await jobService.getJobs(filters, searchQuery, page, pageSize);
      set({ jobs: response.data, isLoading: false });
      return response;
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false, jobs: [] });
      throw error;
    }
  },

  fetchJobCounts: async () => {
    try {
      set({ isLoading: true, error: null });
      const counts = await jobService.getJobCounts();
      set({ jobCounts: counts, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  createJob: async (job) => {
    try {
      set({ isLoading: true, error: null });
      const newJob = await jobService.createJob(job);
      
      set(state => ({
        jobs: [newJob, ...state.jobs],
        isLoading: false,
        error: null
      }));

      // Refresh job counts
      await get().fetchJobCounts();
      return newJob;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred while creating the job';
      set({ 
        isLoading: false, 
        error: errorMessage 
      });
      throw error;
    }
  },

  updateJob: async (id: string, job: Partial<Job>) => {
    try {
      set({ isLoading: true, error: null });
      const updatedJob = await jobService.updateJob(id, job);
      
      set(state => ({
        jobs: state.jobs.map((j) => j.id === id ? updatedJob : j),
        isLoading: false,
        error: null
      }));

      // Refresh job counts
      await get().fetchJobCounts();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred while updating the job';
      set({ 
        isLoading: false, 
        error: errorMessage 
      });
      throw error;
    }
  },

  deleteJob: async (id: string) => {
    try {
      set({ isLoading: true, error: null });
      await jobService.deleteJob(id);
      
      set(state => ({
        jobs: state.jobs.filter((j) => j.id !== id),
        isLoading: false,
        error: null
      }));

      // Refresh job counts
      await get().fetchJobCounts();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred while deleting the job';
      set({ 
        isLoading: false, 
        error: errorMessage 
      });
      throw error;
    }
  },

  createJobFromTicket: async (ticketId: string, assignedToUserId: string, scheduledStartDate: string, scheduledEndDate: string) => {
    try {
      set({ isLoading: true, error: null });
      const newJob = await jobService.createJobFromTicket(ticketId, assignedToUserId, scheduledStartDate, scheduledEndDate);
      
      set(state => ({
        jobs: [newJob, ...state.jobs],
        isLoading: false,
        error: null
      }));

      // Refresh job counts
      await get().fetchJobCounts();
      return newJob;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred while creating the job from ticket';
      set({ 
        isLoading: false, 
        error: errorMessage 
      });
      throw error;
    }
  }
}));