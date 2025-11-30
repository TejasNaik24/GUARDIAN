"use client";

import { useRef, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import MicButton from "./MicButton";
import MediaPreview from "./MediaPreview";
import SpeechRecognition, { useSpeechRecognition } from "react-speech-recognition";

interface SpeechInputControlsProps {
  isVoiceMode: boolean;
  onToggleMode: () => void;
  isListening: boolean;
  onToggleMic: () => void;
  onSendMessage: (text: string, media?: File | File[]) => void;
  disabled?: boolean;
  currentTranscript?: string;
  pendingImages?: File[];
  onPendingImagesChange?: (files: File[]) => void;
  isGenerating?: boolean;
  onStop?: () => void;
}

const MAX_FILES = 4;

export default function SpeechInputControls({
  isVoiceMode,
  onToggleMode,
  isListening,
  onToggleMic,
  onSendMessage,
  disabled = false,
  currentTranscript = "",
  pendingImages = [],
  onPendingImagesChange,
  isGenerating = false,
  onStop,
}: SpeechInputControlsProps) {
  const [textInput, setTextInput] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isDictating, setIsDictating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Debug: Log uploadedFiles changes
  useEffect(() => {
    console.log("📊 [SpeechInputControls] uploadedFiles changed:", uploadedFiles.length, uploadedFiles.map(f => f.name));
  }, [uploadedFiles]);

  // Separate speech recognition hook for dictation in text mode
  const {
    transcript: dictationTranscript,
    listening: isDictationListening,
    resetTranscript: resetDictation,
  } = useSpeechRecognition();

  const startDictation = () => SpeechRecognition.startListening({ continuous: true });
  const stopDictation = () => SpeechRecognition.stopListening();

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

  // Apply pending images from parent when in text mode
  useEffect(() => {
    // Only apply if we don't already have uploaded files and there are pending images
    if (!isVoiceMode && pendingImages.length > 0 && uploadedFiles.length === 0) {
      console.log("📥 [SpeechInputControls] Applying pending images:", pendingImages.length);
      setUploadedFiles(pendingImages);
      // Clear pending images after applying
      onPendingImagesChange?.([]);
      // Focus the text input so user can type
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 100);
    }
  }, [pendingImages, isVoiceMode, onPendingImagesChange, uploadedFiles.length]);

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
    const files = e.target.files;
    console.log("🔍 [SpeechInputControls] Files selected:", files);
    if (!files || files.length === 0) return;

    const imageTypes = ["image/jpeg", "image/jpg", "image/png", "image/heic", "image/webp"];
    const audioVideoTypes = ["video/mp4", "audio/mpeg", "audio/mp3", "audio/wav"];

    // Convert FileList to array
    const newFiles = Array.from(files);

    // Filter valid files
    const validFiles = newFiles.filter(file =>
      imageTypes.includes(file.type) || audioVideoTypes.includes(file.type)
    );

    if (validFiles.length === 0) return;

    // Calculate how many we can add
    const remainingSlots = MAX_FILES - uploadedFiles.length;
    const filesToAdd = validFiles.slice(0, remainingSlots);

    if (filesToAdd.length > 0) {
      console.log(`✅ [SpeechInputControls] Adding ${filesToAdd.length} files`);
      setUploadedFiles(prev => [...prev, ...filesToAdd]);

      // Focus the text input so user can type
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 100);
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRemoveFile = (index: number) => {
    console.log("🗑️ [SpeechInputControls] Removing file at index:", index);
    setUploadedFiles(uploadedFiles.filter((_, i) => i !== index));
  };

  const handleSend = () => {
    // Allow sending if there's text OR files
    if (textInput.trim() || uploadedFiles.length > 0) {
      console.log("🚀 [SpeechInputControls] Sending message with files:", uploadedFiles.length);
      // Send all files
      onSendMessage(textInput.trim(), uploadedFiles);
      console.log("🧹 [SpeechInputControls] Clearing text and uploaded files");
      setTextInput("");
      setUploadedFiles([]);
      console.log("✅ [SpeechInputControls] State cleared");
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
      <div className="bg-white rounded-2xl shadow-lg border border-[#E5E7EB] px-3 py-3">
        {/* Media Previews */}
        {uploadedFiles.length > 0 && (
          <div className="mb-3 flex flex-nowrap gap-2 justify-start overflow-x-auto">
            {uploadedFiles.map((file, index) => (
              <MediaPreview
                key={`${file.name}-${file.size}-${index}`}
                file={file}
                fileCount={uploadedFiles.length}
                onRemove={() => handleRemoveFile(index)}
              />
            ))}
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

              <div className="relative group">
                <motion.button
                  whileHover={{
                    scale: uploadedFiles.length >= MAX_FILES ? 1 : 1.05,
                  }}
                  whileTap={{
                    scale: uploadedFiles.length >= MAX_FILES ? 1 : 0.95,
                  }}
                  onClick={() =>
                    uploadedFiles.length < MAX_FILES &&
                    fileInputRef.current?.click()
                  }
                  disabled={uploadedFiles.length >= MAX_FILES}
                  className={`p-3 rounded-xl transition-colors shadow-sm ${uploadedFiles.length >= MAX_FILES
                    ? "bg-[#E5E7EB] text-[#94A3B8] cursor-not-allowed"
                    : "bg-[#F1F5F9] text-[#1E3A8A] hover:bg-[#E2E8F0] cursor-pointer"
                    }`}
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
                {uploadedFiles.length >= MAX_FILES && (
                  <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-3 py-2 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    You can only upload {MAX_FILES} files
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-900"></div>
                  </div>
                )}
              </div>
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
            {(currentTranscript || uploadedFiles.length > 0) && (
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
          <div className="flex items-center gap-2">
            {/* Upload Button */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,video/mp4,audio/mpeg,audio/mp3,audio/wav"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />
            <div className="relative group shrink-0">
              <motion.button
                whileHover={{
                  scale: uploadedFiles.length >= MAX_FILES ? 1 : 1.05,
                }}
                whileTap={{
                  scale: uploadedFiles.length >= MAX_FILES ? 1 : 0.95,
                }}
                onClick={() =>
                  uploadedFiles.length < MAX_FILES &&
                  fileInputRef.current?.click()
                }
                disabled={uploadedFiles.length >= MAX_FILES}
                className={`p-2 rounded-lg transition-colors ${uploadedFiles.length >= MAX_FILES
                  ? "bg-[#E5E7EB] text-[#94A3B8] cursor-not-allowed"
                  : "bg-[#F1F5F9] text-[#1E3A8A] hover:bg-[#E2E8F0] cursor-pointer"
                  }`}
                aria-label="Upload media"
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
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </motion.button>
              {uploadedFiles.length >= MAX_FILES && (
                <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-3 py-2 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                  You can only upload {MAX_FILES} files
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-900"></div>
                </div>
              )}
            </div>

            {/* Text Input */}
            <textarea
              ref={textareaRef}
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={disabled || isDictating}
              placeholder={
                uploadedFiles.length > 0 && uploadedFiles[0].type.startsWith("image/")
                  ? "Ask a question about this image..."
                  : isDictating
                    ? "Listening..."
                    : "Type your message..."
              }
              rows={1}
              className={`flex-1 resize-none bg-transparent text-[#1E3A8A] placeholder:text-[#94A3B8] focus:outline-none text-sm md:text-base max-h-32 overflow-y-auto ${isDictating ? "opacity-50 cursor-not-allowed" : ""
                }`}
              style={{ minHeight: "24px" }}
            />

            {/* Dictation Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleDictationToggle}
              disabled={disabled}
              className={`shrink-0 p-2 rounded-lg transition-all relative ${isDictating
                ? "bg-[#EF4444] text-white shadow-md"
                : "bg-[#F1F5F9] text-[#1E3A8A] hover:bg-[#E2E8F0]"
                } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
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
                  className="absolute inset-0 rounded-lg bg-[#EF4444]"
                />
              )}
              <svg
                className="w-4 h-4 relative z-10"
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
                scale: (textInput.trim() || uploadedFiles.length > 0 || isGenerating) ? 1.05 : 1,
              }}
              whileTap={{
                scale: (textInput.trim() || uploadedFiles.length > 0 || isGenerating) ? 0.95 : 1,
              }}
              onClick={isGenerating ? onStop : handleSend}
              disabled={
                disabled || (!isGenerating && !textInput.trim() && uploadedFiles.length === 0)
              }
              className={`shrink-0 p-2 rounded-lg transition-all ${(textInput.trim() || uploadedFiles.length > 0 || isGenerating) && !disabled
                ? "bg-linear-to-br from-[#1E3A8A] to-[#3B82F6] text-white shadow-md hover:shadow-lg cursor-pointer"
                : "bg-[#E5E7EB] text-[#94A3B8] cursor-not-allowed"
                }`}
            >
              {isGenerating ? (
                // Stop icon (square)
                <svg
                  className="w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <rect x="6" y="6" width="12" height="12" rx="1" />
                </svg>
              ) : (
                // Send icon
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
                    d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                  />
                </svg>
              )}
            </motion.button>
          </div>
        )}
      </div>
    </div>
  );
}
