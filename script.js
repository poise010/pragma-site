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
  var BOOKING_URL = "https://calendly.com/brady-winograd/30min";

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
     1b. Interactive constellation background
     ====================================================================== */
  function initConstellation() {
    if (reduced) return;

    var canvas = document.createElement("canvas");
    canvas.className = "constellation-canvas";
    canvas.setAttribute("aria-hidden", "true");
    document.body.prepend(canvas);

    var noise = document.createElement("div");
    noise.className = "page-noise";
    noise.setAttribute("aria-hidden", "true");
    document.body.prepend(noise);

    var ctx = canvas.getContext("2d");
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var points = [];
    var pointer = { x: -9999, y: -9999, active: false };
    var raf = 0;
    var width = 0;
    var height = 0;

    function resize() {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = width + "px";
      canvas.style.height = height + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      var count = Math.max(52, Math.min(118, Math.floor((width * height) / 14500)));
      points = Array.from({ length: count }, function (_, i) {
        return {
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.22,
          vy: (Math.random() - 0.5) * 0.22,
          r: i % 7 === 0 ? 1.55 : 1 + Math.random() * 0.8,
          phase: Math.random() * Math.PI * 2
        };
      });
    }

    function draw(ts) {
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = "rgba(255,255,255,0.82)";
      var linkDistance = width < 720 ? 106 : 142;
      var scrollPull = Math.sin(window.scrollY * 0.0018) * 0.28;

      for (var i = 0; i < points.length; i++) {
        var p = points[i];
        var dx = p.x - pointer.x;
        var dy = p.y - pointer.y;
        var dist = Math.sqrt(dx * dx + dy * dy);

        if (pointer.active && dist < 150) {
          var force = (150 - dist) / 150;
          p.x += (dx / Math.max(dist, 1)) * force * 1.15;
          p.y += (dy / Math.max(dist, 1)) * force * 1.15;
        }

        p.x += p.vx + scrollPull;
        p.y += p.vy + Math.sin(ts * 0.00045 + p.phase) * 0.045;

        if (p.x < -20) p.x = width + 20;
        if (p.x > width + 20) p.x = -20;
        if (p.y < -20) p.y = height + 20;
        if (p.y > height + 20) p.y = -20;

        ctx.globalAlpha = 0.42 + Math.sin(ts * 0.001 + p.phase) * 0.18;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }

      for (var a = 0; a < points.length; a++) {
        for (var b = a + 1; b < points.length; b++) {
          var pa = points[a];
          var pb = points[b];
          var lx = pa.x - pb.x;
          var ly = pa.y - pb.y;
          var ld = Math.sqrt(lx * lx + ly * ly);
          if (ld < linkDistance) {
            ctx.globalAlpha = (1 - ld / linkDistance) * 0.28;
            ctx.strokeStyle = "rgba(255,255,255,1)";
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(pa.x, pa.y);
            ctx.lineTo(pb.x, pb.y);
            ctx.stroke();
          }
        }
      }

      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(draw);
    }

    window.addEventListener("pointermove", function (e) {
      pointer.x = e.clientX;
      pointer.y = e.clientY;
      pointer.active = true;
    }, { passive: true });
    window.addEventListener("pointerleave", function () { pointer.active = false; });
    window.addEventListener("resize", resize, { passive: true });
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) cancelAnimationFrame(raf);
      else raf = requestAnimationFrame(draw);
    });

    resize();
    raf = requestAnimationFrame(draw);
  }

  initConstellation();

  document.querySelectorAll(".industries-row span").forEach(function (el, index) {
    el.style.setProperty("--i", index);
  });

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

  function splitRevealText() {
    var targets = Array.prototype.slice.call(document.querySelectorAll(".hero-title, .section-title, .page-hero h1"));
    targets.forEach(function (el) {
      if (el.dataset.splitReady === "true") return;
      var text = el.textContent.trim();
      if (!text) return;
      el.dataset.splitReady = "true";
      el.classList.add("split-ready");
      var words = text.split(/\s+/);
      var lines = [];
      for (var i = 0; i < words.length; i += 3) {
        lines.push(words.slice(i, i + 3).join(" "));
      }
      el.innerHTML = lines.map(function (line, index) {
        return '<span class="split-line" style="--line-index:' + index + '"><span>' + line + '</span></span>';
      }).join(" ");
      if (!el.hasAttribute("data-reveal")) {
        el.setAttribute("data-reveal", "");
        revealEls.push(el);
      }
    });
  }

  splitRevealText();

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
     3b. Scroll parallax accents
     ====================================================================== */
  var parallaxEls = Array.prototype.slice.call(document.querySelectorAll(".hero-panel, .svc-panel"));
  parallaxEls.forEach(function (el) { el.classList.add("parallax-float"); });
  if (!reduced && parallaxEls.length) {
    var ticking = false;
    var updateParallax = function () {
      parallaxEls.forEach(function (el, index) {
        var rect = el.getBoundingClientRect();
        var mid = rect.top + rect.height / 2 - window.innerHeight / 2;
        el.style.setProperty("--parallax-y", String(Math.max(-18, Math.min(18, mid * -0.035 + index * 2))));
      });
      ticking = false;
    };
    window.addEventListener("scroll", function () {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(updateParallax);
      }
    }, { passive: true });
    updateParallax();
  }

  /* ======================================================================
     3c. Animated stat counters
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
     3d. FAQ accordion (accessible, animated max-height)
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
