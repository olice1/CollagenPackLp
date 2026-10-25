import { PRICING_CONFIG, POPULAR_MOROCCAN_CITIES } from "../config/pricing.js";
import { Tracking } from "../lib/tracking.js";

// Application State
let currentQuantity = 1;
let isSubmitting = false;

document.addEventListener("DOMContentLoaded", async () => {
  // 1. Fetch public config (Meta Pixel ID, cities, pricing)
  let publicPixelId = null;
  try {
    const res = await fetch("/api/config");
    if (res.ok) {
      const data = await res.json();
      publicPixelId = data.metaPixelId;
    }
  } catch (e) {
    console.log("[Aureva] Using default client configuration");
  }

  // 2. Initialize tracking
  Tracking.init(publicPixelId);

  // 3. Populate Moroccan cities dropdown
  initCityDropdown();

  // 4. Initialize Quantity buttons and recalculations
  initQuantityControls();

  // 5. Initialize Form handling
  initOrderForm();

  // 6. Initialize FAQs
  initFaqAccordions();

  // 7. Initial price calculation display
  updatePricingDisplay();
});

function initCityDropdown() {
  const citySelect = document.getElementById("city-select");
  if (!citySelect) return;

  POPULAR_MOROCCAN_CITIES.forEach(city => {
    const opt = document.createElement("option");
    opt.value = city.split(" (")[0]; // Use city name
    opt.textContent = city;
    citySelect.appendChild(opt);
  });
}

function initQuantityControls() {
  const minusBtn = document.getElementById("qty-minus");
  const plusBtn = document.getElementById("qty-plus");
  const display = document.getElementById("qty-display");

  if (minusBtn && plusBtn && display) {
    minusBtn.addEventListener("click", () => {
      if (currentQuantity > 1) {
        currentQuantity--;
        display.textContent = currentQuantity;
        updatePricingDisplay();
      }
    });

    plusBtn.addEventListener("click", () => {
      if (currentQuantity < 10) {
        currentQuantity++;
        display.textContent = currentQuantity;
        updatePricingDisplay();
      }
    });
  }
}

function updatePricingDisplay() {
  const calc = PRICING_CONFIG.calculateTotal(currentQuantity);

  // Update order form summary
  const summaryQty = document.getElementById("summary-qty");
  const summaryProductPrice = document.getElementById("summary-product-price");
  const summaryDeliveryFee = document.getElementById("summary-delivery-fee");
  const summaryTotal = document.getElementById("summary-total");

  if (summaryQty) summaryQty.textContent = `${calc.quantity} علبة`;
  if (summaryProductPrice) summaryProductPrice.textContent = calc.formattedSubtotal;
  if (summaryDeliveryFee) summaryDeliveryFee.textContent = calc.formattedDelivery;
  if (summaryTotal) summaryTotal.textContent = calc.formattedTotal;

  // Update hero & sticky bars if needed
  const heroTotal = document.getElementById("hero-total-price");
  if (heroTotal) heroTotal.textContent = `${calc.totalAmount} ${PRICING_CONFIG.currencyAr}`;

  const stickyTotal = document.getElementById("sticky-total-price");
  if (stickyTotal) stickyTotal.textContent = `${calc.totalAmount} ${PRICING_CONFIG.currencyAr}`;
}

function initFaqAccordions() {
  const faqItems = document.querySelectorAll(".faq-item");
  faqItems.forEach(item => {
    const questionBtn = item.querySelector(".faq-question");
    if (questionBtn) {
      questionBtn.addEventListener("click", () => {
        const isActive = item.classList.contains("active");
        faqItems.forEach(i => i.classList.remove("active"));
        if (!isActive) {
          item.classList.add("active");
        }
      });
    }
  });
}

function isValidMoroccanPhone(phone) {
  if (!phone) return false;
  const cleaned = phone.replace(/[\s\-\.\(\)]/g, "");
  const moroccanRegex = /^(?:(?:\+|00)212|0)[5-7]\d{8}$/;
  return moroccanRegex.test(cleaned);
}

function initOrderForm() {
  const form = document.getElementById("aureva-order-form");
  const submitBtn = document.getElementById("submit-order-btn");
  const btnText = document.getElementById("btn-submit-text");
  const btnSpinner = document.getElementById("btn-submit-spinner");
  const errorAlert = document.getElementById("form-error-alert");

  if (!form) return;

  // Real-time phone cleaner
  const phoneInput = document.getElementById("customer-phone");
  if (phoneInput) {
    phoneInput.addEventListener("input", (e) => {
      // allow digits, plus, and spaces only
      e.target.value = e.target.value.replace(/[^\d\+\s]/g, "");
    });
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (isSubmitting) return;

    // Reset error
    if (errorAlert) {
      errorAlert.style.display = "none";
      errorAlert.textContent = "";
    }

    const fullName = document.getElementById("customer-name")?.value.trim();
    const phone = document.getElementById("customer-phone")?.value.trim();
    const city = document.getElementById("city-select")?.value.trim();
    const address = document.getElementById("customer-address")?.value.trim();

    // Client-side validations
    if (!fullName || fullName.length < 3) {
      showError("الرجاء كتابة الاسم الكامل بشكل صحيح.");
      document.getElementById("customer-name")?.focus();
      return;
    }

    if (!isValidMoroccanPhone(phone)) {
      showError("الرجاء إدخال رقم هاتف مغربي صالح (مثال: 0612345678).");
      document.getElementById("customer-phone")?.focus();
      return;
    }

    if (!city) {
      showError("الرجاء اختيار مدينتك.");
      document.getElementById("city-select")?.focus();
      return;
    }

    if (!address || address.length < 4) {
      showError("الرجاء إدخال عنوان التوصيل بدقة.");
      document.getElementById("customer-address")?.focus();
      return;
    }

    // Set loading state
    isSubmitting = true;
    if (submitBtn) submitBtn.disabled = true;
    if (btnText) btnText.textContent = "جاري تأكيد وتسجيل الطلب...";
    if (btnSpinner) btnSpinner.style.display = "inline-block";

    const eventId = Tracking.generateEventId("lead");
    const utms = Tracking.getUTMs();
    const calc = PRICING_CONFIG.calculateTotal(currentQuantity);

    const payload = {
      fullName,
      phone,
      city,
      address,
      quantity: currentQuantity,
      eventId,
      ...utms
    };

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "تعذر إرسال الطلب. يرجى المحاولة لاحقاً.");
      }

      // Track Meta Lead event ONLY upon confirmed successful submission!
      Tracking.trackLead({
        eventId: eventId,
        value: calc.totalAmount,
        currency: "MAD",
        orderId: result.orderId
      });

      // Show Success Modal
      showSuccessModal(result.orderId, fullName, calc.totalAmount);
      form.reset();
      currentQuantity = 1;
      const display = document.getElementById("qty-display");
      if (display) display.textContent = "1";
      updatePricingDisplay();

    } catch (err) {
      console.error("[Order submission error]", err);
      showError(err.message || "حدث خطأ غير متوقع. يرجى إعادة المحاولة.");
    } finally {
      isSubmitting = false;
      if (submitBtn) submitBtn.disabled = false;
      if (btnText) btnText.textContent = "تأكيد الطلب — الدفع عند الاستلام";
      if (btnSpinner) btnSpinner.style.display = "none";
    }
  });

  function showError(msg) {
    if (errorAlert) {
      errorAlert.textContent = msg;
      errorAlert.style.display = "block";
      errorAlert.scrollIntoView({ behavior: "smooth", block: "center" });
    } else {
      alert(msg);
    }
  }
}

function showSuccessModal(orderId, name, totalAmount) {
  const modal = document.getElementById("success-modal");
  const modalOrderId = document.getElementById("modal-order-id");
  const modalTotal = document.getElementById("modal-total-amount");
  const closeBtn = document.getElementById("modal-close-btn");

  if (modalOrderId) modalOrderId.textContent = orderId;
  if (modalTotal) modalTotal.textContent = `${totalAmount} ${PRICING_CONFIG.currencyAr}`;

  if (modal) {
    modal.classList.add("open");
  }

  if (closeBtn) {
    closeBtn.onclick = () => {
      modal.classList.remove("open");
    };
  }
}
