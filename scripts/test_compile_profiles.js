#!/usr/bin/env node
'use strict';

/**
 * Unit tests for compile_profiles.js
 * Run: node scripts/test_compile_profiles.js
 */

const assert  = require('assert').strict;
const { validate, sanitizeForPublic, isSafePath } = require('./compile_profiles.js');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  \x1b[32m✓\x1b[0m ${name}`);
    passed++;
  } catch (e) {
    console.error(`  \x1b[31m✗\x1b[0m ${name}`);
    console.error(`    ${e.message}`);
    failed++;
  }
}

function hasError(errors, fragment) {
  return errors.some(e => e.includes(fragment));
}

// Base valid profile (no file-path fields, so no filesystem checks)
function baseProfile(overrides = {}) {
  return {
    id:       'test-001',
    slug:     'test-creator',
    name:     'Test Creator',
    tagline:  'Testing',
    niche:    'Test',
    short_bio: 'A test creator.',
    full_bio:  'Longer bio.',
    location:  'Test City',
    social_links: {},
    assets:   { avatar: '', hero: '' },
    albums:   [],
    videos:   [],
    blogs:    [],
    membership: { enabled: false, free_content_description: '', premium_content_description: '', main_cta: '' },
    products: [],
    published: true,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
console.log('\n\x1b[1m\x1b[36mInkwellMedia Profile Compiler — Unit Tests\x1b[0m\n');

// ---- isSafePath ------------------------------------------------------------
console.log('\x1b[1misSafePath()\x1b[0m');

test('empty string is safe', () => assert.equal(isSafePath(''), true));
test('null is safe',         () => assert.equal(isSafePath(null), true));
test('undefined is safe',    () => assert.equal(isSafePath(undefined), true));
test('relative path is safe', () => assert.equal(isSafePath('profiles/a/images/b.webp'), true));
test('path with .. is unsafe', () => assert.equal(isSafePath('../secret'), false));
test('nested .. is unsafe',    () => assert.equal(isSafePath('profiles/../../etc/passwd'), false));
test('absolute path is unsafe', () => assert.equal(isSafePath('/etc/passwd'), false));
test('backslash path is unsafe', () => assert.equal(isSafePath('profiles\\a\\b'), false));

// ---- validate() — required fields -----------------------------------------
console.log('\n\x1b[1mvalidate() — required fields\x1b[0m');

test('valid profile has no errors', () => {
  const errors = [], warnings = [];
  validate(baseProfile(), 'test-creator', errors, warnings);
  assert.equal(errors.length, 0, `Unexpected errors: ${errors.join(', ')}`);
});

test('missing id triggers error', () => {
  const errors = [], warnings = [];
  validate(baseProfile({ id: '' }), 'test-creator', errors, warnings);
  assert.ok(hasError(errors, 'Missing required field: "id"'));
});

test('missing name triggers error', () => {
  const errors = [], warnings = [];
  validate(baseProfile({ name: '' }), 'test-creator', errors, warnings);
  assert.ok(hasError(errors, 'Missing required field: "name"'));
});

test('missing slug triggers error', () => {
  const errors = [], warnings = [];
  validate(baseProfile({ slug: '' }), 'test-creator', errors, warnings);
  assert.ok(hasError(errors, 'Missing required field: "slug"'));
});

test('slug mismatch produces warning not error', () => {
  const errors = [], warnings = [];
  validate(baseProfile({ slug: 'other-slug' }), 'test-creator', errors, warnings);
  assert.equal(errors.length, 0);
  assert.ok(warnings.some(w => w.includes('does not match directory name')));
});

test('invalid slug characters trigger error', () => {
  const errors = [], warnings = [];
  validate(baseProfile({ slug: 'Test Creator!' }), 'test-creator', errors, warnings);
  assert.ok(hasError(errors, 'invalid characters'));
});

// ---- validate() — unsafe paths --------------------------------------------
console.log('\n\x1b[1mvalidate() — unsafe paths\x1b[0m');

test('unsafe avatar path rejected', () => {
  const errors = [], warnings = [];
  validate(baseProfile({ assets: { avatar: '../private/secret.jpg', hero: '' } }), 'test-creator', errors, warnings);
  assert.ok(hasError(errors, 'Unsafe path in assets.avatar'));
});

test('unsafe album cover path rejected', () => {
  const errors = [], warnings = [];
  const p = baseProfile({
    albums: [{ id: 'a1', title: 'T', cover_image: '/etc/passwd', media: [] }],
  });
  validate(p, 'test-creator', errors, warnings);
  assert.ok(hasError(errors, 'Unsafe path'));
});

test('unsafe video path rejected', () => {
  const errors = [], warnings = [];
  const p = baseProfile({
    videos: [{ id: 'v1', title: 'V', video_path: '../../../outside', thumbnail_path: '', published_at: '', member_only: false }],
  });
  validate(p, 'test-creator', errors, warnings);
  assert.ok(hasError(errors, 'Unsafe path'));
});

// ---- validate() — duplicate IDs -------------------------------------------
console.log('\n\x1b[1mvalidate() — duplicate IDs\x1b[0m');

test('duplicate album ids rejected', () => {
  const errors = [], warnings = [];
  const p = baseProfile({
    albums: [
      { id: 'dup', title: 'A', media: [] },
      { id: 'dup', title: 'B', media: [] },
    ],
  });
  validate(p, 'test-creator', errors, warnings);
  assert.ok(hasError(errors, 'Duplicate album id'));
});

test('duplicate video ids rejected', () => {
  const errors = [], warnings = [];
  const p = baseProfile({
    videos: [
      { id: 'dup', title: 'V1', video_path: '', thumbnail_path: '', published_at: '', member_only: false },
      { id: 'dup', title: 'V2', video_path: '', thumbnail_path: '', published_at: '', member_only: false },
    ],
  });
  validate(p, 'test-creator', errors, warnings);
  assert.ok(hasError(errors, 'Duplicate video id'));
});

test('duplicate blog ids rejected', () => {
  const errors = [], warnings = [];
  const p = baseProfile({
    blogs: [
      { id: 'dup', slug: 's1', title: 'B1', summary: '', content: '', published_at: '', header_image: '', author: '', member_only: false, published: true },
      { id: 'dup', slug: 's2', title: 'B2', summary: '', content: '', published_at: '', header_image: '', author: '', member_only: false, published: true },
    ],
  });
  validate(p, 'test-creator', errors, warnings);
  assert.ok(hasError(errors, 'Duplicate blog id'));
});

test('duplicate blog slugs rejected', () => {
  const errors = [], warnings = [];
  const p = baseProfile({
    blogs: [
      { id: 'b1', slug: 'same', title: 'B1', summary: '', content: '', published_at: '', header_image: '', author: '', member_only: false, published: true },
      { id: 'b2', slug: 'same', title: 'B2', summary: '', content: '', published_at: '', header_image: '', author: '', member_only: false, published: true },
    ],
  });
  validate(p, 'test-creator', errors, warnings);
  assert.ok(hasError(errors, 'Duplicate blog slug'));
});

test('duplicate product ids rejected', () => {
  const errors = [], warnings = [];
  const p = baseProfile({
    products: [
      { id: 'dup', name: 'P1', description: '', price: 0, currency: 'ZAR', image: '', purchase_url: '', active: true },
      { id: 'dup', name: 'P2', description: '', price: 0, currency: 'ZAR', image: '', purchase_url: '', active: true },
    ],
  });
  validate(p, 'test-creator', errors, warnings);
  assert.ok(hasError(errors, 'Duplicate product id'));
});

// ---- validate() — missing media files ------------------------------------
console.log('\n\x1b[1mvalidate() — missing media files\x1b[0m');

test('non-existent avatar file triggers error', () => {
  const errors = [], warnings = [];
  validate(baseProfile({ assets: { avatar: 'profiles/nonexistent-creator/images/avatar.png', hero: '' } }), 'test-creator', errors, warnings);
  assert.ok(hasError(errors, 'Missing file assets.avatar'));
});

test('non-existent album cover triggers error', () => {
  const errors = [], warnings = [];
  const p = baseProfile({
    albums: [{ id: 'a1', title: 'T', cover_image: 'profiles/nonexistent/cover.png', media: [] }],
  });
  validate(p, 'test-creator', errors, warnings);
  assert.ok(hasError(errors, 'Missing file for album'));
});

// ---- sanitizeForPublic() --------------------------------------------------
console.log('\n\x1b[1msanitizeForPublic()\x1b[0m');

test('member_only video loses video_path', () => {
  const p = baseProfile({
    videos: [{
      id: 'v1', title: 'Secret', description: '', video_path: 'profiles/x/v.mp4',
      thumbnail_path: '', published_at: '', member_only: true,
    }],
  });
  const out = sanitizeForPublic(p);
  assert.equal(out.videos[0].video_path, null);
  assert.equal(out.videos[0].title, 'Secret');
});

test('public video keeps video_path', () => {
  const p = baseProfile({
    videos: [{
      id: 'v1', title: 'Public', description: '', video_path: 'profiles/x/v.mp4',
      thumbnail_path: '', published_at: '', member_only: false,
    }],
  });
  const out = sanitizeForPublic(p);
  assert.equal(out.videos[0].video_path, 'profiles/x/v.mp4');
});

test('member_only blog loses content and header_image', () => {
  const p = baseProfile({
    blogs: [{
      id: 'b1', slug: 'secret-post', title: 'Secret', summary: 'Teaser',
      content: 'Private content', published_at: '', header_image: 'profiles/x/h.jpg',
      author: 'A', member_only: true, published: true,
    }],
  });
  const out = sanitizeForPublic(p);
  assert.equal(out.blogs[0].content, null);
  assert.equal(out.blogs[0].header_image, null);
  assert.equal(out.blogs[0].summary, 'Teaser');
});

test('unpublished blog is excluded from output', () => {
  const p = baseProfile({
    blogs: [
      { id: 'b1', slug: 'pub', title: 'Public', summary: '', content: '', published_at: '', header_image: '', author: '', member_only: false, published: true },
      { id: 'b2', slug: 'draft', title: 'Draft', summary: '', content: '', published_at: '', header_image: '', author: '', member_only: false, published: false },
    ],
  });
  const out = sanitizeForPublic(p);
  assert.equal(out.blogs.length, 1);
  assert.equal(out.blogs[0].id, 'b1');
});

test('unpublished profile flag is preserved in sanitized output', () => {
  const p = baseProfile({ published: false });
  const out = sanitizeForPublic(p);
  assert.equal(out.published, false);
});

// ---- Summary ---------------------------------------------------------------
console.log(`\n${passed + failed} tests: \x1b[32m${passed} passed\x1b[0m, \x1b[31m${failed} failed\x1b[0m\n`);
if (failed > 0) process.exit(1);
