// src/components/public/TrainingPreview.tsx
import Link from "next/link";
import { TRAINING_COURSES } from "@/lib/public-constants";

export default function TrainingPreview() {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="text-center mb-10">
        <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">
          🎓 Training Center
        </h2>
        <p className="mt-3 text-slate-600 max-w-2xl mx-auto">
          Industry-aligned programs taught by certified instructors.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {TRAINING_COURSES.slice(0, 3).map((course) => (
          <div
            key={course.id}
            className="bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-lg hover:border-emerald-300 transition flex flex-col"
          >
            <div className="text-5xl mb-3">{course.icon}</div>
            <h3 className="font-bold text-lg text-slate-900">
              {course.title}
            </h3>
            <p className="text-sm text-slate-600 mt-2 flex-1">
              {course.description}
            </p>
            <div className="mt-3 text-xs text-slate-500 space-y-1">
              <p>
                ⏱ <strong>{course.duration}</strong> · 📊 {course.level}
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-lg font-bold text-emerald-600">
                {course.fee.toLocaleString()}
                <span className="text-xs text-slate-400 ml-1">ETB</span>
              </span>
              <Link
                href={`/training/register?course=${course.id}`}
                className="px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold rounded-lg"
              >
                Enroll →
              </Link>
            </div>
          </div>
        ))}
      </div>

      <div className="text-center mt-8">
        <Link
          href="/training"
          className="inline-block px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl transition"
        >
          View All Courses →
        </Link>
      </div>
    </section>
  );
}
