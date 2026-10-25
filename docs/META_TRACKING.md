# AUREVA — Meta Ads Tracking & Conversions API Guide

This guide details how tracking works for Meta (Facebook & Instagram) advertising, following best practices for Cash on Delivery (COD) in Morocco.

---

## 1. Tracking Principles for Moroccan COD

1. **PageView & ViewContent:**
   Fired client-side on initial page load.

2. **Lead (NOT Purchase at form submit):**
   In Moroccan Cash on Delivery, submitting an order form registers an intent to buy (a qualified lead). Customers have not paid yet and deliveries may be confirmed or cancelled during call center follow-up.
   - **`Lead`** is fired immediately upon a successful response from `/api/orders`.
   - **`Purchase`** is **never** fired at form submission. (Purchase can be uploaded via offline conversions once the delivery courier collects the cash).

3. **Event Deduplication (Browser + Server CAPI):**
   A unique `event_id` is created when submitting the order.
   - The browser pixel sends `Lead` with `{ eventID: event_id }`.
   - The server endpoint (`/api/orders`) sends a Conversions API `Lead` event with the identical `event_id`.
   - Meta automatically deduplicates the two events, resulting in maximum event quality and resilience against ad blockers.

4. **Privacy & Data Security:**
   - Customer phone number and names are hashed using **SHA-256** before transmission to Meta Conversions API.
   - Phone numbers are automatically converted to international Moroccan format (`212xxxxxxxxx`).
   - Personal information is never transmitted through URL query strings.

---

## 2. Configuration

Set the following variables in your `.env`:

```env
# 1. Your Meta Pixel ID from Events Manager
META_PIXEL_ID=1234567890123456

# 2. Conversions API System User Token (Optional, for server-side tracking)
META_CONVERSIONS_API_TOKEN=EAA...

# 3. Test Event Code (Optional, for Meta Test Events tool verification)
META_TEST_EVENT_CODE=TEST12345
```

---

## 3. How to Obtain the Meta Conversions API Token

1. Go to [Meta Events Manager](https://business.facebook.com/events_manager2).
2. Select your Pixel dataset.
3. Click on the **Settings** tab.
4. Scroll down to **Conversions API**.
5. Under "Set up manually", click **Create Access Token**.
6. Follow the instructions to copy the token and paste it into `META_CONVERSIONS_API_TOKEN` in `.env`.

---

## 4. UTM & Click ID (fbclid) Preservation

When visitors arrive from ads via links such as:
```
https://aureva.ma/?utm_source=meta&utm_medium=cpc&utm_campaign=joints_bundle_morocco&fbclid=IwAR...
```
The client library `src/lib/tracking.js` automatically:
1. Extracts `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term`, and `fbclid`.
2. Stores them in `sessionStorage`.
3. Attaches them to the order payload when `/api/orders` is called.
4. Saves them to the Google Sheet columns for full ad attribution.
