"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import LoginForm from "./LoginForm";
import SignupForm from "./SignupForm";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: "login" | "signup";
  onSwitchMode: (mode: "login" | "signup") => void;
}

export default function AuthModal({
  isOpen,
  onClose,
  mode,
  onSwitchMode,
}: AuthModalProps) {
  const router = useRouter();

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const handleGuestMode = () => {
    const guestSession = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    sessionStorage.setItem(
      "guardian_guest_session",
      JSON.stringify(guestSession)
    );
    onClose();
    // Force page reload to trigger auth context refresh
    window.location.href = "/chat";
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 z-10">
        {/* Close button */}


        {/* Content */}
        {mode === "login" ? (
          <LoginForm
            onSwitchToSignup={() => onSwitchMode("signup")}
            onClose={onClose}
            onGuestMode={handleGuestMode}
          />
        ) : (
          <SignupForm
            onSwitchToLogin={() => onSwitchMode("login")}
            onClose={onClose}
          />
        )}
      </div>
    </div>
  );
}
