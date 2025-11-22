"use client";

import { useRef, useState, useEffect } from "react";
import { motion } from "framer-motion";
import MicButton from "./MicButton";
import MediaPreview from "./MediaPreview";
import useSpeechRecognition from "@/hooks/useSpeechRecognition";

interface SpeechInputControlsProps {
  isVoiceMode: boolean;
  onToggleMode: () => void;
  isListening: boolean;
  onToggleMic: () => void;
  onSendMessage: (text: string, media?: File) => void;
  disabled?: boolean;
  currentTranscript?: string;
}

export default function SpeechInputControls({
  isVoiceMode,
  onToggleMode,
  isListening,
  onToggleMic,
  onSendMessage,
  disabled = false,
  currentTranscript = "",
}: SpeechInputControlsProps) {
  const [textInput, setTextInput] = useState("");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isDictating, setIsDictating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Separate speech recognition hook for dictation in text mode
  const {
    transcript: dictationTranscript,
    isListening: isDictationListening,
    startListening: startDictation,
    stopListening: stopDictation,
    resetTranscript: resetDictation,
  } = useSpeechRecognition();

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [textInput]);

  // Update text input with dictation transcript
  useEffect(() => {
    if (isDictating && dictationTranscript) {
      setTextInput(dictationTranscript);
    }
  }, [dictationTranscript, isDictating]);

  // Handle dictation toggle
  const handleDictationToggle = () => {
    if (isDictating) {
      stopDictation();
      setIsDictating(false);
    } else {
      startDictation();
      setIsDictating(true);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const validTypes = ["image/jpeg", "image/jpg", "image/png", "video/mp4"];
      if (validTypes.includes(file.type)) {
        setUploadedFile(file);
      } else {
        alert("Please upload a valid image (JPG, PNG) or video (MP4) file.");
      }
    }
  };

  const handleRemoveFile = () => {
    setUploadedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSend = () => {
    if (textInput.trim() || uploadedFile) {
      onSendMessage(textInput.trim(), uploadedFile || undefined);
      setTextInput("");
      setUploadedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
      // Stop dictation if active
      if (isDictating) {
        stopDictation();
        setIsDictating(false);
        resetDictation();
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="w-full">
      {/* Input Area */}
      <div className="bg-white rounded-2xl shadow-lg border border-[#E5E7EB] p-4">
        {/* Media Preview */}
        {uploadedFile && (
          <div className="mb-3">
            <MediaPreview file={uploadedFile} onRemove={handleRemoveFile} />
          </div>
        )}

        {isVoiceMode ? (
          /* Voice Mode - Mic Button */
          <div className="flex flex-col items-center py-4">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,video/mp4"
              onChange={handleFileSelect}
              className="hidden"
            />

            {/* Mic and Upload buttons side by side */}
            <div className="flex items-center gap-6">
              <MicButton
                isListening={isListening}
                onToggle={onToggleMic}
                disabled={disabled}
              />

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => fileInputRef.current?.click()}
                className="p-3 rounded-xl bg-[#F1F5F9] text-[#1E3A8A] hover:bg-[#E2E8F0] transition-colors shadow-sm cursor-pointer"
                aria-label="Upload media"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </motion.button>
            </div>

            {currentTranscript && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 max-w-md text-center"
              >
                <p className="text-xs text-[#64748B] mb-1">You're saying:</p>
                <p className="text-sm text-[#1E3A8A]">{currentTranscript}</p>
              </motion.div>
            )}

            {/* Send button appears when there's content */}
            {(currentTranscript || uploadedFile) && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSend}
                disabled={disabled}
                className="mt-4 p-3 rounded-xl bg-linear-to-br from-[#1E3A8A] to-[#3B82F6] text-white shadow-md hover:shadow-lg transition-all cursor-pointer"
                aria-label="Send message"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                  />
                </svg>
              </motion.button>
            )}
          </div>
        ) : (
          /* Text Mode - Input Box */
          <div className="flex items-end gap-3">
            {/* Upload Button */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,video/mp4"
              onChange={handleFileSelect}
              className="hidden"
            />
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => fileInputRef.current?.click()}
              className="shrink-0 p-3 rounded-xl bg-[#F1F5F9] text-[#1E3A8A] hover:bg-[#E2E8F0] transition-colors cursor-pointer"
              aria-label="Upload media"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </motion.button>

            {/* Text Input */}
            <textarea
              ref={textareaRef}
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={disabled || isDictating}
              placeholder={
                isDictating ? "Listening..." : "Type your message..."
              }
              rows={1}
              className={`flex-1 resize-none bg-transparent text-[#1E3A8A] placeholder:text-[#94A3B8] focus:outline-none text-sm md:text-base max-h-32 overflow-y-auto ${
                isDictating ? "opacity-50 cursor-not-allowed" : ""
              }`}
              style={{ minHeight: "24px" }}
            />

            {/* Dictation Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleDictationToggle}
              disabled={disabled}
              className={`shrink-0 p-3 rounded-xl transition-all relative ${
                isDictating
                  ? "bg-[#EF4444] text-white shadow-md"
                  : "bg-[#F1F5F9] text-[#1E3A8A] hover:bg-[#E2E8F0]"
              } ${
                disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
              }`}
              aria-label={isDictating ? "Stop dictation" : "Start dictation"}
            >
              {/* Pulsing ring when dictating */}
              {isDictating && (
                <motion.div
                  animate={{
                    scale: [1, 1.5, 1],
                    opacity: [0.6, 0, 0.6],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: "easeOut",
                  }}
                  className="absolute inset-0 rounded-xl bg-[#EF4444]"
                />
              )}
              <svg
                className="w-5 h-5 relative z-10"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                />
              </svg>
            </motion.button>

            {/* Send Button */}
            <motion.button
              whileHover={{
                scale: textInput.trim() || uploadedFile ? 1.05 : 1,
              }}
              whileTap={{ scale: textInput.trim() || uploadedFile ? 0.95 : 1 }}
              onClick={handleSend}
              disabled={disabled || (!textInput.trim() && !uploadedFile)}
              className={`shrink-0 p-3 rounded-xl transition-all ${
                (textInput.trim() || uploadedFile) && !disabled
                  ? "bg-linear-to-br from-[#1E3A8A] to-[#3B82F6] text-white shadow-md hover:shadow-lg cursor-pointer"
                  : "bg-[#E5E7EB] text-[#94A3B8] cursor-not-allowed"
              }`}
            >
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                />
              </svg>
            </motion.button>
          </div>
        )}
      </div>
    </div>
  );
}
