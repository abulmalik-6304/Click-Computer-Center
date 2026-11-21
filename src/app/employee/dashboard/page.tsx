// src/app/employee/dashboard/page.tsx
// ... (imports እና data logic እንዳሉ ይቆዩ)

export default async function EmployeeDashboardPage() {
  // ... (existing data logic — አትቀይር)

  return (
    <div className="min-h-screen bg-slate-50">
      <EmployeeSidebar
        user={{ name, email, role, photo }}
        permissions={{
          canRegisterSale: permissions.canRegisterSale,
          canRegisterIncome: permissions.canRegisterIncome,
          canRegisterInventory: permissions.canRegisterInventory,
          canViewAnnouncements: permissions.canViewAnnouncements,
          canCreateAnnouncements: permissions.canCreateAnnouncements,
        }}
      />

      {/* ✅ Main content — mobile top bar + desktop sidebar offsets */}
      <main className="lg:pl-64 pt-14 lg:pt-0">
        <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-4 sm:space-y-6">
          {/* ✅ Header — min-w-0 for truncation */}
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 truncate">
              👋 Welcome, {name}!
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              {new Date().toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>

          {/* Stats — responsive */}
          {permissions.canViewBasicStats && (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <StatCardEnhanced
                  label="Today"
                  count={todayCount}
                  total={todayTotal}
                  pct={todayPct}
                  icon="📅"
                  color="emerald"
                />
                <StatCardEnhanced
                  label="This Week"
                  count={weekCount}
                  total={weekTotal}
                  pct={weekPct}
                  icon="📊"
                  color="blue"
                />
                <StatCardEnhanced
                  label="This Month"
                  count={monthCount}
                  total={monthTotal}
                  pct={monthPct}
                  icon="📈"
                  color="purple"
                />
                <StatCardEnhanced
                  label="All Time"
                  count={allCount}
                  total={allTotal}
                  pct={100}
                  icon="🏆"
                  color="amber"
                />
              </div>

              {/* Progress bars */}
              <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5">
                <h2 className="font-bold text-slate-900 mb-3 text-sm sm:text-base">
                  📊 Your Progress (Last 30 Days)
                </h2>
                <div className="space-y-3">
                  <ProgressBar
                    label={`Today (${todayCount} sales)`}
                    pct={todayPct}
                    color="emerald"
                  />
                  <ProgressBar
                    label={`This Week (${weekCount} sales)`}
                    pct={weekPct}
                    color="blue"
                  />
                  <ProgressBar
                    label={`This Month (${monthCount} sales)`}
                    pct={monthPct}
                    color="purple"
                  />
                </div>
              </div>
            </>
          )}

          {/* Quick Actions — responsive grid */}
          {(permissions.canRegisterSale ||
            permissions.canRegisterIncome ||
            permissions.canRegisterInventory) && (
            <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5">
              <h2 className="font-bold text-slate-900 mb-3 text-sm sm:text-base">
                ⚡ Quick Actions
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
                {permissions.canRegisterSale && (
                  <Link
                    href="/employee/sale/new"
                    className="p-3 sm:p-4 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-center transition"
                  >
                    <div className="text-2xl sm:text-3xl mb-1 sm:mb-2">🛒</div>
                    <p className="font-semibold text-emerald-700 text-sm">
                      New Sale
                    </p>
                  </Link>
                )}
                {permissions.canRegisterIncome && (
                  <Link
                    href="/employee/income/new"
                    className="p-3 sm:p-4 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 text-center transition"
                  >
                    <div className="text-2xl sm:text-3xl mb-1 sm:mb-2">💰</div>
                    <p className="font-semibold text-blue-700 text-sm">
                      New Income
                    </p>
                  </Link>
                )}
                {permissions.canRegisterInventory && (
                  <Link
                    href="/employee/inventory/new"
                    className="p-3 sm:p-4 rounded-xl bg-purple-50 hover:bg-purple-100 border border-purple-200 text-center transition"
                  >
                    <div className="text-2xl sm:text-3xl mb-1 sm:mb-2">📦</div>
                    <p className="font-semibold text-purple-700 text-sm">
                      New Inventory
                    </p>
                  </Link>
                )}
              </div>
            </div>
          )}

          {/* Announcements */}
          {permissions.canViewAnnouncements && announcements.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5">
              <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                <h2 className="font-bold text-slate-900 text-sm sm:text-base">
                  📢 Announcements
                  {unreadCount > 0 && (
                    <span className="ml-2 px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
                      {unreadCount} new
                    </span>
                  )}
                </h2>
                <Link
                  href="/employee/announcements"
                  className="text-xs text-emerald-600 hover:underline whitespace-nowrap"
                >
                  View all →
                </Link>
              </div>
              <div className="space-y-2">
                {announcements.slice(0, 3).map((a) => (
                  <div
                    key={a.id}
                    className={`p-3 rounded-lg border ${
                      a.isRead
                        ? "bg-slate-50 border-slate-200"
                        : "bg-blue-50 border-blue-300"
                    }`}
                  >
                    <p className="text-sm font-semibold text-slate-900">
                      {!a.isRead && "🆕 "}
                      {a.priority === "high" && "🔴 "}
                      {a.priority === "urgent" && "🚨 "}
                      {a.title}
                    </p>
                    <p className="text-xs text-slate-600 mt-1 line-clamp-2">
                      {a.message}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Sales */}
          {recentSales.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5">
              <h2 className="font-bold text-slate-900 mb-3 text-sm sm:text-base">
                🧾 Recent Sales
              </h2>
              <div className="space-y-2">
                {recentSales.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between p-2 border-b border-slate-100 text-sm gap-2"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-slate-900 truncate">
                        Sale #{s.id.slice(-6)}
                      </p>
                      <p className="text-xs text-slate-500 truncate">
                        {new Date(s.date).toLocaleString()}
                      </p>
                    </div>
                    <p className="font-bold text-emerald-600 whitespace-nowrap ml-2 flex-shrink-0">
                      {s.total.toLocaleString()} ETB
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// StatCardEnhanced — ሞባይል ላይ ትንሽ
// ═══════════════════════════════════════════════════════════════
function StatCardEnhanced({
  label,
  count,
  total,
  pct,
  icon,
  color,
}: {
  label: string;
  count: number;
  total: number;
  pct: number;
  icon: string;
  color: string;
}) {
  const cls =
    {
      emerald: {
        card: "bg-emerald-50 border-emerald-200",
        text: "text-emerald-700",
        bar: "bg-emerald-500",
      },
      blue: {
        card: "bg-blue-50 border-blue-200",
        text: "text-blue-700",
        bar: "bg-blue-500",
      },
      purple: {
        card: "bg-purple-50 border-purple-200",
        text: "text-purple-700",
        bar: "bg-purple-500",
      },
      amber: {
        card: "bg-amber-50 border-amber-200",
        text: "text-amber-700",
        bar: "bg-amber-500",
      },
    }[color] ?? {
      card: "bg-slate-50 border-slate-200",
      text: "text-slate-700",
      bar: "bg-slate-500",
    };

  return (
    <div className={`p-3 sm:p-4 rounded-2xl border ${cls.card}`}>
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium opacity-75 truncate">{label}</p>
        <span className="text-base sm:text-lg">{icon}</span>
      </div>
      <p className={`text-xl sm:text-2xl font-bold mt-1 ${cls.text}`}>{count}</p>
      <p className="text-xs text-slate-500 mt-0.5 truncate">
        {total.toLocaleString()} ETB
      </p>
      <div className="mt-2 h-1.5 bg-white/50 rounded-full overflow-hidden">
        <div
          className={`h-full ${cls.bar}`}
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
      <p className="text-[10px] text-slate-500 mt-1">{pct.toFixed(0)}%</p>
    </div>
  );
}

function ProgressBar({
  label,
  pct,
  color,
}: {
  label: string;
  pct: number;
  color: string;
}) {
  const barCls =
    {
      emerald: "bg-emerald-500",
      blue: "bg-blue-500",
      purple: "bg-purple-500",
    }[color] ?? "bg-slate-500";

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <p className="text-xs font-medium text-slate-700">{label}</p>
        <p className="text-xs font-bold text-slate-900">{pct.toFixed(1)}%</p>
      </div>
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`h-full ${barCls} transition-all`}
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
    </div>
  );
}
