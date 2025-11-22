"use client";

import { motion } from "framer-motion";

interface VoiceMessageBubbleProps {
  message: string;
  isUser: boolean;
  timestamp?: string;
  confidence?: number;
  urgency?: "low" | "medium" | "high";
  isAISpeaking?: boolean;
}

export default function VoiceMessageBubble({
  message,
  isUser,
  timestamp,
  confidence,
  urgency,
  isAISpeaking = false,
}: VoiceMessageBubbleProps) {
  const getUrgencyColor = () => {
    if (!urgency) return "";
    switch (urgency) {
      case "high":
        return "border-l-4 border-l-[#EF4444]";
      case "medium":
        return "border-l-4 border-l-[#F59E0B]";
      case "low":
        return "border-l-4 border-l-[#10B981]";
      default:
        return "";
    }
  };

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
              : `bg-white text-[#1E3A8A] border border-[#E5E7EB] ${getUrgencyColor()}`
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

          {/* Confidence Score */}
          {!isUser && confidence !== undefined && (
            <div className="mt-2 flex items-center gap-2">
              <div className="flex-1 bg-[#E5E7EB] rounded-full h-1.5 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${confidence * 100}%` }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="h-full bg-[#3B82F6] rounded-full"
                />
              </div>
              <span className="text-xs text-[#64748B]">
                {Math.round(confidence * 100)}%
              </span>
            </div>
          )}
        </div>

        {/* Timestamp */}
        {timestamp && (
          <span className="text-xs text-[#64748B] mt-1 px-2">{timestamp}</span>
        )}
      </div>
    </motion.div>
  );
}
