"use client";

import { motion } from "framer-motion";

interface SpeechBubbleProps {
  message: string;
  isUser: boolean;
  timestamp?: string;
  isAISpeaking?: boolean;
}

export default function SpeechBubble({
  message,
  isUser,
  timestamp,
  isAISpeaking = false,
}: SpeechBubbleProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={`flex w-full ${isUser ? "justify-end" : "justify-start"} mb-4`}
    >
      <div
        className={`flex flex-col max-w-[80%] ${
          isUser ? "items-end" : "items-start"
        }`}
      >
        {/* Speech Bubble */}
        <div
          className={`rounded-2xl px-5 py-3 shadow-sm ${
            isUser
              ? "bg-linear-to-br from-[#3B82F6] to-[#60A5FA] text-white"
              : "bg-white text-[#1E3A8A] border border-[#E5E7EB]"
          }`}
        >
          {/* AI Speaking Indicator */}
          {!isUser && isAISpeaking && (
            <div className="flex items-center gap-2 mb-2">
              <div className="flex items-center gap-1">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    animate={{
                      height: ["6px", "14px", "6px"],
                    }}
                    transition={{
                      duration: 0.6,
                      repeat: Infinity,
                      delay: i * 0.1,
                    }}
                    className="w-1 bg-[#3B82F6] rounded-full"
                  />
                ))}
              </div>
              <span className="text-xs text-[#64748B]">Speaking...</span>
            </div>
          )}

          <p className="text-sm md:text-base leading-relaxed whitespace-pre-wrap">
            {message}
          </p>
        </div>

        {/* Timestamp */}
        {timestamp && (
          <span className="text-xs text-[#64748B] mt-1 px-2">{timestamp}</span>
        )}
      </div>
    </motion.div>
  );
}
