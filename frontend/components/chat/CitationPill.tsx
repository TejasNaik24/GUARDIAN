"use client";

import { motion } from "framer-motion";

interface CitationPillProps {
  source?: string;
  onClick?: () => void;
}

export default function CitationPill({
  source = "Medical Guidelines",
  onClick,
}: CitationPillProps) {
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#3B82F6]/10 text-[#1E3A8A] rounded-full text-xs font-medium border border-[#3B82F6]/20 hover:bg-[#3B82F6]/20 transition-colors cursor-pointer"
    >
      <svg
        className="w-3 h-3"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
      </svg>
      <span>{source}</span>
    </motion.button>
  );
}
