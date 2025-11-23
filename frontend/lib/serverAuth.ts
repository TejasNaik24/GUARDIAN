import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

/**
 * Get the current user session on the server side
 * Use this in Server Components or Server Actions
 */
export async function getServerSession() {
  try {
    const cookieStore = cookies();
    const accessToken = cookieStore.get("sb-access-token");
    const refreshToken = cookieStore.get("sb-refresh-token");

    if (!accessToken || !refreshToken) {
      return { user: null, session: null };
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(accessToken.value);

    if (error || !user) {
      return { user: null, session: null };
    }

    return {
      user,
      session: {
        access_token: accessToken.value,
        refresh_token: refreshToken.value,
      },
    };
  } catch (error) {
    console.error("Error getting server session:", error);
    return { user: null, session: null };
  }
}

/**
 * Require authentication on the server side
 * Redirects to /chat if not authenticated
 */
export async function requireAuth() {
  const { user } = await getServerSession();

  if (!user) {
    throw new Error("Unauthorized - Please log in");
  }

  return user;
}

/**
 * Get user profile from database
 */
export async function getUserProfile(userId: string) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) {
      console.error("Error fetching profile:", error);
      return null;
    }

    return data;
  } catch (error) {
    console.error("Error in getUserProfile:", error);
    return null;
  }
}
