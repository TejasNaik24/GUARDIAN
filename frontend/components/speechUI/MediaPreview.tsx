"use client";

import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { useState } from "react";

interface MediaPreviewProps {
  file: File;
  onRemove: () => void;
  fileCount?: number;
}

export default function MediaPreview({
  file,
  onRemove,
  fileCount = 1,
}: MediaPreviewProps) {
  const [showPreview, setShowPreview] = useState(false);
  const isVideo = file.type.startsWith("video/");
  const isAudio = file.type.startsWith("audio/");
  const isImage = file.type.startsWith("image/");
  const previewUrl = URL.createObjectURL(file);

  // Dynamically adjust size based on number of files
  const getSize = () => {
    if (fileCount === 1) return { width: "w-48", height: "h-32" };
    if (fileCount === 2) return { width: "w-32", height: "h-24" };
    if (fileCount === 3) return { width: "w-28", height: "h-20" };
    return { width: "w-24", height: "h-20" }; // 4 files
  };

  const size = getSize();

  return (
    <>
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.9 }}
          className="relative inline-block pt-3 pr-3 pb-1 pl-1"
        >
          <div
            className="relative bg-white rounded-xl border-2 border-[#E5E7EB] overflow-hidden shadow-md cursor-pointer hover:border-[#3B82F6] transition-colors"
            onClick={() => isImage && setShowPreview(true)}
          >
            {isVideo ? (
              <video
                src={previewUrl}
                className={`${size.width} ${size.height} object-cover`}
                controls
              />
            ) : isAudio ? (
              <div
                className={`${size.width} ${size.height} bg-linear-to-br from-[#1E3A8A] to-[#3B82F6] flex items-center justify-center`}
              >
                <svg
                  className="w-8 h-8 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
                  />
                </svg>
              </div>
            ) : (
              <div className={`relative ${size.width} ${size.height}`}>
                <Image
                  src={previewUrl}
                  alt="Upload preview"
                  fill
                  className="object-cover"
                />
              </div>
            )}

            {/* File info overlay */}
            <div className="absolute bottom-0 left-0 right-0 bg-linear-to-t from-black/70 to-transparent p-2">
              <p className="text-xs text-white truncate">{file.name}</p>
              <p className="text-xs text-white/70">
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
          </div>

          {/* Remove button */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            className="absolute top-1 right-1 w-6 h-6 bg-[#EF4444] text-white rounded-full flex items-center justify-center shadow-lg hover:bg-[#DC2626] transition-colors cursor-pointer z-10"
            aria-label="Remove media"
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
          </motion.button>
        </motion.div>
      </AnimatePresence>

      {/* Full Screen Preview Modal */}
      <AnimatePresence>
        {showPreview && isImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
            onClick={() => setShowPreview(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="relative max-w-7xl max-h-[90vh] w-full h-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative w-full h-full">
                <Image
                  src={previewUrl}
                  alt="Preview"
                  fill
                  className="object-contain"
                />
              </div>

              {/* Close button */}
              <button
                onClick={() => setShowPreview(false)}
                className="absolute top-4 right-4 w-10 h-10 bg-white/10 backdrop-blur-sm text-white rounded-full flex items-center justify-center hover:bg-white/20 transition-colors"
                aria-label="Close preview"
              >
                <svg
                  className="w-6 h-6"
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

              {/* File info */}
              <div className="absolute bottom-4 left-4 bg-black/70 backdrop-blur-sm text-white px-4 py-2 rounded-lg">
                <p className="text-sm font-medium">{file.name}</p>
                <p className="text-xs text-white/70">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
