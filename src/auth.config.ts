import type { NextAuthConfig } from "next-auth"

// Configuration compatible Edge Runtime (pas d'accès Prisma/Node ici) —
// utilisée par le middleware. La config complète (adapter, provider) vit
// dans src/auth.ts, chargée uniquement côté Node.js.
export const authConfig = {
  secret: process.env.AUTH_SECRET,
  trustHost: true,
  pages: { signIn: "/login" },
  session: { strategy: "jwt" },
  providers: [],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
      }
      return token
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id!
        session.user.role = token.role!
      }
      return session
    },
  },
} satisfies NextAuthConfig
