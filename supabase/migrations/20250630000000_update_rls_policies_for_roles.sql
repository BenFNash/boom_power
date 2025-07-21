/*
  # Update RLS Policies for Role-Based Access Control
  
  1. Changes
    - Update read role: Can read everything but cannot edit
    - Update external role: Can only read tickets assigned to their company or owned by their company
    - Update external role: Can only read data associated with their company
    - Maintain admin and edit role permissions
  
  2. Benefits
    - Clear separation between read and external roles
    - External users have restricted access to company-specific data only
    - Read users have broad read access but no edit capabilities
*/

-- Create helper function to check if user has read role
CREATE OR REPLACE FUNCTION has_read_role(user_uuid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM user_roles ur
    JOIN roles r ON r.id = ur.role_id
    WHERE ur.user_id = user_uuid 
    AND r.role_name = 'read' 
  );
$$;

-- Create helper function to check if user has external role
CREATE OR REPLACE FUNCTION has_external_role(user_uuid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM user_roles ur
    JOIN roles r ON r.id = ur.role_id
    WHERE ur.user_id = user_uuid 
    AND r.role_name = 'external' 
  );
$$;

-- Create helper function to check if user has edit role
CREATE OR REPLACE FUNCTION has_edit_role(user_uuid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM user_roles ur
    JOIN roles r ON r.id = ur.role_id
    WHERE ur.user_id = user_uuid 
    AND r.role_name = 'edit' 
  );
$$;

-- Drop and recreate tickets policies with new logic
DROP POLICY IF EXISTS "Users can view tickets they created or are assigned to" ON tickets;
DROP POLICY IF EXISTS "Users can update tickets they have access to" ON tickets;

CREATE POLICY "Users can view tickets based on role and company access"
  ON tickets FOR SELECT
  TO authenticated
  USING (
    -- Admin can view all tickets
    is_admin(auth.uid()) OR
    -- Edit role can view all tickets
    has_edit_role(auth.uid()) OR
    -- Read role can view all tickets
    has_read_role(auth.uid()) OR
    -- External role can only view tickets assigned to their company or owned by their company
    (has_external_role(auth.uid()) AND (
      EXISTS (
        SELECT 1 FROM profiles p
        WHERE p.id = auth.uid()
        AND (
          p.company_id = tickets.assigned_company_id OR
          p.company_id = tickets.site_owner_company_id
        )
      )
    )) OR
    -- User created the ticket (for all roles)
    who_raised_id = auth.uid()
  );

CREATE POLICY "Users can update tickets based on role and access"
  ON tickets FOR UPDATE
  TO authenticated
  USING (
    -- Admin can update all tickets
    is_admin(auth.uid()) OR
    -- Edit role can update all tickets
    has_edit_role(auth.uid()) OR
    -- Read and external roles cannot update tickets
    (has_read_role(auth.uid()) AND false) OR
    (has_external_role(auth.uid()) AND false) OR
    -- User created the ticket (for admin and edit roles)
    (who_raised_id = auth.uid() AND (is_admin(auth.uid()) OR has_edit_role(auth.uid())))
  )
  WITH CHECK (
    -- Admin can update all tickets
    is_admin(auth.uid()) OR
    -- Edit role can update all tickets
    has_edit_role(auth.uid()) OR
    -- Read and external roles cannot update tickets
    (has_read_role(auth.uid()) AND false) OR
    (has_external_role(auth.uid()) AND false) OR
    -- User created the ticket (for admin and edit roles)
    (who_raised_id = auth.uid() AND (is_admin(auth.uid()) OR has_edit_role(auth.uid())))
  );

-- Drop and recreate communications policies
DROP POLICY IF EXISTS "Users can view communications for accessible tickets" ON communications;
DROP POLICY IF EXISTS "Users can create communications for accessible tickets" ON communications;

CREATE POLICY "Users can view communications based on role and ticket access"
  ON communications FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tickets t
      WHERE t.id = communications.ticket_id
      AND (
        -- Admin can view all communications
        is_admin(auth.uid()) OR
        -- Edit role can view all communications
        has_edit_role(auth.uid()) OR
        -- Read role can view all communications
        has_read_role(auth.uid()) OR
        -- External role can only view communications for tickets assigned to their company or owned by their company
        (has_external_role(auth.uid()) AND (
          EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid()
            AND (
              p.company_id = t.assigned_company_id OR
              p.company_id = t.site_owner_company_id
            )
          )
        )) OR
        -- User created the ticket (for all roles)
        t.who_raised_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can create communications based on role and ticket access"
  ON communications FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tickets t
      WHERE t.id = communications.ticket_id
      AND (
        -- Admin can create communications for all tickets
        is_admin(auth.uid()) OR
        -- Edit role can create communications for all tickets
        has_edit_role(auth.uid()) OR
        -- Read role can create communications for all tickets
        has_read_role(auth.uid()) OR
        -- External role cannot create communications
        (has_external_role(auth.uid()) AND false) OR
        -- User created the ticket (for admin, edit, and read roles)
        (t.who_raised_id = auth.uid() AND (is_admin(auth.uid()) OR has_edit_role(auth.uid()) OR has_read_role(auth.uid())))
      )
    )
  );

-- Drop and recreate attachments policies
DROP POLICY IF EXISTS "Users can view attachments for accessible tickets" ON attachments;
DROP POLICY IF EXISTS "Users can create attachments for accessible tickets" ON attachments;

CREATE POLICY "Users can view attachments based on role and ticket access"
  ON attachments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tickets t
      WHERE t.id = attachments.ticket_id
      AND (
        -- Admin can view all attachments
        is_admin(auth.uid()) OR
        -- Edit role can view all attachments
        has_edit_role(auth.uid()) OR
        -- Read role can view all attachments
        has_read_role(auth.uid()) OR
        -- External role can only view attachments for tickets assigned to their company or owned by their company
        (has_external_role(auth.uid()) AND (
          EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid()
            AND (
              p.company_id = t.assigned_company_id OR
              p.company_id = t.site_owner_company_id
            )
          )
        )) OR
        -- User created the ticket (for all roles)
        t.who_raised_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can create attachments based on role and ticket access"
  ON attachments FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tickets t
      WHERE t.id = attachments.ticket_id
      AND (
        -- Admin can create attachments for all tickets
        is_admin(auth.uid()) OR
        -- Edit role can create attachments for all tickets
        has_edit_role(auth.uid()) OR
        -- Read role can create attachments for all tickets
        has_read_role(auth.uid()) OR
        -- External role cannot create attachments
        (has_external_role(auth.uid()) AND false) OR
        -- User created the ticket (for admin, edit, and read roles)
        (t.who_raised_id = auth.uid() AND (is_admin(auth.uid()) OR has_edit_role(auth.uid()) OR has_read_role(auth.uid())))
      )
    )
  );

-- Drop and recreate jobs policies
DROP POLICY IF EXISTS "Users can view jobs for their company or assigned to them" ON jobs;
DROP POLICY IF EXISTS "Users can update jobs they have access to" ON jobs;

CREATE POLICY "Users can view jobs based on role and company access"
  ON jobs
  FOR SELECT
  TO authenticated
  USING (
    -- Admin can view all jobs
    is_admin(auth.uid()) OR
    -- Edit role can view all jobs
    has_edit_role(auth.uid()) OR
    -- Read role can view all jobs
    has_read_role(auth.uid()) OR
    -- External role can only view jobs assigned to their company
    (has_external_role(auth.uid()) AND (
      assigned_company_id IN (
        SELECT company_id FROM profiles WHERE id = auth.uid()
      )
    )) OR
    -- User is assigned to the job (for all roles)
    assigned_to_user_id = auth.uid()
  );

CREATE POLICY "Users can update jobs based on role and access"
  ON jobs
  FOR UPDATE
  TO authenticated
  USING (
    -- Admin can update all jobs
    is_admin(auth.uid()) OR
    -- Edit role can update all jobs
    has_edit_role(auth.uid()) OR
    -- Read and external roles cannot update jobs
    (has_read_role(auth.uid()) AND false) OR
    (has_external_role(auth.uid()) AND false) OR
    -- User is assigned to the job (for admin and edit roles)
    (assigned_to_user_id = auth.uid() AND (is_admin(auth.uid()) OR has_edit_role(auth.uid())))
  )
  WITH CHECK (
    -- Admin can update all jobs
    is_admin(auth.uid()) OR
    -- Edit role can update all jobs
    has_edit_role(auth.uid()) OR
    -- Read and external roles cannot update jobs
    (has_read_role(auth.uid()) AND false) OR
    (has_external_role(auth.uid()) AND false) OR
    -- User is assigned to the job (for admin and edit roles)
    (assigned_to_user_id = auth.uid() AND (is_admin(auth.uid()) OR has_edit_role(auth.uid())))
  );

-- Drop and recreate companies policies
DROP POLICY IF EXISTS "Anyone can view active companies" ON companies;

CREATE POLICY "Users can view companies based on role"
  ON public.companies
  FOR SELECT
  TO authenticated
  USING (
    -- Admin can view all companies
    is_admin(auth.uid()) OR
    -- Edit role can view all companies
    has_edit_role(auth.uid()) OR
    -- Read role can view all active companies
    has_read_role(auth.uid()) OR
    -- External role can only view their assigned company
    (has_external_role(auth.uid()) AND (
      id IN (
        SELECT company_id FROM profiles WHERE id = auth.uid()
      )
    ))
  );

-- Drop and recreate sites policies
DROP POLICY IF EXISTS "Anyone can view active sites" ON sites;
DROP POLICY IF EXISTS "Users can view sites owned by their company" ON sites;

CREATE POLICY "Users can view sites based on role and company access"
  ON public.sites
  FOR SELECT
  TO authenticated
  USING (
    -- Admin can view all sites
    is_admin(auth.uid()) OR
    -- Edit role can view all sites
    has_edit_role(auth.uid()) OR
    -- Read role can view all active sites
    has_read_role(auth.uid()) OR
    -- External role can only view sites owned by their company
    (has_external_role(auth.uid()) AND (
      site_owner_company_id IN (
        SELECT company_id FROM profiles WHERE id = auth.uid()
      )
    ))
  );

-- Drop and recreate company_contacts policies
DROP POLICY IF EXISTS "Anyone can view active company contacts" ON company_contacts;

CREATE POLICY "Users can view company contacts based on role and company access"
  ON public.company_contacts
  FOR SELECT
  TO authenticated
  USING (
    -- Admin can view all contacts
    is_admin(auth.uid()) OR
    -- Edit role can view all contacts
    has_edit_role(auth.uid()) OR
    -- Read role can view all active contacts
    has_read_role(auth.uid()) OR
    -- External role can only view contacts for their company
    (has_external_role(auth.uid()) AND (
      company_id IN (
        SELECT company_id FROM profiles WHERE id = auth.uid()
      )
    ))
  );

-- Drop and recreate job_templates policies
DROP POLICY IF EXISTS "Users can view active job templates" ON job_templates;

CREATE POLICY "Users can view job templates based on role"
  ON job_templates
  FOR SELECT
  TO authenticated
  USING (
    -- Admin can view all templates
    is_admin(auth.uid()) OR
    -- Edit role can view all templates
    has_edit_role(auth.uid()) OR
    -- Read role can view all active templates
    has_read_role(auth.uid()) OR
    -- External role can only view templates for their company
    (has_external_role(auth.uid()) AND (
      site_owner_company_id IN (
        SELECT company_id FROM profiles WHERE id = auth.uid()
      )
    ))
  );

-- Drop and recreate job_schedules policies
DROP POLICY IF EXISTS "Users can view active job schedules" ON job_schedules;

CREATE POLICY "Users can view job schedules based on role"
  ON job_schedules
  FOR SELECT
  TO authenticated
  USING (
    -- Admin can view all schedules
    is_admin(auth.uid()) OR
    -- Edit role can view all schedules
    has_edit_role(auth.uid()) OR
    -- Read role can view all active schedules
    has_read_role(auth.uid()) OR
    -- External role can only view schedules for their company
    (has_external_role(auth.uid()) AND (
      EXISTS (
        SELECT 1 FROM job_templates jt
        WHERE jt.id = job_schedules.job_template_id
        AND jt.site_owner_company_id IN (
          SELECT company_id FROM profiles WHERE id = auth.uid()
        )
      )
    ))
  );

-- Drop and recreate scheduled_job_instances policies
DROP POLICY IF EXISTS "Users can view scheduled job instances" ON scheduled_job_instances;

CREATE POLICY "Users can view scheduled job instances based on role"
  ON scheduled_job_instances
  FOR SELECT
  TO authenticated
  USING (
    -- Admin can view all instances
    is_admin(auth.uid()) OR
    -- Edit role can view all instances
    has_edit_role(auth.uid()) OR
    -- Read role can view all instances
    has_read_role(auth.uid()) OR
    -- External role can only view instances for their company
    (has_external_role(auth.uid()) AND (
      EXISTS (
        SELECT 1 FROM job_schedules js
        JOIN job_templates jt ON jt.id = js.job_template_id
        WHERE js.id = scheduled_job_instances.job_schedule_id
        AND jt.site_owner_company_id IN (
          SELECT company_id FROM profiles WHERE id = auth.uid()
        )
      )
    ))
  );

-- Add comments to document the new role-based access control
COMMENT ON FUNCTION has_read_role(uuid) IS 'Helper function to check if a user has read role';
COMMENT ON FUNCTION has_external_role(uuid) IS 'Helper function to check if a user has external role';
COMMENT ON FUNCTION has_edit_role(uuid) IS 'Helper function to check if a user has edit role'; 
