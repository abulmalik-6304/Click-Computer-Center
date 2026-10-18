export default function InventoryPage() {
  return (
    <div className="p-6 lg:p-10">
      <h1 className="text-2xl font-bold text-slate-900">Inventory</h1>
      <p className="text-sm text-slate-500 mt-1">Stock list (synced from Google Sheets).</p>
      <div className="mt-8 bg-white rounded-2xl border border-slate-200 p-6 text-slate-500">
        Connect your Inventory sheet to see items here.
      </div>
    </div>
  );
}
