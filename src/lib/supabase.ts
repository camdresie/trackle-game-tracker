
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database.types';

const supabaseUrl = "https://vsimhtvroyqdsaxhrhaf.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZzaW1odHZyb3lxZHNheGhyaGFmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE2MTY2MDUsImV4cCI6MjA1NzE5MjYwNX0.3Uz_n2OocyusdOJjyPQ-4wXloniRU2vxyXusydLDQtY";

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

// Social Auth Providers
export const signInWithGoogle = async () => {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth`
    }
  });
  return { error };
};

export const signInWithApple = async () => {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'apple',
    options: {
      redirectTo: `${window.location.origin}/auth`
    }
  });
  return { error };
};
