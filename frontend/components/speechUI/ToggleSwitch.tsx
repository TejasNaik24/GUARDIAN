"use client";

import { motion } from "framer-motion";

interface ToggleSwitchProps {
  isVoiceMode: boolean;
  onToggle: () => void;
}

export default function ToggleSwitch({
  isVoiceMode,
  onToggle,
}: ToggleSwitchProps) {
  return (
    <div className="flex items-center gap-3 bg-white rounded-full px-2 py-2 shadow-md border border-[#E5E7EB]">
      {/* Voice Button */}
      <button
        onClick={() => !isVoiceMode && onToggle()}
        className={`relative px-4 py-2 rounded-full text-sm font-medium transition-all ${
          isVoiceMode ? "text-white" : "text-[#64748B] hover:text-[#1E3A8A]"
        }`}
      >
        {isVoiceMode && (
          <motion.div
            layoutId="activeTab"
            className="absolute inset-0 bg-linear-to-br from-[#1E3A8A] to-[#3B82F6] rounded-full"
            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
          />
        )}
        <span className="relative z-10 flex items-center gap-1.5">
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
              d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
            />
          </svg>
          Voice
        </span>
      </button>

      {/* Text Button */}
      <button
        onClick={() => isVoiceMode && onToggle()}
        className={`relative px-4 py-2 rounded-full text-sm font-medium transition-all ${
          !isVoiceMode ? "text-white" : "text-[#64748B] hover:text-[#1E3A8A]"
        }`}
      >
        {!isVoiceMode && (
          <motion.div
            layoutId="activeTab"
            className="absolute inset-0 bg-linear-to-br from-[#1E3A8A] to-[#3B82F6] rounded-full"
            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
          />
        )}
        <span className="relative z-10 flex items-center gap-1.5">
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
              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
            />
          </svg>
          Text
        </span>
      </button>
    </div>
  );
}
