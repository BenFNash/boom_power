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

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const ticketId = formData.get('ticketId') as string;
    const communicationId = formData.get('communicationId') as string | null;

    console.log(file)
    console.log(ticketId)

    if (!file || !ticketId) {
      return new Response(JSON.stringify({ error: 'Missing file or ticketId' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const { data: ticket, error: ticketError } = await supabase
      .from('tickets')
      .select('site_owner_company_id')
      .eq('id', ticketId)
      .single();

    if (ticketError || !ticket) {
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
      console.log(profile)
      console.log(profileError)

      return new Response(JSON.stringify({ error: 'Profile not found' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    const userRoles = profile.user_roles 
        ?.map(r => r.roles?.role_name as Any)
        .filter(Boolean) || ['read'];

    const isAuthorized = userRoles.includes('admin')|| profile.company_id === ticket.company_id;

    if (!isAuthorized) {
      return new Response(JSON.stringify({ error: 'Unauthorized to upload attachments for this ticket' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 403,
      });
    }

    const fileExt = file.name.split('.').pop();
    const filePath = `${ticketId}/${user.id}/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      console.error('Storage Upload Error:', uploadError);
      return new Response(JSON.stringify({ error: 'Failed to upload file' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    const { data: urlData, error: urlError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .createSignedUrl(filePath, 3600 * 24 * 365);

    if (urlError) {
      throw new Error(`failed to create signed url: ${urlError.message}`);
    }

    const attachmentRecord = {
      ticket_id: ticketId,
      communication_id: communicationId,
      uploaded_by: user.id,
      file_url: urlData.signedUrl,
      file_name: file.name,
      file_type: file.type,
      file_size: file.size,
      file_path: filePath,
    };

    const { data: dbData, error: dbError } = await supabase
      .from('attachments')
      .insert(attachmentRecord)
      .select('*')
      .single();

    if (dbError) {
      console.error('Database Insert Error:', dbError);
      await supabase.storage.from(STORAGE_BUCKET).remove([filePath]);
      return new Response(JSON.stringify({ error: 'Failed to create attachment record' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    return new Response(JSON.stringify(dbData), {
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
