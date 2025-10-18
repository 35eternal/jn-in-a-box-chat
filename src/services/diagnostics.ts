import { supabase } from '@/integrations/supabase/client';

// Diagnostic: Check if user exists in users table and create if not
export const ensureUserExists = async (authUserId: string, email: string) => {
  try {
    console.log('Checking if user exists in users table...', authUserId);
    
    // Check if user exists
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('id')
      .eq('id', authUserId)
      .single();
    
    console.log('User check result:', { existingUser, checkError });
    
    if (checkError && checkError.code === 'PGRST116') {
      // User doesn't exist, create them
      console.log('User not found in users table, creating...');
      
      const { data: newUser, error: insertError } = await supabase
        .from('users')
        .insert({
          id: authUserId,
          email: email,
          user_metadata: {}
        })
        .select()
        .single();
      
      console.log('User creation result:', { newUser, insertError });
      
      if (insertError) {
        console.error('Failed to create user:', insertError);
        return false;
      }
      
      console.log('User created successfully!');
      return true;
    }
    
    if (existingUser) {
      console.log('User already exists in users table');
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error in ensureUserExists:', error);
    return false;
  }
};
