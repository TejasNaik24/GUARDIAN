"use client";

import { motion } from "framer-motion";
import { useState, useEffect } from "react";
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
  const [isMobile, setIsMobile] = useState(false);

  // Simple mobile detection
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-white">
        <div className="flex h-screen">
          {/* Unified Vertical Sidebar - Always visible for logged in users */}
          <VerticalSidebar
            isExpanded={sidebarExpanded}
            onToggle={() => setSidebarExpanded(!sidebarExpanded)}
            isMobile={isMobile}
            onCloseMobile={() => setSidebarExpanded(false)}
          />

          {/* Main Chat Area */}
          <motion.div
            animate={{
              marginLeft: !isGuest && !isMobile ? (sidebarExpanded ? 240 : 64) : 0,
            }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="flex-1 flex flex-col bg-white w-full"
          >
            {/* Always use VoiceChatContainer - the original UI */}
            <VoiceChatContainer
              onSidebarToggle={() => setSidebarExpanded(!sidebarExpanded)}
            />
          </motion.div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
