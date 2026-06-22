# Winograd

Marketing site for **Winograd**, an AI client-capture automation agency for
immigration and personal injury law firms. Answer every lead, respond
instantly, and book more consultations 24/7.

Static site (no build step). Plain HTML, CSS, and vanilla JavaScript, deployable
by drag-and-drop to Cloudflare Pages, Netlify, GitHub Pages, or any static host.

## Structure

| File | Purpose |
|------|---------|
| `index.html` | Home page (hero, stats, problem, services, results, CTA) |
| `services.html` | Detailed services page |
| `styles.css` | All styling and design tokens |
| `script.js` | Nav, smooth scroll, reveal motion, stat counters, **booking link** |
| `chat.js` | Self-contained demo chat widget (no backend) |

## Configure before launch

1. **Booking link.** Open `script.js` and set `BOOKING_URL` to your **public**
   Calendly link (the one clients use, e.g.
   `https://calendly.com/your-name/consultation`). This single value updates
   every "Book Free Consultation" button on both pages and the chat widget.
   Do not use a `calendly.com/app/...` admin URL; visitors cannot book from it.

2. **Chat widget (optional swap).** `chat.js` is a self-contained demo. To use a
   real provider (Voiceflow, Intercom, etc.), remove the `chat.js` include at the
   bottom of each HTML file and paste the provider's embed snippet there instead.

## Local preview

Any static server works, for example:

```bash
python3 -m http.server 4321
```

Then open http://localhost:4321

## Deploy

Drag the project folder onto Cloudflare Pages (or connect this repo for
automatic deploys on every push). No build command and no output directory are
required.
