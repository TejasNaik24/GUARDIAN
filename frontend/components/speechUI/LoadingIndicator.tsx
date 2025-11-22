"use client";

import { motion } from "framer-motion";

interface LoadingIndicatorProps {
  message?: string;
}

export default function LoadingIndicator({
  message = "AI is thinking...",
}: LoadingIndicatorProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="flex items-center justify-start mb-4"
    >
      <div className="bg-white text-[#1E3A8A] border border-[#E5E7EB] rounded-2xl px-5 py-3 shadow-sm">
        <div className="flex items-center gap-3">
          {/* Animated dots */}
          <div className="flex items-center gap-1">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.5, 1, 0.5],
                }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  delay: i * 0.2,
                }}
                className="w-2 h-2 bg-[#3B82F6] rounded-full"
              />
            ))}
          </div>
          <span className="text-sm text-[#64748B]">{message}</span>
        </div>
      </div>
    </motion.div>
  );
}
