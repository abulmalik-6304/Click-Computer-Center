import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { getSheet, SHEETS } from "./google-sheets";
import bcrypt from "bcryptjs";

export type Role = "owner" | "manager" | "staff" | "Employee" | "Owner" | "Manager";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET || "click-computer-center-secret-key-2026",
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

        // 👑 Owner bypass (አብዱልመሊክ)
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
          const sheet = await getSheet(SHEETS.USERS);
          if (!sheet) return null;

          const rows = await sheet.getRows();
          const userRow = rows.find((r) => {
            const email = (r.get("User_Email") || r.get("User_Name") || "").toLowerCase().trim();
            return email === inputUser;
          });

          if (!userRow) return null;

          // ─── 🚫 STATUS CHECK (ወሳኝ!) ───
          const status = String(userRow.get("Status") || "Active").toLowerCase();
          if (status === "suspended" || status === "inactive" || status === "blocked") {
            throw new Error(`Your account is ${status}. Please contact the administrator.`);
          }

          // ─── Password check ───
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

          // ─── Update Last_Seen ───
          try {
            userRow.set("Last_Seen", new Date().toISOString());
            await userRow.save();
          } catch {
            // ስህተት ከሆነ skip
          }

          return {
            id: userEmail,
            name: userName,
            email: userEmail,
            role: assignedRole,
            image: profilePic,
          } as any;
        } catch (e: any) {
          console.error("Auth Error:", e.message);
          // ✅ የተዘጋ መልእክት ወደ login ገጽ ይዞራል
          throw new Error(e.message || "Login failed");
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
};
