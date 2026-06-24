/* ==========================================================================
   Winograd - motion.js   (cinematic motion engine, ES module)
   --------------------------------------------------------------------------
   Full "tech-forward" motion layer. One rAF heartbeat drives everything:

     1.  Lenis smooth/inertia scroll (progressive enhancement, CDN ESM).
     2.  Multi-layer parallax depth + scroll-reactive ambient background.
     3.  Scroll-VELOCITY skew  - content leans into momentum, springs back.
     4.  Hero pointer 3D tilt  - the whole hero stage parallaxes to the cursor.
     5.  Hero <canvas> constellation - drifting nodes that react to pointer
         and scroll velocity (desktop only, paused offscreen / hidden tab).
     6.  Split-text headline    - word-by-word masked rise on first view.
     7.  Magnetic buttons       - primary CTAs pull toward the cursor.
     8.  3D tilt + spotlight cards (services / pricing).
     9.  Velocity-reactive industries marquee.
     10. Scroll progress bar + scroll-spy nav highlighting.

   Design rules honoured:
     - GPU only: transform / opacity / filter. Never layout properties.
     - One requestAnimationFrame loop. Geometry cached, recomputed on
       resize / load (no per-frame getBoundingClientRect in the hot path).
     - will-change toggled per element via IntersectionObserver.
     - Fully disabled under prefers-reduced-motion (content stays visible).
     - Lenis load failure degrades gracefully to native scroll.
     - Touch / coarse pointers skip pointer-only effects (tilt, magnetic,
       canvas) but keep parallax, skew, marquee, progress, reveals.
     - Inner-scroll surfaces (chat panel, intake modal) keep native scroll.
   ========================================================================== */
(function () {
  "use strict";

  var root = document.documentElement;
  var mqReduce = window.matchMedia("(prefers-reduced-motion: reduce)");
  var reduce = mqReduce.matches;
  var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  function forEach(list, fn) { Array.prototype.forEach.call(list, fn); }
  function clamp(v, lo, hi) { return v < lo ? lo : (v > hi ? hi : v); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function isMobile() { return window.innerWidth < 760; }

  /* ----------------------------------------------------------------------
     Reduced motion: neutralise any parallax transforms and bail. The base
     stylesheet already shows all content with a gentle crossfade, and
     script.js still toggles [data-reveal] visibility.
     ---------------------------------------------------------------------- */
  if (reduce) {
    forEach(document.querySelectorAll("[data-parallax]"), function (el) {
      el.style.transform = "";
      el.style.willChange = "auto";
    });
    var sp = document.querySelector(".scroll-progress");
    if (sp) sp.style.display = "none";
    return;
  }

  /* ---- Shared scroll / pointer / viewport state ------------------------- */
  var lenis = null;
  var vh = window.innerHeight;
  var scrollY = window.scrollY || 0;
  var lastY = scrollY;
  var velSmooth = 0;                 // smoothed scroll velocity (px/frame)
  var pointerX = window.innerWidth / 2;
  var pointerY = window.innerHeight / 2;
  var pageVisible = true;
  var NAV_OFFSET = 84;

  var fxBg = null;
  var progressFill = null;

  /* ---- Parallax layers -------------------------------------------------- */
  var items = [];                    // { el, speed, top, h, active }

  function measureParallax() {
    var sy = scrollY;
    for (var i = 0; i < items.length; i++) {
      var el = items[i].el;
      var prev = el.style.transform;
      el.style.transform = "";
      var r = el.getBoundingClientRect();
      el.style.transform = prev;
      items[i].top = r.top + sy;
      items[i].h = r.height;
    }
  }

  function collectParallax() {
    items = Array.prototype.map.call(
      document.querySelectorAll("[data-parallax]"),
      function (el) {
        return { el: el, speed: parseFloat(el.getAttribute("data-parallax")) || 0, top: 0, h: 0, active: false };
      }
    );
    measureParallax();
  }

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
      }, { rootMargin: "30% 0px 30% 0px" })
    : null;

  /* ---- Velocity skew layers -------------------------------------------- */
  var skewEls = [];
  var skewNow = 0;

  /* ---- Hero pointer tilt ----------------------------------------------- */
  var heroStage = null, heroVisual = null;
  var tiltRX = 0, tiltRY = 0, tiltTRX = 0, tiltTRY = 0;
  var heroInView = true;

  /* ---- Marquee --------------------------------------------------------- */
  var marquee = null, marqueeTrack = null, marqueeHalf = 0, marqueeOffset = 0;

  /* ---- Hero canvas constellation --------------------------------------- */
  var canvas = null, ctx = null, dpr = 1, particles = [], cw = 0, ch = 0;
  var canvasOn = false, canvasInView = false;

  /* ======================================================================
     PARALLAX + SKEW + PROGRESS + TILT + MARQUEE + CANVAS  - one render pass
     ====================================================================== */
  function frame(t) {
    if (lenis) lenis.raf(t);

    // velocity (smoothed) from the latest scroll position
    var instV = scrollY - lastY;
    lastY = scrollY;
    velSmooth = lerp(velSmooth, instV, 0.18);
    if (Math.abs(velSmooth) < 0.01) velSmooth = 0;

    // --- parallax depth ---
    var damp = isMobile() ? 0.5 : 1;
    for (var i = 0; i < items.length; i++) {
      var it = items[i];
      if (!it.active) continue;
      var center = it.top + it.h / 2;
      var progress = ((scrollY + vh / 2) - center) / vh;     // ~ -1 .. 1
      var ty = progress * it.speed * damp;
      it.el.style.transform = "translate3d(0," + ty.toFixed(2) + "px,0)";
    }

    // --- velocity skew (the satisfying momentum lean) ---
    if (skewEls.length) {
      var target = clamp(velSmooth * 0.085, -3.2, 3.2);       // deg
      skewNow = lerp(skewNow, target, 0.12);
      if (Math.abs(skewNow) < 0.003) skewNow = 0;
      var sv = skewNow.toFixed(3);
      for (var s = 0; s < skewEls.length; s++) {
        skewEls[s].style.transform = "skewY(" + sv + "deg)";
      }
    }

    // --- ambient background drift ---
    if (fxBg) {
      var dH = root.scrollHeight - vh;
      var pp = dH > 0 ? scrollY / dH : 0;
      fxBg.style.transform = "translate3d(" + (pp * -36).toFixed(1) + "px," + (pp * 120 - 40).toFixed(1) + "px,0)";
    }

    // --- scroll progress bar ---
    if (progressFill) {
      var dh2 = root.scrollHeight - vh;
      var sp2 = dh2 > 0 ? clamp(scrollY / dh2, 0, 1) : 0;
      progressFill.style.transform = "scaleX(" + sp2.toFixed(4) + ")";
    }

    // --- hero pointer tilt ---
    if (heroStage) {
      if (heroInView && finePointer) {
        tiltRX = lerp(tiltRX, tiltTRX, 0.08);
        tiltRY = lerp(tiltRY, tiltTRY, 0.08);
      } else {
        tiltRX = lerp(tiltRX, 0, 0.08);
        tiltRY = lerp(tiltRY, 0, 0.08);
      }
      heroStage.style.transform =
        "rotateX(" + tiltRX.toFixed(3) + "deg) rotateY(" + tiltRY.toFixed(3) + "deg)";
    }

    // --- velocity-reactive marquee ---
    if (marqueeTrack && marqueeHalf > 0) {
      var speed = 0.45 + Math.abs(velSmooth) * 0.12;          // px/frame
      marqueeOffset += speed;
      if (marqueeOffset >= marqueeHalf) marqueeOffset -= marqueeHalf;
      marqueeTrack.style.transform = "translate3d(" + (-marqueeOffset).toFixed(2) + "px,0,0)";
    }

    // --- hero canvas constellation ---
    if (canvasOn && canvasInView && pageVisible) drawCanvas();

    requestAnimationFrame(frame);
  }

  function onScroll(y) {
    scrollY = (typeof y === "number") ? y : (window.scrollY || 0);
  }

  /* ======================================================================
     LENIS smooth scroll  (progressive enhancement)
     ====================================================================== */
  function preventInner(node) {
    return !!(node && node.closest &&
      node.closest(".chat-panel, .chat-log, .intake-overlay, .intake-modal, [data-lenis-prevent]"));
  }

  function setupAnchors() {
    forEach(document.querySelectorAll('a[href^="#"]'), function (link) {
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
      setupAnchors();
    }).catch(function () {
      window.addEventListener("scroll", function () { onScroll(); }, { passive: true });
    });
  }

  /* ======================================================================
     SPLIT-TEXT HEADLINE  - masked, word-by-word rise on first reveal
     ====================================================================== */
  function splitHeadlines() {
    forEach(document.querySelectorAll("[data-split]"), function (title) {
      if (title.dataset.split === "done") return;
      var words = title.textContent.split(/(\s+)/);
      var frag = document.createDocumentFragment();
      var idx = 0;
      words.forEach(function (w) {
        if (w === "" ) return;
        if (/^\s+$/.test(w)) { frag.appendChild(document.createTextNode(" ")); return; }
        var word = document.createElement("span");
        word.className = "word";
        var inner = document.createElement("span");
        inner.className = "word-i";
        inner.textContent = w;
        inner.style.setProperty("--i", idx++);
        word.appendChild(inner);
        frag.appendChild(word);
      });
      title.textContent = "";
      title.appendChild(frag);
      title.classList.add("is-split");
      title.dataset.split = "done";
    });
  }

  /* ======================================================================
     MAGNETIC BUTTONS  - primary CTAs ease toward the cursor
     ====================================================================== */
  function initMagnetic() {
    if (!finePointer) return;
    forEach(document.querySelectorAll(".btn-primary, .btn-lg"), function (btn) {
      var pull = btn.classList.contains("btn-lg") ? 0.34 : 0.24;
      var max = btn.classList.contains("btn-lg") ? 12 : 7;
      btn.classList.add("is-magnetic");
      btn.addEventListener("pointermove", function (e) {
        var r = btn.getBoundingClientRect();
        var dx = clamp((e.clientX - (r.left + r.width / 2)) * pull, -max, max);
        var dy = clamp((e.clientY - (r.top + r.height / 2)) * pull, -max, max);
        btn.style.setProperty("--bx", dx.toFixed(1) + "px");
        btn.style.setProperty("--by", dy.toFixed(1) + "px");
      });
      btn.addEventListener("pointerleave", function () {
        btn.style.setProperty("--bx", "0px");
        btn.style.setProperty("--by", "0px");
      });
    });
  }

  /* ======================================================================
     3D TILT + SPOTLIGHT CARDS  - services & pricing
     ====================================================================== */
  function initCards() {
    if (!finePointer) return;
    forEach(document.querySelectorAll(".svc, .plan"), function (card) {
      card.classList.add("is-tilt");
      card.addEventListener("pointermove", function (e) {
        var r = card.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width;       // 0..1
        var py = (e.clientY - r.top) / r.height;       // 0..1
        card.style.setProperty("--mx", (px * 100).toFixed(1) + "%");
        card.style.setProperty("--my", (py * 100).toFixed(1) + "%");
        card.style.setProperty("--rx", ((0.5 - py) * 7).toFixed(2) + "deg");
        card.style.setProperty("--ry", ((px - 0.5) * 9).toFixed(2) + "deg");
      });
      card.addEventListener("pointerleave", function () {
        card.style.setProperty("--rx", "0deg");
        card.style.setProperty("--ry", "0deg");
      });
    });
  }

  /* ======================================================================
     SCROLL-SPY  - highlight the nav link for the section in view
     ====================================================================== */
  function initScrollSpy() {
    if (!("IntersectionObserver" in window)) return;
    var links = {};
    forEach(document.querySelectorAll(".nav-links a[href^='#']"), function (a) {
      var id = a.getAttribute("href").slice(1);
      if (id) links[id] = a;
    });
    var ids = Object.keys(links);
    if (!ids.length) return;
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          ids.forEach(function (id) { links[id].classList.remove("is-current"); });
          var active = links[en.target.id];
          if (active) active.classList.add("is-current");
        }
      });
    }, { rootMargin: "-45% 0px -50% 0px", threshold: 0 });
    ids.forEach(function (id) {
      var sec = document.getElementById(id);
      if (sec) spy.observe(sec);
    });
  }

  /* ======================================================================
     MARQUEE  - measure one group's width for seamless wrapping
     ====================================================================== */
  function initMarquee() {
    marquee = document.querySelector("[data-marquee]");
    if (!marquee) return;
    marqueeTrack = marquee.querySelector(".marquee-track");
    var group = marquee.querySelector(".marquee-group");
    if (!marqueeTrack || !group) { marquee = null; return; }
    marquee.classList.add("is-live");
    measureMarquee();
  }

  function measureMarquee() {
    if (!marquee) return;
    var group = marquee.querySelector(".marquee-group");
    if (group) marqueeHalf = group.getBoundingClientRect().width;
  }

  /* ======================================================================
     HERO CANVAS CONSTELLATION  - lightweight node field
     ====================================================================== */
  function initCanvas() {
    if (!finePointer || isMobile()) return;
    canvas = document.querySelector(".hero-canvas");
    if (!canvas || !canvas.getContext) return;
    ctx = canvas.getContext("2d");
    canvasOn = true;
    sizeCanvas();
    seedParticles();

    if ("IntersectionObserver" in window) {
      var cio = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) { canvasInView = e.isIntersecting; });
      }, { rootMargin: "10% 0px 10% 0px" });
      cio.observe(canvas);
    } else {
      canvasInView = true;
    }
  }

  function sizeCanvas() {
    if (!canvas) return;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    var r = canvas.getBoundingClientRect();
    cw = r.width; ch = r.height;
    canvas.width = Math.round(cw * dpr);
    canvas.height = Math.round(ch * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function seedParticles() {
    var count = clamp(Math.round((cw * ch) / 13000), 24, 60);
    particles = [];
    for (var i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * cw,
        y: Math.random() * ch,
        vx: (Math.random() - 0.5) * 0.22,
        vy: (Math.random() - 0.5) * 0.22,
        r: Math.random() * 1.3 + 0.6
      });
    }
  }

  function drawCanvas() {
    if (!ctx) return;
    ctx.clearRect(0, 0, cw, ch);

    // pointer mapped into canvas space
    var cr = canvas.getBoundingClientRect();
    var mx = pointerX - cr.left, my = pointerY - cr.top;
    var pointerNear = mx > -80 && mx < cw + 80 && my > -80 && my < ch + 80;

    var drift = clamp(velSmooth * 0.03, -1.2, 1.2);
    var LINK = 116, LINK2 = LINK * LINK;

    for (var i = 0; i < particles.length; i++) {
      var p = particles[i];
      p.x += p.vx;
      p.y += p.vy + drift * 0.25;

      // pointer repel for a touch of life
      if (pointerNear) {
        var ddx = p.x - mx, ddy = p.y - my;
        var d2 = ddx * ddx + ddy * ddy;
        if (d2 < 13000 && d2 > 0.5) {
          var f = (13000 - d2) / 13000 * 0.9;
          var inv = 1 / Math.sqrt(d2);
          p.x += ddx * inv * f;
          p.y += ddy * inv * f;
        }
      }

      // wrap
      if (p.x < -20) p.x = cw + 20; else if (p.x > cw + 20) p.x = -20;
      if (p.y < -20) p.y = ch + 20; else if (p.y > ch + 20) p.y = -20;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, 6.2832);
      ctx.fillStyle = "rgba(255,255,255,0.55)";
      ctx.fill();
    }

    // links between nearby nodes
    for (var a = 0; a < particles.length; a++) {
      var pa = particles[a];
      for (var b = a + 1; b < particles.length; b++) {
        var pb = particles[b];
        var dx = pa.x - pb.x, dy = pa.y - pb.y;
        var dd = dx * dx + dy * dy;
        if (dd < LINK2) {
          var alpha = (1 - dd / LINK2) * 0.16;
          ctx.strokeStyle = "rgba(255,255,255," + alpha.toFixed(3) + ")";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(pa.x, pa.y);
          ctx.lineTo(pb.x, pb.y);
          ctx.stroke();
        }
      }
      // links to pointer
      if (pointerNear) {
        var pdx = pa.x - mx, pdy = pa.y - my, pd = pdx * pdx + pdy * pdy;
        if (pd < 20000) {
          var pAlpha = (1 - pd / 20000) * 0.28;
          ctx.strokeStyle = "rgba(255,255,255," + pAlpha.toFixed(3) + ")";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(pa.x, pa.y);
          ctx.lineTo(mx, my);
          ctx.stroke();
        }
      }
    }
  }

  /* ======================================================================
     POINTER + HERO-IN-VIEW TRACKING
     ====================================================================== */
  function initPointer() {
    if (!finePointer) return;
    window.addEventListener("pointermove", function (e) {
      pointerX = e.clientX;
      pointerY = e.clientY;
      if (heroVisual && heroInView) {
        var r = heroVisual.getBoundingClientRect();
        var nx = (e.clientX - (r.left + r.width / 2)) / (r.width / 2);   // -1..1
        var ny = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);
        tiltTRY = clamp(nx, -1, 1) * 5.5;
        tiltTRX = clamp(-ny, -1, 1) * 5.5;
      }
    }, { passive: true });
  }

  /* ======================================================================
     BOOT
     ====================================================================== */
  function start() {
    fxBg = document.querySelector(".fx-bg");
    progressFill = document.querySelector(".scroll-progress > span");
    heroStage = document.querySelector(".hero-stage");
    heroVisual = document.querySelector(".hero-visual");
    skewEls = Array.prototype.slice.call(document.querySelectorAll("[data-skew]"));

    collectParallax();
    if (io) { items.forEach(function (it) { io.observe(it.el); }); }
    else    { items.forEach(function (it) { it.active = true; }); }

    // Hero visibility gate for tilt + pause work when hero scrolls away.
    if (heroVisual && "IntersectionObserver" in window) {
      var hio = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) { heroInView = e.isIntersecting; });
      }, { rootMargin: "0px" });
      hio.observe(heroVisual);
    }

    splitHeadlines();
    initPointer();
    initMagnetic();
    initCards();
    initScrollSpy();
    initMarquee();
    initCanvas();
    initLenis();
    onScroll();

    requestAnimationFrame(frame);

    var rt;
    window.addEventListener("resize", function () {
      clearTimeout(rt);
      rt = setTimeout(function () {
        vh = window.innerHeight;
        measureParallax();
        measureMarquee();
        if (canvasOn) { sizeCanvas(); seedParticles(); }
        onScroll();
      }, 150);
    }, { passive: true });

    document.addEventListener("visibilitychange", function () {
      pageVisible = !document.hidden;
    });

    window.addEventListener("load", function () {
      vh = window.innerHeight;
      measureParallax();
      measureMarquee();
      onScroll();
      setTimeout(function () { measureParallax(); measureMarquee(); onScroll(); }, 350);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();
