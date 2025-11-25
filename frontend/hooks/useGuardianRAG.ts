/**
 * useGuardianRAG Hook
 * React hook for Guardian AI RAG operations
 */

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  sendChatMessage,
  sendChatMessageStream,
  uploadPDF,
  uploadText,
  checkBackendHealth,
  type ChatResponse,
  type IngestResponse,
} from "@/lib/guardianApi";

export function useGuardianRAG() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Get Supabase JWT token
   */
  const getToken = async (): Promise<string> => {
    if (!user) {
      throw new Error("User not authenticated");
    }

    // Get token from Supabase session
    const { supabase } = await import("@/lib/supabaseClient");
    const { data } = await supabase.auth.getSession();

    if (!data.session?.access_token) {
      throw new Error("No valid session token");
    }

    return data.session.access_token;
  };

  /**
   * Send chat message with RAG
   */
  const chat = async (
    message: string,
    conversationId?: string,
    onChunk?: (chunk: string) => void,
    onStatus?: (status: string) => void
  ): Promise<ChatResponse | null> => {
    setLoading(true);
    setError(null);

    try {
      console.log("🔵 [useGuardianRAG] Starting chat request...");
      console.log("🔵 [useGuardianRAG] User:", user);
      console.log("🔵 [useGuardianRAG] Message:", message);

      const token = await getToken();
      console.log("🔵 [useGuardianRAG] Got token:", token ? "✓" : "✗");

      if (onChunk) {
        // Use streaming
        return new Promise<ChatResponse | null>((resolve) => {
          sendChatMessageStream(
            message,
            token,
            conversationId,
            onChunk,
            (response) => {
              console.log("🔵 [useGuardianRAG] Stream complete:", response);
              setLoading(false);
              resolve(response);
            },
            onStatus
          ).catch((err) => {
            const errorMsg = err.message || "Failed to send message";
            setError(errorMsg);
            console.error("🔴 [useGuardianRAG] Chat error:", err);
            setLoading(false);
            resolve(null);
          });
        });
      } else {
        // Use standard request
        const response = await sendChatMessage(message, token, conversationId);
        console.log("🔵 [useGuardianRAG] Response:", response);
        return response;
      }
    } catch (err: any) {
      const errorMsg = err.message || "Failed to send message";
      setError(errorMsg);
      console.error("🔴 [useGuardianRAG] Chat error:", err);
      console.error("🔴 [useGuardianRAG] Error message:", errorMsg);
      setLoading(false);
      return null;
    }
  };

  /**
   * Upload PDF for ingestion
   */
  const ingestPDF = async (file: File): Promise<IngestResponse | null> => {
    setLoading(true);
    setError(null);

    try {
      const token = await getToken();
      const response = await uploadPDF(file, token);
      return response;
    } catch (err: any) {
      const errorMsg = err.message || "Failed to upload PDF";
      setError(errorMsg);
      console.error("PDF upload error:", err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Upload text for ingestion
   */
  const ingestText = async (
    text: string,
    source?: string
  ): Promise<IngestResponse | null> => {
    setLoading(true);
    setError(null);

    try {
      const token = await getToken();
      const response = await uploadText(text, token, source);
      return response;
    } catch (err: any) {
      const errorMsg = err.message || "Failed to upload text";
      setError(errorMsg);
      console.error("Text upload error:", err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Check backend health
   */
  const healthCheck = async (): Promise<boolean> => {
    try {
      return await checkBackendHealth();
    } catch {
      return false;
    }
  };

  return {
    chat,
    ingestPDF,
    ingestText,
    healthCheck,
    loading,
    error,
    isAuthenticated: !!user,
  };
}
