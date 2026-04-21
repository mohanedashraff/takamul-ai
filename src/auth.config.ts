// Edge-safe NextAuth config — used by middleware.
// No Prisma, bcrypt, or DB imports here. Keep this minimal.
import type { NextAuthConfig } from "next-auth";

export const authConfig: NextAuthConfig = {
  providers: [], // providers are only needed in the full config (auth.ts)
  pages: { signIn: "/login" },
  callbacks: {
    authorized({ auth: session }) {
      // We do all redirect logic in middleware.ts, just report auth state here.
      return !!session;
    },
  },
};
