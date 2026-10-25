# AUREVA — Telegram Bot Setup & Webhook Guide

This guide details how to set up the Telegram bot for receiving real-time order alerts and updating order statuses via interactive inline buttons.

---

## 1. Create Your Telegram Bot

1. Open Telegram and search for [@BotFather](https://t.me/BotFather).
2. Send the command:
   ```
   /newbot
   ```
3. Choose a name: `AUREVA Orders Bot`.
4. Choose a username (must end in `bot`): e.g., `AurevaMoroccoOrderBot`.
5. BotFather will reply with your **Bot Token**:
   ```
   7123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ1234567
   ```
6. Copy this token to your `.env`:
   ```env
   TELEGRAM_BOT_TOKEN=7123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ1234567
   ```

---

## 2. Obtain Your Chat ID & User ID

1. Search for [@userinfobot](https://t.me/userinfobot) on Telegram and press **Start**.
2. Note your **Id** (e.g., `123456789`).
   - This is your Telegram **User ID**.
   - Add it to `TELEGRAM_ALLOWED_USER_IDS` in `.env`:
     ```env
     TELEGRAM_ALLOWED_USER_IDS=123456789
     ```
   - You can add multiple operators separated by commas: `123456789,987654321`.
3. To receive notifications:
   - **Option A (Private chat):** Start a chat with your new bot and click **Start**. Your chat ID is the same as your User ID.
   - **Option B (Telegram Group for your team):** Create a group, add your bot, make the bot an admin, send a test message in the group, and check `https://api.telegram.org/bot<TOKEN>/getUpdates` to find the group `id` (usually starts with `-100...`).
4. Set `TELEGRAM_CHAT_ID` in `.env`:
   ```env
   TELEGRAM_CHAT_ID=123456789
   ```

---

## 3. Configure the Webhook Secret & Endpoint

1. Create a secret token in `.env` (a random secure string):
   ```env
   TELEGRAM_WEBHOOK_SECRET=aur_sec_9876543210abcdef
   ```
2. Once your website is deployed to a public HTTPS domain (e.g. `https://aureva.ma`), set up the Telegram webhook:
   ```bash
   curl -X POST "https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/setWebhook" \
     -H "Content-Type: application/json" \
     -d '{
       "url": "https://aureva.ma/api/telegram",
       "secret_token": "aur_sec_9876543210abcdef"
     }'
   ```
3. Telegram will respond with:
   ```json
   {"ok": true, "result": true, "description": "Webhook was set"}
   ```

---

## 4. How the Operator Workflow Works

When a customer orders:
1. The bot posts a message in the channel/chat:
   ```
   🌿 طلب جديد — AUREVA
   ══════════════════════
   🆔 رقم الطلب: AUR-892144-712
   👤 العميل: محمد العلوي
   📱 الهاتف: 0612345678 (مع رابط اتصال مباشر وواتساب)
   📍 المدينة: Casablanca
   🏠 العنوان: المعاريف زنقة 10
   📦 الكمية: 1 علبة
   💰 سعر الباك: 295 MAD
   🚚 التوصيل: 35 MAD
   💵 المجموع للدفع عند الاستلام (COD): 330 MAD
   ══════════════════════
   🏷️ الحالة الحالية: 🆕 طلب جديد (Nouvelle commande)
   ══════════════════════
   ```
2. Six interactive inline buttons appear beneath the notification:
   - `📞 محاولة اتصال` (`CONTACT_ATTEMPTED`)
   - `✅ تأكيد الطلب` (`CONFIRMED`)
   - `📦 تم التسليم` (`DELIVERED`)
   - `❌ إلغاء الطلب` (`CANCELLED`)
   - `📵 لا يجيب` (`NO_ANSWER`)
   - `🔁 مرتجع` (`RETURNED`)

3. **Security Check:**
   When a button is tapped, the backend verifies that the clicker's Telegram user ID exists in `TELEGRAM_ALLOWED_USER_IDS`.
   - If unauthorized: An alert pops up on their phone: `"⛔ عذراً، لست مصرحاً لك بتعديل حالات الطلبات."` and nothing changes.
   - If authorized: The Google Sheet row is updated first. If the Google Sheet update succeeds, the Telegram message is edited with the new status and timestamp, and the operator sees a confirmation prompt.
