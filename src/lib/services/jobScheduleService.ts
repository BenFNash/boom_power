import { supabase } from '../supabase';
import { JobTemplate, JobSchedule, ScheduledJobInstance, FrequencyType } from '../../types';

export const jobScheduleService = {
  // Job Templates
  async getJobTemplates(includeInactive = false) {
    const query = supabase
      .from('job_templates')
      .select(`
        *,
        sites!inner(site_name),
        site_owner_company:companies!site_owner_company_id(
          id,
          company_name
        ),
        assigned_company:companies!assigned_company_id(
          id,
          company_name
        ),
        company_contacts!inner(contact_name)
      `);
    
    if (!includeInactive) {
      query.eq('active', true);
    }
    
    const { data, error } = await query.order('created_at', { ascending: false });
    
    if (error) throw error;
    
    return data.map(template => ({
      id: template.id,
      name: template.name,
      description: template.description,
      siteId: template.site_id,
      siteName: template.sites.site_name,
      siteOwnerCompanyId: template.site_owner_company_id,
      siteOwnerCompanyName: template.site_owner_company?.company_name,
      ticketType: template.ticket_type,
      priority: template.priority,
      assignedCompanyId: template.assigned_company_id,
      assignedCompanyName: template.assigned_company?.company_name,
      assignedContactId: template.assigned_contact_id,
      assignedContactName: template.company_contacts.contact_name,
      subjectTitle: template.subject_title,
      descriptionTemplate: template.description_template,
      estimatedDurationDays: template.estimated_duration_days,
      active: template.active,
      createdBy: template.created_by,
      createdAt: template.created_at,
      updatedAt: template.updated_at
    })) as JobTemplate[];
  },

  async createJobTemplate(template: Omit<JobTemplate, 'id' | 'createdAt' | 'updatedAt' | 'siteName' | 'siteOwnerCompanyName' | 'assignedCompanyName' | 'assignedContactName'>) {
    const { data, error } = await supabase
      .from('job_templates')
      .insert([{
        name: template.name,
        description: template.description,
        site_id: template.siteId,
        site_owner_company_id: template.siteOwnerCompanyId,
        ticket_type: template.ticketType,
        priority: template.priority,
        assigned_company_id: template.assignedCompanyId,
        assigned_contact_id: template.assignedContactId,
        subject_title: template.subjectTitle,
        description_template: template.descriptionTemplate,
        estimated_duration_days: template.estimatedDurationDays,
        active: template.active,
        created_by: template.createdBy
      }])
      .select(`
        *,
        sites!inner(site_name),
        site_owner_company:companies!site_owner_company_id(
          id,
          company_name
        ),
        assigned_company:companies!assigned_company_id(
          id,
          company_name
        ),
        company_contacts!inner(contact_name)
      `)
      .single();
    
    if (error) throw error;
    
    return {
      id: data.id,
      name: data.name,
      description: data.description,
      siteId: data.site_id,
      siteName: data.sites.site_name,
      siteOwnerCompanyId: data.site_owner_company_id,
      siteOwnerCompanyName: data.site_owner_company?.company_name,
      ticketType: data.ticket_type,
      priority: data.priority,
      assignedCompanyId: data.assigned_company_id,
      assignedCompanyName: data.assigned_company?.company_name,
      assignedContactId: data.assigned_contact_id,
      assignedContactName: data.company_contacts.contact_name,
      subjectTitle: data.subject_title,
      descriptionTemplate: data.description_template,
      estimatedDurationDays: data.estimated_duration_days,
      active: data.active,
      createdBy: data.created_by,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    } as JobTemplate;
  },

  async updateJobTemplate(id: string, template: Partial<JobTemplate>) {
    const updates: Record<string, any> = {};
    
    if (template.name) updates.name = template.name;
    if (template.description !== undefined) updates.description = template.description;
    if (template.siteId) updates.site_id = template.siteId;
    if (template.siteOwnerCompanyId) updates.site_owner_company_id = template.siteOwnerCompanyId;
    if (template.ticketType) updates.ticket_type = template.ticketType;
    if (template.priority) updates.priority = template.priority;
    if (template.assignedCompanyId) updates.assigned_company_id = template.assignedCompanyId;
    if (template.assignedContactId) updates.assigned_contact_id = template.assignedContactId;
    if (template.subjectTitle) updates.subject_title = template.subjectTitle;
    if (template.descriptionTemplate !== undefined) updates.description_template = template.descriptionTemplate;
    if (template.estimatedDurationDays) updates.estimated_duration_days = template.estimatedDurationDays;
    if (template.active !== undefined) updates.active = template.active;
    
    const { data, error } = await supabase
      .from('job_templates')
      .update(updates)
      .eq('id', id)
      .select(`
        *,
        sites!inner(site_name),
        site_owner_company:companies!site_owner_company_id(
          id,
          company_name
        ),
        assigned_company:companies!assigned_company_id(
          id,
          company_name
        ),
        company_contacts!inner(contact_name)
      `)
      .single();
    
    if (error) throw error;
    
    return {
      id: data.id,
      name: data.name,
      description: data.description,
      siteId: data.site_id,
      siteName: data.sites.site_name,
      siteOwnerCompanyId: data.site_owner_company_id,
      siteOwnerCompanyName: data.site_owner_company?.company_name,
      ticketType: data.ticket_type,
      priority: data.priority,
      assignedCompanyId: data.assigned_company_id,
      assignedCompanyName: data.assigned_company?.company_name,
      assignedContactId: data.assigned_contact_id,
      assignedContactName: data.company_contacts.contact_name,
      subjectTitle: data.subject_title,
      descriptionTemplate: data.description_template,
      estimatedDurationDays: data.estimated_duration_days,
      active: data.active,
      createdBy: data.created_by,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    } as JobTemplate;
  },

  // Job Schedules
  async getJobSchedules(includeInactive = false) {
    const query = supabase
      .from('job_schedules')
      .select(`
        *,
        job_templates!inner(name)
      `);
    
    if (!includeInactive) {
      query.eq('active', true);
    }
    
    const { data, error } = await query.order('created_at', { ascending: false });
    
    if (error) throw error;
    
    return data.map(schedule => ({
      id: schedule.id,
      jobTemplateId: schedule.job_template_id,
      templateName: schedule.job_templates.name,
      name: schedule.name,
      frequencyType: schedule.frequency_type as FrequencyType,
      frequencyValue: schedule.frequency_value,
      startDate: schedule.start_date,
      endDate: schedule.end_date,
      advanceNoticeDays: schedule.advance_notice_days,
      nextDueDate: schedule.next_due_date,
      active: schedule.active,
      createdBy: schedule.created_by,
      createdAt: schedule.created_at,
      updatedAt: schedule.updated_at
    })) as JobSchedule[];
  },

  async createJobSchedule(schedule: Omit<JobSchedule, 'id' | 'createdAt' | 'updatedAt' | 'templateName'>) {
    const { data, error } = await supabase
      .from('job_schedules')
      .insert([{
        job_template_id: schedule.jobTemplateId,
        name: schedule.name,
        frequency_type: schedule.frequencyType,
        frequency_value: schedule.frequencyValue,
        start_date: schedule.startDate,
        end_date: schedule.endDate,
        advance_notice_days: schedule.advanceNoticeDays,
        next_due_date: schedule.nextDueDate,
        active: schedule.active,
        created_by: schedule.createdBy
      }])
      .select(`
        *,
        job_templates!inner(name)
      `)
      .single();
    
    if (error) throw error;
    
    return {
      id: data.id,
      jobTemplateId: data.job_template_id,
      templateName: data.job_templates.name,
      name: data.name,
      frequencyType: data.frequency_type as FrequencyType,
      frequencyValue: data.frequency_value,
      startDate: data.start_date,
      endDate: data.end_date,
      advanceNoticeDays: data.advance_notice_days,
      nextDueDate: data.next_due_date,
      active: data.active,
      createdBy: data.created_by,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    } as JobSchedule;
  },

  async updateJobSchedule(id: string, schedule: Partial<JobSchedule>) {
    const updates: Record<string, any> = {};
    
    if (schedule.name) updates.name = schedule.name;
    if (schedule.frequencyType) updates.frequency_type = schedule.frequencyType;
    if (schedule.frequencyValue !== undefined) updates.frequency_value = schedule.frequencyValue;
    if (schedule.startDate) updates.start_date = schedule.startDate;
    if (schedule.endDate !== undefined) updates.end_date = schedule.endDate;
    if (schedule.advanceNoticeDays) updates.advance_notice_days = schedule.advanceNoticeDays;
    if (schedule.nextDueDate) updates.next_due_date = schedule.nextDueDate;
    if (schedule.active !== undefined) updates.active = schedule.active;
    
    const { data, error } = await supabase
      .from('job_schedules')
      .update(updates)
      .eq('id', id)
      .select(`
        *,
        job_templates!inner(name)
      `)
      .single();
    
    if (error) throw error;
    
    return {
      id: data.id,
      jobTemplateId: data.job_template_id,
      templateName: data.job_templates.name,
      name: data.name,
      frequencyType: data.frequency_type as FrequencyType,
      frequencyValue: data.frequency_value,
      startDate: data.start_date,
      endDate: data.end_date,
      advanceNoticeDays: data.advance_notice_days,
      nextDueDate: data.next_due_date,
      active: data.active,
      createdBy: data.created_by,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    } as JobSchedule;
  },

  // Scheduled Job Instances
  async getScheduledJobInstances() {
    const { data, error } = await supabase
      .from('scheduled_job_instances')
      .select(`
        *,
        job_schedules!inner(
          name,
          job_templates!inner(name)
        ),
        tickets(
          ticket_number,
          subject_title,
          status
        )
      `)
      .order('due_date', { ascending: false });
    
    if (error) throw error;
    
    return data.map(instance => ({
      id: instance.id,
      jobScheduleId: instance.job_schedule_id,
      ticketId: instance.ticket_id?.toString(),
      dueDate: instance.due_date,
      createdDate: instance.created_date,
      status: instance.status,
      createdAt: instance.created_at,
      schedule: {
        name: instance.job_schedules.name,
        templateName: instance.job_schedules.job_templates.name
      },
      ticket: instance.tickets ? {
        ticketNumber: instance.tickets.ticket_number,
        subject: instance.tickets.subject_title,
        status: instance.tickets.status
      } : undefined
    })) as ScheduledJobInstance[];
  },

  // Generate scheduled tickets
  async generateScheduledTickets() {
    const { data, error } = await supabase.rpc('generate_scheduled_tickets');
    
    if (error) throw error;
    
    return data as number; // Returns number of tickets created
  },

  // Calculate next due date
  async calculateNextDueDate(currentDate: string, frequencyType: FrequencyType, frequencyValue?: number) {
    const { data, error } = await supabase.rpc('calculate_next_due_date', {
      current_date: currentDate,
      frequency_type: frequencyType,
      frequency_value: frequencyValue
    });
    
    if (error) throw error;
    
    return data as string;
  }
};