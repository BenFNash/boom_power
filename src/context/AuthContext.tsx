import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { User, Role } from '../types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signInWithProvider: (provider: 'google' | 'microsoft') => Promise<{ error: any }>;
  signOut: () => Promise<{ error: any }>;
}

const defaultContext: AuthContextType = {
  user: null,
  loading: true,
  signIn: async () => ({ error: new Error('Not implemented') }),
  signInWithProvider: async () => ({ error: new Error('Not implemented') }),
  signOut: async () => ({ error: new Error('Not implemented') }),
};

const AuthContext = createContext<AuthContextType>(defaultContext);

export const useAuth = () => useContext(AuthContext);

// UUID validation regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getUser = async () => {
      setLoading(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          // Validate UUID format before querying
          if (!UUID_REGEX.test(session.user.id)) {
            throw new Error('Invalid user ID format');
          }

          // Fetch user profile with company name
          const { data: userData, error: profileError } = await supabase
            .from('profiles')
            .select(`
              id,
              email,
              name,
              company:companies(company_name),
              created_at
            `)
            .eq('id', session.user.id)
            .single();
            
          if (profileError) throw profileError;

          // Fetch user roles
          const { data: roleData, error: roleError } = await supabase
            .from('user_roles')
            .select(`
              roles(role_name)
            `)
            .eq('user_id', session.user.id);
          console.log(roleData)

          if (roleError) throw roleError;

          // Extract role names from the role data
          const userRoles = roleData
            ?.map(r => r.roles?.role_name as Role)
            .filter(Boolean) || ['read'];

          if (userData) {
            setUser({
              id: session.user.id,
              email: session.user.email || '',
              name: userData.name || '',
              roles: userRoles,
              company: userData.company?.company_name || '',
              createdAt: userData.created_at,
              firstName: userData.name?.split(' ')[0] || '',
              lastName: userData.name?.split(' ')[1] || ''
            });
          } else {
            // Handle case where no profile exists
            console.warn('No profile found for user:', session.user.id);
            setUser({
              id: session.user.id,
              email: session.user.email || '',
              name: '',
              roles: ['read'],
              company: '',
              createdAt: new Date().toISOString(),
              firstName: '',
              lastName: ''
            });
          }
        }
      } catch (error) {
        console.error('Error getting user:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session?.user) {
          // When auth state changes, fetch user data again
          getUser();
        } else {
          setUser(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signInWithProvider = async (provider: 'google' | 'microsoft') => {
    const { error } = await supabase.auth.signInWithOAuth({ 
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    return { error };
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      
      // If we get a 403 with session_not_found, just clear the local state
      if (error?.status === 403 && error.message?.includes('session_not_found')) {
        setUser(null);
        return { error: null };
      }
      
      return { error };
    } catch (error: any) {
      // Handle any other errors and ensure user is logged out locally
      console.error('Error during sign out:', error);
      setUser(null);
      return { error };
    }
  };

  const value = {
    user,
    loading,
    signIn,
    signInWithProvider,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};