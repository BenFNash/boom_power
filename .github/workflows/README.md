# GitHub Actions Workflows

This directory contains GitHub Actions workflows for automated deployment and CI/CD processes.

## Supabase Migrations Workflow

The `supabase-migrations.yml` workflow automatically deploys database migrations and edge functions to Supabase when code is pushed to the main branch.

### Setup Requirements

To use this workflow, you need to configure the following secrets in your GitHub repository:

1. **SUPABASE_ACCESS_TOKEN**: Your Supabase access token
   - Go to https://supabase.com/dashboard/account/tokens
   - Generate a new access token
   - Add it to your repository secrets

2. **SUPABASE_PROJECT_REF**: Your Supabase project reference ID
   - Found in your Supabase dashboard URL: `https://supabase.com/dashboard/project/{PROJECT_REF}`
   - Or in your project settings

3. **SUPABASE_DB_PASSWORD**: Your Supabase database password
   - Found in your Supabase project settings under Database > Connection string

### How to Add Secrets

1. Go to your GitHub repository
2. Click on "Settings" tab
3. Click on "Secrets and variables" → "Actions"
4. Click "New repository secret"
5. Add each secret with the exact names listed above

### What the Workflow Does

1. **Triggers**: Runs on pushes to main branch that affect:
   - `supabase/migrations/**` files
   - The workflow file itself

2. **Steps**:
   - Sets up Node.js environment
   - Installs Supabase CLI
   - Logs in to Supabase using access token
   - Links to your Supabase project
   - Deploys database migrations
   - Verifies migration deployment
   - Deploys edge functions (if any exist)
   - Provides deployment summary

### Manual Trigger

You can also manually trigger this workflow:
1. Go to "Actions" tab in your repository
2. Select "Supabase Migrations" workflow
3. Click "Run workflow"
4. Select the branch and click "Run workflow"

### Troubleshooting

- **Authentication errors**: Verify your `SUPABASE_ACCESS_TOKEN` is correct and not expired
- **Project linking errors**: Check that `SUPABASE_PROJECT_REF` matches your project ID
- **Database connection errors**: Ensure `SUPABASE_DB_PASSWORD` is correct
- **Migration conflicts**: Check that your local migrations are up to date with the remote database

### Security Notes

- Never commit secrets directly to your repository
- Use GitHub's built-in secret management
- Rotate your Supabase access token regularly
- Consider using environment-specific secrets for staging/production 