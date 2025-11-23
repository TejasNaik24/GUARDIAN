"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useRequireAuth } from "@/lib/requireUser";
import { motion } from "framer-motion";

interface UserProfile {
  email: string;
  full_name: string;
  bio: string;
  avatar_url: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const { user, loading: authLoading } = useRequireAuth();
  const [profile, setProfile] = useState<UserProfile>({
    email: "",
    full_name: "",
    bio: "",
    avatar_url: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!authLoading && user) {
      loadProfile();
    }
  }, [user, authLoading]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      setError("");

      // Get current user data
      const {
        data: { user: currentUser },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) throw userError;

      if (currentUser) {
        setProfile({
          email: currentUser.email || "",
          full_name:
            currentUser.user_metadata?.full_name ||
            currentUser.user_metadata?.name ||
            "",
          bio: currentUser.user_metadata?.bio || "",
          avatar_url:
            currentUser.user_metadata?.avatar_url ||
            currentUser.user_metadata?.picture ||
            "",
        });
      }
    } catch (err: any) {
      console.error("Error loading profile:", err);
      setError(err.message || "Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSaving(true);

    try {
      // Update user metadata in Supabase Auth
      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          full_name: profile.full_name,
          bio: profile.bio,
          avatar_url: profile.avatar_url,
        },
      });

      if (updateError) throw updateError;

      setSuccess("Profile updated successfully!");

      // Refresh the profile data to show updated values
      await loadProfile();

      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      console.error("Error updating profile:", err);
      setError(err.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: keyof UserProfile, value: string) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-[#F8FAFC] to-[#E0E7FF] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3B82F6] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-[#F8FAFC] to-[#E0E7FF] py-12 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="max-w-2xl mx-auto"
      >
        {/* Header */}
        <div className="bg-white rounded-t-2xl shadow-lg p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-linear-to-br from-[#1E3A8A] to-[#3B82F6] rounded-full flex items-center justify-center shadow-md">
                {profile.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt="Profile"
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <svg
                    className="w-8 h-8 text-white"
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
                )}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-[#1E3A8A]">
                  Profile Settings
                </h1>
                <p className="text-gray-600 text-sm">
                  Manage your account information
                </p>
              </div>
            </div>
            <button
              onClick={() => router.push("/chat")}
              className="text-gray-500 hover:text-gray-700 transition-colors cursor-pointer"
            >
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
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white rounded-b-2xl shadow-lg p-6">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm"
            >
              {error}
            </motion.div>
          )}

          {success && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-600 text-sm flex items-center gap-2"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              {success}
            </motion.div>
          )}

          <form onSubmit={handleSave} className="space-y-6">
            {/* Email (Read-only) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={profile.email}
                  disabled
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-600 cursor-not-allowed"
                />
                <div className="absolute right-3 top-3">
                  <svg
                    className="w-5 h-5 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                </div>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Email cannot be changed
              </p>
            </div>

            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name
              </label>
              <input
                type="text"
                value={profile.full_name}
                onChange={(e) => handleChange("full_name", e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent text-black"
                placeholder="John Doe"
              />
            </div>

            {/* Bio */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bio
              </label>
              <textarea
                value={profile.bio}
                onChange={(e) => handleChange("bio", e.target.value)}
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent text-black resize-none"
                placeholder="Tell us about yourself..."
              />
              <p className="mt-1 text-xs text-gray-500">
                A brief description about you
              </p>
            </div>

            {/* Avatar URL */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Avatar URL
              </label>
              <input
                type="url"
                value={profile.avatar_url}
                onChange={(e) => handleChange("avatar_url", e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent text-black"
                placeholder="https://example.com/avatar.jpg"
              />
              <p className="mt-1 text-xs text-gray-500">
                Enter a URL to your profile picture
              </p>
            </div>

            {/* Save Button */}
            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 py-3 bg-[#2563EB] text-white rounded-lg font-semibold hover:bg-[#1D4ED8] disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    Save Changes
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => router.push("/chat")}
                className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>

        {/* Additional Info */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <svg
              className="w-5 h-5 text-blue-600 mt-0.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-blue-900 mb-1">
                Profile Information
              </h3>
              <p className="text-xs text-blue-700">
                Your profile information is stored securely and can be updated
                at any time. Changes are synced across all your devices.
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
