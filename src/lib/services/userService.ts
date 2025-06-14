import { supabase } from '../supabase';
import { User } from '../../types';

export const userService = {
  async getUsers() {
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select(`
        id,
        email,
        name,
        company:companies(company_name),
        created_at
      `)
      .order('created_at', { ascending: false });

    if (profilesError) throw profilesError;

    // Fetch roles for each user
    const userRoles = await Promise.all(
      profiles.map(async (profile) => {
        const { data: roles } = await supabase
          .from('user_roles')
          .select('roles(role_name)')
          .eq('user_id', profile.id);
        
        return {
          ...profile,
          roles: roles?.map(r => r.roles.role_name) || ['read']
        };
      })
    );

    return userRoles.map(user => ({
      id: user.id,
      email: user.email,
      name: user.name || '',
      roles: user.roles as string[],
      company: user.company?.company_name || '',
      createdAt: user.created_at,
      firstName: user.name?.split(' ')[0] || '',
      lastName: user.name?.split(' ')[1] || ''
    })) as User[];
  },

  async updateUser(id: string, data: Partial<User>) {
    // Find company ID based on company name
    let companyId = null;
    if (data.company) {
      const { data: companyData } = await supabase
        .from('companies')
        .select('id')
        .eq('company_name', data.company)
        .single();
      companyId = companyData?.id;
    }

    // Update profile
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        name: data.name,
        company_id: companyId
      })
      .eq('id', id);

    if (profileError) throw profileError;

    // Update roles if provided
    if (data.roles) {
      // Get role IDs for the new roles
      const { data: roleIds } = await supabase
        .from('roles')
        .select('id, role_name')
        .in('role_name', data.roles);

      if (roleIds) {
        // Get existing roles
        const { data: existingRoles } = await supabase
          .from('user_roles')
          .select('role_id')
          .eq('user_id', id);

        // Create a set of existing role IDs
        const existingRoleIds = new Set(existingRoles?.map(r => r.role_id));
        
        // Determine which roles to add and remove
        const rolesToAdd = roleIds.filter(role => !existingRoleIds.has(role.id));
        const rolesToRemove = existingRoles?.filter(
          existingRole => !roleIds.some(role => role.id === existingRole.role_id)
        );

        // Add new roles
        if (rolesToAdd.length > 0) {
          await supabase
            .from('user_roles')
            .insert(
              rolesToAdd.map(role => ({
                user_id: id,
                role_id: role.id
              }))
            );
        }

        // Remove roles that are no longer needed
        if (rolesToRemove?.length) {
          await supabase
            .from('user_roles')
            .delete()
            .eq('user_id', id)
            .in('role_id', rolesToRemove.map(r => r.role_id));
        }
      }
    }
  },

  async deleteUser(id: string) {
    const { error } = await supabase.auth.admin.deleteUser(id);
    if (error) throw error;
  },

  async sendPasswordResetEmail(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `/auth/reset-password`
    });
    if (error) throw error;
  }
};