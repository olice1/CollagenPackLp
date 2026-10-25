# AUREVA — Pack Articulations & Mobilité
### Pure Static Mobile-First Moroccan COD Landing Page for aur-eva.com

A lightweight, high-converting static landing page (HTML, CSS, Vanilla JS) tailored for **AUREVA** selling the **Pack Articulations & Mobilité** bundle in Morocco using Cash on Delivery (COD).

- **100% Pure Static:** Zero `node_modules`, zero complex backend dependencies, zero build steps.
- **Ready for Vercel, Netlify, Cloudflare Pages, or cPanel.**
- **Price:** **330 DH** (توصيل مجاني 100% بالمجان).
- **Telegram Notifications:** Dispatched via Telegram Bot API with one click.
- **Google Sheets:** Integrated via a 1-minute Google Apps Script Web App (`google-apps-script.js`).
- **Direct WhatsApp Confirmation:** Thank You page gives customers a 1-click button to confirm their order on WhatsApp before customer service calls.

---

## 📁 File Structure

```
├── index.html                   # Mobile-first RTL Arabic landing page
├── css/
│   └── style.css                # Premium RTL styles (Teal / Marine / Aqua)
├── js/
│   ├── config.js                # Centralized configuration (price, tokens, WhatsApp)
│   └── app.js                   # Client-side order logic, Telegram API, Pixel, Modal
├── images/
│   ├── logo.webp                # Official AUREVA brand logo
│   ├── bundle-hero.jpg          # The 3 products on podiums
│   ├── bundle-trio.jpg          # Product row presentation
│   ├── cartilage-de-requin.jpg  # Cartilage de Requin (60 gélules)
│   ├── collagene-marin.jpg      # Collagène Marin (90 gélules)
│   └── foie-de-morue.jpg        # Foie de Morue (60 gélules)
├── google-apps-script.js        # Google Sheets Web App code (copy & paste into Sheets)
├── favicon.svg, favicon.ico     # Brand favicons
├── apple-touch-icon.png         # iOS icon
├── site.webmanifest             # PWA manifest
├── robots.txt, sitemap.xml      # SEO files
└── vercel.json                  # Instant zero-build Vercel deployment config
```

---

## ⚙️ Quick Configuration in `js/config.js`

Open [js/config.js](file:///g:/PROJECTS/Aureva/pack/js/config.js) to adjust your details:

```javascript
window.AUREVA_CONFIG = {
  pricePerPack: 330,          // 330 DH
  deliveryFee: 0,             // Free delivery (0 DH)
  
  // Set your WhatsApp phone number (Moroccan international format without + or spaces)
  contactWhatsApp: "212600000000",
  contactPhone: "+212 600-000000",

  telegram: {
    enabled: true,
    botToken: "8797833092:AAEy-nT_tzsNrFy5c23jMPgwc3kh0E8fmPU",
    chatId: "7864140160"
  },

  googleSheet: {
    sheetId: "1NWTDQlS7zmmNQLUUn5toz1sryS4UwvEPWY7NyJXwA6A",
    webAppUrl: "" // Paste your Google Apps Script Web App URL here
  },

  metaPixel: {
    enabled: true,
    pixelId: "2176488913254071"
  }
};
```

---

## 📊 Google Sheets Setup (1 Minute)

1. Open your Google Sheet: [1NWTDQlS7zmmNQLUUn5toz1sryS4UwvEPWY7NyJXwA6A](https://docs.google.com/spreadsheets/d/1NWTDQlS7zmmNQLUUn5toz1sryS4UwvEPWY7NyJXwA6A/edit)
2. In the top menu, click **Extensions > Apps Script**.
3. Copy all the code from [`google-apps-script.js`](file:///g:/PROJECTS/Aureva/pack/google-apps-script.js) and paste it into the editor.
4. Click **Deploy > New deployment**.
5. Select **Web app**:
   - **Execute as:** `Me`
   - **Who has access:** `Anyone`
6. Click **Deploy**, authorize permissions, and copy the **Web app URL**.
7. Paste that URL into `js/config.js` under `googleSheet.webAppUrl`.

---

## 🚀 Deploying to Vercel

1. Push this folder to your GitHub repository.
2. In Vercel, click **Add New Project** and select your repo.
3. Framework Preset: **Other** (Zero build command, output directory empty).
4. Click **Deploy**.
5. Assign your domain `aur-eva.com` in Project Settings > Domains.
