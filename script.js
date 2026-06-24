/* ==========================================================================
   Winograd - script.js
   ---------------------------------------------------------------------------
   1. BOOKING LINK  - set this ONCE and every "Book" button updates.
   2. Mobile menu, sticky-nav state, smooth scroll.
   3. Reveal-on-scroll + animated stat counters (reduced-motion safe).
   ========================================================================== */
(function () {
  "use strict";

  /* ======================================================================
     1. BOOKING LINK - single source of truth
     ----------------------------------------------------------------------
     Paste your PUBLIC Calendly booking link below (the one clients use to
     pick a time, e.g. "https://calendly.com/your-name/consultation").
     Do NOT use your calendly.com/app/... admin URL - that is your private
     dashboard and visitors cannot book from it.
     Every element with data-book on both pages will use this link.
     ====================================================================== */
  var BOOKING_URL = "https://calendly.com/jennessautomations";

  (function applyBookingLink() {
    var links = document.querySelectorAll("[data-book]");
    var ready = BOOKING_URL && BOOKING_URL.indexOf("http") === 0;
    links.forEach(function (el) {
      if (ready) {
        el.setAttribute("href", BOOKING_URL);
        el.setAttribute("target", "_blank");
        el.setAttribute("rel", "noopener");
      } else {
        // Link not set yet: keep buttons inert rather than jumping to top.
        el.setAttribute("href", "#");
        el.addEventListener("click", function (e) {
          e.preventDefault();
          console.warn("Winograd: set BOOKING_URL in script.js to enable booking buttons.");
        });
      }
    });
  })();

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ======================================================================
     2a. Mobile menu
     ====================================================================== */
  var toggle = document.getElementById("navToggle");
  var menu = document.getElementById("mobileMenu");

  if (toggle && menu) {
    var setMenu = function (open) {
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
      menu.hidden = !open;
    };
    toggle.addEventListener("click", function () { setMenu(menu.hidden); });
    menu.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () { setMenu(false); });
    });
    window.addEventListener("resize", function () {
      if (window.innerWidth >= 880) setMenu(false);
    });
  }

  /* ======================================================================
     2b. Sticky-nav scrolled state (border + stronger backdrop)
     ====================================================================== */
  var nav = document.getElementById("nav");
  if (nav) {
    var onScroll = function () {
      nav.classList.toggle("is-scrolled", window.scrollY > 12);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* ======================================================================
     2c. Smooth scroll with sticky-nav offset (same-page anchors only)
     ====================================================================== */
  var NAV_OFFSET = 84;
  document.querySelectorAll('a[href^="#"]').forEach(function (link) {
    link.addEventListener("click", function (e) {
      var id = link.getAttribute("href");
      if (!id || id.length < 2) return;
      var target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      var top = target.getBoundingClientRect().top + window.scrollY - NAV_OFFSET;
      window.scrollTo({ top: top, behavior: reduced ? "auto" : "smooth" });
    });
  });

  /* ======================================================================
     3a. Reveal-on-scroll (opacity + rise)
     ====================================================================== */
  var revealEls = Array.prototype.slice.call(document.querySelectorAll("[data-reveal]"));

  if (reduced || !("IntersectionObserver" in window)) {
    revealEls.forEach(function (el) { el.classList.add("is-visible"); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
    revealEls.forEach(function (el) { io.observe(el); });
  }

  /* ======================================================================
     3b. Animated stat counters
     ====================================================================== */
  var counters = Array.prototype.slice.call(document.querySelectorAll("[data-count]"));

  function runCount(el) {
    var target = parseInt(el.getAttribute("data-count"), 10) || 0;
    if (reduced) { el.textContent = String(target); return; }
    var duration = 1400;
    var start = null;
    function frame(ts) {
      if (start === null) start = ts;
      var p = Math.min((ts - start) / duration, 1);
      var eased = 1 - Math.pow(1 - p, 5); // ease-out-quint
      el.textContent = String(Math.round(eased * target));
      if (p < 1) requestAnimationFrame(frame);
      else el.textContent = String(target);
    }
    requestAnimationFrame(frame);
  }

  if (counters.length) {
    if (reduced || !("IntersectionObserver" in window)) {
      counters.forEach(runCount);
    } else {
      var co = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            runCount(entry.target);
            co.unobserve(entry.target);
          }
        });
      }, { threshold: 0.6 });
      counters.forEach(function (el) { co.observe(el); });
    }
  }

  /* ======================================================================
     3c. FAQ accordion (accessible, animated max-height)
     ====================================================================== */
  var faqItems = Array.prototype.slice.call(document.querySelectorAll(".faq-item"));
  faqItems.forEach(function (item) {
    var btn = item.querySelector(".faq-q");
    var ans = item.querySelector(".faq-a");
    if (!btn || !ans) return;
    btn.addEventListener("click", function () {
      var isOpen = item.classList.contains("open");
      if (isOpen) {
        item.classList.remove("open");
        btn.setAttribute("aria-expanded", "false");
        ans.style.maxHeight = "0px";
      } else {
        item.classList.add("open");
        btn.setAttribute("aria-expanded", "true");
        ans.style.maxHeight = ans.scrollHeight + "px";
      }
    });
  });
  // Keep an open answer correctly sized on resize.
  window.addEventListener("resize", function () {
    faqItems.forEach(function (item) {
      if (item.classList.contains("open")) {
        var ans = item.querySelector(".faq-a");
        if (ans) ans.style.maxHeight = ans.scrollHeight + "px";
      }
    });
  });
})();
