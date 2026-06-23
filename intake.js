/* ==========================================================================
   Winograd - intake.js
   Multi-step project intake form. Opens as a full-screen modal.

   Setup:
     1. Set STRIPE_URL below to your Stripe payment link.
     2. Any element with data-intake opens this modal automatically.

   After submission, form data is saved to localStorage and the client
   is redirected to Stripe. On the success page, a summary is shown.
   ========================================================================== */
(function () {
  "use strict";

  /* ── Config ──────────────────────────────────────────────────────────────*/
  var STRIPE_URL = "#"; // Replace: https://buy.stripe.com/YOUR_LINK

  var INDUSTRIES = [
    "Dental practice",
    "Law firm",
    "Med spa",
    "Contractor / Tradesperson",
    "Professional services",
    "Restaurant / Food service",
    "Retail / E-commerce",
    "Healthcare / Medical",
    "Fitness / Wellness",
    "Other"
  ];

  var GOALS = [
    "Generate more leads",
    "Get more phone calls",
    "Increase bookings",
    "Improve credibility",
    "Sell products / services"
  ];

  var NEEDS = [
    "Custom website design",
    "AI chatbot",
    "Lead capture forms",
    "Booking system",
    "SEO setup",
    "Analytics",
    "Other"
  ];

  /* ── State ───────────────────────────────────────────────────────────────*/
  var overlay = null;
  var currentStep = 0;
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ── Tiny helpers ────────────────────────────────────────────────────────*/
  function qs(sel, ctx) { return (ctx || document).querySelector(sel); }
  function qsa(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }

  /* ── HTML builders ───────────────────────────────────────────────────────*/
  function optionsHTML() {
    var out = '<option value="" disabled selected>Select your industry</option>';
    INDUSTRIES.forEach(function (ind) {
      out += '<option value="' + ind + '">' + ind + "</option>";
    });
    return out;
  }

  function radiosHTML() {
    return GOALS.map(function (g) {
      return (
        '<label class="form-radio-item">' +
        '<input type="radio" name="goal" value="' + g + '" required>' +
        "<span>" + g + "</span>" +
        "</label>"
      );
    }).join("");
  }

  function checksHTML() {
    return NEEDS.map(function (n) {
      return (
        '<label class="form-check-item">' +
        '<input type="checkbox" name="needs" value="' + n + '">' +
        "<span>" + n + "</span>" +
        "</label>"
      );
    }).join("");
  }

  var ARROW_SVG = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M13 6l6 6-6 6"/></svg>';

  function step1HTML() {
    return [
      '<div class="intake-step" data-step="0">',
        '<div class="intake-step-head">',
          '<p class="intake-step-eyebrow">About your business</p>',
          '<h2 class="intake-step-title">Let us get to know you.</h2>',
        "</div>",
        '<div class="intake-fields">',
          '<div class="form-row form-row-2">',
            '<div class="form-field">',
              '<label class="form-label" for="f-biz-name">Business name <span class="req">*</span></label>',
              '<input class="form-input" id="f-biz-name" name="bizName" type="text" placeholder="Sunrise Dental" autocomplete="organization" required />',
            "</div>",
            '<div class="form-field">',
              '<label class="form-label" for="f-industry">Industry <span class="req">*</span></label>',
              '<select class="form-input form-select" id="f-industry" name="industry" required>' + optionsHTML() + "</select>",
            "</div>",
          "</div>",
          '<div class="form-row form-row-2">',
            '<div class="form-field">',
              '<label class="form-label" for="f-location">Business location <span class="req">*</span></label>',
              '<input class="form-input" id="f-location" name="location" type="text" placeholder="Austin, TX" required />',
            "</div>",
            '<div class="form-field">',
              '<label class="form-label" for="f-url">Current website <span class="form-hint">optional</span></label>',
              '<input class="form-input" id="f-url" name="url" type="url" placeholder="https://yoursite.com" />',
            "</div>",
          "</div>",
          '<div class="form-row form-row-3">',
            '<div class="form-field">',
              '<label class="form-label" for="f-contact-name">Your name <span class="req">*</span></label>',
              '<input class="form-input" id="f-contact-name" name="contactName" type="text" placeholder="Sarah Mitchell" autocomplete="name" required />',
            "</div>",
            '<div class="form-field">',
              '<label class="form-label" for="f-email">Email address <span class="req">*</span></label>',
              '<input class="form-input" id="f-email" name="email" type="email" placeholder="you@yourbusiness.com" autocomplete="email" required />',
            "</div>",
            '<div class="form-field">',
              '<label class="form-label" for="f-phone">Phone number <span class="req">*</span></label>',
              '<input class="form-input" id="f-phone" name="phone" type="tel" placeholder="(512) 555-0182" autocomplete="tel" required />',
            "</div>",
          "</div>",
        "</div>",
      "</div>"
    ].join("");
  }

  function step2HTML() {
    return [
      '<div class="intake-step" data-step="1">',
        '<div class="intake-step-head">',
          '<p class="intake-step-eyebrow">Your goals</p>',
          '<h2 class="intake-step-title">What should your website do?</h2>',
        "</div>",
        '<div class="intake-fields">',
          '<div class="form-field">',
            '<label class="form-label">Primary goal <span class="req">*</span></label>',
            '<div class="form-radio-group" id="goalGroup">' + radiosHTML() + "</div>",
          "</div>",
          '<div class="form-field">',
            '<label class="form-label" for="f-problems">Current website problems <span class="form-hint">optional</span></label>',
            '<textarea class="form-input form-textarea" id="f-problems" name="problems" placeholder="Loads slowly, looks outdated, not getting any calls from it..." rows="3"></textarea>',
          "</div>",
          '<div class="form-field">',
            '<label class="form-label">What do you need? <span class="form-hint">select all that apply</span></label>',
            '<div class="form-check-group">' + checksHTML() + "</div>",
          "</div>",
        "</div>",
      "</div>"
    ].join("");
  }

  function step3HTML() {
    return [
      '<div class="intake-step" data-step="2">',
        '<div class="intake-step-head">',
          '<p class="intake-step-eyebrow">Your business details</p>',
          '<h2 class="intake-step-title">Help us build your AI assistant.</h2>',
        "</div>",
        '<div class="intake-fields">',
          '<div class="form-row form-row-2">',
            '<div class="form-field">',
              '<label class="form-label" for="f-description">Describe your business <span class="req">*</span></label>',
              '<textarea class="form-input form-textarea" id="f-description" name="description" placeholder="We are a family dental practice in Austin, TX, serving the community since 2008..." rows="4" required></textarea>',
            "</div>",
            '<div class="form-field">',
              '<label class="form-label" for="f-services">Services you offer <span class="req">*</span></label>',
              '<textarea class="form-input form-textarea" id="f-services" name="services" placeholder="General dentistry, cosmetic dentistry, emergency dental care, teeth whitening..." rows="4" required></textarea>',
            "</div>",
          "</div>",
          '<div class="form-row form-row-2">',
            '<div class="form-field">',
              '<label class="form-label" for="f-faqs">Common questions you get <span class="form-hint">optional</span></label>',
              '<textarea class="form-input form-textarea" id="f-faqs" name="faqs" placeholder="Do you accept insurance? What are your hours? Do you offer payment plans?..." rows="4"></textarea>',
            "</div>",
            '<div class="form-field">',
              '<div class="form-nested">',
                '<div class="form-nested-item">',
                  '<label class="form-label" for="f-hours">Business hours <span class="form-hint">optional</span></label>',
                  '<input class="form-input" id="f-hours" name="hours" type="text" placeholder="Mon - Fri 9am - 5pm, Sat 10am - 2pm" />',
                "</div>",
                '<div class="form-nested-item">',
                  '<label class="form-label" for="f-pricing-info">Pricing information <span class="form-hint">optional</span></label>',
                  '<textarea class="form-input form-textarea" id="f-pricing-info" name="pricingInfo" placeholder="Consultation free, cleanings from $150, whitening from $400..." rows="3"></textarea>',
                "</div>",
              "</div>",
            "</div>",
          "</div>",
          '<div class="intake-asset-note">',
            '<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;margin-top:1px"><path d="M13 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V9z"/><path d="M13 2v7h7"/></svg>',
            "<p>Brand assets (logo, photos, existing materials) will be collected during onboarding after your project is confirmed. You can email them at any time with your business name in the subject line.</p>",
          "</div>",
        "</div>",
      "</div>"
    ].join("");
  }

  function modalHTML() {
    return [
      '<div class="intake-backdrop" id="intakeBackdrop"></div>',
      '<div class="intake-modal" role="document">',

        '<button class="intake-close" id="intakeClose" aria-label="Close">',
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" width="18" height="18"><path d="M18 6L6 18M6 6l12 12"/></svg>',
        "</button>",

        '<div class="intake-top">',
          '<div class="intake-branding">',
            '<img class="logo-mark" src="logo.png" alt="" height="22" />',
            '<span class="intake-brand-name">Winograd</span>',
          "</div>",
          '<div class="intake-progress">',
            '<div class="progress-track"><div class="progress-fill" id="progressFill"></div></div>',
            '<span class="progress-label" id="progressLabel">Step 1 of 3</span>',
          "</div>",
        "</div>",

        '<div class="intake-body" id="intakeBody">',
          step1HTML(),
          step2HTML(),
          step3HTML(),
        "</div>",

        '<div class="intake-foot">',
          '<button class="btn btn-ghost intake-btn-back" id="intakeBack" type="button" style="visibility:hidden">Back</button>',
          '<button class="btn btn-primary intake-btn-next" id="intakeNext" type="button">',
            "Continue " + ARROW_SVG,
          "</button>",
        "</div>",

      "</div>"
    ].join("");
  }

  /* ── Build overlay ───────────────────────────────────────────────────────*/
  function buildModal() {
    var wrap = document.createElement("div");
    wrap.id = "intakeOverlay";
    wrap.className = "intake-overlay";
    wrap.setAttribute("role", "dialog");
    wrap.setAttribute("aria-modal", "true");
    wrap.setAttribute("aria-label", "Start your website project");
    wrap.innerHTML = modalHTML();
    document.body.appendChild(wrap);
    return wrap;
  }

  /* ── Step management ─────────────────────────────────────────────────────*/
  function updateProgress(stepIndex) {
    var fill = qs("#progressFill", overlay);
    var label = qs("#progressLabel", overlay);
    if (fill) fill.style.width = Math.round(((stepIndex + 1) / 3) * 100) + "%";
    if (label) label.textContent = "Step " + (stepIndex + 1) + " of 3";
  }

  function updateButtons(stepIndex) {
    var backBtn = qs("#intakeBack", overlay);
    var nextBtn = qs("#intakeNext", overlay);
    if (!backBtn || !nextBtn) return;
    backBtn.style.visibility = stepIndex === 0 ? "hidden" : "visible";
    if (stepIndex === 2) {
      nextBtn.innerHTML = "Start My Project " + ARROW_SVG;
    } else {
      nextBtn.innerHTML = "Continue " + ARROW_SVG;
    }
    nextBtn.disabled = false;
  }

  function switchStep(newStep) {
    var body = qs("#intakeBody", overlay);
    if (!body) return;
    var duration = reduced ? 0 : 130;

    body.style.transition = duration ? "opacity " + duration + "ms ease" : "none";
    body.style.opacity = "0";

    setTimeout(function () {
      qsa(".intake-step", overlay).forEach(function (s) { s.classList.remove("is-active"); });
      var target = qs('[data-step="' + newStep + '"]', overlay);
      if (target) target.classList.add("is-active");
      updateProgress(newStep);
      updateButtons(newStep);
      currentStep = newStep;

      var modal = qs(".intake-modal", overlay);
      if (modal) modal.scrollTop = 0;

      body.style.opacity = "1";
    }, duration);
  }

  /* ── Validation ──────────────────────────────────────────────────────────*/
  function clearErrors(ctx) {
    qsa(".form-error", ctx).forEach(function (e) { e.remove(); });
    qsa(".has-error", ctx).forEach(function (f) { f.classList.remove("has-error"); });
  }

  function addError(field, msg) {
    field.classList.add("has-error");
    var p = document.createElement("p");
    p.className = "form-error";
    p.textContent = msg;
    field.parentNode.appendChild(p);
  }

  function validateStep(stepIndex) {
    var stepEl = qs('[data-step="' + stepIndex + '"]', overlay);
    if (!stepEl) return true;
    clearErrors(stepEl);
    var valid = true;
    var firstInvalid = null;

    qsa("input[required], select[required], textarea[required]", stepEl).forEach(function (f) {
      if (f.type === "radio") return;
      var val = f.tagName === "SELECT" ? f.value : f.value.trim();
      if (!val) {
        addError(f, "This field is required.");
        valid = false;
        if (!firstInvalid) firstInvalid = f;
      }
    });

    if (stepIndex === 1) {
      var anyChecked = qsa('[name="goal"]:checked', stepEl).length > 0;
      if (!anyChecked) {
        var groupEl = qs("#goalGroup", stepEl);
        if (groupEl) {
          var p = document.createElement("p");
          p.className = "form-error";
          p.textContent = "Please select your primary goal.";
          groupEl.appendChild(p);
        }
        valid = false;
      }
    }

    if (firstInvalid) firstInvalid.focus();
    return valid;
  }

  /* ── Submit ──────────────────────────────────────────────────────────────*/
  function submitForm() {
    var nextBtn = qs("#intakeNext", overlay);
    if (nextBtn) {
      nextBtn.disabled = true;
      nextBtn.innerHTML = '<span class="intake-spinner"></span> Preparing checkout...';
    }

    var data = {};
    qsa("input[name], select[name], textarea[name]", overlay).forEach(function (f) {
      if (f.type === "checkbox") {
        if (!data[f.name]) data[f.name] = [];
        if (f.checked) data[f.name].push(f.value);
      } else if (f.type === "radio") {
        if (f.checked) data[f.name] = f.value;
      } else {
        var v = f.value.trim();
        if (v) data[f.name] = v;
      }
    });

    try { localStorage.setItem("winogradIntake", JSON.stringify(data)); } catch (e) {}

    setTimeout(function () {
      window.location.href = (STRIPE_URL && STRIPE_URL !== "#") ? STRIPE_URL : "success.html";
    }, 1400);
  }

  /* ── Open / Close ────────────────────────────────────────────────────────*/
  function openModal() {
    if (!overlay) return;
    overlay.classList.add("is-open");
    document.body.style.overflow = "hidden";
    setTimeout(function () {
      var first = qs(".intake-step.is-active input, .intake-step.is-active select", overlay);
      if (first) first.focus();
    }, 280);
  }

  function closeModal() {
    if (!overlay) return;
    overlay.classList.remove("is-open");
    document.body.style.overflow = "";

    setTimeout(function () {
      qsa("input, textarea", overlay).forEach(function (f) {
        if (f.type === "checkbox" || f.type === "radio") { f.checked = false; }
        else { f.value = ""; }
      });
      qsa("select", overlay).forEach(function (s) { s.selectedIndex = 0; });
      qsa(".form-error", overlay).forEach(function (e) { e.remove(); });
      qsa(".has-error", overlay).forEach(function (f) { f.classList.remove("has-error"); });

      var nextBtn = qs("#intakeNext", overlay);
      if (nextBtn) { nextBtn.disabled = false; nextBtn.innerHTML = "Continue " + ARROW_SVG; }

      var body = qs("#intakeBody", overlay);
      if (body) { body.style.opacity = "1"; body.style.transition = "none"; }

      qsa(".intake-step", overlay).forEach(function (s) { s.classList.remove("is-active"); });
      var firstStep = qs('[data-step="0"]', overlay);
      if (firstStep) firstStep.classList.add("is-active");

      updateProgress(0);
      var backBtn = qs("#intakeBack", overlay);
      if (backBtn) backBtn.style.visibility = "hidden";
      currentStep = 0;
    }, 260);
  }

  /* ── Wire events ─────────────────────────────────────────────────────────*/
  function wireEvents() {
    var closeBtn = qs("#intakeClose", overlay);
    if (closeBtn) closeBtn.addEventListener("click", closeModal);

    var backdrop = qs("#intakeBackdrop", overlay);
    if (backdrop) backdrop.addEventListener("click", closeModal);

    var backBtn = qs("#intakeBack", overlay);
    if (backBtn) {
      backBtn.addEventListener("click", function () {
        if (currentStep > 0) switchStep(currentStep - 1);
      });
    }

    var nextBtn = qs("#intakeNext", overlay);
    if (nextBtn) {
      nextBtn.addEventListener("click", function () {
        if (!validateStep(currentStep)) return;
        if (currentStep < 2) {
          switchStep(currentStep + 1);
        } else {
          submitForm();
        }
      });
    }

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && overlay && overlay.classList.contains("is-open")) closeModal();
    });
  }

  /* ── Init ────────────────────────────────────────────────────────────────*/
  function init() {
    var triggers = document.querySelectorAll("[data-intake]");
    if (!triggers.length) return;

    overlay = buildModal();
    wireEvents();

    var firstStep = qs('[data-step="0"]', overlay);
    if (firstStep) firstStep.classList.add("is-active");
    updateProgress(0);

    triggers.forEach(function (btn) {
      btn.addEventListener("click", function (e) {
        e.preventDefault();
        openModal();
      });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
