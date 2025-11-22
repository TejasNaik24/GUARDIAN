"use client";

import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

interface MediaPreviewProps {
  file: File;
  onRemove: () => void;
}

export default function MediaPreview({ file, onRemove }: MediaPreviewProps) {
  const isVideo = file.type.startsWith("video/");
  const previewUrl = URL.createObjectURL(file);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 10, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10, scale: 0.9 }}
        className="relative inline-block"
      >
        <div className="relative bg-white rounded-xl border-2 border-[#E5E7EB] overflow-hidden shadow-md">
          {isVideo ? (
            <video
              src={previewUrl}
              className="w-48 h-32 object-cover"
              controls
            />
          ) : (
            <div className="relative w-48 h-32">
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
          onClick={onRemove}
          className="absolute -top-2 -right-2 w-6 h-6 bg-[#EF4444] text-white rounded-full flex items-center justify-center shadow-lg hover:bg-[#DC2626] transition-colors cursor-pointer"
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
  );
}
