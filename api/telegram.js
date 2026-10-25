import { isTelegramUserAuthorized, answerCallbackQuery, editTelegramMessage, buildStatusKeyboard } from "../src/lib/telegram.js";
import { updateOrderInSheet } from "../src/lib/google-sheets.js";
import { ORDER_STATUSES } from "../src/config/pricing.js";

/**
 * Handles Telegram Webhook requests.
 */
export async function handleTelegramWebhook(req, res) {
  try {
    // 1. Verify Telegram secret token header if configured
    const webhookSecret = process.env.TELEGRAM_WEBHOOK_SECRET;
    const incomingSecret = req.headers["x-telegram-bot-api-secret-token"];

    if (webhookSecret && webhookSecret.trim() !== "") {
      if (incomingSecret !== webhookSecret) {
        console.warn("[Telegram Webhook] Unauthorized request rejected: Invalid secret token.");
        return res.status(403).json({ error: "Forbidden: Invalid secret token." });
      }
    }

    const update = req.body;
    if (!update) {
      return res.status(200).send("OK");
    }

    // Check if update is a callback_query (button click)
    const callbackQuery = update.callback_query;
    if (!callbackQuery) {
      // Regular message or bot command (/start, /help, etc.)
      return res.status(200).send("OK");
    }

    const callbackId = callbackQuery.id;
    const fromUser = callbackQuery.from;
    const userId = fromUser?.id;
    const data = callbackQuery.data || "";
    const message = callbackQuery.message;

    // 2. Authorization check against TELEGRAM_ALLOWED_USER_IDS
    if (!isTelegramUserAuthorized(userId)) {
      console.warn(`[Telegram Webhook] Unauthorized attempt by user ID: ${userId} (${fromUser?.username || fromUser?.first_name})`);
      await answerCallbackQuery(
        callbackId,
        "⛔ عذراً، لست مصرحاً لك بتعديل حالات الطلبات. / Non autorisé.",
        true
      );
      return res.status(200).send("OK");
    }

    // 3. Parse callback data: format is "st:<STATUS>:<ORDER_ID>"
    const parts = data.split(":");
    if (parts.length < 3 || parts[0] !== "st") {
      await answerCallbackQuery(callbackId, "بيانات غير صالحة / Données invalides.", false);
      return res.status(200).send("OK");
    }

    const newStatus = parts[1];
    const orderId = parts.slice(2).join(":");

    // Verify status is valid
    if (!ORDER_STATUSES[newStatus]) {
      await answerCallbackQuery(callbackId, `حالة غير معروفة: ${newStatus}`, true);
      return res.status(200).send("OK");
    }

    const statusObj = ORDER_STATUSES[newStatus];

    // 4. Update the row in Google Sheets (Source of truth)
    let sheetUpdateResult = null;
    try {
      sheetUpdateResult = await updateOrderInSheet(
        orderId,
        newStatus,
        `Updated by Telegram user @${fromUser?.username || userId}`
      );
    } catch (sheetError) {
      console.error(`[Telegram Webhook] Google Sheet update failed for ${orderId}:`, sheetError.message);
      // DO NOT report success to the operator if Google Sheet update failed!
      await answerCallbackQuery(
        callbackId,
        `⚠️ فشل تحديث جدول Google Sheets:\n${sheetError.message}`,
        true
      );
      return res.status(200).send("OK");
    }

    // 5. Update the Telegram message text to display latest status and updated timestamp
    const existingText = message?.text || "";
    const lines = existingText.split("\n");

    // Replace the status line or append
    let foundStatusLine = false;
    const updatedLines = lines.map(line => {
      if (line.includes("الحالة الحالية") || line.includes("Statut:")) {
        foundStatusLine = true;
        return `🏷️ الحالة الحالية / Statut: ${statusObj.emoji} ${statusObj.labelAr} (${statusObj.labelFr})`;
      }
      if (line.includes("آخر تحديث:") || line.includes("Mis à jour:")) {
        return `🕒 آخر تحديث: ${new Date().toLocaleTimeString("fr-FR")} (@${fromUser?.username || fromUser?.first_name})`;
      }
      return line;
    });

    if (!foundStatusLine) {
      updatedLines.push(`🏷️ الحالة الحالية / Statut: ${statusObj.emoji} ${statusObj.labelAr} (${statusObj.labelFr})`);
    }

    // Add updated timestamp line if not present
    if (!updatedLines.some(l => l.includes("آخر تحديث:") || l.includes("Mis à jour:"))) {
      updatedLines.push(`🕒 آخر تحديث: ${new Date().toLocaleTimeString("fr-FR")} (@${fromUser?.username || fromUser?.first_name})`);
    }

    const newText = updatedLines.join("\n");
    const newKeyboard = buildStatusKeyboard(orderId);

    if (message?.chat?.id && message?.message_id) {
      await editTelegramMessage(message.chat.id, message.message_id, newText, newKeyboard);
    }

    // 6. Acknowledge button click with positive confirmation
    await answerCallbackQuery(
      callbackId,
      `✅ تم تحديث حالة الطلب إلى: ${statusObj.labelAr}`,
      false
    );

    return res.status(200).send("OK");

  } catch (err) {
    console.error("[Telegram Webhook] Global error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}

export default handleTelegramWebhook;
