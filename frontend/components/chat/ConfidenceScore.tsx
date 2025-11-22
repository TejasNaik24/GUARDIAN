"use client";

import { motion } from "framer-motion";

interface ConfidenceScoreProps {
  score: number; // 0.0 to 1.0
}

export default function ConfidenceScore({
  score = 0.85,
}: ConfidenceScoreProps) {
  const percentage = Math.round(score * 100);

  // Color based on confidence level
  const getColor = () => {
    if (score >= 0.8)
      return "text-[#059669] bg-[#059669]/10 border-[#059669]/20";
    if (score >= 0.6)
      return "text-[#F59E0B] bg-[#F59E0B]/10 border-[#F59E0B]/20";
    return "text-[#DC2626] bg-[#DC2626]/10 border-[#DC2626]/20";
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${getColor()}`}
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
          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      <span>{percentage}% confident</span>
    </motion.div>
  );
}
