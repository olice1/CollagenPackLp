import crypto from "crypto";

/**
 * SHA-256 hasher for Meta Conversions API user data normalization.
 */
function hashString(val) {
  if (!val) return undefined;
  const normalized = String(val).trim().toLowerCase();
  return crypto.createHash("sha256").update(normalized).digest("hex");
}

/**
 * Normalizes phone number for Meta CAPI (adds Morocco 212 country code if leading 0).
 */
function normalizePhone(phone) {
  if (!phone) return undefined;
  let digits = String(phone).replace(/\D/g, "");
  if (digits.startsWith("0")) {
    digits = "212" + digits.slice(1);
  }
  return hashString(digits);
}

/**
 * Sends a server-side Conversions API (CAPI) event to Meta.
 */
export async function sendMetaConversionEvent({
  eventName,
  eventId,
  eventSourceUrl,
  customerData = {},
  customData = {},
  clientIp,
  clientUserAgent
}) {
  const pixelId = process.env.META_PIXEL_ID;
  const accessToken = process.env.META_CONVERSIONS_API_TOKEN;
  const testCode = process.env.META_TEST_EVENT_CODE;

  if (!pixelId || !accessToken) {
    // CAPI not configured, silently skip
    return { sent: false, reason: "NOT_CONFIGURED" };
  }

  const currentTimestamp = Math.floor(Date.now() / 1000);

  const payload = {
    data: [
      {
        event_name: eventName,
        event_time: currentTimestamp,
        event_id: eventId,
        event_source_url: eventSourceUrl || process.env.PUBLIC_SITE_URL || "https://aureva.ma",
        action_source: "website",
        user_data: {
          client_ip_address: clientIp,
          client_user_agent: clientUserAgent,
          ph: customerData.phone ? [normalizePhone(customerData.phone)] : undefined,
          fn: customerData.fullName ? [hashString(customerData.fullName.split(" ")[0])] : undefined,
          ln: customerData.fullName ? [hashString(customerData.fullName.split(" ").slice(1).join(" "))] : undefined,
          ct: customerData.city ? [hashString(customerData.city)] : undefined,
          country: [hashString("ma")],
          fbc: customerData.fbc || undefined,
          fbp: customerData.fbp || undefined
        },
        custom_data: {
          currency: "MAD",
          value: customData.value || 0,
          content_name: customData.contentName || "Pack Articulations & Mobilité",
          content_type: "product",
          order_id: customData.orderId,
          num_items: customData.quantity || 1
        }
      }
    ]
  };

  if (testCode) {
    payload.test_event_code = testCode;
  }

  try {
    const url = `https://graph.facebook.com/v19.0/${pixelId}/events?access_token=${accessToken}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const result = await res.json();
    if (result.error) {
      console.error("[Meta CAPI] Error response:", result.error);
      return { sent: false, error: result.error };
    }

    return { sent: true, eventsReceived: result.events_received };
  } catch (err) {
    console.error("[Meta CAPI] Network error:", err.message);
    return { sent: false, error: err.message };
  }
}
