"use client";

import { useState } from "react";
import { useGuardianRAG } from "@/hooks/useGuardianRAG";
import { motion, AnimatePresence } from "framer-motion";

interface Source {
  content: string;
  similarity: number;
}

interface Message {
  role: "user" | "assistant";
  content: string;
  sources?: Source[];
}

interface RAGChatProps {
  conversationId?: string;
  onResponseReceived?: (conversationId: string) => void;
}

export default function RAGChat({
  conversationId,
  onResponseReceived,
}: RAGChatProps) {
  const { chat, loading, error } = useGuardianRAG();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [expandedSources, setExpandedSources] = useState<number | null>(null);

  const handleSend = async () => {
    console.log("⭐ [RAGChat] handleSend called");
    console.log("⭐ [RAGChat] Input:", input);
    console.log("⭐ [RAGChat] Loading:", loading);

    if (!input.trim() || loading) {
      console.log("⭐ [RAGChat] Returning early - no input or loading");
      return;
    }

    const userMessage: Message = {
      role: "user",
      content: input.trim(),
    };

    console.log("⭐ [RAGChat] Adding user message to state");
    setMessages((prev) => [...prev, userMessage]);
    setInput("");

    // Call backend
    console.log("⭐ [RAGChat] Calling chat() function...");
    const response = await chat(input.trim(), conversationId);
    console.log("⭐ [RAGChat] Got response:", response);

    if (response) {
      const assistantMessage: Message = {
        role: "assistant",
        content: response.message,
        sources: response.sources,
      };

      setMessages((prev) => [...prev, assistantMessage]);

      if (onResponseReceived) {
        onResponseReceived(response.conversation_id);
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <AnimatePresence>
          {messages.map((message, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[70%] rounded-lg p-4 ${
                  message.role === "user"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-900"
                }`}
              >
                <p className="whitespace-pre-wrap">{message.content}</p>

                {/* Show Sources */}
                {message.sources && message.sources.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-300">
                    <button
                      onClick={() =>
                        setExpandedSources(expandedSources === idx ? null : idx)
                      }
                      className="text-sm font-medium text-gray-700 hover:text-gray-900 flex items-center gap-2"
                    >
                      <svg
                        className={`w-4 h-4 transition-transform ${
                          expandedSources === idx ? "rotate-180" : ""
                        }`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                      {message.sources.length} Retrieved Sources
                    </button>

                    {expandedSources === idx && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        className="mt-2 space-y-2"
                      >
                        {message.sources.map((source, sourceIdx) => (
                          <div
                            key={sourceIdx}
                            className="bg-white p-3 rounded border border-gray-200"
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-medium text-gray-500">
                                Source {sourceIdx + 1}
                              </span>
                              <span className="text-xs text-blue-600">
                                {(source.similarity * 100).toFixed(1)}% match
                              </span>
                            </div>
                            <p className="text-sm text-gray-700">
                              {source.content}
                            </p>
                          </div>
                        ))}
                      </motion.div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                <div
                  className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: "0.2s" }}
                />
                <div
                  className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: "0.4s" }}
                />
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
            {error}
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-200 p-4">
        <div className="flex gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask Guardian AI anything..."
            disabled={loading}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-gray-900"
            rows={2}
          />
          <button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
