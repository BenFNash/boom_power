import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.43.4';
import { corsHeaders } from '../_shared/cors.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Create a Supabase client with the user's context to get the user
    const userAuthClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );
    const { data: { user } } = await userAuthClient.auth.getUser();

    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      });
    }

    // Create a Supabase client with the service role key for database operations
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { ticketId, message } = await req.json();

    if (!ticketId || !message) {
      return new Response(JSON.stringify({ error: 'Missing ticketId or message' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    // Manually check if user is authorized to access the ticket
    const { data: ticket, error: ticketError } = await supabase
      .from('tickets')
      .select(`
              site_owner_company_id,
              assigned_company_id
              `)
      .eq('id', ticketId)
      .single();

    if (ticketError || !ticket) {
      console.log(ticket)
      console.log(ticketError)
      return new Response(JSON.stringify({ error: 'Ticket not found' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 404,
      });
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select(`
        id,
        company_id,
        user_roles!inner(
          roles!inner(
            role_name
          )
        )
      `)
      .eq('id', user.id)
      .single();


    if (profileError || !profile) {
        console.log(profileError)
        console.log(profile)
      return new Response(JSON.stringify({ error: 'Profile not found' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    // User is authorized if they are an admin or belong to the same company as the ticket
    const userRoles = profile.user_roles 
        ?.map(r => r.roles?.role_name as Any)
        .filter(Boolean) || ['read'];

    const companyOwnsSite = profile.company_id === ticket.site_owner_company_id
    const companyAssignedTask = profile.company_id === ticket.assigned_company_id

    const isAuthorized = userRoles.includes('admin')|| userRoles.includes('edit') || companyOwnsSite || companyAssignedTask

    if (!isAuthorized) {
      return new Response(JSON.stringify({ error: 'Unauthorized to comment on this ticket' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 403,
      });
    }

    const { data, error } = await supabase
      .from('communications')
      .insert({ ticket_id: ticketId, user_id: user.id, message })
      .select(`
        *,
        user:profiles(name),
        attachments:attachments(*)
      `)
      .single();

    if (error) {
      console.error('DB Insert Error:', error);
      return new Response(JSON.stringify({ error: 'Failed to create communication' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Unexpected Error:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
