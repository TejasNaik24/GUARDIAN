"use client";

import { motion, AnimatePresence } from "framer-motion";

interface TranscriptOverlayProps {
  transcript: string;
  isListening: boolean;
}

export default function TranscriptOverlay({
  transcript,
  isListening,
}: TranscriptOverlayProps) {
  if (!isListening && !transcript) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        className="w-full max-w-2xl mx-auto mb-8"
      >
        <div className="bg-white/90 backdrop-blur-lg rounded-2xl shadow-xl border border-[#E5E7EB] px-6 py-4">
          <div className="flex items-start gap-3">
            {/* Animated waveform indicator */}
            {isListening && (
              <div className="flex items-center gap-1 mt-1">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    animate={{
                      height: ["8px", "20px", "8px"],
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
            )}

            {/* Transcript text */}
            <div className="flex-1">
              <p className="text-xs font-semibold text-[#64748B] mb-1">
                You're saying:
              </p>
              <p className="text-base text-[#1E3A8A] leading-relaxed">
                {transcript || "Start speaking..."}
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
