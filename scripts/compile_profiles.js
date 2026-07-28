#!/usr/bin/env node
'use strict';

/**
 * InkwellMedia profile compiler
 *
 * Reads profiles/<slug>/text/template.json (or text folder/template.json),
 * auto-discovers media in images/ and videos/ subfolders, and writes the
 * single canonical output:
 *   - data/curated_profiles.json  ({ _generated, _count, profiles })
 *
 * All pages load this file via curated-profiles.js (window.CuratedProfiles).
 *
 * Usage:
 *   node scripts/compile_profiles.js
 *   node scripts/compile_profiles.js --validate
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const profilesDir = path.join(ROOT, 'profiles');
const dataOutputFile = path.join(ROOT, 'data', 'curated_profiles.json');

const IMAGE_EXTS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg', '.avif']);
const VIDEO_EXTS = new Set(['.mp4', '.webm', '.mov', '.m4v']);
const SKIP_DIRS = new Set(['_template']);

function isSafePath(p) {
  if (p == null || p === '') return true;
  if (typeof p !== 'string') return false;
  if (p.includes('..')) return false;
  if (p.startsWith('/') || p.startsWith('\\')) return false;
  if (p.includes('\\')) return false;
  return true;
}

function fileExists(relPath) {
  if (!relPath) return true;
  return fs.existsSync(path.join(ROOT, relPath));
}

function checkPath(label, p, errors) {
  if (!p) return;
  if (!isSafePath(p)) {
    errors.push(`Unsafe path in ${label}: ${p}`);
    return;
  }
  if (!fileExists(p)) {
    errors.push(`Missing file ${label}: ${p}`);
  }
}

function validate(profile, folderName, errors, warnings) {
  if (!profile || typeof profile !== 'object') {
    errors.push('Profile is not an object');
    return;
  }

  if (!profile.id) errors.push('Missing required field: "id"');
  if (!profile.name) errors.push('Missing required field: "name"');
  if (!profile.slug) errors.push('Missing required field: "slug"');

  if (profile.slug && !/^[a-z0-9-]+$/.test(profile.slug)) {
    errors.push(`Slug "${profile.slug}" has invalid characters (use lowercase, digits, hyphens)`);
  }

  if (profile.slug && folderName && profile.slug !== folderName) {
    warnings.push(`Slug "${profile.slug}" does not match directory name "${folderName}"`);
  }

  const assets = profile.assets || {};
  checkPath('assets.avatar', assets.avatar, errors);
  checkPath('assets.hero', assets.hero, errors);

  const albumIds = new Set();
  for (const album of profile.albums || []) {
    if (album.id) {
      if (albumIds.has(album.id)) errors.push(`Duplicate album id: ${album.id}`);
      albumIds.add(album.id);
    }
    checkPath(`for album "${album.title || album.id}" cover`, album.cover_image, errors);
    for (const m of album.media || []) {
      const mediaPath = m.file || m.url || '';
      checkPath(`for album media`, mediaPath, errors);
    }
  }

  const videoIds = new Set();
  for (const v of profile.videos || []) {
    if (v.id) {
      if (videoIds.has(v.id)) errors.push(`Duplicate video id: ${v.id}`);
      videoIds.add(v.id);
    }
    checkPath('video_path', v.video_path, errors);
    checkPath('thumbnail_path', v.thumbnail_path, errors);
  }

  const blogIds = new Set();
  const blogSlugs = new Set();
  for (const b of profile.blogs || []) {
    if (b.id) {
      if (blogIds.has(b.id)) errors.push(`Duplicate blog id: ${b.id}`);
      blogIds.add(b.id);
    }
    if (b.slug) {
      if (blogSlugs.has(b.slug)) errors.push(`Duplicate blog slug: ${b.slug}`);
      blogSlugs.add(b.slug);
    }
    checkPath('blog header_image', b.header_image || b.image, errors);
  }

  const productIds = new Set();
  for (const p of profile.products || []) {
    if (p.id) {
      if (productIds.has(p.id)) errors.push(`Duplicate product id: ${p.id}`);
      productIds.add(p.id);
    }
    checkPath('product image', p.image, errors);
  }
}

function sanitizeForPublic(profile) {
  const out = JSON.parse(JSON.stringify(profile));

  if (Array.isArray(out.videos)) {
    out.videos = out.videos.map((v) => {
      if (v.member_only) {
        return { ...v, video_path: null };
      }
      return v;
    });
  }

  if (Array.isArray(out.blogs)) {
    out.blogs = out.blogs
      .filter((b) => b.published !== false)
      .map((b) => {
        if (b.member_only) {
          return { ...b, content: null, header_image: null, image: null };
        }
        return b;
      });
  }

  return out;
}

function slugifyFolder(name) {
  return String(name || '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

function mediaTypeFromExt(ext) {
  if (VIDEO_EXTS.has(ext)) return 'video';
  if (IMAGE_EXTS.has(ext)) return 'image';
  return null;
}

function listMediaFiles(dirAbs, relBase) {
  if (!fs.existsSync(dirAbs) || !fs.statSync(dirAbs).isDirectory()) return [];
  const out = [];
  for (const file of fs.readdirSync(dirAbs)) {
    if (file.startsWith('.')) continue;
    const abs = path.join(dirAbs, file);
    if (!fs.statSync(abs).isFile()) continue;
    const ext = path.extname(file).toLowerCase();
    const type = mediaTypeFromExt(ext);
    if (!type) continue;
    const rel = `${relBase}/${file}`.replace(/\\/g, '/');
    out.push({
      type,
      file: rel,
      url: rel,
      thumbnail: type === 'image' ? rel : undefined,
    });
  }
  // Stable order: images first, then videos, alpha within type
  out.sort((a, b) => {
    if (a.type !== b.type) return a.type === 'image' ? -1 : 1;
    return a.file.localeCompare(b.file);
  });
  return out;
}

function autoAlbumsFromFolders(folderName, profileData) {
  const albums = [];
  const mediaDirs = ['images', 'videos'];

  for (const mediaDir of mediaDirs) {
    const fullMediaDirPath = path.join(profilesDir, folderName, mediaDir);
    if (!fs.existsSync(fullMediaDirPath) || !fs.statSync(fullMediaDirPath).isDirectory()) continue;

    for (const subItem of fs.readdirSync(fullMediaDirPath)) {
      if (subItem.startsWith('.')) continue;
      const subItemPath = path.join(fullMediaDirPath, subItem);
      if (!fs.statSync(subItemPath).isDirectory()) continue;

      const relBase = `profiles/${folderName}/${mediaDir}/${subItem}`;
      const albumMedia = listMediaFiles(subItemPath, relBase);
      if (albumMedia.length === 0) continue;

      albums.push({
        id: `auto-${mediaDir}-${slugifyFolder(subItem) || 'album'}`,
        title: subItem.replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim(),
        description: `Album from ${mediaDir}/${subItem}`,
        cover_image: albumMedia.find((m) => m.type === 'image')?.file || '',
        media: albumMedia,
        price: 0,
        auto_generated: true,
      });
    }
  }

  return albums;
}

function mapVideosToAlbum(profileData) {
  if (!Array.isArray(profileData.videos) || profileData.videos.length === 0) return null;

  const mediaItems = profileData.videos
    .map((v) => {
      const src = v.video_path || v.thumbnail_path || '';
      if (!src) return null;
      return {
        type: v.video_path ? 'video' : 'image',
        file: src,
        url: src,
        thumbnail: v.thumbnail_path || undefined,
        title: v.title || '',
        member_only: !!v.member_only,
      };
    })
    .filter(Boolean);

  if (mediaItems.length === 0) return null;

  return {
    id: 'album-all-videos',
    title: 'All Videos',
    description: 'Creator videos',
    media: mediaItems,
    price: 0,
    auto_generated: true,
  };
}

function normalizeAlbumMedia(albums) {
  return (albums || []).map((album) => {
    const media = (album.media || []).map((m, idx) => {
      const pathVal = m.file || m.url || m.media_url || '';
      const type = m.type || m.media_type || (VIDEO_EXTS.has(path.extname(pathVal).toLowerCase()) ? 'video' : 'image');
      return {
        id: m.id || `media-${idx + 1}`,
        type,
        file: pathVal,
        url: pathVal,
        thumbnail: m.thumbnail || (type === 'image' ? pathVal : undefined),
        caption: m.caption || m.title || '',
        member_only: !!m.member_only,
      };
    }).filter((m) => m.file);

    return {
      ...album,
      media,
    };
  });
}

function enrichProfile(folderName, raw) {
  const profile = { ...raw };
  const slug = profile.slug || slugifyFolder(folderName);

  // Canonical runtime id used by creator.html?id=github_<slug>
  profile.id = `github_${slugifyFolder(folderName)}`;
  profile.slug = slug;
  profile.folderName = folderName;
  if (profile.published === undefined) profile.published = true;

  if (!profile.assets) profile.assets = { avatar: '', hero: '' };
  if (!profile.albums) profile.albums = [];
  if (!profile.videos) profile.videos = [];
  if (!profile.blogs) profile.blogs = [];

  // Normalize existing album media to dual file/url shape
  profile.albums = normalizeAlbumMedia(profile.albums);

  // Map videos[] into a browseable album (if paths exist)
  const videoAlbum = mapVideosToAlbum(profile);
  if (videoAlbum) {
    const already = profile.albums.some((a) => a.id === 'album-all-videos' || a.title === 'All Videos');
    if (!already) profile.albums.push(videoAlbum);
  }

  // Auto albums from subfolders (real media on disk)
  const auto = autoAlbumsFromFolders(folderName, profile);
  const existingTitles = new Set(profile.albums.map((a) => (a.title || '').toLowerCase()));
  for (const album of auto) {
    if (existingTitles.has((album.title || '').toLowerCase())) {
      // Merge media into existing empty album with same title
      const match = profile.albums.find((a) => (a.title || '').toLowerCase() === (album.title || '').toLowerCase());
      if (match && (!match.media || match.media.length === 0)) {
        match.media = album.media;
        if (!match.cover_image) match.cover_image = album.cover_image;
      }
      continue;
    }
    profile.albums.push(album);
  }

  profile.albums = normalizeAlbumMedia(profile.albums);
  return profile;
}

function readTemplate(folderPath) {
  const candidates = [
    path.join(folderPath, 'text', 'template.json'),
    path.join(folderPath, 'text folder', 'template.json'),
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

function compileProfiles(options = {}) {
  const validateOnly = !!options.validateOnly;
  const allProfiles = [];
  const globalErrors = [];
  const globalWarnings = [];

  if (!fs.existsSync(profilesDir)) {
    console.error('Profiles directory does not exist.');
    process.exitCode = 1;
    return { profiles: [], errors: ['Profiles directory does not exist.'], warnings: [] };
  }

  const items = fs.readdirSync(profilesDir).sort((a, b) => a.localeCompare(b));

  for (const item of items) {
    if (SKIP_DIRS.has(item) || item.startsWith('.') || item === 'README.md') continue;

    const itemPath = path.join(profilesDir, item);
    if (!fs.statSync(itemPath).isDirectory()) continue;

    const templatePath = readTemplate(itemPath);
    if (!templatePath) {
      globalWarnings.push(`${item}: no text/template.json found — skipped`);
      continue;
    }

    try {
      const raw = JSON.parse(fs.readFileSync(templatePath, 'utf8'));
      const profile = enrichProfile(item, raw);

      const errors = [];
      const warnings = [];
      // Soft validation: missing optional media paths warn, required fields error
      validate(
        {
          ...profile,
          // validate against template id/slug if present; runtime id is github_*
          id: raw.id || profile.id,
          slug: raw.slug || profile.slug,
        },
        item,
        errors,
        warnings
      );

      // Downgrade missing-file errors for empty optional paths already handled;
      // keep unsafe path as hard errors.
      const hard = errors.filter((e) => e.includes('Unsafe') || e.includes('Missing required') || e.includes('invalid characters') || e.includes('Duplicate'));
      const soft = errors.filter((e) => !hard.includes(e));

      if (hard.length) {
        console.error(`✗ ${item}: ${hard.join('; ')}`);
        globalErrors.push(...hard.map((e) => `${item}: ${e}`));
        continue;
      }
      if (soft.length) {
        soft.forEach((e) => globalWarnings.push(`${item}: ${e}`));
      }
      warnings.forEach((w) => globalWarnings.push(`${item}: ${w}`));

      const publicProfile = sanitizeForPublic(profile);
      allProfiles.push(publicProfile);
      console.log(`Compiled profile: ${item} (${(publicProfile.albums || []).reduce((n, a) => n + (a.media || []).length, 0)} media items)`);
    } catch (err) {
      console.error(`Error parsing template.json for profile ${item}:`, err.message);
      globalErrors.push(`${item}: ${err.message}`);
    }
  }

  // Only published profiles in public output (unpublished kept if explicitly false filter later)
  const published = allProfiles.filter((p) => p.published !== false);

  if (validateOnly) {
    console.log(`\nValidate only: ${published.length} profiles OK, ${globalErrors.length} errors, ${globalWarnings.length} warnings`);
    if (globalErrors.length) process.exitCode = 1;
    return { profiles: published, errors: globalErrors, warnings: globalWarnings };
  }

  const payload = {
    _generated: new Date().toISOString(),
    _count: published.length,
    profiles: published,
  };

  fs.mkdirSync(path.dirname(dataOutputFile), { recursive: true });
  fs.writeFileSync(dataOutputFile, JSON.stringify(payload, null, 2));

  console.log(`\nSuccessfully compiled ${published.length} profiles`);
  console.log(`  → ${path.relative(ROOT, dataOutputFile)} (canonical)`);

  if (globalWarnings.length) {
    console.log(`\nWarnings (${globalWarnings.length}):`);
    globalWarnings.slice(0, 20).forEach((w) => console.log(`  - ${w}`));
    if (globalWarnings.length > 20) console.log(`  …and ${globalWarnings.length - 20} more`);
  }
  if (globalErrors.length) process.exitCode = 1;

  return { profiles: published, errors: globalErrors, warnings: globalWarnings };
}

// CLI
if (require.main === module) {
  const validateOnly = process.argv.includes('--validate');
  compileProfiles({ validateOnly });
}

module.exports = {
  compileProfiles,
  validate,
  sanitizeForPublic,
  isSafePath,
  enrichProfile,
};
