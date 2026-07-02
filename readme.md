# InkwellMedia

A creator economy platform — static HTML/CSS/vanilla JavaScript with Supabase for auth and database.

## Quick start

Serve locally with any static server:

```bash
python3 -m http.server 8080
# or
npx serve .
```

Open `landing.html` as the main entry point.

---

## Creator Profile System

InkwellMedia includes a file-based creator profile publishing system that is independent of the Supabase backend. Creators are added by duplicating a template folder, filling in a JSON config, adding media files, and running the compiler.

### How it works

1. Copy `profiles/_template` to `profiles/<creator-slug>`
2. Edit `profiles/<creator-slug>/text/template.json`
3. Add media to the `images/`, `videos/`, `blog-posts/` sub-folders
4. Run `node scripts/compile_profiles.js`
5. The output `data/curated_profiles.json` is loaded by `creators.html` and `creator-profile.html`

### Commands

```bash
node scripts/compile_profiles.js            # compile and write output
node scripts/compile_profiles.js --validate # validate only, no output written
node scripts/test_compile_profiles.js       # run compiler unit tests
```

If npm is available:
```bash
npm run profiles:compile
npm run profiles:validate
npm run profiles:test
```

### Key files

| File | Purpose |
|---|---|
| `profiles/_template/` | Template to copy for each new creator |
| `profiles/demo-creator/` | Demonstration profile (clearly labelled) |
| `scripts/compile_profiles.js` | Reads profiles/, validates, writes output |
| `scripts/test_compile_profiles.js` | Unit tests for the compiler |
| `data/curated_profiles.json` | Generated output — loaded by the website |
| `creators.html` | Public creator discovery page |
| `creator-profile.html` | Public static creator profile page (`?slug=`) |

See `profiles/README.md` for full documentation.

---

## Page map

| File | Purpose |
|---|---|
| `landing.html` | Marketing home page |
| `index.html` | Sign-in / sign-up |
| `members.html` | Authenticated member dashboard |
| `creator.html` | Supabase-backed creator profile (`?id=<uuid>`, requires auth) |
| `creator-profile.html` | Static creator profile (`?slug=`, no auth required) |
| `creators.html` | Static creator discovery / listing page |
| `profile.html` | Logged-in user's own profile |
| `explore.html` | Content discovery feed |
| `admin.html` | Admin panel |
| `auth-redirect.html` | OAuth callback handler |
| `creator-apply.html` | Creator onboarding form |
| `pricing.html` | Subscription/pass pricing |

---

## Supabase Schema

SQL migration files in root (apply in order or via Supabase MCP):

1. `setup_media_bucket.sql`
2. `setup_albums.sql`
3. `setup_multi_media.sql`
4. `migrate_currency.sql`

Key tables: `albums`, `album_media`, `profiles`, `user_balances`, `purchases`, `deposits`, `payouts`.

---

## Architecture

Shared globals: `inkwell-config.js` → `window.INK_CONFIG` (Supabase URL/key, admin emails, prices).

Shared layout: `inkwell-layout.js` injects nav and footer into `<div id="inkwell-header-mount">` and `<div id="inkwell-footer-mount">` mount points.

Service worker: `inkwell-sw.js` — three-cache strategy (static assets, images, HTML pages). Supabase API calls are never intercepted.
