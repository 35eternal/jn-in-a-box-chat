import { supabase } from '@/integrations/supabase/client';

// Simple connection test
export const testSupabaseConnection = async () => {
  console.log('=== SUPABASE CONNECTION TEST ===');
  console.log('1. Testing basic connection...');
  
  try {
    // Test 1: Check if client is initialized
    console.log('Supabase client exists:', !!supabase);
    console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
    
    // Test 2: Try to get session (doesn't require RLS)
    console.log('2. Getting current session...');
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    console.log('Session result:', { sessionData, sessionError });
    
    // Test 3: Try a simple query with timeout
    console.log('3. Testing simple query...');
    const timeout = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Query timeout')), 3000)
    );
    
    const query = supabase
      .from('users')
      .select('count')
      .limit(1);
    
    const result = await Promise.race([query, timeout]);
    console.log('Query result:', result);
    
    console.log('=== CONNECTION TEST COMPLETE ===');
    return true;
  } catch (error) {
    console.error('=== CONNECTION TEST FAILED ===');
    console.error('Error:', error);
    return false;
  }
};
