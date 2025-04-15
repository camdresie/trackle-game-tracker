import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database.types';
import { getEnvironment, getDatabaseEnvironment } from '@/utils/environment';

// Get environment variables with fallbacks
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

// Check for missing environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('==================== SUPABASE CONFIGURATION ERROR ====================');
  console.error('Missing Supabase environment variables. Please check your .env file:');
  if (!supabaseUrl) console.error('- VITE_SUPABASE_URL is missing');
  if (!supabaseAnonKey) console.error('- VITE_SUPABASE_ANON_KEY is missing');
  console.error('=================================================================');
}

// Log which environment we're using (for debugging)
const appEnv = getEnvironment();
const dbEnv = getDatabaseEnvironment();

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  },
  // Configure realtime with minimal settings to avoid WebSocket issues
  realtime: {
    // We just use minimal settings rather than trying to explicitly disable
    timeout: 1000, // Very short timeout to avoid long connection attempts
    params: {
      eventsPerSecond: 1,
    },
  },
  // Global error handler
  global: {
    fetch: (url: RequestInfo | URL, options?: RequestInit) => {
      // You can add custom headers or logging here if needed
      return fetch(url, options);
    },
    headers: {
      'X-App-Environment': appEnv,
    },
  },
});

// Disable all realtime subscriptions immediately after client creation
try {
  // @ts-ignore - Access internal method to disable realtime completely
  if (supabase?.realtime?.disconnect) {
    // This will immediately disconnect any realtime connections
    supabase.realtime.disconnect();
  }
} catch (error) {
  console.error('Error disabling realtime:', error);
}

// Create or ensure avatar bucket exists
export const ensureAvatarBucketExists = async () => {
  try {
    const { data: buckets } = await supabase.storage.listBuckets();
    const avatarBucketExists = buckets?.some(bucket => bucket.name === 'avatars');
    
    if (!avatarBucketExists) {
      await supabase.storage.createBucket('avatars', {
        public: true,
      });
      console.log('Created avatars bucket');
    }
    return true;
  } catch (error) {
    console.error('Error ensuring avatar bucket exists:', error);
    return false;
  }
};
