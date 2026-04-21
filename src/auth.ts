// ════════════════════════════════════════════════════════════════
// NextAuth v5 — Yilow.ai authentication
// ════════════════════════════════════════════════════════════════
// Uses JWT strategy (no DB session rows needed for credentials flow).
// Credentials provider with bcrypt password hashing.
// Google + GitHub OAuth (wired, secrets optional — only active if set).

import NextAuth, { type DefaultSession, type NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import GitHub from "next-auth/providers/github";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import type { Plan } from "@/generated/prisma/client";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      plan: Plan;
      creditsBalance: number;
    } & DefaultSession["user"];
  }
}

// Only include OAuth providers when their secrets are configured,
// so local dev doesn't crash without Google/GitHub creds.
const providers: NextAuthConfig["providers"] = [
  Credentials({
    name: "Credentials",
    credentials: {
      email:    { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
    },
    async authorize(credentials) {
      const email = (credentials?.email as string | undefined)?.toLowerCase().trim();
      const password = credentials?.password as string | undefined;
      if (!email || !password) return null;

      const user = await prisma.user.findUnique({ where: { email } });
      if (!user || !user.passwordHash) return null;

      const ok = await bcrypt.compare(password, user.passwordHash);
      if (!ok) return null;

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image,
        plan: user.plan,
        creditsBalance: user.creditsBalance,
      };
    },
  }),
];

if (process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET) {
  providers.push(Google);
}
if (process.env.AUTH_GITHUB_ID && process.env.AUTH_GITHUB_SECRET) {
  providers.push(GitHub);
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    // On OAuth first login, create the User row ourselves (no Prisma adapter needed
    // since we're JWT-only — but we still want the user in DB for credits/history).
    async signIn({ user, account }) {
      if (!user.email) return false;

      if (account?.provider !== "credentials") {
        const existing = await prisma.user.findUnique({ where: { email: user.email } });
        if (!existing) {
          await prisma.user.create({
            data: {
              email: user.email,
              name: user.name ?? null,
              image: user.image ?? null,
              creditsBalance: 100,
              creditsLimit: 100,
            },
          });
        }
      }
      return true;
    },

    async jwt({ token, user, trigger }) {
      // Initial sign-in: stuff DB record into token
      if (user?.email) {
        const dbUser = await prisma.user.findUnique({
          where: { email: user.email },
          select: { id: true, plan: true, creditsBalance: true },
        });
        if (dbUser) {
          token.id = dbUser.id;
          token.plan = dbUser.plan;
          token.creditsBalance = dbUser.creditsBalance;
        }
      }

      // Refresh credits on session update (triggered from client after a generation)
      if (trigger === "update" && token.id) {
        const fresh = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { plan: true, creditsBalance: true },
        });
        if (fresh) {
          token.plan = fresh.plan;
          token.creditsBalance = fresh.creditsBalance;
        }
      }

      return token;
    },

    async session({ session, token }) {
      if (token.id && session.user) {
        session.user.id = token.id as string;
        session.user.plan = token.plan as Plan;
        session.user.creditsBalance = token.creditsBalance as number;
      }
      return session;
    },
  },
});
