# Boom Power Database Structure

## Overview

The Boom Power application uses a PostgreSQL database hosted on Supabase with a comprehensive ticketing and job management system. The database is designed to handle facility maintenance, fault reporting, and scheduled job management with role-based access control.

## Database Schema

### Core Tables

#### 1. Authentication & User Management

##### `profiles`
- **Purpose**: User profile information linked to Supabase Auth
- **Primary Key**: `id` (UUID, references `auth.users`)
- **Key Fields**:
  - `email` (text, unique) - User's email address
  - `name` (text, nullable) - Full name
  - `company_id` (UUID, nullable) - Reference to assigned company
  - `created_at` (timestamptz) - Account creation timestamp

##### `roles`
- **Purpose**: System roles for access control
- **Primary Key**: `id` (UUID)
- **Key Fields**:
  - `role_name` (text, unique) - Role identifier
- **Default Roles**: `admin`, `edit`, `read`, `external`

##### `user_roles`
- **Purpose**: Junction table linking users to roles (many-to-many)
- **Primary Key**: Composite (`user_id`, `role_id`)
- **Key Fields**:
  - `user_id` (UUID) - References `profiles.id`
  - `role_id` (UUID) - References `roles.id`
  - `created_at` (timestamptz)

#### 2. Reference Data

##### `companies`
- **Purpose**: Organizations that can be assigned work or own sites
- **Primary Key**: `id` (UUID)
- **Key Fields**:
  - `company_name` (text, unique) - Organization name
  - `created_at` (timestamptz)

##### `sites`
- **Purpose**: Physical locations where work is performed
- **Primary Key**: `id` (UUID)
- **Key Fields**:
  - `site_name` (text, unique) - Location name
  - `site_owner_company_id` (UUID) - References `companies.id` (site owner)
  - `created_at` (timestamptz)

##### `company_contacts`
- **Purpose**: Contact persons within companies
- **Primary Key**: `id` (UUID)
- **Key Fields**:
  - `company_id` (UUID) - References `companies.id`
  - `contact_name` (text) - Contact person name
  - `contact_email` (text) - Contact email
  - `created_at` (timestamptz)
- **Constraints**: Unique combination of `company_id` and `contact_email`

#### 3. Ticket Management

##### `tickets`
- **Purpose**: Main ticketing system for jobs and faults
- **Primary Key**: `id` (integer, auto-incrementing)
- **Key Fields**:
  - `ticket_number` (text, unique) - Auto-generated (T00001, F00001, etc.)
  - `site_id` (UUID) - References `sites.id`
  - `site_owner_company_id` (UUID) - References `companies.id` (site owner)
  - `ticket_type` (text) - 'Job' or 'Fault'
  - `priority` (text) - Priority level
  - `date_raised` (timestamptz) - When ticket was created
  - `who_raised_id` (UUID) - References `profiles.id`
  - `target_completion_date` (date) - Expected completion date
  - `due_date` (date, nullable) - Hard deadline
  - `assigned_company_id` (UUID, nullable) - References `companies.id`
  - `assigned_contact_id` (UUID, nullable) - References `company_contacts.id`
  - `subject_title` (text) - Ticket subject
  - `description` (text, nullable) - Detailed description
  - `status` (text) - 'open', 'assigned', 'resolved', 'cancelled', 'closed'
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

##### `communications`
- **Purpose**: Messages and updates on tickets
- **Primary Key**: `id` (UUID)
- **Key Fields**:
  - `ticket_id` (integer) - References `tickets.id`
  - `user_id` (UUID) - References `profiles.id`
  - `message` (text) - Communication content
  - `created_at` (timestamptz)

##### `attachments`
- **Purpose**: File attachments for tickets and communications
- **Primary Key**: `id` (UUID)
- **Key Fields**:
  - `ticket_id` (integer) - References `tickets.id`
  - `communication_id` (UUID, nullable) - References `communications.id`
  - `uploaded_by` (UUID) - References `profiles.id`
  - `file_url` (text) - File storage URL
  - `file_name` (text) - Original filename
  - `file_type` (text) - MIME type
  - `file_size` (integer) - File size in bytes
  - `created_at` (timestamptz)

#### 4. Job Management

##### `jobs`
- **Purpose**: Work assignments linked to tickets
- **Primary Key**: `id` (UUID)
- **Key Fields**:
  - `ticket_id` (integer) - References `tickets.id`
  - `job_number` (text, unique) - Auto-generated (J00001, J00002, etc.)
  - `assigned_to_user_id` (UUID) - References `profiles.id`
  - `assigned_company_id` (UUID) - References `companies.id`
  - `status` (enum) - 'pending', 'in_progress', 'completed', 'on_hold'
  - `scheduled_start_date` (date) - Planned start date
  - `scheduled_end_date` (date) - Planned end date
  - `actual_start_date` (timestamptz, nullable) - Actual start time
  - `actual_end_date` (timestamptz, nullable) - Actual completion time
  - `notes` (text, nullable) - Additional notes
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

#### 5. Job Scheduling System

##### `job_templates`
- **Purpose**: Reusable templates for recurring jobs
- **Primary Key**: `id` (UUID)
- **Key Fields**:
  - `name` (text) - Template name
  - `description` (text, nullable) - Template description
  - `site_id` (UUID, nullable) - References `sites.id`
  - `site_owner_company_id` (UUID, nullable) - References `companies.id` (site owner)
  - `ticket_type` (text) - 'Job' or 'Fault'
  - `priority` (text) - Default priority
  - `assigned_company_id` (UUID, nullable) - References `companies.id`
  - `assigned_contact_id` (UUID, nullable) - References `company_contacts.id`
  - `subject_title` (text) - Default subject
  - `description_template` (text, nullable) - Template description
  - `estimated_duration_days` (integer) - Default duration
  - `active` (boolean) - Template availability
  - `created_by` (UUID) - References `profiles.id`
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

##### `job_schedules`
- **Purpose**: Recurring schedule definitions
- **Primary Key**: `id` (UUID)
- **Key Fields**:
  - `job_template_id` (UUID) - References `job_templates.id`
  - `name` (text) - Schedule name
  - `frequency_type` (text) - 'monthly', 'quarterly', 'semi_annually', 'annually', 'custom'
  - `frequency_value` (integer, nullable) - For custom frequencies
  - `start_date` (date) - Schedule start date
  - `end_date` (date, nullable) - Schedule end date
  - `advance_notice_days` (integer) - Days before deadline to create ticket
  - `next_due_date` (date) - Next scheduled occurrence
  - `active` (boolean) - Schedule status
  - `created_by` (UUID) - References `profiles.id`
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

##### `scheduled_job_instances`
- **Purpose**: Track generated job instances from schedules
- **Primary Key**: `id` (UUID)
- **Key Fields**:
  - `job_schedule_id` (UUID) - References `job_schedules.id`
  - `ticket_id` (integer, nullable) - References `tickets.id`
  - `due_date` (date) - Scheduled due date
  - `created_date` (date) - When instance was created
  - `status` (text) - 'created', 'completed', 'cancelled'
  - `created_at` (timestamptz)

## Security & Access Control

### Row Level Security (RLS)
All tables have RLS enabled with comprehensive policies:

#### User Access Patterns
- **Own Profile**: Users can view and update their own profile
- **Company-Based Access**: Users can access tickets/jobs assigned to their company
- **Role-Based Access**: Admin and edit roles have broader access
- **Reference Data**: All authenticated users can view reference data, only admins can modify

#### Policy Examples
```sql
-- Users can view tickets they created or are assigned to
CREATE POLICY "Users can view tickets they created or are assigned to"
  ON tickets FOR SELECT
  TO authenticated
  USING (
    who_raised_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND (
        p.company_id = tickets.assigned_company_id OR
        p.company_id = tickets.site_owner_company_id OR
        is_admin(auth.uid()) OR
        EXISTS (
          SELECT 1 FROM user_roles ur
          JOIN roles r ON r.id = ur.role_id
          WHERE ur.user_id = auth.uid()
          AND r.role_name = 'edit'
        )
      )
    )
  );
```

## Functions & Triggers

### Auto-Generation Functions
- **`generate_ticket_number()`**: Creates ticket numbers (T00001, F00001, etc.)
- **`generate_job_number()`**: Creates job numbers (J00001, J00002, etc.)
- **`calculate_next_due_date()`**: Calculates next occurrence for schedules

### Timestamp Triggers
- **`update_ticket_updated_at()`**: Updates `updated_at` on ticket changes
- **`update_jobs_updated_at()`**: Updates `updated_at` on job changes
- **`update_job_templates_updated_at()`**: Updates `updated_at` on template changes
- **`update_job_schedules_updated_at()`**: Updates `updated_at` on schedule changes

### User Management
- **`handle_new_user()`**: Creates profile and assigns default 'read' role for new users
- **`is_admin()`**: Checks if user has admin role

### Job Scheduling
- **`generate_scheduled_tickets()`**: Creates tickets from active schedules

## Indexes

### Performance Indexes
```sql
-- Tickets
CREATE INDEX idx_tickets_number ON tickets(ticket_number);
CREATE INDEX idx_tickets_status ON tickets(status);
CREATE INDEX idx_tickets_priority ON tickets(priority);

-- Communications
CREATE INDEX idx_communications_ticket_created ON communications(ticket_id, created_at DESC);

-- Jobs
CREATE INDEX idx_jobs_ticket_id ON jobs(ticket_id);
CREATE INDEX idx_jobs_assigned_to_user_id ON jobs(assigned_to_user_id);
CREATE INDEX idx_jobs_assigned_company_id ON jobs(assigned_company_id);
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_jobs_scheduled_dates ON jobs(scheduled_start_date, scheduled_end_date);

-- Job Scheduling
CREATE INDEX idx_job_templates_site_id ON job_templates(site_id);
CREATE INDEX idx_job_templates_active ON job_templates(active);
CREATE INDEX idx_job_schedules_template_id ON job_schedules(job_template_id);
CREATE INDEX idx_job_schedules_next_due_date ON job_schedules(next_due_date);
CREATE INDEX idx_job_schedules_active ON job_schedules(active);
```

## Data Flow

### Ticket Lifecycle
1. **Creation**: User creates ticket with site, owner, type, priority
2. **Assignment**: Admin assigns company and contact
3. **Job Creation**: Admin creates job assignment with scheduling
4. **Communication**: Users add messages and attachments
5. **Status Updates**: Track progress through status changes
6. **Completion**: Mark as resolved/closed

### Job Scheduling Flow
1. **Template Creation**: Admin creates reusable job template
2. **Schedule Definition**: Admin creates recurring schedule
3. **Automatic Generation**: System creates tickets based on schedule
4. **Instance Tracking**: Track generated instances to prevent duplicates
5. **Job Assignment**: Admin assigns jobs to companies/users

## Relationships

### Key Foreign Key Relationships
- `profiles.company_id` → `companies.id`
- `tickets.site_id` → `sites.id`
- `tickets.site_owner_company_id` → `companies.id`
- `tickets.assigned_company_id` → `companies.id`
- `tickets.assigned_contact_id` → `company_contacts.id`
- `jobs.ticket_id` → `tickets.id`
- `jobs.assigned_company_id` → `companies.id`
- `job_templates.site_id` → `sites.id`
- `job_templates.site_owner_company_id` → `companies.id`
- `job_schedules.job_template_id` → `job_templates.id`
- `scheduled_job_instances.job_schedule_id` → `job_schedules.id`

### Junction Tables
- `user_roles`: Links users to roles (many-to-many)
- `company_contacts`: Links companies to contacts (one-to-many)

## Constraints & Validation

### Check Constraints
- Ticket types: 'Job' or 'Fault'
- Ticket status: 'open', 'assigned', 'resolved', 'cancelled', 'closed'
- Job status: 'pending', 'in_progress', 'completed', 'on_hold'
- Frequency types: 'monthly', 'quarterly', 'semi_annually', 'annually', 'custom'
- Job template types: 'Job' or 'Fault'
- Scheduled instance status: 'created', 'completed', 'cancelled'

### Unique Constraints
- `profiles.email`
- `companies.company_name`
- `sites.site_name`
- `tickets.ticket_number`
- `jobs.job_number`
- `company_contacts` (company_id, contact_email)

## Migration History

The database has evolved through multiple migrations:
1. **Initial Setup**: Basic profiles and authentication
2. **Core Schema**: Complete ticketing system with reference data
3. **Role Management**: Migration from JSON roles to junction table
4. **Job Management**: Addition of job tracking system
5. **Job Scheduling**: Comprehensive scheduling and templating system
6. **Security Refinements**: Improved RLS policies and access control

This structure provides a robust foundation for facility management, maintenance scheduling, and work order tracking with comprehensive security and audit capabilities. 
