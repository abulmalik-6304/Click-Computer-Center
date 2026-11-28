// src/app/courses/page.tsx
import { LanguageProvider } from "@/components/public/LanguageProvider";
import PublicNav from "@/components/public/PublicNav";
import PublicFooter from "@/components/public/PublicFooter";
import CoursesListClient from "./CoursesListClient";

export const revalidate = 60;

export default function CoursesPage() {
  return (
    <LanguageProvider>
      <PublicNav />
      <CoursesListClient />
      <PublicFooter />
    </LanguageProvider>
  );
}
