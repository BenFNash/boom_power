/*
  # Insert sample ticket data
  
  1. Sample Data
    - Tickets with various statuses, types, and priorities
    - Communications for each ticket
*/

-- Insert sample tickets
WITH user_data AS (
  SELECT id FROM public.profiles LIMIT 1
),
site_data AS (
  SELECT id, site_name FROM public.sites
),
site_owner_data AS (
  SELECT id, owner_name FROM public.site_owners
),
company_data AS (
  SELECT id, company_name FROM public.companies
),
contact_data AS (
  SELECT id, company_id FROM public.company_contacts
),
numbers AS (
  SELECT generate_series(1, 10) AS n
)
INSERT INTO public.tickets (
  ticket_number,
  site_id,
  site_owner_id,
  ticket_type,
  priority,
  date_raised,
  who_raised_id,
  target_completion_date,
  assigned_company_id,
  assigned_contact_id,
  subject_title,
  description,
  status
)
SELECT
  CASE 
    WHEN n % 2 = 0 THEN 'T' || to_char(n, 'FM00000')
    ELSE 'F' || to_char(n, 'FM00000')
  END as ticket_number,
  s.id as site_id,
  so.id as site_owner_id,
  CASE WHEN n % 2 = 0 THEN 'Job' ELSE 'Fault' END as ticket_type,
  CASE 
    WHEN n % 4 = 0 THEN 'Low'
    WHEN n % 4 = 1 THEN 'Medium'
    WHEN n % 4 = 2 THEN 'High'
    ELSE 'Critical'
  END as priority,
  now() - (n || ' days')::interval as date_raised,
  u.id as who_raised_id,
  now() + ((n % 14) || ' days')::interval as target_completion_date,
  c.id as assigned_company_id,
  cc.id as assigned_contact_id,
  CASE 
    WHEN n % 2 = 0 THEN 'Annual Maintenance for ' || s.site_name
    ELSE 'Equipment Fault at ' || s.site_name
  END as subject_title,
  CASE 
    WHEN n % 2 = 0 THEN 
      'Schedule the annual maintenance check for all equipment at ' || s.site_name || E'.\n\n' ||
      'This includes:\n' ||
      '- HVAC systems\n' ||
      '- Security systems\n' ||
      '- Fire detection systems\n' ||
      '- Emergency lighting\n\n' ||
      'Please ensure all equipment is tested according to manufacturer specifications.'
    ELSE 
      'Critical equipment fault detected at ' || s.site_name || E'.\n\n' ||
      'Issues reported:\n' ||
      '- System not responding to controls\n' ||
      '- Unusual noise during operation\n' ||
      '- Temperature fluctuations\n\n' ||
      'Immediate attention required to prevent system failure.'
  END as description,
  CASE 
    WHEN n % 5 = 0 THEN 'open'
    WHEN n % 5 = 1 THEN 'assigned'
    WHEN n % 5 = 2 THEN 'resolved'
    WHEN n % 5 = 3 THEN 'cancelled'
    ELSE 'closed'
  END as status
FROM 
  numbers,
  user_data u
  CROSS JOIN site_data s
  CROSS JOIN site_owner_data so
  CROSS JOIN company_data c
  CROSS JOIN contact_data cc
WHERE cc.company_id = c.id;

-- Insert sample communications
WITH ticket_data AS (
  SELECT id, who_raised_id FROM public.tickets
),
numbers AS (
  SELECT generate_series(1, 3) AS n
)
INSERT INTO public.communications (
  ticket_id,
  user_id,
  message
)
SELECT 
  t.id,
  t.who_raised_id,
  CASE 
    WHEN n % 3 = 0 THEN 'Initial assessment completed. Will need additional parts to complete the repair.'
    WHEN n % 3 = 1 THEN 'Scheduled maintenance visit for next week. Please ensure site access is arranged.'
    ELSE 'Work completed successfully. All systems operating within normal parameters.'
  END as message
FROM ticket_data t
CROSS JOIN numbers
ON CONFLICT DO NOTHING;