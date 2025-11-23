"use client";

import { motion } from "framer-motion";
import VoiceChatContainer from "@/components/speechUI/VoiceChatContainer";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import UserProfileMenu from "@/components/auth/UserProfileMenu";
import { useAuth } from "@/contexts/AuthContext";

export default function ChatPage() {
  const { isGuest } = useAuth();

  return (
    <ProtectedRoute>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="h-screen relative"
      >
        <VoiceChatContainer />

        {/* User Profile Menu - only show for logged in users */}
        {!isGuest && <UserProfileMenu />}
      </motion.div>
    </ProtectedRoute>
  );
}
