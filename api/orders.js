import { PRICING_CONFIG } from "../src/config/pricing.js";
import { appendOrderToSheet } from "../src/lib/google-sheets.js";
import { notifyNewOrder } from "../src/lib/telegram.js";
import { sendMetaConversionEvent } from "../src/lib/meta-capi.js";

/**
 * Validates a Moroccan phone number.
 */
function isValidMoroccanPhone(phone) {
  if (!phone) return false;
  const cleaned = phone.replace(/[\s\-\.\(\)]/g, "");
  // Matches: 06xxxxxxxx, 07xxxxxxxx, 05xxxxxxxx, +2126xxxxxxxx, +2127xxxxxxxx, +2125xxxxxxxx, 2126xxxxxxxx...
  const moroccanRegex = /^(?:(?:\+|00)212|0)[5-7]\d{8}$/;
  return moroccanRegex.test(cleaned);
}

/**
 * Handles order submission.
 */
export async function handleCreateOrder(req, res) {
  try {
    const {
      fullName,
      phone,
      city,
      address,
      quantity = 1,
      utm_source = "",
      utm_medium = "",
      utm_campaign = "",
      utm_content = "",
      utm_term = "",
      fbclid = "",
      eventId = "",
      fbc = "",
      fbp = ""
    } = req.body || {};

    // 1. Validation
    if (!fullName || fullName.trim().length < 2) {
      return res.status(400).json({
        success: false,
        error: "الرجاء إدخال الاسم الكامل بشكل صحيح / Veuillez entrer votre nom complet."
      });
    }

    if (!isValidMoroccanPhone(phone)) {
      return res.status(400).json({
        success: false,
        error: "الرجاء إدخال رقم هاتف مغربي صحيح (مثال: 0612345678) / Numéro de téléphone marocain invalide."
      });
    }

    if (!city || city.trim().length < 2) {
      return res.status(400).json({
        success: false,
        error: "الرجاء تحديد المدينة / Veuillez préciser votre ville."
      });
    }

    if (!address || address.trim().length < 4) {
      return res.status(400).json({
        success: false,
        error: "الرجاء إدخال عنوان التوصيل / Veuillez entrer l'adresse de livraison."
      });
    }

    const qty = Math.max(1, parseInt(quantity, 10) || 1);

    // 2. Strict Price Calculation (Centralized Pricing Config)
    const pricing = PRICING_CONFIG.calculateTotal(qty);

    // 3. Unique Order ID
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    const timeCode = Date.now().toString().slice(-6);
    const orderId = `AUR-${timeCode}-${randomSuffix}`;
    const nowIso = new Date().toISOString();

    const orderRecord = {
      order_id: orderId,
      created_at: nowIso,
      customer_name: fullName.trim(),
      phone: phone.trim(),
      city: city.trim(),
      delivery_address: address.trim(),
      quantity: qty,
      product_price: pricing.productPrice,
      delivery_fee: pricing.deliveryFee,
      total_amount: pricing.totalAmount,
      status: "NEW",
      contact_notes: "",
      updated_at: nowIso,
      utm_source: String(utm_source).slice(0, 100),
      utm_medium: String(utm_medium).slice(0, 100),
      utm_campaign: String(utm_campaign).slice(0, 100),
      utm_content: String(utm_content).slice(0, 100),
      utm_term: String(utm_term).slice(0, 100),
      fbclid: String(fbclid).slice(0, 200)
    };

    // 4. Save to Google Sheets
    let sheetResult = { saved: false };
    try {
      sheetResult = await appendOrderToSheet(orderRecord);
    } catch (sheetErr) {
      console.error("[Orders API] Error saving to Google Sheet:", sheetErr.message);
      // We don't fail the whole user response if Google credentials aren't active yet during test,
      // but we log clearly.
    }

    // 5. Send Telegram Notification
    let telegramResult = { sent: false };
    try {
      telegramResult = await notifyNewOrder(orderRecord);
    } catch (tgErr) {
      console.error("[Orders API] Error notifying Telegram:", tgErr.message);
    }

    // 6. Meta Conversions API (Lead Event)
    const clientIp = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "";
    const clientUserAgent = req.headers["user-agent"] || "";
    const metaEventId = eventId || `lead_${orderId}`;

    sendMetaConversionEvent({
      eventName: "Lead",
      eventId: metaEventId,
      eventSourceUrl: req.headers.referer || process.env.PUBLIC_SITE_URL || "https://aureva.ma",
      customerData: {
        fullName: orderRecord.customer_name,
        phone: orderRecord.phone,
        city: orderRecord.city,
        fbc,
        fbp
      },
      customData: {
        value: pricing.totalAmount,
        orderId: orderRecord.order_id,
        quantity: qty
      },
      clientIp: Array.isArray(clientIp) ? clientIp[0] : clientIp.split(",")[0].trim(),
      clientUserAgent
    }).catch(err => console.error("[Orders API] CAPI background error:", err.message));

    // 7. Successful Response
    return res.status(200).json({
      success: true,
      orderId: orderRecord.order_id,
      totalAmount: pricing.totalAmount,
      currency: "MAD",
      quantity: qty,
      customerName: orderRecord.customer_name,
      sheetSaved: sheetResult.saved,
      telegramSent: telegramResult.sent,
      message: "تم تسجيل طلبكم بنجاح! سيتصل بكم فريقنا قريباً لتأكيد التوصيل."
    });

  } catch (error) {
    console.error("[Orders API] Unexpected error:", error);
    return res.status(500).json({
      success: false,
      error: "حدث خطأ أثناء معالجة الطلب. يرجى المحاولة مرة أخرى أو الاتصال بنا مباشرة."
    });
  }
}

export default handleCreateOrder;
