"use client";

import { motion } from "framer-motion";
import CitationPill from "./CitationPill";
import ConfidenceScore from "./ConfidenceScore";

interface MessageBubbleProps {
  message: string;
  isUser: boolean;
  timestamp?: string;
  showCitations?: boolean;
  showConfidence?: boolean;
  confidenceScore?: number;
}

export default function MessageBubble({
  message,
  isUser,
  timestamp,
  showCitations = false,
  showConfidence = false,
  confidenceScore = 0.85,
}: MessageBubbleProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={`flex w-full ${isUser ? "justify-end" : "justify-start"} mb-4`}
    >
      <div
        className={`flex flex-col max-w-[75%] ${
          isUser ? "items-end" : "items-start"
        }`}
      >
        {/* Message Bubble */}
        <div
          className={`rounded-2xl px-5 py-3 shadow-sm ${
            isUser
              ? "bg-linear-to-br from-[#3B82F6] to-[#60A5FA] text-white"
              : "bg-[#E5E7EB] text-[#1E3A8A]"
          }`}
        >
          <p className="text-sm md:text-base leading-relaxed whitespace-pre-wrap">
            {message}
          </p>
        </div>

        {/* Timestamp */}
        {timestamp && (
          <span className="text-xs text-[#64748B] mt-1 px-2">{timestamp}</span>
        )}

        {/* AI Message Metadata */}
        {!isUser && (
          <div className="flex flex-wrap gap-2 mt-2">
            {showCitations && <CitationPill />}
            {showConfidence && <ConfidenceScore score={confidenceScore} />}
          </div>
        )}
      </div>
    </motion.div>
  );
}
