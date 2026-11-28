// src/app/courses/CoursesListClient.tsx
"use client";

import CoursesSection from "@/components/public/CoursesSection";

export default function CoursesListClient() {
  return (
    <main className="min-h-screen bg-slate-50">
      <div className="bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold mb-3">
            🎓 Training Courses
          </h1>
          <p className="text-lg text-slate-300 max-w-2xl mx-auto">
            Learn in-person or via YouTube — from beginner to pro
          </p>
        </div>
      </div>
      <CoursesSection />
    </main>
  );
}
