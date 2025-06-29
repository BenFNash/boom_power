# Clean Database Migrations

This directory contains a clean, step-by-step set of migrations for the Boom Power database system. These migrations are organized logically and can be run in sequence to set up the complete database structure.

## Migration Order

The migrations should be run in the following order:

1. **001_initial_setup.sql** - Extensions and basic configuration
2. **002_roles_and_profiles.sql** - User authentication and role management
3. **003_reference_data.sql** - Companies, sites, site owners, and contacts
4. **004_tickets_system.sql** - Main ticketing system with communications and attachments
5. **005_jobs_system.sql** - Job management and work assignments
6. **006_job_scheduling_system.sql** - Recurring job scheduling and templates
7. **007_sample_data.sql** - Sample data for testing and development

## Key Features

### Authentication & User Management
- **Profiles**: User profiles linked to Supabase Auth
- **Roles**: System roles (admin, edit, read, external)
- **User Roles**: Many-to-many relationship between users and roles
- **Automatic Role Assignment**: New users get 'read' role by default

### Reference Data
- **Companies**: Organizations that can be assigned work
- **Sites**: Physical locations where work is performed
- **Site Owners**: Entities that own/manage sites
- **Company Contacts**: Contact persons within companies

### Ticket Management
- **Tickets**: Main ticketing system for jobs and faults
- **Communications**: Messages and updates on tickets
- **Attachments**: File attachments for tickets and communications
- **Auto-numbering**: Automatic ticket number generation (T00001, F00001, etc.)

### Job Management
- **Jobs**: Work assignments linked to tickets
- **Job Status**: pending, in_progress, completed, on_hold
- **Auto-numbering**: Automatic job number generation (J00001, J00002, etc.)
- **Scheduling**: Planned start/end dates with actual tracking

### Job Scheduling System
- **Job Templates**: Reusable templates for recurring jobs
- **Job Schedules**: Recurring schedule definitions
- **Scheduled Instances**: Track generated job instances
- **Automatic Generation**: System creates tickets based on schedules

## Security Features

### Row Level Security (RLS)
All tables have RLS enabled with comprehensive policies:

- **Own Profile**: Users can view and update their own profile
- **Company-Based Access**: Users can access tickets/jobs assigned to their company
- **Role-Based Access**: Admin and edit roles have broader access
- **Reference Data**: All authenticated users can view, only admins can modify

### Access Patterns
- **Admin Users**: Full access to all data and management functions
- **Edit Users**: Can view and update tickets/jobs they have access to
- **Read Users**: Can view tickets/jobs assigned to their company
- **External Users**: Limited access based on specific assignments

## Functions and Triggers

### Auto-Generation Functions
- `generate_ticket_number()`: Creates ticket numbers (T00001, F00001, etc.)
- `generate_job_number()`: Creates job numbers (J00001, J00002, etc.)
- `calculate_next_due_date()`: Calculates next occurrence for schedules

### Timestamp Triggers
- `update_ticket_updated_at()`: Updates `updated_at` on ticket changes
- `update_jobs_updated_at()`: Updates `updated_at` on job changes
- `update_job_templates_updated_at()`: Updates `updated_at` on template changes
- `update_job_schedules_updated_at()`: Updates `updated_at` on schedule changes

### User Management
- `handle_new_user()`: Creates profile and assigns default 'read' role for new users
- `is_admin()`: Checks if user has admin role

### Job Scheduling
- `generate_scheduled_tickets()`: Creates tickets from active schedules

## Usage

### Running Migrations
```bash
# Apply all migrations in order
supabase db reset

# Or apply individual migrations
supabase db push
```

### Creating an Admin User
After running the migrations, you'll need to manually assign admin role to a user:

```sql
-- Get the admin role ID
SELECT id FROM roles WHERE role_name = 'admin';

-- Assign admin role to a user (replace with actual user ID)
INSERT INTO user_roles (user_id, role_id)
SELECT 
  'your-user-id-here',
  (SELECT id FROM roles WHERE role_name = 'admin');
```

### Testing the System
The sample data migration (007) provides:
- 5 sample companies
- 5 sample sites
- 5 sample site owners
- Sample company contacts
- Sample tickets and communications (if users exist)

## Database Schema Overview

```
profiles (users)
├── user_roles (junction table)
│   └── roles
├── companies
│   └── company_contacts
├── sites
├── site_owners
├── tickets
│   ├── communications
│   └── attachments
├── jobs
├── job_templates
├── job_schedules
└── scheduled_job_instances
```

## Benefits of This Structure

1. **Clean Separation**: Each migration focuses on a specific aspect of the system
2. **Logical Order**: Dependencies are properly handled
3. **Comprehensive Security**: RLS policies ensure data protection
4. **Scalable**: Structure supports growth and additional features
5. **Maintainable**: Clear organization makes updates easier
6. **Testable**: Sample data enables immediate testing

## Notes

- All tables use UUIDs for primary keys except tickets (which use auto-incrementing integers)
- Foreign key constraints ensure data integrity
- Indexes are created for optimal query performance
- All timestamps use `timestamptz` for timezone awareness
- The system is designed to work with Supabase Auth 