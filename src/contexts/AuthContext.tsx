
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
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
  signUp: (email: string, password: string, username: string) => Promise<void>;
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
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      console.log('Fetching profile for user:', userId);

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching profile details:', error);
        throw error;
      }

      console.log('Fetched profile data:', data);
      setProfile(data);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching profile:', error);
      setIsLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
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
  };

  const signUp = async (email: string, password: string, username: string) => {
    try {
      // First, check if username is already taken
      const { data: existingUser, error: usernameCheckError } = await supabase
        .from('profiles')
        .select('username')
        .eq('username', username)
        .maybeSingle();
        
      if (usernameCheckError) {
        throw usernameCheckError;
      }
      
      if (existingUser) {
        throw new Error('Username is already taken');
      }
      
      console.log(`Starting signup process with username: ${username}`);
      
      // Sign up the user with username in metadata
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: username,
          },
        },
      });
      
      if (error) throw error;
      
      console.log("Sign up successful, user data:", data);
      
      if (!data.user) {
        throw new Error('User data not returned from signup');
      }
      
      // Important: Check if profile exists first
      const { data: existingProfile, error: profileCheckError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', data.user.id)
        .maybeSingle();
      
      if (profileCheckError && profileCheckError.code !== 'PGRST116') {
        console.error('Error checking if profile exists:', profileCheckError);
      }
      
      if (!existingProfile) {
        // Profile doesn't exist yet, create it manually
        console.log(`Creating new profile for user ${data.user.id} with username: ${username}`);
        
        const { error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: data.user.id,
            username: username,
            full_name: null,
            avatar_url: null,
            selected_games: null
          });
          
        if (insertError) {
          console.error('Error creating profile after signup:', insertError);
        }
      } else {
        // Profile exists (likely created by trigger), update the username
        console.log(`Updating existing profile for user ${data.user.id} with username: ${username}`);
        
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ username: username })
          .eq('id', data.user.id);
          
        if (updateError) {
          console.error('Error updating profile with username:', updateError);
        }
      }
      
      // Verify profile was created with correct username
      const { data: profileVerification, error: verificationError } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', data.user.id)
        .maybeSingle();
        
      if (verificationError) {
        console.error('Error verifying profile username:', verificationError);
      } else if (profileVerification) {
        console.log('Profile verification - username set to:', profileVerification.username);
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
  };

  const signOut = async () => {
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
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) return;

    try {
      console.log('Updating profile with:', updates);
      
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
        console.log('Profile not found, creating new profile');
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
        
        console.log('New profile created:', newProfile);
        setProfile(newProfile);
        toast.success('Profile created successfully');
        return;
      }
      
      // Update existing profile
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating profile from Supabase:', error);
        toast.error('Failed to update profile');
        throw error;
      }

      console.log('Profile updated successfully:', data);
      
      // Fix: Update the profile state with the complete data returned from the server
      setProfile(data);

      toast.success('Profile updated successfully');
    } catch (error: any) {
      console.error('Failed to update profile:', error);
      toast.error('Failed to update profile');
      throw error;
    }
  };

  const value = {
    session,
    user,
    profile,
    isLoading,
    signIn,
    signUp,
    signOut,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
