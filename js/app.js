/**
 * AUREVA — Client Application (Pure Static JS, Zero Node.js)
 * Enhanced with Moroccan anti-scam phone verification, multi-pack savings (30 DH discount),
 * Google Sheets direct synchronization, and Meta Pixel tracking.
 */

(function () {
  const config = window.AUREVA_CONFIG || {};
  let currentQuantity = 1;
  let isSubmitting = false;
  let hasInitiatedCheckout = false;

  document.addEventListener("DOMContentLoaded", () => {
    initUTMTracking();
    initMetaPixel();
    initQuantityControls();
    initFormSubmission();
    initFaqAccordions();
    initCheckoutTracking();
    updatePricingUI();
  });

  // ========================================================
  // 1. UTM & AD TRACKING
  // ========================================================
  let utmParameters = {};

  function initUTMTracking() {
    const params = new URLSearchParams(window.location.search);
    const keys = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "fbclid"];
    keys.forEach(key => {
      const val = params.get(key);
      if (val) {
        utmParameters[key] = val;
        try { sessionStorage.setItem(`aur_${key}`, val); } catch (e) {}
      } else {
        try {
          const saved = sessionStorage.getItem(`aur_${key}`);
          if (saved) utmParameters[key] = saved;
        } catch (e) {}
      }
    });
  }

  function initMetaPixel() {
    const pixelId = config.metaPixel?.pixelId;
    if (!pixelId || !config.metaPixel?.enabled) return;

    /* eslint-disable */
    !function(f,b,e,v,n,t,s)
    {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
    n.callMethod.apply(n,arguments):n.queue.push(arguments)};
    if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
    n.queue=[];t=b.createElement(e);t.async=!0;
    t.src=v;s=b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t,s)}(window, document,'script',
    'https://connect.facebook.net/en_US/fbevents.js');
    /* eslint-enable */

    window.fbq('init', pixelId);
    window.fbq('track', 'PageView');
    window.fbq('track', 'ViewContent', {
      content_name: config.bundleName || 'Pack Articulations & Mobilité',
      content_type: 'product',
      value: config.pricePerPack || 330,
      currency: 'MAD'
    });
  }

  function initCheckoutTracking() {
    const formInputs = document.querySelectorAll("#aureva-order-form input, #aureva-order-form textarea");
    formInputs.forEach(input => {
      input.addEventListener("focus", () => {
        if (!hasInitiatedCheckout && window.fbq) {
          hasInitiatedCheckout = true;
          window.fbq('track', 'InitiateCheckout', {
            content_name: config.bundleName || 'Pack Articulations & Mobilité',
            currency: 'MAD',
            value: 330
          });
        }
      }, { once: true });
    });
  }

  // ========================================================
  // 2. PRICING & MULTI-PACK SAVINGS (30 DH DISCOUNT PER EXTRA PACK)
  // ========================================================
  function initQuantityControls() {
    const minusBtn = document.getElementById("qty-minus");
    const plusBtn = document.getElementById("qty-plus");

    if (minusBtn) {
      minusBtn.addEventListener("click", () => {
        if (currentQuantity > 1) {
          currentQuantity--;
          updatePricingUI();
        }
      });
    }

    if (plusBtn) {
      plusBtn.addEventListener("click", () => {
        if (currentQuantity < 10) {
          currentQuantity++;
          updatePricingUI();
        }
      });
    }
  }

  function getOrderCalculation() {
    const unitPrice = config.pricePerPack || 330;
    const discountPerExtra = config.discountPerExtraPack || 30;
    const qty = currentQuantity;

    const baseSubtotal = qty * unitPrice;
    const discount = qty > 1 ? (qty - 1) * discountPerExtra : 0;
    const total = baseSubtotal - discount;

    let packsText = `${qty} باكات`;
    if (qty === 1) packsText = "1 باك";
    if (qty === 2) packsText = "2 باكات (توفير 30 درهم)";
    if (qty === 3) packsText = "3 باكات (توفير 60 درهم)";

    return {
      quantity: qty,
      unitPrice,
      baseSubtotal,
      discount,
      total,
      packsText
    };
  }

  function updatePricingUI() {
    const calc = getOrderCalculation();
    const curr = config.currencyAr || 'درهم';

    const displayQty = document.getElementById("qty-display");
    if (displayQty) displayQty.textContent = calc.quantity;

    const summaryQty = document.getElementById("summary-qty");
    if (summaryQty) summaryQty.textContent = calc.quantity === 1 ? "1 باك" : `${calc.quantity} باكات`;

    const summaryProductPrice = document.getElementById("summary-product-price");
    if (summaryProductPrice) summaryProductPrice.textContent = `${calc.baseSubtotal} ${curr}`;

    // Discount Row
    const discountRow = document.getElementById("summary-discount-row");
    const discountVal = document.getElementById("summary-discount-val");
    if (calc.discount > 0) {
      if (discountRow) discountRow.style.display = "flex";
      if (discountVal) discountVal.textContent = `- ${calc.discount} ${curr} (عرض خاص)`;
    } else {
      if (discountRow) discountRow.style.display = "none";
    }

    const summaryTotal = document.getElementById("summary-total");
    if (summaryTotal) summaryTotal.textContent = `${calc.total} ${curr}`;

    const stickyTotal = document.getElementById("sticky-total-price");
    if (stickyTotal) stickyTotal.textContent = `${calc.total} ${curr}`;

    const heroTotal = document.getElementById("hero-total-price");
    if (heroTotal) heroTotal.textContent = `${calc.total} ${curr}`;
  }

  // ========================================================
  // 3. MOROCCAN ANTI-SCAM & FAKE PHONE NUMBER VALIDATOR
  // ========================================================
  function validateMoroccanPhoneStrict(phone) {
    if (!phone) return { valid: false, message: "الرجاء إدخال رقم هاتفك المحمول." };

    // Remove all non-digits except +
    const clean = phone.replace(/[^\d]/g, "");

    // Must be 10 digits starting with 05/06/07 OR 9 digits starting with 5/6/7 OR 212...
    let localDigits = clean;
    if (localDigits.startsWith("212")) {
      localDigits = "0" + localDigits.substring(3);
    } else if (localDigits.startsWith("00212")) {
      localDigits = "0" + localDigits.substring(5);
    }

    if (!localDigits.startsWith("0")) {
      localDigits = "0" + localDigits;
    }

    // Check pattern: must start with 06, 07, or 05 and have exactly 10 digits
    const moroccanRegex = /^0[5-7]\d{8}$/;
    if (!moroccanRegex.test(localDigits)) {
      return {
        valid: false,
        message: "رقم الهاتف غير صحيح. يرجى إدخال رقم مغربي يبدأ بـ 06 أو 07 أو 05 متبوعاً بـ 8 أرقام."
      };
    }

    // ANTI-SCAM CHECKS:
    // A. Detect identical repeated numbers (e.g. 0600000000, 0666666666, 0777777777)
    const suffix = localDigits.substring(2);
    if (/^(\d)\1{7}$/.test(suffix)) {
      return { valid: false, message: "الرجاء إدخال رقم هاتف حقيقي لتأكيد الشحن." };
    }

    // B. Detect sequential fake numbers
    const fakeSequences = [
      "0612345678", "0712345678", "0512345678",
      "0687654321", "0787654321", "0601020304",
      "0611223344", "0600112233", "0700112233",
      "0612121212", "0712121212", "0621212121"
    ];
    if (fakeSequences.includes(localDigits)) {
      return { valid: false, message: "الرجاء إدخال رقم هاتفك الفعلي للتواصل معك." };
    }

    // C. Check diversity of digits (at least 4 different digits)
    const uniqueDigits = new Set(localDigits.split("")).size;
    if (uniqueDigits < 4) {
      return { valid: false, message: "رقم الهاتف غير صالح. يرجى التحقق من الرقم." };
    }

    return { valid: true, cleanDigits: localDigits };
  }

  // ========================================================
  // 4. FORM SUBMISSION & MULTI-CHANNEL DISPATCH
  // ========================================================
  function initFormSubmission() {
    const form = document.getElementById("aureva-order-form");
    const submitBtn = document.getElementById("submit-order-btn");
    const btnText = document.getElementById("btn-submit-text");
    const btnSpinner = document.getElementById("btn-submit-spinner");
    const errorAlert = document.getElementById("form-error-alert");

    if (!form) return;

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (isSubmitting) return;

      if (errorAlert) {
        errorAlert.style.display = "none";
        errorAlert.textContent = "";
      }

      // Honeypot check to block automated bot spam
      const honeypot = document.getElementById("website_hp");
      if (honeypot && honeypot.value.trim() !== "") {
        console.warn("Spam bot detected via honeypot.");
        return; // Silently reject
      }

      const fullName = (document.getElementById("customer-name")?.value || "").trim();
      const phoneRaw = (document.getElementById("customer-phone")?.value || "").trim();
      const city = (document.getElementById("customer-city")?.value || "").trim();
      const address = (document.getElementById("customer-address")?.value || "").trim();

      // Validate Name
      if (fullName.length < 3 || /^([a-zA-Z\u0600-\u06FF])\1{3,}$/.test(fullName)) {
        showFormError("الرجاء إدخال الاسم الكامل بشكل صحيح (Nom & Prénom).");
        document.getElementById("customer-name")?.focus();
        return;
      }

      // Validate Phone (Strict Anti-Scam)
      const phoneValidation = validateMoroccanPhoneStrict(phoneRaw);
      if (!phoneValidation.valid) {
        showFormError(phoneValidation.message);
        document.getElementById("customer-phone")?.focus();
        return;
      }
      const validPhone = phoneValidation.cleanDigits;

      // Duplicate Submission Guard
      const lastOrderTime = sessionStorage.getItem("aur_last_order_time");
      const lastOrderPhone = sessionStorage.getItem("aur_last_order_phone");
      const nowMs = Date.now();
      if (lastOrderPhone === validPhone && lastOrderTime && (nowMs - parseInt(lastOrderTime, 10)) < 45000) {
        showFormError("لقد قمت بإرسال طلبك للتو بهذا الرقم! سيتصل بك فريقنا قريباً لتأكيده.");
        return;
      }

      // Validate City & Address
      if (city.length < 2) {
        showFormError("الرجاء كتابة اسم مدينتك (مثال: الدار البيضاء، مراكش، طنجة...).");
        document.getElementById("customer-city")?.focus();
        return;
      }

      if (address.length < 4) {
        showFormError("الرجاء كتابة عنوان التوصيل والحي بدقة (Adresse & Quartier).");
        document.getElementById("customer-address")?.focus();
        return;
      }

      // Lock UI
      isSubmitting = true;
      if (submitBtn) submitBtn.disabled = true;
      if (btnText) btnText.textContent = "جاري تسجيل وتأكيد الطلب...";
      if (btnSpinner) btnSpinner.style.display = "inline-block";

      const calc = getOrderCalculation();
      const orderId = `AUR-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;
      const nowIso = new Date().toISOString();
      const eventId = `lead_${orderId}`;

      const orderData = {
        order_id: orderId,
        event_id: eventId,
        created_at: nowIso,
        customer_name: fullName,
        phone: validPhone,
        city: city,
        delivery_address: address,
        quantity: calc.quantity,
        product_price: calc.unitPrice,
        discount: calc.discount,
        delivery_fee: 0,
        total_amount: calc.total,
        status: "NEW",
        utm_source: utmParameters.utm_source || "",
        utm_medium: utmParameters.utm_medium || "",
        utm_campaign: utmParameters.utm_campaign || "",
        utm_content: utmParameters.utm_content || "",
        utm_term: utmParameters.utm_term || "",
        fbclid: utmParameters.fbclid || ""
      };

      // Record in session storage to prevent spam
      sessionStorage.setItem("aur_last_order_time", String(nowMs));
      sessionStorage.setItem("aur_last_order_phone", validPhone);

      // Execute Dispatches (Telegram, Google Sheet, Meta Pixel)
      try {
        // A. Telegram Alert
        sendDirectTelegramAlert(orderData, calc);

        // B. Google Sheet Synchronization
        sendOrderToGoogleSheet(orderData);

        // C. Meta Pixel Lead Tracking
        if (window.fbq) {
          window.fbq('track', 'Lead', {
            content_name: config.bundleName || 'Pack Articulations & Mobilité',
            currency: 'MAD',
            value: calc.total,
            order_id: orderId
          }, { eventID: eventId });
        }

        // D. Show Modal with Direct WhatsApp Confirmation Link
        showSuccessModal(orderId, fullName, calc.total, calc.packsText, validPhone, city);

        form.reset();
        currentQuantity = 1;
        updatePricingUI();

      } catch (err) {
        console.error("Order dispatch error:", err);
        showSuccessModal(orderId, fullName, calc.total, calc.packsText, validPhone, city);
      } finally {
        isSubmitting = false;
        if (submitBtn) submitBtn.disabled = false;
        if (btnText) btnText.textContent = "تأكيد الطلب — الدفع عند الاستلام 🛒";
        if (btnSpinner) btnSpinner.style.display = "none";
      }
    });

    function showFormError(msg) {
      if (errorAlert) {
        errorAlert.textContent = msg;
        errorAlert.style.display = "block";
        errorAlert.scrollIntoView({ behavior: "smooth", block: "center" });
      } else {
        alert(msg);
      }
    }
  }

  // ========================================================
  // 5. DIRECT TELEGRAM NOTIFICATION (WITH DISCOUNT DETAILS)
  // ========================================================
  async function sendDirectTelegramAlert(order, calc) {
    if (!config.telegram?.enabled || !config.telegram?.botToken || !config.telegram?.chatId) return;

    const token = config.telegram.botToken;
    const chatId = config.telegram.chatId;
    const waPhone = order.phone.startsWith("0") ? "212" + order.phone.substring(1) : order.phone;

    let discountLine = "";
    if (calc.discount > 0) {
      discountLine = `\n🎁 <b>التخفيض المطبق:</b> -${calc.discount} DH (عرض طلب باقات متعددة)`;
    }

    const messageText = `🌿 <b>طلب جديد — AUREVA</b>
══════════════════════
🆔 <b>رقم الطلب:</b> <code>${order.order_id}</code>
📅 <b>التاريخ:</b> ${new Date().toLocaleTimeString('fr-FR')} (${new Date().toLocaleDateString('fr-FR')})

👤 <b>العميل:</b> ${order.customer_name}
📱 <b>الهاتف:</b> <a href="tel:${order.phone}">${order.phone}</a> | <a href="https://wa.me/${waPhone}">واتساب العميل 💬</a>
📍 <b>المدينة:</b> ${order.city}
🏠 <b>العنوان / الحي:</b> ${order.delivery_address}

📦 <b>المنتج:</b> Pack Articulations & Mobilité
🔢 <b>العدد:</b> ${order.quantity} باك (${calc.packsText})
💰 <b>السعر الإجمالي:</b> ${order.total_amount} DH${discountLine}
🚚 <b>التوصيل:</b> مجاني 100% (0 DH)
💵 <b>المجموع للدفع عند الاستلام (COD):</b> <b><u>${order.total_amount} DH</u></b>

══════════════════════
🏷️ <b>الحالة:</b> 🆕 طلب جديد
══════════════════════`;

    try {
      await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: messageText,
          parse_mode: "HTML",
          disable_web_page_preview: true
        })
      });
    } catch (e) {
      console.warn("Telegram alert error:", e);
    }
  }

  // ========================================================
  // 6. GOOGLE SHEET DISPATCH (JSON + NO-CORS FOR GOOGLE APPS SCRIPT)
  // ========================================================
  function sendOrderToGoogleSheet(order) {
    const webAppUrl = config.googleSheet?.webAppUrl;
    if (!webAppUrl || !webAppUrl.startsWith("http")) {
      console.log("[Google Sheets] Note: webAppUrl is not configured in js/config.js");
      return;
    }

    try {
      // Google Apps Script expects JSON payload with no-cors from web browsers
      fetch(webAppUrl, {
        method: "POST",
        mode: "no-cors",
        cache: "no-cache",
        headers: {
          "Content-Type": "text/plain;charset=utf-8"
        },
        body: JSON.stringify(order)
      }).catch(err => console.warn("Google Sheet background sync note:", err));

    } catch (e) {
      console.warn("Google Sheet sync error:", e);
    }
  }

  // ========================================================
  // 7. THANK YOU MODAL WITH DIRECT WHATSAPP CONFIRMATION
  // ========================================================
  function showSuccessModal(orderId, customerName, totalAmount, packsText, phone, city) {
    const modal = document.getElementById("success-modal");
    const modalOrderId = document.getElementById("modal-order-id");
    const modalTotal = document.getElementById("modal-total-amount");
    const modalPacks = document.getElementById("modal-packs-count");
    const closeBtn = document.getElementById("modal-close-btn");
    const waLink = document.getElementById("modal-whatsapp-link");

    if (modalOrderId) modalOrderId.textContent = orderId;
    if (modalTotal) modalTotal.textContent = `${totalAmount} ${config.currencyAr || 'درهم'}`;
    if (modalPacks) modalPacks.textContent = packsText;

    // Set WhatsApp Direct Confirmation Link (+212687139382)
    if (waLink && config.contactWhatsApp) {
      const waNumber = String(config.contactWhatsApp).replace(/[^\d]/g, "");
      const waMsg = encodeURIComponent(
        `السلام عليكم، قمت بطلب Pack Articulations & Mobilité عبر الموقع.\n` +
        `رقم الطلب: ${orderId}\n` +
        `الكمية: ${packsText}\n` +
        `المبلغ: ${totalAmount} درهم (توصيل مجاني)\n` +
        `المدينة: ${city}\n` +
        `أرغب في تأكيد طلبيتي لتسريع خروج الشحنة.`
      );
      waLink.href = `https://wa.me/${waNumber}?text=${waMsg}`;
      
      waLink.onclick = () => {
        if (window.fbq) {
          window.fbq('trackCustom', 'WhatsAppConfirmClick', { order_id: orderId });
        }
      };
    }

    if (modal) {
      modal.classList.add("open");
      document.body.style.overflow = "hidden";
    }

    if (closeBtn) {
      closeBtn.onclick = () => {
        modal.classList.remove("open");
        document.body.style.overflow = "";
      };
    }
  }

  // ========================================================
  // 8. FAQS ACCORDION
  // ========================================================
  function initFaqAccordions() {
    const items = document.querySelectorAll(".faq-item");
    items.forEach(item => {
      const btn = item.querySelector(".faq-question");
      if (btn) {
        btn.addEventListener("click", () => {
          const isActive = item.classList.contains("active");
          items.forEach(i => i.classList.remove("active"));
          if (!isActive) item.classList.add("active");
        });
      }
    });
  }

})();
