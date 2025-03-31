import { createContext, useContext, useEffect, useState, ReactNode, useCallback, useMemo } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { toast } from 'sonner';

type Profile = {
  id: string;
  username: string | null;
  avatar_url: string | null;
  full_name: string | null;
  selected_games: string[] | null;
};

type AuthContextType = {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast: uiToast } = useToast();

  // Memoize the fetchProfile function to prevent unnecessary re-renders
  const fetchProfile = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching profile details:', error);
        // Don't throw error here, just set profile to null
        setProfile(null);
        setIsLoading(false);
        return;
      }

      setProfile(data);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching profile:', error);
      setProfile(null);
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setIsLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          fetchProfile(session.user.id);
        } else {
          setProfile(null);
          setIsLoading(false);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  // Memoize auth methods to prevent unnecessary re-renders
  const signIn = useCallback(async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
    } catch (error: any) {
      uiToast({
        title: 'Sign in failed',
        description: error.message,
        variant: 'destructive',
      });
      throw error;
    }
  }, [uiToast]);

  const signUp = useCallback(async (email: string, password: string) => {
    try {
      // Sign up the user without a username in metadata
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });
      
      if (error) throw error;
      
      if (!data.user) {
        throw new Error('User data not returned from signup');
      }
      
      // Create the profile record immediately with null username
      // Username will be set during onboarding
      const { error: insertError } = await supabase
        .from('profiles')
        .insert({
          id: data.user.id,
          username: null,
          full_name: null,
          avatar_url: null,
          selected_games: null
        });
        
      if (insertError) {
        console.error('Error creating profile after signup:', insertError);
      }
      
      uiToast({
        title: 'Account created',
        description: 'Check your email to confirm your account',
      });
    } catch (error: any) {
      uiToast({
        title: 'Sign up failed',
        description: error.message,
        variant: 'destructive',
      });
      throw error;
    }
  }, [uiToast]);

  const signOut = useCallback(async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error: any) {
      uiToast({
        title: 'Sign out failed',
        description: error.message,
        variant: 'destructive',
      });
    }
  }, [uiToast]);

  const updateProfile = useCallback(async (updates: Partial<Profile>) => {
    if (!user) return;

    try {
      // First check if profile exists
      const { data: existingProfile, error: checkError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .maybeSingle();
        
      if (checkError && checkError.code !== 'PGRST116') {
        console.error('Error checking profile existence:', checkError);
        toast.error('Failed to update profile');
        throw checkError;
      }
      
      // If profile doesn't exist, create it first
      if (!existingProfile) {
        const { data: newProfile, error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            ...updates,
          })
          .select()
          .single();
          
        if (insertError) {
          console.error('Error creating profile:', insertError);
          toast.error('Failed to create profile');
          throw insertError;
        }
        
        setProfile(newProfile);
        toast.success('Profile created successfully');
        return;
      }
      
      // Update existing profile
      const { data: updatedProfile, error: updateError } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single();
        
      if (updateError) {
        console.error('Error updating profile:', updateError);
        toast.error('Failed to update profile');
        throw updateError;
      }
      
      setProfile(updatedProfile);
      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Error in updateProfile:', error);
      toast.error('An error occurred while updating profile');
      throw error;
    }
  }, [user]);

  // Memoize the context value to prevent unnecessary re-renders of consuming components
  const contextValue = useMemo(() => ({
    session,
    user,
    profile,
    isLoading,
    signIn,
    signUp,
    signOut,
    updateProfile,
  }), [session, user, profile, isLoading, signIn, signUp, signOut, updateProfile]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
