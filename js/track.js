// ═══════════════════════════════════════════════════════════════════════════
// Conversion tracking
//
// Every booking link on the site has a data-track-cta="..." attribute naming
// where it sits (hero, pricing-term, mobile-sticky, and so on). This file
// listens for clicks on those links and reports a lead event to whichever
// analytics tags are installed in the page <head>.
//
// You do NOT need to edit this file. Just paste your GA4 / Google Ads / Meta
// tag into the <head> of index.html and adventures/index.html — this script
// checks whether each one exists before calling it, so it stays silent (and
// error-free) until you do.
//
// What it sends:
//   GA4 / Google Ads →  gtag('event', 'generate_lead', { cta_location: ... })
//   Meta Pixel       →  fbq('track', 'Lead', { content_name: ... })
//
// To count these as conversions:
//   GA4    Admin → Events → mark "generate_lead" as a key event, then import
//          it into Google Ads as a conversion.
//   Meta   Events Manager → the "Lead" event appears automatically.
//
// NOTE: the enquiry form is hosted on Google Forms, on a domain you don't
// control, so the click is the furthest point this can measure. To track
// actual submissions instead, either embed the form in the page or switch to
// a form that redirects to a /thanks page you own. See README.md.
// ═══════════════════════════════════════════════════════════════════════════

(function () {
  "use strict";

  function report(location) {
    // Google Analytics 4 / Google Ads
    if (typeof window.gtag === "function") {
      window.gtag("event", "generate_lead", {
        cta_location: location,
        page_path: window.location.pathname,
      });
    }

    // Meta (Facebook / Instagram) Pixel
    if (typeof window.fbq === "function") {
      window.fbq("track", "Lead", { content_name: location });
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
