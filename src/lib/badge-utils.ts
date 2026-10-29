// src/lib/badge-utils.ts
// ═══════════════════════════════════════════════════════════════
// 🏅 BADGE LIBRARY — shared definitions (client + server safe)
// ═══════════════════════════════════════════════════════════════

export interface BadgeDefinition {
  id: string;
  emoji: string;
  label: string;
  description: string;
  color: string;      // tailwind bg for chip
  textColor: string;  // tailwind text color
}

export const BADGES: BadgeDefinition[] = [
  {
    id: "top-seller",
    emoji: "🏆",
    label: "Top Seller",
    description: "Highest sales in the period",
    color: "bg-amber-100",
    textColor: "text-amber-800",
  },
  {
    id: "fastest",
    emoji: "🚀",
    label: "Fastest Service",
    description: "Fastest average transaction time",
    color: "bg-blue-100",
    textColor: "text-blue-800",
  },
  {
    id: "perfect",
    emoji: "⭐",
    label: "Zero Errors",
    description: "No mistakes in transactions",
    color: "bg-yellow-100",
    textColor: "text-yellow-800",
  },
  {
    id: "customer-hero",
    emoji: "❤️",
    label: "Customer Hero",
    description: "Outstanding customer feedback",
    color: "bg-pink-100",
    textColor: "text-pink-800",
  },
  {
    id: "team-player",
    emoji: "🤝",
    label: "Team Player",
    description: "Consistently helps other staff",
    color: "bg-emerald-100",
    textColor: "text-emerald-800",
  },
  {
    id: "innovator",
    emoji: "💡",
    label: "Innovator",
    description: "Brings new ideas to the team",
    color: "bg-purple-100",
    textColor: "text-purple-800",
  },
];

export const BADGE_MAP: Record<string, BadgeDefinition> = Object.fromEntries(
  BADGES.map((b) => [b.id, b])
);

export interface AwardedBadge {
  badgeId: string;
  staffId: string;
  staffName: string;
  note: string;
  assignedBy: string;
  assignedAt: string;
}

export function groupBadgesByStaff(
  rows: AwardedBadge[]
): Record<string, AwardedBadge[]> {
  const map: Record<string, AwardedBadge[]> = {};
  for (const r of rows) {
    if (!map[r.staffId]) map[r.staffId] = [];
    map[r.staffId].push(r);
  }
  // Sort each list newest first
  for (const k of Object.keys(map)) {
    map[k].sort(
      (a, b) => new Date(b.assignedAt).getTime() - new Date(a.assignedAt).getTime()
    );
  }
  return map;
}

export function countBadgeTypes(
  rows: AwardedBadge[]
): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const r of rows) {
    counts[r.badgeId] = (counts[r.badgeId] || 0) + 1;
  }
  return counts;
}
