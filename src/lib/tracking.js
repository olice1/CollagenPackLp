/**
 * AUREVA — Meta Ads & UTM Tracking Library
 * Handles UTM preservation, browser Meta Pixel, and deduplication IDs.
 */

export const Tracking = {
  utmParams: {},
  pixelInitialized: false,

  /**
   * Initializes UTM parsing and Meta Pixel if ID is available.
   */
  init(pixelId) {
    this.extractAndStoreUTMs();
    if (pixelId) {
      this.initMetaPixel(pixelId);
    }
  },

  /**
   * Captures UTMs and fbclid from URL search parameters, storing in sessionStorage.
   */
  extractAndStoreUTMs() {
    const urlParams = new URLSearchParams(window.location.search);
    const keys = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "fbclid"];
    const captured = {};

    keys.forEach(key => {
      const val = urlParams.get(key);
      if (val) {
        captured[key] = val;
        try {
          sessionStorage.setItem(`aureva_${key}`, val);
        } catch (e) {}
      } else {
        // Fallback to existing session storage
        try {
          const stored = sessionStorage.getItem(`aureva_${key}`);
          if (stored) captured[key] = stored;
        } catch (e) {}
      }
    });

    this.utmParams = captured;
    return captured;
  },

  getUTMs() {
    return this.utmParams;
  },

  /**
   * Initializes standard Meta Pixel snippet dynamically and tracks PageView & ViewContent.
   */
  initMetaPixel(pixelId) {
    if (this.pixelInitialized || !pixelId) return;

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
      content_name: 'Pack Articulations & Mobilité',
      content_type: 'product',
      value: 295,
      currency: 'MAD'
    });

    this.pixelInitialized = true;
    console.log('[Tracking] Meta Pixel initialized:', pixelId);
  },

  /**
   * Generates a unique event ID for deduplicating browser and server events.
   */
  generateEventId(prefix = 'lead') {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  },

  /**
   * Tracks Lead ONLY upon successful order form submission.
   * NOTE: We NEVER fire Purchase at form submission for Moroccan COD.
   */
  trackLead({ eventId, value, currency = 'MAD', orderId }) {
    if (window.fbq) {
      window.fbq('track', 'Lead', {
        content_name: 'Pack Articulations & Mobilité',
        currency: currency,
        value: value,
        order_id: orderId
      }, { eventID: eventId });
      console.log('[Tracking] Meta Lead event fired with eventID:', eventId);
    }
  }
};
