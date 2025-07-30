import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.43.4';
import { corsHeaders } from '../_shared/cors.ts';

const STORAGE_BUCKET = 'ticket-attachments';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      });
    }

    const { attachmentId } = await req.json();

    if (!attachmentId) {
      return new Response(JSON.stringify({ error: 'Missing attachmentId' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    // RLS policies will ensure the user can only access authorized attachments.
    const { data: attachment, error: fetchError } = await supabase
      .from('attachments')
      .select('file_path, file_name')
      .eq('id', attachmentId)
      .single();


    if (fetchError) {
      console.error('Fetch Error:', fetchError);
      return new Response(JSON.stringify({ error: 'Attachment not found or access denied' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 404,
      });
    }

    const { data, error: downloadError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .createSignedUrl(attachment.file_path, 60); // Signed URL valid for 60 seconds

    if (downloadError) {
      console.error('Download Error:', downloadError);
      return new Response(JSON.stringify({ error: 'Failed to create download URL' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    return new Response(JSON.stringify({ signedUrl: data.signedUrl, fileName: attachment.file_name }), {
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
