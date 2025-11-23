"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";

interface HeaderProps {
  onOpenAuth: (mode: "login" | "signup") => void;
}

export default function Header({ onOpenAuth }: HeaderProps) {
  return (
    <header className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md border-b border-gray-200 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-linear-to-br from-[#1E3A8A] to-[#3B82F6] rounded-lg flex items-center justify-center shadow-sm">
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
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
            </div>
            <span className="text-lg font-bold text-[#1E3A8A]">Guardian</span>
          </Link>

          {/* Auth Buttons */}
          <div className="flex items-center gap-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onOpenAuth("login")}
              className="px-4 py-2 text-sm font-medium text-[#1E3A8A] hover:text-[#3B82F6] transition-colors rounded-lg hover:bg-gray-100"
            >
              Log In
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onOpenAuth("signup")}
              className="px-4 py-2 text-sm font-medium text-white bg-linear-to-br from-[#1E3A8A] to-[#3B82F6] rounded-lg shadow-sm hover:shadow-md transition-all"
            >
              Sign Up
            </motion.button>
          </div>
        </div>
      </div>
    </header>
  );
}
