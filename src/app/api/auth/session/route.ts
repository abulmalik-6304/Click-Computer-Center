// src/app/api/auth/session/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const revalidate = 0;
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(authOptions);

  return NextResponse.json({
    ok: true,
    session: session
      ? {
          user: {
            name: session.user?.name,
            email: session.user?.email,
            role: (session.user as any)?.role,
            roleType: typeof (session.user as any)?.role,
            image: session.user?.image,
          },
        }
      : null,
    timestamp: new Date().toISOString(),
  });
}
