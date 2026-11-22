// src/app/admin/digital-products/DigitalProductsClient.tsx
"use client";

import { useState } from "react";
import { formatFileSize, getDigitalCategoryLabel, getDigitalCategoryIcon } from "@/lib/digital-product-types";
import DigitalProductForm from "@/components/admin/digital-products/DigitalProductForm";

export default function DigitalProductsClient({ initialProducts }: { initialProducts: any[] }) {
  const [products, setProducts] = useState(initialProducts);
  const [showForm, setShowForm] = useState(false);
  const [editProduct, setEditProduct] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function refresh() {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/admin/digital-products", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to load products");
      setProducts(Array.isArray(data) ? data : data.products ?? []);
    } catch (err: any) {
      setError(err?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this product? This action cannot be undone.")) {
      return;
    }
    try {
      setDeletingId(id);
      setError(null);
      const res = await fetch(`/api/admin/digital-products/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || "Failed to delete product");
      }
      setProducts((prev) => prev.filter((p) => p.id !== id));
    } catch (err: any) {
      setError(err?.message || "Delete failed");
    } finally {
      setDeletingId(null);
    }
  }

  async function handleToggleActive(product: any) {
    const nextActive = !product.isActive;
    try {
      setError(null);
      // Optimistic update
      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? { ...p, isActive: nextActive } : p))
      );

      const res = await fetch(`/api/admin/digital-products/${product.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: nextActive }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || "Failed to update product");
      }
    } catch (err: any) {
      // Revert on failure
      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? { ...p, isActive: product.isActive } : p))
      );
      setError(err?.message || "Update failed");
    }
  }

  function handleEdit(product: any) {
    setEditProduct(product);
    setShowForm(true);
  }

  function handleCreateNew() {
    setEditProduct(null);
    setShowForm(true);
  }

  function handleFormClose() {
    setShowForm(false);
    setEditProduct(null);
  }

  function handleFormSuccess() {
    handleFormClose();
    refresh();
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Digital Products</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage your downloadable digital products ({products.length})
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={refresh}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            {loading ? "Refreshing..." : "Refresh"}
          </button>
          <button
            onClick={handleCreateNew}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            + New Product
          </button>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between">
          <span>{error}</span>
          <button
            onClick={() => setError(null)}
            className="text-red-500 hover:text-red-700 font-bold"
          >
            ×
          </button>
        </div>
      )}

      {/* Products list */}
      {products.length === 0 ? (
        <div className="text-center py-16 bg-white border border-gray-200 rounded-xl">
          <div className="text-5xl mb-4">📦</div>
          <h3 className="text-lg font-semibold text-gray-900">No digital products yet</h3>
          <p className="text-sm text-gray-500 mt-1 mb-4">
            Get started by creating your first digital product.
          </p>
          <button
            onClick={handleCreateNew}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            + Create Product
          </button>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  File
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Price
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {products.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {product.thumbnailUrl ? (
                        <img
                          src={product.thumbnailUrl}
                          alt={product.title}
                          className="w-10 h-10 rounded-lg object-cover bg-gray-100"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-lg">
                          {getDigitalCategoryIcon(product.category)}
                        </div>
                      )}
                      <div>
                        <div className="font-medium text-gray-900">{product.title}</div>
                        {product.description && (
                          <div className="text-xs text-gray-500 line-clamp-1 max-w-xs">
                            {product.description}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    <span className="inline-flex items-center gap-1">
                      <span>{getDigitalCategoryIcon(product.category)}</span>
                      {getDigitalCategoryLabel(product.category)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {product.fileName ? (
                      <div>
                        <div className="font-medium truncate max-w-[180px]" title={product.fileName}>
                          {product.fileName}
                        </div>
                        {product.fileSize ? (
                          <div className="text-xs text-gray-500">
                            {formatFileSize(product.fileSize)}
                          </div>
                        ) : null}
                      </div>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 font-medium">
                    {product.price != null
                      ? `${Number(product.price).toFixed(2)} ${product.currency || "ETB"}`
                      : "Free"}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleToggleActive(product)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full transition ${
                        product.isActive
                          ? "bg-green-100 text-green-700 hover:bg-green-200"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                      title="Click to toggle"
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          product.isActive ? "bg-green-500" : "bg-gray-400"
                        }`}
                      />
                      {product.isActive ? "Active" : "Inactive"}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleEdit(product)}
                        className="px-3 py-1 text-xs font-medium text-blue-700 bg-blue-50 rounded hover:bg-blue-100"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(product.id)}
                        disabled={deletingId === product.id}
                        className="px-3 py-1 text-xs font-medium text-red-700 bg-red-50 rounded hover:bg-red-100 disabled:opacity-50"
                      >
                        {deletingId === product.id ? "Deleting..." : "Delete"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Form modal */}
      {showForm && (
        <DigitalProductForm
          product={editProduct}
          onClose={handleFormClose}
          onSuccess={handleFormSuccess}
        />
      )}
    </div>
  );
}
