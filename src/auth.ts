// ============================================================
// NextAuth Configuration (Minimal — V1)
// Credentials provider + JWT session strategy.
// ============================================================

import NextAuth, { type DefaultSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

// ------------------------------------------------------------
// Type augmentation
// ------------------------------------------------------------

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    role: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: string;
  }
}

// ------------------------------------------------------------
// NextAuth config
// ------------------------------------------------------------

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const email = String(credentials.email).toLowerCase().trim();
        const password = String(credentials.password);

        const user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user) return null;
        if (user.status !== "ACTIVE") return null;
        if (user.deletedAt) return null;

        const passwordMatches = await bcrypt.compare(
          password,
          user.passwordHash,
        );
        if (!passwordMatches) return null;

        // Update last login
        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        });

        // Fetch the user's primary role (temporary bridge until full RBAC)
        const primaryRole = await prisma.userRole.findFirst({
          where: { userId: user.id },
          include: { role: true },
        });

        return {
          id: user.id,
          email: user.email,
          name: user.username,
          role: primaryRole?.role.key ?? "STUDENT",
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (token.id && session.user) {
        session.user.id = String(token.id);
        session.user.role = String(token.role ?? "STUDENT");
      }
      return session;
    },
  },
});