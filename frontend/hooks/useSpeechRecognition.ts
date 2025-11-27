"use client";

import { useState, useEffect, useRef } from "react";

interface UseSpeechRecognitionReturn {
  transcript: string;
  isListening: boolean;
  startListening: () => void;
  stopListening: () => void;
  resetTranscript: () => void;
  isSupported: boolean;
}

export default function useSpeechRecognition(): UseSpeechRecognitionReturn {
  const [transcript, setTranscript] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const recognitionRef = useRef<any>(null);
  const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Silence detection timeout (ms)
  const SILENCE_DURATION = 2000;

  useEffect(() => {
    // Check if browser supports Speech Recognition
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition;

      if (SpeechRecognition) {
        setIsSupported(true);
        const recognition = new SpeechRecognition();

        // Detect Safari - it doesn't support continuous mode well
        const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
        console.log("🎤 [Recognition] Browser detected:", isSafari ? "Safari" : "Chrome/Other");

        recognition.continuous = !isSafari; // Safari: false, Chrome: true
        recognition.interimResults = true;
        recognition.lang = "en-US";

        recognition.onresult = (event: any) => {
          let interimTranscript = "";
          let finalTranscript = "";

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += transcript + " ";
            } else {
              interimTranscript += transcript;
            }
          }

          setTranscript(finalTranscript || interimTranscript);

          // Reset silence timeout
          if (silenceTimeoutRef.current) {
            clearTimeout(silenceTimeoutRef.current);
          }

          if (finalTranscript || interimTranscript) {
            silenceTimeoutRef.current = setTimeout(() => {
              if (recognitionRef.current) {
                recognitionRef.current.stop();
                // Don't manually set isListening(false) here
                // Let onend handle it to ensure engine is truly stopped
              }
            }, SILENCE_DURATION);
          }
        };

        recognition.onerror = (event: any) => {
          console.error("Speech recognition error:", event.error);
          setIsListening(false);
        };

        recognition.onend = () => {
          setIsListening(false);
          if (silenceTimeoutRef.current) {
            clearTimeout(silenceTimeoutRef.current);
          }
        };

        recognitionRef.current = recognition;
      }
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
      }
    };
  }, []);

  const startListening = async () => {
    if (recognitionRef.current && !isListening) {
      try {
        // Request microphone permission explicitly (helps with Safari)
        await navigator.mediaDevices.getUserMedia({ audio: true });
        console.log("🎤 [Recognition] Microphone permission granted");

        setTranscript("");
        recognitionRef.current.start();
        setIsListening(true);
        console.log("🎤 [Recognition] Started listening");
      } catch (error) {
        console.error("🎤 [Recognition] Microphone permission denied or error:", error);
      }
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  const resetTranscript = () => {
    setTranscript("");
  };

  return {
    transcript,
    isListening,
    startListening,
    stopListening,
    resetTranscript,
    isSupported,
  };
}
