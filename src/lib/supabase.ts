import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database.types';
import { getEnvironment, getDatabaseEnvironment } from '@/utils/environment';

// Get environment variables with fallbacks
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

// Log which environment we're using (for debugging)
const appEnv = getEnvironment();
const dbEnv = getDatabaseEnvironment();
console.log(`App Environment: ${appEnv}`);
console.log(`Database Environment: ${dbEnv} (URL: ${supabaseUrl})`);

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});

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
