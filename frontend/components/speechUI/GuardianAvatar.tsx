"use client";

import { motion } from "framer-motion";

interface GuardianAvatarProps {
  state: "idle" | "listening" | "thinking" | "speaking";
  text?: string;
}

export default function GuardianAvatar({ state, text }: GuardianAvatarProps) {
  // ... (existing code)


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
        className="relative z-10 w-64 h-64 flex items-center justify-center overflow-visible"
      >



        {/* Center logo - replace SVG with actual logo */}
        <div className="relative z-10 w-full h-full flex items-center justify-center">
          <img
            src="/images/guardian-logo.png"
            alt="GUARDIAN"
            className="w-full h-full object-contain drop-shadow-2xl"
          />
        </div>
      </motion.div>

      {/* State label */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="absolute -bottom-16 text-center"
      >
        <p className="text-sm font-medium text-[#64748B]">
          {text ? (
            text
          ) : (
            <>
              {state === "idle" && "How may I assist you?"}
              {state === "listening" && "Listening..."}
              {state === "thinking" && (
                <span className="animate-pulse">Thinking...</span>
              )}
              {state === "speaking" && "Speaking..."}
            </>
          )}
        </p>
      </motion.div>
    </div>
  );
}
