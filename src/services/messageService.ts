import { supabase } from '@/integrations/supabase/client';

export interface Message {
  id: string;
  chat_id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

// Get all messages for a chat
export const getChatMessages = async (chatId: string): Promise<Message[]> => {
  try {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('chat_id', chatId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching messages:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Exception fetching messages:', error);
    return [];
  }
};

// Create a new message
export const createMessage = async (
  chatId: string,
  role: 'user' | 'assistant',
  content: string
): Promise<Message | null> => {
  try {
    const { data, error } = await supabase
      .from('messages')
      .insert({
        chat_id: chatId,
        role: role,
        content: content,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating message:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Exception creating message:', error);
    return null;
  }
};

// Delete a message
export const deleteMessage = async (messageId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('messages')
      .delete()
      .eq('id', messageId);

    if (error) {
      console.error('Error deleting message:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Exception deleting message:', error);
    return false;
  }
};

// Delete all messages for a chat
export const deleteChatMessages = async (chatId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('messages')
      .delete()
      .eq('chat_id', chatId);

    if (error) {
      console.error('Error deleting chat messages:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Exception deleting chat messages:', error);
    return false;
  }
};
