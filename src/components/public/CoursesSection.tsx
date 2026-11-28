// src/components/public/CoursesSection.tsx
"use client";

import { COURSES } from "@/lib/courses";
import { useLanguage } from "./LanguageProvider";
import Link from "next/link";

export default function CoursesSection() {
  const { lang, t } = useLanguage();

  return (
    <section className="bg-gradient-to-b from-white to-slate-50 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">
            {t("courses.title")}
          </h2>
          <p className="mt-3 text-slate-600 max-w-2xl mx-auto">
            {t("courses.subtitle")}
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {COURSES.map((course) => (
            <div
              key={course.id}
              className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-xl transition group"
            >
              {/* Gradient header */}
              <div
                className={`bg-gradient-to-br ${course.gradient} p-6 text-white`}
              >
                <div className="text-5xl mb-2">{course.icon}</div>
                <h3 className="font-bold text-lg leading-tight">
                  {course.title[lang]}
                </h3>
              </div>

              <div className="p-4">
                <p className="text-sm text-slate-600 line-clamp-3">
                  {course.description[lang]}
                </p>

                {/* Info */}
                <div className="mt-3 space-y-1 text-xs text-slate-500">
                  <p>
                    ⏱ {t("courses.duration")}:{" "}
                    <strong className="text-slate-700">
                      {course.duration[lang]}
                    </strong>
                  </p>
                  <p>
                    📊 {t("courses.level")}:{" "}
                    <strong className="text-slate-700">
                      {course.level[lang]}
                    </strong>
                  </p>
                </div>

                {/* Price */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-500">
                      {t("courses.fee")}
                    </p>
                    <p className="text-xl font-bold text-emerald-600">
                      {course.fee.toLocaleString()}
                      <span className="text-xs text-slate-400 ml-1">ETB</span>
                    </p>
                  </div>
                </div>

                {/* CTA */}
                <Link
                  href={`/courses/${course.id}`}
                  className="mt-3 block w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg text-center transition"
                >
                  {t("courses.enroll")} →
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
