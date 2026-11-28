// src/lib/useCustomer.ts
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Customer {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  status: string;
  emailVerified: boolean;
  createdAt: string;
  lastLogin: string;
}

export function useCustomer() {
  const router = useRouter();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      const res = await fetch("/api/auth/customer/me", { cache: "no-store" });
      const data = await res.json();
      setCustomer(data.customer);
    } catch {
      setCustomer(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function login(email: string, password: string) {
    const res = await fetch("/api/auth/customer/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Login failed");
    setCustomer(data.customer);
    return data.customer;
  }

  async function register(data: {
    fullName: string;
    email: string;
    password: string;
    phone: string;
    address?: string;
    city?: string;
  }) {
    const res = await fetch("/api/auth/customer/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || "Registration failed");
    setCustomer(result.customer);
    return result.customer;
  }

  async function logout() {
    await fetch("/api/auth/customer/logout", { method: "POST" });
    setCustomer(null);
    router.push("/");
    router.refresh();
  }

  return { customer, loading, login, register, logout, refresh: load };
}
