/*
  # Add Archive Company Cascade Function
  
  1. Purpose
    - Archive all records associated with a company when it's archived
    - Maintain referential integrity through soft deletes
    - Handle all related tables in a single transaction
  
  2. Tables Affected
    - sites (site_owner_company_id)
    - company_contacts (company_id) - already CASCADE deletes
    - tickets (site_owner_company_id, assigned_company_id)
    - jobs (assigned_company_id)
    - job_templates (site_owner_company_id, assigned_company_id)
    - job_schedules (via job_templates)
    - scheduled_job_instances (via job_schedules)
*/

-- Create function to archive company and all associated records
CREATE OR REPLACE FUNCTION archive_company_cascade(target_company_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Admin check
  IF NOT is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Only admin users can archive a company and its associated records';
  END IF;

  -- Archive sites owned by this company
  UPDATE sites 
  SET active = false 
  WHERE site_owner_company_id = target_company_id AND active = true;
  
  -- Archive tickets where this company is the site owner
  UPDATE tickets 
  SET status = 'cancelled' 
  WHERE site_owner_company_id = target_company_id AND status IN ('open', 'assigned');
  
  -- Archive tickets where this company is assigned
  UPDATE tickets 
  SET status = 'cancelled' 
  WHERE assigned_company_id = target_company_id AND status IN ('open', 'assigned');
  
  -- Archive jobs assigned to this company
  UPDATE jobs 
  SET status = 'on_hold' 
  WHERE assigned_company_id = target_company_id AND status IN ('pending', 'in_progress');
  
  -- Archive job templates where this company is the site owner
  UPDATE job_templates 
  SET active = false 
  WHERE site_owner_company_id = target_company_id AND active = true;
  
  -- Archive job templates where this company is assigned
  UPDATE job_templates 
  SET active = false 
  WHERE assigned_company_id = target_company_id AND active = true;
  
  -- Archive job schedules for archived templates
  UPDATE job_schedules 
  SET active = false 
  WHERE job_template_id IN (
    SELECT id FROM job_templates 
    WHERE (site_owner_company_id = target_company_id OR assigned_company_id = target_company_id) 
    AND active = false
  ) AND active = true;
  
  -- Archive scheduled job instances for archived schedules
  UPDATE scheduled_job_instances 
  SET status = 'cancelled' 
  WHERE job_schedule_id IN (
    SELECT id FROM job_schedules 
    WHERE job_template_id IN (
      SELECT id FROM job_templates 
      WHERE (site_owner_company_id = target_company_id OR assigned_company_id = target_company_id) 
      AND active = false
    ) AND active = false
  ) AND status = 'created';
  
  -- Archive company contacts associated with this company
  UPDATE company_contacts 
  SET active = false 
  WHERE company_id = target_company_id AND active = true;
  
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION archive_company_cascade(uuid) TO authenticated;

-- Add comment to document the function
COMMENT ON FUNCTION archive_company_cascade(uuid) IS 'Archives a company and all associated records (sites, tickets, jobs, templates, schedules, contacts) in a single transaction, only callable by admin users'; 
