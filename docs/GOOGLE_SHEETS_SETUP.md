# AUREVA — Google Sheets Setup Guide

This guide explains how to connect your AUREVA Cash on Delivery (COD) landing page to Google Sheets as a real-time order database.

---

## 1. Create the Google Sheet

1. Go to [Google Sheets](https://sheets.new) and create a new blank spreadsheet.
2. Name it: `AUREVA - Commandes Pack Articulations`.
3. Copy the **Google Sheet ID** from the browser address bar:
   ```
   https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit
                                         ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
                                         This is your GOOGLE_SHEET_ID
   ```
4. Save this ID in your `.env` file:
   ```env
   GOOGLE_SHEET_ID=1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms
   GOOGLE_SHEET_NAME=Sheet1
   ```

---

## 2. Create a Google Cloud Service Account

1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new project (e.g., `aureva-store`).
3. Enable the **Google Sheets API**:
   - In the navigation menu, click **APIs & Services** > **Library**.
   - Search for **Google Sheets API** and click **Enable**.
4. Create a Service Account:
   - Go to **APIs & Services** > **Credentials**.
   - Click **Create Credentials** > **Service account**.
   - Enter name: `aureva-sheets-bot`.
   - Click **Create and Continue**, then click **Done**.
5. Generate a Key:
   - Click on the newly created service account email.
   - Go to the **Keys** tab > **Add Key** > **Create new key**.
   - Select **JSON** and download the credentials JSON file.

---

## 3. Share the Sheet with the Service Account

1. Open your downloaded JSON key and copy the `client_email` value (e.g., `aureva-sheets-bot@aureva-store.iam.gserviceaccount.com`).
2. Open your Google Sheet in your browser.
3. Click the **Share** button in the top right.
4. Paste the service account email.
5. Select the role as **Editor** (critical for appending and updating orders).
6. Uncheck "Notify people" and click **Share**.

---

## 4. Configure Your `.env` File

Choose either **Method A** or **Method B**:

### Method A (Recommended: Single JSON string)
Open the JSON key file, copy its entire contents, and paste it as a single line in `.env`:
```env
GOOGLE_SERVICE_ACCOUNT_JSON={"type":"service_account","project_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"..."}
```

### Method B (Individual parameters)
```env
GOOGLE_SERVICE_ACCOUNT_EMAIL=aureva-sheets-bot@aureva-store.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n"
```

---

## 5. Automatically Initialize the Columns

Run the built-in automated setup script:
```bash
npm run setup:sheet
```

This will automatically create row 1 with the exact required columns:
1. `order_id`
2. `created_at`
3. `customer_name`
4. `phone`
5. `city`
6. `delivery_address`
7. `quantity`
8. `product_price`
9. `delivery_fee`
10. `total_amount`
11. `status` (initial value: `NEW`)
12. `contact_notes`
13. `updated_at`
14. `utm_source`
15. `utm_medium`
16. `utm_campaign`
17. `utm_content`
18. `utm_term`
19. `fbclid`

---

## 6. How the Order Status Sync Works

1. Customer places an order on the landing page.
2. The backend appends a new row to the sheet with status `NEW`.
3. An authorized operator on Telegram clicks a status button (e.g., `✅ Confirmed` or `📦 Delivered`).
4. The backend searches column A for the `order_id`, updates column K (`status`), column L (`contact_notes`), and column M (`updated_at`).
5. The Google Sheet remains the ultimate source of truth.
