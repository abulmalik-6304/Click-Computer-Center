// src/app/courses/[id]/CourseDetailClient.tsx
"use client";

import { useLanguage } from "@/components/public/LanguageProvider";
import { BUSINESS_INFO } from "@/lib/public-constants";
import Link from "next/link";

export default function CourseDetailClient({
  course,
  allCourses,
}: {
  course: any;
  allCourses: any[];
}) {
  const { lang, t } = useLanguage();
  const similar = allCourses.filter(
    (c) => c.id !== course.id && c.gradient !== course.gradient
  ).slice(0, 3);

  return (
    <main className="min-h-screen bg-slate-50">
      {/* Hero */}
      <section
        className={`bg-gradient-to-br ${course.gradient} text-white py-16`}
      >
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link
            href="/courses"
            className="text-xs opacity-80 hover:opacity-100 mb-4 inline-block"
          >
            ← {t("common.viewAll")}
          </Link>
          <div className="flex items-start gap-6">
            <div className="text-7xl">{course.icon}</div>
            <div className="flex-1">
              <h1 className="text-3xl sm:text-4xl font-bold">
                {course.title[lang]}
              </h1>
              <p className="text-lg opacity-90 mt-3">
                {course.description[lang]}
              </p>
              <div className="flex flex-wrap gap-3 mt-4 text-sm">
                <span className="px-3 py-1 bg-white/20 rounded-full">
                  ⏱ {course.duration[lang]}
                </span>
                <span className="px-3 py-1 bg-white/20 rounded-full">
                  📊 {course.level[lang]}
                </span>
                <span className="px-3 py-1 bg-white/20 rounded-full">
                  💰 {course.fee.toLocaleString()} ETB
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* YouTube Preview */}
      {course.youtubePlaylistId && (
        <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <h2 className="font-bold text-slate-900 mb-3">
              🎥 Course Preview (YouTube)
            </h2>
            <div className="aspect-video bg-slate-900 rounded-xl overflow-hidden">
              <iframe
                src={`https://www.youtube.com/embed/videoseries?list=${course.youtubePlaylistId}`}
                title={course.title[lang]}
                className="w-full h-full"
                allowFullScreen
              />
            </div>
          </div>
        </section>
      )}

      {/* Highlights + Enroll */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left — Highlights */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <h2 className="font-bold text-slate-900 mb-3">
                📋 What You'll Learn
              </h2>
              <ul className="space-y-2">
                {course.highlights.map((h: any, i: number) => (
                  <li
                    key={i}
                    className="flex items-center gap-2 text-sm text-slate-700"
                  >
                    <span className="text-emerald-500 font-bold">✓</span>
                    {h[lang]}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Right — Enroll box */}
          <div className="bg-white rounded-2xl border-2 border-emerald-300 p-5 h-fit lg:sticky lg:top-20">
            <p className="text-xs text-slate-500 uppercase">Course Fee</p>
            <p className="text-3xl font-bold text-emerald-600 mt-1">
              {course.fee.toLocaleString()}
              <span className="text-sm text-slate-400 ml-1">ETB</span>
            </p>

            <div className="mt-4 space-y-2">
              <a
                href={`/training/register?course=${course.id}`}
                className="block w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-center transition"
              >
                📝 {t("courses.enroll")}
              </a>
              <a
                href={`${BUSINESS_INFO.whatsappUrl}?text=${encodeURIComponent(
                  `Hi! I want to enroll in: ${course.title.en}`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-center transition"
              >
                💬 WhatsApp Info
              </a>
            </div>

            <p className="text-xs text-slate-500 mt-3 text-center">
              📍 {BUSINESS_INFO.address}
              <br />
              🕐 {BUSINESS_INFO.workingHours}
            </p>
          </div>
        </div>
      </section>

      {/* Similar courses */}
      {similar.length > 0 && (
        <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">
            🎓 Other Courses
          </h2>
          <div className="grid sm:grid-cols-3 gap-4">
            {similar.map((c) => (
              <Link
                key={c.id}
                href={`/courses/${c.id}`}
                className="bg-white rounded-2xl border border-slate-200 hover:shadow-lg transition p-5 block"
              >
                <div className="text-4xl mb-2">{c.icon}</div>
                <h3 className="font-bold text-slate-900">{c.title[lang]}</h3>
                <p className="text-xs text-slate-500 mt-1">
                  {c.duration[lang]} · {c.fee.toLocaleString()} ETB
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
