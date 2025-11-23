/**
 * Conversation and Message types for the chat system
 */

export interface Conversation {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
  updated_at: string;
  lastMessage?: string; // Preview of last message (computed)
  messageCount?: number; // Number of messages (computed)
}

export interface Message {
  id: string;
  conversation_id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

export interface ConversationContextType {
  // State
  conversations: Conversation[];
  currentConversation: Conversation | null;
  messages: Message[];
  loading: boolean;
  error: string | null;

  // Conversation actions
  loadConversations: () => Promise<void>;
  createConversation: (title?: string) => Promise<Conversation | null>;
  selectConversation: (conversationId: string) => Promise<void>;
  renameConversation: (
    conversationId: string,
    newTitle: string
  ) => Promise<void>;
  deleteConversation: (conversationId: string) => Promise<void>;

  // Message actions
  loadMessages: (conversationId: string) => Promise<void>;
  addMessage: (
    conversationId: string,
    role: "user" | "assistant",
    content: string
  ) => Promise<Message | null>;

  // Utility
  clearCurrentConversation: () => void;
}
