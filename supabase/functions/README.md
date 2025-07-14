# Supabase Edge Functions

This directory contains edge functions for the Boom Power application.

## Functions

### 1. `invite-user`
- **Purpose**: Invite new users to the system
- **Method**: POST
- **Access**: Admin only
- **Payload**: `{ email: string, roles: string[] }`

### 2. `get-user-tickets`
- **Purpose**: Get tickets with proper company-based access control
- **Method**: POST
- **Access**: All authenticated users (with role-based filtering)
- **Payload**: 
  ```typescript
  {
    filters?: {
      status?: string;
      type?: string;
      site_id?: string;
      priority?: string;
      assigned_company_id?: string;
      site_owner_company_id?: string;
    };
    searchQuery?: string;
    pagination?: {
      page?: number;
      pageSize?: number;
    };
  }
  ```

### 3. `get-ticket-by-id`
- **Purpose**: Get individual ticket with proper company-based access control
- **Method**: POST
- **Access**: All authenticated users (with role-based filtering)
- **Payload**: `{ ticketId: string }`

## Access Control Logic

### Role-Based Access

1. **Admin Role**: Can access all tickets
2. **Edit Role**: Can access all tickets
3. **Read Role**: Can access all tickets (read-only)
4. **External Role**: Can only access tickets where:
   - Their company owns the site (`site_owner_company_id` matches their `company_id`)
   - Their company is assigned to the ticket (`assigned_company_id` matches their `company_id`)
   - They created the ticket (`who_raised_id` matches their `user_id`)
5. **No Role**: Can only access tickets they created

### Company-Based Access

The edge functions implement company-based access control by checking:
- Site ownership: `tickets.site_owner_company_id = profiles.company_id`
- Ticket assignment: `tickets.assigned_company_id = profiles.company_id`
- Ticket creation: `tickets.who_raised_id = profiles.id`

## Usage in Frontend

### Using Edge Functions for Ticket Access

```typescript
import { ticketService } from '../lib/services/ticketService';

// Get tickets with proper access control
const tickets = await ticketService.getTickets(
  { status: 'open' }, // filters
  'search term',      // searchQuery
  1,                  // page
  10                  // pageSize
);

// Get individual ticket with proper access control
const ticket = await ticketService.getTicketById('123');
```

### Fallback to Direct Database Access

The service also provides direct database access methods for backward compatibility:

```typescript
// Direct database access (subject to RLS policies)
const tickets = await ticketService.getTickets();
const ticket = await ticketService.getTicketById('123');
```

## Security Benefits

1. **Centralized Access Control**: All ticket access logic is centralized in edge functions
2. **Audit Trail**: Edge function calls can be logged and monitored
3. **Consistent Logic**: Same access control logic applied everywhere
4. **Restrictive RLS**: Database-level policies are very restrictive, forcing use of edge functions
5. **Role-Based Filtering**: Proper role-based access control implemented

## Deployment

To deploy these functions:

```bash
# Deploy all functions
supabase functions deploy

# Deploy specific function
supabase functions deploy get-user-tickets
supabase functions deploy get-ticket-by-id
```

## Environment Variables

Ensure these environment variables are set in your Supabase project:
- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_ANON_KEY`: Your Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key (for admin operations)

## Testing

You can test the functions using the Supabase CLI:

```bash
# Test get-user-tickets function
supabase functions serve get-user-tickets --env-file .env.local

# Test get-ticket-by-id function
supabase functions serve get-ticket-by-id --env-file .env.local
```

## Migration Notes

The RLS policies have been made very restrictive to ensure that edge functions are the primary way to access tickets. This provides better security and centralized access control. 
