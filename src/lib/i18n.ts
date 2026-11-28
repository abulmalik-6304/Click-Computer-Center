// src/lib/i18n.ts

export type Language = "am" | "en";

export const translations = {
  // ═══ Nav ═══
  "nav.home": { am: "መነሻ", en: "Home" },
  "nav.store": { am: "መሸጫ", en: "Store" },
  "nav.digital": { am: "ዲጂታል", en: "Digital" },
  "nav.courses": { am: "ኮርሶች", en: "Courses" },
  "nav.contact": { am: "አግኙን", en: "Contact" },
  "nav.login": { am: "ግባ", en: "Login" },
  "nav.signup": { am: "ተመዝገብ", en: "Sign Up" },
  "nav.logout": { am: "ውጣ", en: "Logout" },

  // ═══ Hero ═══
  "hero.badge": {
    am: "ፕሪሚየም ዲጂታል ምርቶች",
    en: "Premium Digital Products",
  },
  "hero.title1": {
    am: "ጥራት ያለው ዲጂታል ምርቶች",
    en: "Quality Digital Products",
  },
  "hero.title2": {
    am: "ወዲያውኑ ያውርዱ፣ ወዲያውኑ ይጠቀሙ",
    en: "Instantly download, instantly use",
  },
  "hero.desc": {
    am: "ለኢትዮጵያ ንግዶች፣ ተማሪዎች እና ፈጣሪዎች የተዘጋጁ ጥራት ያላቸው ቴምፕሌቶች፣ ኢ-መጽሐፍት እና ዲዛይን ፋይሎች። አንድ ጊዜ ይክፈሉ፣ ወዲያውኑ ያውርዱ።",
    en: "High-quality templates, e-books, and design files — created for Ethiopian businesses, students, and creators. Pay once, download instantly.",
  },
  "hero.cta1": { am: "💎 ዲጂታል ምርቶች", en: "💎 Browse Digital Products" },
  "hero.cta2": { am: "🛒 መሸጫ", en: "🛒 Physical Store" },
  "hero.trust1": { am: "✅ ፈጣን ማውረድ", en: "✅ Instant download" },
  "hero.trust2": { am: "🔒 አስተማማኝ ክፍያ", en: "🔒 Secure payment" },
  "hero.trust3": { am: "💬 WhatsApp ድጋፍ", en: "💬 WhatsApp support" },

  // ═══ Courses ═══
  "courses.title": { am: "🎓 የትምህርት ኮርሶች", en: "🎓 Training Courses" },
  "courses.subtitle": {
    am: "በአካል ወይም በYouTube ይማሩ",
    en: "Learn in-person or via YouTube",
  },
  "courses.duration": { am: "ቆይታ", en: "Duration" },
  "courses.level": { am: "ደረጃ", en: "Level" },
  "courses.fee": { am: "ዋጋ", en: "Fee" },
  "courses.enroll": { am: "ይመዝገቡ", en: "Enroll" },
  "courses.learnMore": { am: "ተጨማሪ ይመልከቱ", en: "Learn More" },

  // ═══ Digital ═══
  "digital.title": {
    am: "💎 ዲጂታል ምርቶች",
    en: "💎 Digital Products",
  },
  "digital.subtitle": {
    am: "ፈጣን ማውረድ — ማድረስ አያስፈልግም",
    en: "Instant download — no shipping needed",
  },
  "digital.buy": { am: "💳 ይግዙ እና ያውርዱ", en: "💳 Buy & Download" },
  "digital.preview": { am: "ቅድመ እይታ", en: "Preview" },
  "digital.similar": { am: "ተመሳሳይ ምርቶች", en: "Similar Products" },

  // ═══ Product Detail ═══
  "product.category": { am: "ምድብ", en: "Category" },
  "product.fileSize": { am: "የፋይል መጠን", en: "File Size" },
  "product.fileType": { am: "የፋይል አይነት", en: "File Type" },
  "product.downloads": { am: "ማውረዶች", en: "Downloads" },
  "product.price": { am: "ዋጋ", en: "Price" },
  "product.description": { am: "መግለጫ", en: "Description" },
  "product.featured": { am: "⭐ ምርጥ", en: "⭐ Featured" },
  "product.close": { am: "ዝጋ", en: "Close" },

  // ═══ Stats ═══
  "stats.customers": { am: "ደስተኞች ደንበኞች", en: "Happy Customers" },
  "stats.repaired": { am: "የተጠገኑ መሳሪያዎች", en: "Devices Repaired" },
  "stats.trained": { am: "የተማሩ ተማሪዎች", en: "Students Trained" },
  "stats.years": { am: "ዓመታት ልምድ", en: "Years Experience" },

  // ═══ CTA ═══
  "cta.title": { am: "ዛሬ ይጀምሩ", en: "Get Started Today" },
  "cta.subtitle": {
    am: "በ Chagni ይጎብኙን ወይም ይደውሉልን",
    en: "Visit us in Chagni or call us today",
  },
  "cta.whatsapp": { am: "💬 WhatsApp", en: "💬 WhatsApp Us" },
  "cta.contact": { am: "📞 አግኙን", en: "📞 Contact Us" },

  // ═══ Common ═══
  "common.search": { am: "🔍 ይፈልጉ...", en: "🔍 Search..." },
  "common.all": { am: "ሁሉም", en: "All" },
  "common.loading": { am: "በመጫን ላይ...", en: "Loading..." },
  "common.noResults": { am: "ምንም አልተገኘም", en: "No results found" },
  "common.viewAll": { am: "ሁሉንም ይመልከቱ", en: "View all" },
  "common.seeMore": { am: "ተጨማሪ", en: "See more" },
};

export function t(key: string, lang: Language): string {
  const entry = translations[key as keyof typeof translations];
  return entry ? entry[lang] : key;
}
