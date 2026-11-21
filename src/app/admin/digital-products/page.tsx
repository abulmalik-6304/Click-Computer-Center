// src/app/admin/digital-products/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getSheet } from "@/lib/google-sheets";
import { normalizeRole } from "@/lib/roles";
import DigitalProductsClient from "./DigitalProductsClient";

export const revalidate = 0;
export const dynamic = "force-dynamic";

const SHEET = "Digital_Products_TBL";

export default async function DigitalProductsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const role = normalizeRole((session.user as any)?.role);
  if (role !== "owner" && role !== "manager") {
    return (
      <div className="p-10 text-center">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-8 max-w-md mx-auto">
          <p className="text-4xl mb-3">🚫</p>
          <h1 className="text-xl font-bold text-red-900 mb-2">Access Denied</h1>
          <p className="text-sm text-red-700">Only owner/manager can manage digital products.</p>
        </div>
      </div>
    );
  }

  let products: any[] = [];
  try {
    const sheet = await getSheet(SHEET);
    const rows = await sheet.getRows();
    products = rows.map((r) => {
      const o = r.toObject() as any;
      return {
        id: String(o.Product_ID || ""),
        title: String(o.Title || ""),
        description: String(o.Description || ""),
        price: Number(o.Price || 0),
        category: String(o.Category || ""),
        thumbnailImage: String(o.Thumbnail_Image || ""),
        fileUrl: String(o.File_URL || ""),
        fileKey: String(o.File_Key || ""),
        fileSize: Number(o.File_Size || 0),
        fileType: String(o.File_Type || ""),
        showOnWeb: String(o.Show_On_Web || "").toUpperCase() === "TRUE",
        featured: String(o.Featured || "").toUpperCase() === "TRUE",
        downloadLimit: Number(o.Download_Limit || 0),
        createdBy: String(o.Created_By || ""),
        createdAt: String(o.Created_At || ""),
        status: String(o.Status || "active").toLowerCase(),
      };
    }).filter((p) => p.status === "active");
  } catch {}

  return <DigitalProductsClient initialProducts={products} />;
}
