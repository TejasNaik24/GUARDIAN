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

    // Silence detection timer
    const silenceTimer = React.useRef<NodeJS.Timeout | null>(null);

    // Handle transcript updates & silence detection
    useEffect(() => {
        if (transcript && state === 'listening') {
            // Clear existing timer
            if (silenceTimer.current) clearTimeout(silenceTimer.current);

            // Set new timer to stop listening after silence
            silenceTimer.current = setTimeout(() => {
                console.log("🤫 [Speech] Silence detected, stopping listener...");
                SpeechRecognition.stopListening();
                // The stopListening call will trigger the 'listening' state change
                // which VoiceChatContainer observes to send the message
            }, 1500); // 1.5s silence threshold
        }

        return () => {
            if (silenceTimer.current) clearTimeout(silenceTimer.current);
        };
    }, [transcript, state]);

    // Chrome TTS "Resume Loop" Fix
    // Chrome pauses TTS after ~15 seconds or if it gets stuck. This forces it to resume.
    useEffect(() => {
        const interval = setInterval(() => {
            if (window.speechSynthesis.speaking && window.speechSynthesis.paused) {
                console.log("🔄 [Speech] Resuming paused TTS...");
                window.speechSynthesis.resume();
            }
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    const toggleVoiceMode = useCallback(async () => {
        const newVoiceMode = !isVoiceMode;
        console.log(`🎤 [Speech] Toggling Voice Mode: ${newVoiceMode ? 'ON' : 'OFF'}`);
        setIsVoiceMode(newVoiceMode);

        if (newVoiceMode) {
            // Safari Requirement: Trigger mic IMMEDIATELY on user click
            // We can't await state updates or timeouts before this call
            try {
                console.log("🎤 [Speech] Triggering mic permission (Safari optimized)...");
                // Start listening immediately to trigger prompt
                await SpeechRecognition.startListening();

                // We need to stop it shortly after to reset for the greeting flow
                // But we must ensure the prompt has had a chance to appear
                setTimeout(() => {
                    console.log("🎤 [Speech] Stopping mic after permission trigger");
                    SpeechRecognition.stopListening();

                    // Now proceed with the rest of the flow
                    setIsMicMuted(true);
                    resetTranscript();

                    // Play Greeting
                    console.log("🗣️ [Speech] Preparing greeting...");
                    setState('greeting');

                    const playGreeting = () => {
                        const text = "How may I assist you?";
                        const utterance = new SpeechSynthesisUtterance(text);
                        currentUtteranceRef.current = utterance;

                        utterance.lang = "en-US";
                        utterance.volume = 1.0;
                        utterance.rate = 1.0;
                        utterance.pitch = 1.0;

                        const voices = window.speechSynthesis.getVoices();
                        const englishVoice = voices.find(v => v.lang === 'en-US') || voices.find(v => v.lang.startsWith('en'));
                        if (englishVoice) utterance.voice = englishVoice;

                        utterance.onend = () => {
                            console.log("✅ [Speech] Greeting completed. Staying muted.");
                            currentUtteranceRef.current = null;
                            setState('idle');
                        };

                        utterance.onerror = (e) => {
                            console.error("❌ [Speech] Greeting TTS Error:", e);
                            currentUtteranceRef.current = null;
                            setState('idle');
                        };

                        console.log("▶️ [Speech] Playing greeting...");
                        window.speechSynthesis.speak(utterance);
                        window.speechSynthesis.resume();
                    };

                    // Check voices
                    if (window.speechSynthesis.getVoices().length === 0) {
                        window.speechSynthesis.onvoiceschanged = () => {
                            window.speechSynthesis.onvoiceschanged = null;
                            playGreeting();
                        };
                    } else {
                        playGreeting();
                    }

                }, 500); // 500ms delay to allow permission prompt to register

            } catch (e) {
                console.error("❌ [Speech] Permission trigger failed", e);
                // Still enter voice mode even if trigger failed (user might have already granted)
                setIsMicMuted(true);
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
            // Store in ref to prevent GC
            currentUtteranceRef.current = utterance;

            utterance.lang = "en-US";
            utterance.volume = 1.0;
            utterance.rate = 1.0;
            utterance.pitch = 1.0;

            // Simplified voice selection for Chrome stability
            const englishVoice = voices.find(v => v.lang === 'en-US') || voices.find(v => v.lang.startsWith('en'));

            if (englishVoice) {
                // On Chrome, sometimes setting the voice object explicitly causes silence if the object is stale.
                // We'll try setting it, but if it fails, the default might work better.
                utterance.voice = englishVoice;
                console.log(`🗣️ [Speech] Selected voice: ${englishVoice.name}`);
            } else {
                console.log("⚠️ [Speech] Using system default voice");
            }

            utterance.onend = () => {
                console.log("✅ [Speech] TTS completed");
                currentUtteranceRef.current = null;

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
                currentUtteranceRef.current = null;
                setState('idle'); // Ensure we reset to idle on error
                resolve(); // Resolve anyway to not block
            };

            // Direct speak without cancel to avoid 'canceled' errors
            console.log(`🔊 [Speech] Speaking: "${text.substring(0, 20)}..."`);
            window.speechSynthesis.speak(utterance);
            window.speechSynthesis.resume(); // Ensure not paused
        });
    }, [isVoiceMode, isMicMuted]);

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
