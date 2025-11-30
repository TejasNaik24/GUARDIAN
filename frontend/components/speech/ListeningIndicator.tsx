"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useSpeech } from "@/hooks/useSpeech";

/**
 * Listening Indicator Component
 * Shows interim transcript and animated pulse while listening
 */
export default function ListeningIndicator() {
    const { state, transcript, isVoiceMode } = useSpeech();

    const isListening = state === 'listening';
    const showTranscript = isVoiceMode && transcript && isListening;

    return (
        <AnimatePresence>
            {showTranscript && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="max-w-md mx-auto"
                >
                    {/* Pulsing dot indicator */}
                    <div className="flex items-center justify-center gap-2 mb-2">
                        <motion.div
                            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                            className="w-2 h-2 rounded-full bg-blue-500"
                        />
                        <motion.div
                            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                            transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
                            className="w-2 h-2 rounded-full bg-blue-500"
                        />
                        <motion.div
                            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                            transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }}
                            className="w-2 h-2 rounded-full bg-blue-500"
                        />
                    </div>

                    {/* Transcript preview */}
                    <div className="bg-white rounded-lg shadow-md border border-gray-200 px-4 py-3">
                        <p className="text-xs text-gray-500 mb-1">You're saying:</p>
                        <p className="text-sm text-gray-900 italic">"{transcript}"</p>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
