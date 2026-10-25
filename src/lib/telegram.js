import { ORDER_STATUSES } from "../config/pricing.js";

/**
 * Checks if a Telegram user ID is authorized in TELEGRAM_ALLOWED_USER_IDS.
 */
export function isTelegramUserAuthorized(userId) {
  const allowed = process.env.TELEGRAM_ALLOWED_USER_IDS;
  if (!allowed || allowed.trim() === "") {
    // If not set, log warning and block modifications to be secure
    console.warn("[Telegram] TELEGRAM_ALLOWED_USER_IDS not set. Rejecting status update for security.");
    return false;
  }

  const ids = allowed
    .split(",")
    .map(id => id.trim())
    .filter(Boolean);

  return ids.includes(String(userId));
}

/**
 * Formats Telegram notification message for an order.
 */
export function formatOrderMessage(orderData, currentStatus = "NEW") {
  const statusInfo = ORDER_STATUSES[currentStatus] || { emoji: "📌", labelAr: currentStatus, labelFr: currentStatus };
  const cleanPhone = (orderData.phone || "").replace(/\s+/g, "");
  const waPhone = cleanPhone.startsWith("0") ? "212" + cleanPhone.slice(1) : cleanPhone;

  return `🌿 <b>طلب جديد — AUREVA</b>
══════════════════════
🆔 <b>رقم الطلب / N° Commande:</b> <code>${orderData.order_id}</code>
📅 <b>التاريخ:</b> ${new Date(orderData.created_at || Date.now()).toLocaleString("fr-FR", { timeZone: "Africa/Casablanca" })}

👤 <b>العميل / Client:</b> ${orderData.customer_name}
📱 <b>الهاتف / Tél:</b> <a href="tel:${cleanPhone}">${cleanPhone}</a> | <a href="https://wa.me/${waPhone}">WhatsApp 💬</a>
📍 <b>المدينة / Ville:</b> ${orderData.city}
🏠 <b>العنوان / Adresse:</b> ${orderData.delivery_address}

📦 <b>المنتج:</b> Pack Articulations & Mobilité
🔢 <b>الكمية / Quantité:</b> ${orderData.quantity} علبة
💰 <b>سعر الباك:</b> ${orderData.product_price * orderData.quantity} MAD
🚚 <b>التوصيل / Livraison:</b> ${orderData.delivery_fee} MAD
💵 <b>المجموع للدفع عند الاستلام (COD):</b> <b><u>${orderData.total_amount} MAD</u></b>

══════════════════════
🏷️ <b>الحالة الحالية / Statut:</b> ${statusInfo.emoji} <b>${statusInfo.labelAr} (${statusInfo.labelFr})</b>
${orderData.updated_at ? `🕒 <i>آخر تحديث: ${new Date(orderData.updated_at).toLocaleTimeString("fr-FR")}</i>` : ""}
══════════════════════`;
}

/**
 * Creates inline keyboard buttons for status actions.
 */
export function buildStatusKeyboard(orderId) {
  return {
    inline_keyboard: [
      [
        { text: "📞 محاولة اتصال", callback_data: `st:CONTACT_ATTEMPTED:${orderId}` },
        { text: "✅ تأكيد الطلب", callback_data: `st:CONFIRMED:${orderId}` }
      ],
      [
        { text: "📦 تم التسليم", callback_data: `st:DELIVERED:${orderId}` },
        { text: "❌ إلغاء الطلب", callback_data: `st:CANCELLED:${orderId}` }
      ],
      [
        { text: "📵 لا يجيب", callback_data: `st:NO_ANSWER:${orderId}` },
        { text: "🔁 مرتجع", callback_data: `st:RETURNED:${orderId}` }
      ]
    ]
  };
}

/**
 * Sends a Telegram message using native fetch.
 */
export async function sendTelegramMessage(text, replyMarkup = null) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    console.warn("[Telegram] Bot token or Chat ID not configured. Notification skipped.");
    return { sent: false, reason: "NOT_CONFIGURED" };
  }

  const url = `https://api.telegram.org/bot${token}/sendMessage`;
  const body = {
    chat_id: chatId,
    text,
    parse_mode: "HTML",
    disable_web_page_preview: true
  };

  if (replyMarkup) {
    body.reply_markup = replyMarkup;
  }

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });

  const data = await res.json();
  if (!data.ok) {
    console.error("[Telegram] Error sending message:", data.description);
    return { sent: false, error: data.description };
  }

  return { sent: true, messageId: data.result.message_id };
}

/**
 * Sends notification for a newly placed order with inline status buttons.
 */
export async function notifyNewOrder(orderData) {
  const text = formatOrderMessage(orderData, "NEW");
  const keyboard = buildStatusKeyboard(orderData.order_id);
  return await sendTelegramMessage(text, keyboard);
}

/**
 * Edits an existing Telegram message with updated text and keyboard.
 */
export async function editTelegramMessage(chatId, messageId, newText, replyMarkup) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return { success: false, reason: "NO_TOKEN" };

  const url = `https://api.telegram.org/bot${token}/editMessageText`;
  const body = {
    chat_id: chatId,
    message_id: messageId,
    text: newText,
    parse_mode: "HTML",
    disable_web_page_preview: true
  };

  if (replyMarkup) {
    body.reply_markup = replyMarkup;
  }

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });

  const data = await res.json();
  return { success: data.ok, data };
}

/**
 * Answers a Telegram callback query (popup notification on the Telegram app).
 */
export async function answerCallbackQuery(callbackQueryId, text, showAlert = false) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return { success: false };

  const url = `https://api.telegram.org/bot${token}/answerCallbackQuery`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      callback_query_id: callbackQueryId,
      text,
      show_alert: showAlert
    })
  });

  const data = await res.json();
  return { success: data.ok };
}
