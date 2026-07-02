# InkwellMedia Creator Profiles

This directory contains all creator profiles published on the InkwellMedia platform.
Each profile is a self-contained folder with media assets and a JSON configuration file.
The compiler (`scripts/compile_profiles.js`) reads these folders and generates
`data/curated_profiles.json`, which the website loads at runtime.

---

## Quick start

```bash
# 1. Copy the template
cp -r profiles/_template profiles/your-creator-slug

# 2. Edit the profile JSON
# (open profiles/your-creator-slug/text/template.json in any text editor)

# 3. Add media files to the images/, videos/, and blog-posts/ folders

# 4. Validate (dry run — does not write output)
node scripts/compile_profiles.js --validate

# 5. Compile (writes data/curated_profiles.json)
node scripts/compile_profiles.js

# 6. Preview in a browser
python3 -m http.server 8080
# then open http://localhost:8080/creators.html
```

---

## Folder structure

```
profiles/
  _template/              <- Copy this to create a new profile (never publish _template)
    images/
    videos/
    blog-posts/
    text/
      template.json       <- The profile data file (edit this)
      README.md           <- Field reference
  your-creator-slug/      <- One folder per creator; name must match the slug field
    images/
      avatar.webp         <- Recommended: 400x400 px, < 150 KB
      hero.webp           <- Recommended: 1200x400 px, < 300 KB
    videos/
      intro.mp4           <- H.264 MP4, < 50 MB per file recommended
    blog-posts/
    text/
      template.json
```

---

## Folder naming rules

- Use only lowercase letters, digits, and hyphens: `jane-doe`, `my-creator-2`
- The folder name **must match** the `slug` field inside `template.json`
- Folders starting with `_` are ignored by the compiler (used for `_template`)

---

## Editing `template.json`

Open the file in any plain-text editor (VS Code, Notepad, etc.).
It is standard JSON -- **do not use smart quotes or trailing commas**.

### Required fields

| Field | Example | Rules |
|---|---|---|
| `id` | `"jane-doe-001"` | Unique across ALL profiles |
| `slug` | `"jane-doe"` | Matches folder name; lowercase, hyphens only |
| `name` | `"Jane Doe"` | Display name |

### Media file paths

All paths must be **relative to the repository root** and use **forward slashes**:

```json
"avatar": "profiles/jane-doe/images/avatar.webp"
```

Leave the value as `""` (empty string) if the file has not been added yet.
The compiler will skip empty paths but will error on non-empty paths that point to missing files.

### Albums

```json
"albums": [
  {
    "id": "album-jane-001",
    "title": "My First Album",
    "description": "A short description.",
    "cover_image": "profiles/jane-doe/images/album-cover.webp",
    "media": [
      {
        "id": "media-jane-001",
        "file": "profiles/jane-doe/images/photo-1.webp",
        "type": "image",
        "caption": "Optional caption"
      }
    ]
  }
]
```

`type` must be `"image"` or `"video"`.

### Videos

```json
"videos": [
  {
    "id": "video-jane-001",
    "title": "Introduction",
    "description": "Short description.",
    "video_path": "profiles/jane-doe/videos/intro.mp4",
    "thumbnail_path": "profiles/jane-doe/images/intro-thumb.webp",
    "published_at": "2026-01-15",
    "member_only": false
  }
]
```

Set `"member_only": true` to hide the video URL from the public dataset while
still showing the title and description.

### Blog posts

```json
"blogs": [
  {
    "id": "blog-jane-001",
    "slug": "my-first-post",
    "title": "My First Post",
    "summary": "One-sentence teaser.",
    "content": "Full post text goes here. Use plain text; line breaks are preserved.",
    "published_at": "2026-01-20",
    "header_image": "profiles/jane-doe/images/post-header.webp",
    "author": "Jane Doe",
    "member_only": false,
    "published": true
  }
]
```

Set `"published": false` to hide the post entirely from the public output.
Set `"member_only": true` to show the title and summary but hide the content.

### Products

```json
"products": [
  {
    "id": "product-jane-001",
    "name": "Preset Pack",
    "description": "10 Lightroom presets.",
    "price": 149,
    "currency": "ZAR",
    "image": "profiles/jane-doe/images/preset-pack.webp",
    "purchase_url": "https://your-store.com/preset-pack",
    "active": true
  }
]
```

`purchase_url` must be a full `https://` URL, or leave blank.

### Publishing

Set `"published": true` when the profile is ready to appear on the site.
Profiles with `"published": false` are validated by the compiler but excluded from
the public JSON output.

---

## Validating a profile

```bash
node scripts/compile_profiles.js --validate
```

The compiler exits with code `1` and prints error details if validation fails.

---

## Compiling profiles

```bash
node scripts/compile_profiles.js
```

Output is written to `data/curated_profiles.json`.
The file is only rewritten when the profile content has actually changed.

---

## Previewing locally

Start a local static server from the repository root:

```bash
python3 -m http.server 8080
# or
npx serve .
```

Then open:
- `http://localhost:8080/creators.html` -- creator listing
- `http://localhost:8080/creator-profile.html?slug=your-creator-slug` -- individual profile

---

## Publishing

1. Run `node scripts/compile_profiles.js` locally to verify there are no errors.
2. Commit both the profile folder and the updated `data/curated_profiles.json`.
3. Push to the repository.

The GitHub Actions workflow (`.github/workflows/compile-profiles.yml`) will also
run the compiler automatically and commit any updated JSON on push.

---

## File size recommendations

| Asset | Format | Max size |
|---|---|---|
| Avatar | WebP / SVG | 150 KB |
| Hero banner | WebP / SVG | 300 KB |
| Album cover | WebP / SVG | 200 KB |
| Album image | WebP / JPG | 500 KB |
| Video | MP4 (H.264) | 50 MB |
| Blog header | WebP / SVG | 200 KB |
| Product image | WebP / JPG | 200 KB |

---

## Supported media types

| Type | Formats |
|---|---|
| Images | `.webp`, `.jpg`, `.jpeg`, `.png`, `.svg` |
| Videos | `.mp4`, `.webm` |

---

## Common errors

| Error message | Cause | Fix |
|---|---|---|
| `Missing text/template.json` | JSON file not found in the creator folder | Create `text/template.json` |
| `Invalid JSON` | Syntax error in the JSON file | Validate with a JSON linter |
| `Missing required field: "id"` | `id` is empty or missing | Add a unique id |
| `slug in JSON doesn't match directory name` | Folder name and slug field differ | Rename the folder or fix the slug |
| `Duplicate creator id` | Two profiles share the same `id` | Change one of the ids |
| `Unsafe path` | A media path contains `..` or is absolute | Use a relative path from the repo root |
| `Missing file` | A referenced media file does not exist | Add the file or clear the path field |
