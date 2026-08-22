import { type DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      role: "ADMIN" | "COACH" | "ATHLETE"
    } & DefaultSession["user"]
  }

  interface User {
    role?: "ADMIN" | "COACH" | "ATHLETE"
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    id?: string
    role?: "ADMIN" | "COACH" | "ATHLETE"
  }
}
