import { useState, useEffect, useCallback } from "react";
import useSpeechRecognition from "./useSpeechRecognition";
import useSpeechSynthesis from "./useSpeechSynthesis";

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: string;
  confidence?: number;
  urgency?: "low" | "medium" | "high";
}

type ConversationState = "idle" | "listening" | "thinking" | "speaking";

interface UseVoiceChatReturn {
  // State
  messages: Message[];
  conversationState: ConversationState;
  isListening: boolean;
  isSpeaking: boolean;
  currentTranscript: string;
  isLoading: boolean;

  // Actions
  startVoiceInput: () => void;
  stopVoiceInput: () => void;
  sendMessage: (text: string, confidence?: number) => void;
  clearMessages: () => void;
}

export default function useVoiceChat(): UseVoiceChatReturn {
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversationState, setConversationState] =
    useState<ConversationState>("idle");
  const [isLoading, setIsLoading] = useState(false);

  // Speech hooks
  const {
    transcript,
    isListening,
    startListening,
    stopListening,
    resetTranscript,
  } = useSpeechRecognition();

  const { speak, isSpeaking, stop: stopSpeaking } = useSpeechSynthesis();

  // Update conversation state based on speech status
  useEffect(() => {
    if (isListening) {
      setConversationState("listening");
    } else if (isSpeaking) {
      setConversationState("speaking");
    } else if (isLoading) {
      setConversationState("thinking");
    } else {
      setConversationState("idle");
    }
  }, [isListening, isSpeaking, isLoading]);

  // Handle voice input completion
  useEffect(() => {
    if (transcript && !isListening) {
      sendMessage(transcript);
      resetTranscript();
    }
  }, [isListening, transcript]);

  const startVoiceInput = useCallback(() => {
    // Stop any ongoing speech playback
    if (isSpeaking) {
      stopSpeaking();
    }
    startListening();
  }, [isSpeaking, startListening, stopSpeaking]);

  const stopVoiceInput = useCallback(() => {
    stopListening();
  }, [stopListening]);

  const sendMessage = useCallback(
    (text: string, confidence?: number) => {
      if (!text.trim()) return;

      // Add user message
      const userMessage: Message = {
        id: Date.now().toString(),
        text: text,
        isUser: true,
        timestamp: new Date().toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
        }),
        confidence,
      };
      setMessages((prev) => [...prev, userMessage]);

      // Simulate AI response (replace with actual API call)
      setIsLoading(true);
      setTimeout(() => {
        const aiResponseText =
          "I understand your concern. Based on what you've told me, I recommend monitoring your symptoms closely. If they worsen or persist, please consult a healthcare professional.";

        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: aiResponseText,
          isUser: false,
          timestamp: new Date().toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
          }),
          confidence: 0.85,
          urgency: "medium",
        };

        setMessages((prev) => [...prev, aiMessage]);
        setIsLoading(false);

        // Speak the AI response
        speak(aiResponseText);
      }, 2000);
    },
    [speak]
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
    if (isSpeaking) {
      stopSpeaking();
    }
  }, [isSpeaking, stopSpeaking]);

  return {
    // State
    messages,
    conversationState,
    isListening,
    isSpeaking,
    currentTranscript: transcript,
    isLoading,

    // Actions
    startVoiceInput,
    stopVoiceInput,
    sendMessage,
    clearMessages,
  };
}
