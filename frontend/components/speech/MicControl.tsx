"use client";

import { motion } from "framer-motion";
import { useSpeech } from "@/hooks/useSpeech";

/**
 * Mic Control Component
 * Main microphone button with state-based animations
 */
export default function MicControl() {
    const { state, isMicMuted, toggleMic, isVoiceMode } = useSpeech();

    if (!isVoiceMode) return null;

    const isListening = state === 'listening' && !isMicMuted;
    const isProcessing = state === 'processing';
    const isSpeaking = state === 'speaking';
    const isDisabled = isProcessing || isSpeaking;

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
                whileHover={!isDisabled ? { scale: 1.05 } : {}}
                whileTap={!isDisabled ? { scale: 0.95 } : {}}
                onClick={toggleMic}
                disabled={isDisabled}
                className={`relative z-10 w-16 h-16 rounded-full flex items-center justify-center shadow-xl transition-all duration-300 ${isDisabled
                        ? "bg-[#94A3B8] cursor-not-allowed"
                        : isMicMuted
                            ? "bg-gradient-to-br from-[#EF4444] to-[#DC2626] cursor-pointer"
                            : "bg-gradient-to-br from-[#3B82F6] to-[#2563EB] cursor-pointer"
                    }`}
                aria-label={isMicMuted ? "Unmute microphone" : "Mute microphone"}
                aria-pressed={!isMicMuted}
            >
                {isProcessing ? (
                    // Processing spinner
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-6 h-6 border-2 border-white border-t-transparent rounded-full"
                    />
                ) : isSpeaking ? (
                    // Speaker/audio waves icon
                    <motion.svg
                        className="w-8 h-8 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ duration: 0.5, repeat: Infinity }}
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15.414a2 2 0 001.414.586h4a2 2 0 001.414-.586l2-2a2 2 0 000-2.828l-2-2A2 2 0 0011 8H7a2 2 0 00-1.414.586l-2 2a2 2 0 000 2.828l2 2z"
                        />
                    </motion.svg>
                ) : isMicMuted ? (
                    // Muted mic (with slash)
                    <div className="relative">
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
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-10 h-0.5 bg-white transform rotate-45" />
                        </div>
                    </div>
                ) : (
                    // Active mic
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

            {/* State label below button */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute -bottom-8 text-xs text-gray-600 font-medium"
            >
                {isProcessing && "Processing..."}
                {isSpeaking && "Speaking..."}
                {isListening && "Listening..."}
                {isMicMuted && state === 'ready' && "Tap to speak"}
            </motion.div>
        </div>
    );
}
