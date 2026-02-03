import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db, users } from "@/lib/db";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: DrizzleAdapter(db),
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) {
          return null;
        }

        const { email, password } = parsed.data;

        const user = await db.query.users.findFirst({
          where: eq(users.email, email.toLowerCase()),
        });

        if (!user) {
          return null;
        }

        // Check for password - could be in passwordHash or legacyPasswordHash
        const hashToCheck = user.passwordHash || user.legacyPasswordHash;
        if (!hashToCheck) {
          return null;
        }

        const passwordMatch = await bcrypt.compare(password, hashToCheck);

        if (!passwordMatch) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          isFriend: user.isFriend,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role;
        token.isFriend = (user as { isFriend?: boolean }).isFriend;
      }

      // Always fetch fresh user data to reflect admin changes (e.g., isFriend toggle)
      if (token.id) {
        const freshUser = await db.query.users.findFirst({
          where: eq(users.id, token.id as string),
          columns: {
            role: true,
            isFriend: true,
            name: true,
          },
        });

        if (freshUser) {
          token.role = freshUser.role;
          token.isFriend = freshUser.isFriend;
          token.name = freshUser.name;
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.isFriend = token.isFriend as boolean;
      }
      return session;
    },
  },
});

// Type augmentation for NextAuth
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      role: string;
      isFriend: boolean;
    };
  }

  interface User {
    role?: string;
    isFriend?: boolean;
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    id?: string;
    role?: string;
    isFriend?: boolean;
  }
}
