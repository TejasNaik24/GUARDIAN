import { useState, useCallback } from "react";

/**
 * Type definitions for the chat hook
 */

type MessageRole = "user" | "assistant";

interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: Date;
  media?: File[];
}

interface BackendPayload {
  message: string;
  media?: File[];
}

interface BackendResponse {
  role: MessageRole;
  content: string;
  urgency?: "normal" | "high";
}

interface UseChatReturn {
  messages: ChatMessage[];
  input: string;
  setInput: (value: string) => void;
  sendMessage: () => Promise<void>;
  isLoading: boolean;
  attachments: File[];
  addAttachment: (file: File) => void;
  removeAttachment: (index: number) => void;
  resetChat: () => void;
}

/**
 * useChat Hook
 *
 * Manages text-based chat interactions for Guardian AI assistant:
 * 1. Handle text input and message state
 * 2. Support media attachments (images/videos)
 * 3. Send messages to backend API
 * 4. Manage loading and error states
 * 5. Display conversation history
 *
 * @returns {UseChatReturn} Chat state and control functions
 */
export default function useChat(): UseChatReturn {
  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [attachments, setAttachments] = useState<File[]>([]);

  // ============================================================================
  // BACKEND API CALL (Placeholder)
  // ============================================================================

  /**
   * Call backend API to get AI response
   * TODO: Replace with real API endpoint when backend is ready
   *
   * @param payload - User message and optional media files
   * @returns Backend response with assistant message
   */
  const callBackend = async (
    payload: BackendPayload
  ): Promise<BackendResponse> => {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Mock response based on user input
    let mockContent =
      "I understand your concern. Based on what you've told me, I recommend monitoring your symptoms closely. If they worsen or persist, please consult a healthcare professional.";

    // Add context-aware mock responses
    if (payload.media && payload.media.length > 0) {
      mockContent = `I can see you've shared ${payload.media.length} file(s) with me. Based on the information provided, I recommend consulting with a healthcare professional for a proper evaluation. This appears to require medical attention.`;
    } else if (payload.message.toLowerCase().includes("emergency")) {
      mockContent =
        "⚠️ If this is a medical emergency, please call 911 immediately or go to the nearest emergency room. I'm an AI assistant and cannot provide emergency medical care.";
    } else if (payload.message.toLowerCase().includes("pain")) {
      mockContent =
        "I understand you're experiencing pain. Can you describe the pain level (1-10), location, and when it started? This will help me provide better guidance. Remember, for severe pain, please seek immediate medical attention.";
    }

    // TODO: Replace with actual API call
    // const response = await fetch('/api/assistant/chat', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(payload),
    // });
    // const data = await response.json();
    // return data;

    return {
      role: "assistant",
      content: mockContent,
      urgency: "normal",
    };
  };

  // ============================================================================
  // MESSAGE HANDLING
  // ============================================================================

  /**
   * Send a message to the backend and add response to chat
   */
  const sendMessage = useCallback(async () => {
    // Validate input
    if (!input.trim() && attachments.length === 0) {
      return;
    }

    // Create user message
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: input.trim() || "Sent media",
      timestamp: new Date(),
      media: attachments.length > 0 ? [...attachments] : undefined,
    };

    // Add user message to chat
    setMessages((prev) => [...prev, userMessage]);

    // Clear input and attachments
    const currentInput = input;
    const currentAttachments = [...attachments];
    setInput("");
    setAttachments([]);

    // Set loading state
    setIsLoading(true);

    try {
      // Call backend API
      const response = await callBackend({
        message: currentInput,
        media: currentAttachments.length > 0 ? currentAttachments : undefined,
      });

      // Create assistant message
      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: response.role,
        content: response.content,
        timestamp: new Date(),
      };

      // Add assistant message to chat
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Failed to send message:", error);

      // Add error message to chat
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        role: "assistant",
        content:
          "I'm having trouble connecting right now. Please try again in a moment. If this is urgent, please call 911 or visit your nearest emergency room.",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [input, attachments]);

  // ============================================================================
  // ATTACHMENT HANDLING
  // ============================================================================

  /**
   * Add a media file to attachments
   * @param file - Image or video file to attach
   */
  const addAttachment = useCallback((file: File) => {
    // Validate file type
    const validTypes = ["image/jpeg", "image/jpg", "image/png", "video/mp4"];

    if (!validTypes.includes(file.type)) {
      console.warn("Invalid file type. Only JPG, PNG, and MP4 are supported.");
      return;
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB in bytes
    if (file.size > maxSize) {
      console.warn("File too large. Maximum size is 10MB.");
      return;
    }

    // Add to attachments
    setAttachments((prev) => [...prev, file]);
  }, []);

  /**
   * Remove an attachment by index
   * @param index - Index of attachment to remove
   */
  const removeAttachment = useCallback((index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  }, []);

  // ============================================================================
  // CHAT MANAGEMENT
  // ============================================================================

  /**
   * Reset chat to initial state
   * Clears all messages, input, and attachments
   */
  const resetChat = useCallback(() => {
    setMessages([]);
    setInput("");
    setAttachments([]);
    setIsLoading(false);
  }, []);

  // ============================================================================
  // RETURN PUBLIC API
  // ============================================================================

  return {
    messages,
    input,
    setInput,
    sendMessage,
    isLoading,
    attachments,
    addAttachment,
    removeAttachment,
    resetChat,
  };
}
