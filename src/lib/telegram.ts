// src/lib/telegram.ts
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";
const CHAT_ID = process.env.TELEGRAM_CHAT_ID || "";

export async function sendTelegramMessage(
  text: string,
  options: {
    parseMode?: "Markdown" | "HTML";
    chatId?: string;
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
 * Notify both Admin AND Customer (if customer connected Telegram bot)
 */
export async function notifyOrderApproved(order: {
  id: string;
  productTitle: string;
  customerName: string;
  customerPhone: string;
  downloadToken: string;
  customerChatId?: string;
}): Promise<boolean> {
  const baseUrl = process.env.NEXTAUTH_URL || "https://click-cc.vercel.app";
  const downloadUrl = `${baseUrl}/api/download/${order.downloadToken}`;

  // 1. Send directly to Customer if connected via Telegram Bot
  let customerSent = false;
  if (order.customerChatId) {
    const customerText = `
🎉 *ክፍያዎ ተረጋግጧል! / Payment Approved!*

ሰላም *${order.customerName}*፣
📦 *Product:* ${order.productTitle}
🆔 *Order ID:* \`${order.id}\`

⬇️ *ፋይሉን ለማውረድ ከታች ያለውን ሊንክ ይጫኑ / Download Link:*
${downloadUrl}

እናመሰግናለን! — *Click Computer Center*
    `.trim();

    customerSent = await sendTelegramMessage(customerText, {
      chatId: order.customerChatId,
    });
  }

  // 2. Notify Admin
  const adminText = `
✅ *ORDER APPROVED*

📦 *Product:* ${order.productTitle}
🆔 *Order:* \`${order.id}\`
👤 *Customer:* ${order.customerName} (${order.customerPhone})
🤖 *Bot Delivery:* ${
    customerSent
      ? "✅ Sent directly to customer on Telegram!"
      : "⚠️ Customer not connected to bot (share link manually if needed)"
  }

🔗 *Download Link:*
${downloadUrl}
  `.trim();

  return sendTelegramMessage(adminText);
}

export async function notifyOrderRejected(order: {
  id: string;
  productTitle: string;
  customerName: string;
  reason?: string;
  customerChatId?: string;
}): Promise<boolean> {
  if (order.customerChatId) {
    const customerText = `
❌ *ትዕዛዝዎ አልጸደቀም / Order Rejected*

📦 *Product:* ${order.productTitle}
🆔 *Order ID:* \`${order.id}\`
${order.reason ? `📝 *ምክንያት / Reason:* ${order.reason}` : ""}

ለበለጠ መረጃ ያግኙን።
    `.trim();

    await sendTelegramMessage(customerText, {
      chatId: order.customerChatId,
    });
  }

  const text = `
❌ *ORDER REJECTED*

📦 *Product:* ${order.productTitle}
🆔 *Order:* \`${order.id}\`
👤 *Customer:* ${order.customerName}

${order.reason ? `📝 *Reason:* ${order.reason}` : ""}
  `.trim();

  return sendTelegramMessage(text);
}

export async function replyToChat(
  chatId: string | number,
  text: string
): Promise<boolean> {
  return sendTelegramMessage(text, { chatId: String(chatId) });
}
