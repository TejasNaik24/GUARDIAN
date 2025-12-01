"use client";

import React, { createContext, useState, useCallback, useEffect } from 'react';
import "regenerator-runtime/runtime";
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';

/**
 * Speech State Machine States
 */
export type SpeechState = 'idle' | 'ready' | 'listening' | 'processing' | 'speaking' | 'greeting' | 'error';

/**
 * Error types
 */
export type SpeechErrorType = 'permission_denied' | 'not_supported' | 'network_error' | 'recognition_failed' | 'tts_failed';

export interface SpeechError {
    type: SpeechErrorType;
    message: string;
}

/**
 * Speech Context Interface
 */
export interface SpeechContextValue {
    state: SpeechState;
    transcript: string;
    finalTranscript: string;
    error: SpeechError | null;
    isSTTSupported: boolean;
    isTTSSupported: boolean;
    isVoiceMode: boolean;
    isMicMuted: boolean;
    toggleVoiceMode: () => void;
    toggleMic: () => void;
    cancelListening: () => void;
    speak: (text: string) => Promise<void>;
    clearError: () => void;
}

const SpeechContext = createContext<SpeechContextValue | undefined>(undefined);

export function SpeechProvider({ children }: { children: React.ReactNode }) {
    const {
        transcript,
        listening,
        resetTranscript,
        browserSupportsSpeechRecognition,
        isMicrophoneAvailable
    } = useSpeechRecognition();

    const [state, setState] = useState<SpeechState>('idle');
    const [finalTranscript, setFinalTranscript] = useState('');
    const [error, setError] = useState<SpeechError | null>(null);
    const [isVoiceMode, setIsVoiceMode] = useState(false);
    const [isMicMuted, setIsMicMuted] = useState(true);

    // Ref to keep utterance alive (prevent GC)
    const currentUtteranceRef = React.useRef<SpeechSynthesisUtterance | null>(null);

    // Sync listening state to our internal state
    useEffect(() => {
        if (listening && state !== 'speaking' && state !== 'greeting') {
            setState('listening');
        } else if (!listening && isVoiceMode && state !== 'speaking' && state !== 'greeting') {
            setState('ready');
        }
    }, [listening, isVoiceMode, state]);

    // Handle transcript updates
    useEffect(() => {
        if (transcript) {
            // In continuous mode, the transcript keeps growing. 
            // We might want to handle "final" results differently if needed, 
            // but for now we just expose the raw transcript like the user's example.
        }
    }, [transcript]);

    const toggleVoiceMode = useCallback(async () => {
        const newVoiceMode = !isVoiceMode;
        console.log(`🎤 [Speech] Toggling Voice Mode: ${newVoiceMode ? 'ON' : 'OFF'}`);
        setIsVoiceMode(newVoiceMode);

        if (newVoiceMode) {
            // Entering voice mode
            // 1. Start muted
            setIsMicMuted(true);
            resetTranscript();

            // 2. Trigger permission by starting and immediately stopping
            // We await this sequence to ensure audio context is ready/cleared for TTS
            console.log("🎤 [Speech] Triggering mic permission...");
            try {
                await SpeechRecognition.startListening();
                await new Promise(resolve => setTimeout(resolve, 500)); // Wait 500ms
                console.log("🎤 [Speech] Stopping mic after permission trigger");
                await SpeechRecognition.stopListening();
            } catch (e) {
                console.error("❌ [Speech] Permission trigger failed", e);
            }

            // 3. Play Greeting (Only after mic interaction is done)
            console.log("🗣️ [Speech] Preparing greeting...");
            setState('greeting');

            const playGreeting = () => {
                const text = "How may I assist you?";
                const utterance = new SpeechSynthesisUtterance(text);

                // Store in ref to prevent GC
                currentUtteranceRef.current = utterance;

                utterance.lang = "en-US";

                // Simple voice selection
                const voices = window.speechSynthesis.getVoices();
                if (voices.length > 0) {
                    const englishVoice = voices.find(v => v.lang.includes('en-US')) || voices.find(v => v.lang.includes('en'));
                    if (englishVoice) utterance.voice = englishVoice;
                }

                utterance.onstart = () => console.log("🗣️ [Speech] Greeting started");
                utterance.onend = () => {
                    console.log("✅ [Speech] Greeting completed. Staying muted.");
                    setState('idle');
                    SpeechRecognition.stopListening();
                    currentUtteranceRef.current = null; // Cleanup
                };
                utterance.onerror = (e) => {
                    console.error("❌ [Speech] Greeting TTS Error:", e);
                    currentUtteranceRef.current = null;
                };

                // Cancel any pending speech to clear queue
                window.speechSynthesis.cancel();

                // Small delay to ensure cancel takes effect
                setTimeout(() => {
                    console.log("▶️ [Speech] Playing greeting...");
                    window.speechSynthesis.speak(utterance);
                }, 50);
            };

            // Retry if voices aren't loaded yet (Chrome quirk)
            if (window.speechSynthesis.getVoices().length === 0) {
                console.log("⏳ [Speech] Voices not loaded, waiting...");

                let hasPlayed = false;
                let fallbackTimer: NodeJS.Timeout;

                const cleanup = () => {
                    hasPlayed = true;
                    window.speechSynthesis.onvoiceschanged = null;
                    if (fallbackTimer) clearTimeout(fallbackTimer);
                };

                window.speechSynthesis.onvoiceschanged = () => {
                    if (hasPlayed) return;
                    console.log("✅ [Speech] Voices changed, playing greeting");
                    cleanup();
                    playGreeting();
                };

                // Fallback if event doesn't fire
                fallbackTimer = setTimeout(() => {
                    if (hasPlayed) return;
                    console.log("⚠️ [Speech] Voice load timeout, playing anyway");
                    cleanup();
                    playGreeting();
                }, 1000);
            } else {
                playGreeting();
            }

        } else {
            // Exiting voice mode
            console.log("🛑 [Speech] Exiting voice mode");
            setIsMicMuted(true);
            setState('idle');
            window.speechSynthesis.cancel();
            SpeechRecognition.stopListening();
        }
    }, [isVoiceMode, resetTranscript]);

    const toggleMic = useCallback(() => {
        if (isMicMuted) {
            // Unmute -> Start Listening
            console.log("🎤 [Speech] Unmuting and starting listener");
            resetTranscript();
            SpeechRecognition.startListening({ continuous: true });
            setIsMicMuted(false);
            setState('listening');
        } else {
            // Mute -> Stop Listening
            console.log("🔇 [Speech] Muting and stopping listener");
            SpeechRecognition.stopListening();
            setIsMicMuted(true);
            setState('idle'); // Idle when muted
        }
    }, [isMicMuted, resetTranscript]);

    const cancelListening = useCallback(() => {
        SpeechRecognition.stopListening();
        resetTranscript();
        setState('ready');
    }, [resetTranscript]);

    const speak = useCallback((text: string): Promise<void> => {
        return new Promise(async (resolve, reject) => {
            if (!window.speechSynthesis) {
                reject(new Error("TTS not supported"));
                return;
            }

            // Stop mic before speaking
            SpeechRecognition.stopListening();
            setState('speaking');

            // Ensure voices are loaded
            let voices = window.speechSynthesis.getVoices();
            if (voices.length === 0) {
                await new Promise<void>((resolve) => {
                    const onVoicesChanged = () => {
                        window.speechSynthesis.removeEventListener('voiceschanged', onVoicesChanged);
                        resolve();
                    };
                    window.speechSynthesis.addEventListener('voiceschanged', onVoicesChanged);
                });
                voices = window.speechSynthesis.getVoices();
            }

            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = "en-US";

            // Explicitly set an English voice if available
            const englishVoice = voices.find(v => v.lang.includes('en-US')) || voices.find(v => v.lang.includes('en'));
            if (englishVoice) {
                utterance.voice = englishVoice;
            }

            utterance.onend = () => {
                console.log("✅ [Speech] TTS completed");

                // Resume listening ONLY if we are in voice mode AND NOT MUTED
                if (isVoiceMode && !isMicMuted) {
                    setState('listening');
                    try {
                        SpeechRecognition.startListening({ continuous: true });
                    } catch (err) {
                        console.error("Mic error:", err);
                    }
                } else {
                    setState('idle');
                }
                resolve();
            };

            utterance.onerror = (e) => {
                console.error("❌ [Speech] TTS error:", e);
                setState('ready');
                resolve(); // Resolve anyway to not block
            };

            // Chrome fix: cancel then wait a tiny bit
            window.speechSynthesis.cancel();
            setTimeout(() => {
                window.speechSynthesis.speak(utterance);
            }, 50);
        });
    }, [isVoiceMode]);

    const clearError = useCallback(() => setError(null), []);

    const value: SpeechContextValue = {
        state,
        transcript,
        finalTranscript, // We might need to process this more if we want distinct "final" chunks
        error,
        isSTTSupported: browserSupportsSpeechRecognition,
        isTTSSupported: typeof window !== 'undefined' && 'speechSynthesis' in window,
        isVoiceMode,
        isMicMuted,
        toggleVoiceMode,
        toggleMic,
        cancelListening,
        speak,
        clearError
    };

    return (
        <SpeechContext.Provider value={value}>
            {children}
        </SpeechContext.Provider>
    );
}

export function useSpeechContext() {
    const context = React.useContext(SpeechContext);
    if (context === undefined) {
        throw new Error('useSpeechContext must be used within a SpeechProvider');
    }
    return context;
}
