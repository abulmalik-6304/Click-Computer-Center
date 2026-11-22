// src/lib/telegram.ts
// ═══════════════════════════════════════════════════════════════
// 📱 TELEGRAM BOT HELPER
// ═══════════════════════════════════════════════════════════════

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";
const CHAT_ID = process.env.TELEGRAM_CHAT_ID || "";

/**
 * Send a message to the configured Telegram chat.
 * Silently fails (logs error) — never throws.
 */
export async function sendTelegramMessage(
  text: string,
  options: {
    parseMode?: "Markdown" | "HTML";
    chatId?: string; // Override default
  } = {}
): Promise<boolean> {
  if (!BOT_TOKEN) {
    console.warn("⚠️ TELEGRAM_BOT_TOKEN not configured");
    return false;
  }

  const targetChatId = options.chatId || CHAT_ID;
  if (!targetChatId) {
    console.warn("⚠️ TELEGRAM_CHAT_ID not configured");
    return false;
  }

  try {
    const res = await fetch(
      `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: targetChatId,
          text,
          parse_mode: options.parseMode || "Markdown",
          disable_web_page_preview: true,
        }),
      }
    );

    if (!res.ok) {
      const err = await res.text();
      console.error("Telegram send failed:", err);
      return false;
    }

    return true;
  } catch (e) {
    console.error("Telegram send error:", e);
    return false;
  }
}

/**
 * Notify admin about a new digital order.
 */
export async function notifyNewDigitalOrder(order: {
  id: string;
  productTitle: string;
  price: number;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  paymentMethod: string;
  paymentReference: string;
}): Promise<boolean> {
  const text = `
🛒 *NEW DIGITAL ORDER*

📦 *Product:* ${order.productTitle}
💰 *Amount:* ${order.price.toLocaleString()} ETB

👤 *Customer:* ${order.customerName}
📱 *Phone:* ${order.customerPhone}
${order.customerEmail ? `📧 *Email:* ${order.customerEmail}` : ""}

💳 *Payment:* ${order.paymentMethod}
🧾 *Order ID:* \`${order.id}\`

🖼 [View Payment Screenshot](${order.paymentReference})

⚡ Approve in dashboard:
${process.env.NEXTAUTH_URL || "https://click-cc.vercel.app"}/admin/digital-orders
  `.trim();

  return sendTelegramMessage(text);
}

/**
 * Notify customer (or admin) that order was approved.
 */
export async function notifyOrderApproved(order: {
  id: string;
  productTitle: string;
  customerName: string;
  customerPhone: string;
  downloadToken: string;
}): Promise<boolean> {
  const downloadUrl = `${
    process.env.NEXTAUTH_URL || "https://click-cc.vercel.app"
  }/download/${order.downloadToken}`;

  const text = `
✅ *ORDER APPROVED*

📦 *Product:* ${order.productTitle}
🆔 *Order:* \`${order.id}\`
👤 *Customer:* ${order.customerName}

🔗 *Download Link:*
${downloadUrl}

📱 Share this link with the customer via WhatsApp / Telegram.
  `.trim();

  return sendTelegramMessage(text);
}

/**
 * Notify that order was rejected.
 */
export async function notifyOrderRejected(order: {
  id: string;
  productTitle: string;
  customerName: string;
  reason?: string;
}): Promise<boolean> {
  const text = `
❌ *ORDER REJECTED*

📦 *Product:* ${order.productTitle}
🆔 *Order:* \`${order.id}\`
👤 *Customer:* ${order.customerName}

${order.reason ? `📝 *Reason:* ${order.reason}` : ""}
  `.trim();

  return sendTelegramMessage(text);
}

/**
 * Send a plain text message (for webhook replies).
 */
export async function replyToChat(
  chatId: string | number,
  text: string
): Promise<boolean> {
  return sendTelegramMessage(text, { chatId: String(chatId) });
}
