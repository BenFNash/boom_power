/*
  # Insert sample data for the ticketing system
  
  1. Sample Data
    - Companies
    - Sites
    - Site Owners
    - Company Contacts
    - Initial ticket data
*/

-- Insert sample companies
INSERT INTO public.companies (id, company_name) VALUES
  (gen_random_uuid(), 'Company A'),
  (gen_random_uuid(), 'Company B'),
  (gen_random_uuid(), 'Company C')
ON CONFLICT (company_name) DO NOTHING;

-- Insert sample sites
INSERT INTO public.sites (id, site_name) VALUES
  (gen_random_uuid(), 'Site A'),
  (gen_random_uuid(), 'Site B'),
  (gen_random_uuid(), 'Site C')
ON CONFLICT (site_name) DO NOTHING;

-- Insert sample site owners
INSERT INTO public.site_owners (id, owner_name) VALUES
  (gen_random_uuid(), 'Owner 1'),
  (gen_random_uuid(), 'Owner 2'),
  (gen_random_uuid(), 'Owner 3')
ON CONFLICT (owner_name) DO NOTHING;

-- Insert sample company contacts
INSERT INTO public.company_contacts (id, company_id, contact_name, contact_email)
SELECT 
  gen_random_uuid(),
  c.id,
  'Contact ' || row_number() over(),
  'contact' || row_number() over() || '@company' || lower(right(c.company_name, 1)) || '.com'
FROM public.companies c
ON CONFLICT DO NOTHING;