"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import type { Session, User } from "@supabase/supabase-js";

interface SupabaseContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  refreshSession: () => Promise<void>;
}

const SupabaseContext = createContext<SupabaseContextType>({
  session: null,
  user: null,
  loading: true,
  refreshSession: async () => {},
});

export function SupabaseProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    const initSession = async () => {
      try {
        const {
          data: { session: currentSession },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          console.error("Error getting session:", error);
        }

        setSession(currentSession);
        setUser(currentSession?.user ?? null);
      } catch (error) {
        console.error("Session initialization error:", error);
      } finally {
        setLoading(false);
      }
    };

    initSession();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      console.log("Auth state changed:", event);

      setSession(currentSession);
      setUser(currentSession?.user ?? null);

      // Handle different auth events
      switch (event) {
        case "SIGNED_IN":
          console.log("User signed in");
          break;
        case "SIGNED_OUT":
          console.log("User signed out");
          break;
        case "TOKEN_REFRESHED":
          console.log("Token refreshed");
          break;
        case "USER_UPDATED":
          console.log("User updated");
          break;
      }
    });

    // Cleanup subscription
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const refreshSession = async () => {
    try {
      const {
        data: { session: newSession },
        error,
      } = await supabase.auth.refreshSession();

      if (error) {
        console.error("Error refreshing session:", error);
        return;
      }

      setSession(newSession);
      setUser(newSession?.user ?? null);
    } catch (error) {
      console.error("Session refresh error:", error);
    }
  };

  const value = {
    session,
    user,
    loading,
    refreshSession,
  };

  return (
    <SupabaseContext.Provider value={value}>
      {children}
    </SupabaseContext.Provider>
  );
}

export function useSupabaseSession() {
  const context = useContext(SupabaseContext);

  if (context === undefined) {
    throw new Error(
      "useSupabaseSession must be used within a SupabaseProvider"
    );
  }

  return context;
}
