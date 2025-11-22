"use client";

import { useEffect, useRef } from "react";
import { AnimatePresence } from "framer-motion";
import MessageBubble from "./MessageBubble";
import TypingIndicator from "./TypingIndicator";

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: string;
  showCitations?: boolean;
  showConfidence?: boolean;
  confidenceScore?: number;
}

interface MessageListProps {
  messages: Message[];
  isTyping?: boolean;
}

export default function MessageList({
  messages,
  isTyping = false,
}: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  return (
    <div className="flex-1 overflow-y-auto px-4 md:px-6 py-6 space-y-4">
      {/* Empty State */}
      {messages.length === 0 && (
        <div className="flex flex-col items-center justify-center h-full text-center px-4">
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
          <p className="text-[#64748B] max-w-md">
            Your AI medical assistant is ready to help. Ask about symptoms,
            conditions, or medical emergencies.
          </p>
          <div className="mt-6 flex flex-wrap gap-2 justify-center">
            <span className="px-3 py-1.5 bg-[#E5E7EB] text-[#1E3A8A] rounded-full text-sm">
              💊 Medication info
            </span>
            <span className="px-3 py-1.5 bg-[#E5E7EB] text-[#1E3A8A] rounded-full text-sm">
              🩺 Symptom checker
            </span>
            <span className="px-3 py-1.5 bg-[#E5E7EB] text-[#1E3A8A] rounded-full text-sm">
              🚨 Emergency guidance
            </span>
          </div>
        </div>
      )}

      {/* Messages */}
      <AnimatePresence>
        {messages.map((message) => (
          <MessageBubble
            key={message.id}
            message={message.text}
            isUser={message.isUser}
            timestamp={message.timestamp}
            showCitations={message.showCitations}
            showConfidence={message.showConfidence}
            confidenceScore={message.confidenceScore}
          />
        ))}
      </AnimatePresence>

      {/* Typing Indicator */}
      {isTyping && <TypingIndicator />}

      {/* Scroll Anchor */}
      <div ref={messagesEndRef} />
    </div>
  );
}
