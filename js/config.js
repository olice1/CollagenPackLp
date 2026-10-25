/**
 * AUREVA — Centralized Configuration File
 * Product pricing, discounts, WhatsApp contact, Telegram bot, Meta Pixel, and Google Sheets.
 */

window.AUREVA_CONFIG = {
  brandName: "AUREVA",
  domain: "aur-eva.com",
  bundleName: "Pack Articulations & Mobilité",
  bundleNameAr: "باك المفاصل والحركة والمرونة",

  // Pricing & Multi-Pack Discount (30 DH discount per extra pack)
  // 1 pack = 330 DH
  // 2 packs = 660 - 30 = 630 DH (توفير 30 درهم)
  // 3 packs = 990 - 60 = 930 DH (توفير 60 درهم)
  pricePerPack: 330,
  discountPerExtraPack: 30,
  deliveryFee: 0, // Free delivery
  currency: "DH",
  currencyAr: "درهم",

  // Official WhatsApp Contact
  contactWhatsApp: "212687139382",
  whatsappDisplay: "+212 687-139382",

  // Telegram Order Notifications
  telegram: {
    enabled: true,
    botToken: "8797833092:AAEy-nT_tzsNrFy5c23jMPgwc3kh0E8fmPU",
    chatId: "7864140160"
  },

  // Google Sheets Order Integration (via Google Apps Script Web App)
  // Follow the instructions in google-apps-script.js to deploy and paste your Web App URL here:
  googleSheet: {
    sheetId: "1NWTDQlS7zmmNQLUUn5toz1sryS4UwvEPWY7NyJXwA6A",
    webAppUrl: "https://script.google.com/macros/s/AKfycbz70383IakeVVGm8ptZEc3gd_4HBXlZuVIMosL6JwGwxD5678P7H0e49KNskatFPKyl/exec" // e.g. "https://script.google.com/macros/s/AKfycb.../exec"
  },

  // Meta Pixel & Conversions API
  metaPixel: {
    enabled: true,
    pixelId: "2176488913254071",
    capiToken: "EAAXhbW8hKh8BSZCYGupxh0Cz0YymrEKcquu6q3ufbrAqsGxmJH4HZBDdcwUPEVSaBmiK2NpsCp9A3pBExVr9SwOMbCZC4Fspeq4w1iu5yyiC6AAN28qmsB8yPr0WcHMZAF3IMpvjDzZC0iQZCYde65NcZAgWkzDq8r5plZAMEbKZCVRHlc4xhti5VOZBKYGuGxAyUyfwZDZD"
  }
};
