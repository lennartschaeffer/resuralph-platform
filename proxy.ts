/**
 * Supabase Auth Middleware
 *
 * Next.js middleware runs before every matched request. This middleware's job
 * is to keep the Supabase auth session alive by refreshing expired tokens.
 *
 * Supabase stores the session as HTTP-only cookies. JWTs expire, so on each
 * request we create a temporary Supabase client, call `getUser()` to trigger
 * a token refresh if needed, and forward the updated cookies to the browser
 * via the response.
 *
 * The cookie plumbing works in three parts:
 *  1. `getAll` — reads existing auth cookies from the incoming request so the
 *     Supabase client can see the current session.
 *  2. `setAll` — when Supabase refreshes tokens, it calls this with new cookie
 *     values. We write them to both the request (so downstream server code
 *     sees the fresh session) and a new NextResponse (so the browser receives
 *     the Set-Cookie headers).
 *  3. `getUser()` — actually triggers the refresh. Without this call, the
 *     cookie handlers would never fire and sessions would eventually expire.
 */
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Refresh the session
  await supabase.auth.getUser();

  return supabaseResponse;
}

export const config = {
  matcher: [
    // Run on all routes except static files and Next.js internals
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
