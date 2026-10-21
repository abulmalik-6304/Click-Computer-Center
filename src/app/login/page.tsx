"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export const dynamic = "force-dynamic";

export default function LoginPage() {
  const router = useRouter();
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const fd = new FormData(e.currentTarget);
    
    const username = fd.get("username") as string;
    const password = fd.get("password") as string;

    const res = await signIn("credentials", {
      username,
      password,
      redirect: false,
    });

    setLoading(false);
    
    if (res?.ok) {
      router.push("/admin/dashboard");
      router.refresh();
    } else {
      setError("Invalid username or password");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900 p-4">
      <form onSubmit={onSubmit} className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8 space-y-5">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900">Click Computer Center</h1>
          <p className="text-sm text-slate-500 mt-1">Enterprise Console Sign-In</p>
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-900 mb-1">Username / Email</label>
          <input required name="username" autoComplete="username"
            className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-900 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm" />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-900 mb-1">Password</label>
          <div className="relative">
            <input required name="password" type={show ? "text" : "password"} autoComplete="current-password"
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 pr-11 text-slate-900 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm" />
            <button type="button" onClick={() => setShow((s) => !s)}
              aria-label={show ? "Hide password" : "Show password"}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-900">
              {show ? "🙈" : "👁"}
            </button>
          </div>
        </div>
        {error && <p className="text-sm text-red-600 font-medium bg-red-50 p-3 rounded-lg border border-red-200">{error}</p>}
        <button type="submit" disabled={loading}
          className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg transition disabled:opacity-50">
          {loading ? "Signing in…" : "Sign In"}
        </button>
      </form>
    </div>
  );
}
