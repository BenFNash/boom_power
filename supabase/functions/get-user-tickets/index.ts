import { createClient } from 'npm:@supabase/supabase-js@2.39.7';
import { decode } from 'https://deno.land/x/djwt@v2.8/mod.ts';
import { corsHeaders } from '../_shared/cors.ts';


interface TicketFilters {
  status?: string;
  type?: string;
  site_id?: string;
  priority?: string;
  assigned_company_id?: string;
  site_owner_company_id?: string;
}

interface PaginationParams {
  page?: number;
  pageSize?: number;
}

interface GetTicketsRequest {
  filters?: TicketFilters;
  searchQuery?: string;
  pagination?: PaginationParams;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  try {
    // 1. Get and decode JWT
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('No authorization header');
    const jwt = authHeader.replace('Bearer ', '');
    const payload = decode(jwt)[1] as Record<string, unknown>;
    const userId = payload.sub as string;
    if (!userId) throw new Error('Invalid JWT: no user id');

    // 2. Use service role key for DB access
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 3. Get user profile and roles
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select(`
        id,
        email,
        company_id,
        user_roles!inner(
          roles!inner(
            role_name
          )
        )
      `)
      .eq('id', userId)
      .single();
    if (profileError || !profile) throw new Error('User profile not found');

    const userRoles = profile.user_roles.map((ur: any) => ur.roles.role_name);
    const isAdmin = userRoles.includes('admin');
    const isEdit = userRoles.includes('edit');
    const isRead = userRoles.includes('read');
    const isExternal = userRoles.includes('external');

    // 4. Get request parameters
    const { filters, searchQuery, pagination }: GetTicketsRequest = await req.json();
    const page = pagination?.page || 1;
    const pageSize = pagination?.pageSize || 10;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    // 5. Build the base query (fetch all tickets needed for filtering)
    let query = supabase
      .from('tickets')
      .select(`
        *,
        sites!inner(
          id,
          site_name,
          site_owner_company_id
        ),
        profiles!inner(
          id,
          email,
          name
        ),
        companies:site_owner_company_id(
          id,
          company_name
        ),
        assigned_company:assigned_company_id(
          id,
          company_name
        ),
        company_contacts:assigned_contact_id(
          id,
          contact_name
        )
      `);

    // 6. Apply filters (except access control)
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) {
          if (key === 'status') {
            // We'll filter status in-memory below
          } else if (key === 'type') {
            // We'll filter type in-memory below
          } else {
            query = query.eq(key, value);
          }
        }
      });
    }

    // 7. Fetch all tickets (will filter in-memory for access control)
    const { data: tickets, error } = await query;
    if (error) throw error;

    // 8. Filter tickets in function code based on access control
    const accessibleTickets = tickets.filter((ticket: any) => {
      if (isAdmin || isEdit || isRead) {
        return true;
      } else if (isExternal) {
        return (
          ticket.site_owner_company_id === profile.company_id ||
          ticket.assigned_company_id === profile.company_id ||
          ticket.who_raised_id === profile.id
        );
      } else {
        return ticket.who_raised_id === profile.id;
      }
    });

    // 9. Apply status/type filters in-memory
    let filteredTickets = accessibleTickets;
    if (filters) {
      if (filters.status) {
        if (filters.status === 'open') {
          filteredTickets = filteredTickets.filter(t => ['open', 'assigned'].includes(t.status));
        } else if (filters.status === 'overdue') {
          const now = new Date();
          filteredTickets = filteredTickets.filter(t =>
            new Date(t.target_completion_date) < now &&
            ['open', 'assigned'].includes(t.status)
          );
        } else {
          filteredTickets = filteredTickets.filter(t => t.status === filters.status);
        }
      }
      if (filters.type) {
        filteredTickets = filteredTickets.filter(t => t.ticket_type.toLowerCase() === filters.type.toLowerCase());
      }
    }

    // 10. Apply search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filteredTickets = filteredTickets.filter(t =>
        (t.ticket_number && t.ticket_number.toLowerCase().includes(q)) ||
        (t.subject_title && t.subject_title.toLowerCase().includes(q)) ||
        (t.description && t.description.toLowerCase().includes(q))
      );
    }

    // 11. Pagination
    const count = filteredTickets.length;
    const paginatedTickets = filteredTickets.slice(from, to + 1);

    // 12. Transform for frontend
    const transformedTickets = paginatedTickets.map(ticket => ({
      id: ticket.id,
      ticketNumber: ticket.ticket_number,
      site: ticket.sites.site_name,
      siteOwnerCompany: ticket.companies?.company_name || '',
      type: ticket.ticket_type.toLowerCase(),
      priority: ticket.priority,
      dateRaised: ticket.date_raised,
      whoRaisedId: ticket.who_raised_id,
      whoRaised: ticket.profiles.email,
      targetCompletionDate: ticket.target_completion_date,
      companyToAssign: ticket.assigned_company?.company_name || '',
      companyContact: ticket.company_contacts?.contact_name || '',
      subject: ticket.subject_title,
      description: ticket.description || '',
      status: ticket.status,
      createdAt: ticket.created_at,
      updatedAt: ticket.updated_at
    }));

    return new Response(
      JSON.stringify({
        data: transformedTickets,
        count,
        page,
        pageSize,
        totalPages: Math.ceil(count / pageSize)
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'An error occurred' 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
}); 
