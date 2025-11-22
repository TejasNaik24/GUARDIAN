"use client";

import { motion } from "framer-motion";

interface MicButtonProps {
  isListening: boolean;
  onToggle: () => void;
  disabled?: boolean;
}

export default function MicButton({
  isListening,
  onToggle,
  disabled = false,
}: MicButtonProps) {
  return (
    <div className="relative flex items-center justify-center">
      {/* Pulsing rings when listening */}
      {isListening && (
        <>
          <motion.div
            animate={{
              scale: [1, 1.4, 1.6],
              opacity: [0.5, 0.2, 0],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeOut",
            }}
            className="absolute w-20 h-20 rounded-full bg-[#3B82F6]"
          />
          <motion.div
            animate={{
              scale: [1, 1.2, 1.4],
              opacity: [0.6, 0.3, 0],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeOut",
              delay: 0.3,
            }}
            className="absolute w-20 h-20 rounded-full bg-[#3B82F6]"
          />
        </>
      )}

      {/* Main Mic Button */}
      <motion.button
        whileHover={!disabled ? { scale: 1.05 } : {}}
        whileTap={!disabled ? { scale: 0.95 } : {}}
        onClick={onToggle}
        disabled={disabled}
        className={`relative z-10 w-16 h-16 rounded-full flex items-center justify-center shadow-xl transition-all duration-300 ${
          disabled
            ? "bg-[#94A3B8] cursor-not-allowed"
            : isListening
            ? "bg-linear-to-br from-[#EF4444] to-[#DC2626] cursor-pointer"
            : "bg-linear-to-br from-[#1E3A8A] to-[#3B82F6] cursor-pointer"
        }`}
      >
        {isListening ? (
          // Stop icon
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="w-6 h-6 bg-white rounded"
          />
        ) : (
          // Microphone icon
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
        )}
      </motion.button>
    </div>
  );
}
