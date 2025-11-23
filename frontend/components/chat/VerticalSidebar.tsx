"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import UserProfileMenu from "@/components/auth/UserProfileMenu";
import { useConversation } from "@/contexts/ConversationContext";

interface VerticalSidebarProps {
  onToggleHistory: () => void;
  isHistoryOpen: boolean;
}

export function VerticalSidebar({
  onToggleHistory,
  isHistoryOpen,
}: VerticalSidebarProps) {
  const { isGuest } = useAuth();
  const { createConversation } = useConversation();

  const handleNewChat = async () => {
    await createConversation();
  };

  if (isGuest) return null;

  return (
    <div className="fixed left-0 top-0 h-full w-16 bg-[#171717] border-r border-gray-800 flex flex-col items-center py-4 z-50">
      {/* Guardian Logo at Top */}
      <div className="mb-6">
        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg">
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
              d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
            />
          </svg>
        </div>
      </div>

      {/* Sidebar Toggle Button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={onToggleHistory}
        className="w-10 h-10 mb-4 rounded-lg bg-gray-800 hover:bg-gray-700 flex items-center justify-center transition-colors"
        title="Toggle conversation history"
      >
        <svg
          className="w-5 h-5 text-gray-300"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          {isHistoryOpen ? (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
            />
          ) : (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          )}
        </svg>
      </motion.button>

      {/* New Chat Button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={handleNewChat}
        className="w-10 h-10 mb-4 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 flex items-center justify-center shadow-lg transition-all"
        title="New chat"
      >
        <svg
          className="w-5 h-5 text-white"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 4v16m8-8H4"
          />
        </svg>
      </motion.button>

      {/* Spacer to push user icon to bottom */}
      <div className="flex-1" />

      {/* User Profile Icon at Bottom */}
      <div className="mt-auto">
        <UserProfileMenu />
      </div>
    </div>
  );
}
