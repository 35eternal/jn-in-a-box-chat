import { supabase } from '@/integrations/supabase/client';
import { chatLogger } from '@/utils/logger';
import { PersonalizationData, parsePersonalizationData } from '@/types/database';

// Re-export for backward compatibility
export type { PersonalizationData };

export interface Chat {
  id: string;
  user_id: string;
  title: string;
  personalization: PersonalizationData | null;
  created_at: string;
  updated_at: string;
  is_private: boolean;
}

// Create a new chat
export const createChat = async (
  userId: string,
  title: string = 'New Chat'
): Promise<Chat | null> => {
  try {
    chatLogger.debug('Creating chat', { userId, title });
    
    // First, ensure user exists in users table using upsert
    // This is idempotent - if user exists, nothing happens
    const { error: userError } = await supabase
      .from('users')
      .upsert(
        { 
          id: userId,
          email: '', // Email should already be set by trigger, this is just for safety
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        { 
          onConflict: 'id',
          ignoreDuplicates: true 
        }
      );

    if (userError) {
      chatLogger.warn('Error ensuring user exists (may already exist)', userError);
    }
    
    // Now create the chat
    const { data, error } = await supabase
      .from('chats')
      .insert({
        user_id: userId,
        title: title,
        is_private: false,
      })
      .select()
      .single();

    if (error) {
      chatLogger.error('Failed to create chat', error);
      return null;
    }

    chatLogger.info('Chat created successfully', { chatId: data.id });
    return {
      ...data,
      personalization: parsePersonalizationData(data.personalization),
      is_private: data.is_private ?? false,
    };
  } catch (error) {
    chatLogger.error('Exception creating chat', error);
    return null;
  }
};

// Get all chats for a user (excluding private chats)
export const getUserChats = async (userId: string): Promise<Chat[]> => {
  try {
    const { data, error } = await supabase
      .from('chats')
      .select('*')
      .eq('user_id', userId)
      .or('is_private.is.null,is_private.eq.false')
      .order('created_at', { ascending: false });

    if (error) {
      chatLogger.error('Failed to fetch chats', error);
      return [];
    }

    return (data || []).map(chat => ({
      ...chat,
      personalization: parsePersonalizationData(chat.personalization),
      is_private: chat.is_private ?? false,
    }));
  } catch (error) {
    chatLogger.error('Exception fetching chats', error);
    return [];
  }
};

// Get a single chat by ID
export const getChatById = async (chatId: string): Promise<Chat | null> => {
  try {
    const { data, error } = await supabase
      .from('chats')
      .select('*')
      .eq('id', chatId)
      .single();

    if (error) {
      chatLogger.error('Failed to fetch chat', { chatId, error });
      return null;
    }

    return {
      ...data,
      personalization: parsePersonalizationData(data.personalization),
      is_private: data.is_private ?? false,
    };
  } catch (error) {
    chatLogger.error('Exception fetching chat', error);
    return null;
  }
};

// Update chat title
export const updateChatTitle = async (
  chatId: string,
  title: string
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('chats')
      .update({ title })
      .eq('id', chatId);

    if (error) {
      chatLogger.error('Failed to update chat title', { chatId, error });
      return false;
    }

    chatLogger.info('Chat title updated', { chatId, title });
    return true;
  } catch (error) {
    chatLogger.error('Exception updating chat title', error);
    return false;
  }
};

// Update chat personalization
export const updatePersonalization = async (
  chatId: string,
  personalization: PersonalizationData
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('chats')
      .update({ personalization: personalization as any })
      .eq('id', chatId);

    if (error) {
      chatLogger.error('Failed to update personalization', { chatId, error });
      return false;
    }

    chatLogger.info('Personalization updated', { chatId });
    return true;
  } catch (error) {
    chatLogger.error('Exception updating personalization', error);
    return false;
  }
};

// Delete a chat (cascade deletes messages)
export const deleteChat = async (chatId: string): Promise<boolean> => {
  try {
    const { error } = await supabase.from('chats').delete().eq('id', chatId);

    if (error) {
      chatLogger.error('Failed to delete chat', { chatId, error });
      return false;
    }

    chatLogger.info('Chat deleted', { chatId });
    return true;
  } catch (error) {
    chatLogger.error('Exception deleting chat', error);
    return false;
  }
};

// Auto-generate title from first message (first 50 chars)
export const generateChatTitle = (firstMessage: string): string => {
  const maxLength = 50;
  if (firstMessage.length <= maxLength) {
    return firstMessage;
  }
  return firstMessage.substring(0, maxLength - 3) + '...';
};
