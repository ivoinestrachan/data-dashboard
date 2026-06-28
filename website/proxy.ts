import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function proxy(request: NextRequest) {
  // Check for NextAuth v5 session token (cookie name can vary by env)
  const sessionToken =
    request.cookies.get("authjs.session-token")?.value ||
    request.cookies.get("next-auth.session-token")?.value ||
    request.cookies.get("__Secure-authjs.session-token")?.value ||
    request.cookies.get("gordon-session")?.value  // legacy mock cookie fallback

  const isLoggedIn = !!sessionToken
  const path = request.nextUrl.pathname

  if (path.startsWith("/dashboard") && !isLoggedIn) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  if (path === "/login" && isLoggedIn) {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
