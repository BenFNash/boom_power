import { createClient } from 'npm:@supabase/supabase-js@2.39.7';
import { decode } from 'https://deno.land/x/djwt@v2.8/mod.ts';
import { corsHeaders } from '../_shared/cors.ts';

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

    // 4. Fetch all tickets (service role, no RLS filtering)
    const { data: tickets, error } = await supabase
      .from('tickets')
      .select(`
        id,
        status,
        target_completion_date,
        site_owner_company_id,
        assigned_company_id,
        who_raised_id
      `);
    if (error) throw error;

    // 5. Filter tickets in function code based on access control
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

    // 6. Calculate counts
    const now = new Date();
    const total = accessibleTickets.length;
    const open = accessibleTickets.filter(t => t.status === 'open').length;
    const assigned = accessibleTickets.filter(t => t.status === 'assigned').length;
    const resolved = accessibleTickets.filter(t => t.status === 'resolved').length;
    const cancelled = accessibleTickets.filter(t => t.status === 'cancelled').length;
    const closed = accessibleTickets.filter(t => t.status === 'closed').length;
    const overdue = accessibleTickets.filter(t =>
      t.target_completion_date &&
      new Date(t.target_completion_date) < now &&
      (t.status === 'open' || t.status === 'assigned')
    ).length;

    return new Response(
      JSON.stringify({
        total,
        open,
        assigned,
        resolved,
        cancelled,
        closed,
        overdue
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
