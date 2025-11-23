"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import VoiceChatContainer from "@/components/speechUI/VoiceChatContainer";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { ConversationSidebar } from "@/components/chat/ConversationSidebar";
import { MessageLoader } from "@/components/chat/MessageLoader";
import { VerticalSidebar } from "@/components/chat/VerticalSidebar";
import { useAuth } from "@/contexts/AuthContext";
import { useConversation } from "@/contexts/ConversationContext";

export default function ChatPage() {
  const { isGuest } = useAuth();
  const { currentConversation } = useConversation();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <ProtectedRoute>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="h-screen relative flex"
      >
        {/* Vertical Sidebar - Always visible for logged in users */}
        <VerticalSidebar
          onToggleHistory={() => setSidebarOpen(!sidebarOpen)}
          isHistoryOpen={sidebarOpen}
        />

        {/* Conversation Sidebar - only show for logged in users */}
        {!isGuest && (
          <ConversationSidebar
            isOpen={sidebarOpen}
            onToggle={() => setSidebarOpen(!sidebarOpen)}
          />
        )}

        {/* Main Chat Area */}
        <div
          className={`flex-1 flex flex-col transition-all ${
            !isGuest ? "ml-16" : ""
          } ${sidebarOpen && !isGuest ? "lg:ml-80" : ""}`}
        >
          {/* Show message loader if conversation is selected, otherwise show voice chat */}
          {currentConversation && !isGuest ? (
            <MessageLoader />
          ) : (
            <VoiceChatContainer />
          )}
        </div>
      </motion.div>
    </ProtectedRoute>
  );
}
