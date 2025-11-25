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
      <div className="min-h-screen bg-white">
        <div className="flex h-screen">
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
            className="flex-1 flex flex-col bg-white"
          >
            {/* Always use VoiceChatContainer - the original UI */}
            <VoiceChatContainer />
          </motion.div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
