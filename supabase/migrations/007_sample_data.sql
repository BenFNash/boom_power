/*
  # Sample Data
  
  1. Sample Data
    - Companies
    - Sites
    - Site Owners
    - Company Contacts
    - Sample tickets and communications
  
  2. Purpose
    - Provide test data for development
    - Demonstrate system functionality
    - Enable immediate testing after setup
*/

-- Insert sample companies
INSERT INTO public.companies (id, company_name) VALUES
  (gen_random_uuid(), 'Boom Power Maintenance'),
  (gen_random_uuid(), 'Electrical Solutions Ltd'),
  (gen_random_uuid(), 'Facility Management Corp'),
  (gen_random_uuid(), 'HVAC Specialists Inc'),
  (gen_random_uuid(), 'Security Systems Pro')
ON CONFLICT (company_name) DO NOTHING;

-- Insert sample sites
INSERT INTO public.sites (id, site_name) VALUES
  (gen_random_uuid(), 'Main Office Building'),
  (gen_random_uuid(), 'Warehouse Facility'),
  (gen_random_uuid(), 'Data Center'),
  (gen_random_uuid(), 'Manufacturing Plant'),
  (gen_random_uuid(), 'Distribution Center')
ON CONFLICT (site_name) DO NOTHING;

-- Insert sample site owners
INSERT INTO public.site_owners (id, owner_name) VALUES
  (gen_random_uuid(), 'Boom Power Ltd'),
  (gen_random_uuid(), 'Industrial Holdings Inc'),
  (gen_random_uuid(), 'Commercial Properties LLC'),
  (gen_random_uuid(), 'Tech Campus Management'),
  (gen_random_uuid(), 'Logistics Solutions Ltd')
ON CONFLICT (owner_name) DO NOTHING;

-- Insert sample company contacts
INSERT INTO public.company_contacts (id, company_id, contact_name, contact_email)
SELECT 
  gen_random_uuid(),
  c.id,
  'Contact ' || row_number() over(partition by c.id order by c.company_name),
  'contact' || row_number() over(partition by c.id order by c.company_name) || '@' || 
  lower(replace(c.company_name, ' ', '')) || '.com'
FROM public.companies c
ON CONFLICT DO NOTHING;

-- Insert sample tickets (only if there are users in the system)
DO $$
DECLARE
  user_id uuid;
  site_id uuid;
  site_owner_id uuid;
  company_id uuid;
  contact_id uuid;
BEGIN
  -- Get first user (if any exist)
  SELECT id INTO user_id FROM public.profiles LIMIT 1;
  
  -- Get first site
  SELECT id INTO site_id FROM public.sites LIMIT 1;
  
  -- Get first site owner
  SELECT id INTO site_owner_id FROM public.site_owners LIMIT 1;
  
  -- Get first company
  SELECT id INTO company_id FROM public.companies LIMIT 1;
  
  -- Get first contact
  SELECT id INTO contact_id FROM public.company_contacts LIMIT 1;
  
  -- Only create sample tickets if we have a user
  IF user_id IS NOT NULL THEN
    -- Insert sample tickets
    INSERT INTO public.tickets (
      site_id,
      site_owner_id,
      ticket_type,
      priority,
      who_raised_id,
      target_completion_date,
      assigned_company_id,
      assigned_contact_id,
      subject_title,
      description,
      status
    ) VALUES
      (site_id, site_owner_id, 'Job', 'Medium', user_id, CURRENT_DATE + 7, company_id, contact_id, 
       'Annual HVAC Maintenance', 'Schedule annual maintenance check for all HVAC systems at the main office building.', 'open'),
      
      (site_id, site_owner_id, 'Fault', 'High', user_id, CURRENT_DATE + 2, company_id, contact_id,
       'Electrical Panel Fault', 'Electrical panel showing warning lights. Immediate attention required.', 'assigned'),
      
      (site_id, site_owner_id, 'Job', 'Low', user_id, CURRENT_DATE + 14, company_id, contact_id,
       'Security System Update', 'Update security system software and firmware across all locations.', 'open'),
      
      (site_id, site_owner_id, 'Fault', 'Critical', user_id, CURRENT_DATE + 1, company_id, contact_id,
       'Fire Alarm System Failure', 'Fire alarm system not responding to test signals. Emergency repair needed.', 'resolved'),
      
      (site_id, site_owner_id, 'Job', 'Medium', user_id, CURRENT_DATE + 10, company_id, contact_id,
       'Lighting System Maintenance', 'Replace aging light fixtures and upgrade to LED lighting system.', 'open');
    
    -- Insert sample communications for the first ticket
    INSERT INTO public.communications (
      ticket_id,
      user_id,
      message
    )
    SELECT 
      t.id,
      user_id,
      'Initial assessment completed. Will need to schedule maintenance visit for next week.'
    FROM public.tickets t
    WHERE t.subject_title = 'Annual HVAC Maintenance'
    LIMIT 1;
    
    -- Insert sample communications for the fault ticket
    INSERT INTO public.communications (
      ticket_id,
      user_id,
      message
    )
    SELECT 
      t.id,
      user_id,
      'Technician dispatched. Estimated arrival time: 2 hours.'
    FROM public.tickets t
    WHERE t.subject_title = 'Electrical Panel Fault'
    LIMIT 1;
  END IF;
END $$; 