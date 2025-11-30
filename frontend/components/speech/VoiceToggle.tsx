"use client";

import { motion } from "framer-motion";
import { useSpeech } from "@/hooks/useSpeech";

/**
 * Voice Toggle Component
 * Toggles between Text and Voice mode
 */
export default function VoiceToggle() {
    const { isVoiceMode, toggleVoiceMode, state } = useSpeech();

    const isDisabled = state === 'speaking' || state === 'processing';

    return (
        <div className="bg-white rounded-full px-2 py-2 shadow-md border border-[#E5E7EB] inline-flex items-center gap-2">
            {/* Text Mode Button */}
            <button
                onClick={() => isVoiceMode && toggleVoiceMode()}
                disabled={isDisabled}
                className={`relative px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${!isVoiceMode ? "text-white" : "text-[#64748B]"
                    } ${isDisabled ? "opacity-50 cursor-not-allowed" : ""}`}
                aria-label="Switch to text mode"
                aria-pressed={!isVoiceMode}
            >
                {!isVoiceMode && (
                    <motion.div
                        layoutId="voiceModeToggle"
                        className="absolute inset-0 bg-gradient-to-br from-[#1E3A8A] to-[#3B82F6] rounded-full"
                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                )}
                <span className="relative z-10 flex items-center gap-1.5">
                    <svg
                        className="w-3.5 h-3.5"
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

            {/* Voice Mode Button */}
            <button
                onClick={() => !isVoiceMode && toggleVoiceMode()}
                disabled={isDisabled}
                className={`relative px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${isVoiceMode ? "text-white" : "text-[#64748B]"
                    } ${isDisabled ? "opacity-50 cursor-not-allowed" : ""}`}
                aria-label="Switch to voice mode"
                aria-pressed={isVoiceMode}
            >
                {isVoiceMode && (
                    <motion.div
                        layoutId="voiceModeToggle"
                        className="absolute inset-0 bg-gradient-to-br from-[#1E3A8A] to-[#3B82F6] rounded-full"
                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                )}
                <span className="relative z-10 flex items-center gap-1.5">
                    <svg
                        className="w-3.5 h-3.5"
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
        </div>
    );
}
