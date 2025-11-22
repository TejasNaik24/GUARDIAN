"use client";

import { useState, useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import SpeechBubble from "./SpeechBubble";
import SpeechInputControls from "./SpeechInputControls";
import useSpeechRecognition from "@/hooks/useSpeechRecognition";
import useSpeechSynthesis from "@/hooks/useSpeechSynthesis";
import Link from "next/link";

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: string;
  mediaUrl?: string;
  mediaType?: "image" | "video";
}

export default function SpeechChatContainer() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isVoiceMode, setIsVoiceMode] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [showDisclaimer, setShowDisclaimer] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Speech hooks
  const {
    transcript,
    isListening,
    startListening,
    stopListening,
    resetTranscript,
  } = useSpeechRecognition();

  const { speak, isSpeaking } = useSpeechSynthesis();

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // Auto-hide disclaimer after 4 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowDisclaimer(false);
    }, 4000);

    return () => clearTimeout(timer);
  }, []);

  // Handle voice input completion
  useEffect(() => {
    if (transcript && !isListening) {
      handleSendMessage(transcript);
      resetTranscript();
    }
  }, [isListening]);

  const handleSendMessage = (text: string, media?: File) => {
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
    setIsTyping(true);
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
      setIsTyping(false);

      // Speak response in voice mode
      if (isVoiceMode) {
        speak(aiResponseText);
      }
    }, 2000);
  };

  const handleToggleMic = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
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
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
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
                <h1 className="text-lg font-semibold text-[#1E3A8A]">
                  Guardian
                </h1>
                <p className="text-xs text-[#64748B]">
                  {isVoiceMode ? "Voice Assistant" : "Text Chat"}
                </p>
              </div>
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

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto px-4 md:px-6 py-6">
        <div className="max-w-4xl mx-auto">
          {/* Empty State */}
          {messages.length === 0 && (
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
                    d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-[#1E3A8A] mb-2">
                Welcome to Guardian
              </h3>
              <p className="text-[#64748B] max-w-md mb-6">
                {isVoiceMode
                  ? "Tap the microphone to start speaking, or switch to text mode to type."
                  : "Type your message below or switch to voice mode to speak naturally."}
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                <span className="px-3 py-1.5 bg-white border border-[#E5E7EB] text-[#1E3A8A] rounded-full text-sm shadow-sm">
                  💊 Medication info
                </span>
                <span className="px-3 py-1.5 bg-white border border-[#E5E7EB] text-[#1E3A8A] rounded-full text-sm shadow-sm">
                  🩺 Symptom analysis
                </span>
                <span className="px-3 py-1.5 bg-white border border-[#E5E7EB] text-[#1E3A8A] rounded-full text-sm shadow-sm">
                  📸 Share images
                </span>
              </div>
            </div>
          )}

          {/* Messages */}
          <AnimatePresence>
            {messages.map((message) => (
              <div key={message.id}>
                {/* Media attachment - show first */}
                {message.mediaUrl && (
                  <div
                    className={`mb-3 ${
                      message.isUser ? "flex justify-end" : "flex justify-start"
                    }`}
                  >
                    <div className="max-w-xs rounded-xl overflow-hidden shadow-md border border-[#E5E7EB]">
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
                {/* Text message - show below media */}
                <SpeechBubble
                  message={message.text}
                  isUser={message.isUser}
                  timestamp={message.timestamp}
                  isAISpeaking={!message.isUser && isSpeaking}
                />
              </div>
            ))}
          </AnimatePresence>

          {/* Typing Indicator */}
          {isTyping && (
            <SpeechBubble
              message="Analyzing..."
              isUser={false}
              isAISpeaking={false}
            />
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Controls */}
      <div className="border-t border-[#E5E7EB] px-4 md:px-6 py-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <SpeechInputControls
            isVoiceMode={isVoiceMode}
            onToggleMode={handleToggleMode}
            isListening={isListening}
            onToggleMic={handleToggleMic}
            onSendMessage={handleSendMessage}
            disabled={isTyping}
            currentTranscript={transcript}
          />
        </div>
      </div>

      {/* Disclaimer */}
      <AnimatePresence>
        {showDisclaimer && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-[#FEF3C7] border-t border-[#FCD34D] px-4 py-2 relative"
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
    </div>
  );
}
