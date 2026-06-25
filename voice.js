/* ==========================================================================
   Winograd - voice.js
   Wires up the two live demos in the "What we do" section:

     1. "Try it out" on the AI Chat Assistant card -> opens the existing
        chat widget built by chat.js (does NOT rebuild it).

     2. "Try it out" on the AI Voice Agent card -> lazy-loads the Retell
        hosted orb in an iframe, ONLY on click, so the orb never auto-
        connects and burns call minutes for ordinary page visitors.

   Cost controls (read this before changing limits):
     (a) The launch limit below is CLIENT-SIDE ONLY. It lives in
         localStorage and can be bypassed by clearing storage or using a
         private window. It is a courtesy throttle, not real security.
     (b) Per-call DURATION is NOT controlled here. The orb is a cross-origin
         iframe, so we can only limit how often it is LAUNCHED from this
         page - not what happens inside it. Cap call length inside Retell
         via max_call_duration_ms on the agent.
     (c) The stronger fix is a SERVER-SIDE limit (e.g. per-IP) that we don't
         have on static GitHub Pages. Add one if abuse becomes a problem.
   ========================================================================== */
(function () {
  "use strict";

  /* ── Retell orb embed ─────────────────────────────────────────────────
     If you paste a full <iframe>/<script> snippet from your Retell
     dashboard, drop it in instead of using ORB_URL (set ORB_EMBED_HTML to
     that snippet's markup). Otherwise we build the iframe from ORB_URL.    */
  var ORB_URL = "https://agent.retellai.com/orb/agent_8a3b6a08363c83a942ae4c1ab7?token=f9dd6f728161dd549a34cd8514410e23";

  /* ── Launch rate limit ──────────────────────────────────────────────── */
  var MAX_LAUNCHES = 5;                       // voice-demo launches allowed...
  var WINDOW_MS = 24 * 60 * 60 * 1000;        // ...per rolling 24-hour window
  var STORE_KEY = "winograd_voice_launches";  // localStorage: array of timestamps
  var LOAD_TIMEOUT_MS = 12000;                // if the orb never loads, show fallback

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

  function isLimitReached() {
    return readLaunches().length >= MAX_LAUNCHES;
  }

  function recordLaunch() {
    var arr = readLaunches();
    arr.push(Date.now());
    writeLaunches(arr);
  }

  /* ── 2. Voice orb ─────────────────────────────────────────────────────── */
  function wireVoice() {
    var card = document.getElementById("voiceDemo");
    if (!card) return;

    var tryBtn = document.getElementById("voiceTry");
    var stage = document.getElementById("voiceStage");
    var orbWrap = document.getElementById("voiceOrbWrap");
    var closeBtn = document.getElementById("voiceClose");
    var fallback = document.getElementById("voiceFallback");
    var limitMsg = document.getElementById("voiceLimit");
    if (!tryBtn || !stage || !orbWrap || !closeBtn) return;

    var loadTimer = null;

    function showLimitState() {
      tryBtn.disabled = true;
      tryBtn.textContent = "Demo limit reached for today";
      if (limitMsg) limitMsg.hidden = false;
    }

    // Tear the iframe out of the DOM so the call fully terminates on close.
    function teardownOrb() {
      if (loadTimer) { window.clearTimeout(loadTimer); loadTimer = null; }
      orbWrap.innerHTML = "";          // removing the iframe ends the session
      stage.hidden = true;
      tryBtn.hidden = false;
    }

    function launchOrb() {
      if (isLimitReached()) { showLimitState(); return; }

      if (fallback) fallback.hidden = true;
      recordLaunch();

      var iframe = document.createElement("iframe");
      iframe.title = "Winograd AI voice agent";
      iframe.allow = "microphone";     // required for the mic inside the orb
      iframe.setAttribute("allowfullscreen", "");
      iframe.addEventListener("load", function () {
        if (loadTimer) { window.clearTimeout(loadTimer); loadTimer = null; }
      });

      orbWrap.innerHTML = "";
      orbWrap.appendChild(iframe);
      iframe.src = ORB_URL;            // set src LAST so load fires after listener

      stage.hidden = false;
      tryBtn.hidden = true;
      closeBtn.focus();

      // If the orb never loads, surface the fallback and reset.
      loadTimer = window.setTimeout(function () {
        teardownOrb();
        if (fallback) fallback.hidden = false;
        if (isLimitReached()) showLimitState();
      }, LOAD_TIMEOUT_MS);

      // We've used a launch; reflect the limit immediately if this was the last.
      if (isLimitReached()) showLimitState();
    }

    tryBtn.addEventListener("click", launchOrb);
    closeBtn.addEventListener("click", function () {
      teardownOrb();
      if (isLimitReached()) showLimitState();
      else tryBtn.focus();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !stage.hidden) teardownOrb();
    });

    // On load, if the visitor already hit the cap today, show it up front.
    if (isLimitReached()) showLimitState();
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
