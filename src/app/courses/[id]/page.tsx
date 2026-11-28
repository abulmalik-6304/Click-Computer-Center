// src/app/courses/[id]/page.tsx
import { LanguageProvider } from "@/components/public/LanguageProvider";
import PublicNav from "@/components/public/PublicNav";
import PublicFooter from "@/components/public/PublicFooter";
import CourseDetailClient from "./CourseDetailClient";
import { getCourseById, COURSES } from "@/lib/courses";
import { notFound } from "next/navigation";

export const revalidate = 60;

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const course = getCourseById(id);
  if (!course) notFound();

  return (
    <LanguageProvider>
      <PublicNav />
      <CourseDetailClient course={course} allCourses={COURSES} />
      <PublicFooter />
    </LanguageProvider>
  );
}
