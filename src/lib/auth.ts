async authorize(creds) {
  if (!creds?.username || !creds?.password) return null;

  const inputUser = creds.username.trim().toLowerCase();

  // 👑 Owner bypass
  if (inputUser === "tahareabdu24@gmail.com" || inputUser.includes("abdulmelik")) {
    return {
      id: "owner-tahar",
      name: "Abdulmelik Tahar (Owner)",
      email: "tahareabdu24@gmail.com",
      role: "owner",
      image: "",
    } as any;
  }

  try {
    const sheet = await getSheet(SHEETS.USERS);
    if (!sheet) return null;

    const rows = await sheet.getRows();
    const userRow = rows.find((r) => {
      const email = (r.get("User_Email") || r.get("User_Name") || "").toLowerCase().trim();
      return email === inputUser;
    });

    if (!userRow) return null;

    // ─── 🚫 Status check ───
    const status = String(userRow.get("Status") || "Active").toLowerCase();
    if (status === "suspended" || status === "inactive" || status === "blocked") {
      throw new Error(`Your account is ${status}. Please contact the administrator.`);
    }

    // ─── Password check ───
    const storedPass = userRow.get("Password") || userRow.get("Password_Hash") || userRow.get("password") || "";
    let isValid = false;
    if (storedPass.startsWith("$2a$") || storedPass.startsWith("$2b$")) {
      isValid = await bcrypt.compare(creds.password, storedPass);
    } else {
      isValid = creds.password === storedPass;
    }
    if (!isValid) return null;

    const userEmail = userRow.get("User_Email") || creds.username;

    // ═══════════════════════════════════════════════════════════════
    // ✅ EMPLOYEE + STAFF ሁለቱንም ይቀበላል
    // ═══════════════════════════════════════════════════════════════
    const rawRole = String(userRow.get("Role") || "staff");
    const assignedRole = normalizeRole(rawRole);  // "Employee" → "employee", "Staff" → "staff"

    const userName = userRow.get("User_Name") || userEmail;
    const profilePic = userRow.get("Profile Picture") || "";

    // ─── Update Last_Seen ───
    try {
      userRow.set("Last_Seen", new Date().toISOString());
      await userRow.save();
    } catch { /* skip */ }

    return {
      id: userEmail,
      name: userName,
      email: userEmail,
      role: assignedRole,
      image: profilePic,
    } as any;
  } catch (e: any) {
    console.error("Auth Error:", e.message);
    throw new Error(e.message || "Login failed");
  }
}
