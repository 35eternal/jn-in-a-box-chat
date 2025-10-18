import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

// Add timeout handling for VPN/restrictive networks
export const supabase = createClient<Database>(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  },
  global: {
    headers: {
      'x-client-info': 'hd-physique-web',
      'apikey': supabaseKey
    },
    fetch: (url, options = {}) => {
      // Add 30-second timeout to all requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);
      
      return fetch(url, {
        ...options,
        signal: controller.signal
      })
        .finally(() => clearTimeout(timeoutId))
        .catch(err => {
          if (err.name === 'AbortError') {
            console.error('⏱️ Request timeout - VPN or network issue');
            throw new Error('Request timeout - please check your internet connection');
          }
          throw err;
        });
    }
  },
  db: {
    schema: 'public'
  }
});

// Test connection on app load
console.log('🔌 Initializing Supabase client...');
supabase.auth.getSession()
  .then(({ data, error }) => {
    if (error) {
      console.error('⚠️ Supabase connection test failed:', error.message);
    } else {
      console.log('✅ Supabase connected successfully');
      console.log('👤 User session:', data.session ? 'Logged in' : 'Not logged in');
    }
  })
  .catch(err => {
    console.error('❌ Fatal: Cannot connect to Supabase:', err.message);
    console.error('💡 Check your VPN or network settings');
  });
