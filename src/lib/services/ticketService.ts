import { supabase } from '../supabase';
import { Ticket } from '../../types';

interface TicketCounts {
  total: number;
  open: number;
  assigned: number;
  resolved: number;
  cancelled: number;
  closed: number;
  overdue: number;
}

interface PaginatedResponse<T> {
  data: T[];
  count: number;
}

interface EdgeFunctionResponse<T> {
  data: T[];
  count: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export const ticketService = {
  // New method using edge function for secure ticket access
  async getTickets(
    filters?: Record<string, string>, 
    searchQuery?: string,
    page: number = 1,
    pageSize: number = 10
  ): Promise<PaginatedResponse<Ticket>> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('No active session');
    }

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
    const response = await fetch(`${supabaseUrl}/functions/v1/get-user-tickets`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        filters,
        searchQuery,
        pagination: { page, pageSize }
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch tickets');
    }

    const result: EdgeFunctionResponse<Ticket> = await response.json();
    
    return {
      data: result.data,
      count: result.count
    };
  },

  // New method using edge function for secure individual ticket access
  async getTicketById(id: string): Promise<Ticket> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('No active session');
    }

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
    const response = await fetch(`${supabaseUrl}/functions/v1/get-ticket-by-id`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ ticketId: id }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch ticket');
    }

    const result = await response.json();
    return result.data;
  },

  // New method using edge function for secure ticket counts
  async getTicketCounts(): Promise<TicketCounts> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('No active session');
    }

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
    const response = await fetch(`${supabaseUrl}/functions/v1/get-ticket-counts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch ticket counts');
    }

    return await response.json();
  },

  async createTicket(ticket: Omit<Ticket, 'id' | 'ticketNumber' | 'createdAt' | 'updatedAt'>): Promise<Ticket> {
    // Get site ID
    const { data: siteData, error: siteError } = await supabase.from('sites').select('id').eq('site_name', ticket.site).single();
    if (siteError || !siteData) throw new Error(`Site not found: ${ticket.site}`);

    // Use provided IDs or fall back to name lookups for backward compatibility
    let siteOwnerCompanyId = ticket.siteOwnerCompanyId;
    let assignedCompanyId = ticket.companyToAssignId;

    if (!siteOwnerCompanyId && ticket.siteOwnerCompany) {
      const { data: ownerCompanyData, error: ownerCompanyError } = await supabase.from('companies').select('id').eq('company_name', ticket.siteOwnerCompany).single();
      if (ownerCompanyError || !ownerCompanyData) throw new Error(`Site owner company not found: ${ticket.siteOwnerCompany}`);
      siteOwnerCompanyId = ownerCompanyData.id;
    }

    if (!assignedCompanyId && ticket.companyToAssign) {
      const { data: companyData, error: companyError } = await supabase.from('companies').select('id').eq('company_name', ticket.companyToAssign).single();
      if (companyError || !companyData) throw new Error(`Company not found: ${ticket.companyToAssign}`);
      assignedCompanyId = companyData.id;
    }

    const { data, error } = await supabase
      .from('tickets')
      .insert([{
        site_id: siteData.id,
        site_owner_company_id: siteOwnerCompanyId,
        ticket_type: ticket.type.charAt(0).toUpperCase() + ticket.type.slice(1),
        priority: ticket.priority,
        date_raised: ticket.dateRaised,
        who_raised_id: ticket.whoRaisedId,
        target_completion_date: ticket.targetCompletionDate,
        assigned_company_id: assignedCompanyId || null,
        assigned_contact_id: ticket.companyContactId || null,
        subject_title: ticket.subject,
        description: ticket.description,
        status: ticket.status || 'open'
      }])
      .select(`
        *,
        sites!inner(
          site_name
        ),
        profiles!inner(
          id,
          name
        ),
        companies:site_owner_company_id(
          company_name
        ),
        assigned_company:assigned_company_id(
          company_name
        ),
        company_contacts:assigned_contact_id(
          contact_name
        )
      `)
      .single();

    if (error) throw error;
    if (!data) throw new Error('Failed to create ticket');

    return {
      id: data.id,
      ticketNumber: data.ticket_number,
      site: data.sites.site_name,
      siteOwnerCompany: data.companies?.company_name || '',
      type: data.ticket_type.toLowerCase() as 'job' | 'fault',
      priority: data.priority,
      dateRaised: data.date_raised,
      whoRaisedId: data.profiles.id,
      whoRaised: data.profiles.name,
      targetCompletionDate: data.target_completion_date,
      companyToAssign: data.assigned_company?.company_name || '',
      companyContact: data.company_contacts?.contact_name || '',
      subject: data.subject_title,
      description: data.description || '',
      status: data.status,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  },

  async updateTicket(id: string, ticket: Partial<Ticket>): Promise<Ticket> {
    const updates: Record<string, any> = {};

    if (ticket.site) {
      const { data, error } = await supabase.from('sites').select('id').eq('site_name', ticket.site).single();
      if (error) throw new Error(`Site not found: ${ticket.site}`);
      updates.site_id = data.id;
    }

    if (ticket.siteOwnerCompanyId) {
      updates.site_owner_company_id = ticket.siteOwnerCompanyId;
    } else if (ticket.siteOwnerCompany) {
      const { data, error } = await supabase.from('companies').select('id').eq('company_name', ticket.siteOwnerCompany).single();
      if (error) throw new Error(`Site owner company not found: ${ticket.siteOwnerCompany}`);
      updates.site_owner_company_id = data.id;
    }

    if (ticket.companyToAssignId) {
      updates.assigned_company_id = ticket.companyToAssignId;
    } else if (ticket.companyToAssign) {
      const { data, error } = await supabase.from('companies').select('id').eq('company_name', ticket.companyToAssign).single();
      if (error) throw new Error(`Company not found: ${ticket.companyToAssign}`);
      updates.assigned_company_id = data.id;
    }

    if (ticket.companyContactId) {
      updates.assigned_contact_id = ticket.companyContactId;
    } else if (ticket.companyContact) {
      const { data, error } = await supabase.from('company_contacts').select('id').eq('contact_name', ticket.companyContact).single();
      if (error) throw new Error(`Contact not found: ${ticket.companyContact}`);
      updates.assigned_contact_id = data.id;
    }

    // Map other fields
    if (ticket.type) updates.ticket_type = ticket.type.charAt(0).toUpperCase() + ticket.type.slice(1);
    if (ticket.priority) updates.priority = ticket.priority;
    if (ticket.dateRaised) updates.date_raised = ticket.dateRaised;
    if (ticket.whoRaisedId) updates.who_raised_id = ticket.whoRaisedId;
    if (ticket.targetCompletionDate) updates.target_completion_date = ticket.targetCompletionDate;
    if (ticket.subject) updates.subject_title = ticket.subject;
    if (ticket.description) updates.description = ticket.description;
    if (ticket.status) updates.status = ticket.status;

    const { error } = await supabase
      .from('tickets')
      .update(updates)
      .eq('id', id);

    if (error) throw error;
    return this.getTicketById(id);
  }
};
