"use client";

import { useState, useEffect, useRef } from "react";
import MessageList from "./MessageList";
import ChatInput from "./ChatInput";
import MicButton from "../speechUI/MicButton";
import TranscriptOverlay from "../speechUI/TranscriptOverlay";
import ToggleSwitch from "../speechUI/ToggleSwitch";
import Link from "next/link";
import SpeechRecognition, {
  useSpeechRecognition,
} from "react-speech-recognition";

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: string;
  showCitations?: boolean;
  showConfidence?: boolean;
  confidenceScore?: number;
}

export default function ChatContainer() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isVoiceMode, setIsVoiceMode] = useState(true);
  const [showDisclaimer, setShowDisclaimer] = useState(true);

  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition,
  } = useSpeechRecognition();

  // Handle browser support
  useEffect(() => {
    if (!browserSupportsSpeechRecognition) {
      console.warn("Browser does not support speech recognition");
    }
  }, [browserSupportsSpeechRecognition]);

  // Handle voice input completion with debounce
  useEffect(() => {
    if (isVoiceMode && transcript.trim()) {
      // Wait a tiny bit to ensure transcript is done (debounce)
      const timeout = setTimeout(() => {
        // Only send if we are not currently speaking (to avoid self-triggering)
        if (!window.speechSynthesis.speaking) {
          handleSendMessage(transcript.trim());
          resetTranscript();
        }
      }, 1500); // 1.5s silence detection

      return () => clearTimeout(timeout);
    }
  }, [transcript, isVoiceMode]);

  // Stop speaking if user starts talking (interruption)
  useEffect(() => {
    if (transcript && window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
    }
  }, [transcript]);

  const speakText = (text: string) => {
    if (!isVoiceMode) return;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";

    // 🛑 Stop mic BEFORE speech starts (prevents AI echo pickup)
    try {
      SpeechRecognition.stopListening();
    } catch (err) {
      console.error("Mic error before TTS:", err);
    }

    // 🔊 Resume mic AFTER speech ends
    utterance.onend = () => {
      try {
        SpeechRecognition.startListening({ continuous: true });
      } catch (err) {
        console.error("Mic error on TTS end:", err);
      }
    };

    // 🗣️ Start speaking
    window.speechSynthesis.cancel(); // Cancel any current speech
    window.speechSynthesis.speak(utterance);
  };

  const handleSendMessage = (text: string) => {
    if (!text.trim()) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      text,
      isUser: true,
      timestamp: new Date().toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
      }),
    };
    setMessages((prev) => [...prev, userMessage]);

    // Stop listening while processing
    if (isVoiceMode) {
      try {
        SpeechRecognition.stopListening();
      } catch (err) {
        console.error("Mic error:", err);
      }
      resetTranscript();
    }

    // Simulate AI response (placeholder)
    setIsTyping(true);
    setTimeout(() => {
      const aiResponseText =
        "I understand your concern. Based on the symptoms you've described, I recommend consulting with a healthcare professional. In the meantime, stay calm and monitor your symptoms.";

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: aiResponseText,
        isUser: false,
        timestamp: new Date().toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
        }),
        showCitations: true,
        showConfidence: true,
        confidenceScore: 0.87,
      };
      setMessages((prev) => [...prev, aiMessage]);
      setIsTyping(false);

      // Speak the response in voice mode
      if (isVoiceMode) {
        speakText(aiResponseText);
      }
    }, 2000);
  };

  const handleMicToggle = () => {
    if (listening) {
      try {
        SpeechRecognition.stopListening();
      } catch (err) {
        console.error("Mic error:", err);
      }
    } else {
      window.speechSynthesis.cancel();
      resetTranscript();
      try {
        SpeechRecognition.startListening({ continuous: true });
      } catch (err) {
        console.error("Mic error:", err);
      }
    }
  };

  const handleModeToggle = () => {
    const newMode = !isVoiceMode;
    setIsVoiceMode(newMode);

    if (newMode) {
      // Turning ON voice mode
      resetTranscript();

      // Play greeting
      const greeting = "How may I assist you?";
      speakText(greeting);

    } else {
      // Turning OFF voice mode
      window.speechSynthesis.cancel();
      try {
        SpeechRecognition.stopListening();
      } catch (err) {
        console.error("Mic error:", err);
      }
    }
  };

  return (
    <div className="flex flex-col h-screen bg-[#F9FAFB]">
      {/* Header */}
      <header className="bg-white border-b border-[#E5E7EB] px-4 md:px-6 py-4 shadow-sm">
        <div className="max-w-5xl mx-auto flex items-center justify-end">
          {/* Mode Toggle */}
          <ToggleSwitch
            isVoiceMode={isVoiceMode}
            onToggle={handleModeToggle}
          />
        </div>
      </header>

      {/* Chat Area */}
      <div className="flex-1 overflow-hidden relative">
        <div className="max-w-5xl mx-auto h-full flex flex-col">
          {/* Voice Mode UI */}
          {isVoiceMode ? (
            <div className="flex-1 flex flex-col items-center justify-center px-4 py-8">
              {/* Messages at top if any */}
              {messages.length > 0 && (
                <div className="w-full max-w-3xl mb-auto overflow-y-auto">
                  <MessageList messages={messages} isTyping={isTyping} />
                </div>
              )}

              {/* Voice Interface */}
              <div className="flex flex-col items-center justify-center py-12">
                <TranscriptOverlay
                  transcript={transcript}
                  isListening={listening}
                />
                <MicButton
                  isListening={listening}
                  onToggle={handleMicToggle}
                />
              </div>

              {/* Empty state helper */}
              {messages.length === 0 && !listening && (
                <div className="text-center mt-8 space-y-2">
                  <p className="text-[#64748B] text-sm">
                    Tap the microphone and describe your symptoms
                  </p>
                  <div className="flex flex-wrap gap-2 justify-center mt-4">
                    <span className="px-3 py-1.5 bg-white border border-[#E5E7EB] text-[#1E3A8A] rounded-full text-xs">
                      "I have a headache"
                    </span>
                    <span className="px-3 py-1.5 bg-white border border-[#E5E7EB] text-[#1E3A8A] rounded-full text-xs">
                      "What causes chest pain?"
                    </span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Text Mode UI */
            <>
              <MessageList messages={messages} isTyping={isTyping} />
              <div className="bg-white border-t border-[#E5E7EB] px-4 md:px-6 py-4 shadow-lg">
                <div className="max-w-5xl mx-auto">
                  <ChatInput onSend={handleSendMessage} disabled={isTyping} />
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Sidebar */}
      <div className="fixed left-0 top-0 h-screen w-20 bg-white border-r border-[#E5E7EB] shadow-sm flex flex-col items-center py-6 z-50">
        {/* Logo/Brand */}
        <Link
          href="/chat"
          className="mb-8 p-3 rounded-xl bg-[#3B82F6] shadow-md hover:shadow-lg transition-shadow cursor-pointer flex items-center justify-center"
        >
          <img
            src="/images/guardian-logo.png"
            alt="GUARDIAN Logo"
            className="w-8 h-8 object-contain"
          />
        </Link>

        {/* Collapse Button */}
        <button
          className="mb-6 p-2 rounded-lg hover:bg-[#F1F5F9] transition-colors"
          aria-label="Collapse sidebar"
        >
          <svg
            className="w-6 h-6 text-[#64748B]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
            />
          </svg>
        </button>
      </div>

      {/* Disclaimer */}
      {showDisclaimer && (
        <div className="bg-[#FEF3C7] border-t border-[#FCD34D] px-4 py-2 relative">
          <p className="text-xs text-[#92400E] text-center max-w-5xl mx-auto pr-8">
            ⚠️ <strong>Medical Disclaimer:</strong> GUARDIAN is an AI assistant
            and not a replacement for professional medical advice. Always call
            911 for emergencies.
          </p>
          <button
            onClick={() => setShowDisclaimer(false)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-[#92400E] hover:text-[#78350F] transition-colors"
            aria-label="Close disclaimer"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
