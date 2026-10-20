import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { getSheet } from "./google-sheets";
import bcrypt from "bcryptjs";

export type Role = "owner" | "manager" | "staff" | "Employee" | "Owner" | "Manager";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        username: { label: "Email / Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(creds) {
        if (!creds?.username || !creds?.password) return null;

        const inputUser = creds.username.trim().toLowerCase();

        // 👑 1. የኦነር (አብዱልመሊክ) ኢሜይል ሲገባ በኃይል የ Owner ስልጣን መስጠት
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
          // ቀጥታ ከ User_Access_TBL ቴብል ማንበብ
          const sheet = await getSheet("User_Access_TBL");
          if (!sheet) return null;

          const rows = await sheet.getRows();
          const userRow = rows.find((r) => {
            const email = (r.get("User_Email") || r.get("User_Name") || "").toLowerCase().trim();
            return email === inputUser;
          });

          if (!userRow) return null;

          // ስተተስ (Status) Active መሆኑን ማረጋገጥ (የተዘጋ ዩዘር ከሆነ እንዳይገባ)
          const status = (userRow.get("Status") || "Active").toLowerCase();
          if (status !== "active" && status !== "true" && status !== "1") {
            return null; 
          }

          const storedPass = userRow.get("Password") || userRow.get("Password_Hash") || userRow.get("password") || "";
          
          let isValid = false;
          if (storedPass.startsWith("$2a$") || storedPass.startsWith("$2b$")) {
            isValid = await bcrypt.compare(creds.password, storedPass);
          } else {
            isValid = creds.password === storedPass;
          }

          if (!isValid) return null;

          const userEmail = userRow.get("User_Email") || creds.username;
          const assignedRole = (userRow.get("Role") || "staff").toLowerCase();
          const userName = userRow.get("User_Name") || userEmail;
          const profilePic = userRow.get("Profile Picture") || "";

          return {
            id: userEmail,
            name: userName,
            email: userEmail,
            role: assignedRole,
            image: profilePic,
          } as any;

        } catch (e) {
          console.error("Auth Error from User_Access_TBL:", e);
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
