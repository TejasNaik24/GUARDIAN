import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function proxy(req: NextRequest) {
  // Check for session cookie
  const supabaseToken = req.cookies.get("sb-access-token");
  const hasSession = !!supabaseToken;

  // If user is logged in and trying to access auth pages, redirect to chat
  if (
    hasSession &&
    (req.nextUrl.pathname.startsWith("/auth/login") ||
      req.nextUrl.pathname.startsWith("/auth/signup"))
  ) {
    return NextResponse.redirect(new URL("/chat", req.url));
  }

  // If user is not logged in and trying to access protected routes, redirect to chat (which will show auth modal)
  if (!hasSession && req.nextUrl.pathname.startsWith("/profile")) {
    return NextResponse.redirect(new URL("/chat", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/auth/login", "/auth/signup", "/profile"],
};
