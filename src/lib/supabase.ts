
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database.types';

const supabaseUrl = "https://vsimhtvroyqdsaxhrhaf.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZzaW1odHZyb3lxZHNheGhyaGFmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE2MTY2MDUsImV4cCI6MjA1NzE5MjYwNX0.3Uz_n2OocyusdOJjyPQ-4wXloniRU2vxyXusydLDQtY";

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

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
