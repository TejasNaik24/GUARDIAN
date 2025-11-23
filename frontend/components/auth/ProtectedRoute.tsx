"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import AuthModal from "./AuthModal";

export default function ProtectedRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isGuest, loading } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [showUI, setShowUI] = useState(false);

  useEffect(() => {
    if (!loading && !user && !isGuest) {
      // Show UI first
      setShowUI(true);
      // Then show auth modal after 2 seconds
      const timer = setTimeout(() => {
        setShowAuthModal(true);
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [user, isGuest, loading]);

  // Show loading spinner
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#3B82F6] border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show UI with delayed auth modal if not authenticated
  if (!user && !isGuest) {
    return (
      <div className="relative">
        {/* Show the actual chat UI in background */}
        {children}

        {/* Simple fade-in auth modal */}
        <AnimatePresence>
          {showAuthModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 z-100 bg-black/60 backdrop-blur-md flex items-center justify-center p-4"
            >
              <AuthModal
                isOpen={true}
                onClose={() => {}} // Prevent closing without auth
                mode={authMode}
                onSwitchMode={setAuthMode}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return <>{children}</>;
}
