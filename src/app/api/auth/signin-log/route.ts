// src/app/api/auth/signin-log/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSheet, getDoc } from "@/lib/google-sheets";
import { normalizeRole } from "@/lib/roles";

const LOG_SHEET = "Signin_Log_TBL";

// ─── POST: Sign-in log ───
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, name, role, status } = body;

    if (!email) {
      return NextResponse.json({ error: "Email required" }, { status: 400 });
    }

    let sheet;
    try {
      sheet = await getSheet(LOG_SHEET);
    } catch {
      // Create sheet if not exists
      const doc = await getDoc();
      sheet = await doc.addSheet({
        title: LOG_SHEET,
        headerValues: [
          "Log_ID",
          "Date",
          "Email",
          "Name",
          "Role",
          "Status",
          "IP",
          "User_Agent",
        ],
      });
    }

    const rows = await sheet.getRows();
    const nextNum = rows.length + 1;

    await sheet.addRow({
      Log_ID: `LOG-${String(nextNum).padStart(5, "0")}`,
      Date: new Date().toISOString(),
      Email: email,
      Name: name || "",
      Role: normalizeRole(role),
      Status: status || "success",
      IP: req.headers.get("x-forwarded-for") || "",
      User_Agent: req.headers.get("user-agent")?.slice(0, 200) || "",
    });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("Signin log error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// ─── GET: Sign-in log list (owner/manager only) ───
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role = normalizeRole((session.user as any)?.role);
  if (role !== "owner" && role !== "manager") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const sheet = await getSheet(LOG_SHEET);
    const rows = await sheet.getRows();
    const logs = rows
      .map((r) => {
        const obj = r.toObject() as any;
        return {
          id: String(obj.Log_ID || ""),
          date: String(obj.Date || ""),
          email: String(obj.Email || ""),
          name: String(obj.Name || ""),
          role: String(obj.Role || ""),
          status: String(obj.Status || ""),
          ip: String(obj.IP || ""),
          userAgent: String(obj.User_Agent || ""),
        };
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 100);

    return NextResponse.json({ logs });
  } catch (e: any) {
    if (String(e.message).includes("not found")) {
      return NextResponse.json({ logs: [] });
    }
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
