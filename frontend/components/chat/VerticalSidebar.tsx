"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import UserProfileMenu from "@/components/auth/UserProfileMenu";
import { useConversation } from "@/contexts/ConversationContext";
import { ConversationListItem } from "./ConversationListItem";

interface VerticalSidebarProps {
  isExpanded: boolean;
  onToggle: () => void;
}

export function VerticalSidebar({
  isExpanded,
  onToggle,
}: VerticalSidebarProps) {
  const { isGuest } = useAuth();
  const {
    createConversation,
    conversations,
    currentConversation,
    selectConversation,
    deleteConversation,
    loading,
  } = useConversation();

  const handleNewChat = async () => {
    await createConversation();
  };

  if (isGuest) return null;

  return (
    <motion.div
      animate={{ width: isExpanded ? 240 : 64 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="fixed left-0 top-0 h-full bg-[#f9f9f9] border-r border-gray-200 flex flex-col py-4 z-[200]"
    >
      {/* Guardian Logo at Top */}
      <div className="mb-6 px-3">
        <div className="flex items-center gap-1.5">
          <div className="w-10 h-10 bg-[#3B82F6] rounded-lg flex items-center justify-center shrink-0">
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
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
          </div>
          {/* Text removed as requested */}
        </div>
      </div>

      {/* Sidebar Toggle Button */}
      <div className="px-3 mb-3 w-full">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onToggle}
          className={`w-full h-10 rounded-lg bg-white hover:bg-gray-100 flex items-center transition-colors border border-gray-200 ${isExpanded ? "gap-3 px-3" : "justify-center"
            }`}
          title="Toggle sidebar"
        >
          <svg
            className="w-5 h-5 text-gray-700 shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            {isExpanded ? (
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
                d="M13 5l7 7-7 7M5 5l7 7-7 7"
              />
            )}
          </svg>
          {isExpanded && (
            <motion.span
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="text-sm font-medium text-gray-700"
            >
              Collapse
            </motion.span>
          )}
        </motion.button>
      </div>

      {/* New Chat Button */}
      <div className="px-3 mb-3 w-full">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleNewChat}
          className={`w-full h-10 rounded-lg bg-blue-600 hover:bg-blue-700 flex items-center shadow-sm transition-all ${isExpanded ? "gap-3 px-3" : "justify-center"
            }`}
          title="New chat"
        >
          <svg
            className="w-5 h-5 text-white shrink-0"
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
          {isExpanded && (
            <motion.span
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="text-sm font-medium text-white"
            >
              New Chat
            </motion.span>
          )}
        </motion.button>
      </div>

      {/* Chat History Section - Only show when expanded */}
      {isExpanded && (
        <>
          <div className="px-3 mb-2">
            <motion.h3
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.15 }}
              className="text-xs font-semibold text-gray-500 uppercase tracking-wide"
            >
              Chat History
            </motion.h3>
          </div>

          {/* Conversation List */}
          <div className="flex-1 overflow-y-auto px-3 space-y-1">
            {loading && conversations.length === 0 ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
              </div>
            ) : conversations.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-8 text-gray-500"
              >
                <svg
                  className="w-12 h-12 mx-auto mb-3 text-gray-300"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
                <p className="text-xs">No conversations yet</p>
              </motion.div>
            ) : (
              <AnimatePresence>
                {conversations.map((conv) => (
                  <ConversationListItem
                    key={conv.id}
                    conversation={conv}
                    isActive={currentConversation?.id === conv.id}
                    onSelect={() => selectConversation(conv.id)}
                    onDelete={() => deleteConversation(conv.id)}
                  />
                ))}
              </AnimatePresence>
            )}
          </div>
        </>
      )}

      {/* User Profile Icon at Bottom */}
      <div className="mt-auto pt-4 border-t border-gray-200">
        <div
          className={`flex items-center ${isExpanded ? "px-3 justify-start" : "pl-2 pr-3 justify-center"
            }`}
        >
          <UserProfileMenu isExpanded={isExpanded} />
        </div>
      </div>
    </motion.div>
  );
}
