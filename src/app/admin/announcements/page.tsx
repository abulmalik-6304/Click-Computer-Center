// src/app/admin/announcements/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getSheet } from "@/lib/google-sheets";
import AnnouncementsClient from "./AnnouncementsClient";

export const revalidate = 0;

export interface Announcement {
  id: string;
  date: string;
  image: string;
  title: string;
  message: string;
  targetRole: string;
  status: string;
}

export default async function AnnouncementsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const userRole = String((session.user as any).role || "staff").toLowerCase();

  let announcements: Announcement[] = [];
  try {
    const sheet = await getSheet("Announcements_TBL");
    const rows = await sheet.getRows();
    announcements = rows.map((r) => {
      const obj = r.toObject() as any;
      return {
        id: String(obj.Announcement_ID || ""),
        date: String(obj.Date || ""),
        image: String(obj.Image || ""),
        title: String(obj.Title || ""),
        message: String(obj.Message || ""),
        targetRole: String(obj.Target_Role || "all").toLowerCase(),
        status: String(obj.Status || "Active").toLowerCase(),
      };
    });

    // Staff የራሳቸውን ብቻ ያያሉ
    if (userRole === "staff") {
      announcements = announcements.filter(
        (a) => a.targetRole === "all" || a.targetRole === "staff"
      );
    }

    announcements.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  } catch {
    announcements = [];
  }

  return (
    <AnnouncementsClient
      initialAnnouncements={announcements}
      userRole={userRole}
    />
  );
}
