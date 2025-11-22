"use client";

import { motion } from "framer-motion";
import VoiceChatContainer from "@/components/speechUI/VoiceChatContainer";

export default function ChatPage() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="h-screen"
    >
      <VoiceChatContainer />
    </motion.div>
  );
}
