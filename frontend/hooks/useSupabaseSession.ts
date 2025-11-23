import { useSupabaseSession as useSession } from "@/app/providers/SupabaseProvider";

/**
 * Custom hook to access Supabase session state
 *
 * @returns {Object} Session state and utilities
 * @returns {Session | null} session - Current Supabase session
 * @returns {User | null} user - Current authenticated user
 * @returns {boolean} loading - Loading state (true on initial load)
 * @returns {Function} refreshSession - Manually refresh the session
 *
 * @example
 * ```tsx
 * import { useSupabaseSession } from "@/hooks/useSupabaseSession";
 *
 * function MyComponent() {
 *   const { session, user, loading } = useSupabaseSession();
 *
 *   if (loading) return <div>Loading...</div>;
 *   if (!user) return <div>Not logged in</div>;
 *
 *   return <div>Welcome, {user.email}</div>;
 * }
 * ```
 */
export function useSupabaseSession() {
  return useSession();
}

export default useSupabaseSession;
