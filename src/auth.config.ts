// Edge-safe NextAuth config — used by middleware.
// No Prisma, bcrypt, or DB imports here. Keep this minimal.
import type { NextAuthConfig } from "next-auth";

export const authConfig: NextAuthConfig = {
  providers: [], // providers are only needed in the full config (auth.ts)
  pages: { signIn: "/login" },
  // We need to return the session info from JWT for middleware to see role.
  // Must mirror the jwt callback shape from auth.ts.
  callbacks: {
    async session({ session, token }) {
      if (token.id && session.user) {
        session.user.id = token.id as string;
        session.user.plan = token.plan as never;
        session.user.role = token.role as never;
        session.user.creditsBalance = token.creditsBalance as number;
      }
      return session;
    },
    authorized({ auth: session }) {
      return !!session;
    },
  },
};
