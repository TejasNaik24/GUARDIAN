"use client";

import { useState, useEffect } from "react";
import MessageList from "./MessageList";
import ChatInput from "./ChatInput";
import MicButton from "../speechUI/MicButton";
import TranscriptOverlay from "../speechUI/TranscriptOverlay";
import ToggleSwitch from "../speechUI/ToggleSwitch";
import useSpeechRecognition from "@/hooks/useSpeechRecognition";
import useSpeechSynthesis from "@/hooks/useSpeechSynthesis";
import Link from "next/link";

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

  // Speech hooks
  const {
    transcript,
    isListening,
    startListening,
    stopListening,
    resetTranscript,
    isSupported: isSpeechRecognitionSupported,
  } = useSpeechRecognition();

  const { speak, stop: stopSpeaking, isSpeaking } = useSpeechSynthesis();

  // Handle voice input completion
  useEffect(() => {
    if (transcript && !isListening) {
      // User stopped speaking, process the transcript
      handleSendMessage(transcript);
      resetTranscript();
    }
  }, [isListening]);

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
        speak(aiResponseText);
      }
    }, 2000);
  };

  const handleMicToggle = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  return (
    <div className="flex flex-col h-screen bg-[#F9FAFB]">
      {/* Header */}
      <header className="bg-white border-b border-[#E5E7EB] px-4 md:px-6 py-4 shadow-sm">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-linear-to-br from-[#1E3A8A] to-[#3B82F6] rounded-xl flex items-center justify-center shadow-md">
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
              </div>
              <div>
                <h1 className="text-lg font-semibold text-[#1E3A8A]">
                  Guardian AI
                </h1>
                <p className="text-xs text-[#64748B]">Medical Assistant</p>
              </div>
            </div>
          </div>

          {/* Mode Toggle */}
          <ToggleSwitch
            isVoiceMode={isVoiceMode}
            onToggle={() => {
              setIsVoiceMode(!isVoiceMode);
              if (isListening) stopListening();
              if (isSpeaking) stopSpeaking();
            }}
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
                  isListening={isListening}
                />
                <MicButton
                  isListening={isListening}
                  onToggle={handleMicToggle}
                />
              </div>

              {/* Empty state helper */}
              {messages.length === 0 && !isListening && (
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

      {/* Disclaimer */}
      {showDisclaimer && (
        <div className="bg-[#FEF3C7] border-t border-[#FCD34D] px-4 py-2 relative">
          <p className="text-xs text-[#92400E] text-center max-w-5xl mx-auto pr-8">
            ⚠️ <strong>Medical Disclaimer:</strong> Guardian is an AI assistant
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
