"use client";

import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { useConversation } from "@/contexts/ConversationContext";
import { useGuardianRAG } from "@/hooks/useGuardianRAG";

export function ConversationChatInput() {
  const { currentConversation, addMessage, createConversation } =
    useConversation();
  const { chat } = useGuardianRAG();
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isSending) return;

    const messageText = input.trim();
    setInput("");
    setIsSending(true);

    try {
      // Create conversation if none exists
      let convId = currentConversation?.id;
      if (!convId) {
        const newConv = await createConversation();
        convId = newConv?.id;
      }

      if (!convId) {
        console.error("Failed to create conversation");
        setIsSending(false);
        return;
      }

      // Add user message
      await addMessage(convId, "user", messageText);

      // Call Guardian AI backend
      const response = await chat(messageText, convId);

      if (response) {
        // Add assistant response
        await addMessage(convId, "assistant", response.message);
      } else {
        // Fallback error message
        await addMessage(
          convId,
          "assistant",
          "Sorry, I couldn't process your request. Please try again."
        );
      }

      setIsSending(false);
    } catch (error) {
      console.error("Error sending message:", error);
      await addMessage(
        currentConversation?.id || "",
        "assistant",
        "An error occurred. Please try again."
      );
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="border-t border-gray-200 bg-white p-4">
      <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
        <div className="flex items-end gap-2">
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                currentConversation
                  ? "Type your message..."
                  : "Start a new conversation..."
              }
              rows={1}
              className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-gray-900 placeholder-gray-400"
              style={{ maxHeight: "150px" }}
            />
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="submit"
            disabled={!input.trim() || isSending}
            className="p-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-2xl hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md"
          >
            {isSending ? (
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
            ) : (
              <svg
                className="w-6 h-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                />
              </svg>
            )}
          </motion.button>
        </div>

        <p className="text-xs text-gray-500 mt-2 text-center">
          Press Enter to send, Shift+Enter for new line
        </p>
      </form>
    </div>
  );
}
