# Creator Profile Template

This folder is the starting point for every new creator profile.

## How to create a new profile

1. Copy this entire `_template` folder and rename it to the creator's slug:
   ```
   cp -r profiles/_template profiles/jane-doe
   ```
2. Edit `profiles/jane-doe/text/template.json` with the creator's details.
3. Add media files to the relevant sub-folders:
   - `images/` — avatar, hero banner, album covers, blog headers, product images
   - `videos/` — MP4 or WebM video files
   - `blog-posts/` — supplementary files referenced in blog entries
4. Run the compiler: `node scripts/compile_profiles.js`
5. Set `"published": true` in the JSON when the profile is ready to go live.

## Field reference

| Field | Required | Notes |
|---|---|---|
| `id` | Yes | Unique across ALL profiles. Use kebab-case e.g. `jane-doe-001` |
| `slug` | Yes | Must match the folder name. URL-safe: lowercase letters, digits, hyphens only |
| `name` | Yes | Display name shown on the site |
| `tagline` | No | One-line headline beneath the name |
| `niche` | No | Category label e.g. "Photography", "Cooking" |
| `short_bio` | No | 1–2 sentences shown on listing cards |
| `full_bio` | No | Full text shown on the profile page |
| `location` | No | City / country |
| `social_links.*` | No | Full `https://` URLs only. Leave blank if unused |
| `assets.avatar` | No | Relative path from repo root e.g. `profiles/jane-doe/images/avatar.webp` |
| `assets.hero` | No | Wide banner image path |
| `published` | Yes | `false` keeps the profile out of the public output |

See the main `profiles/README.md` for full documentation.
