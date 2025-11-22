"use client";

import { motion } from "framer-motion";

interface GuardianAvatarProps {
  state: "idle" | "listening" | "thinking" | "speaking";
}

export default function GuardianAvatar({ state }: GuardianAvatarProps) {
  // Define animation variants for each state
  const getAnimation = () => {
    switch (state) {
      case "listening":
        return {
          scale: [1, 1.3, 1.3],
          opacity: [1, 0.9, 0.9],
        };
      case "thinking":
        return {
          scale: [1.3, 0.7, 1.3, 0.7, 1.3],
          rotate: [0, 5, -5, 5, 0],
        };
      case "speaking":
        return {
          scale: [0.8, 1.1, 0.8],
        };
      default: // idle
        return {
          scale: 1,
          opacity: 1,
        };
    }
  };

  const getTransition = (): any => {
    switch (state) {
      case "listening":
        return {
          duration: 1.5,
          ease: "easeInOut",
        };
      case "thinking":
        return {
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        };
      case "speaking":
        return {
          duration: 0.6,
          repeat: Infinity,
          ease: "easeInOut",
        };
      default:
        return {
          duration: 0.5,
          ease: "easeOut",
        };
    }
  };

  // Pulsing rings for listening and speaking states
  const showRings = state === "listening" || state === "speaking";
  const ringColor = state === "listening" ? "#3B82F6" : "#10B981";

  return (
    <div className="relative flex items-center justify-center">
      {/* Outer pulsing rings */}
      {showRings && (
        <>
          <motion.div
            animate={{
              scale: [1, 2, 2.5],
              opacity: [0.6, 0.3, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeOut",
            }}
            className="absolute w-48 h-48 rounded-full"
            style={{ backgroundColor: ringColor }}
          />
          <motion.div
            animate={{
              scale: [1, 1.8, 2.2],
              opacity: [0.5, 0.2, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeOut",
              delay: 0.4,
            }}
            className="absolute w-48 h-48 rounded-full"
            style={{ backgroundColor: ringColor }}
          />
        </>
      )}

      {/* Main Guardian Avatar Circle */}
      <motion.div
        animate={getAnimation()}
        transition={getTransition()}
        className="relative z-10 w-48 h-48 rounded-full bg-[#64748B] shadow-2xl flex items-center justify-center overflow-hidden"
      >
        {/* Gradient overlay for depth */}
        <div className="absolute inset-0 bg-linear-to-br from-[#475569]/50 to-[#1E293B]/50" />

        {/* Thinking animation - rotating dots */}
        {state === "thinking" && (
          <div className="absolute inset-0 flex items-center justify-center">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                animate={{
                  y: [-10, 10, -10],
                  opacity: [1, 0.5, 1],
                }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  delay: i * 0.2,
                }}
                className="w-3 h-3 bg-white rounded-full mx-1"
              />
            ))}
          </div>
        )}

        {/* Center icon placeholder - will be replaced with actual Guardian logo */}
        <div className="relative z-10 w-24 h-24 rounded-full bg-[#475569] flex items-center justify-center">
          <svg
            className="w-12 h-12 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
            />
          </svg>
        </div>
      </motion.div>

      {/* State label */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="absolute -bottom-16 text-center"
      >
        <p className="text-sm font-medium text-[#64748B]">
          {state === "idle" && "Ready to help"}
          {state === "listening" && "Listening..."}
          {state === "thinking" && "Thinking..."}
          {state === "speaking" && "Speaking..."}
        </p>
      </motion.div>
    </div>
  );
}
