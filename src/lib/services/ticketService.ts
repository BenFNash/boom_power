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

export const ticketService = {
  async getTicketCounts(): Promise<TicketCounts> {
    const { data: tickets, error } = await supabase
      .from('tickets')
      .select('status, target_completion_date');
      
    if (error) throw error;

    const now = new Date();
    return {
      total: tickets.length,
      open: tickets.filter(t => t.status === 'open').length,
      assigned: tickets.filter(t => t.status === 'assigned').length,
      resolved: tickets.filter(t => t.status === 'resolved').length,
      cancelled: tickets.filter(t => t.status === 'cancelled').length,
      closed: tickets.filter(t => t.status === 'closed').length,
      overdue: tickets.filter(t => 
        new Date(t.target_completion_date) < now && 
        (t.status === 'open' || t.status === 'assigned')
      ).length
    };
  },

  async getTickets(
    filters?: Record<string, string>, 
    searchQuery?: string,
    page: number = 1,
    pageSize: number = 10
  ): Promise<PaginatedResponse<Ticket>> {
    let query = supabase
      .from('tickets')
      .select(`
        *,
        sites!inner(
          site_name
        ),
        site_owners!inner(
          owner_name
        ),
        profiles!inner(
          id,
          name
        ),
        companies(
          company_name
        ),
        company_contacts(
          contact_name
        )
      `, { count: 'exact' });

    // Apply filters
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) {
          if (key === 'status') {
            if (value === 'open') {
              query = query.in('status', ['open', 'assigned']);
            } else if (value === 'overdue') {
              const now = new Date().toISOString();
              query = query
                .lt('target_completion_date', now)
                .in('status', ['open', 'assigned']);
            } else {
              query = query.eq('status', value);
            }
          } else if (key === 'type') {
            query = query.eq('ticket_type', value.charAt(0).toUpperCase() + value.slice(1));
          } else if (key === 'site_id') {
            query = query.eq('site_id', value);
          } else {
            query = query.eq(key, value);
          }
        }
      });
    }

    // Apply search
    if (searchQuery) {
      query = query.or(
        `ticket_number.ilike.%${searchQuery}%,` +
        `subject_title.ilike.%${searchQuery}%,` +
        `description.ilike.%${searchQuery}%`
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
      data: data.map(ticket => ({
        id: ticket.id,
        ticketNumber: ticket.ticket_number,
        site: ticket.sites.site_name,
        siteOwner: ticket.site_owners.owner_name,
        type: ticket.ticket_type.toLowerCase() as 'job' | 'fault',
        priority: ticket.priority,
        dateRaised: ticket.date_raised,
        whoRaisedId: ticket.who_raised_id,
        whoRaised: ticket.profiles.name,
        targetCompletionDate: ticket.target_completion_date,
        companyToAssign: ticket.companies?.company_name || '',
        companyContact: ticket.company_contacts?.contact_name || '',
        subject: ticket.subject_title,
        description: ticket.description || '',
        status: ticket.status,
        createdAt: ticket.created_at,
        updatedAt: ticket.updated_at
      })) as Ticket[],
      count: count || 0
    };
  },

  async getTicketById(id: string): Promise<Ticket> {
    const { data, error } = await supabase
      .from('tickets')
      .select(`
        *,
        sites!inner(
          site_name
        ),
        site_owners!inner(
          owner_name
        ),
        profiles!inner(
          id,
          name
        ),
        companies(
          company_name
        ),
        company_contacts(
          contact_name
        )
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    if (!data) throw new Error('Ticket not found');

    return {
      id: data.id,
      ticketNumber: data.ticket_number,
      site: data.sites.site_name,
      siteOwner: data.site_owners.owner_name,
      type: data.ticket_type.toLowerCase() as 'job' | 'fault',
      priority: data.priority,
      dateRaised: data.date_raised,
      whoRaisedId: data.profiles.id,
      whoRaised: data.profiles.name,
      targetCompletionDate: data.target_completion_date,
      companyToAssign: data.companies?.company_name || '',
      companyContact: data.company_contacts?.contact_name || '',
      subject: data.subject_title,
      description: data.description || '',
      status: data.status,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  },

  async createTicket(ticket: Omit<Ticket, 'id' | 'ticketNumber' | 'createdAt' | 'updatedAt'>): Promise<Ticket> {
    // Get IDs for related entities
    const [siteData, siteOwnerData, companyData, contactData] = await Promise.all([
      supabase.from('sites').select('id').eq('site_name', ticket.site).single(),
      supabase.from('site_owners').select('id').eq('owner_name', ticket.siteOwner).single(),
      ticket.companyToAssign ? supabase.from('companies').select('id').eq('company_name', ticket.companyToAssign).single() : null,
      ticket.companyContact ? supabase.from('company_contacts').select('id').eq('contact_name', ticket.companyContact).single() : null
    ]);

    if (!siteData?.data) throw new Error(`Site not found: ${ticket.site}`);
    if (!siteOwnerData?.data) throw new Error(`Site owner not found: ${ticket.siteOwner}`);

    const { data, error } = await supabase
      .from('tickets')
      .insert([{
        site_id: siteData.data.id,
        site_owner_id: siteOwnerData.data.id,
        ticket_type: ticket.type.charAt(0).toUpperCase() + ticket.type.slice(1),
        priority: ticket.priority,
        date_raised: ticket.dateRaised,
        who_raised_id: ticket.whoRaisedId,
        target_completion_date: ticket.targetCompletionDate,
        assigned_company_id: companyData?.data?.id || null,
        assigned_contact_id: contactData?.data?.id || null,
        subject_title: ticket.subject,
        description: ticket.description,
        status: ticket.status || 'open'
      }])
      .select(`
        *,
        sites!inner(
          site_name
        ),
        site_owners!inner(
          owner_name
        ),
        profiles!inner(
          id,
          name
        ),
        companies(
          company_name
        ),
        company_contacts(
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
      siteOwner: data.site_owners.owner_name,
      type: data.ticket_type.toLowerCase() as 'job' | 'fault',
      priority: data.priority,
      dateRaised: data.date_raised,
      whoRaisedId: data.profiles.id,
      whoRaised: data.profiles.name,
      targetCompletionDate: data.target_completion_date,
      companyToAssign: data.companies?.company_name || '',
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

    if (ticket.siteOwner) {
      const { data, error } = await supabase.from('site_owners').select('id').eq('owner_name', ticket.siteOwner).single();
      if (error) throw new Error(`Site owner not found: ${ticket.siteOwner}`);
      updates.site_owner_id = data.id;
    }

    if (ticket.companyToAssign) {
      const { data, error } = await supabase.from('companies').select('id').eq('company_name', ticket.companyToAssign).single();
      if (error) throw new Error(`Company not found: ${ticket.companyToAssign}`);
      updates.assigned_company_id = data.id;
    }

    if (ticket.companyContact) {
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