// src/lib/public-constants.ts

// ═══════════════════════════════════════════════════════════════
// 🏢 BUSINESS INFO
// ═══════════════════════════════════════════════════════════════
export const BUSINESS_INFO = {
  name: "Click Computer Center",
  shortName: "Click CC",
  tagline: "Your trusted tech partner in Chagni",
  description:
    "Ethiopia's trusted tech partner for computers, training, and repairs. Located in Chagni, 01 Kebele.",
  phones: ["+2519 23 23 63 04", "+2519 69 04 75 88"],
  phone1: "+2519 23 23 63 04",
  phone2: "+2519 69 04 75 88",
  whatsapp: "+251 92 323 6304",
  whatsappUrl: "https://wa.me/251923236304",
  telegram: "https://t.me/rizqmarket1",
  email: "clickcomputercenter230@gmail.com",
  address: "Chagni, 01 Kebele",
  city: "Chagni",
  country: "Ethiopia",
  workingHours: "Monday – Sunday: 1:30 – 12:00",
  mapUrl: "https://maps.google.com/?q=Chagni,Ethiopia",
} as const;

// ═══════════════════════════════════════════════════════════════
// 🎓 TRAINING COURSES
// ═══════════════════════════════════════════════════════════════
export const TRAINING_COURSES = [
  {
    id: "web-dev",
    title: "Full-Stack Web Development",
    description:
      "HTML, CSS, JavaScript, React, Node.js, MongoDB. Build real projects.",
    duration: "12 weeks",
    fee: 8500,
    level: "Beginner → Advanced",
    icon: "💻",
    highlights: ["Real projects", "Portfolio ready", "Job assistance"],
  },
  {
    id: "ccna",
    title: "Networking (CCNA Prep)",
    description:
      "Routing, switching, network security. Cisco certified path.",
    duration: "10 weeks",
    fee: 7000,
    level: "Intermediate",
    icon: "🌐",
    highlights: ["Cisco labs", "Certification prep", "Hands-on"],
  },
  {
    id: "office",
    title: "MS Office & Digital Literacy",
    description:
      "Word, Excel, PowerPoint, internet skills for the workplace.",
    duration: "6 weeks",
    fee: 3500,
    level: "Beginner",
    icon: "📊",
    highlights: ["Office 365", "Data skills", "Certificate"],
  },
  {
    id: "graphic",
    title: "Graphic Design Essentials",
    description:
      "Photoshop, Illustrator, branding, social media design.",
    duration: "8 weeks",
    fee: 6000,
    level: "Beginner → Intermediate",
    icon: "🎨",
    highlights: ["Adobe CC", "Portfolio", "Freelance ready"],
  },
  {
    id: "mobile",
    title: "Mobile App Development",
    description:
      "React Native, Flutter. Build iOS & Android apps from scratch.",
    duration: "10 weeks",
    fee: 7500,
    level: "Intermediate",
    icon: "📱",
    highlights: ["iOS + Android", "App store ready", "Real projects"],
  },
  {
    id: "data",
    title: "Data Analysis & Excel",
    description:
      "Advanced Excel, SQL, Power BI. Turn data into insights.",
    duration: "8 weeks",
    fee: 6500,
    level: "Beginner → Intermediate",
    icon: "📈",
    highlights: ["Power BI", "SQL", "Real datasets"],
  },
];

// ═══════════════════════════════════════════════════════════════
// 🔧 SERVICES
// ═══════════════════════════════════════════════════════════════
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

// ═══════════════════════════════════════════════════════════════
// 📊 HOMEPAGE STATS
// ═══════════════════════════════════════════════════════════════
export const HOMEPAGE_STATS = [
  { label: "Happy Customers", value: "500+", icon: "😊" },
  { label: "Devices Repaired", value: "1,200+", icon: "🔧" },
  { label: "Students Trained", value: "300+", icon: "🎓" },
  { label: "Years Experience", value: "5+", icon: "⭐" },
];

// ═══════════════════════════════════════════════════════════════
// 🎨 BRAND COLORS (የ logo ቀለም)
// ═══════════════════════════════════════════════════════════════
export const BRAND_COLORS = {
  primary: "#10b981", // emerald-500
  primaryDark: "#059669", // emerald-600
  accent: "#f97316", // orange-500
  dark: "#0f172a", // slate-900
  gradient: "from-slate-900 via-emerald-900 to-slate-900",
} as const;

export type TrainingCourse = (typeof TRAINING_COURSES)[number];
export type ServiceItem = (typeof SERVICES)[number];
