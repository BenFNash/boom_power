# Boom Power Operations and Maintenance

A comprehensive operations and maintenance management system built with React, TypeScript, and Supabase.

## Features

- **Ticket Management**: Create, track, and manage maintenance tickets
- **Job Scheduling**: Automated job scheduling and template management
- **Company Management**: Multi-company support with contact management
- **Reference Data**: Centralized management of sites, companies, and contacts
- **Communication Threads**: In-ticket communication with file attachments
- **Role-based Access**: Admin, edit, read, and external user roles

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **State Management**: Zustand
- **UI Components**: Custom component library with dark mode support

## Development

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase CLI

### Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd boom_power
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Supabase**
   ```bash
   # Install Supabase CLI
   npm install -g supabase
   
   # Login to Supabase
   supabase login
   
   # Link to your project
   supabase link --project-ref <your-project-ref>
   ```

4. **Run migrations**
   ```bash
   supabase db push
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

## Database Migrations

This project uses automated GitHub Actions to deploy database migrations to Supabase.

### Automatic Deployment

Migrations are automatically deployed when:
- Code is pushed to the `main` branch
- Migration files in `supabase/migrations/` are modified

### Manual Deployment

To manually deploy migrations:
1. Go to GitHub Actions tab
2. Select "Supabase Migrations" workflow
3. Click "Run workflow"

### Development Workflow

For feature branches, use the development workflow:
- Validates migration files
- Checks naming conventions
- Runs on pull requests to main

See [`.github/workflows/README.md`](.github/workflows/README.md) for detailed setup instructions.

## Project Structure

```
src/
├── components/          # React components
│   ├── admin/          # Admin-specific components
│   ├── common/         # Shared UI components
│   ├── communications/ # Communication components
│   ├── layout/         # Layout components
│   └── tickets/        # Ticket-related components
├── context/            # React context providers
├── lib/                # Utilities and services
│   ├── services/       # API service functions
│   └── stores/         # Zustand state stores
├── pages/              # Page components
└── types/              # TypeScript type definitions

supabase/
├── migrations/         # Database migrations
├── functions/          # Edge functions
└── config.toml         # Supabase configuration
```

## Contributing

1. Create a feature branch from `main`
2. Make your changes
3. Add/update migrations if needed
4. Test your changes locally
5. Create a pull request
6. Ensure CI checks pass
7. Request review and merge

## License

[Add your license information here]
