"use client";

import { useState, useEffect, useRef } from "react";
import { flushSync } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import GuardianAvatar from "./GuardianAvatar";
import SpeechInputControls from "./SpeechInputControls";
import { useSpeechContext } from "@/components/speech/SpeechProvider";
import useChat from "@/hooks/useChat";
import { useAuth } from "@/contexts/AuthContext";
import { useGuardianRAG } from "@/hooks/useGuardianRAG";
import { useConversation } from "@/contexts/ConversationContext";
import AuthModal from "../auth/AuthModal";
import type { Message as ContextMessage } from "@/types/conversation";

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: string;
  mediaUrl?: string;
  mediaUrls?: string[]; // For multiple images
  mediaType?: "image" | "video";
}

type ConversationState = "idle" | "listening" | "thinking" | "speaking";

export default function VoiceChatContainer() {
  const { isGuest, session } = useAuth();
  const { chat } = useGuardianRAG();
  const { messages: contextMessages, currentConversation } = useConversation();
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<
    string | undefined
  >(undefined);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [voiceUploadedFiles, setVoiceUploadedFiles] = useState<File[]>([]);
  const [pendingImages, setPendingImages] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [conversationState, setConversationState] =
    useState<ConversationState>("idle");
  const [showTranscript, setShowTranscript] = useState(false);
  const [showDisclaimer, setShowDisclaimer] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const lastMessageRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Chat hook for text mode
  const {
    messages: chatMessages,
    input: chatInput,
    setInput: setChatInput,
    sendMessage: sendChatMessage,
    isLoading: isChatLoading,
    attachments,
    addAttachment,
    removeAttachment,
  } = useChat();

  // Speech hooks from global context
  const {
    transcript,
    state: speechState,
    isVoiceMode,
    toggleVoiceMode,
    isMicMuted,
    toggleMic,
    speak,
    isTTSSupported: isSupported
  } = useSpeechContext();

  // Map speech state to local conversation state
  const isListening = speechState === 'listening';
  const isSpeaking = speechState === 'speaking';

  // Use messages array for both voice and text modes since we call backend directly
  const displayMessages: Message[] = messages;

  // Auto-scroll to bottom when USER sends a message (ChatGPT-style)
  useEffect(() => {
    // Only scroll if there are messages
    if (displayMessages.length === 0) return;

    // Find the most recent user message
    const userMessages = displayMessages.filter(msg => msg.isUser);
    if (userMessages.length === 0) return;

    const lastUserMessage = userMessages[userMessages.length - 1];

    // Scroll to the user's message after it's rendered
    setTimeout(() => {
      // Find the user's message element
      const messageElement = document.querySelector(`[data-message-id="${lastUserMessage.id}"]`);
      if (messageElement) {
        messageElement.scrollIntoView({
          behavior: "smooth",
          block: "start",
          inline: "nearest",
        });
      }
    }, 100); // Small delay to ensure DOM is updated
  }, [displayMessages.length]); // Trigger when message count changes // Auto-hide disclaimer
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowDisclaimer(false);
    }, 4000);
    return () => clearTimeout(timer);
  }, []);

  // Sync messages when currentConversation changes (user clicks on past conversation)
  useEffect(() => {
    if (currentConversation) {
      // Convert context messages to local message format
      const convertedMessages: Message[] = contextMessages.map((msg) => ({
        id: msg.id,
        text: msg.content,
        isUser: msg.role === "user",
        timestamp: new Date(msg.created_at).toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
        }),
      }));

      setMessages(convertedMessages);
      setCurrentConversationId(currentConversation.id);
      console.log("📋 [VoiceChatContainer] Loaded", convertedMessages.length, "messages from conversation:", currentConversation.id);
    }
  }, [currentConversation, contextMessages]);

  // Update conversation state based on speech status
  useEffect(() => {
    if (isVoiceMode) {
      if (isSpeaking) {
        setConversationState("speaking");
      } else if (conversationState === "thinking") {
        // Keep thinking state until speaking starts
      } else if (!isMicMuted) {
        // Always show listening state when unmuted and not speaking/thinking
        setConversationState("listening");
      } else {
        setConversationState("idle");
      }
    }
  }, [
    isListening,
    isSpeaking,
    isMicMuted,
    isVoiceMode,
    conversationState,
  ]);

  // Handle voice input completion
  useEffect(() => {
    if (transcript && !isListening && !isMicMuted) {
      handleVoiceSendMessage(transcript);
      // resetTranscript is handled by SpeechProvider on toggle/start
    }
  }, [isListening]);

  const [thinkingText, setThinkingText] = useState("Thinking");
  const streamingContentRef = useRef("");
  const streamingMessageIdRef = useRef<string | null>(null);

  // Typing effect loop
  useEffect(() => {
    const interval = setInterval(() => {
      if (!streamingMessageIdRef.current) return;

      setMessages((prev) => {
        const msgIndex = prev.findIndex(m => m.id === streamingMessageIdRef.current);
        if (msgIndex === -1) return prev;

        const currentText = prev[msgIndex].text;
        const targetText = streamingContentRef.current;

        if (currentText.length < targetText.length) {
          // Add 1-2 chars per frame for smooth typing
          // 20ms interval = 50 frames/sec
          // 1 char/frame = 50 chars/sec (good speed)
          // Adjust based on how far behind we are
          const charsBehind = targetText.length - currentText.length;
          const speedMultiplier = charsBehind > 50 ? 3 : charsBehind > 20 ? 2 : 1;

          const nextChars = targetText.slice(currentText.length, currentText.length + speedMultiplier);

          const newMessages = [...prev];
          newMessages[msgIndex] = {
            ...newMessages[msgIndex],
            text: currentText + nextChars
          };
          return newMessages;
        } else if (currentText.length === targetText.length && targetText.length > 0) {
          // Typing is complete - turn off generating state
          setIsGenerating(false);
        }
        return prev;
      });
    }, 20);

    return () => clearInterval(interval);
  }, []);

  // Stop generation handler
  const handleStop = () => {
    console.log("🛑 [VoiceChatContainer] Stopping generation");
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsGenerating(false);
    setConversationState("idle");
    streamingMessageIdRef.current = null;
  };

  // Voice mode message handler (calls Guardian backend)
  const handleVoiceSendMessage = async (text: string, media?: File | File[]) => {
    console.log("🎤 [VoiceChatContainer] Voice mode sending:", text);
    if (!text.trim() && !media) return;

    // Set generating state
    setIsGenerating(true);

    // Auto-mute immediately after query submission
    console.log("🔇 [VoiceChatContainer] Auto-muting microphone");
    if (!isMicMuted) {
      toggleMic(); // Mute
    }

    setConversationState("thinking");

    // Handle multiple files
    const files = Array.isArray(media) ? media : media ? [media] : [];

    // Create media URLs for all files
    const mediaUrls = files.map(file => URL.createObjectURL(file));
    const mediaType = files.length > 0 && files[0].type.startsWith("video/") ? "video" : "image";

    // Add user message with ALL images
    const userMessage: Message = {
      id: Date.now().toString(),
      text: text || (files.length > 0 ? `Sent ${files.length} files` : "Sent media"),
      isUser: true,
      timestamp: new Date().toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
      }),
      mediaUrls: mediaUrls, // Use plural for multiple
      mediaUrl: mediaUrls[0], // Fallback for single
      mediaType,
    };
    setMessages((prev) => [...prev, userMessage]);

    // Create empty assistant message immediately
    const assistantMessageId = (Date.now() + 1).toString();
    const assistantMessage: Message = {
      id: assistantMessageId,
      text: "", // EMPTY - will be filled by streaming
      isUser: false,
      timestamp: new Date().toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
      }),
    };
    setMessages((prev) => [...prev, assistantMessage]);

    // Setup streaming refs
    streamingMessageIdRef.current = assistantMessageId;
    streamingContentRef.current = "";

    // Call Guardian AI backend with conversation_id if exists
    setThinkingText("Thinking");
    setConversationState("thinking");

    // Track start time for minimum display duration
    const startTime = Date.now();

    // If we have images, we use the vision API (which doesn't stream yet in this implementation, but we simulate it)
    // OR we use the chat API if no images. 
    // Wait, the chat() hook is for text only. We need to handle images differently.
    // Since we are in handleVoiceSendMessage, we need to decide which API to call.

    if (files.length > 0 && mediaType === "image") {
      // Use handleImageAnalysis logic but for batch
      // We can't call handleImageAnalysis directly because it adds its own messages
      // So we'll call the API directly here
      try {
        const token = session?.access_token;
        if (!token) throw new Error("Not authenticated");

        const { analyzeImageWithVision } = await import("@/lib/guardianApi");
        const response = await analyzeImageWithVision(files, token, text, currentConversationId);

        if (response.conversation_id && !currentConversationId) {
          setCurrentConversationId(response.conversation_id);
        }

        // Simulate streaming for the response
        const fullText = response.final_answer;
        streamingContentRef.current = fullText;

        // We need to manually trigger the typing effect since we bypassed the chat() hook
        // The useEffect loop reads from streamingContentRef.current, so we just set it?
        // No, the useEffect loop appends characters. If we set it all at once, it might jump.
        // Let's just set conversationState to idle and let the loop catch up?
        // Actually, the loop compares currentText length to targetText length.
        // So setting streamingContentRef.current = fullText will trigger the typing.

        setConversationState("idle");

        // Speak response
        if (isVoiceMode && !isMicMuted) {
          speak(fullText);
        }

        // Don't set isGenerating false here - the typing effect useEffect will handle it

      } catch (error) {
        console.error("Error analyzing images:", error);
        setMessages((prev) => prev.filter(m => m.id !== assistantMessageId));
        const errorMessage: Message = {
          id: (Date.now() + 2).toString(),
          text: "Sorry, I couldn't analyze the images.",
          isUser: false,
          timestamp: new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
        };
        setMessages((prev) => [...prev, errorMessage]);
        setConversationState("idle");
        setIsGenerating(false);
      }
      return;
    }

    // Normal text chat
    const response = await chat(
      text,
      currentConversationId,
      (chunk: string) => {
        streamingContentRef.current += chunk;
        if (streamingContentRef.current.length > 0 && conversationState === "thinking") {
          // switch state if needed
        }
      },
      (status: string) => {
        if (status === "generating") setThinkingText("Thinking...");
      }
    );

    setConversationState("idle");

    if (response) {
      if (response.conversation_id && !currentConversationId) {
        setCurrentConversationId(response.conversation_id);
      }
      streamingContentRef.current = response.message;
      setConversationState("speaking");
      speak(response.message);
      // Don't set isGenerating false here - the typing effect useEffect will handle it
    } else {
      setMessages((prev) => prev.filter(m => m.id !== assistantMessageId));
      streamingMessageIdRef.current = null;
      const errorMessage: Message = {
        id: (Date.now() + 2).toString(),
        text: "Sorry, I couldn't process your request.",
        isUser: false,
        timestamp: new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, errorMessage]);
      setConversationState("idle");
    }
  };

  // Text mode message handler (calls Guardian backend too)
  const handleTextSendMessage = async (text: string, media?: File | File[]) => {
    if (!text.trim() && !media) return;

    setIsGenerating(true);

    console.log("📝 [VoiceChatContainer] Text mode sending:", text);
    console.log("📁 [VoiceChatContainer] Media:", media);

    // Normalize media to array
    const files = Array.isArray(media) ? media : media ? [media] : [];

    // Check if media contains images
    const imageTypes = ["image/jpeg", "image/jpg", "image/png", "image/heic", "image/webp"];
    const images = files.filter(f => imageTypes.includes(f.type));

    console.log(`🖼️ [VoiceChatContainer] Found ${images.length} images`);

    if (images.length > 0) {
      // Handle images with vision API
      console.log("✅ [VoiceChatContainer] Calling handleImageAnalysis");
      await handleImageAnalysis(images, text.trim() || undefined);
      return;
    }

    // Create media URLs for all files
    const mediaUrls = files.map(file => URL.createObjectURL(file));
    const mediaType = files.length > 0 && files[0].type.startsWith("video/") ? "video" : "image";

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      text: text || (files.length > 0 ? `Sent ${files.length} files` : "Sent media"),
      isUser: true,
      timestamp: new Date().toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
      }),
      mediaUrls: mediaUrls,
      mediaUrl: mediaUrls[0],
      mediaType,
    };
    setMessages((prev) => [...prev, userMessage]);

    // Create empty assistant message immediately
    const assistantMessageId = (Date.now() + 1).toString();
    const assistantMessage: Message = {
      id: assistantMessageId,
      text: "", // EMPTY - will be filled by streaming
      isUser: false,
      timestamp: new Date().toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
      }),
    };
    setMessages((prev) => [...prev, assistantMessage]);

    // Setup streaming refs
    streamingMessageIdRef.current = assistantMessageId;
    streamingContentRef.current = "";

    // Call Guardian AI backend
    console.log(
      "🔄 [VoiceChatContainer] Setting conversationState to 'thinking'"
    );
    setThinkingText("Thinking");
    setConversationState("thinking");

    // Track start time for minimum display duration
    const startTime = Date.now();
    console.log("⏱️ [VoiceChatContainer] Start time:", startTime);

    const response = await chat(
      text,
      currentConversationId,
      (chunk: string) => {
        // Just update the target content, the useEffect loop handles the UI update
        streamingContentRef.current += chunk;

        // Stop "thinking" animation as soon as we get the first chunk
        if (streamingContentRef.current.length > 0) {
          setConversationState("idle");
        }
      },
      (status: string) => {
        console.log("📊 [VoiceChatContainer] Status received:", status);
        if (status === "generating") {
          setThinkingText("Thinking...");
        }
      }
    );

    // Ensure minimum 800ms display time for "Thinking" indicator ONLY if we haven't started streaming yet
    const elapsed = Date.now() - startTime;
    const minDisplayTime = 800;

    if (!streamingContentRef.current && elapsed < minDisplayTime) {
      // Only wait if we haven't received any text yet
    }

    console.log(
      "✅ [VoiceChatContainer] Response received, setting state to 'idle'"
    );
    setConversationState("idle");


    if (response) {
      // Store conversation_id from response
      if (response.conversation_id && !currentConversationId) {
        setCurrentConversationId(response.conversation_id);
      }

      // Final update to ensure consistency
      // We update the REF to the final message, and let the loop catch up
      streamingContentRef.current = response.message;
      // Don't set isGenerating false here - the typing effect useEffect will handle it
    } else {
      // Error handling
      setMessages((prev) => prev.filter(m => m.id !== assistantMessageId));
      streamingMessageIdRef.current = null;

      const errorMessage: Message = {
        id: (Date.now() + 2).toString(),
        text: "Sorry, I couldn't process your request. Please try again.",
        isUser: false,
        timestamp: new Date().toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
        }),
      };
      setMessages((prev) => [...prev, errorMessage]);
      setConversationState("idle");
      setIsGenerating(false);
    }
  };

  const handleToggleMic = () => {
    toggleMic();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    console.log("🔍 [handleFileUpload] Files:", files);
    console.log("🎙️ [handleFileUpload] VOICE MODE HANDLER CALLED!");
    if (!files || files.length === 0) return;

    // Convert to array
    const newFiles = Array.from(files);
    const file = newFiles[0]; // Take first file for type checking logic, but we'll process all

    console.log("📁 [handleFileUpload] File type:", file.type, "Name:", file.name);

    // Check if it's an image
    const imageTypes = ["image/jpeg", "image/jpg", "image/png", "image/heic", "image/webp"];
    const isImage = imageTypes.includes(file.type);
    console.log("🖼️ [handleFileUpload] Is image?", isImage);

    if (isImage) {
      // For images: switch to text mode and add to pending images
      console.log("✅ [handleFileUpload] Image detected - switching to text mode");

      // Switch to text mode and set pending images
      if (isVoiceMode) {
        toggleVoiceMode();
      }

      // Append new files to pending images (up to 4 total)
      setPendingImages(prev => {
        const remaining = 4 - prev.length;
        const toAdd = newFiles.slice(0, remaining);
        return [...prev, ...toAdd];
      });
    } else {
      // Handle audio/video for voice mode
      const validTypes = [
        "video/mp4",
        "audio/mpeg",
        "audio/mp3",
        "audio/wav",
      ];

      if (validTypes.includes(file.type)) {
        const remainingSlots = 4 - voiceUploadedFiles.length;
        if (remainingSlots > 0) {
          const toAdd = newFiles.slice(0, remainingSlots);
          setVoiceUploadedFiles([...voiceUploadedFiles, ...toAdd]);
        }
      }
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleImageAnalysis = async (files: File[], userMessage?: string) => {
    console.log("🚀 [handleImageAnalysis] Starting image analysis for files:", files.length);
    console.log("💬 [handleImageAnalysis] User message:", userMessage || "(none)");

    setIsGenerating(true);

    try {
      // Create preview URLs for all images
      const mediaUrls = files.map(file => URL.createObjectURL(file));

      // Add user message with image previews
      const userImageMessage: Message = {
        id: Date.now().toString(),
        text: userMessage || "", // No default text - just empty if no message provided
        isUser: true,
        timestamp: new Date().toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
        }),
        mediaUrls: mediaUrls,
        mediaUrl: mediaUrls[0],
        mediaType: "image",
      };
      setMessages((prev) => [...prev, userImageMessage]);

      // Set thinking state
      setConversationState("thinking");

      // Get token (optional for guest users)
      const token = session?.access_token || undefined;

      // Call vision API with ALL files
      const { analyzeImageWithVision } = await import("@/lib/guardianApi");
      const response = await analyzeImageWithVision(files, token, userMessage, currentConversationId);

      // Store conversation ID if returned
      if (response.conversation_id && !currentConversationId) {
        console.log("📝 Storing conversation ID from vision response:", response.conversation_id);
        setCurrentConversationId(response.conversation_id);
      }

      // Add assistant response with typing effect
      const assistantMessageId = (Date.now() + 1).toString();
      const fullText = response.final_answer;

      // Create initial empty message
      const assistantMessage: Message = {
        id: assistantMessageId,
        text: "",
        isUser: false,
        timestamp: new Date().toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
        }),
      };

      setMessages((prev) => [...prev, assistantMessage]);
      // Keep thinking state visible until we start typing
      // Don't set to idle yet - wait for typing to start

      // Type out the response character by character
      let currentIndex = 0;
      const typingInterval = setInterval(() => {
        if (currentIndex < fullText.length) {
          // Set to idle on first character to remove "Thinking..."
          if (currentIndex === 0) {
            setConversationState("idle");
          }

          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMessageId
                ? { ...msg, text: fullText.substring(0, currentIndex + 1) }
                : msg
            )
          );
          currentIndex++;
        } else {
          clearInterval(typingInterval);

          // Speak response if voice mode and not muted (after typing completes)
          if (isVoiceMode && !isMicMuted) {
            speak(fullText);
          }
          setIsGenerating(false);
        }
      }, 10); // 10ms per character for faster typing

    } catch (error) {
      console.error("Error analyzing image:", error);
      const errorMessage: Message = {
        id: (Date.now() + 2).toString(),
        text: `Sorry, I couldn't analyze the images: ${error instanceof Error ? error.message : "Unknown error"}`,
        isUser: false,
        timestamp: new Date().toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
        }),
      };
      setMessages((prev) => [...prev, errorMessage]);
      setConversationState("idle");
      setIsGenerating(false);
    }
  };

  const handleRemoveVoiceFile = (index: number) => {
    setVoiceUploadedFiles(voiceUploadedFiles.filter((_, i) => i !== index));
  };

  // Drag and drop handlers
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Only set to false if we're leaving the main container
    if (e.currentTarget === e.target) {
      setIsDragging(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length === 0) return;

    const file = files[0]; // Take first file
    console.log("📁 [Drag&Drop] File dropped:", file.type, file.name);

    // Check if it's an image
    const imageTypes = ["image/jpeg", "image/jpg", "image/png", "image/heic", "image/webp"];
    const isImage = imageTypes.includes(file.type);

    if (isImage) {
      // For images: switch to text mode and add to pending images
      console.log("✅ [Drag&Drop] Image detected - switching to text mode");
      if (isVoiceMode) {
        toggleVoiceMode();
      }
      setPendingImages([file]);
    } else if (file.type === "application/pdf") {
      // For PDFs, you might want to handle differently in the future
      console.log("📄 [Drag&Drop] PDF detected");
      // For now, just show a message
      const message: Message = {
        id: Date.now().toString(),
        text: "PDF upload coming soon! For now, please use the upload button for documents.",
        isUser: false,
        timestamp: new Date().toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
        }),
      };
      setMessages((prev) => [...prev, message]);
    } else {
      // Unsupported file type
      const message: Message = {
        id: Date.now().toString(),
        text: `Sorry, ${file.type || "this file type"} is not supported yet. Please upload images (JPG, PNG) for vision analysis.`,
        isUser: false,
        timestamp: new Date().toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
        }),
      };
      setMessages((prev) => [...prev, message]);
    }
  };


  const handleSendVoiceFiles = () => {
    if (voiceUploadedFiles.length > 0) {
      // Send with first file for now (backend will be updated later for multiple)
      handleVoiceSendMessage("Uploaded media", voiceUploadedFiles[0]);
      setVoiceUploadedFiles([]);
    }
  };

  const handleToggleMode = () => {
    toggleVoiceMode();
  };

  return (
    <div
      className="flex flex-col h-screen bg-[#F9FAFB]"
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* Header */}
      <header className="bg-white border-b border-[#E5E7EB] pl-2 pr-4 md:pr-6 py-2 shadow-sm">
        <div className="w-full flex items-center justify-between">
          {/* Guardian Text & Logo */}
          <div className="flex items-center gap-1">
            <img
              src="/images/guardian-logo.png"
              alt="GUARDIAN Logo"
              className="w-[56px] h-[56px] object-contain"
            />
            <h1 className="text-lg font-semibold text-[#1E3A8A]">GUARDIAN</h1>
          </div>

          {/* Mode Toggle and Auth Buttons */}
          <div className="flex items-center gap-3">
            {/* Login/Signup Buttons - only show for guests */}
            {isGuest && (
              <div className="bg-white rounded-full px-2 py-2 shadow-md border border-[#E5E7EB] inline-flex items-center gap-2">
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="px-3 py-1.5 text-xs font-medium text-[#64748B] hover:text-[#1E3A8A] rounded-full transition-colors cursor-pointer"
                >
                  Log in
                </button>
                <button
                  onClick={() => {
                    setAuthMode("signup");
                    setShowAuthModal(true);
                  }}
                  className="relative px-3 py-1.5 rounded-full text-xs font-medium text-white transition-all cursor-pointer"
                >
                  <div className="absolute inset-0 bg-linear-to-br from-[#1E3A8A] to-[#3B82F6] rounded-full" />
                  <span className="relative z-10">Sign up</span>
                </button>
              </div>
            )}

            {/* Mode Toggle */}
            <div className="bg-white rounded-full px-2 py-2 shadow-md border border-[#E5E7EB] inline-flex items-center gap-2">
              <button
                onClick={() => isVoiceMode && handleToggleMode()}
                className={`relative px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${!isVoiceMode ? "text-white" : "text-[#64748B]"
                  }`}
              >
                {!isVoiceMode && (
                  <motion.div
                    layoutId="modeToggle"
                    className="absolute inset-0 bg-linear-to-br from-[#1E3A8A] to-[#3B82F6] rounded-full"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-1.5">
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
                  </svg>
                  Text
                </span>
              </button>

              <button
                onClick={() => !isVoiceMode && handleToggleMode()}
                className={`relative px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${isVoiceMode ? "text-white" : "text-[#64748B]"
                  }`}
              >
                {isVoiceMode && (
                  <motion.div
                    layoutId="modeToggle"
                    className="absolute inset-0 bg-linear-to-br from-[#1E3A8A] to-[#3B82F6] rounded-full"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-1.5">
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                    />
                  </svg>
                  Voice
                </span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Auth Modal */}
      <AnimatePresence>
        {showAuthModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-100 bg-black/60 backdrop-blur-md flex items-center justify-center p-4"
          >
            <AuthModal
              isOpen={true}
              onClose={() => setShowAuthModal(false)}
              mode={authMode}
              onSwitchMode={setAuthMode}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <motion.div
        ref={messagesContainerRef}
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
        className={`flex-1 px-4 md:px-6 py-6 pb-24 md:pb-6 ${displayMessages.length <= 1 ? "overflow-hidden" : "overflow-y-auto"
          }`}
      >
        <div className="max-w-4xl mx-auto">
          {isVoiceMode ? (
            <>
              {/* Guardian Avatar - Center Stage */}
              <div className="flex items-center justify-center min-h-[60vh]">
                <GuardianAvatar state={conversationState} />
              </div>
            </>
          ) : (
            /* Text Mode - Full Chat View */
            <>
              {/* Empty State or Messages */}
              {displayMessages.length === 0 ? (
                <div className="flex flex-col items-center justify-center min-h-[70vh] text-center">
                  <h3 className="text-2xl font-semibold text-[#1E3A8A] mb-8">
                    How can I assist you today?
                  </h3>

                  {/* Centered input box for empty state */}
                  <div className="w-full max-w-3xl px-4">
                    <SpeechInputControls
                      isVoiceMode={isVoiceMode}
                      onToggleMode={handleToggleMode}
                      isListening={isListening}
                      onToggleMic={() => { }}
                      onSendMessage={handleTextSendMessage}
                      disabled={isChatLoading}
                      currentTranscript={transcript}
                      pendingImages={displayMessages.length === 0 ? pendingImages : []}
                      onPendingImagesChange={displayMessages.length === 0 ? setPendingImages : undefined}
                      isGenerating={isGenerating}
                      onStop={handleStop}
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <AnimatePresence mode="popLayout">
                    {displayMessages
                      .filter((message) => message.text || message.mediaUrl || (message.mediaUrls && message.mediaUrls.length > 0))
                      .map((message) => (
                        <motion.div
                          key={message.id}
                          data-message-id={message.id}
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.15, ease: "easeOut" }}
                        >
                          {/* Media attachment - show first */}
                          {/* Media attachment - show first */}
                          {(message.mediaUrls?.length || 0) > 0 ? (
                            <div
                              className={`mb-3 ${message.isUser
                                ? "flex justify-end"
                                : "flex justify-start"
                                }`}
                            >
                              <div className={`grid gap-2 ${message.mediaUrls!.length > 1 ? "grid-cols-2 max-w-sm" : "max-w-xs"}`}>
                                {message.mediaUrls!.map((url, idx) => (
                                  <div
                                    key={idx}
                                    onClick={() => {
                                      if (message.mediaType !== "video") {
                                        setPreviewImage(url);
                                      }
                                    }}
                                    className={`rounded-xl overflow-hidden shadow-md border border-[#E5E7EB] ${message.mediaType !== "video"
                                      ? "cursor-pointer"
                                      : ""
                                      } ${message.mediaUrls!.length === 1 ? "w-full" : "aspect-square object-cover"}`}
                                  >
                                    {message.mediaType === "video" ? (
                                      <video
                                        src={url}
                                        controls
                                        className="w-full h-full object-cover"
                                      />
                                    ) : (
                                      <img
                                        src={url}
                                        alt={`Shared media ${idx + 1}`}
                                        className="w-full h-full object-cover"
                                      />
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : message.mediaUrl && (
                            // Fallback for old messages or single mediaUrl
                            <div
                              className={`mb-3 ${message.isUser
                                ? "flex justify-end"
                                : "flex justify-start"
                                }`}
                            >
                              <div
                                onClick={() => {
                                  if (message.mediaType !== "video") {
                                    setPreviewImage(message.mediaUrl!);
                                  }
                                }}
                                className={`max-w-xs rounded-xl overflow-hidden shadow-md border border-[#E5E7EB] ${message.mediaType !== "video"
                                  ? "cursor-pointer"
                                  : ""
                                  }`}
                              >
                                {message.mediaType === "video" ? (
                                  <video
                                    src={message.mediaUrl}
                                    controls
                                    className="w-full"
                                  />
                                ) : (
                                  <img
                                    src={message.mediaUrl}
                                    alt="Shared media"
                                    className="w-full"
                                  />
                                )}
                              </div>
                            </div>
                          )}
                          {/* Text message bubble - only show if there's text */}
                          {message.text && (
                            <div
                              className={`flex w-full ${message.isUser ? "justify-end" : "justify-start"
                                } mb-4`}
                            >
                              <div
                                className={`flex flex-col max-w-[80%] md:max-w-[70%] ${message.isUser ? "items-end" : "items-start"
                                  }`}
                              >
                                <div
                                  className={`rounded-2xl px-5 py-3 shadow-sm ${message.isUser
                                    ? "bg-linear-to-br from-[#3B82F6] to-[#60A5FA] text-white"
                                    : "bg-white text-[#1E3A8A] border border-[#E5E7EB]"
                                    }`}
                                >
                                  <p className="text-sm md:text-base leading-relaxed whitespace-pre-wrap wrap-break-word">
                                    {message.text}
                                  </p>
                                </div>
                                {message.timestamp && (
                                  <span className="text-xs text-[#64748B] mt-1 px-2">
                                    {message.timestamp}
                                  </span>
                                )}
                              </div>
                            </div>
                          )}
                        </motion.div>
                      ))}

                    {/* Loading indicator - show when thinking */}
                    {conversationState === "thinking" && (
                      <motion.div
                        key="thinking-indicator"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="flex justify-start mb-4"
                      >
                        <div className="bg-white rounded-2xl px-5 py-3 shadow-sm border border-[#E5E7EB]">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-[#64748B]">
                              {thinkingText}
                            </span>
                            <div className="flex gap-1">
                              <motion.div
                                animate={{ scale: [1, 1.2, 1] }}
                                transition={{
                                  duration: 0.6,
                                  repeat: Infinity,
                                  delay: 0,
                                }}
                                className="w-2 h-2 bg-[#3B82F6] rounded-full"
                              />
                              <motion.div
                                animate={{ scale: [1, 1.2, 1] }}
                                transition={{
                                  duration: 0.6,
                                  repeat: Infinity,
                                  delay: 0.2,
                                }}
                                className="w-2 h-2 bg-[#3B82F6] rounded-full"
                              />
                              <motion.div
                                animate={{ scale: [1, 1.2, 1] }}
                                transition={{
                                  duration: 0.6,
                                  repeat: Infinity,
                                  delay: 0.4,
                                }}
                                className="w-2 h-2 bg-[#3B82F6] rounded-full"
                              />
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div ref={messagesEndRef} className="h-[53vh]" />
                </div>
              )}
            </>
          )}
        </div>
      </motion.div>

      {/* Bottom Control Bar */}
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
        className={`px-4 md:px-6 py-6 pb-6 ${displayMessages.length === 0 && !isVoiceMode
          ? "hidden"
          : "fixed bottom-0 left-0 right-0 md:relative"
          }`}
      >
        <div className="max-w-3xl mx-auto">
          {isVoiceMode ? (
            /* Voice Mode Controls */
            <div className="flex flex-col items-center gap-4">
              {/* Image Preview Box - shown when files are uploaded */}
              {voiceUploadedFiles.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className="w-full max-w-2xl bg-white rounded-xl shadow-md border border-[#E5E7EB] px-3 py-2"
                >
                  <div className="flex flex-nowrap gap-2 justify-start overflow-x-auto mb-2">
                    {voiceUploadedFiles.map((file, index) => (
                      <div
                        key={index}
                        className="relative inline-block pt-2 pr-2 pb-1 pl-1"
                      >
                        <div className="relative bg-white rounded-lg border border-[#E5E7EB] overflow-hidden shadow-sm">
                          {file.type.startsWith("video/") ? (
                            <video
                              src={URL.createObjectURL(file)}
                              className={`${voiceUploadedFiles.length === 1
                                ? "w-24 h-20"
                                : voiceUploadedFiles.length === 2
                                  ? "w-20 h-16"
                                  : "w-16 h-14"
                                } object-cover`}
                              controls
                            />
                          ) : file.type.startsWith("audio/") ? (
                            <div
                              className={`${voiceUploadedFiles.length === 1
                                ? "w-24 h-20"
                                : voiceUploadedFiles.length === 2
                                  ? "w-20 h-16"
                                  : "w-16 h-14"
                                } bg-linear-to-br from-[#1E3A8A] to-[#3B82F6] flex items-center justify-center`}
                            >
                              <svg
                                className="w-6 h-6 text-white"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
                                />
                              </svg>
                            </div>
                          ) : (
                            <img
                              src={URL.createObjectURL(file)}
                              alt="Upload preview"
                              className={`${voiceUploadedFiles.length === 1
                                ? "w-24 h-20"
                                : voiceUploadedFiles.length === 2
                                  ? "w-20 h-16"
                                  : "w-16 h-14"
                                } object-cover`}
                            />
                          )}
                        </div>
                        <button
                          onClick={() => handleRemoveVoiceFile(index)}
                          className="absolute top-0 right-0 w-5 h-5 bg-[#EF4444] text-white rounded-full flex items-center justify-center shadow-lg hover:bg-[#DC2626] transition-colors z-10"
                        >
                          <svg
                            className="w-3 h-3"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleSendVoiceFiles}
                    className="w-full py-2 rounded-lg bg-linear-to-br from-[#1E3A8A] to-[#3B82F6] text-white text-sm font-medium shadow-sm hover:shadow-md transition-all cursor-pointer"
                  >
                    Send {voiceUploadedFiles.length}{" "}
                    {voiceUploadedFiles.length === 1 ? "file" : "files"}
                  </motion.button>
                </motion.div>
              )}

              {/* Mic and Upload buttons */}
              <div className="flex items-center justify-center gap-6">
                {/* Mute/Unmute Button */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleToggleMic}
                  className={`p-5 rounded-full transition-all cursor-pointer shadow-md ${isMicMuted
                    ? "bg-red-500 text-white hover:bg-red-600 border-red-400"
                    : "bg-white text-[#EF4444] hover:bg-red-50 border-[#E5E7EB]"
                    } border`}
                  aria-label={isMicMuted ? "Unmute microphone" : "Mute microphone"}
                >
                  {isMicMuted ? (
                    <svg
                      className="w-7 h-7"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      {/* Microphone with slash (muted) */}
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 3l18 18"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="w-7 h-7"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      {/* Normal microphone */}
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                      />
                    </svg>
                  )}
                </motion.button>

                {/* Upload Media Button */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,video/mp4,audio/mpeg,audio/mp3,audio/wav"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <div className="relative group">
                  <motion.button
                    whileHover={{
                      scale: voiceUploadedFiles.length >= 4 ? 1 : 1.05,
                    }}
                    whileTap={{
                      scale: voiceUploadedFiles.length >= 4 ? 1 : 0.95,
                    }}
                    onClick={() =>
                      voiceUploadedFiles.length < 4 &&
                      fileInputRef.current?.click()
                    }
                    disabled={voiceUploadedFiles.length >= 4}
                    className={`p-5 rounded-full transition-colors shadow-md ${voiceUploadedFiles.length >= 4
                      ? "bg-[#E5E7EB] text-[#94A3B8] cursor-not-allowed"
                      : "bg-[#F1F5F9] text-[#1E3A8A] hover:bg-[#E2E8F0] cursor-pointer"
                      }`}
                    aria-label="Upload media"
                  >
                    <svg
                      className="w-7 h-7"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </motion.button>
                  {voiceUploadedFiles.length >= 4 && (
                    <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-3 py-2 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                      You can only upload 4 files
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-900"></div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* Text Mode - Input Controls */
            <SpeechInputControls
              isVoiceMode={isVoiceMode}
              onToggleMode={handleToggleMode}
              isListening={isListening}
              onToggleMic={() => { }}
              onSendMessage={handleTextSendMessage}
              disabled={isChatLoading}
              currentTranscript={transcript}
              pendingImages={displayMessages.length > 0 ? pendingImages : []}
              onPendingImagesChange={displayMessages.length > 0 ? setPendingImages : undefined}
              isGenerating={isGenerating}
              onStop={handleStop}
            />
          )}
        </div>
      </motion.div>

      {/* Disclaimer */}
      <AnimatePresence>
        {showDisclaimer && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-[#FEF3C7] border-t border-[#FCD34D] px-4 py-1.5 fixed bottom-0 left-0 right-0 z-50"
          >
            <p className="text-xs text-[#92400E] text-center max-w-5xl mx-auto pr-8">
              ⚠️ <strong>Medical Disclaimer:</strong> Guardian is an AI
              assistant and not a replacement for professional medical advice.
              Always call 911 for emergencies.
            </p>
            <button
              onClick={() => setShowDisclaimer(false)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-[#92400E] hover:text-[#78350F] transition-colors cursor-pointer"
              aria-label="Close disclaimer"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Image Preview Modal */}
      <AnimatePresence>
        {previewImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
            onClick={() => setPreviewImage(null)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="relative max-w-7xl max-h-[90vh] w-full h-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative w-full h-full">
                <img
                  src={previewImage}
                  alt="Preview"
                  className="w-full h-full object-contain"
                />
              </div>

              {/* Close button */}
              <button
                onClick={() => setPreviewImage(null)}
                className="absolute top-4 right-4 w-10 h-10 bg-white/10 backdrop-blur-sm text-white rounded-full flex items-center justify-center hover:bg-white/20 transition-colors"
                aria-label="Close preview"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Drag and Drop Overlay */}
      <AnimatePresence>
        {isDragging && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-white rounded-3xl p-12 shadow-2xl border-4 border-dashed border-[#3B82F6] max-w-md mx-4"
            >
              <div className="text-center">
                <div className="mb-4 inline-block p-4 bg-[#EFF6FF] rounded-2xl">
                  <svg
                    className="w-16 h-16 text-[#3B82F6]"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-[#1E3A8A] mb-2">
                  Drop your file here
                </h3>
                <p className="text-[#64748B] text-sm">
                  Supports images (JPG, PNG) for vision analysis
                </p>
                <p className="text-[#94A3B8] text-xs mt-2">
                  PDFs and other formats coming soon
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
