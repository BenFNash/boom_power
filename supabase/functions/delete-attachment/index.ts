import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.43.4';
import { corsHeaders } from '../_shared/cors.ts';

const STORAGE_BUCKET = 'ticket-attachments';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
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

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { attachmentId } = await req.json();

    if (!attachmentId) {
      return new Response(JSON.stringify({ error: 'Missing attachmentId' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const { data: attachment, error: fetchError } = await supabase
      .from('attachments')
      .select('file_path, ticket_id')
      .eq('id', attachmentId)
      .single();

    if (fetchError || !attachment) {
      return new Response(JSON.stringify({ error: 'Attachment not found' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 404,
      });
    }

    const { data: ticket, error: ticketError } = await supabase
      .from('tickets')
      .select(`
              site_owner_company_id,
              assigned_company_id
             `)
      .eq('id', attachment.ticket_id)
      .single();

    if (ticketError || !ticket) {
      return new Response(JSON.stringify({ error: 'Ticket not found for attachment' }), {
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
      return new Response(JSON.stringify({ error: 'Profile not found' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    const userRoles = profile.user_roles 
        ?.map(r => r.roles?.role_name as Any)
        .filter(Boolean) || ['read'];

    const isAuthorized = userRoles.includes('admin')|| userRoles.includes('edit') || profile.company_id === ticket.site_owner_company_id || profile.company_id == ticket.assigned_company_id;

    if (!isAuthorized) {
      return new Response(JSON.stringify({ error: 'Unauthorized to delete this attachment' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 403,
      });
    }

    const { error: deleteDbError } = await supabase
      .from('attachments')
      .delete()
      .eq('id', attachmentId);

    if (deleteDbError) {
      console.error('DB Delete Error:', deleteDbError);
      return new Response(JSON.stringify({ error: 'Failed to delete attachment record' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    const { error: storageError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .remove([attachment.file_path]);

    if (storageError) {
      console.warn('Storage Delete Warning:', storageError);
    }

    return new Response(JSON.stringify({ success: true }), {
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
