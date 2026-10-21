import { getSheet, SHEETS } from "@/lib/google-sheets";
import { mapInventoryRow, InventoryItem } from "@/lib/data-mappers";
import InventoryClient from "./InventoryClient";

export const revalidate = 0;

export default async function InventoryPage() {
  let items: InventoryItem[] = [];
  try {
    const sheet = await getSheet(SHEETS.INVENTORY);
    const rows = await sheet.getRows();
    items = rows
      .map((r) => mapInventoryRow(r.toObject()))
      .filter((i) => i.status !== "Archived");
  } catch (e) {
    console.error("Inventory load error:", e);
  }

  return <InventoryClient initialItems={items} />;
}
