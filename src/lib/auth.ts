import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { getSheet, SHEETS } from "./google-sheets";
import bcrypt from "bcryptjs";

export type Role = "owner" | "manager" | "staff";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(creds) {
        if (!creds) return null;
        try {
          const sheet = await getSheet(SHEETS.STAFF);
          const rows = await sheet.getRows();
          const user = rows.find((r) => r.get("username") === creds.username);
          if (!user) return null;
          const ok = await bcrypt.compare(
            creds.password,
            user.get("passwordHash")
          );
          if (!ok) return null;
          return {
            id: user.get("id"),
            name: user.get("fullName"),
            email: user.get("email"),
            role: user.get("role") as Role,
            image: user.get("avatarUrl"),
          } as any;
        } catch (e) {
          console.error("Auth error:", e);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
        token.uid = (user as any).id;
      }
      return token;
    },
    async session({ session, token }) {
      (session.user as any).role = token.role;
      (session.user as any).id = token.uid;
      return session;
    },
  },
  pages: { signIn: "/login" },
  secret: process.env.NEXTAUTH_SECRET,
};
