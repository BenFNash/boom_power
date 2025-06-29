/*
  # Job Scheduling System
  
  1. Tables
    - `job_templates` - Reusable templates for recurring jobs
    - `job_schedules` - Recurring schedule definitions
    - `scheduled_job_instances` - Track generated job instances from schedules
  
  2. Security
    - Enable RLS on all tables
    - Admin-only access for schedule management
  
  3. Functions
    - Calculate next due date based on frequency
    - Generate tickets from schedules
    - Update timestamps
*/

-- Create job templates table
CREATE TABLE IF NOT EXISTS public.job_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  site_id uuid REFERENCES public.sites(id) ON DELETE RESTRICT,
  site_owner_id uuid REFERENCES public.site_owners(id) ON DELETE RESTRICT,
  ticket_type text NOT NULL CHECK (ticket_type IN ('Job', 'Fault')),
  priority text NOT NULL,
  assigned_company_id uuid REFERENCES public.companies(id) ON DELETE RESTRICT,
  assigned_contact_id uuid REFERENCES public.company_contacts(id) ON DELETE RESTRICT,
  subject_title text NOT NULL,
  description_template text,
  estimated_duration_days integer DEFAULT 7,
  active boolean DEFAULT true,
  created_by uuid REFERENCES public.profiles(id) ON DELETE RESTRICT,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create job schedules table
CREATE TABLE IF NOT EXISTS public.job_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_template_id uuid NOT NULL REFERENCES public.job_templates(id) ON DELETE CASCADE,
  name text NOT NULL,
  frequency_type text NOT NULL CHECK (frequency_type IN ('monthly', 'quarterly', 'semi_annually', 'annually', 'custom')),
  frequency_value integer, -- For custom frequencies (e.g., every X months)
  start_date date NOT NULL,
  end_date date, -- Optional end date for the schedule
  advance_notice_days integer DEFAULT 14, -- How many days before deadline to create ticket
  next_due_date date NOT NULL,
  active boolean DEFAULT true,
  created_by uuid REFERENCES public.profiles(id) ON DELETE RESTRICT,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create scheduled job instances table to track generated tickets
CREATE TABLE IF NOT EXISTS public.scheduled_job_instances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_schedule_id uuid NOT NULL REFERENCES public.job_schedules(id) ON DELETE CASCADE,
  ticket_id integer REFERENCES public.tickets(id) ON DELETE SET NULL,
  due_date date NOT NULL,
  created_date date NOT NULL DEFAULT CURRENT_DATE,
  status text DEFAULT 'created' CHECK (status IN ('created', 'completed', 'cancelled')),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.job_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheduled_job_instances ENABLE ROW LEVEL SECURITY;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_job_templates_site_id ON job_templates(site_id);
CREATE INDEX IF NOT EXISTS idx_job_templates_active ON job_templates(active);
CREATE INDEX IF NOT EXISTS idx_job_schedules_template_id ON job_schedules(job_template_id);
CREATE INDEX IF NOT EXISTS idx_job_schedules_next_due_date ON job_schedules(next_due_date);
CREATE INDEX IF NOT EXISTS idx_job_schedules_active ON job_schedules(active);
CREATE INDEX IF NOT EXISTS idx_scheduled_job_instances_schedule_id ON scheduled_job_instances(job_schedule_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_job_instances_due_date ON scheduled_job_instances(due_date);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION update_job_templates_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_job_schedules_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_job_templates_timestamp
  BEFORE UPDATE ON job_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_job_templates_updated_at();

CREATE TRIGGER update_job_schedules_timestamp
  BEFORE UPDATE ON job_schedules
  FOR EACH ROW
  EXECUTE FUNCTION update_job_schedules_updated_at();

-- Function to calculate next due date based on frequency
CREATE OR REPLACE FUNCTION calculate_next_due_date(
  input_date date,
  frequency_type text,
  frequency_value integer DEFAULT NULL
)
RETURNS date
LANGUAGE plpgsql
AS $$
BEGIN
  CASE frequency_type
    WHEN 'monthly' THEN
      RETURN input_date + INTERVAL '1 month';
    WHEN 'quarterly' THEN
      RETURN input_date + INTERVAL '3 months';
    WHEN 'semi_annually' THEN
      RETURN input_date + INTERVAL '6 months';
    WHEN 'annually' THEN
      RETURN input_date + INTERVAL '1 year';
    WHEN 'custom' THEN
      IF frequency_value IS NULL THEN
        RAISE EXCEPTION 'frequency_value is required for custom frequency type';
      END IF;
      RETURN input_date + (frequency_value || ' months')::INTERVAL;
    ELSE
      RAISE EXCEPTION 'Invalid frequency_type: %', frequency_type;
  END CASE;
END;
$$;

-- Function to generate tickets from schedules
CREATE OR REPLACE FUNCTION generate_scheduled_tickets()
RETURNS integer
LANGUAGE plpgsql
AS $$
DECLARE
  schedule_record RECORD;
  template_record RECORD;
  new_ticket_id integer;
  tickets_created integer := 0;
  target_completion_date date;
BEGIN
  -- Find all active schedules that need tickets created
  FOR schedule_record IN
    SELECT js.*, jt.name as template_name
    FROM job_schedules js
    JOIN job_templates jt ON jt.id = js.job_template_id
    WHERE js.active = true
    AND jt.active = true
    AND js.next_due_date - js.advance_notice_days <= CURRENT_DATE
    AND NOT EXISTS (
      SELECT 1 FROM scheduled_job_instances sji
      WHERE sji.job_schedule_id = js.id
      AND sji.due_date = js.next_due_date
    )
  LOOP
    -- Get the template details
    SELECT * INTO template_record
    FROM job_templates
    WHERE id = schedule_record.job_template_id;
    
    -- Calculate target completion date
    target_completion_date := schedule_record.next_due_date + template_record.estimated_duration_days;
    
    -- Create the ticket
    INSERT INTO tickets (
      site_id,
      site_owner_id,
      ticket_type,
      priority,
      who_raised_id,
      target_completion_date,
      due_date,
      assigned_company_id,
      assigned_contact_id,
      subject_title,
      description,
      status
    ) VALUES (
      template_record.site_id,
      template_record.site_owner_id,
      template_record.ticket_type,
      template_record.priority,
      schedule_record.created_by,
      target_completion_date,
      schedule_record.next_due_date,
      template_record.assigned_company_id,
      template_record.assigned_contact_id,
      template_record.subject_title,
      template_record.description_template,
      'open'
    ) RETURNING id INTO new_ticket_id;
    
    -- Create scheduled job instance record
    INSERT INTO scheduled_job_instances (
      job_schedule_id,
      ticket_id,
      due_date,
      status
    ) VALUES (
      schedule_record.id,
      new_ticket_id,
      schedule_record.next_due_date,
      'created'
    );
    
    -- Update the schedule's next due date
    UPDATE job_schedules
    SET next_due_date = calculate_next_due_date(
      schedule_record.next_due_date,
      schedule_record.frequency_type,
      schedule_record.frequency_value
    )
    WHERE id = schedule_record.id;
    
    tickets_created := tickets_created + 1;
  END LOOP;
  
  RETURN tickets_created;
END;
$$;

-- Create policies for job_templates (admin only)
CREATE POLICY "Admins can manage job templates"
  ON job_templates
  FOR ALL
  TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Users can view active job templates"
  ON job_templates
  FOR SELECT
  TO authenticated
  USING (active = true);

-- Create policies for job_schedules (admin only)
CREATE POLICY "Admins can manage job schedules"
  ON job_schedules
  FOR ALL
  TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Users can view active job schedules"
  ON job_schedules
  FOR SELECT
  TO authenticated
  USING (active = true);

-- Create policies for scheduled_job_instances
CREATE POLICY "Admins can manage scheduled job instances"
  ON scheduled_job_instances
  FOR ALL
  TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Users can view scheduled job instances"
  ON scheduled_job_instances
  FOR SELECT
  TO authenticated
  USING (true); 