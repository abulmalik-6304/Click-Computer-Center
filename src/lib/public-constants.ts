// src/lib/public-constants.ts
// ═══════════════════════════════════════════════════════════════
// 📦 STATIC PUBLIC DATA — safe for client + server components
// ⚠️  NO imports from google-sheets, auth, or server-only modules
// ═══════════════════════════════════════════════════════════════

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

export type TrainingCourse = (typeof TRAINING_COURSES)[number];
export type ServiceItem = (typeof SERVICES)[number];
