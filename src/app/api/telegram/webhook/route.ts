// src/app/api/telegram/webhook/route.ts
import { NextRequest, NextResponse } from "next/server";
import { replyToChat } from "@/lib/telegram";

export const revalidate = 0;
export const dynamic = "force-dynamic";

/**
 * Telegram Webhook Endpoint
 * 
 * Setup (run once):
 *   https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://click-cc.vercel.app/api/telegram/webhook
 * 
 * Bot Commands:
 *   /start  — Welcome message
 *   /id     — Get your chat ID
 *   /help   — Show commands
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const message = body.message || body.edited_message;

    if (!message) {
      return NextResponse.json({ ok: true });
    }

    const chatId = message.chat?.id;
    const text = String(message.text || "").trim();
    const userName = message.from?.first_name || "User";

    if (!chatId) {
      return NextResponse.json({ ok: true });
    }

    // ─── Handle commands ───
    if (text === "/start") {
      await replyToChat(
        chatId,
        `👋 Welcome, *${userName}*!\n\n` +
          `This is the Click Computer Center order notification bot.\n\n` +
          `Your Chat ID:\n\`${chatId}\`\n\n` +
          `📌 Use this ID in your Vercel env: \`TELEGRAM_CHAT_ID\``
      );
    } else if (text === "/id") {
      await replyToChat(
        chatId,
        `🆔 Your Chat ID:\n\`${chatId}\`\n\n` +
          `📝 Copy this and add it to Vercel Environment Variables:\n` +
          `\`TELEGRAM_CHAT_ID=${chatId}\``
      );
    } else if (text === "/help") {
      await replyToChat(
        chatId,
        `📚 *Available Commands*\n\n` +
          `/start — Welcome message\n` +
          `/id — Get your Chat ID\n` +
          `/help — Show this help\n\n` +
          `📌 Any new orders will be automatically notified here.`
      );
    } else {
      await replyToChat(
        chatId,
        `🤖 I only respond to commands.\n\nUse /help to see available commands.`
      );
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("Telegram webhook error:", e);
    return NextResponse.json({ ok: true }); // Always return 200 for Telegram
  }
}

// ✅ Telegram also uses GET for webhook verification sometimes
export async function GET() {
  return NextResponse.json({ ok: true, message: "Telegram webhook ready" });
}
