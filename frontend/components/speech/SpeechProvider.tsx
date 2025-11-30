"use client";

import React, { createContext, useState, useCallback, useEffect } from 'react';
import "regenerator-runtime/runtime";
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';

/**
 * Speech State Machine States
 */
export type SpeechState = 'idle' | 'ready' | 'listening' | 'processing' | 'speaking' | 'error';

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

    // Sync listening state to our internal state
    useEffect(() => {
        if (listening && state !== 'speaking') {
            setState('listening');
        } else if (!listening && isVoiceMode && state !== 'speaking') {
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
        setIsVoiceMode(newVoiceMode);

        if (newVoiceMode) {
            // Entering voice mode
            setIsMicMuted(false);
            resetTranscript();

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

            // Create utterance
            const utterance = new SpeechSynthesisUtterance("How may I assist you?");
            utterance.lang = "en-US";

            // Explicitly set an English voice if available (helps Chrome)
            const englishVoice = voices.find(v => v.lang.includes('en-US')) || voices.find(v => v.lang.includes('en'));
            if (englishVoice) {
                utterance.voice = englishVoice;
            }

            utterance.onend = () => {
                setState('listening');
                try {
                    SpeechRecognition.startListening({ continuous: true });
                } catch (err) {
                    console.error("Mic error:", err);
                }
            };

            // Chrome fix: cancel then wait a tiny bit
            window.speechSynthesis.cancel();
            setTimeout(() => {
                window.speechSynthesis.speak(utterance);
            }, 50);

        } else {
            // Exiting voice mode
            setIsMicMuted(true);
            setState('idle');
            window.speechSynthesis.cancel();
            SpeechRecognition.stopListening();
        }
    }, [isVoiceMode, resetTranscript]);

    const toggleMic = useCallback(() => {
        if (listening) {
            SpeechRecognition.stopListening();
            setIsMicMuted(true);
            setState('ready');
        } else {
            resetTranscript();
            SpeechRecognition.startListening({ continuous: true });
            setIsMicMuted(false);
            setState('listening');
        }
    }, [listening, resetTranscript]);

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
                setState('listening');
                // Resume listening if we are in voice mode
                if (isVoiceMode) {
                    try {
                        SpeechRecognition.startListening({ continuous: true });
                    } catch (err) {
                        console.error("Mic error:", err);
                    }
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
