/**
 * Guest Authentication Utility
 * Handles temporary guest sessions without Supabase
 */

export interface GuestSession {
  id: string;
  createdAt: string;
  isGuest: true;
}

const GUEST_SESSION_KEY = "guardian_guest_session";

/**
 * Create a new guest session
 */
export function createGuestSession(): GuestSession {
  const guestSession: GuestSession = {
    id: `guest-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    createdAt: new Date().toISOString(),
    isGuest: true,
  };

  // Store in localStorage
  if (typeof window !== "undefined") {
    localStorage.setItem(GUEST_SESSION_KEY, JSON.stringify(guestSession));
  }

  return guestSession;
}

/**
 * Get current guest session
 */
export function getGuestSession(): GuestSession | null {
  if (typeof window === "undefined") return null;

  try {
    const stored = localStorage.getItem(GUEST_SESSION_KEY);
    if (!stored) return null;

    const session = JSON.parse(stored);
    return session;
  } catch (error) {
    console.error("Error retrieving guest session:", error);
    return null;
  }
}

/**
 * Clear guest session
 */
export function clearGuestSession(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(GUEST_SESSION_KEY);
  }
}

/**
 * Check if user is currently in guest mode
 */
export function isGuestMode(): boolean {
  return getGuestSession() !== null;
}
