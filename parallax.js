/* ==========================================================================
   Winograd - parallax.js
   ---------------------------------------------------------------------------
   Cinematic, dependency-free depth + motion layered on top of the existing
   flat design. Native scrolling is left intact (no scroll hijack), so it stays
   accessible and smooth on mobile.

   What it does:
     1. Splits flagged headlines into words and reveals them from a clip mask.
     2. Runs a single requestAnimationFrame loop that eases transform offsets
        for any [data-px] (scroll parallax) or [data-float] (ambient drift)
        layer. Transform/opacity only -> GPU friendly, no layout thrash.
     3. Tracks a --fx-scroll variable for the ambient background field.

   Performance + accessibility:
     - prefers-reduced-motion: the whole engine bails, everything stays static.
     - IntersectionObserver gates work to on-screen layers only.
     - Parallax magnitude is dampened on small screens.
   Parallax hooks are kept separate from [data-reveal] elements so the two
   never fight over the same transform.
   ========================================================================== */
(function () {
  "use strict";

  var root = document.documentElement;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ----------------------------------------------------------------------
     1. Staggered text reveal (split headlines into words)
     ---------------------------------------------------------------------- */
  var splits = Array.prototype.slice.call(document.querySelectorAll("[data-split]"));

  function splitText(el) {
    if (el.dataset.splitDone) return;
    var tokens = el.textContent.split(/(\s+)/); // keep the whitespace tokens
    el.textContent = "";
    var i = 0;
    tokens.forEach(function (tok) {
      if (tok === "") return;
      if (/^\s+$/.test(tok)) { el.appendChild(document.createTextNode(tok)); return; }
      var word = document.createElement("span");
      word.className = "word";
      var inner = document.createElement("span");
      inner.textContent = tok;
      inner.style.setProperty("--d", (i * 55) + "ms");
      word.appendChild(inner);
      el.appendChild(word);
      i++;
    });
    el.dataset.splitDone = "1";
  }

  if (splits.length) {
    if (reduce) {
      // Leave headlines as plain, fully visible text.
    } else {
      splits.forEach(splitText);
      if ("IntersectionObserver" in window) {
        var splitIO = new IntersectionObserver(function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              entry.target.classList.add("is-revealed");
              splitIO.unobserve(entry.target);
            }
          });
        }, { threshold: 0.2, rootMargin: "0px 0px -6% 0px" });
        splits.forEach(function (el) { splitIO.observe(el); });
      } else {
        splits.forEach(function (el) { el.classList.add("is-revealed"); });
      }
    }
  }

  /* Reduced motion: no parallax at all. */
  if (reduce) return;

  /* ----------------------------------------------------------------------
     2. Parallax + float engine
     ---------------------------------------------------------------------- */
  var mobile = window.matchMedia("(max-width: 760px)").matches;
  var damp = mobile ? 0.5 : 1;

  var nodes = Array.prototype.slice.call(document.querySelectorAll("[data-px], [data-float]"));
  if (!nodes.length) return;

  var items = nodes.map(function (el) {
    el.style.willChange = "transform";
    return {
      el: el,
      speed: parseFloat(el.getAttribute("data-px")) || 0,
      amp: parseFloat(el.getAttribute("data-float")) || 0,
      freq: parseFloat(el.getAttribute("data-float-speed")) || 0.6,
      phase: Math.random() * Math.PI * 2,
      cur: 0,
      active: true
    };
  });

  if ("IntersectionObserver" in window) {
    var visIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        for (var i = 0; i < items.length; i++) {
          if (items[i].el === entry.target) { items[i].active = entry.isIntersecting; break; }
        }
      });
    }, { rootMargin: "25% 0px 25% 0px" });
    items.forEach(function (it) { visIO.observe(it.el); });
  }

  var winH = window.innerHeight;

  function setScrollVar() {
    var max = document.documentElement.scrollHeight - winH;
    root.style.setProperty("--fx-scroll", max > 0 ? (window.scrollY / max).toFixed(4) : "0");
  }
  window.addEventListener("resize", function () { winH = window.innerHeight; setScrollVar(); }, { passive: true });
  window.addEventListener("scroll", setScrollVar, { passive: true });
  setScrollVar();

  function lerp(a, b, n) { return a + (b - a) * n; }

  var start = performance.now();
  var paused = false;
  document.addEventListener("visibilitychange", function () { paused = document.hidden; });

  function frame(now) {
    if (!paused) {
      var t = (now - start) / 1000;
      for (var i = 0; i < items.length; i++) {
        var it = items[i];
        if (!it.active) continue;

        var ty = 0, tx = 0;
        if (it.speed) {
          var r = it.el.getBoundingClientRect();
          var center = r.top + r.height / 2;
          ty += -((center - winH / 2) * it.speed * damp);
        }
        if (it.amp) {
          ty += Math.sin(t * it.freq + it.phase) * it.amp * damp;
          tx += Math.cos(t * it.freq * 0.8 + it.phase) * it.amp * 0.4 * damp;
        }
        it.cur = lerp(it.cur, ty, 0.085);
        it.el.style.transform = "translate3d(" + tx.toFixed(2) + "px," + it.cur.toFixed(2) + "px,0)";
      }
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
