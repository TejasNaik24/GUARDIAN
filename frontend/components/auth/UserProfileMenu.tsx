"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

interface UserProfileMenuProps {
  isExpanded?: boolean;
}

export default function UserProfileMenu({
  isExpanded = false,
}: UserProfileMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { user, isGuest, signOut } = useAuth();
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleLogout = async () => {
    await signOut();
    router.push("/");
  };

  const getDisplayName = () => {
    if (isGuest) return "Guest User";
    // Show just initials instead of full email
    const email = user?.email || "";
    if (!email) return "User";

    // Get first letter of email and first letter after @ (if exists)
    const parts = email.split("@");
    const firstLetter = parts[0].charAt(0).toUpperCase();

    return firstLetter;
  };

  const getInitials = () => {
    if (isGuest) return "G";
    const email = user?.email || "";
    return email.charAt(0).toUpperCase();
  };

  const renderAvatar = () => {
    if (isGuest) {
      // Guest icon
      return (
        <div className="w-8 h-8 rounded-full bg-gray-400 flex items-center justify-center">
          <svg
            className="w-5 h-5 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
        </div>
      );
    }

    // Regular user initials
    return (
      <div className="w-8 h-8 rounded-full bg-[#3B82F6] flex items-center justify-center text-white font-semibold text-sm">
        {getInitials()}
      </div>
    );
  };

  return (
    <div
      ref={menuRef}
      className={isExpanded ? "w-full" : "fixed bottom-4 left-4 z-50"}
    >
      {/* Profile Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`bg-white hover:bg-gray-50 rounded-xl shadow-lg transition-colors border border-gray-200 cursor-pointer ${
          isExpanded ? "w-full p-2 flex items-center gap-3" : "p-2"
        }`}
      >
        {/* Avatar */}
        {renderAvatar()}
        {/* Email - shown when expanded */}
        {isExpanded && !isGuest && user?.email && (
          <div className="flex-1 text-left min-w-0">
            <p className="text-xs text-gray-700 font-medium truncate">
              {user.email}
            </p>
          </div>
        )}
        {isExpanded && isGuest && (
          <div className="flex-1 text-left min-w-0">
            <p className="text-xs text-gray-500 truncate">Guest User</p>
          </div>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute bottom-full left-0 mb-2 w-64 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden">
          {/* User Info */}
          <div className="px-4 py-3 border-b border-gray-100">
            {!isGuest && user?.email && (
              <p className="text-xs text-gray-500">{user.email}</p>
            )}
            {isGuest && (
              <p className="text-xs text-yellow-600">
                Your chats won&apos;t be saved
              </p>
            )}
          </div>

          {/* Menu Items */}
          <div className="py-1">
            {isGuest ? (
              <button
                onClick={() => {
                  setIsOpen(false);
                  router.push("/");
                }}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 cursor-pointer"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                  />
                </svg>
                Create Account
              </button>
            ) : (
              <button
                onClick={() => {
                  setIsOpen(false);
                  router.push("/profile");
                }}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 cursor-pointer"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
                Profile Settings
              </button>
            )}

            <button
              onClick={handleLogout}
              className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-3 cursor-pointer"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
              Log out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
