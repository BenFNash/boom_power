import { supabase } from '../supabase';
import { Job, JobStatus } from '../../types';

interface JobCounts {
  total: number;
  pending: number;
  in_progress: number;
  completed: number;
  on_hold: number;
}

interface PaginatedResponse<T> {
  data: T[];
  count: number;
}

export const jobService = {
  async getJobCounts(): Promise<JobCounts> {
    const { data: jobs, error } = await supabase
      .from('jobs')
      .select('status');
      
    if (error) throw error;

    return {
      total: jobs.length,
      pending: jobs.filter(j => j.status === 'pending').length,
      in_progress: jobs.filter(j => j.status === 'in_progress').length,
      completed: jobs.filter(j => j.status === 'completed').length,
      on_hold: jobs.filter(j => j.status === 'on_hold').length,
    };
  },

  async getJobs(
    filters?: Record<string, string>, 
    searchQuery?: string,
    page: number = 1,
    pageSize: number = 10
  ): Promise<PaginatedResponse<Job>> {
    let query = supabase
      .from('jobs')
      .select(`
        *,
        assigned_user:profiles!jobs_assigned_to_user_id_fkey(
          id,
          name
        ),
        assigned_company:companies!jobs_assigned_company_id_fkey(
          id,
          company_name
        ),
        ticket:tickets!jobs_ticket_id_fkey(
          id,
          ticket_number,
          subject_title,
          sites!inner(site_name),
          priority
        )
      `, { count: 'exact' });

    // Apply filters
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) {
          if (key === 'status') {
            query = query.eq('status', value);
          } else if (key === 'assigned_company_id') {
            query = query.eq('assigned_company_id', value);
          } else if (key === 'assigned_to_user_id') {
            query = query.eq('assigned_to_user_id', value);
          } else {
            query = query.eq(key, value);
          }
        }
      });
    }

    // Apply search
    if (searchQuery) {
      query = query.or(
        `job_number.ilike.%${searchQuery}%,` +
        `notes.ilike.%${searchQuery}%`
      );
    }

    // Apply pagination and ordering
    if (page && pageSize) {
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);
    }

    query = query.order('created_at', { ascending: false });

    const { data, error, count } = await query;

    if (error) throw error;

    return {
      data: data.map(job => ({
        id: job.id,
        ticketId: job.ticket_id.toString(),
        jobNumber: job.job_number,
        assignedToUserId: job.assigned_to_user_id,
        assignedToUserName: job.assigned_user?.name || '',
        assignedCompanyId: job.assigned_company_id,
        assignedCompanyName: job.assigned_company?.company_name || '',
        status: job.status as JobStatus,
        scheduledStartDate: job.scheduled_start_date,
        scheduledEndDate: job.scheduled_end_date,
        actualStartDate: job.actual_start_date,
        actualEndDate: job.actual_end_date,
        notes: job.notes,
        createdAt: job.created_at,
        updatedAt: job.updated_at,
        ticket: job.ticket ? {
          ticketNumber: job.ticket.ticket_number,
          subject: job.ticket.subject_title,
          site: job.ticket.sites?.site_name || '',
          priority: job.ticket.priority
        } : undefined
      })) as Job[],
      count: count || 0
    };
  },

  async getJobById(id: string): Promise<Job> {
    const { data, error } = await supabase
      .from('jobs')
      .select(`
        *,
        assigned_user:profiles!jobs_assigned_to_user_id_fkey(
          id,
          name
        ),
        assigned_company:companies!jobs_assigned_company_id_fkey(
          id,
          company_name
        ),
        ticket:tickets!jobs_ticket_id_fkey(
          id,
          ticket_number,
          subject_title,
          sites!inner(site_name),
          priority
        )
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    if (!data) throw new Error('Job not found');

    return {
      id: data.id,
      ticketId: data.ticket_id.toString(),
      jobNumber: data.job_number,
      assignedToUserId: data.assigned_to_user_id,
      assignedToUserName: data.assigned_user?.name || '',
      assignedCompanyId: data.assigned_company_id,
      assignedCompanyName: data.assigned_company?.company_name || '',
      status: data.status as JobStatus,
      scheduledStartDate: data.scheduled_start_date,
      scheduledEndDate: data.scheduled_end_date,
      actualStartDate: data.actual_start_date,
      actualEndDate: data.actual_end_date,
      notes: data.notes,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      ticket: data.ticket ? {
        ticketNumber: data.ticket.ticket_number,
        subject: data.ticket.subject_title,
        site: data.ticket.sites?.site_name || '',
        priority: data.ticket.priority
      } : undefined
    };
  },

  async createJob(job: Omit<Job, 'id' | 'jobNumber' | 'createdAt' | 'updatedAt' | 'assignedToUserName' | 'assignedCompanyName' | 'ticket'>): Promise<Job> {
    const { data, error } = await supabase
      .from('jobs')
      .insert([{
        ticket_id: parseInt(job.ticketId),
        assigned_to_user_id: job.assignedToUserId,
        assigned_company_id: job.assignedCompanyId,
        status: job.status,
        scheduled_start_date: job.scheduledStartDate,
        scheduled_end_date: job.scheduledEndDate,
        actual_start_date: job.actualStartDate,
        actual_end_date: job.actualEndDate,
        notes: job.notes
      }])
      .select(`
        *,
        assigned_user:profiles!jobs_assigned_to_user_id_fkey(
          id,
          name
        ),
        assigned_company:companies!jobs_assigned_company_id_fkey(
          id,
          company_name
        ),
        ticket:tickets!jobs_ticket_id_fkey(
          id,
          ticket_number,
          subject_title,
          sites!inner(site_name),
          priority
        )
      `)
      .single();

    if (error) throw error;
    if (!data) throw new Error('Failed to create job');

    return {
      id: data.id,
      ticketId: data.ticket_id.toString(),
      jobNumber: data.job_number,
      assignedToUserId: data.assigned_to_user_id,
      assignedToUserName: data.assigned_user?.name || '',
      assignedCompanyId: data.assigned_company_id,
      assignedCompanyName: data.assigned_company?.company_name || '',
      status: data.status as JobStatus,
      scheduledStartDate: data.scheduled_start_date,
      scheduledEndDate: data.scheduled_end_date,
      actualStartDate: data.actual_start_date,
      actualEndDate: data.actual_end_date,
      notes: data.notes,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      ticket: data.ticket ? {
        ticketNumber: data.ticket.ticket_number,
        subject: data.ticket.subject_title,
        site: data.ticket.sites?.site_name || '',
        priority: data.ticket.priority
      } : undefined
    };
  },

  async updateJob(id: string, job: Partial<Job>): Promise<Job> {
    const updates: Record<string, any> = {};

    // Map fields to database column names
    if (job.assignedToUserId) updates.assigned_to_user_id = job.assignedToUserId;
    if (job.assignedCompanyId) updates.assigned_company_id = job.assignedCompanyId;
    if (job.status) updates.status = job.status;
    if (job.scheduledStartDate) updates.scheduled_start_date = job.scheduledStartDate;
    if (job.scheduledEndDate) updates.scheduled_end_date = job.scheduledEndDate;
    if (job.actualStartDate !== undefined) updates.actual_start_date = job.actualStartDate;
    if (job.actualEndDate !== undefined) updates.actual_end_date = job.actualEndDate;
    if (job.notes !== undefined) updates.notes = job.notes;

    const { error } = await supabase
      .from('jobs')
      .update(updates)
      .eq('id', id);

    if (error) throw error;
    return this.getJobById(id);
  },

  async deleteJob(id: string): Promise<void> {
    const { error } = await supabase
      .from('jobs')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async createJobFromTicket(ticketId: string, assignedToUserId: string, scheduledStartDate: string, scheduledEndDate: string): Promise<Job> {
    // Get ticket details first
    const { data: ticket, error: ticketError } = await supabase
      .from('tickets')
      .select(`
        id,
        assigned_company_id,
        companies!inner(company_name)
      `)
      .eq('id', ticketId)
      .single();

    if (ticketError) throw ticketError;
    if (!ticket) throw new Error('Ticket not found');

    return this.createJob({
      ticketId: ticketId,
      assignedToUserId,
      assignedCompanyId: ticket.assigned_company_id,
      status: 'pending',
      scheduledStartDate,
      scheduledEndDate,
      notes: ''
    });
  }
};