import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { authLogger } from '@/utils/logger';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);

      // If we have a session, ensure user record exists in database
      if (session?.user) {
        createUserIfNotExists(session.user);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);

      // If user just signed in, ensure user record exists
      if (session?.user) {
        await createUserIfNotExists(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Redirect to login if no user after loading
  useEffect(() => {
    if (!loading && !user) {
      navigate('/login', { replace: true });
    }
  }, [loading, user, navigate]);

  // Create user record in database if it doesn't exist
  const createUserIfNotExists = async (user: User) => {
    const { error } = await supabase
      .from('users')
      .upsert(
        {
          id: user.id,
          email: user.email!,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'id',
          ignoreDuplicates: false,
        }
      );

    if (error && error.code !== '23505') {
      // Ignore duplicate key errors
      console.error('Error creating user record:', error);
    }
  };

const signOut = async () => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) {
      authLogger.error('Failed to sign out', error);
      throw error;
    }
    // Clear local state immediately
    setUser(null);
    setSession(null);
    setLoading(false);
    navigate('/login', { replace: true });
  } catch (error) {
    authLogger.error('Unexpected error during sign out', error);
    throw error;
  }
};

  const value = {
    user,
    session,
    loading,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
