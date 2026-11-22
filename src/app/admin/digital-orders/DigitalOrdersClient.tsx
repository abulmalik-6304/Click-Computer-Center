// src/app/admin/digital-orders/DigitalOrdersClient.tsx
"use client";

import { useMemo, useState } from "react";
import OrderDetailModal from "@/components/admin/digital-orders/OrderDetailModal";

export default function DigitalOrdersClient({
  initialOrders,
  userRole,
}: {
  initialOrders: any[];
  userRole: string;
}) {
  const [orders, setOrders] = useState(initialOrders);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "pending" | "approved" | "rejected"
  >("all");
  const [detail, setDetail] = useState<any>(null);
  const [loading, setLoading] = useState<string | null>(null);

  async function refresh() {
    try {
      const res = await fetch("/api/admin/digital-orders", {
        cache: "no-store",
      });
      const data = await res.json();
      if (Array.isArray(data.orders)) setOrders(data.orders);
    } catch (e) {
      console.error(e);
    }
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return orders.filter((o) => {
      const matchQ =
        !q ||
        o.customerName.toLowerCase().includes(q) ||
        o.customerPhone.toLowerCase().includes(q) ||
        o.productTitle.toLowerCase().includes(q) ||
        o.id.toLowerCase().includes(q);
      const matchStatus = statusFilter === "all" || o.status === statusFilter;
      return matchQ && matchStatus;
    });
  }, [orders, search, statusFilter]);

  const stats = useMemo(() => {
    return {
      total: orders.length,
      pending: orders.filter((o) => o.status === "pending").length,
      approved: orders.filter((o) => o.status === "approved").length,
      rejected: orders.filter((o) => o.status === "rejected").length,
      revenue: orders
        .filter((o) => o.status === "approved")
        .reduce((s, o) => s + o.price, 0),
    };
  }, [orders]);

  async function quickAction(orderId: string, action: "approve" | "reject") {
    if (!confirm(`${action === "approve" ? "Approve" : "Reject"} this order?`))
      return;

    setLoading(orderId);
    try {
      const res = await fetch(
        `/api/admin/digital-orders/${orderId}/approve`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action }),
        }
      );
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Failed");
        return;
      }
      await refresh();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setLoading(null);
    }
  }

  async function handleDelete(orderId: string) {
    if (!confirm(`PERMANENTLY delete order ${orderId}?`)) return;
    try {
      const res = await fetch("/api/admin/digital-orders", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: orderId }),
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Delete failed");
        return;
      }
      await refresh();
    } catch (e: any) {
      alert(e.message);
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-10 space-y-4 sm:space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
          🛒 Digital Orders
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          {stats.total} orders · {stats.pending} pending · {stats.revenue.toLocaleString()} ETB revenue
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Total" value={stats.total} color="slate" />
        <StatCard label="Pending" value={stats.pending} color="orange" />
        <StatCard label="Approved" value={stats.approved} color="emerald" />
        <StatCard
          label="Revenue"
          value={`${stats.revenue.toLocaleString()} ETB`}
          color="emerald"
        />
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="🔍 Search by customer, phone, product, order ID…"
          className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm"
        />
        <div className="flex flex-wrap gap-2">
          {(
            [
              { key: "all", label: "All" },
              { key: "pending", label: "⏳ Pending" },
              { key: "approved", label: "✅ Approved" },
              { key: "rejected", label: "❌ Rejected" },
            ] as const
          ).map((f) => (
            <button
              key={f.key}
              onClick={() => setStatusFilter(f.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                statusFilter === f.key
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-700"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-700">
              <tr>
                <th className="text-left px-3 py-3 font-semibold">Order</th>
                <th className="text-left px-3 py-3 font-semibold hidden md:table-cell">
                  Product
                </th>
                <th className="text-left px-3 py-3 font-semibold">Customer</th>
                <th className="text-right px-3 py-3 font-semibold">Amount</th>
                <th className="text-left px-3 py-3 font-semibold hidden sm:table-cell">
                  Status
                </th>
                <th className="text-right px-3 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-slate-500">
                    No orders found
                  </td>
                </tr>
              ) : (
                filtered.map((o) => (
                  <tr
                    key={o.id}
                    className="border-t border-slate-100 hover:bg-slate-50"
                  >
                    <td className="px-3 py-3">
                      <button
                        onClick={() => setDetail(o)}
                        className="text-left hover:underline"
                      >
                        <p className="font-medium text-slate-900">{o.id}</p>
                        <p className="text-xs text-slate-500">
                          {new Date(o.createdAt).toLocaleDateString()}
                        </p>
                      </button>
                    </td>
                    <td className="px-3 py-3 text-slate-700 hidden md:table-cell">
                      <p className="line-clamp-1">{o.productTitle}</p>
                    </td>
                    <td className="px-3 py-3">
                      <p className="text-slate-900">{o.customerName}</p>
                      <p className="text-xs text-slate-500">{o.customerPhone}</p>
                    </td>
                    <td className="px-3 py-3 text-right font-bold text-emerald-600">
                      {o.price.toLocaleString()} ETB
                    </td>
                    <td className="px-3 py-3 hidden sm:table-cell">
                      <StatusBadge status={o.status} />
                    </td>
                    <td className="px-3 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => setDetail(o)}
                          className="px-2 py-1 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 rounded"
                          title="View details"
                        >
                          👁
                        </button>
                        {o.status === "pending" && (
                          <>
                            <button
                              onClick={() => quickAction(o.id, "approve")}
                              disabled={loading === o.id}
                              className="px-2 py-1 text-xs bg-emerald-100 hover:bg-emerald-200 text-emerald-700 rounded disabled:opacity-50"
                              title="Approve"
                            >
                              {loading === o.id ? "⏳" : "✅"}
                            </button>
                            <button
                              onClick={() => quickAction(o.id, "reject")}
                              disabled={loading === o.id}
                              className="px-2 py-1 text-xs bg-red-100 hover:bg-red-200 text-red-700 rounded disabled:opacity-50"
                              title="Reject"
                            >
                              ❌
                            </button>
                          </>
                        )}
                        {userRole === "owner" && (
                          <button
                            onClick={() => handleDelete(o.id)}
                            className="px-2 py-1 text-xs bg-red-100 hover:bg-red-200 text-red-700 rounded"
                            title="Delete permanently"
                          >
                            🗑
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {detail && (
        <OrderDetailModal
          order={detail}
          userRole={userRole}
          onClose={() => setDetail(null)}
          onUpdated={() => {
            setDetail(null);
            refresh();
          }}
        />
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map = {
    pending: "bg-orange-100 text-orange-700",
    approved: "bg-emerald-100 text-emerald-700",
    rejected: "bg-red-100 text-red-700",
  } as const;
  const icons = { pending: "⏳", approved: "✅", rejected: "❌" } as const;
  const cls = map[status as keyof typeof map] || "bg-slate-100 text-slate-700";
  const icon = icons[status as keyof typeof icons] || "•";

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${cls} capitalize`}
    >
      {icon} {status}
    </span>
  );
}

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: any;
  color: string;
}) {
  const cls = {
    slate: "text-slate-700 bg-slate-50 border-slate-200",
    orange: "text-orange-700 bg-orange-50 border-orange-200",
    emerald: "text-emerald-700 bg-emerald-50 border-emerald-200",
  }[color] ?? "text-slate-700 bg-slate-50 border-slate-200";
  return (
    <div className={`${cls} p-4 rounded-2xl border`}>
      <p className="text-xs font-medium opacity-75">{label}</p>
      <p className="mt-1 text-xl font-bold">{value}</p>
    </div>
  );
}
