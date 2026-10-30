// src/lib/public-data.ts
// ═══════════════════════════════════════════════════════════════
// 🌐 PUBLIC DATA HELPERS — read-only, no auth required
// ═══════════════════════════════════════════════════════════════

import { getSheet, SHEETS } from "./google-sheets";

export interface PublicProduct {
  id: string;
  name: string;
  code: string;
  category: string;
  image: string;
  sellingPrice: number;
  stock: number;
  unitType: string;
  inStock: boolean;
}

export async function getPublicProducts(): Promise<PublicProduct[]> {
  try {
    const sheet = await getSheet(SHEETS.INVENTORY);
    const rows = await sheet.getRows();
    return rows
      .map((r) => {
        const obj = r.toObject() as any;
        const stock = Number(obj.Stock_Quantity ?? 0);
        return {
          id: String(obj.Item_ID || ""),
          name: String(obj.Item_Name || ""),
          code: String(obj.Item_Code || ""),
          category: String(obj.Category || obj.Unit_Type || "General"),
          image: String(obj.Item_Image || ""),
          sellingPrice: Number(obj.Selling_Price ?? 0),
          stock,
          unitType: String(obj.Unit_Type || "pcs"),
          inStock: stock > 0,
        };
      })
      .filter((p) => p.name && p.sellingPrice > 0)
      .sort((a, b) => a.name.localeCompare(b.name));
  } catch {
    return [];
  }
}

export const TRAINING_COURSES = [
  {
    id: "web-dev",
    title: "Full-Stack Web Development",
    description: "HTML, CSS, JavaScript, React, Node.js, MongoDB. Build real projects.",
    duration: "12 weeks",
    fee: 8500,
    level: "Beginner → Advanced",
    icon: "💻",
    highlights: ["Real projects", "Portfolio ready", "Job assistance"],
  },
  {
    id: "ccna",
    title: "Networking (CCNA Prep)",
    description: "Routing, switching, network security. Cisco certified path.",
    duration: "10 weeks",
    fee: 7000,
    level: "Intermediate",
    icon: "🌐",
    highlights: ["Cisco labs", "Certification prep", "Hands-on"],
  },
  {
    id: "office",
    title: "MS Office & Digital Literacy",
    description: "Word, Excel, PowerPoint, internet skills for the workplace.",
    duration: "6 weeks",
    fee: 3500,
    level: "Beginner",
    icon: "📊",
    highlights: ["Office 365", "Data skills", "Certificate"],
  },
  {
    id: "graphic",
    title: "Graphic Design Essentials",
    description: "Photoshop, Illustrator, branding, social media design.",
    duration: "8 weeks",
    fee: 6000,
    level: "Beginner → Intermediate",
    icon: "🎨",
    highlights: ["Adobe CC", "Portfolio", "Freelance ready"],
  },
  {
    id: "mobile",
    title: "Mobile App Development",
    description: "React Native, Flutter. Build iOS & Android apps from scratch.",
    duration: "10 weeks",
    fee: 7500,
    level: "Intermediate",
    icon: "📱",
    highlights: ["iOS + Android", "App store ready", "Real projects"],
  },
  {
    id: "data",
    title: "Data Analysis & Excel",
    description: "Advanced Excel, SQL, Power BI. Turn data into insights.",
    duration: "8 weeks",
    fee: 6500,
    level: "Beginner → Intermediate",
    icon: "📈",
    highlights: ["Power BI", "SQL", "Real datasets"],
  },
];

export const SERVICES = [
  {
    id: "hardware",
    title: "Hardware Repair",
    description: "Motherboard, RAM, storage, GPU, power supply issues.",
    icon: "🔧",
    features: ["Free diagnostics", "Same-day repair", "90-day warranty"],
    startingPrice: 500,
  },
  {
    id: "software",
    title: "Software & OS",
    description: "Windows/Linux install, virus removal, driver updates.",
    icon: "💿",
    features: ["OS reinstall", "Virus removal", "Data backup"],
    startingPrice: 400,
  },
  {
    id: "data",
    title: "Data Recovery",
    description: "Dead drives, deleted files, corrupted partitions.",
    icon: "💾",
    features: ["Dead drive rescue", "Partition repair", "100% confidential"],
    startingPrice: 1500,
  },
  {
    id: "network",
    title: "Network Setup",
    description: "Office/home Wi-Fi, router config, cabling.",
    icon: "📡",
    features: ["Router setup", "Cabling", "Security"],
    startingPrice: 1000,
  },
  {
    id: "laptop",
    title: "Laptop Screen Repair",
    description: "Cracked screens, hinges, keyboard replacement.",
    icon: "💻",
    features: ["Original parts", "Fast turnaround", "Warranty"],
    startingPrice: 2000,
  },
  {
    id: "maintenance",
    title: "Annual Maintenance",
    description: "Monthly checkups, cleaning, preventive service.",
    icon: "🛠",
    features: ["Monthly checkups", "Cleaning", "Priority support"],
    startingPrice: 5000,
  },
];
