"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import VoiceChatContainer from "@/components/speechUI/VoiceChatContainer";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { MessageLoader } from "@/components/chat/MessageLoader";
import { VerticalSidebar } from "@/components/chat/VerticalSidebar";
import { useAuth } from "@/contexts/AuthContext";
import { useConversation } from "@/contexts/ConversationContext";

export default function ChatPage() {
  const { isGuest } = useAuth();
  const { currentConversation } = useConversation();
  const [sidebarExpanded, setSidebarExpanded] = useState(false);

  return (
    <ProtectedRoute>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="h-screen relative flex"
      >
        {/* Unified Vertical Sidebar - Always visible for logged in users */}
        <VerticalSidebar
          isExpanded={sidebarExpanded}
          onToggle={() => setSidebarExpanded(!sidebarExpanded)}
        />

        {/* Main Chat Area */}
        <motion.div
          animate={{
            marginLeft: !isGuest ? (sidebarExpanded ? 240 : 64) : 0,
          }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="flex-1 flex flex-col"
        >
          {/* Show message loader if conversation is selected, otherwise show voice chat */}
          {currentConversation && !isGuest ? (
            <MessageLoader />
          ) : (
            <VoiceChatContainer />
          )}
        </motion.div>
      </motion.div>
    </ProtectedRoute>
  );
}
