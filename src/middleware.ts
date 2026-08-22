import NextAuth from "next-auth"
import { NextResponse } from "next/server"
import { authConfig } from "@/auth.config"

const { auth } = NextAuth(authConfig)

const COACH_PREFIXES = [
  "/dashboard",
  "/athletes",
  "/workouts",
  "/calendar",
  "/exercises",
  "/messages",
  "/documents",
  "/analytics",
]
const ATHLETE_PREFIXES = ["/athlete"]
const PUBLIC_PREFIXES = ["/login", "/setup"]

function matchesPrefix(pathname: string, prefixes: string[]) {
  return prefixes.some((p) => pathname === p || pathname.startsWith(p + "/"))
}

export default auth((req) => {
  const { pathname } = req.nextUrl
  const isLoggedIn = !!req.auth
  const role = req.auth?.user?.role

  const isAuthRoute = matchesPrefix(pathname, PUBLIC_PREFIXES)
  const isCoachRoute = matchesPrefix(pathname, COACH_PREFIXES)
  const isAthleteRoute = matchesPrefix(pathname, ATHLETE_PREFIXES)

  if (!isLoggedIn && !isAuthRoute) {
    return NextResponse.redirect(new URL("/login", req.url))
  }

  if (isLoggedIn && isAuthRoute) {
    return NextResponse.redirect(
      new URL(role === "ATHLETE" ? "/athlete" : "/dashboard", req.url)
    )
  }

  if (isLoggedIn && role === "ATHLETE" && isCoachRoute) {
    return NextResponse.redirect(new URL("/athlete", req.url))
  }

  if (isLoggedIn && role !== "ATHLETE" && isAthleteRoute) {
    return NextResponse.redirect(new URL("/dashboard", req.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.svg$).*)"],
}
