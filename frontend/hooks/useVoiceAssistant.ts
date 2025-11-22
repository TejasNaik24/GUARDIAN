import { useState, useEffect, useRef, useCallback } from "react";

/**
 * Type definitions for the voice assistant hook
 */

// Web Speech API Type Declarations
interface SpeechRecognitionEvent extends Event {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  readonly error: string;
  readonly message: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  onaudioend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onaudiostart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onerror:
    | ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any)
    | null;
  onnomatch:
    | ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any)
    | null;
  onresult:
    | ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any)
    | null;
  onsoundend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onsoundstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onspeechend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onspeechstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  abort(): void;
  start(): void;
  stop(): void;
}

declare var SpeechRecognition: {
  prototype: SpeechRecognition;
  new (): SpeechRecognition;
};

declare var webkitSpeechRecognition: {
  prototype: SpeechRecognition;
  new (): SpeechRecognition;
};

interface Window {
  SpeechRecognition?: typeof SpeechRecognition;
  webkitSpeechRecognition?: typeof webkitSpeechRecognition;
}

type UrgencyLevel = "normal" | "high";

interface BackendResponse {
  display_text: string;
  audio_text: string;
  urgency: UrgencyLevel;
}

interface VoiceAssistantState {
  transcript: string;
  assistantText: string;
  urgency: UrgencyLevel;
  isListening: boolean;
  isSpeaking: boolean;
  isProcessing: boolean;
  startListening: () => void;
  stopListening: () => void;
  cancelSpeaking: () => void;
}

/**
 * useVoiceAssistant Hook
 *
 * Complete voice interaction loop for AI medical assistant:
 * 1. Listen to user speech (Web Speech API)
 * 2. Send transcript to backend API
 * 3. Receive AI response
 * 4. Speak the response back to user
 *
 * @returns {VoiceAssistantState} Voice assistant state and control functions
 */
export default function useVoiceAssistant(): VoiceAssistantState {
  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================

  const [transcript, setTranscript] = useState<string>("");
  const [assistantText, setAssistantText] = useState<string>("");
  const [urgency, setUrgency] = useState<UrgencyLevel>("normal");
  const [isListening, setIsListening] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // ============================================================================
  // REFS (Non-reactive values)
  // ============================================================================

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const isRecognitionActiveRef = useRef<boolean>(false);

  // ============================================================================
  // INITIALIZATION - Check browser support
  // ============================================================================

  useEffect(() => {
    // Check if SpeechRecognition is supported
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      throw new Error(
        "Speech Recognition API is not supported in this browser. Please use Chrome, Edge, or Safari."
      );
    }

    if (!window.speechSynthesis) {
      throw new Error(
        "Speech Synthesis API is not supported in this browser. Please use a modern browser."
      );
    }

    // Initialize Speech Recognition
    const recognition = new SpeechRecognition();
    recognition.continuous = false; // Stop after single phrase
    recognition.interimResults = false; // Only final results
    recognition.lang = "en-US";
    recognition.maxAlternatives = 1;

    // ============================================================================
    // SPEECH RECOGNITION EVENT HANDLERS
    // ============================================================================

    // On speech recognition result
    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const finalTranscript = event.results[0][0].transcript;
      setTranscript(finalTranscript);
      setIsListening(false);
      isRecognitionActiveRef.current = false;

      // Automatically send to backend after speech is captured
      sendToBackend(finalTranscript);
    };

    // On speech recognition error
    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error("Speech recognition error:", event.error);
      setIsListening(false);
      isRecognitionActiveRef.current = false;

      // User-friendly error messages
      let errorMessage = "Sorry, I couldn't understand that. Please try again.";

      if (event.error === "no-speech") {
        errorMessage = "No speech detected. Please try speaking again.";
      } else if (event.error === "network") {
        errorMessage = "Network error. Please check your connection.";
      } else if (event.error === "not-allowed") {
        errorMessage =
          "Microphone access denied. Please enable microphone permissions.";
      }

      setAssistantText(errorMessage);
    };

    // On speech recognition end
    recognition.onend = () => {
      setIsListening(false);
      isRecognitionActiveRef.current = false;
    };

    recognitionRef.current = recognition;

    // Cleanup on unmount
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
      if (utteranceRef.current) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // ============================================================================
  // BACKEND API CALL
  // ============================================================================

  /**
   * Send user transcript to backend API
   * @param userMessage - The user's spoken message
   */
  const sendToBackend = useCallback(async (userMessage: string) => {
    if (!userMessage.trim()) return;

    setIsProcessing(true);

    try {
      const response = await fetch("/api/assistant/voice", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: userMessage }),
      });

      if (!response.ok) {
        throw new Error(`Backend error: ${response.status}`);
      }

      const data: BackendResponse = await response.json();

      // Update state with backend response
      setAssistantText(data.display_text);
      setUrgency(data.urgency || "normal");

      // Speak the AI response
      speakText(data.audio_text);
    } catch (error) {
      console.error("Backend request failed:", error);

      // Fallback message if backend is unavailable
      const fallbackMessage =
        "I'm having trouble connecting right now. Please try again in a moment.";

      setAssistantText(fallbackMessage);
      speakText(fallbackMessage);
    } finally {
      setIsProcessing(false);
    }
  }, []);

  // ============================================================================
  // SPEECH SYNTHESIS (AI speaks back)
  // ============================================================================

  /**
   * Speak text using Speech Synthesis API
   * @param text - Text to be spoken by the AI
   */
  const speakText = useCallback((text: string) => {
    if (!text.trim()) return;

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.rate = 1.0; // Normal speed
    utterance.pitch = 1.0; // Normal pitch
    utterance.volume = 1.0; // Full volume

    // Event handlers
    utterance.onstart = () => {
      setIsSpeaking(true);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      utteranceRef.current = null;
    };

    utterance.onerror = (event) => {
      console.error("Speech synthesis error:", event);
      setIsSpeaking(false);
      utteranceRef.current = null;
    };

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, []);

  // ============================================================================
  // CONTROL FUNCTIONS
  // ============================================================================

  /**
   * Start listening to user speech
   */
  const startListening = useCallback(() => {
    if (!recognitionRef.current || isRecognitionActiveRef.current) return;

    try {
      // Stop any ongoing speech before listening
      if (isSpeaking) {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
      }

      recognitionRef.current.start();
      setIsListening(true);
      isRecognitionActiveRef.current = true;
    } catch (error) {
      console.error("Failed to start recognition:", error);
      setIsListening(false);
      isRecognitionActiveRef.current = false;
    }
  }, [isSpeaking]);

  /**
   * Stop listening to user speech
   */
  const stopListening = useCallback(() => {
    if (!recognitionRef.current || !isRecognitionActiveRef.current) return;

    try {
      recognitionRef.current.stop();
      setIsListening(false);
      isRecognitionActiveRef.current = false;
    } catch (error) {
      console.error("Failed to stop recognition:", error);
    }
  }, []);

  /**
   * Cancel ongoing speech synthesis
   */
  const cancelSpeaking = useCallback(() => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    utteranceRef.current = null;
  }, []);

  // ============================================================================
  // RETURN PUBLIC API
  // ============================================================================

  return {
    transcript,
    assistantText,
    urgency,
    isListening,
    isSpeaking,
    isProcessing,
    startListening,
    stopListening,
    cancelSpeaking,
  };
}
