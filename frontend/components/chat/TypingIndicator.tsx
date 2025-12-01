"use client";

import { motion } from "framer-motion";

export default function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className="flex justify-start mb-4"
    >
      <div className="bg-[#E5E7EB] rounded-2xl px-5 py-3 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="text-sm text-[#64748B]">Thinking</span>
          {[0, 1, 2].map((index) => (
            <motion.div
              key={index}
              animate={{
                y: [0, -8, 0],
                opacity: [0.4, 1, 0.4],
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                delay: index * 0.15,
                ease: "easeInOut",
              }}
              className="w-2 h-2 bg-[#1E3A8A] rounded-full"
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
}
