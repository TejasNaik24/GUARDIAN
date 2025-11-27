"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface UseSpeechSynthesisReturn {
  speak: (text: string, onEnd?: () => void) => void;
  stop: () => void;
  isSpeaking: boolean;
  isSupported: boolean;
}

export default function useSpeechSynthesis(): UseSpeechSynthesisReturn {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null); // CRITICAL: Prevent garbage collection

  useEffect(() => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      setIsSupported(true);
      console.log("🔊 [useSpeechSynthesis] Speech synthesis is supported");

      // Load voices - Chrome needs this
      const loadVoices = () => {
        const voices = window.speechSynthesis.getVoices();
        console.log("🎵 [useSpeechSynthesis] Voices loaded:", voices.length);
      };

      loadVoices();
      window.speechSynthesis.onvoiceschanged = loadVoices;
    } else {
      console.error("❌ [useSpeechSynthesis] Speech synthesis NOT supported");
    }
  }, []);

  const speak = useCallback((text: string, onEnd?: () => void) => {
    console.log("🎙️ [useSpeechSynthesis] speak() called", { text, isSupported });

    if (!isSupported || !text) {
      console.warn("⚠️ [useSpeechSynthesis] Cannot speak:", { isSupported, hasText: !!text });
      return;
    }

    // Stop any ongoing speech - ONLY if actually speaking
    // Chrome sometimes reports false for speaking but still blocks new speech
    console.log("🗣️ [useSpeechSynthesis] Creating utterance for:", text);

    const utterance = new SpeechSynthesisUtterance(text);

    // CRITICAL: Store in ref to prevent garbage collection (Chrome bug)
    utteranceRef.current = utterance;

    // Simplify voice selection: rely on lang first
    // Explicit voice selection can sometimes break if the voice object is stale
    utterance.lang = "en-US";
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    utterance.onstart = () => {
      console.log("▶️ [useSpeechSynthesis] Speech started");
      setIsSpeaking(true);
    };
    utterance.onend = () => {
      console.log("✅ [useSpeechSynthesis] Speech ended");
      setIsSpeaking(false);
      utteranceRef.current = null; // Clean up
      if (onEnd) onEnd();
    };
    utterance.onerror = (event) => {
      console.error("❌ [useSpeechSynthesis] Speech error:", event);
      setIsSpeaking(false);
      utteranceRef.current = null; // Clean up
      // Don't call onEnd on error to avoid loops, just log it
    };

    console.log("📢 [useSpeechSynthesis] Calling speechSynthesis.speak()");
    window.speechSynthesis.speak(utterance);
  }, [isSupported, utteranceRef]);

  const stop = useCallback(() => {
    if (isSupported) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, [isSupported]);

  return {
    speak,
    stop,
    isSpeaking,
    isSupported,
  };
}
