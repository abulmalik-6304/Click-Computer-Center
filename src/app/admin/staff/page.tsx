"use client";
import { useEffect, useState } from "react";
import { formatDriveUrl } from "@/lib/drive-url";

interface StaffMember {
  id: string;
  fullName: string;
  email: string;
  role: string;
  avatarUrl?: string;
}

interface Badge {
  id: string;
  staffId: string;
  badgeName: string;
  issuedDate: string;
  description: string;
}

export default function StaffPage() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStaff, setSelectedStaff] = useState<string>("");
  const [badgeName, setBadgeName] = useState("");
  const [description, setDescription] = useState("");
  const [issuing, setIssuing] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/sheets?name=Staff").then((r) => r.json()),
      fetch("/api/sheets?name=Badges").then((r) => r.json()),
    ])
      .then(([staffData, badgeData]) => {
        const rawStaff = Array.isArray(staffData) ? staffData : [];
        const rawBadges = Array.isArray(badgeData) ? badgeData : [];

        const formattedStaff: StaffMember[] = rawStaff.map((s: any, idx: number) => ({
          id: String(s.id || s.ID || s.email || idx + 1),
          fullName: String(s.fullName || s.Full_Name || s.name || s.email || "Staff Member"),
          email: String(s.email || s.Email || ""),
          role: String(s.role || s.Role || "staff"),
          avatarUrl: s.avatarUrl || s.Avatar_Url || s.Profile_Image || "",
        }));

        const formattedBadges: Badge[] = rawBadges.map((b: any, idx: number) => ({
          id: String(b.id || b.ID || idx + 1),
          staffId: String(b.staffId || b.Staff_ID || b.email || ""),
          badgeName: String(b.badgeName || b.Badge_Name || "Achievement Badge"),
          issuedDate: String(b.issuedDate || b.Date || new Date().toISOString().slice(0, 10)),
          description: String(b.description || b.Description || ""),
        }));

        setStaff(formattedStaff);
        setBadges(formattedBadges);
        setLoading(false);
      })
      .catch(() => {
        setStaff([]);
        setBadges([]);
        setLoading(false);
      });
  }, []);

  const handleIssueBadge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStaff || !badgeName) return;

    setIssuing(true);
    try {
      const res = await fetch("/api/badges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          staffId: selectedStaff,
          badgeName,
          description,
          issuedDate: new Date().toISOString().slice(0, 10),
        }),
      });

      if (res.ok) {
        alert("Badge successfully issued!");
        setBadgeName("");
        setDescription("");
        // Refresh badges list
        const refreshedBadges = await fetch("/api/sheets?name=Badges").then((r) => r.json());
        if (Array.isArray(refreshedBadges)) {
          setBadges(
            refreshedBadges.map((b: any, idx: number) => ({
              id: String(b.id || idx + 1),
              staffId: String(b.staffId || b.Staff_ID || ""),
              badgeName: String(b.badgeName || b.Badge_Name || ""),
              issuedDate: String(b.issuedDate || b.Date || ""),
              description: String(b.description || b.Description || ""),
            }))
          );
        }
      } else {
        alert("Failed to issue badge.");
      }
    } catch (err) {
      console.error(err);
      alert("An error occurred while issuing badge.");
    } finally {
      setIssuing(false);
    }
  };

  return (
    <div className="p-6 lg:p-10 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Staff & Achievement Badges</h1>
        <p className="text-sm text-slate-500 mt-1">Manage Click Computer Center staff profiles and assign badges</p>
      </div>

      {/* Assign Badge Form */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <h2 className="text-lg font-semibold text-slate-900">🏅 Issue New Achievement Badge</h2>
        <form onSubmit={handleIssueBadge} className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <select
            value={selectedStaff}
            onChange={(e) => setSelectedStaff(e.target.value)}
            required
            className="rounded-lg border border-slate-300 px-3 py-2 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
          >
            <option value="">Select Staff Member</option>
            {staff.map((s) => (
              <option key={s.id} value={s.id}>
                {s.fullName} ({s.role})
              </option>
            ))}
          </select>

          <input
            placeholder="Badge Name (e.g. Employee of the Month)"
            value={badgeName}
            onChange={(e) => setBadgeName(e.target.value)}
            required
            className="rounded-lg border border-slate-300 px-3 py-2 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
          />

          <input
            placeholder="Description / Reason"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
          />

          <button
            type="submit"
            disabled={issuing}
            className="bg-slate-900 text-white hover:bg-slate-800 rounded-lg text-sm font-medium transition py-2 px-4 flex items-center justify-center disabled:opacity-50"
          >
            {issuing ? "Assigning..." : "Assign Badge"}
          </button>
        </form>
      </div>

      {/* Staff List */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <p className="text-slate-500 col-span-full">Loading staff members...</p>
        ) : staff.length === 0 ? (
          <p className="text-slate-500 col-span-full">No staff records found in Google Sheets.</p>
        ) : (
          staff.map((member) => {
            const memberBadges = badges.filter((b) => b.staffId === member.id || b.staffId === member.email);
            return (
              <div key={member.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center gap-4">
                  {member.avatarUrl ? (
                    <img
                      src={formatDriveUrl(member.avatarUrl)}
                      alt={member.fullName}
                      className="w-14 h-14 rounded-full object-cover border border-slate-200"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center text-xl font-bold text-slate-700">
                      {member.fullName.charAt(0)}
                    </div>
                  )}
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">{member.fullName}</h3>
                    <p className="text-xs text-slate-500">{member.email}</p>
                    <span className="inline-block mt-1 text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-medium capitalize">
                      Role: {member.role}
                    </span>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-3">
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Earned Badges ({memberBadges.length})
                  </h4>
                  {memberBadges.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">No badges assigned yet.</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {memberBadges.map((b) => (
                        <span
                          key={b.id}
                          title={`${b.description} (${b.issuedDate})`}
                          className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-900 border border-amber-200 rounded-lg text-xs font-semibold"
                        >
                          🎖️ {b.badgeName}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
