"use client";

import { AnimatePresence, motion } from "framer-motion";
import useVoiceChat from "@/hooks/useVoiceChat";
import MicrophoneButton from "./MicrophoneButton";
import VoiceMessageBubble from "./VoiceMessageBubble";
import LoadingIndicator from "./LoadingIndicator";
import { useRef, useEffect } from "react";

/**
 * SimpleVoiceChatContainer - A clean voice-first chat interface
 *
 * Features:
 * - Voice input via Web Speech API
 * - Text-to-speech AI responses
 * - Toggleable transcript display
 * - Loading states with visual feedback
 * - Modular and scalable architecture
 */
export default function SimpleVoiceChatContainer() {
  const {
    messages,
    conversationState,
    isListening,
    isSpeaking,
    currentTranscript,
    isLoading,
    startVoiceInput,
    stopVoiceInput,
  } = useVoiceChat();

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleMicToggle = () => {
    if (isListening) {
      stopVoiceInput();
    } else {
      startVoiceInput();
    }
  };

  return (
    <div className="flex flex-col h-screen bg-[#F9FAFB]">
      {/* Header */}
      <motion.header
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="bg-white border-b border-[#E5E7EB] px-4 md:px-6 py-4 shadow-sm"
      >
        <div className="max-w-5xl mx-auto flex items-center justify-between">
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
              <p className="text-xs text-[#64748B] capitalize">
                {conversationState}
              </p>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Chat Messages Area */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
        className="flex-1 overflow-y-auto px-4 md:px-6 py-6 pb-24 md:pb-6"
      >
        <div className="max-w-4xl mx-auto">
          {messages.length === 0 ? (
            /* Empty State */
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
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
                    d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-[#1E3A8A] mb-2">
                Welcome to Guardian Voice
              </h3>
              <p className="text-[#64748B] max-w-md mb-6">
                Press the microphone button to start speaking. Guardian will
                listen and respond to your questions.
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                <span className="px-3 py-1.5 bg-white border border-[#E5E7EB] text-[#1E3A8A] rounded-full text-sm shadow-sm">
                  🎤 Voice-first interface
                </span>
                <span className="px-3 py-1.5 bg-white border border-[#E5E7EB] text-[#1E3A8A] rounded-full text-sm shadow-sm">
                  🔊 AI speaks back
                </span>
                <span className="px-3 py-1.5 bg-white border border-[#E5E7EB] text-[#1E3A8A] rounded-full text-sm shadow-sm">
                  💬 Optional transcripts
                </span>
              </div>
            </div>
          ) : (
            /* Messages */
            <div className="space-y-2">
              <AnimatePresence>
                {messages.map((message) => (
                  <VoiceMessageBubble
                    key={message.id}
                    message={message.text}
                    isUser={message.isUser}
                    timestamp={message.timestamp}
                    confidence={message.confidence}
                    urgency={message.urgency}
                    isAISpeaking={!message.isUser && isSpeaking}
                  />
                ))}
              </AnimatePresence>

              {/* Loading Indicator */}
              {isLoading && <LoadingIndicator />}

              <div ref={messagesEndRef} />
            </div>
          )}

          {/* Current Transcript Display */}
          {currentTranscript && isListening && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              className="mt-4 p-4 bg-[#EFF6FF] border border-[#3B82F6]/20 rounded-xl shadow-sm"
            >
              <p className="text-xs text-[#64748B] mb-1 flex items-center gap-1">
                <motion.span
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                >
                  🎤
                </motion.span>
                You're saying:
              </p>
              <p className="text-sm text-[#1E3A8A] font-medium">
                {currentTranscript}
              </p>
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Voice Input Control */}
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
        className="border-t border-[#E5E7EB] px-4 md:px-6 py-8 bg-white fixed bottom-0 left-0 right-0 md:relative"
      >
        <div className="max-w-4xl mx-auto flex justify-center">
          <MicrophoneButton
            isListening={isListening}
            onToggle={handleMicToggle}
            disabled={isLoading}
            size="lg"
          />
        </div>
      </motion.div>

      {/* Medical Disclaimer */}
      <div className="bg-[#FEF3C7] border-t border-[#FCD34D] px-4 py-2">
        <p className="text-xs text-[#92400E] text-center max-w-5xl mx-auto">
          ⚠️ <strong>Medical Disclaimer:</strong> Guardian is an AI assistant
          and not a replacement for professional medical advice. Always call 911
          for emergencies.
        </p>
      </div>
    </div>
  );
}
