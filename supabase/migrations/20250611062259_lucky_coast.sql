/*
  # Create jobs table for tracking work assignments

  1. New Tables
    - `jobs`
      - `id` (uuid, primary key)
      - `ticket_id` (integer, foreign key to tickets)
      - `job_number` (text, unique, auto-generated)
      - `assigned_to_user_id` (uuid, foreign key to profiles)
      - `assigned_company_id` (uuid, foreign key to companies)
      - `status` (enum: pending, in_progress, completed, on_hold)
      - `scheduled_start_date` (date)
      - `scheduled_end_date` (date)
      - `actual_start_date` (timestamptz, nullable)
      - `actual_end_date` (timestamptz, nullable)
      - `notes` (text, nullable)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `jobs` table
    - Add policies for company-based access control
    - Add policies for admin and edit role permissions

  3. Functions
    - Auto-generate job numbers (J00001, J00002, etc.)
    - Auto-update timestamps
*/

-- Create job status enum
DO $$ BEGIN
  CREATE TYPE job_status AS ENUM ('pending', 'in_progress', 'completed', 'on_hold');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create jobs table
CREATE TABLE IF NOT EXISTS jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id integer NOT NULL REFERENCES tickets(id) ON DELETE RESTRICT,
  job_number text UNIQUE NOT NULL,
  assigned_to_user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  assigned_company_id uuid NOT NULL REFERENCES companies(id) ON DELETE RESTRICT,
  status job_status NOT NULL DEFAULT 'pending',
  scheduled_start_date date NOT NULL,
  scheduled_end_date date NOT NULL,
  actual_start_date timestamptz,
  actual_end_date timestamptz,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create function to generate job numbers
CREATE OR REPLACE FUNCTION generate_job_number()
RETURNS text AS $$
DECLARE
  next_number integer;
  job_number text;
BEGIN
  -- Get the next sequence number
  SELECT COALESCE(MAX(CAST(SUBSTRING(job_number FROM 2) AS integer)), 0) + 1
  INTO next_number
  FROM jobs
  WHERE job_number ~ '^J[0-9]+$';
  
  -- Format as J00001, J00002, etc.
  job_number := 'J' || LPAD(next_number::text, 5, '0');
  
  RETURN job_number;
END;
$$ LANGUAGE plpgsql;

-- Create function to update jobs updated_at timestamp
CREATE OR REPLACE FUNCTION update_jobs_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-generate job number
CREATE OR REPLACE FUNCTION set_job_number()
RETURNS trigger AS $$
BEGIN
  IF NEW.job_number IS NULL OR NEW.job_number = '' THEN
    NEW.job_number := generate_job_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
DROP TRIGGER IF EXISTS set_job_number ON jobs;
CREATE TRIGGER set_job_number
  BEFORE INSERT ON jobs
  FOR EACH ROW
  EXECUTE FUNCTION set_job_number();

DROP TRIGGER IF EXISTS update_jobs_timestamp ON jobs;
CREATE TRIGGER update_jobs_timestamp
  BEFORE UPDATE ON jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_jobs_updated_at();

-- Enable RLS
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Users can view jobs assigned to their company or jobs they are personally assigned to
CREATE POLICY "Users can view jobs for their company or assigned to them"
  ON jobs
  FOR SELECT
  TO authenticated
  USING (
    assigned_company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
    OR assigned_to_user_id = auth.uid()
    OR is_admin(auth.uid())
    OR EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON r.id = ur.role_id
      WHERE ur.user_id = auth.uid() AND r.role_name = 'edit'
    )
  );

-- Only admins can create jobs
CREATE POLICY "Admins can create jobs"
  ON jobs
  FOR INSERT
  TO authenticated
  WITH CHECK (is_admin(auth.uid()));

-- Users with edit role or admins can update jobs, or users assigned to the job
CREATE POLICY "Users can update jobs they have access to"
  ON jobs
  FOR UPDATE
  TO authenticated
  USING (
    assigned_company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
    OR assigned_to_user_id = auth.uid()
    OR is_admin(auth.uid())
    OR EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON r.id = ur.role_id
      WHERE ur.user_id = auth.uid() AND r.role_name = 'edit'
    )
  )
  WITH CHECK (
    assigned_company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
    OR assigned_to_user_id = auth.uid()
    OR is_admin(auth.uid())
    OR EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON r.id = ur.role_id
      WHERE ur.user_id = auth.uid() AND r.role_name = 'edit'
    )
  );

-- Only admins can delete jobs
CREATE POLICY "Admins can delete jobs"
  ON jobs
  FOR DELETE
  TO authenticated
  USING (is_admin(auth.uid()));

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_jobs_ticket_id ON jobs(ticket_id);
CREATE INDEX IF NOT EXISTS idx_jobs_assigned_to_user_id ON jobs(assigned_to_user_id);
CREATE INDEX IF NOT EXISTS idx_jobs_assigned_company_id ON jobs(assigned_company_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_scheduled_dates ON jobs(scheduled_start_date, scheduled_end_date);
CREATE INDEX IF NOT EXISTS idx_jobs_job_number ON jobs(job_number);