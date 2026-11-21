// src/app/admin/documents/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getSheet } from "@/lib/google-sheets";
import { normalizeRole } from "@/lib/roles";
import DocumentsClient from "./DocumentsClient";

export const revalidate = 0;
export const dynamic = "force-dynamic";

const SHEET = "Documents_TBL";

export default async function DocumentsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const role = normalizeRole((session.user as any)?.role);
  if (role !== "owner" && role !== "manager") {
    return (
      <div className="p-10 text-center">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-8 max-w-md mx-auto">
          <p className="text-4xl mb-3">🚫</p>
          <h1 className="text-xl font-bold text-red-900 mb-2">
            Access Denied
          </h1>
          <p className="text-sm text-red-700">
            Only owner and manager can access documents.
          </p>
        </div>
      </div>
    );
  }

  let documents: any[] = [];
  try {
    const sheet = await getSheet(SHEET);
    const rows = await sheet.getRows();
    documents = rows
      .map((r) => {
        const o = r.toObject() as any;
        return {
          id: String(o.Document_ID || ""),
          title: String(o.Title || ""),
          category: String(o.Category || ""),
          description: String(o.Description || ""),
          fileUrl: String(o.File_URL || ""),
          fileKey: String(o.File_Key || ""),
          fileType: String(o.File_Type || ""),
          fileSize: Number(o.File_Size || 0),
          issueDate: String(o.Issue_Date || ""),
          expiryDate: String(o.Expiry_Date || ""),
          uploadedBy: String(o.Uploaded_By || ""),
          uploadedAt: String(o.Uploaded_At || ""),
          tags: String(o.Tags || ""),
          status: String(o.Status || "active").toLowerCase(),
        };
      })
      .filter((d) => d.status === "active")
      .sort(
        (a, b) =>
          new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
      );
  } catch {
    documents = [];
  }

  return (
    <DocumentsClient
      initialDocuments={documents}
      userRole={role}
      userEmail={String(session.user?.email || "")}
    />
  );
}
