# Design System: Winograd

Premium web-design agency for small and medium businesses (dentists, law firms,
med spas, contractors, professional and local services). The buyer is a
non-technical owner weighing a $2,000+ decision. The site must read as a serious
company, build instant trust, and convert visits into booked free consultations.

## 1. Visual Theme & Atmosphere

Stripe-clarity on a clean cool-white canvas, bookended by sophisticated
near-black hero, CTA, and footer sections that carry a Vercel/Linear developer
edge. Calm, confident, engineered. Generous cinematic spacing between sections.
Density airy-to-balanced (3-4), variance offset-asymmetric (6), motion fluid and
motivated (5). The feeling is "this team is precise and makes me money," never
loud or gimmicky.

## 2. Color Palette & Roles

- **Canvas** (#ffffff) and **Mist** (#f5f6f8) cool near-white, primary light surfaces
- **Panel** (#fbfcfd) raised light cards
- **Ink** (#0b0d13) near-black, primary text and the dark sections base
- **Ink Deep** (#07080d) deepest dark, footer
- **Slate** (#454b59) secondary text on light
- **Mute** (#7b8190) tertiary text, captions
- **Line** (#e7e9ee) hairline borders on light
- **Cobalt** (#2f54e6) the single accent: CTAs, links, active states, focus rings. Used FLAT, never as a neon glow. Saturation kept in check.
- **Navy** (#1a2d5a) committed brand depth, used for gradients and dark sections
- **Brand mark** the two-tone leaf logo pairs a bright blue (#1d7df5) with a warm coral (#f15a35); reserved for the logo only, not used elsewhere as accents
- On dark: text #eef1f7, soft #aab3c6, faint #6f7894, hairline rgba(255,255,255,.10)
- **Signal Green** (#2fbf71) reserved strictly for genuine "live/positive" status dots, nothing decorative

Banned: AI-purple, neon/outer glows, gradient text, warm cream/beige, more than one accent.

## 3. Typography

- **Display:** Cabinet Grotesk (Fontshare) 500-800. Track-tight, weight-driven hierarchy, never screaming. clamp() max around 5rem.
- **Body / UI:** Geist (Google Fonts) 400-600. Relaxed leading, 65-72ch max line length.
- **Mono accents:** Geist Mono / JetBrains Mono for small labels, code-like chips, and the developer-credibility touch. Used sparingly.
- Banned: Inter as default, generic serifs (Times/Georgia), Fraunces. No all-caps body.

## 4. Components

- **Buttons:** radius 10px. Primary = cobalt fill, white text (contrast verified). On dark, primary = white fill / ink text. Tactile 1px push on active, subtle lift on hover. No glow. Labels max 3 words, never wrap at desktop.
- **Cards:** radius 16-20px, 1px Line border, background-tinted diffusion shadow. Used only where elevation earns it; otherwise hairline dividers and negative space. No nested cards.
- **Bento:** gapless rhythm, exact cell count, varied cell sizes and backgrounds (at least one image cell, one dark cell). grid-auto-flow dense.
- **Inputs:** label above, error below, cobalt focus ring. No placeholder-as-label.
- **Mockups:** real images inside clean browser-frame chrome to show website craft. Never div-based fake dashboards.

## 5. Layout

- Max container ~1200px, narrow content ~720px.
- Asymmetric heroes (no dead-centered H1). 2-line headline iron rule.
- No three-equal-card feature rows; vary every section's layout family (4+ families across the page).
- CSS Grid for 2D, flex for 1D. Single-column collapse below 760px. Zero horizontal scroll.
- Floating sticky nav, single line, height <= 72px.

## 6. Motion

- Reveal-on-scroll (opacity + small rise), staggered. Hero entrance. Stat count-up. One marquee max (trust strip). Button hover lift. Browser-frame mockups parallax-lift subtly.
- ease-out cubic-bezier(0.16,1,0.3,1). transform/opacity only. Reveals enhance an already-visible default (never gate content).
- Full `prefers-reduced-motion` fallbacks: instant, no loops.

## 7. Anti-patterns (banned)

No emojis. No Inter/Fraunces. No pure black. No AI-purple or neon glow. No gradient
text. No three equal cards. No cheap meta-labels ("Section 01", "Question 05",
numbered eyebrows). No eyebrow above every heading (max 1 per 3 sections). No em or
en dashes anywhere visible (hyphens only). No fake div screenshots. No generic
names/Acme/filler verbs ("elevate, seamless, unleash"). No scroll cues. No custom
cursor. One accent, locked across the whole page.
