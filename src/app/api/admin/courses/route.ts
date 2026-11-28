// src/app/api/admin/courses/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSheet, getDoc } from "@/lib/google-sheets";
import { normalizeRole } from "@/lib/roles";

const SHEET = "Web_Courses_TBL";

export const revalidate = 0;
export const dynamic = "force-dynamic";

// ✅ GET: List all courses
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = normalizeRole((session.user as any)?.role);
  if (role !== "owner" && role !== "manager") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const sheet = await getSheet(SHEET);
    const rows = await sheet.getRows();
    const courses = rows.map((r) => {
      const o = r.toObject() as any;
      let hAm: any[] = [];
      let hEn: any[] = [];
      try {
        hAm = JSON.parse(o.Highlights_Am || "[]");
        hEn = JSON.parse(o.Highlights_En || "[]");
      } catch {}
      return {
        id: String(o.Course_ID || ""),
        titleAm: String(o.Title_Am || ""),
        titleEn: String(o.Title_En || ""),
        descriptionAm: String(o.Description_Am || ""),
        descriptionEn: String(o.Description_En || ""),
        icon: String(o.Icon || "📚"),
        durationAm: String(o.Duration_Am || ""),
        durationEn: String(o.Duration_En || ""),
        levelAm: String(o.Level_Am || ""),
        levelEn: String(o.Level_En || ""),
        fee: Number(o.Fee || 0),
        youtubePlaylistId: String(o.YouTube_Playlist_ID || ""),
        gradient: String(o.Gradient || "from-slate-500 to-slate-700"),
        highlightsAm: hAm,
        highlightsEn: hEn,
        status: String(o.Status || "active").toLowerCase(),
      };
    });

    return NextResponse.json({ courses });
  } catch (e: any) {
    if (String(e.message).includes("not found")) {
      return NextResponse.json({ courses: [] });
    }
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// ✅ POST: Add new course
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = normalizeRole((session.user as any)?.role);
  if (role !== "owner" && role !== "manager") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    if (!body.titleEn?.trim() || !body.titleAm?.trim()) {
      return NextResponse.json({ error: "Titles required" }, { status: 400 });
    }

    let sheet;
    try {
      sheet = await getSheet(SHEET);
    } catch {
      const doc = await getDoc();
      sheet = await doc.addSheet({
        title: SHEET,
        headerValues: [
          "Course_ID", "Title_Am", "Title_En",
          "Description_Am", "Description_En", "Icon",
          "Duration_Am", "Duration_En", "Level_Am", "Level_En",
          "Fee", "YouTube_Playlist_ID", "Gradient",
          "Highlights_Am", "Highlights_En", "Updated_At", "Status",
        ],
      });
    }

    // Generate ID from title
    const id =
      body.courseId ||
      body.titleEn
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

    await sheet.addRow({
      Course_ID: id,
      Title_Am: body.titleAm,
      Title_En: body.titleEn,
      Description_Am: body.descriptionAm || "",
      Description_En: body.descriptionEn || "",
      Icon: body.icon || "📚",
      Duration_Am: body.durationAm || "",
      Duration_En: body.durationEn || "",
      Level_Am: body.levelAm || "",
      Level_En: body.levelEn || "",
      Fee: Number(body.fee) || 0,
      YouTube_Playlist_ID: body.youtubePlaylistId || "",
      Gradient: body.gradient || "from-slate-500 to-slate-700",
      Highlights_Am: JSON.stringify(body.highlightsAm || []),
      Highlights_En: JSON.stringify(body.highlightsEn || []),
      Updated_At: new Date().toISOString(),
      Status: "active",
    });

    return NextResponse.json({ ok: true, id });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// ✅ PUT: Update course
export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
