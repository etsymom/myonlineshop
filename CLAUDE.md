# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**InkwellMedia** is a creator economy platform — a static HTML/CSS/vanilla JavaScript site with Supabase for auth and database. There is **no build step, no bundler, no npm**. All files are served directly from the filesystem or a static host.

## Development

Serve the site locally with any static server:

```bash
# Using Python
python3 -m http.server 8080

# Using Node.js npx
npx serve .
```

Open `landing.html` as the main entry point (not `index.html`, which is the sign-in page).

## Architecture

### Shared Globals (`inkwell-config.js`)

Loaded first on every page. Exposes `window.INK_CONFIG` with:
- `SUPABASE_URL` / `SUPABASE_ANON` — Supabase project credentials
- `ADMIN_EMAILS` — list of admin email addresses
- `CREATOR_PASS_PRICE` — default creator pass price in ZAR
- `PLATFORM_CUT` — platform revenue share (0.15 = 15%)

Also registers the service worker (`inkwell-sw.js`).

### Shared Layout (`inkwell-layout.js`)

Self-executing module that injects nav, footer, and cookie banner into mount points:

```html
<div id="inkwell-header-mount"></div>  <!-- replaced with <nav> -->
<div id="inkwell-footer-mount"></div>  <!-- replaced with <footer> -->
```

Reads Supabase session to render auth-aware nav (Dashboard/Explore/Profile/Log out vs Sign In/Apply). Exposes `window.inkwellLogout()`.

### Service Worker (`inkwell-sw.js`)

Three-cache strategy:
- `ink-static-v1` — JS/CSS files (stale-while-revalidate)
- `ink-images-v1` — images (cache-first)
- `ink-dynamic-v1` — HTML pages (network-first)

Supabase API calls are never intercepted.

### Geo Pricing (`geo-pricing.js`)

Exposes `GeoPricing` module. All prices are stored in **ZAR** internally. On page load:
1. Detects country via `ipapi.co/json/`
2. Loads live exchange rates from `open.er-api.com`
3. Updates all `[data-zar]` elements with converted, formatted amounts

To display a price, use `data-zar="150"` on any element; `GeoPricing` will replace its text content. Currency preference is persisted to `localStorage` as `user_currency`. Supported: ZAR, USD, GBP, EUR.

### Localisation (`locale.js`)

Exposes `LocaleManager` module. Language is detected from `localStorage` → browser `navigator.language` → fallback `en`.

Translation files live in `translations/<lang>.json` (af, de, es, fr, pt). English has no translation file — untranslated strings fall through unchanged. Translation is done by **exact text content matching** (not data attributes). Language preference is persisted to `localStorage` as `user_language`.

### Design System

CSS variables defined per-page (and mirrored in `inkwell-layout.js`):

| Variable | Value | Use |
|---|---|---|
| `--aubergine` | `#2D1B4E` | Primary brand, nav background |
| `--amber` | `#F5A623` | CTAs, accents, active states |
| `--parchment` | `#FAF7F2` | Page background |
| `--slate` | `#8A7FA0` | Muted text |
| `--success` | `#059669` | Positive states |
| `--danger` | `#E3394A` | Errors, destructive actions |

Fonts: **Playfair Display** (headings/brand) + **DM Sans** (body/UI), loaded from Google Fonts. Mobile breakpoint: `860px`.

## Page Map

| File | Purpose |
|---|---|
| `landing.html` | Marketing home page |
| `index.html` | Sign-in / sign-up |
| `members.html` | Authenticated member dashboard |
| `creator.html` | Public creator profile (TikTok-style grid) |
| `profile.html` | Logged-in user's own profile |
| `explore.html` | Content discovery feed |
| `admin.html` | Admin panel (gated to `ADMIN_EMAILS`) |
| `auth-redirect.html` | OAuth callback handler |
| `creator-apply.html` | Creator onboarding form |
| `pricing.html` | Subscription/pass pricing |

## Supabase Schema

SQL migration files in root (apply in order or via Supabase MCP):

1. `setup_media_bucket.sql` — storage bucket configuration
2. `setup_albums.sql` — `albums` table with RLS policies
3. `setup_multi_media.sql` — `album_media` table (one-to-many media per album)
4. `migrate_currency.sql` — currency field migration

Key tables:
- `albums` — creator content collections (price in USD numeric, `user_id` FK to `auth.users`)
- `album_media` — individual media items per album (`media_type`: `'image'` | `'video'`, `is_free_preview` boolean)

Use the Supabase MCP (`mcp__claude_ai_Supabase__*` tools) for schema inspection and running SQL rather than connecting directly.

## Auth Pattern

All pages that require auth check session on load:

```js
const { data } = await supabase.auth.getSession();
if (!data.session) window.location.href = 'index.html';
```

Admin check pattern:
```js
const isAdmin = window.INK_CONFIG.ADMIN_EMAILS.includes(data.session.user.email);
```

## Adding a New Page

1. Create `newpage.html` — copy the head boilerplate (fonts, favicon, CSS vars) from an existing page
2. Add mount points: `<div id="inkwell-header-mount"></div>` and `<div id="inkwell-footer-mount"></div>`
3. Include scripts in order: `inkwell-config.js` → `@supabase/supabase-js` CDN → `inkwell-layout.js`
4. Add the page to `NAV_LINKS` in `inkwell-layout.js` if it should appear in the nav
