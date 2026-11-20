// src/app/admin/inventory/error.tsx
"use client";

import { useEffect } from "react";

export default function InventoryError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Inventory error:", error);
  }, [error]);

  return (
    <div className="p-8 max-w-lg mx-auto text-center space-y-4">
      <div className="text-6xl">⚠️</div>
      <h1 className="text-2xl font-bold text-slate-900">
        Something went wrong
      </h1>
      <p className="text-slate-600">
        The inventory page couldn't load. This may be a temporary network issue.
      </p>
      <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-left">
        <p className="text-xs text-red-700 font-mono break-all">
          {error.message || "Unknown error"}
        </p>
      </div>
      <button
        onClick={reset}
        className="px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg"
      >
        🔄 Try Again
      </button>
    </div>
  );
}
