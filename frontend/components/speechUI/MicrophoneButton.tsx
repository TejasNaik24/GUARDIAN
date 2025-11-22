"use client";

import { motion } from "framer-motion";

interface MicrophoneButtonProps {
  isListening: boolean;
  onToggle: () => void;
  disabled?: boolean;
  size?: "sm" | "md" | "lg";
}

export default function MicrophoneButton({
  isListening,
  onToggle,
  disabled = false,
  size = "lg",
}: MicrophoneButtonProps) {
  const sizeClasses = {
    sm: "w-12 h-12",
    md: "w-16 h-16",
    lg: "w-24 h-24",
  };

  const iconSizes = {
    sm: "w-5 h-5",
    md: "w-8 h-8",
    lg: "w-12 h-12",
  };

  return (
    <div className="relative flex items-center justify-center">
      {/* Pulsing rings when listening */}
      {isListening && (
        <>
          <motion.div
            animate={{
              scale: [1, 1.5, 2],
              opacity: [0.6, 0.3, 0],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeOut",
            }}
            className={`absolute ${sizeClasses[size]} rounded-full bg-[#3B82F6]`}
          />
          <motion.div
            animate={{
              scale: [1, 1.3, 1.6],
              opacity: [0.7, 0.4, 0],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeOut",
              delay: 0.3,
            }}
            className={`absolute ${sizeClasses[size]} rounded-full bg-[#3B82F6]`}
          />
        </>
      )}

      {/* Main Microphone Button */}
      <motion.button
        whileHover={!disabled ? { scale: 1.05 } : {}}
        whileTap={!disabled ? { scale: 0.95 } : {}}
        onClick={onToggle}
        disabled={disabled}
        className={`relative z-10 ${
          sizeClasses[size]
        } rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 ${
          disabled
            ? "bg-[#94A3B8] cursor-not-allowed"
            : isListening
            ? "bg-linear-to-br from-[#EF4444] to-[#DC2626] cursor-pointer"
            : "bg-linear-to-br from-[#1E3A8A] to-[#3B82F6] cursor-pointer"
        }`}
        aria-label={isListening ? "Stop listening" : "Start listening"}
      >
        {isListening ? (
          // Stop icon
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="w-1/3 h-1/3 bg-white rounded"
          />
        ) : (
          // Microphone icon
          <svg
            className={`${iconSizes[size]} text-white`}
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

      {/* Status text */}
      {isListening && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute -bottom-8 text-center"
        >
          <p className="text-xs font-medium text-[#3B82F6]">Listening...</p>
        </motion.div>
      )}
    </div>
  );
}
