"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { motion } from "framer-motion";

function AuthCallbackContent() {
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Check for error from OAuth redirect
        const errorParam = searchParams.get("error");
        const errorDescription = searchParams.get("error_description");

        if (errorParam) {
          setError(errorDescription || errorParam);
          setTimeout(() => router.push("/chat"), 3000);
          return;
        }

        // Get the session - if OAuth was successful, session should exist
        const { data, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          console.error("Session error:", sessionError);
          setError(sessionError.message);
          setTimeout(() => router.push("/chat"), 3000);
          return;
        }

        if (data.session) {
          const user = data.session.user;

          // Check if profile exists, if not create one
          const { data: profileData, error: profileError } = await supabase
            .from("profiles")
            .select("id")
            .eq("id", user.id)
            .single();

          if (profileError && profileError.code === "PGRST116") {
            // Profile doesn't exist, create it
            const { error: insertError } = await supabase
              .from("profiles")
              .insert({
                id: user.id,
                email: user.email,
                full_name:
                  user.user_metadata?.full_name ||
                  user.user_metadata?.name ||
                  user.email?.split("@")[0],
                avatar_url:
                  user.user_metadata?.avatar_url ||
                  user.user_metadata?.picture ||
                  null,
                created_at: new Date().toISOString(),
              });

            if (insertError) {
              console.error("Error creating profile:", insertError);
              // Don't fail auth if profile creation fails
            }
          }

          // Small delay to ensure everything is saved
          setTimeout(() => {
            router.push("/chat");
            router.refresh();
          }, 500);
        } else {
          setError("No session found. Please try logging in again.");
          setTimeout(() => router.push("/chat"), 3000);
        }
      } catch (err: any) {
        console.error("Auth callback error:", err);
        setError(err.message || "Authentication failed");
        setTimeout(() => router.push("/chat"), 3000);
      }
    };

    handleAuthCallback();
  }, [router, searchParams]);

  return (
    <div className="min-h-screen bg-linear-to-br from-[#F8FAFC] to-[#E0E7FF] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center"
      >
        {!error ? (
          <>
            <div className="w-16 h-16 bg-linear-to-br from-[#1E3A8A] to-[#3B82F6] rounded-full mx-auto mb-4 flex items-center justify-center animate-pulse">
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
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-[#1E3A8A] mb-2">
              Signing you in...
            </h1>
            <p className="text-gray-600">
              Please wait while we complete your authentication
            </p>
            <div className="mt-6 flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3B82F6]"></div>
            </div>
          </>
        ) : (
          <>
            <div className="w-16 h-16 bg-red-100 rounded-full mx-auto mb-4 flex items-center justify-center">
              <svg
                className="w-8 h-8 text-red-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-[#1E3A8A] mb-2">
              Authentication Error
            </h1>
            <p className="text-gray-600 mb-4">{error}</p>
            <p className="text-sm text-gray-500">
              Redirecting to login page...
            </p>
          </>
        )}
      </motion.div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-linear-to-br from-[#F8FAFC] to-[#E0E7FF] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-linear-to-br from-[#1E3A8A] to-[#3B82F6] rounded-full mx-auto mb-4 flex items-center justify-center animate-pulse">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-[#1E3A8A] mb-2">Loading...</h1>
        </div>
      </div>
    }>
      <AuthCallbackContent />
    </Suspense>
  );
}
