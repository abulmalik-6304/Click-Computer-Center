// src/lib/courses.ts

export interface Course {
  id: string;
  title: { am: string; en: string };
  description: { am: string; en: string };
  icon: string;
  duration: { am: string; en: string };
  level: { am: string; en: string };
  fee: number;
  youtubePlaylistId?: string; // YouTube playlist URL
  highlights: { am: string; en: string }[];
  gradient: string;
}

export const COURSES: Course[] = [
  {
    id: "basic-computer",
    title: {
      am: "መሰረታዊ የኮምፒውተር ትምህርት",
      en: "Basic Computer Skills",
    },
    description: {
      am: "የኮምፒውተር መሰረታዊ ክህሎቶች — Windows, MS Office (Word, Excel, PowerPoint), ኢንተርኔት እና ኢሜል።",
      en: "Computer fundamentals — Windows, MS Office (Word, Excel, PowerPoint), internet & email.",
    },
    icon: "💻",
    duration: { am: "6 ሳምንት", en: "6 weeks" },
    level: { am: "መጀመሪያ", en: "Beginner" },
    fee: 3500,
    youtubePlaylistId: "",
    highlights: [
      { am: "MS Office 365", en: "MS Office 365" },
      { am: "ኢንተርኔት ክህሎት", en: "Internet skills" },
      { am: "ሰርተፊኬት", en: "Certificate" },
    ],
    gradient: "from-blue-500 to-cyan-500",
  },
  {
    id: "graphics-design",
    title: {
      am: "ግራፊክስ ዲዛይን",
      en: "Graphics Design",
    },
    description: {
      am: "Photoshop, Illustrator, የምርት ስም አሰራር (branding), እና ሶሻል ሚዲያ ዲዛይን።",
      en: "Photoshop, Illustrator, branding, and social media design.",
    },
    icon: "🎨",
    duration: { am: "8 ሳምንት", en: "8 weeks" },
    level: { am: "መጀመሪያ → መካከለኛ", en: "Beginner → Intermediate" },
    fee: 6000,
    youtubePlaylistId: "",
    highlights: [
      { am: "Adobe CC", en: "Adobe CC" },
      { am: "ፖርትፎሊዮ", en: "Portfolio" },
      { am: "ፍሪላንስ", en: "Freelance ready" },
    ],
    gradient: "from-purple-500 to-pink-500",
  },
  {
    id: "video-editing",
    title: {
      am: "ቪዲዮ ኤዲቲንግ",
      en: "Video Editing",
    },
    description: {
      am: "Premiere Pro, CapCut, የሙዚቃ አሰራር (audio), እና የቪዲዮ ፕሮዳክሽን ክህሎቶች።",
      en: "Premiere Pro, CapCut, audio editing, and video production skills.",
    },
    icon: "🎬",
    duration: { am: "8 ሳምንት", en: "8 weeks" },
    level: { am: "መጀመሪያ → መካከለኛ", en: "Beginner → Intermediate" },
    fee: 6000,
    youtubePlaylistId: "",
    highlights: [
      { am: "Premiere Pro", en: "Premiere Pro" },
      { am: "CapCut", en: "CapCut" },
      { am: "YouTube ዝግጁ", en: "YouTube ready" },
    ],
    gradient: "from-orange-500 to-red-500",
  },
  {
    id: "digital-marketing",
    title: {
      am: "ዲጂታል ማርኬቲንግ",
      en: "Digital Marketing",
    },
    description: {
      am: "Facebook እና Instagram ማርኬቲንግ, Google Ads, SEO እና የይዘት ማርኬቲንግ።",
      en: "Facebook & Instagram marketing, Google Ads, SEO, and content marketing.",
    },
    icon: "📱",
    duration: { am: "8 ሳምንት", en: "8 weeks" },
    level: { am: "መጀመሪያ → መካከለኛ", en: "Beginner → Intermediate" },
    fee: 5500,
    youtubePlaylistId: "",
    highlights: [
      { am: "Facebook Ads", en: "Facebook Ads" },
      { am: "Google Ads", en: "Google Ads" },
      { am: "SEO", en: "SEO" },
    ],
    gradient: "from-emerald-500 to-teal-500",
  },
];

export function getCourseById(id: string): Course | undefined {
  return COURSES.find((c) => c.id === id);
}
