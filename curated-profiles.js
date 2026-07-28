/**
 * InkwellMedia — shared curated profile loader
 * Normalizes both payload shapes and media field names.
 */
(function (global) {
  'use strict';

  const PRIMARY_URL = 'data/curated_profiles.json';

  function bust(url) {
    const sep = url.includes('?') ? '&' : '?';
    return url + sep + 't=' + Date.now();
  }

  /** Encode each path segment so spaces/special chars work in src= */
  function mediaSrc(pathVal) {
    if (!pathVal || typeof pathVal !== 'string') return '';
    if (/^https?:\/\//i.test(pathVal) || pathVal.startsWith('data:')) return pathVal;
    return pathVal
      .split('/')
      .map((seg) => encodeURIComponent(seg))
      .join('/');
  }

  function normalizeMediaItem(m, idx) {
    if (!m || typeof m !== 'object') return null;
    const pathVal = m.file || m.url || m.media_url || m.video_path || m.src || '';
    if (!pathVal) return null;
    const type =
      m.type ||
      m.media_type ||
      (/\.(mp4|webm|mov|m4v)(\?|$)/i.test(pathVal) ? 'video' : 'image');
    return {
      id: m.id || `media-${idx + 1}`,
      type,
      media_type: type,
      file: pathVal,
      url: pathVal,
      media_url: pathVal,
      src: mediaSrc(pathVal),
      thumbnail: m.thumbnail ? mediaSrc(m.thumbnail) : type === 'image' ? mediaSrc(pathVal) : '',
      caption: m.caption || m.title || '',
      member_only: !!m.member_only,
    };
  }

  function normalizeAlbum(album, idx) {
    if (!album || typeof album !== 'object') return null;
    const media = (album.media || album.album_media || [])
      .map(normalizeMediaItem)
      .filter(Boolean);
    return {
      ...album,
      id: album.id || `album-${idx + 1}`,
      title: album.title || 'Untitled album',
      description: album.description || '',
      cover_image: album.cover_image || album.cover_image_url || '',
      cover_image_url: album.cover_image || album.cover_image_url || '',
      cover_src: mediaSrc(album.cover_image || album.cover_image_url || ''),
      price: Number(album.price ?? album.price_zar ?? 0) || 0,
      price_zar: Number(album.price_zar ?? album.price ?? 0) || 0,
      media,
      album_media: media,
    };
  }

  function normalizeProfile(p) {
    if (!p || typeof p !== 'object') return null;
    const slug = p.slug || p.folderName || '';
    const id = p.id || (slug ? 'github_' + String(slug).toLowerCase().replace(/\s+/g, '_') : '');
    const assets = p.assets || {};
    return {
      ...p,
      id,
      slug,
      folderName: p.folderName || slug,
      name: p.name || 'Creator',
      assets: {
        avatar: assets.avatar || '',
        hero: assets.hero || '',
        avatar_src: mediaSrc(assets.avatar || ''),
        hero_src: mediaSrc(assets.hero || ''),
      },
      albums: (p.albums || []).map(normalizeAlbum).filter(Boolean),
      videos: (p.videos || []).map((v, i) => ({
        ...v,
        video_src: mediaSrc(v.video_path || ''),
        thumb_src: mediaSrc(v.thumbnail_path || ''),
      })),
      blogs: p.blogs || [],
      published: p.published !== false,
    };
  }

  function extractList(payload) {
    if (Array.isArray(payload)) return payload;
    if (payload && Array.isArray(payload.profiles)) return payload.profiles;
    return [];
  }

  async function fetchJson(url) {
    const res = await fetch(bust(url), { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
    return res.json();
  }

  async function loadCuratedProfiles() {
    const payload = await fetchJson(PRIMARY_URL);
    const list = extractList(payload).map(normalizeProfile).filter(Boolean);
    return {
      generated: payload && payload._generated ? payload._generated : null,
      count: list.length,
      profiles: list,
    };
  }

  function findProfile(profiles, query) {
    if (!query || !profiles) return null;
    const q = String(query).toLowerCase().trim();
    const qNorm = q.replace(/\s+/g, '_');
    const qSlug = q.replace(/\s+/g, '-');

    return (
      profiles.find((p) => p.id && p.id.toLowerCase() === q) ||
      profiles.find((p) => p.id && p.id.toLowerCase() === 'github_' + qNorm) ||
      profiles.find((p) => p.slug && p.slug.toLowerCase() === q) ||
      profiles.find((p) => p.slug && p.slug.toLowerCase() === qSlug) ||
      profiles.find((p) => p.folderName && p.folderName.toLowerCase() === q) ||
      profiles.find(
        (p) => p.name && p.name.toLowerCase().replace(/\s+/g, '') === q.replace(/\s+/g, '')
      ) ||
      null
    );
  }

  global.CuratedProfiles = {
    load: loadCuratedProfiles,
    find: findProfile,
    mediaSrc,
    normalizeProfile,
    normalizeMediaItem,
  };
})(typeof window !== 'undefined' ? window : globalThis);
