"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useSpeech } from "@/hooks/useSpeech";

/**
 * Speech Toast Component
 * Shows errors and permission requests
 */
export default function SpeechToast() {
    const { error, clearError } = useSpeech();

    if (!error) return null;

    const getErrorIcon = () => {
        switch (error.type) {
            case 'permission_denied':
                return (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                );
            case 'not_supported':
                return (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                );
            default:
                return (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                );
        }
    };

    const getErrorColor = () => {
        switch (error.type) {
            case 'permission_denied':
                return 'bg-yellow-50 text-yellow-800 border-yellow-200';
            case 'not_supported':
                return 'bg-gray-50 text-gray-800 border-gray-200';
            default:
                return 'bg-red-50 text-red-800 border-red-200';
        }
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: -50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -50 }}
                className="fixed top-4 left-1/2 transform -translate-x-1/2 z-[9999] max-w-md w-full mx-4"
            >
                <div className={`rounded-lg border shadow-lg p-4 ${getErrorColor()}`}>
                    <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-0.5">
                            {getErrorIcon()}
                        </div>

                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium">
                                {error.type === 'permission_denied' && 'Microphone Access Needed'}
                                {error.type === 'not_supported' && 'Feature Not Supported'}
                                {error.type === 'network_error' && 'Network Error'}
                                {error.type === 'recognition_failed' && 'Recognition Failed'}
                                {error.type === 'tts_failed' && 'Speech Failed'}
                            </p>
                            <p className="mt-1 text-sm opacity-90">
                                {error.message}
                            </p>

                            {error.type === 'permission_denied' && (
                                <div className="mt-3 text-xs">
                                    <p className="font-medium mb-1">How to enable:</p>
                                    <ul className="list-disc list-inside space-y-0.5 opacity-80">
                                        <li>Chrome: Settings → Privacy → Microphone</li>
                                        <li>Safari: Preferences → Websites → Microphone</li>
                                    </ul>
                                </div>
                            )}
                        </div>

                        <button
                            onClick={clearError}
                            className="flex-shrink-0 hover:opacity-70 transition-opacity cursor-pointer"
                            aria-label="Dismiss"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
