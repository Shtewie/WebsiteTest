// ═══════════════════════════════════════════════════════════════════════════
// Conversion tracking
//
// Every booking link on the site has a data-track-cta="..." attribute naming
// where it sits (hero, pricing-term, mobile-sticky, and so on). This file
// listens for clicks on those links and reports them to whichever analytics
// tags are installed in the page <head>.
//
// You do NOT need to edit this file. Just paste your GA4 / Google Ads / Meta
// tag into the <head> of index.html — this script checks whether each one
// exists before calling it, so it stays silent (and error-free) until you do.
//
// IMPORTANT — these clicks are NOT conversions. The booking form lives on
// this same page, so clicking "Join an Adventure" only scrolls someone down
// to it. Counting that as a lead would inflate your conversion numbers by
// roughly ten to one and wreck your ad bidding.
//
// What it sends:
//   GA4 / Google Ads →  gtag('event', 'cta_click', { cta_location: ... })
//   Meta Pixel       →  fbq('trackCustom', 'CTAClick', { content_name: ... })
//
// The one real conversion — generate_lead / Lead — is fired by
// js/schedule.js when Netlify returns to ?done=1, i.e. only once a booking
// has actually been submitted and accepted.
//
// To count it as a conversion:
//   GA4    Admin → Events → mark "generate_lead" as a key event, then import
//          it into Google Ads as a conversion.
//   Meta   Events Manager → the "Lead" event appears automatically.
// ═══════════════════════════════════════════════════════════════════════════

(function () {
  "use strict";

  function report(location) {
    // Google Analytics 4 / Google Ads
    if (typeof window.gtag === "function") {
      window.gtag("event", "cta_click", {
        cta_location: location,
        page_path: window.location.pathname,
      });
    }

    // Meta (Facebook / Instagram) Pixel. trackCustom, not track — "Lead" is
    // a standard event and must stay reserved for the real submission.
    if (typeof window.fbq === "function") {
      window.fbq("trackCustom", "CTAClick", { content_name: location });
    }

    // Google Tag Manager, if you use it instead of a raw gtag snippet
    if (Array.isArray(window.dataLayer)) {
      window.dataLayer.push({ event: "cta_click", cta_location: location });
    }
  }

  document.addEventListener(
    "click",
    function (e) {
      const link = e.target.closest("[data-track-cta]");
      if (link) report(link.getAttribute("data-track-cta"));
    },
    // Capture phase, so the event is recorded even when the click opens a
    // new tab and the page stops running immediately afterwards.
    true
  );
})();
