// src/lib/customer-auth.ts
// ═══════════════════════════════════════════════════════════════
// 👤 CUSTOMER AUTH — ራሱን የቻለ (ከ Admin/Employee ፍጹም የተለየ)
// ═══════════════════════════════════════════════════════════════

import { getSheet, getDoc } from "@/lib/google-sheets";
import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";

const SHEET = "Web_Customers_TBL";
const COOKIE_NAME = "ccc_customer_token";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

// ✅ Secret — ከ NEXTAUTH_SECRET የተለየ (ራሱን የቻለ)
function getSecret(): Uint8Array {
  const secret =
    process.env.CUSTOMER_JWT_SECRET ||
    "click-cc-customer-secret-change-me-in-prod";
  return new TextEncoder().encode(secret);
}

export interface Customer {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  status: "active" | "suspended";
  emailVerified: boolean;
  createdAt: string;
  lastLogin: string;
}

// ═══════════════════════════════════════════════════════════════
// REGISTER
// ═══════════════════════════════════════════════════════════════
export async function registerCustomer(data: {
  fullName: string;
  email: string;
  password: string;
  phone: string;
  address?: string;
  city?: string;
}): Promise<{ ok: boolean; customer?: Customer; error?: string }> {
  try {
    // Validate
    if (!data.fullName?.trim()) return { ok: false, error: "Name required" };
    if (!data.email?.trim()) return { ok: false, error: "Email required" };
    if (!data.password || data.password.length < 8) {
      return { ok: false, error: "Password must be 8+ characters" };
    }
    if (!data.phone?.trim()) return { ok: false, error: "Phone required" };

    // Get or create sheet
    let sheet;
    try {
      sheet = await getSheet(SHEET);
    } catch {
      const doc = await getDoc();
      sheet = await doc.addSheet({
        title: SHEET,
        headerValues: [
          "Customer_ID",
          "Full_Name",
          "Email",
          "Password_Hash",
          "Phone",
          "Address",
          "City",
          "Status",
          "Email_Verified",
          "Verification_Token",
          "Reset_Token",
          "Created_At",
          "Last_Login",
        ],
      });
    }

    const rows = await sheet.getRows();
    const emailLc = data.email.toLowerCase().trim();

    // Check duplicate email
    const exists = rows.some(
      (r) => String(r.get("Email")).toLowerCase().trim() === emailLc
    );
    if (exists) {
      return { ok: false, error: "Email already registered" };
    }

    // Generate ID
    const existingIds = rows
      .map((r) => String(r.get("Customer_ID") || ""))
      .filter((id) => id.startsWith("CUS-WEB-"));
    const maxNum = existingIds.reduce((max, id) => {
      const n = Number(id.replace("CUS-WEB-", ""));
      return isNaN(n) ? max : Math.max(max, n);
    }, 0);
    const newId = `CUS-WEB-${String(maxNum + 1).padStart(4, "0")}`;

    // Hash password
    const hash = await bcrypt.hash(data.password, 12);

    await sheet.addRow({
      Customer_ID: newId,
      Full_Name: data.fullName.trim(),
      Email: emailLc,
      Password_Hash: hash,
      Phone: data.phone.trim(),
      Address: data.address?.trim() || "",
      City: data.city?.trim() || "",
      Status: "active",
      Email_Verified: "FALSE",
      Verification_Token: "",
      Reset_Token: "",
      Created_At: new Date().toISOString(),
      Last_Login: "",
    });

    return {
      ok: true,
      customer: {
        id: newId,
        fullName: data.fullName.trim(),
        email: emailLc,
        phone: data.phone.trim(),
        address: data.address || "",
        city: data.city || "",
        status: "active",
        emailVerified: false,
        createdAt: new Date().toISOString(),
        lastLogin: "",
      },
    };
  } catch (e: any) {
    console.error("Customer register error:", e);
    return { ok: false, error: e.message };
  }
}

// ═══════════════════════════════════════════════════════════════
// LOGIN
// ═══════════════════════════════════════════════════════════════
export async function loginCustomer(
  email: string,
  password: string
): Promise<{ ok: boolean; customer?: Customer; token?: string; error?: string }> {
  try {
    if (!email?.trim() || !password) {
      return { ok: false, error: "Email and password required" };
    }

    const sheet = await getSheet(SHEET);
    const rows = await sheet.getRows();
    const emailLc = email.toLowerCase().trim();
    const row = rows.find(
      (r) => String(r.get("Email")).toLowerCase().trim() === emailLc
    );
    if (!row) {
      return { ok: false, error: "Invalid email or password" };
    }

    // Status check
    const status = String(row.get("Status") || "active").toLowerCase();
    if (status === "suspended") {
      return { ok: false, error: "Account suspended. Contact support." };
    }

    // Password check
    const hash = String(row.get("Password_Hash") || "");
    const valid = await bcrypt.compare(password, hash);
    if (!valid) {
      return { ok: false, error: "Invalid email or password" };
    }

    // Update last login
    row.set("Last_Login", new Date().toISOString());
    await row.save();

    const customer: Customer = {
      id: String(row.get("Customer_ID") || ""),
      fullName: String(row.get("Full_Name") || ""),
      email: String(row.get("Email") || ""),
      phone: String(row.get("Phone") || ""),
      address: String(row.get("Address") || ""),
      city: String(row.get("City") || ""),
      status: "active",
      emailVerified:
        String(row.get("Email_Verified") || "").toUpperCase() === "TRUE",
      createdAt: String(row.get("Created_At") || ""),
      lastLogin: String(row.get("Last_Login") || ""),
    };

    // Generate JWT
    const token = await new SignJWT({
      customerId: customer.id,
      email: customer.email,
      fullName: customer.fullName,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("30d")
      .sign(getSecret());

    return { ok: true, customer, token };
  } catch (e: any) {
    console.error("Customer login error:", e);
    return { ok: false, error: e.message };
  }
}

// ═══════════════════════════════════════════════════════════════
// VERIFY JWT
// ═══════════════════════════════════════════════════════════════
export async function verifyCustomerToken(token: string): Promise<{
  valid: boolean;
  customerId?: string;
  email?: string;
  fullName?: string;
}> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return {
      valid: true,
      customerId: String(payload.customerId || ""),
      email: String(payload.email || ""),
      fullName: String(payload.fullName || ""),
    };
  } catch {
    return { valid: false };
  }
}

// ═══════════════════════════════════════════════════════════════
// GET CUSTOMER BY ID
// ═══════════════════════════════════════════════════════════════
export async function getCustomerById(
  customerId: string
): Promise<Customer | null> {
  try {
    const sheet = await getSheet(SHEET);
    const rows = await sheet.getRows();
    const row = rows.find(
      (r) => String(r.get("Customer_ID")) === customerId
    );
    if (!row) return null;

    return {
      id: String(row.get("Customer_ID") || ""),
      fullName: String(row.get("Full_Name") || ""),
      email: String(row.get("Email") || ""),
      phone: String(row.get("Phone") || ""),
      address: String(row.get("Address") || ""),
      city: String(row.get("City") || ""),
      status: String(row.get("Status") || "active").toLowerCase() as
        | "active"
        | "suspended",
      emailVerified:
        String(row.get("Email_Verified") || "").toUpperCase() === "TRUE",
      createdAt: String(row.get("Created_At") || ""),
      lastLogin: String(row.get("Last_Login") || ""),
    };
  } catch {
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════
// COOKIE HELPERS
// ═══════════════════════════════════════════════════════════════
export { COOKIE_NAME, COOKIE_MAX_AGE };
