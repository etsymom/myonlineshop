# InkwellMedia — Make-It-Better Roadmap (creators + users)

Read `CLAUDE.md` first. Work phases IN ORDER. Plan before each, commit small,
ask before anything destructive. This is a reference for the whole journey — do
NOT attempt it all in one session.

## Two hard rules (never break)
1. **Payments are DONE and LOCKED.** Do not modify the wallet: tables
   `user_balances`, `deposits`, `purchases`, `subscriptions`, `payouts`, `products`,
   or the RPCs `request_deposit / approve_deposit / reject_deposit / purchase_product
   / has_access / is_admin`. You may only CALL `has_access()` to gate content. No
   schema or function changes to money.
2. **Never route media through Supabase egress.** Free tier = 5 GB/mo. Creator
   images/videos live on GitHub Pages (public previews) or a zero-egress private
   store (Cloudflare R2) for paid content. Supabase carries only auth, small JSON,
   and the wallet. Cache aggressively.

Context: static HTML + Supabase on GitHub Pages. Median user = low-end Android on
mobile data in South Africa. Mobile-first is not optional.

---

## Phase 0 — Finish the JSON migration (already in flight)
The one you're paused on. One canonical loader (`CuratedProfiles.load()`), all
consumers migrated, dead paths deleted, `npm run profiles:test` green, every profile
renders identically everywhere. **Nothing below starts until this is done.**

## Phase 1 — Make the paywall real (biggest business fix)
Today `has_access()` only hides the UI; the `member_only` file URL still works for
anyone who has it. That means paying is optional. Fix:
- Kill the `localStorage` `hasSubscribed` check in `creator.html`; gate with
  `supabase.rpc('has_access', { p_product_key })`.
- Move `member_only` media into a PRIVATE Cloudflare R2 bucket (zero egress cost).
  Serve it via short-lived signed URLs minted ONLY after `has_access()` passes.
- Keep free previews public on GitHub Pages — they drive discovery. Only gate the
  paid tier.
> Until this ships, the paywall is cosmetic. Highest priority after Phase 0.

## Phase 2 — Mobile-first performance (SA reality + egress discipline)
Fast on a cheap phone over patchy data. This also saves you bandwidth.
- Lazy-load all media; responsive images with `srcset`; explicit width/height so
  there's zero layout shift.
- Skeleton loaders on the feed and profiles; fast first paint.
- Cache the profile JSON (it changes rarely). Add cache headers.
- Audit payload sizes; compress images; no giant hero files.
- Use the `frontend-design` skill for the visual pass.

## Phase 3 — Discovery + user library
Help users find content and return to what they bought.
- `creators.html`: search by name, filter by niche, sort newest / popular.
- `explore.html`: smooth infinite scroll; simple "for you" ordering (newest +
  light shuffle is fine to start).
- Following / favourites so users can track creators.
- **My Library** view: everything the user has unlocked, pulled from `purchases` +
  active `subscriptions`. Right now a paid unlock is easy to lose — this fixes it.
- OG / share cards on public creator profiles so shared links look good and pull
  traffic back.

## Phase 4 — Creator self-service publishing (biggest creator fix)
The shift from dev-compiled to creator-published. THIS is what turns a site a dev
maintains into a platform creators use.
- Creator dashboard to: upload an album/video (to R2), write a blog post, set a
  price, mark items `member_only`, publish / unpublish, reorder, and edit.
- Writes go to Supabase (`profiles`, `albums`, `album_media` already exist) behind
  RLS policies scoped so a creator can only edit their OWN rows. Add those policies.
- Keep `compile_profiles.js` working during transition; migrate creators over, don't
  break existing ones.
- Big phase — plan it in sub-steps, land the upload flow first, then editing.

## Phase 5 — Creator earnings + analytics (reads only, no payment changes)
Creators stay when they can see money and traction. Surface what's ALREADY recorded;
change nothing about how money moves.
- Earnings dashboard: total earned, the 15% platform cut shown honestly, pending vs
  paid payouts (from `payouts`), per-item unlock counts (from `purchases` /
  `subscriptions`).
- Basic analytics: views, top content, follower count.

## Phase 6 — Trust, safety & compliance (keeps the platform alive)
Non-optional for adult-adjacent content. This is what stops the platform being killed.
- 18+ age gate on entry.
- Content policy page + a working report / takedown flow.
- Creator identity capture on application (`creator_applications` table exists).
- Flag anything that may fall under the SA Films & Publications Act or that needs
  legal/tax handling — surface it, don't guess.

## Phase 7 — Engagement + retention
Deepen the loop once the core is solid.
- Notifications via Resend when a followed creator posts.
- Creator → member announcements / updates.
- Simple reactions or ratings on content.
- Search across content (not just creators).

---

## Working principles (every phase)
- Mobile-first, South Africa, low-end devices, patchy data.
- Free-tier discipline: media off Supabase, cache hard, small payloads.
- Payments untouched — only read them / call `has_access()`.
- `frontend-design` skill for UI phases.
- Plan Mode before big refactors; small reviewable commits; ask before destructive
  or money-touching changes.
- After each phase: report what changed and what's next.

## External setup the owner must do (not codeable by you)
- Cloudflare R2 bucket + credentials for Phase 1 (zero-egress private media).
- Confirm the Supabase project stays under free-tier limits.
