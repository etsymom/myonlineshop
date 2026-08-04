(function () {
  'use strict';

  const ALLOWED_EVENTS = new Set([
    'landing_view', 'explore_view', 'creator_profile_view',
    'creator_application_started', 'creator_application_submitted',
    'member_signup_started', 'member_signup_completed', 'invite_link_opened',
    'content_preview_opened'
  ]);
  const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];
  const STORAGE_KEY = 'inkwell_beta_attribution';

  function clean(value, max) {
    return String(value || '').trim().slice(0, max || 160);
  }

  function captureAttribution() {
    const params = new URLSearchParams(location.search);
    let saved = {};
    try { saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); } catch (_) {}
    const next = Object.assign({}, saved);
    UTM_KEYS.forEach((key) => { if (params.has(key)) next[key] = clean(params.get(key), 120); });
    if (params.has('invite')) next.invite_code = clean(params.get('invite'), 80);
    if (params.has('ref')) next.creator_ref = clean(params.get('ref'), 80);
    if (!next.first_seen_at) next.first_seen_at = new Date().toISOString();
    next.last_seen_at = new Date().toISOString();
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch (_) {}
    return next;
  }

  function attribution() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); } catch (_) { return {}; }
  }

  function client() {
    if (!window.supabase || !window.INK_CONFIG) return null;
    return window.__inkBetaClient || (window.__inkBetaClient = window.supabase.createClient(
      window.INK_CONFIG.SUPABASE_URL,
      window.INK_CONFIG.SUPABASE_ANON,
      { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } }
    ));
  }

  async function rpc(name, args) {
    const sb = client();
    if (!sb) throw new Error('The beta service is unavailable. Please try again later.');
    const result = await sb.rpc(name, args || {});
    if (result.error) throw result.error;
    return result.data;
  }

  async function track(name, metadata) {
    if (!ALLOWED_EVENTS.has(name) || navigator.doNotTrack === '1') return;
    const a = attribution();
    const safeMetadata = Object.assign({}, metadata || {}, { path: location.pathname });
    try {
      await rpc('track_beta_event', {
        p_event_name: name,
        p_metadata: safeMetadata,
        p_attribution: a
      });
    } catch (error) {
      console.debug('Beta analytics unavailable:', error.message);
    }
  }

  async function role() {
    return rpc('current_beta_role');
  }

  async function requireRole(allowed, fallback) {
    const sb = client();
    if (!sb) { location.replace(fallback || 'index.html'); return null; }
    const sessionResult = await sb.auth.getSession();
    if (!sessionResult.data.session) { location.replace('join-beta.html?reason=session-expired'); return null; }
    try {
      const current = await role();
      if (!allowed.includes(current)) { location.replace(fallback || 'members.html'); return null; }
      return current;
    } catch (_) {
      location.replace(fallback || 'index.html');
      return null;
    }
  }

  function showStatus(element, type, message) {
    if (!element) return;
    element.className = 'beta-status ' + type;
    element.textContent = message;
  }

  function buildUrl(path, extras) {
    const url = new URL(path, location.href);
    const values = Object.assign({}, attribution(), extras || {});
    UTM_KEYS.concat(['invite', 'ref']).forEach((key) => {
      const sourceKey = key === 'invite' ? 'invite_code' : key === 'ref' ? 'creator_ref' : key;
      if (values[sourceKey]) url.searchParams.set(key, values[sourceKey]);
    });
    return url.href;
  }

  const first = captureAttribution();
  if (first.invite_code && !sessionStorage.getItem('inkwell_invite_open_tracked')) {
    sessionStorage.setItem('inkwell_invite_open_tracked', '1');
    track('invite_link_opened');
  }

  window.InkBeta = { attribution, buildUrl, captureAttribution, client, requireRole, role, rpc, showStatus, track };
})();
