// src/components/admin/expenses/ExpenseFormModal.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import {
  EXPENSE_CATEGORIES,
  ExpenseRecord,
  ETHIOPIAN_MONTHS,
  normalizePaymentMonth,
  requiresEmployeeInfo,
  requiresPaymentMonth,
} from "@/lib/expense-types";

function fmt(n: any): string {
  const num = Number(n);
  return isNaN(num)
    ? "0"
    : num.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
}

function normalizeDate(input?: string | null): string {
  if (!input) return new Date().toISOString().slice(0, 10);
  try {
    if (/^\d{4}-\d{2}-\d{2}/.test(input)) return input.slice(0, 10);
    const d = new Date(input);
    if (!isNaN(d.getTime())) {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      return `${y}-${m}-${dd}`;
    }
  } catch {}
  return new Date().toISOString().slice(0, 10);
}

interface Employee {
  id: string;
  name: string;
  jobRole: string;
  salary: number;
  allowance: number;
  status: string;
}

interface Props {
  record?: ExpenseRecord | null;
  onClose: () => void;
  onSaved: () => void;
}

export default function ExpenseFormModal({ record, onClose, onSaved }: Props) {
  const isEdit = !!record;

  const [date, setDate] = useState(normalizeDate(record?.date));
  const [category, setCategory] = useState(
    record?.category || EXPENSE_CATEGORIES[0].value
  );
  const [amount, setAmount] = useState(Number(record?.amount) || 0);
  const [description, setDescription] = useState(record?.description || "");
  const [employeeName, setEmployeeName] = useState(record?.employeeName || "");
  const [jobRole, setJobRole] = useState(record?.jobRole || "");
  const [paymentMonth, setPaymentMonth] = useState(
    normalizePaymentMonth(record?.paymentMonth)
  );

  // 🆕 Employees from Employee_TBL
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [employeesLoading, setEmployeesLoading] = useState(false);
  const [employeeSearch, setEmployeeSearch] = useState("");
  const [showEmployeePicker, setShowEmployeePicker] = useState(false);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // ✅ Conditional visibility
  const showEmployeeInfo = requiresEmployeeInfo(category);
  const showPaymentMonth = requiresPaymentMonth(category);

  // ✅ Load employees (on mount + when category requires employee info)
  useEffect(() => {
    if (!showEmployeeInfo) return;
    async function load() {
      setEmployeesLoading(true);
      try {
        const res = await fetch("/api/employees/refresh", {
          cache: "no-store",
        });
        const data = await res.json();
        const list = data.employees || data.items || [];
        if (Array.isArray(list)) setEmployees(list);
      } catch (e) {
        console.error("Load employees failed:", e);
      } finally {
        setEmployeesLoading(false);
      }
    }
    load();
  }, [showEmployeeInfo]);

  // ✅ Filtered employees
  const filteredEmployees = useMemo(() => {
    const q = employeeSearch.trim().toLowerCase();
    if (!q) return employees;
    return employees.filter(
      (e) =>
        e.name.toLowerCase().includes(q) ||
        e.jobRole.toLowerCase().includes(q)
    );
  }, [employees, employeeSearch]);

  // ✅ Select employee → auto-fill jobRole + salary
  function selectEmployee(emp: Employee) {
    setEmployeeName(emp.name);
    setJobRole(emp.jobRole);
    // ✅ If salary category → auto-fill amount from salary
    if (category.toLowerCase() === "salary") {
      setAmount(Number(emp.salary) || 0);
    } else if (category.toLowerCase() === "allowance") {
      // Allowance → auto-fill allowance amount (if any), but user can override
      if (emp.allowance > 0) setAmount(Number(emp.allowance) || 0);
    }
    setShowEmployeePicker(false);
    setEmployeeSearch("");
  }

  // ✅ Validate: salary duplicate check
  async function validateSalaryDuplicate(): Promise<string | null> {
    if (category.toLowerCase() !== "salary") return null;
    if (!employeeName || !paymentMonth) return null;

    try {
      const res = await fetch("/api/expenses", { cache: "no-store" });
      const data = await res.json();
      const list: any[] = data.expenses || data.items || [];

      // ✅ Check same employee + same payment month + salary category
      //    Exclude current record if editing
      const duplicate = list.find((e) => {
        if (e.id === record?.id) return false; // skip self
        if (String(e.category || "").toLowerCase() !== "salary") return false;
        if (
          String(e.employeeName || "").trim().toLowerCase() !==
          employeeName.trim().toLowerCase()
        )
          return false;
        if (String(e.paymentMonth || "") !== paymentMonth) return false;
        return true;
      });

      if (duplicate) {
        return `⚠️ ${employeeName} — ${paymentMonth} ወር ደመወዝ አስቀድሞ ተመዝግቧል! (ID: ${duplicate.id})`;
      }
      return null;
    } catch (e) {
      console.error("Validation failed:", e);
      return null;
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    // Basic validation
    if (amount <= 0) {
      setError("Amount must be greater than 0");
      return;
    }
    if (showEmployeeInfo && !employeeName.trim()) {
      setError("Employee name is required for this category");
      return;
    }
    if (showPaymentMonth && !paymentMonth) {
      setError("Payment month is required for salary");
      return;
    }

    // ✅ Duplicate salary check
    if (category.toLowerCase() === "salary") {
      setSaving(true);
      const dupError = await validateSalaryDuplicate();
      setSaving(false);
      if (dupError) {
        setError(dupError);
        return;
      }
    }

    setSaving(true);
    try {
      const payload = {
        ...(isEdit ? { id: record!.id } : {}),
        date,
        category,
        amount,
        description,
        employeeName: showEmployeeInfo ? employeeName : "",
        jobRole: showEmployeeInfo ? jobRole : "",
        paymentMonth: showPaymentMonth ? paymentMonth : "",
      };

      const res = await fetch("/api/expenses", {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed");
        setSaving(false);
        return;
      }
      onSaved();
    } catch (e: any) {
      setError(e.message);
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-2 sm:p-4">
      <div className="bg-slate-50 rounded-2xl shadow-2xl w-full max-w-md max-h-[95vh] flex flex-col">
        {/* HEADER */}
        <div
          className={`text-white px-5 py-4 rounded-t-2xl flex-shrink-0 bg-gradient-to-r ${
            isEdit
              ? "from-blue-600 to-blue-700"
              : "from-red-600 to-red-700"
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold">
                {isEdit ? "✏️ Edit Expense" : "📉 Add Expense"}
              </h2>
              <p className="text-xs opacity-90 mt-0.5">
                {new Date(date).toLocaleDateString()}
                {isEdit && (
                  <span className="ml-2 opacity-75">
                    · ID: {record!.id.slice(0, 8)}
                  </span>
                )}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-white/80 hover:text-white text-xl p-1 rounded-lg hover:bg-white/10 transition"
            >
              ✕
            </button>
          </div>
        </div>

        {/* BODY */}
        <form
          onSubmit={submit}
          className="flex-1 overflow-y-auto p-4 space-y-3"
        >
          {/* Basic Info */}
          <section className="bg-white rounded-xl border border-slate-200 p-3 space-y-3">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wide">
              📅 Basic Info
            </h3>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Date *
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-red-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Category *
              </label>
              <select
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value);
                  setError("");
                  // ✅ Reset employee info if new category doesn't need it
                  if (!requiresEmployeeInfo(e.target.value)) {
                    setEmployeeName("");
                    setJobRole("");
                  }
                  if (!requiresPaymentMonth(e.target.value)) {
                    setPaymentMonth(normalizePaymentMonth());
                  }
                }}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-red-500"
              >
                {EXPENSE_CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.icon} {c.label}
                  </option>
                ))}
              </select>
            </div>
          </section>

          {/* 🆕 Employee Info — only for Salary / Allowance */}
          {showEmployeeInfo && (
            <section className="bg-white rounded-xl border border-slate-200 p-3 space-y-3">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                👥 Employee Info
              </h3>

              {/* Employee picker button */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Employee Name *
                </label>
                <button
                  type="button"
                  onClick={() => setShowEmployeePicker(true)}
                  className="w-full text-left rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white hover:bg-slate-50"
                >
                  {employeeName ? (
                    <span className="font-medium text-slate-900">
                      👤 {employeeName}
                    </span>
                  ) : (
                    <span className="text-slate-400">
                      🔍 Select employee…
                    </span>
                  )}
                </button>
              </div>

              {/* Job Role */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Job Role
                </label>
                <input
                  type="text"
                  value={jobRole}
                  onChange={(e) => setJobRole(e.target.value)}
                  placeholder="Auto-filled from employee"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 bg-slate-50"
                  readOnly
                />
              </div>
            </section>
          )}

          {/* 🆕 Payment Month — only for Salary */}
          {showPaymentMonth && (
            <section className="bg-white rounded-xl border border-slate-200 p-3 space-y-3">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                🗓 Payment Month
              </h3>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Month *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={paymentMonth.split("-")[0] || ""}
                    onChange={(e) => {
                      const year = e.target.value;
                      const [, m] = paymentMonth.split("-");
                      setPaymentMonth(
                        `${year}-${m || String(new Date().getMonth() + 1).padStart(2, "0")}`
                      );
                    }}
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
                  >
                    {Array.from({ length: 10 }, (_, i) => {
                      const year = new Date().getFullYear() - 2 + i;
                      return (
                        <option key={year} value={year}>
                          {year}
                        </option>
                      );
                    })}
                  </select>
                  <select
                    value={paymentMonth.split("-")[1] || ""}
                    onChange={(e) => {
                      const [, , ] = paymentMonth.split("-");
                      const [y] = paymentMonth.split("-");
                      setPaymentMonth(
                        `${y || new Date().getFullYear()}-${e.target.value}`
                      );
                    }}
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
                  >
                    {ETHIOPIAN_MONTHS.map((m) => (
                      <option key={m.value} value={m.value}>
                        {m.label} ({m.en})
                      </option>
                    ))}
                  </select>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  📅 Gregorian:{" "}
                  <span className="font-semibold">
                    {(() => {
                      try {
                        const [y, m] = paymentMonth.split("-");
                        if (!y || !m) return "—";
                        return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString(
                          "en-US",
                          { month: "long", year: "numeric" }
                        );
                      } catch {
                        return "—";
                      }
                    })()}
                  </span>
                </p>
              </div>
            </section>
          )}

          {/* Amount */}
          <section className="bg-white rounded-xl border border-slate-200 p-3 space-y-3">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wide">
              💵 Amount
            </h3>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Amount (ETB) *
                {category.toLowerCase() === "salary" && (
                  <span className="ml-2 text-xs text-emerald-600">
                    (auto-filled from employee salary)
                  </span>
                )}
                {category.toLowerCase() === "allowance" && (
                  <span className="ml-2 text-xs text-blue-600">
                    (editable — enter allowance amount)
                  </span>
                )}
              </label>
              <input
                type="number"
                min={0}
                step={0.01}
                value={amount || ""}
                onChange={(e) => setAmount(Number(e.target.value) || 0)}
                required
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-lg font-bold text-red-700 focus:ring-2 focus:ring-red-500"
                placeholder="0.00"
              />
            </div>

            {amount > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center justify-between">
                <span className="text-xs font-semibold text-red-800">
                  Total Expense
                </span>
                <span className="text-lg font-bold text-red-700">
                  − {fmt(amount)} ETB
                </span>
              </div>
            )}
          </section>

          {/* Description */}
          <section className="bg-white rounded-xl border border-slate-200 p-3">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">
              📝 Description
            </h3>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="Optional notes about this expense…"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-red-500"
            />
          </section>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-xs text-red-700">❌ {error}</p>
            </div>
          )}
        </form>

        {/* FOOTER */}
        <div className="bg-white border-t border-slate-200 p-3 rounded-b-2xl flex gap-2 flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-lg border border-slate-300 text-slate-700 font-medium text-sm"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={submit as any}
            disabled={saving}
            className={`flex-1 py-2.5 rounded-lg text-white font-semibold text-sm disabled:opacity-50 ${
              isEdit
                ? "bg-blue-600 hover:bg-blue-700"
                : "bg-red-600 hover:bg-red-700"
            }`}
          >
            {saving
              ? "Saving…"
              : isEdit
              ? `Update · ${fmt(amount)} ETB`
              : `Save · ${fmt(amount)} ETB`}
          </button>
        </div>
      </div>

      {/* ═══════ EMPLOYEE PICKER MODAL ═══════ */}
      {showEmployeePicker && (
        <div className="fixed inset-0 z-[60] bg-black/70 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-bold text-slate-900">
                👥 Select Employee
              </h3>
              <button
                type="button"
                onClick={() => {
                  setShowEmployeePicker(false);
                  setEmployeeSearch("");
                }}
                className="text-slate-400 hover:text-slate-900 text-xl"
              >
                ✕
              </button>
            </div>

            <div className="p-3 border-b border-slate-200">
              <input
                type="text"
                value={employeeSearch}
                onChange={(e) => setEmployeeSearch(e.target.value)}
                placeholder="🔍 Search by name or job role…"
                autoFocus
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>

            <div className="flex-1 overflow-y-auto p-2">
              {employeesLoading ? (
                <p className="p-6 text-center text-sm text-slate-500">
                  ⏳ Loading employees…
                </p>
              ) : filteredEmployees.length === 0 ? (
                <p className="p-6 text-center text-sm text-slate-500">
                  No employees found
                </p>
              ) : (
                filteredEmployees.map((emp) => (
                  <button
                    key={emp.id}
                    type="button"
                    onClick={() => selectEmployee(emp)}
                    className="w-full text-left p-3 hover:bg-slate-50 border-b border-slate-100 flex items-center gap-3"
                  >
                    <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold flex-shrink-0">
                      {emp.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">
                        {emp.name}
                      </p>
                      <p className="text-xs text-slate-500">
                        {emp.jobRole}
                      </p>
                    </div>
                    {emp.salary > 0 && (
                      <div className="text-right flex-shrink-0">
                        <p className="text-xs font-bold text-emerald-600">
                          {fmt(emp.salary)}
                        </p>
                        <p className="text-xs text-slate-500">ETB</p>
                      </div>
                    )}
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
