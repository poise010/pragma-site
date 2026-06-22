/* ==========================================================================
   Winograd - chat.js
   Self-contained DEMO chat widget. No backend, no account, no tracking.
   It shows prospects what an AI intake assistant feels like, using simple
   keyword matching with canned, on-brand replies.

   To replace this with a real bot (Voiceflow, Intercom, etc.) later:
     1. Delete the buildWidget() call at the bottom (or the whole file include).
     2. Paste your provider's embed snippet before </body>.
   The booking link below reuses the same value you set in script.js, so set
   it in ONE place (script.js) and the chat's "Book" buttons follow.
   ========================================================================== */
(function () {
  "use strict";

  // Pulls the live href that script.js wrote onto the booking buttons, so the
  // chat always points at the same place. Falls back to "#" until you set it.
  function bookingHref() {
    var b = document.querySelector("[data-book]");
    var href = b && b.getAttribute("href");
    return href && href.indexOf("http") === 0 ? href : "#";
  }

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ── Canned knowledge base (keyword -> reply) ───────────────────────── */
  var KB = [
    {
      keys: ["price", "cost", "pricing", "how much", "fee", "expensive", "afford", "budget"],
      reply: "Most projects start at $1,200 for a focused site and $2,400 for a complete site with AI systems. After a short call we send a fixed quote, so you know the full price before anything begins. Want to set up that call?",
      book: true
    },
    {
      keys: ["how long", "timeline", "time", "fast", "when", "weeks", "quick"],
      reply: "A Launch site is usually ready in two to three weeks. Larger Growth and Scale projects take a bit longer, and we give you a clear timeline up front."
    },
    {
      keys: ["website", "web design", "design", "redesign", "rebuild", "site"],
      reply: "We design fast, mobile-first websites built around your customers and your goals, with the copy written for you. The aim is simple: turn more visitors into booked appointments."
    },
    {
      keys: ["seo", "google", "search", "rank", "found", "traffic"],
      reply: "Our SEO work helps you get found by people already searching for what you offer in your area. We optimize your site and your Google Business Profile so nearby customers find you first."
    },
    {
      keys: ["chat", "chatbot", "ai chat", "assistant", "bot"],
      reply: "This is a quick demo of the AI chat assistant we build. A live one is trained on your business, answers questions in your voice, and books appointments around the clock."
    },
    {
      keys: ["form", "intake", "lead", "crm", "contact form"],
      reply: "We build smart intake forms that collect exactly what you need from a new lead and route it straight to your inbox or CRM, so follow-up is fast and organized."
    },
    {
      keys: ["convert", "conversion", "cro", "optimize", "more customers"],
      reply: "Conversion optimization means we test and refine your pages so more of the visitors you already get become paying customers. Small improvements that add up to real revenue."
    },
    {
      keys: ["dentist", "lawyer", "law", "med spa", "spa", "contractor", "roofer", "plumber", "industry", "business type"],
      reply: "Yes. We build for dentists, law firms, med spas, contractors, professional services, and local businesses. The approach is the same: a credible site that turns visitors into customers."
    },
    {
      keys: ["existing", "already have", "current site", "old site", "wordpress", "wix", "squarespace"],
      reply: "We will review your current site, keep what is working, and rebuild the rest. A lot of clients come to us for a refresh that finally turns their traffic into customers."
    },
    {
      keys: ["content", "copy", "write", "words", "text", "photos"],
      reply: "You do not have to write anything. We handle the copy based on our conversation and what works in your industry, and you approve it all before launch."
    },
    {
      keys: ["book", "consultation", "appointment", "schedule", "meeting", "demo", "talk", "call", "get started", "start"],
      reply: "Great. A free 30-minute consultation is the best next step. We will look at your business and give you a clear plan and price. No pressure.",
      book: true
    },
    {
      keys: ["human", "person", "agent", "real", "speak to someone", "team"],
      reply: "You are chatting with a demo assistant right now. The quickest way to reach the Winograd team is to book a short consultation, and we will take it from there.",
      book: true
    },
    {
      keys: ["hi", "hello", "hey", "good morning", "good afternoon"],
      reply: "Hi there. I can tell you how Winograd helps local businesses get more customers with a better website. What would you like to know?"
    },
    {
      keys: ["thanks", "thank you", "appreciate", "great", "awesome", "cool", "perfect"],
      reply: "Happy to help. Whenever you are ready, book a free consultation and we will map this out for your business."
    }
  ];

  var FALLBACK = "Good question. I am a quick demo, so the team can answer that best on a short call. In the meantime, I can tell you about our websites, SEO, AI chat, intake forms, or pricing. Or would you like to book a consultation?";

  var GREETING = "Hi, I am Winograd's assistant. I can show you how we help local businesses get more customers with a better website. Ask me anything, or pick an option below.";

  var QUICK = [
    "How does it work?",
    "What does it cost?",
    "Book a consultation"
  ];

  /* ── Build markup ───────────────────────────────────────────────────── */
  function el(tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }

  function buildWidget() {
    var ICON_CHAT = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>';
    var ICON_CLOSE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>';
    var ICON_SEND = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 2L11 13"/><path d="M22 2l-7 20-4-9-9-4 20-7z"/></svg>';
    var ICON_BOT = '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="8" width="16" height="11" rx="3"/><path d="M12 8V4M9 4h6"/><circle cx="9" cy="13.5" r="1"/><circle cx="15" cy="13.5" r="1"/></svg>';

    var launcher = el("button", "chat-launcher");
    launcher.setAttribute("aria-label", "Open chat");
    launcher.setAttribute("aria-expanded", "false");
    launcher.innerHTML =
      '<span class="open-ic">' + ICON_CHAT + '</span>' +
      '<span class="close-ic">' + ICON_CLOSE + '</span>' +
      '<span class="label">Chat with us</span>' +
      '<span class="nudge" aria-hidden="true"></span>';

    var panel = el("div", "chat-panel");
    panel.id = "winogradChat";
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-label", "Winograd chat");
    panel.innerHTML =
      '<div class="chat-header">' +
        '<div class="avatar">' + ICON_BOT + '</div>' +
        '<div class="meta"><strong>Winograd Assistant</strong><span>Online now</span></div>' +
      '</div>' +
      '<div class="chat-log" id="chatLog" aria-live="polite"></div>' +
      '<div class="chat-quick" id="chatQuick"></div>' +
      '<form class="chat-input" id="chatForm">' +
        '<input id="chatField" type="text" autocomplete="off" placeholder="Type your question..." aria-label="Type your message" />' +
        '<button type="submit" aria-label="Send message">' + ICON_SEND + '</button>' +
      '</form>' +
      '<p class="chat-disclaimer">Demo assistant. Book a call for a tailored quote.</p>';

    document.body.appendChild(panel);
    document.body.appendChild(launcher);

    var log = panel.querySelector("#chatLog");
    var quick = panel.querySelector("#chatQuick");
    var form = panel.querySelector("#chatForm");
    var field = panel.querySelector("#chatField");
    var started = false;

    function scrollDown() { log.scrollTop = log.scrollHeight; }

    function addMsg(text, who) {
      var m = el("div", "msg " + who);
      m.textContent = text;
      log.appendChild(m);
      scrollDown();
    }

    function addBookLine() {
      var href = bookingHref();
      var wrap = el("div", "msg bot");
      if (href === "#") {
        wrap.textContent = "Booking opens once the team's scheduling link is connected. Try again shortly.";
      } else {
        wrap.innerHTML = 'Pick a time here: <a href="' + href + '" target="_blank" rel="noopener" style="color:var(--brand-bright);font-weight:600;text-decoration:underline;">Book a free consultation</a>';
      }
      log.appendChild(wrap);
      scrollDown();
    }

    function showTyping() {
      var t = el("div", "chat-typing");
      t.id = "chatTyping";
      t.innerHTML = "<span></span><span></span><span></span>";
      log.appendChild(t);
      scrollDown();
      return t;
    }

    function botRespond(text) {
      var t = showTyping();
      var delay = reduced ? 250 : Math.min(1500, 500 + text.length * 12);
      window.setTimeout(function () {
        var typing = document.getElementById("chatTyping");
        if (typing) typing.remove();
        addMsg(text.reply, "bot");
        if (text.book) addBookLine();
      }, delay);
    }

    function match(input) {
      var q = input.toLowerCase();
      for (var i = 0; i < KB.length; i++) {
        for (var j = 0; j < KB[i].keys.length; j++) {
          if (q.indexOf(KB[i].keys[j]) !== -1) return KB[i];
        }
      }
      return { reply: FALLBACK, book: false };
    }

    function handleInput(text) {
      addMsg(text, "user");
      quick.innerHTML = "";
      botRespond(match(text));
    }

    function renderQuick() {
      quick.innerHTML = "";
      QUICK.forEach(function (label) {
        var b = el("button", null, label);
        b.type = "button";
        b.addEventListener("click", function () { handleInput(label); });
        quick.appendChild(b);
      });
    }

    function startConversation() {
      if (started) return;
      started = true;
      var t = showTyping();
      window.setTimeout(function () {
        var typing = document.getElementById("chatTyping");
        if (typing) typing.remove();
        addMsg(GREETING, "bot");
        renderQuick();
      }, reduced ? 200 : 650);
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var v = field.value.trim();
      if (!v) return;
      field.value = "";
      handleInput(v);
    });

    var open = false;
    function setOpen(state) {
      open = state;
      launcher.classList.toggle("is-open", open);
      launcher.classList.add("was-opened");
      launcher.setAttribute("aria-expanded", String(open));
      launcher.setAttribute("aria-label", open ? "Close chat" : "Open chat");
      panel.classList.toggle("is-open", open);
      if (open) {
        startConversation();
        window.setTimeout(function () { field.focus(); }, 320);
      }
    }

    launcher.addEventListener("click", function () { setOpen(!open); });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && open) setOpen(false);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", buildWidget);
  } else {
    buildWidget();
  }
})();
