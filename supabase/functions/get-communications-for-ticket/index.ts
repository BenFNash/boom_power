import { createClient } from 'npm:@supabase/supabase-js@2.39.7';
import { decode } from 'https://deno.land/x/djwt@v2.8/mod.ts';
import type { Communication } from '@boom-power/types';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
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

    // 3. Get ticket ID from request
    const { ticketId } = await req.json();
    if (!ticketId) throw new Error('Ticket ID is required');

    // 4. Fetch communications for the ticket
    const { data: communications, error } = await supabase
      .from('communications')
      .select(`
        *,
        profiles (
          email,
          name
        ),
        attachments (*)
      `)
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: true });

    if (error) throw error;

    // 5. Transform the data to match the frontend's expected format
    const transformedCommunications = communications.map(comm => ({
      id: comm.id,
      ticketId: comm.ticket_id,
      userId: comm.user_id,
      user: {
        firstName: comm.profiles?.name?.split(' ')[0] || '',
        lastName: comm.profiles?.name?.split(' ')[1] || '',
        email: comm.profiles?.email || ''
      },
      message: comm.message,
      attachments: (comm.attachments || []).map((att: any) => ({
        id: att.id,
        name: att.file_name,
        size: att.file_size,
        type: att.file_type,
        url: att.file_url,
        createdAt: att.created_at
      })),
      createdAt: comm.created_at
    }));

    return new Response(
      JSON.stringify({ data: transformedCommunications }),
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
