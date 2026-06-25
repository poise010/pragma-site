/* ==========================================================================
   Winograd - voice.js
   Wires up the two live demos in the "What we do" section:

     1. "Try it out" on the AI Chat Assistant card -> opens the existing
        chat widget built by chat.js (does NOT rebuild it).

     2. "Try it out" on the AI Voice Agent card -> opens Retell's OFFICIAL
        voice widget (loaded by the retell-widget-v2.js <script> in
        index.html). That widget runs on our own origin, so the browser's
        native microphone permission prompt works, and it renders Retell's
        own themeable orb (no white cross-origin iframe). We keep the card
        button as the single, gated entry point and hide the widget's own
        floating launcher for a consistent UI.

   Cost controls (read before changing limits):
     (a) The launch limit below is CLIENT-SIDE ONLY. It lives in
         localStorage and can be bypassed by clearing storage or using a
         private window. It is a courtesy throttle, not real security.
     (b) Per-call DURATION is NOT controlled here. Cap call length inside
         Retell via max_call_duration_ms on the agent.
     (c) The stronger fix is a SERVER-SIDE limit (e.g. per-IP), which we
         don't have on static hosting. Add one if abuse becomes a problem.
   ========================================================================== */
(function () {
  "use strict";

  /* ── Launch rate limit ──────────────────────────────────────────────── */
  var MAX_LAUNCHES = 5;                       // voice-demo opens allowed...
  var WINDOW_MS = 24 * 60 * 60 * 1000;        // ...per rolling 24-hour window
  var STORE_KEY = "winograd_voice_launches";  // localStorage: array of timestamps

  /* How long to wait for Retell's widget to inject its launcher before we
     decide it failed to load and show the fallback message. */
  var WIDGET_WAIT_MS = 12000;

  /* The Retell widget injects its own floating launcher into the page. We
     don't control its markup, so we match it defensively by id/class. If
     Retell changes their DOM and the button stops opening, update this. */
  var RETELL_LAUNCHER_SELECTOR =
    '[id*="retell" i] button, button[class*="retell" i], [class*="retell" i] button, ' +
    '[id*="retell" i][role="button"], [class*="retell" i][role="button"]';

  /* ── 1. Chat "Try it out" -> open the existing chat widget ──────────── */
  function wireChatButtons() {
    var btns = document.querySelectorAll("[data-open-chat]");
    if (!btns.length) return;
    btns.forEach(function (btn) {
      btn.addEventListener("click", function () {
        var launcher = document.querySelector(".chat-launcher");
        if (!launcher) return;
        // chat.js toggles open on click; only click if it isn't already open.
        if (!launcher.classList.contains("is-open")) launcher.click();
        launcher.scrollIntoView({ block: "nearest" });
      });
    });
  }

  /* ── localStorage helpers (defensive: storage can throw or be disabled) ─ */
  function readLaunches() {
    try {
      var raw = window.localStorage.getItem(STORE_KEY);
      var arr = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(arr)) arr = [];
      var cutoff = Date.now() - WINDOW_MS;
      return arr.filter(function (t) { return typeof t === "number" && t > cutoff; });
    } catch (e) {
      return [];
    }
  }
  function writeLaunches(arr) {
    try { window.localStorage.setItem(STORE_KEY, JSON.stringify(arr)); } catch (e) {}
  }
  function isLimitReached() { return readLaunches().length >= MAX_LAUNCHES; }
  function recordLaunch() {
    var arr = readLaunches();
    arr.push(Date.now());
    writeLaunches(arr);
  }

  /* ── 2. Voice agent (Retell official widget) ──────────────────────────── */
  function wireVoice() {
    var card = document.getElementById("voiceDemo");
    if (!card) return;

    var tryBtn = document.getElementById("voiceTry");
    var fallback = document.getElementById("voiceFallback");
    var limitMsg = document.getElementById("voiceLimit");
    if (!tryBtn) return;

    var launcherEl = null;   // Retell's own launcher, once found
    var resolved = false;    // have we located the widget launcher yet?

    function showLimitState() {
      tryBtn.disabled = true;
      tryBtn.textContent = "Demo limit reached for today";
      if (limitMsg) limitMsg.hidden = false;
    }

    function showFallback() {
      tryBtn.disabled = true;
      if (fallback) fallback.hidden = false;
    }

    // Hide Retell's floating launcher without removing it: element.click()
    // still works on it even with pointer-events:none, so our card button
    // stays the only visible entry point.
    function hideNativeLauncher(el) {
      var host = el.closest('[id*="retell" i], [class*="retell" i]') || el;
      host.style.setProperty("opacity", "0", "important");
      host.style.setProperty("pointer-events", "none", "important");
      host.setAttribute("aria-hidden", "true");
    }

    // Poll for the widget's launcher (it injects asynchronously after the
    // module script loads). Resolve once, then enable our button.
    function findLauncher(deadline) {
      var el = document.querySelector(RETELL_LAUNCHER_SELECTOR);
      if (el) {
        resolved = true;
        launcherEl = el;
        hideNativeLauncher(el);
        if (isLimitReached()) showLimitState();   // reflect cap up front
        return;
      }
      if (Date.now() >= deadline) {
        // Widget never appeared (blocked, bad key, or load failure).
        showFallback();
        return;
      }
      window.setTimeout(function () { findLauncher(deadline); }, 350);
    }

    tryBtn.addEventListener("click", function () {
      if (isLimitReached()) { showLimitState(); return; }
      if (!resolved || !launcherEl) { showFallback(); return; }
      recordLaunch();
      launcherEl.click();        // opens Retell's orb; it handles mic + the call
      if (isLimitReached()) showLimitState();
    });

    findLauncher(Date.now() + WIDGET_WAIT_MS);
  }

  function init() {
    wireChatButtons();
    wireVoice();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
