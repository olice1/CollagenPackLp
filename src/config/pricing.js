/**
 * AUREVA — Centralized Product & Pricing Configuration
 * The single source of truth for all pricing across Landing Page, Google Sheets, and Telegram.
 */

export const PRICING_CONFIG = {
  bundleId: "pack-articulations-mobilite",
  bundleName: "Pack Articulations & Mobilité",
  bundleNameAr: "باك المفاصل والحركة والمرونة",
  brand: "AUREVA",
  manufacturer: "NutriLab",

  // Pricing (in Moroccan Dirham - MAD)
  productPrice: 295,
  deliveryFee: 35,
  currency: "MAD",
  currencyAr: "درهم",

  // Products in bundle
  items: [
    {
      id: "cartilage-de-requin",
      frenchName: "Cartilage de Requin",
      arabicName: "غضروف سمك القرش",
      capsules: 60,
      capsulesText: "60 كبسولة",
      focus: "الغضاريف وراحة المفاصل",
      keyIngredients: "100% Chondroïtine & Glucosamine",
      keyIngredientsAr: "كوندرويتين وغلوكوزامين طبيعي",
      image: "/images/cartilage-de-requin.jpg",
      dosage: "من 3 إلى 6 كبسولات يومياً"
    },
    {
      id: "collagene-marin",
      frenchName: "Collagène Marin",
      arabicName: "الكولاجين البحري",
      capsules: 90,
      capsulesText: "90 كبسولة",
      focus: "الأنسجة، المفاصل والأوتار",
      keyIngredients: "Collagène Marin + Vitamine C",
      keyIngredientsAr: "كولاجين بحري غني بفيتامين C",
      image: "/images/collagene-marin.jpg",
      dosage: "من 1 إلى 3 كبسولات كل صباح (برنامج 2-3 أشهر)"
    },
    {
      id: "foie-de-morue",
      frenchName: "Foie de Morue",
      arabicName: "زيت كبد سمك الحوت (القد)",
      capsules: 60,
      capsulesText: "60 كبسولة",
      focus: "العظام، المناعة والصحة العامة",
      keyIngredients: "Vitamine A + Vitamine D + Oméga 3",
      keyIngredientsAr: "فيتامين A و D وأوميغا 3",
      image: "/images/foie-de-morue.jpg",
      dosage: "كبسولة واحدة يومياً أثناء الوجبة"
    }
  ],

  // Calculation helper
  calculateTotal: (quantity = 1) => {
    const qty = Math.max(1, parseInt(quantity, 10) || 1);
    const productPrice = PRICING_CONFIG.productPrice;
    const subtotal = productPrice * qty;
    const deliveryFee = PRICING_CONFIG.deliveryFee;
    const totalAmount = subtotal + deliveryFee;

    return {
      quantity: qty,
      productPrice,
      subtotal,
      deliveryFee,
      totalAmount,
      formattedSubtotal: `${subtotal} ${PRICING_CONFIG.currencyAr}`,
      formattedDelivery: `${deliveryFee} ${PRICING_CONFIG.currencyAr}`,
      formattedTotal: `${totalAmount} ${PRICING_CONFIG.currencyAr}`
    };
  }
};

export const ORDER_STATUSES = {
  NEW: {
    code: "NEW",
    labelAr: "طلب جديد",
    labelFr: "Nouvelle commande",
    emoji: "🆕",
    buttonLabel: "🆕 جديد"
  },
  CONTACT_ATTEMPTED: {
    code: "CONTACT_ATTEMPTED",
    labelAr: "محاولة اتصال",
    labelFr: "Tentative de contact",
    emoji: "📞",
    buttonLabel: "📞 تم الاتصال"
  },
  CONFIRMED: {
    code: "CONFIRMED",
    labelAr: "مؤكد",
    labelFr: "Confirmée",
    emoji: "✅",
    buttonLabel: "✅ تأكيد"
  },
  DELIVERED: {
    code: "DELIVERED",
    labelAr: "تم التوصيل",
    labelFr: "Livrée",
    emoji: "📦",
    buttonLabel: "📦 تم التسليم"
  },
  CANCELLED: {
    code: "CANCELLED",
    labelAr: "ملغي",
    labelFr: "Annulée",
    emoji: "❌",
    buttonLabel: "❌ إلغاء"
  },
  NO_ANSWER: {
    code: "NO_ANSWER",
    labelAr: "لا يجيب",
    labelFr: "Ne répond pas",
    emoji: "📵",
    buttonLabel: "📵 لا يجيب"
  },
  RETURNED: {
    code: "RETURNED",
    labelAr: "مرتجع",
    labelFr: "Retournée",
    emoji: "🔁",
    buttonLabel: "🔁 رجوع"
  }
};

export const POPULAR_MOROCCAN_CITIES = [
  "Casablanca (الدار البيضاء)",
  "Rabat (الرباط)",
  "Marrakech (مراكش)",
  "Tanger (طنجة)",
  "Fès (فاس)",
  "Agadir (أكادير)",
  "Salé (سلا)",
  "Meknès (مكناس)",
  "Oujda (وجدة)",
  "Kénitra (القنيطرة)",
  "Tétouan (تطوان)",
  "Temara (تمارة)",
  "Safi (آسفي)",
  "Mohammédia (المحمدية)",
  "El Jadida (الجديدة)",
  "Béni Mellal (بني ملال)",
  "Nador (الناظور)",
  "Taza (تازة)",
  "Settat (سطات)",
  "Khouribga (خريبكة)",
  "Autre ville (مدينة أخرى)"
];
