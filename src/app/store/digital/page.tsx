// src/app/store/digital/page.tsx
import PublicNav from "@/components/public/PublicNav";
import PublicFooter from "@/components/public/PublicFooter";
import DigitalStoreClient from "./DigitalStoreClient";

export const revalidate = 60;

async function getProducts() {
  try {
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const res = await fetch(`${baseUrl}/api/public/digital-products?limit=100`, { next: { revalidate: 60 } });
    if (!res.ok) return { products: [], categories: [] };
    return await res.json();
  } catch {
    return { products: [], categories: [] };
  }
}

export default async function DigitalStorePage() {
  const data = await getProducts();
  return (
    <>
      <PublicNav />
      <DigitalStoreClient initialProducts={data.products || []} categories={data.categories || []} />
      <PublicFooter />
    </>
  );
}
