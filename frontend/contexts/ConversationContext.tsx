"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { supabase } from "@/lib/supabaseClient";
import { useSupabaseSession } from "@/hooks/useSupabaseSession";
import type {
  Conversation,
  Message,
  ConversationContextType,
} from "@/types/conversation";

const ConversationContext = createContext<ConversationContextType | undefined>(
  undefined
);

export function ConversationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useSupabaseSession();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] =
    useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load all conversations for the current user
  const loadConversations = useCallback(async () => {
    if (!user) {
      setConversations([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from("conversations")
        .select("*")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false });

      if (fetchError) throw fetchError;

      // Fetch last message for each conversation
      const conversationsWithPreviews = await Promise.all(
        (data || []).map(async (conv) => {
          const { data: lastMsg } = await supabase
            .from("messages")
            .select("content")
            .eq("conversation_id", conv.id)
            .order("created_at", { ascending: false })
            .limit(1)
            .single();

          return {
            ...conv,
            lastMessage:
              lastMsg?.content?.substring(0, 50) || "No messages yet",
          };
        })
      );

      setConversations(conversationsWithPreviews);
    } catch (err: any) {
      console.error("Error loading conversations:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Create a new conversation
  const createConversation = useCallback(
    async (title?: string): Promise<Conversation | null> => {
      if (!user) {
        setError("Must be logged in to create conversation");
        return null;
      }

      try {
        setLoading(true);
        setError(null);

        const { data, error: insertError } = await supabase
          .from("conversations")
          .insert({
            user_id: user.id,
            title: title || "New Conversation",
          })
          .select()
          .single();

        if (insertError) throw insertError;

        await loadConversations(); // Refresh list
        setCurrentConversation(data);
        setMessages([]);
        return data;
      } catch (err: any) {
        console.error("Error creating conversation:", err);
        setError(err.message);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [user, loadConversations]
  );

  // Select and load a conversation
  const selectConversation = useCallback(async (conversationId: string) => {
    try {
      setLoading(true);
      setError(null);

      // Get conversation details
      const { data: conv, error: convError } = await supabase
        .from("conversations")
        .select("*")
        .eq("id", conversationId)
        .single();

      if (convError) throw convError;

      setCurrentConversation(conv);
      await loadMessages(conversationId);
    } catch (err: any) {
      console.error("Error selecting conversation:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load messages for a conversation
  const loadMessages = useCallback(async (conversationId: string) => {
    try {
      setError(null);

      const { data, error: fetchError } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      if (fetchError) throw fetchError;

      setMessages(data || []);
    } catch (err: any) {
      console.error("Error loading messages:", err);
      setError(err.message);
    }
  }, []);

  // Add a message to a conversation
  const addMessage = useCallback(
    async (
      conversationId: string,
      role: "user" | "assistant",
      content: string
    ): Promise<Message | null> => {
      try {
        setError(null);

        const { data, error: insertError } = await supabase
          .from("messages")
          .insert({
            conversation_id: conversationId,
            role,
            content,
          })
          .select()
          .single();

        if (insertError) throw insertError;

        // Update conversation's updated_at
        await supabase
          .from("conversations")
          .update({ updated_at: new Date().toISOString() })
          .eq("id", conversationId);

        // Update local messages state
        setMessages((prev) => [...prev, data]);

        // Auto-generate title from first user message if title is still default
        if (
          role === "user" &&
          currentConversation?.title === "New Conversation"
        ) {
          const newTitle =
            content.substring(0, 50) + (content.length > 50 ? "..." : "");
          await renameConversation(conversationId, newTitle);
        }

        await loadConversations(); // Refresh conversation list
        return data;
      } catch (err: any) {
        console.error("Error adding message:", err);
        setError(err.message);
        return null;
      }
    },
    [currentConversation, loadConversations]
  );

  // Rename a conversation
  const renameConversation = useCallback(
    async (conversationId: string, newTitle: string) => {
      try {
        setError(null);

        const { error: updateError } = await supabase
          .from("conversations")
          .update({ title: newTitle })
          .eq("id", conversationId);

        if (updateError) throw updateError;

        // Update local state
        setConversations((prev) =>
          prev.map((conv) =>
            conv.id === conversationId ? { ...conv, title: newTitle } : conv
          )
        );

        if (currentConversation?.id === conversationId) {
          setCurrentConversation((prev) =>
            prev ? { ...prev, title: newTitle } : null
          );
        }
      } catch (err: any) {
        console.error("Error renaming conversation:", err);
        setError(err.message);
      }
    },
    [currentConversation]
  );

  // Delete a conversation
  const deleteConversation = useCallback(
    async (conversationId: string) => {
      try {
        setError(null);

        const { error: deleteError } = await supabase
          .from("conversations")
          .delete()
          .eq("id", conversationId);

        if (deleteError) throw deleteError;

        // Update local state
        setConversations((prev) =>
          prev.filter((conv) => conv.id !== conversationId)
        );

        if (currentConversation?.id === conversationId) {
          setCurrentConversation(null);
          setMessages([]);
        }
      } catch (err: any) {
        console.error("Error deleting conversation:", err);
        setError(err.message);
      }
    },
    [currentConversation]
  );

  // Clear current conversation
  const clearCurrentConversation = useCallback(() => {
    setCurrentConversation(null);
    setMessages([]);
  }, []);

  // Clear all conversations (for delete all history)
  const clearAllConversations = useCallback(() => {
    setConversations([]);
    setCurrentConversation(null);
    setMessages([]);
  }, []);

  // Load conversations when user logs in
  useEffect(() => {
    if (user) {
      loadConversations();
    } else {
      setConversations([]);
      setCurrentConversation(null);
      setMessages([]);
    }
  }, [user, loadConversations]);

  const value: ConversationContextType = {
    conversations,
    currentConversation,
    messages,
    loading,
    error,
    loadConversations,
    createConversation,
    selectConversation,
    renameConversation,
    deleteConversation,
    loadMessages,
    addMessage,
    clearCurrentConversation,
    clearAllConversations,
  };

  return (
    <ConversationContext.Provider value={value}>
      {children}
    </ConversationContext.Provider>
  );
}

export function useConversation() {
  const context = useContext(ConversationContext);
  if (!context) {
    throw new Error("useConversation must be used within ConversationProvider");
  }
  return context;
}
