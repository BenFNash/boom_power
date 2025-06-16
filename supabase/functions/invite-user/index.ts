import { createClient } from 'npm:@supabase/supabase-js@2.39.7';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

interface InviteUserPayload {
  email: string;
  roles: string[];
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  try {
    // Get auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Create Supabase client with user's JWT
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: { headers: { Authorization: authHeader } },
      }
    );

    // Verify the user is an admin
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    // Check if user has admin role using user_roles table
    const { data: userRoles, error: rolesError } = await supabase
      .from('user_roles')
      .select(`
        roles (
          role_name
        )
      `)
      .eq('user_id', user.id);

    if (rolesError) {
      throw new Error('Error checking user roles');
    }

    // Check if user has admin role
    const hasAdminRole = userRoles?.some(userRole => 
      userRole.roles && userRole.roles.role_name === 'admin'
    );

    if (!hasAdminRole) {
      throw new Error('Unauthorized - Admin access required');
    }

    // Get request payload
    const { email, roles }: InviteUserPayload = await req.json();
    if (!email || !roles?.length) {
      throw new Error('Invalid request payload');
    }

    // Create admin client with service role
    const adminAuthClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Invite the user
    const { data, error: inviteError } = await adminAuthClient.auth.admin.inviteUserByEmail(email, {
      data: { roles },
      redirectTo: 'https://boom-operations-and-maintenance.pages.dev/auth/callback'
    });

    if (inviteError) {
      throw inviteError;
    }

    return new Response(
      JSON.stringify({ data, message: 'Invitation sent successfully' }), 
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
        status: error instanceof Error && error.message.includes('Unauthorized') ? 401 : 400,
      }
    );
  }
});