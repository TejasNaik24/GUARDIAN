"use client";

import { useSupabaseSession } from "@/hooks/useSupabaseSession";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

/**
 * Utility hook to require authentication
 * Redirects to /chat if user is not logged in
 *
 * @returns Current user or null
 */
export function useRequireAuth() {
  const { user, loading } = useSupabaseSession();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/chat");
    }
  }, [user, loading, router]);

  return { user, loading };
}

/**
 * Check if user is authenticated (synchronous)
 * Use this in components that need immediate auth check
 */
export function useIsAuthenticated() {
  const { user, loading } = useSupabaseSession();
  return { isAuthenticated: !!user, loading };
}
