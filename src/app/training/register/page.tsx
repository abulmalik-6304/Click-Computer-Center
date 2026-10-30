// src/app/training/register/page.tsx
"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import PublicNav from "@/components/public/PublicNav";
import PublicFooter from "@/components/public/PublicFooter";
import { TRAINING_COURSES } from "@/lib/public-data";

function RegisterForm() {
  const params = useSearchParams();
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    course: params.get("course") || "web-dev",
    message: "",
  });
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setError("");
    try {
      const res = await fetch("/api/training/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Registration failed");
        setStatus("error");
        return;
      }
      setStatus("ok");
    } catch (e: any) {
      setError(e.message);
      setStatus("error");
    }
  }

  if (status === "ok") {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <div className="text-6xl mb-4">✅</div>
        <h1 className="text-3xl font-bold text-slate-900">Registration Received!</h1>
        <p className="mt-4 text-slate-600">
          Thank you, {form.fullName}. We'll contact you at{" "}
          <strong>{form.phone}</strong> within 24 hours to confirm your enrollment.
        </p>
        <div className="mt-8 flex flex-wrap gap-3 justify-center">
          <Link
            href="/training"
            className="px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg"
          >
            Browse More Courses
          </Link>
          <Link
            href="/"
            className="px-6 py-3 border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-50"
          >
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <div className="text-center mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-slate-900">
          Student Registration
        </h1>
        <p className="text-slate-600 mt-2">
          Fill in your details and we'll be in touch within 24 hours
        </p>
      </div>

      <form
        onSubmit={submit}
        className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-4"
      >
        <Field
          label="Full Name *
