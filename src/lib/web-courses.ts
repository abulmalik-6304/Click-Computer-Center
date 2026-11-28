// src/lib/web-courses.ts
import { getSheet } from "@/lib/google-sheets";

const SHEET = "Web_Courses_TBL";

export interface WebCourse {
  id: string;
  title: { am: string; en: string };
  description: { am: string; en: string };
  icon: string;
  duration: { am: string; en: string };
  level: { am: string; en: string };
  fee: number;
  youtubePlaylistId: string;
  gradient: string;
  highlights: { am: string; en: string }[];
  status: "active" | "archived";
}

// ✅ Default courses (if sheet missing)
const DEFAULT_COURSES: WebCourse[] = [
  {
    id: "basic-computer",
    title: {
      am: "መሰረታዊ የኮምፒውተር ትምህርት",
      en: "Basic Computer Skills",
    },
    description: {
      am: "የኮምፒውተር መሰረታዊ ክህሎቶች — Windows, MS Office, ኢንተርኔት እና ኢሜል።",
      en: "Computer fundamentals — Windows, MS Office, internet & email.",
    },
    icon: "💻",
    duration: { am: "6 ሳምንት", en: "6 weeks" },
    level: { am: "መጀመሪያ", en: "Beginner" },
    fee: 3500,
    youtubePlaylistId: "",
    gradient: "from-blue-500 to-cyan-500",
    highlights: [
      { am: "MS Office 365", en: "MS Office 365" },
      { am: "ኢንተርኔት ክህሎት", en: "Internet skills" },
      { am: "ሰርተፊኬት", en: "Certificate" },
    ],
    status: "active",
  },
  {
    id: "graphics-design",
    title: { am: "ግራፊክስ ዲዛይን", en: "Graphics Design" },
    description: {
      am: "Photoshop, Illustrator, ብራንዲንግ, ሶሻል ሚዲያ ዲዛይን።",
      en: "Photoshop, Illustrator, branding, and social media design.",
    },
    icon: "🎨",
    duration: { am: "8 ሳምንት", en: "8 weeks" },
    level: { am: "መጀመሪያ → መካከለኛ", en: "Beginner → Intermediate" },
    fee: 6000,
    youtubePlaylistId: "",
    gradient: "from-purple-500 to-pink-500",
    highlights: [
      { am: "Adobe CC", en: "Adobe CC" },
      { am: "ፖርትፎሊዮ", en: "Portfolio" },
      { am: "ፍሪላንስ", en: "Freelance ready" },
    ],
    status: "active",
  },
  {
    id: "video-editing",
    title: { am: "ቪዲዮ ኤዲቲንግ", en: "Video Editing" },
    description: {
      am: "Premiere Pro, CapCut, ኦዲዮ ኤዲቲንግ, የቪዲዮ ፕሮዳክሽን።",
      en: "Premiere Pro, CapCut, audio editing, video production.",
    },
    icon: "🎬",
    duration: { am: "8 ሳምንት", en: "8 weeks" },
    level: { am: "መጀመሪያ → መካከለኛ", en: "Beginner → Intermediate" },
    fee: 6000,
    youtubePlaylistId: "",
    gradient: "from-orange-500 to-red-500",
    highlights: [
      { am: "Premiere Pro", en: "Premiere Pro" },
      { am: "CapCut", en: "CapCut" },
      { am: "YouTube ዝግጁ", en: "YouTube ready" },
    ],
    status: "active",
  },
  {
    id: "digital-marketing",
    title: { am: "ዲጂታል ማርኬቲንግ", en: "Digital Marketing" },
    description: {
      am: "Facebook & Instagram marketing, Google Ads, SEO, የይዘት ማርኬቲንግ።",
      en: "Facebook & Instagram marketing, Google Ads, SEO, content marketing.",
    },
    icon: "📱",
    duration: { am: "8 ሳምንት", en: "8 weeks" },
    level: { am: "መጀመሪያ → መካከለኛ", en: "Beginner → Intermediate" },
    fee: 5500,
    youtubePlaylistId: "",
    gradient: "from-emerald-500 to-teal-500",
    highlights: [
      { am: "Facebook Ads", en: "Facebook Ads" },
      { am: "Google Ads", en: "Google Ads" },
      { am: "SEO", en: "SEO" },
    ],
    status: "active",
  },
];

// ✅ GET: Load all courses from sheet (or defaults)
export async function getWebCourses(): Promise<WebCourse[]> {
  try {
    const sheet = await getSheet(SHEET);
    const rows = await sheet.getRows();

    return rows
      .map((r) => {
        const o = r.toObject() as any;
        let hAm: any[] = [];
        let hEn: any[] = [];
        try {
          hAm = JSON.parse(o.Highlights_Am || "[]");
          hEn = JSON.parse(o.Highlights_En || "[]");
        } catch {}

        return {
          id: String(o.Course_ID || ""),
          title: {
            am: String(o.Title_Am || ""),
            en: String(o.Title_En || ""),
          },
          description: {
            am: String(o.Description_Am || ""),
            en: String(o.Description_En || ""),
          },
          icon: String(o.Icon || "📚"),
          duration: {
            am: String(o.Duration_Am || ""),
            en: String(o.Duration_En || ""),
          },
          level: {
            am: String(o.Level_Am || ""),
            en: String(o.Level_En || ""),
          },
          fee: Number(o.Fee || 0),
          youtubePlaylistId: String(o.YouTube_Playlist_ID || ""),
          gradient: String(o.Gradient || "from-slate-500 to-slate-700"),
          highlights: hAm.map((h, i) => ({
            am: h,
            en: hEn[i] || h,
          })),
          status: String(o.Status || "active").toLowerCase() as
            | "active"
            | "archived",
        };
      })
      .filter((c) => c.status === "active" && c.title.en);
  } catch {
    return DEFAULT_COURSES;
  }
}

// ✅ GET by ID
export async function getWebCourseById(id: string): Promise<WebCourse | null> {
  const courses = await getWebCourses();
  return courses.find((c) => c.id === id) || null;
}
