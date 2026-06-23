/* ==========================================================================
   Winograd - motion.js   (premium motion layer, ES module)
   --------------------------------------------------------------------------
   Adds cinematic depth on top of the existing restrained design:
     1. Lenis smooth/inertia scroll  (progressive enhancement, CDN ESM).
     2. A single rAF parallax engine for [data-parallax] depth layers and the
        scroll-reactive ambient background.
     3. Pointer-tracked card spotlight (desktop only).
     4. Lenis-aware same-page anchor scrolling.

   Design rules honoured:
     - GPU only: writes transform / opacity, never layout properties.
     - One rAF loop; geometry cached and recomputed on resize/load (no per-
       frame getBoundingClientRect).
     - will-change toggled per element via IntersectionObserver.
     - Fully disabled under prefers-reduced-motion.
     - Lenis load failure degrades gracefully to native scroll + parallax.
     - Inner-scroll surfaces (chat panel, intake modal) are excluded so they
       keep their own native scrolling.
   ========================================================================== */
(function () {
  "use strict";

  var root = document.documentElement;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* Honour reduced motion: leave the page completely static (CSS already
     falls back to a gentle crossfade for reveals). */
  if (reduce) {
    Array.prototype.forEach.call(document.querySelectorAll("[data-parallax]"), function (el) {
      el.style.transform = "";
      el.style.willChange = "auto";
    });
    return;
  }

  var lenis = null;
  var items = [];          // { el, speed, top, h, active }
  var fxBg = null;
  var vh = window.innerHeight;
  var scrollY = window.scrollY || 0;
  var ticking = false;
  var NAV_OFFSET = 84;

  function isMobile() { return window.innerWidth < 760; }

  /* ---- Geometry ---------------------------------------------------------- */
  function measure() {
    vh = window.innerHeight;
    var sy = scrollY;
    for (var i = 0; i < items.length; i++) {
      // Neutralise current transform so the measured top is the layout top.
      var el = items[i].el;
      var prev = el.style.transform;
      el.style.transform = "";
      var r = el.getBoundingClientRect();
      el.style.transform = prev;
      items[i].top = r.top + sy;
      items[i].h = r.height;
    }
  }

  function collect() {
    items = Array.prototype.map.call(
      document.querySelectorAll("[data-parallax]"),
      function (el) {
        return { el: el, speed: parseFloat(el.getAttribute("data-parallax")) || 0, top: 0, h: 0, active: false };
      }
    );
    measure();
  }

  /* ---- Activation (only animate what's near the viewport) ---------------- */
  var io = ("IntersectionObserver" in window)
    ? new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          for (var i = 0; i < items.length; i++) {
            if (items[i].el === e.target) {
              items[i].active = e.isIntersecting;
              e.target.style.willChange = e.isIntersecting ? "transform" : "auto";
              break;
            }
          }
        });
      }, { rootMargin: "25% 0px 25% 0px" })
    : null;

  /* ---- The single render pass ------------------------------------------- */
  function render() {
    var damp = isMobile() ? 0.5 : 1;
    for (var i = 0; i < items.length; i++) {
      var it = items[i];
      if (!it.active) continue;
      var center = it.top + it.h / 2;
      var progress = ((scrollY + vh / 2) - center) / vh;   // ~ -1 .. 1
      var ty = progress * it.speed * damp;
      it.el.style.transform = "translate3d(0," + ty.toFixed(2) + "px,0)";
    }
    if (fxBg) {
      var docH = root.scrollHeight - vh;
      var p = docH > 0 ? scrollY / docH : 0;               // 0 .. 1 page progress
      fxBg.style.transform = "translate3d(" + (p * -36).toFixed(1) + "px," + (p * 120 - 40).toFixed(1) + "px,0)";
    }
    ticking = false;
  }

  function onScroll(y) {
    scrollY = (typeof y === "number") ? y : (window.scrollY || 0);
    if (!ticking) { ticking = true; requestAnimationFrame(render); }
  }

  /* ---- Lenis smooth scroll (progressive enhancement) -------------------- */
  function preventInner(node) {
    return !!(node && node.closest &&
      node.closest(".chat-panel, .chat-log, .intake-overlay, .intake-modal, [data-lenis-prevent]"));
  }

  function setupAnchors() {
    // With Lenis active, take over same-page anchors in the capture phase and
    // block the native-scroll handler in script.js.
    Array.prototype.forEach.call(document.querySelectorAll('a[href^="#"]'), function (link) {
      link.addEventListener("click", function (e) {
        var id = link.getAttribute("href");
        if (!id || id.length < 2) return;
        var target = document.querySelector(id);
        if (!target) return;
        e.preventDefault();
        e.stopImmediatePropagation();
        lenis.scrollTo(target, { offset: -NAV_OFFSET, duration: 1.1 });
      }, true);
    });
  }

  function initLenis() {
    return import("https://cdn.jsdelivr.net/npm/lenis@1.1.20/+esm").then(function (mod) {
      var Lenis = mod.default || mod.Lenis;
      if (!Lenis) throw new Error("Lenis unavailable");
      lenis = new Lenis({
        duration: 1.05,
        lerp: 0.1,
        smoothWheel: true,
        wheelMultiplier: 1,
        touchMultiplier: 1.6,
        prevent: preventInner
      });
      root.classList.add("has-smooth");
      lenis.on("scroll", function (e) { onScroll(e.animatedScroll != null ? e.animatedScroll : e.scroll); });
      function raf(t) { lenis.raf(t); requestAnimationFrame(raf); }
      requestAnimationFrame(raf);
      setupAnchors();
    }).catch(function () {
      // Graceful fallback: native scroll drives the parallax engine.
      window.addEventListener("scroll", function () { onScroll(); }, { passive: true });
    });
  }

  /* ---- Pointer spotlight for cards (desktop pointers only) -------------- */
  function initSpotlight() {
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    Array.prototype.forEach.call(document.querySelectorAll(".svc, .plan"), function (card) {
      card.addEventListener("pointermove", function (e) {
        var r = card.getBoundingClientRect();
        card.style.setProperty("--mx", ((e.clientX - r.left) / r.width * 100) + "%");
        card.style.setProperty("--my", ((e.clientY - r.top) / r.height * 100) + "%");
      });
    });
  }

  /* ---- Boot -------------------------------------------------------------- */
  function start() {
    fxBg = document.querySelector(".fx-bg");
    collect();
    if (io) { items.forEach(function (it) { io.observe(it.el); }); }
    else    { items.forEach(function (it) { it.active = true; }); }

    initSpotlight();
    initLenis();
    onScroll();

    var rt;
    window.addEventListener("resize", function () {
      clearTimeout(rt);
      rt = setTimeout(function () { measure(); onScroll(); }, 150);
    }, { passive: true });

    // Re-measure once everything (fonts, images) has settled.
    window.addEventListener("load", function () {
      measure(); onScroll();
      setTimeout(function () { measure(); onScroll(); }, 350);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();
