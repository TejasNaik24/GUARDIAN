"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useConversation } from "@/contexts/ConversationContext";
import { useState } from "react";

interface ConversationListItemProps {
  conversation: {
    id: string;
    title: string;
    lastMessage?: string;
    updated_at: string;
  };
  isActive: boolean;
  onSelect: () => void;
  onDelete: () => void;
}

export function ConversationListItem({
  conversation,
  isActive,
  onSelect,
  onDelete,
}: ConversationListItemProps) {
  const [showDelete, setShowDelete] = useState(false);

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm("Delete this conversation?")) {
      onDelete();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      whileHover={{ x: 4 }}
      onMouseEnter={() => setShowDelete(true)}
      onMouseLeave={() => setShowDelete(false)}
      onClick={onSelect}
      className={`
        relative p-2.5 rounded-lg cursor-pointer transition-all
        ${
          isActive
            ? "bg-blue-50 border-l-2 border-blue-500"
            : "bg-transparent hover:bg-gray-100 border-l-2 border-transparent"
        }
      `}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h3
            className={`font-medium text-sm truncate ${
              isActive ? "text-blue-900" : "text-gray-700"
            }`}
          >
            {conversation.title}
          </h3>
          {conversation.lastMessage && (
            <p className="text-xs text-gray-500 truncate mt-1">
              {conversation.lastMessage}
            </p>
          )}
          <p className="text-xs text-gray-400 mt-1">
            {new Date(conversation.updated_at).toLocaleDateString()}
          </p>
        </div>

        <AnimatePresence>
          {showDelete && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={handleDelete}
              className="text-red-500 hover:text-red-600 p-1 rounded hover:bg-red-50"
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
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
