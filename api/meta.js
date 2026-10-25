import { sendMetaConversionEvent } from "../src/lib/meta-capi.js";

/**
 * Endpoint to trigger Meta Conversions API events directly.
 */
export async function handleMetaEvent(req, res) {
  try {
    const { eventName, eventId, eventSourceUrl, customerData, customData } = req.body || {};

    if (!eventName) {
      return res.status(400).json({ error: "Missing eventName" });
    }

    const clientIp = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "";
    const clientUserAgent = req.headers["user-agent"] || "";

    const result = await sendMetaConversionEvent({
      eventName,
      eventId,
      eventSourceUrl,
      customerData,
      customData,
      clientIp: Array.isArray(clientIp) ? clientIp[0] : clientIp.split(",")[0].trim(),
      clientUserAgent
    });

    return res.status(200).json(result);
  } catch (error) {
    console.error("[Meta API] Error:", error);
    return res.status(500).json({ error: error.message });
  }
}

export default handleMetaEvent;
