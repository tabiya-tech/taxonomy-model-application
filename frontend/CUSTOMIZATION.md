# Frontend Customization Guide

This guide documents which parts of a Taxonomy Model App deployment can be customized: branding, logos,
colors, fonts, and landing page copy.

All customization is done through environment variables, set in `public/data/env.js` (see
[`env.example.js`](public/data/env.example.js) for a fully worked template with every key below). Every
variable is optional — if a variable is missing or empty, the application falls back to its default Tabiya
branding.

## App Name & Tab Title

- `FRONTEND_BROWSER_TAB_TITLE` — text shown in the browser tab. Defaults to "Taxonomy Model App".

## Logos & Icons

Place asset files in `frontend/public/` and reference them as `/filename.ext`, or use a full URL to an
externally hosted asset.

- `NAVBAR_LOGOS` — logo(s) shown in the navigation bar. A JSON array of `{ src, alt?, height?, width? }`
  objects, shown side by side. Leave unset to show the default Tabiya logo.
- `PARTNER_LOGOS` — logos shown in a "Developed in partnership with" footer on the landing page. Same shape
  as `NAVBAR_LOGOS`. No default — leave unset and the footer isn't rendered at all.
- `LOGO_URL` — the illustration shown on the 404 "page not found" screen.
- `FRONTEND_FAVICON_URL` — the browser tab icon.
- `FRONTEND_APP_ICON_URL` — the apple-touch-icon, used as the home-screen icon on mobile/PWA installs.

## Colors & Fonts

`FRONTEND_THEME_CSS_VARIABLES` is a single JSON object of CSS custom property values, applied to the
page's `:root` at runtime — no rebuild required. Any key can be omitted; an omitted key keeps its default
from [`src/styles/variables.css`](src/styles/variables.css).

Colors are space-separated RGB triplets, e.g. `"0 33 71"` for `#002147` (not a hex string).

- `brand-primary` (+ `-light`, `-dark`, `-contrast-text`) — primary action buttons and key interactive
  elements.
- `brand-secondary` (+ `-light`, `-dark`, `-contrast-text`) — secondary buttons, links, and accents.
- `text-primary` — headings and primary body text.
- `text-secondary` — secondary/muted body text.
- `text-accent` — subtitles and accent text.
- `font-heading` — used for headings (h1–h6). Defaults to `"IBM Plex Mono"`; `"Anton"` is also preloaded
  and ready to use.
- `font-body` — used for body text, buttons, subtitles, and captions. Defaults to `"Inter"`; `"Poppins"` is
  also preloaded and ready to use.

Choosing any other font family requires also adding its own `<link>` tag(s) to
[`public/index.html`](public/index.html) — setting the CSS variable alone doesn't load a new webfont.

MUI's semantic status colors (`error`, `warning`, `info`, `success`) and the neutral `grey` scale are fixed
regardless of deployment.

After changing colors, verify text contrast meets WCAG AA (4.5:1 for body text, 3:1 for large text) using
the [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/).

## Landing Page Copy

- `FRONTEND_LANDING_COPY` — a JSON object overriding the hero copy, all fields optional:
  - `eyebrow` — `{ text, color? }`, the small label above the hero heading (default text: "Inclusive
    Livelihoods Taxonomy"). `color` accepts any CSS color value; omit it to keep the default color.
  - `heading` — the hero heading (default: "Every form of work builds skills. We make them visible.").
  - `description` — the hero paragraph. The default text has bold emphasis on "seen economy"/"unseen
    economy"; an override loses that emphasis.
  - `ctaCaption` — the caption under the "Start exploring"/"Browse all taxonomies" buttons.
  - `readMoreLink` — `{ text?, url? }`, the "Read what the taxonomy is and how it was conceived" link (the
    "→" is added automatically, don't include it in `text`). Either field can be set independently; an
    omitted field keeps its default.
- `FRONTEND_LANDING_STATS` — a JSON array of `{ value, description }` objects, overriding the stat cards
  below the hero section. Any number of cards can be provided.

## Applying Changes Locally

1. Copy `public/data/env.example.js` to `public/data/env.js` if you haven't already.
2. Edit the values you want to change. Values are base64-encoded (`btoa("...")`); leave a key as `btoa("")`
   or remove it to keep the default.
3. Restart the frontend (`yarn start`) to pick up the new values.

For a deployed environment, set the same keys as **GitHub Environment variables** (repo Settings →
Environments → the target environment → Variables). `.github/workflows/deploy-frontend.yml` reads them and
writes them into the deployed `env.js` automatically — no code change needed to rebrand an existing
deployment, just update the environment variables and re-run the deploy pipeline.

## Configuration Reference

Refer to [`env.example.js`](public/data/env.example.js) for the complete list of environment variables,
with a worked example for each.

## Important Notes

- Missing or empty values silently fall back to the default — nothing breaks.
- Malformed values (invalid JSON, wrong shape) fall back to the default and log a `console.warn` — check
  the browser console if a change doesn't appear as expected.
- Keys are case-sensitive and must match exactly (e.g. `NAVBAR_LOGOS`, not `NavbarLogos`).
