import { createClient } from 'npm:@supabase/supabase-js@2.39.7';
import { decode } from 'https://deno.land/x/djwt@v2.8/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

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

    // 4. Get ticket ID from request
    const { ticketId } = await req.json();
    if (!ticketId) throw new Error('Ticket ID is required');

    // 5. Fetch the ticket (service role, no RLS filtering)
    const { data: ticket, error } = await supabase
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
      `)
      .eq('id', ticketId)
      .single();
    if (error) throw error;
    if (!ticket) throw new Error('Ticket not found');

    // 6. Access control logic in function
    let canAccess = false;
    if (isAdmin || isEdit || isRead) {
      canAccess = true;
    } else if (isExternal) {
      canAccess = (
        ticket.site_owner_company_id === profile.company_id ||
        ticket.assigned_company_id === profile.company_id ||
        ticket.who_raised_id === profile.id
      );
    } else {
      canAccess = ticket.who_raised_id === profile.id;
    }
    if (!canAccess) throw new Error('Access denied');

    // 7. Transform for frontend
    const transformedTicket = {
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
    };

    return new Response(
      JSON.stringify({ data: transformedTicket }),
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