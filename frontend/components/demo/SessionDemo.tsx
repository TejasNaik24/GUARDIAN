"use client";

import { useSupabaseSession } from "@/hooks/useSupabaseSession";

/**
 * Example component demonstrating Supabase session management
 * Shows real-time auth state and session information
 */
export default function SessionDemo() {
  const { session, user, loading, refreshSession } = useSupabaseSession();

  if (loading) {
    return (
      <div className="p-6 bg-gray-100 rounded-lg">
        <div className="flex items-center gap-3">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <p className="text-gray-600">Loading session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg border border-gray-200">
      <h2 className="text-2xl font-bold mb-4 text-gray-900">
        Session Management Demo
      </h2>

      {/* Auth Status */}
      <div className="mb-6">
        <div
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${
            user ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
          }`}
        >
          <div
            className={`w-2 h-2 rounded-full ${
              user ? "bg-green-500" : "bg-red-500"
            }`}
          ></div>
          <span className="font-semibold">
            {user ? "Authenticated" : "Not Authenticated"}
          </span>
        </div>
      </div>

      {/* User Info */}
      {user ? (
        <div className="space-y-4">
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="font-semibold text-blue-900 mb-2">User Info</h3>
            <div className="space-y-1 text-sm">
              <p className="text-gray-700">
                <span className="font-medium">Email:</span> {user.email}
              </p>
              <p className="text-gray-700">
                <span className="font-medium">User ID:</span>{" "}
                <code className="bg-gray-100 px-1 py-0.5 rounded text-xs">
                  {user.id}
                </code>
              </p>
              {user.user_metadata?.full_name && (
                <p className="text-gray-700">
                  <span className="font-medium">Name:</span>{" "}
                  {user.user_metadata.full_name}
                </p>
              )}
              <p className="text-gray-700">
                <span className="font-medium">Created:</span>{" "}
                {new Date(user.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Session Info */}
          {session && (
            <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
              <h3 className="font-semibold text-purple-900 mb-2">
                Session Info
              </h3>
              <div className="space-y-1 text-sm">
                <p className="text-gray-700">
                  <span className="font-medium">Token Type:</span>{" "}
                  {session.token_type}
                </p>
                <p className="text-gray-700">
                  <span className="font-medium">Expires In:</span>{" "}
                  {Math.floor(session.expires_in / 60)} minutes
                </p>
                {session.expires_at && (
                  <p className="text-gray-700">
                    <span className="font-medium">Expires At:</span>{" "}
                    {new Date(session.expires_at * 1000).toLocaleTimeString()}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="pt-2">
            <button
              onClick={refreshSession}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer text-sm font-medium"
            >
              🔄 Refresh Session
            </button>
          </div>
        </div>
      ) : (
        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-gray-600 mb-4">
            No active session. Please log in to see session details.
          </p>
          <button
            onClick={() => (window.location.href = "/chat")}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer text-sm font-medium"
          >
            Go to Login
          </button>
        </div>
      )}

      {/* Info Box */}
      <div className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
        <div className="flex items-start gap-2">
          <svg
            className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0"
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
          <div className="text-sm">
            <p className="font-semibold text-yellow-900 mb-1">
              Real-time Updates
            </p>
            <p className="text-yellow-700">
              This component automatically updates when you log in or out. Try
              logging in/out in another tab and watch this update instantly!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
