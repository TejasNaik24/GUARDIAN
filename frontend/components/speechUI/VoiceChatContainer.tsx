"use client";

import { useState, useEffect, useRef } from "react";
import { flushSync } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import GuardianAvatar from "./GuardianAvatar";
import SpeechInputControls from "./SpeechInputControls";
import useSpeechRecognition from "@/hooks/useSpeechRecognition";
import useSpeechSynthesis from "@/hooks/useSpeechSynthesis";
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
  mediaType?: "image" | "video";
}

type ConversationState = "idle" | "listening" | "thinking" | "speaking";

export default function VoiceChatContainer() {
  const { isGuest } = useAuth();
  const { chat } = useGuardianRAG();
  const { messages: contextMessages, currentConversation } = useConversation();
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<
    string | undefined
  >(undefined);
  const [isVoiceMode, setIsVoiceMode] = useState(true);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [voiceUploadedFiles, setVoiceUploadedFiles] = useState<File[]>([]);
  const [conversationState, setConversationState] =
    useState<ConversationState>("idle");
  const [showTranscript, setShowTranscript] = useState(false);
  const [showDisclaimer, setShowDisclaimer] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const lastMessageRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // Speech hooks
  const {
    transcript,
    isListening,
    startListening,
    stopListening,
    resetTranscript,
  } = useSpeechRecognition();

  const { speak, isSpeaking } = useSpeechSynthesis();

  // Use messages array for both voice and text modes since we call backend directly
  const displayMessages: Message[] = messages;

  // Auto-scroll to bottom when USER sends a message (ChatGPT-style)
  useEffect(() => {
    // Only scroll if there are at least 2 messages (skip first message)
    if (displayMessages.length <= 1) return;

    const lastMessage = displayMessages[displayMessages.length - 1];
    if (lastMessage.isUser) {
      // User sent a message, scroll to show the message
      setTimeout(() => {
        // Find the last message element by data attribute
        const messageElements = document.querySelectorAll("[data-message-id]");
        const lastMessageElement = messageElements[messageElements.length - 1];
        if (lastMessageElement) {
          lastMessageElement.scrollIntoView({
            behavior: "smooth",
            block: "start",
            inline: "nearest",
          });
        }
      }, 100); // Small delay to ensure DOM is updated
    }
  }, [displayMessages]); // Auto-hide disclaimer
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
      if (isListening && !isMuted) {
        setConversationState("listening");
      } else if (isSpeaking) {
        setConversationState("speaking");
      } else if (conversationState === "listening" && !isListening) {
        // Just stopped listening, about to process
        if (transcript) {
          setConversationState("thinking");
        } else {
          setConversationState("idle");
        }
      } else if (!isListening && !isSpeaking) {
        setConversationState("idle");
      }
    }
    // Text mode - manual state management in handlers
    // Don't automatically manage state here to avoid conflicts with streaming
  }, [
    isListening,
    isSpeaking,
    isMuted,
    transcript,
    isVoiceMode,
    isChatLoading,
    conversationState,
  ]);

  // Handle voice input completion
  useEffect(() => {
    if (transcript && !isListening && !isMuted) {
      handleVoiceSendMessage(transcript);
      resetTranscript();
    }
  }, [isListening]);

  const [thinkingText, setThinkingText] = useState("Analyzing");
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
        }
        return prev;
      });
    }, 20);

    return () => clearInterval(interval);
  }, []);

  // Voice mode message handler (calls Guardian backend)
  const handleVoiceSendMessage = async (text: string, media?: File) => {
    console.log("🎤 [VoiceChatContainer] Voice mode sending:", text);
    if (!text.trim() && !media) return;

    // Create media URL if file is present
    const mediaUrl = media ? URL.createObjectURL(media) : undefined;
    const mediaType = media?.type.startsWith("video/")
      ? "video"
      : media
        ? "image"
        : undefined;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      text: text || "Sent media",
      isUser: true,
      timestamp: new Date().toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
      }),
      mediaUrl,
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
    setThinkingText("Analyzing");
    setConversationState("thinking");

    // Track start time for minimum display duration
    const startTime = Date.now();

    const response = await chat(
      text,
      currentConversationId,
      (chunk: string) => {
        // Just update the target content, the useEffect loop handles the UI update
        streamingContentRef.current += chunk;

        // If we have received some text, we can switch from thinking to speaking/idle
        if (streamingContentRef.current.length > 0 && conversationState === "thinking") {
          // We keep it in thinking or switch to a "streaming" state if we had one
        }
      },
      (status: string) => {
        console.log("📊 [VoiceChatContainer] Status received:", status);
        if (status === "generating") {
          setThinkingText("Thinking...");
        }
      }
    );

    // Let's clear thinking state as soon as we get response or error
    setConversationState("idle");

    if (response) {
      // Store conversation_id from response for future messages
      if (response.conversation_id && !currentConversationId) {
        setCurrentConversationId(response.conversation_id);
      }

      // Ensure the final message is set correctly (in case of any missed updates)
      // We update the REF to the final message, and let the loop catch up
      streamingContentRef.current = response.message;

      // Speak the response
      setConversationState("speaking");
      speak(response.message);
    } else {
      // Error handling - remove the empty message and show error
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
    }
  };

  // Text mode message handler (calls Guardian backend too)
  const handleTextSendMessage = async (text: string, media?: File) => {
    if (!text.trim() && !media) return;

    console.log("📝 [VoiceChatContainer] Text mode sending:", text);

    // Create media URL if file is present
    const mediaUrl = media ? URL.createObjectURL(media) : undefined;
    const mediaType = media?.type.startsWith("video/")
      ? "video"
      : media
        ? "image"
        : undefined;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      text: text || "Sent media",
      isUser: true,
      timestamp: new Date().toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
      }),
      mediaUrl,
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
    setThinkingText("Analyzing");
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

    // Ensure minimum 800ms display time for "Analyzing" indicator ONLY if we haven't started streaming yet
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
    }
  };
  const handleToggleMic = () => {
    setIsMuted(!isMuted);
    if (!isMuted) {
      stopListening();
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const validTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "video/mp4",
      "audio/mpeg",
      "audio/mp3",
      "audio/wav",
    ];
    const newFiles: File[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (validTypes.includes(file.type)) {
        newFiles.push(file);
      }
    }

    // Add files up to the limit of 4
    const remainingSlots = 4 - voiceUploadedFiles.length;
    setVoiceUploadedFiles([
      ...voiceUploadedFiles,
      ...newFiles.slice(0, remainingSlots),
    ]);

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRemoveVoiceFile = (index: number) => {
    setVoiceUploadedFiles(voiceUploadedFiles.filter((_, i) => i !== index));
  };

  const handleSendVoiceFiles = () => {
    if (voiceUploadedFiles.length > 0) {
      // Send with first file for now (backend will be updated later for multiple)
      handleVoiceSendMessage("Uploaded media", voiceUploadedFiles[0]);
      setVoiceUploadedFiles([]);
    }
  };

  const handleToggleMode = () => {
    setIsVoiceMode(!isVoiceMode);
    if (isListening) stopListening();
  };

  return (
    <div className="flex flex-col h-screen bg-[#F9FAFB]">
      {/* Header */}
      <header className="bg-white border-b border-[#E5E7EB] px-4 md:px-6 py-4 shadow-sm">
        <div className="w-full flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-linear-to-br from-[#1E3A8A] to-[#3B82F6] rounded-xl flex items-center justify-center shadow-md">
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
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-semibold text-[#1E3A8A]">Guardian</h1>
            </div>
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
                    How can I help you today?
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
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <AnimatePresence mode="popLayout">
                    {displayMessages
                      .filter((message) => message.text || message.mediaUrl)
                      .map((message) => (
                        <motion.div
                          key={message.id}
                          data-message-id={message.id}
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.15, ease: "easeOut" }}
                        >
                          {/* Media attachment - show first */}
                          {message.mediaUrl && (
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
                          {/* Text message bubble */}
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
                  className={`p-5 rounded-full transition-all cursor-pointer shadow-md ${isMuted
                    ? "bg-[#EF4444] text-white"
                    : "bg-[#F1F5F9] text-[#1E3A8A] hover:bg-[#E2E8F0]"
                    }`}
                  aria-label={isMuted ? "Unmute microphone" : "Mute microphone"}
                >
                  {isMuted ? (
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
    </div>
  );
}
