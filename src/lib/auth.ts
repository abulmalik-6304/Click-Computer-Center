import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { getSheet, SHEETS } from "./google-sheets";
import bcrypt from "bcryptjs";

export type Role = "owner" | "manager" | "staff" | "Employee" | "Owner" | "Manager";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        username: { label: "Username / Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(creds) {
        if (!creds?.username || !creds?.password) return null;

        const inputUser = creds.username.trim().toLowerCase();

        // 👑 1. የኦነር (አብዱልመሊክ) ትክክለኛ ኢሜይል ሲገባ በኃይል የ Owner ስልጣን መስጠት
        if (inputUser === "tahareabdu24@gmail.com" || inputUser.includes("abdulmelik")) {
          return {
            id: "owner-tahar",
            name: "Abdulmelik Tahar (Owner)",
            email: "tahareabdu24@gmail.com",
            role: "owner",
            image: "",
          } as any;
        }

        try {
          // ከ Staff ወይም Users ቴብል ላይ ማረጋገጥ
          let sheet;
          try {
            sheet = await getSheet(SHEETS.STAFF);
          } catch {
            sheet = await getSheet(SHEETS.USERS);
          }

          if (!sheet) return null;

          const rows = await sheet.getRows();
          const userRow = rows.find((r) => {
            const uName = (r.get("username") || r.get("email") || r.get("User_Email") || "").toLowerCase().trim();
            return uName === inputUser;
          });

          if (!userRow) return null;

          const storedPass = userRow.get("passwordHash") || userRow.get("password") || userRow.get("Password") || "";
          
          // ፓስወርዱ በ Hash ወይም በ Plaintext መሆኑን ማረጋገጥ
          let isValid = false;
          if (storedPass.startsWith("$2a$") || storedPass.startsWith("$2b$")) {
            isValid = await bcrypt.compare(creds.password, storedPass);
          } else {
            isValid = creds.password === storedPass;
          }

          if (!isValid) return null;

          const userEmail = userRow.get("email") || userRow.get("User_Email") || creds.username;
          const assignedRole = (userRow.get("role") || userRow.get("Role") || "staff").toLowerCase();

          return {
            id: userRow.get("id") || userEmail,
            name: userRow.get("fullName") || userRow.get("Full_Name") || userRow.get("name") || userEmail,
            email: userEmail,
            role: assignedRole,
            image: userRow.get("avatarUrl") || userRow.get("Profile_Image") || "",
          } as any;

        } catch (e) {
          console.error("Auth Error:", e);
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
      if (session.user) {
        (session.user as any).role = token.role;
        (session.user as any).id = token.uid;
      }
      return session;
    },
  },
  pages: { signIn: "/login" },
  secret: process.env.NEXTAUTH_SECRET || "click-computer-center-secret-key-2026",
};
