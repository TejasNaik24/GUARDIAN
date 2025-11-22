"use client";

import { useState, useEffect, useRef } from "react";
import { flushSync } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import GuardianAvatar from "./GuardianAvatar";
import SpeechInputControls from "./SpeechInputControls";
import useSpeechRecognition from "@/hooks/useSpeechRecognition";
import useSpeechSynthesis from "@/hooks/useSpeechSynthesis";
import useChat from "@/hooks/useChat";

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
  const [messages, setMessages] = useState<Message[]>([]);
  const [isVoiceMode, setIsVoiceMode] = useState(true);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [conversationState, setConversationState] =
    useState<ConversationState>("idle");
  const [showTranscript, setShowTranscript] = useState(false);
  const [showDisclaimer, setShowDisclaimer] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
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

  // Convert chat messages to display messages for text mode
  const displayMessages: Message[] = isVoiceMode
    ? messages
    : chatMessages.map((msg) => {
        // Create media URLs for files
        const mediaUrl =
          msg.media && msg.media.length > 0
            ? URL.createObjectURL(msg.media[0])
            : undefined;
        const mediaType =
          msg.media && msg.media[0]?.type.startsWith("video/")
            ? "video"
            : msg.media && msg.media[0]
            ? "image"
            : undefined;

        return {
          id: msg.id,
          text: msg.content,
          isUser: msg.role === "user",
          timestamp: msg.timestamp.toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
          }),
          mediaUrl,
          mediaType,
        };
      });

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
    } else {
      // Text mode - use chat loading state
      if (isChatLoading) {
        setConversationState("thinking");
      } else {
        setConversationState("idle");
      }
    }
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

  // Voice mode message handler (keeps old logic for voice)
  const handleVoiceSendMessage = (text: string, media?: File) => {
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

    // Simulate AI response
    setConversationState("thinking");
    setTimeout(() => {
      const aiResponseText = media
        ? "I can see the media you've shared. Based on what I'm seeing, I recommend consulting with a healthcare professional for a proper evaluation."
        : "I understand your concern. Based on what you've told me, I recommend monitoring your symptoms closely. If they worsen or persist, please consult a healthcare professional.";

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: aiResponseText,
        isUser: false,
        timestamp: new Date().toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
        }),
      };
      setMessages((prev) => [...prev, aiMessage]);

      // Speak the response
      speak(aiResponseText);
    }, 2000);
  };

  // Text mode message handler (uses chat hook)
  const handleTextSendMessage = (text: string, media?: File) => {
    if (!text.trim() && !media) return;

    // Call sendMessage directly with the values - no state sync needed
    sendChatMessage(text, media ? [media] : []);
  };
  const handleToggleMic = () => {
    setIsMuted(!isMuted);
    if (!isMuted) {
      stopListening();
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const validTypes = ["image/jpeg", "image/jpg", "image/png", "video/mp4"];
      if (validTypes.includes(file.type)) {
        handleVoiceSendMessage("Uploaded media", file);
      } else {
        alert("Please upload a valid image (JPG, PNG) or video (MP4) file.");
      }
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

          {/* Mode Toggle */}
          <div className="bg-white rounded-full px-2 py-2 shadow-md border border-[#E5E7EB] inline-flex items-center gap-2">
            <button
              onClick={() => isVoiceMode && handleToggleMode()}
              className={`relative px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
                !isVoiceMode ? "text-white" : "text-[#64748B]"
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
              className={`relative px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
                isVoiceMode ? "text-white" : "text-[#64748B]"
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
      </header>

      {/* Main Content Area */}
      <motion.div
        ref={messagesContainerRef}
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
        className={`flex-1 px-4 md:px-6 py-6 pb-24 md:pb-6 ${
          displayMessages.length <= 1 ? "overflow-hidden" : "overflow-y-auto"
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
                  <div className="bg-linear-to-br from-[#1E3A8A] to-[#3B82F6] w-16 h-16 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
                    <svg
                      className="w-8 h-8 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-[#1E3A8A] mb-2">
                    Welcome to Guardian
                  </h3>
                  <p className="text-[#64748B] max-w-md mb-8">
                    Type your message below or switch to voice mode to speak
                    naturally.
                  </p>

                  {/* Centered input box for empty state */}
                  <div className="w-full max-w-3xl px-4">
                    <SpeechInputControls
                      isVoiceMode={isVoiceMode}
                      onToggleMode={handleToggleMode}
                      isListening={isListening}
                      onToggleMic={() => {}}
                      onSendMessage={handleTextSendMessage}
                      disabled={isChatLoading}
                      currentTranscript={transcript}
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <AnimatePresence mode="popLayout">
                    {displayMessages.map((message) => (
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
                            className={`mb-3 ${
                              message.isUser
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
                              className={`max-w-xs rounded-xl overflow-hidden shadow-md border border-[#E5E7EB] ${
                                message.mediaType !== "video"
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
                          className={`flex w-full ${
                            message.isUser ? "justify-end" : "justify-start"
                          } mb-4`}
                        >
                          <div
                            className={`flex flex-col max-w-[80%] md:max-w-[70%] ${
                              message.isUser ? "items-end" : "items-start"
                            }`}
                          >
                            <div
                              className={`rounded-2xl px-5 py-3 shadow-sm ${
                                message.isUser
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
                  </AnimatePresence>

                  {/* Loading indicator */}
                  {isChatLoading && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="flex justify-start mb-4"
                    >
                      <div className="bg-white rounded-2xl px-5 py-3 shadow-sm border border-[#E5E7EB]">
                        <div className="flex items-center gap-2">
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
                          <span className="text-sm text-[#64748B]">
                            Guardian is thinking...
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  )}

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
        className={`px-4 md:px-6 py-6 pb-6 ${
          displayMessages.length === 0 && !isVoiceMode
            ? "hidden"
            : "fixed bottom-0 left-0 right-0 md:relative"
        }`}
      >
        <div className="max-w-3xl mx-auto">
          {isVoiceMode ? (
            /* Voice Mode Controls */
            <div className="flex items-center justify-center gap-6">
              {/* Mute/Unmute Button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleToggleMic}
                className={`p-5 rounded-full transition-all cursor-pointer shadow-md ${
                  isMuted
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
                accept="image/jpeg,image/jpg,image/png,video/mp4"
                onChange={handleFileUpload}
                className="hidden"
              />
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => fileInputRef.current?.click()}
                className="p-5 rounded-full bg-[#F1F5F9] text-[#1E3A8A] hover:bg-[#E2E8F0] transition-colors cursor-pointer shadow-md"
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
            </div>
          ) : (
            /* Text Mode - Input Controls */
            <SpeechInputControls
              isVoiceMode={isVoiceMode}
              onToggleMode={handleToggleMode}
              isListening={isListening}
              onToggleMic={() => {}}
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
