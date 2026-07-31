/**
 * InkwellMedia Shared Layout System
 * Injects: nav header, footer, cookie consent, mobile menu
 * Usage: Add <div id="inkwell-header-mount"></div> at top of <body>
 *        Add <div id="inkwell-footer-mount"></div> at bottom of <body>
 *        Include: <script src="inkwell-layout.js"></script>
 */

(function () {
  const SUPABASE_URL = "https://ndfqavpmqahdqpsqndbz.supabase.co";
  const SUPABASE_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5kZnFhdnBtcWFoZHFwc3FuZGJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIwODg0NjIsImV4cCI6MjA5NzY2NDQ2Mn0.DDiVkCTEJ__by6YlABHBhgKpyAWp_axezvDK7HwnVEs";

  const currentPage = window.location.pathname.split('/').pop() || 'landing.html';

  const NAV_LINKS = [
    { label: 'Platform', href: 'landing.html', pages: ['landing.html', ''] },
    { label: 'For Creators', href: 'for-creators.html', pages: ['for-creators.html'] },
    { label: 'Creators', href: 'creators.html', pages: ['creators.html', 'creator.html'] },
    { label: 'Pricing', href: 'pricing.html', pages: ['pricing.html'] },
    { label: 'The Creator Economy', href: 'the-creator-economy.html', pages: ['the-creator-economy.html'] },
    { label: 'Blog', href: 'blog.html', pages: ['blog.html'] },
    { label: 'About', href: 'about.html', pages: ['about.html'] },
  ];

  const STYLES = `
    <style id="inkwell-layout-styles">
      :root {
        --ink-aubergine: #2D1B4E;
        --ink-aubergine-deep: #1A0F30;
        --ink-amber: #F5A623;
        --ink-amber-dark: #D4891A;
        --ink-parchment: #FAF7F2;
        --ink-white: #FFFFFF;
        --ink-slate: #8A7FA0;
        --ink-slate-light: #EDE9F5;
        --ink-success: #059669;
        --ink-danger: #E3394A;
        --ink-radius: 16px;
        --ink-nav-h: 68px;
      }

      *, *::before, *::after { box-sizing: border-box; }
      html, body { max-width: 100%; overflow-x: clip; }
      html.ink-menu-open, body.ink-menu-open { overflow: hidden; }

      /* ── NAV ─────────────────────────────────── */
      #inkwell-nav {
        position: sticky;
        top: 0;
        z-index: 100;
        height: var(--ink-nav-h);
        background: var(--ink-aubergine);
        border-bottom: 1px solid rgba(255,255,255,0.08);
        display: flex;
        align-items: center;
        padding: 0 clamp(16px, 4vw, 48px);
        gap: 32px;
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
      }

      .ink-brand {
        display: flex;
        align-items: center;
        gap: 10px;
        text-decoration: none;
        flex-shrink: 0;
      }
      .ink-brand-icon {
        width: 36px; height: 36px;
        background: var(--ink-amber);
        border-radius: 10px;
        display: flex; align-items: center; justify-content: center;
        font-size: 18px;
        flex-shrink: 0;
      }
      .ink-brand-name {
        font-family: 'Playfair Display', serif;
        font-size: 20px;
        font-weight: 900;
        color: var(--ink-white);
        line-height: 1;
      }
      .ink-brand-name span { color: var(--ink-amber); }

      .ink-nav-links {
        display: flex;
        align-items: center;
        gap: 4px;
        flex: 1;
        list-style: none;
        margin: 0; padding: 0;
      }
      .ink-nav-links a {
        display: block;
        padding: 7px 13px;
        border-radius: 10px;
        font-family: 'DM Sans', sans-serif;
        font-size: 14px;
        font-weight: 600;
        color: rgba(255,255,255,0.75);
        text-decoration: none;
        transition: color 0.15s, background 0.15s;
        white-space: nowrap;
      }
      .ink-nav-links a:hover,
      .ink-nav-links a.active {
        color: var(--ink-white);
        background: rgba(255,255,255,0.1);
      }
      .ink-nav-links a.active { color: var(--ink-amber); }

      .ink-nav-actions {
        display: flex;
        align-items: center;
        gap: 8px;
        flex-shrink: 0;
        margin-left: auto;
      }

      .ink-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 9px 18px;
        border-radius: 10px;
        border: none;
        font-family: 'DM Sans', sans-serif;
        font-weight: 700;
        font-size: 13px;
        cursor: pointer;
        text-decoration: none;
        transition: opacity 0.15s, transform 0.1s;
        white-space: nowrap;
      }
      .ink-btn:hover { opacity: 0.88; }
      .ink-btn:active { transform: scale(0.97); }
      .ink-btn-ghost {
        background: rgba(255,255,255,0.1);
        color: var(--ink-white);
        border: 1px solid rgba(255,255,255,0.15);
      }
      .ink-btn-amber {
        background: var(--ink-amber);
        color: var(--ink-aubergine);
      }
      .ink-btn-danger {
        background: var(--ink-danger);
        color: var(--ink-white);
      }
      .ink-btn-aubergine {
        background: var(--ink-aubergine);
        color: var(--ink-white);
        border: 1.5px solid rgba(255,255,255,0.15);
      }

      /* Mobile hamburger */
      .ink-hamburger {
        display: none;
        flex-direction: column;
        gap: 5px;
        background: none;
        border: none;
        cursor: pointer;
        padding: 6px;
        border-radius: 8px;
        margin-left: auto;
      }
      .ink-hamburger span {
        display: block;
        width: 22px;
        height: 2px;
        background: var(--ink-white);
        border-radius: 2px;
        transition: transform 0.25s, opacity 0.25s;
      }
      .ink-hamburger:focus-visible,
      .ink-drawer-close:focus-visible,
      #inkwell-mobile-menu a:focus-visible,
      #inkwell-mobile-menu button:focus-visible {
        outline: 3px solid var(--ink-amber);
        outline-offset: 3px;
      }

      /* Responsive navigation drawer */
      #inkwell-menu-backdrop {
        position: fixed;
        inset: 0;
        z-index: 998;
        background: rgba(15, 8, 28, 0.68);
        opacity: 0;
        visibility: hidden;
        pointer-events: none;
        transition: opacity 0.22s ease, visibility 0.22s ease;
        backdrop-filter: blur(3px);
        -webkit-backdrop-filter: blur(3px);
      }
      #inkwell-menu-backdrop.open {
        opacity: 1;
        visibility: visible;
        pointer-events: auto;
      }
      #inkwell-mobile-menu {
        position: fixed;
        top: 0;
        right: 0;
        bottom: 0;
        width: min(400px, 100vw);
        height: 100vh;
        height: 100dvh;
        background: var(--ink-aubergine-deep);
        border-left: 1px solid rgba(255,255,255,0.1);
        box-shadow: -20px 0 60px rgba(0,0,0,0.4);
        z-index: 999;
        display: flex;
        flex-direction: column;
        transform: translateX(100%);
        visibility: hidden;
        transition: transform 0.25s ease, visibility 0.25s ease;
        font-family: inherit;
        overflow: hidden;
        overscroll-behavior: contain;
      }
      #inkwell-mobile-menu.open {
        transform: translateX(0);
        visibility: visible;
      }
      .ink-drawer-header {
        min-height: var(--ink-nav-h);
        padding: 0 18px 0 20px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
        flex-shrink: 0;
        background: var(--ink-aubergine);
        border-bottom: 1px solid rgba(255,255,255,0.1);
      }
      .ink-drawer-close {
        width: 40px;
        height: 40px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        border: 1px solid rgba(255,255,255,0.14);
        border-radius: 10px;
        background: rgba(255,255,255,0.08);
        color: var(--ink-white);
        font: inherit;
        font-size: 26px;
        line-height: 1;
        cursor: pointer;
        transition: background 0.15s, border-color 0.15s;
      }
      .ink-drawer-close:hover {
        background: rgba(255,255,255,0.14);
        border-color: rgba(255,255,255,0.25);
      }
      .ink-drawer-scroll {
        flex: 1;
        min-height: 0;
        overflow-y: auto;
        overflow-x: hidden;
        padding: 22px 20px max(24px, env(safe-area-inset-bottom));
        scrollbar-width: thin;
        scrollbar-color: rgba(255,255,255,0.22) transparent;
      }
      .ink-drawer-section-label {
        margin: 0 0 10px;
        color: var(--ink-amber);
        font-size: 11px;
        font-weight: 800;
        letter-spacing: 0.12em;
        text-transform: uppercase;
      }
      .ink-drawer-links {
        display: flex;
        flex-direction: column;
        gap: 5px;
      }
      .ink-drawer-links a {
        display: flex;
        align-items: center;
        min-height: 46px;
        padding: 11px 14px;
        border-radius: 10px;
        font-size: 15px;
        font-weight: 700;
        color: rgba(255,255,255,0.82);
        text-decoration: none;
        transition: background 0.15s, color 0.15s;
      }
      .ink-drawer-links a:hover { background: rgba(255,255,255,0.08); color: #fff; }
      .ink-drawer-links a.active {
        color: var(--ink-amber);
        background: rgba(245,166,35,0.1);
      }
      .ink-mobile-divider {
        height: 1px;
        background: rgba(255,255,255,0.08);
        margin: 22px 0;
      }
      .ink-mobile-actions {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 8px;
      }
      .ink-mobile-actions .ink-btn {
        width: 100%;
        min-width: 0;
        min-height: 46px;
        padding: 10px 12px;
        justify-content: center;
      }

      /*
       * The complete row needs substantially more room than the page-content
       * tablet breakpoint, especially for signed-in users (four action
       * buttons). Collapse it before the nowrap items can widen the viewport.
       */
      @media (max-width: 1340px) {
        .ink-nav-links { display: none; }
        .ink-nav-actions { display: none; }
        .ink-hamburger { display: flex; }
      }
      @media (min-width: 1341px) {
        #inkwell-menu-backdrop { display: none; }
        #inkwell-mobile-menu { display: none; }
      }
      @media (max-width: 480px) {
        #inkwell-mobile-menu {
          width: 100vw;
          border-left: 0;
        }
        .ink-mobile-actions { grid-template-columns: 1fr; }
      }
      @media (prefers-reduced-motion: reduce) {
        #inkwell-menu-backdrop,
        #inkwell-mobile-menu { transition: none; }
      }

      /* ── FOOTER ─────────────────────────────── */
      #inkwell-footer {
        background: var(--ink-aubergine-deep);
        border-top: 1px solid rgba(255,255,255,0.07);
        padding: 60px clamp(20px, 5vw, 80px) 32px;
        color: rgba(255,255,255,0.7);
        font-family: 'DM Sans', sans-serif;
      }

      .ink-footer-grid {
        display: grid;
        grid-template-columns: 2fr 1fr 1fr 1fr;
        gap: 40px;
        max-width: 1100px;
        margin: 0 auto 48px;
      }

      .ink-footer-brand-name {
        font-family: 'Playfair Display', serif;
        font-size: 22px;
        font-weight: 900;
        color: var(--ink-white);
        margin-bottom: 12px;
      }
      .ink-footer-brand-name span { color: var(--ink-amber); }

      .ink-footer-desc {
        font-size: 14px;
        line-height: 1.65;
        color: rgba(255,255,255,0.55);
        margin-bottom: 20px;
        max-width: 280px;
      }

      .ink-footer-socials {
        display: flex;
        gap: 10px;
      }
      .ink-footer-social-link {
        width: 36px; height: 36px;
        border-radius: 9px;
        background: rgba(255,255,255,0.07);
        border: 1px solid rgba(255,255,255,0.1);
        display: flex; align-items: center; justify-content: center;
        font-size: 16px;
        text-decoration: none;
        transition: background 0.15s;
      }
      .ink-footer-social-link:hover { background: rgba(245,166,35,0.2); }

      .ink-footer-col-title {
        font-size: 11px;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 0.1em;
        color: var(--ink-amber);
        margin-bottom: 16px;
      }

      .ink-footer-col-links {
        list-style: none;
        margin: 0; padding: 0;
        display: flex;
        flex-direction: column;
        gap: 10px;
      }
      .ink-footer-col-links a {
        font-size: 14px;
        color: rgba(255,255,255,0.6);
        text-decoration: none;
        transition: color 0.15s;
      }
      .ink-footer-col-links a:hover { color: var(--ink-white); }

      .ink-footer-bottom {
        max-width: 1100px;
        margin: 0 auto;
        padding-top: 24px;
        border-top: 1px solid rgba(255,255,255,0.07);
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-wrap: wrap;
        gap: 12px;
        font-size: 12px;
        color: rgba(255,255,255,0.35);
      }
      .ink-footer-bottom a {
        color: rgba(255,255,255,0.4);
        text-decoration: none;
        transition: color 0.15s;
      }
      .ink-footer-bottom a:hover { color: rgba(255,255,255,0.8); }

      @media (max-width: 860px) {
        .ink-footer-grid {
          grid-template-columns: 1fr 1fr;
        }
      }
      @media (max-width: 540px) {
        .ink-footer-grid {
          grid-template-columns: 1fr;
        }
      }

      /* ── COOKIE BANNER ──────────────────────── */
      #inkwell-cookie {
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        width: min(560px, calc(100vw - 32px));
        background: var(--ink-aubergine-deep);
        border: 1px solid rgba(255,255,255,0.1);
        border-radius: 16px;
        padding: 18px 22px;
        display: flex;
        align-items: center;
        gap: 16px;
        z-index: 200;
        box-shadow: 0 16px 48px rgba(0,0,0,0.4);
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        animation: slideUp 0.4s ease;
      }
      @keyframes slideUp {
        from { transform: translateX(-50%) translateY(20px); opacity: 0; }
        to   { transform: translateX(-50%) translateY(0);   opacity: 1; }
      }
      #inkwell-cookie p {
        font-family: 'DM Sans', sans-serif;
        font-size: 13px;
        color: rgba(255,255,255,0.7);
        margin: 0;
        line-height: 1.5;
        flex: 1;
      }
      #inkwell-cookie p a {
        color: var(--ink-amber);
        text-decoration: none;
      }
      #inkwell-cookie .ink-cookie-actions {
        display: flex;
        gap: 8px;
        flex-shrink: 0;
      }
    </style>
  `;

  function buildNav(isLoggedIn) {
    const links = NAV_LINKS.map(l => {
      const active = l.pages.includes(currentPage) ? ' active' : '';
      return `<li><a href="${l.href}" class="${active}">${l.label}</a></li>`;
    }).join('');

    const actions = isLoggedIn
      ? `<a href="members.html" class="ink-btn ink-btn-ghost">Dashboard</a>
         <a href="explore.html" class="ink-btn ink-btn-amber">Explore</a>
         <a href="profile.html" class="ink-btn ink-btn-ghost">Profile</a>
         <button class="ink-btn ink-btn-danger" onclick="window.inkwellLogout()">Log out</button>`
      : `<a href="index.html" class="ink-btn ink-btn-ghost">Sign In</a>
         <a href="creator-apply.html" class="ink-btn ink-btn-amber">Apply as Creator</a>`;

    const mobileActions = isLoggedIn
      ? `<a href="members.html" class="ink-btn ink-btn-ghost">Dashboard</a>
         <a href="explore.html" class="ink-btn ink-btn-amber">Explore</a>
         <a href="profile.html" class="ink-btn ink-btn-ghost">Profile</a>
         <button class="ink-btn ink-btn-danger" onclick="window.inkwellLogout()">Log out</button>`
      : `<a href="index.html" class="ink-btn ink-btn-ghost">Sign In</a>
         <a href="creator-apply.html" class="ink-btn ink-btn-amber">Apply</a>`;

    return `
      <nav id="inkwell-nav" role="navigation" aria-label="Main navigation">
        <a href="landing.html" class="ink-brand" aria-label="InkwellMedia Home">
          <div class="ink-brand-icon" aria-hidden="true">&#x1F58B;&#xFE0F;</div>
          <div class="ink-brand-name">Inkwell<span>Media</span></div>
        </a>
        <ul class="ink-nav-links" role="list">${links}</ul>
        <div class="ink-nav-actions">${actions}</div>
        <button class="ink-hamburger" id="ink-hamburger" type="button" aria-label="Open navigation" aria-controls="inkwell-mobile-menu" aria-expanded="false">
          <span></span><span></span><span></span>
        </button>
      </nav>
      <div id="inkwell-menu-backdrop" aria-hidden="true"></div>
      <aside id="inkwell-mobile-menu" role="dialog" aria-modal="true" aria-labelledby="inkwell-drawer-title" aria-hidden="true" tabindex="-1">
        <div class="ink-drawer-header">
          <a href="landing.html" class="ink-brand" id="inkwell-drawer-title" aria-label="InkwellMedia Home">
            <div class="ink-brand-icon" aria-hidden="true">&#x1F58B;&#xFE0F;</div>
            <div class="ink-brand-name">Inkwell<span>Media</span></div>
          </a>
          <button class="ink-drawer-close" id="ink-drawer-close" type="button" aria-label="Close navigation">&times;</button>
        </div>
        <div class="ink-drawer-scroll">
          <div class="ink-drawer-section-label">Navigate</div>
          <nav class="ink-drawer-links" aria-label="Responsive navigation">
            ${NAV_LINKS.map(l => {
              const active = l.pages.includes(currentPage) ? " active" : "";
              return `<a href="${l.href}" class="${active}">${l.label}</a>`;
            }).join("")}
          </nav>
          <div class="ink-mobile-divider"></div>
          <section aria-labelledby="inkwell-account-actions-title">
            <div class="ink-drawer-section-label" id="inkwell-account-actions-title">Account</div>
            <div class="ink-mobile-actions">${mobileActions}</div>
          </section>
        </div>
      </aside>
    `;
  }

  function buildFooter() {
    return `
      <footer id="inkwell-footer" role="contentinfo">
        <div class="ink-footer-grid">
          <div>
            <div class="ink-footer-brand-name">Inkwell<span>Media</span></div>
            <p class="ink-footer-desc">The platform where independent creators thrive. Own your audience. Keep more of what you earn. Build what matters.</p>
            <div class="ink-footer-socials">
              <a href="#" class="ink-footer-social-link" aria-label="Instagram">&#x1F4F8;</a>
              <a href="#" class="ink-footer-social-link" aria-label="TikTok">&#x1F3B5;</a>
              <a href="#" class="ink-footer-social-link" aria-label="X / Twitter">&#x1D54F;</a>
              <a href="#" class="ink-footer-social-link" aria-label="YouTube">&#x25B6;</a>
            </div>
          </div>
          <div>
            <div class="ink-footer-col-title">Platform</div>
            <ul class="ink-footer-col-links">
              <li><a href="landing.html">How It Works</a></li>
              <li><a href="pricing.html">Pricing</a></li>
              <li><a href="explore.html">Explore</a></li>
              <li><a href="the-creator-economy.html">Creator Economy</a></li>
              <li><a href="blog.html">Blog</a></li>
            </ul>
          </div>
          <div>
            <div class="ink-footer-col-title">Creators</div>
            <ul class="ink-footer-col-links">
              <li><a href="for-creators.html">For Creators</a></li>
              <li><a href="creator-apply.html">Apply Now</a></li>
              <li><a href="affiliate.html">Affiliate Program</a></li>
              <li><a href="faq.html">Creator FAQ</a></li>
            </ul>
          </div>
          <div>
            <div class="ink-footer-col-title">Company</div>
            <ul class="ink-footer-col-links">
              <li><a href="about.html">About Us</a></li>
              <li><a href="contact.html">Contact</a></li>
              <li><a href="privacy.html">Privacy Policy</a></li>
              <li><a href="terms.html">Terms of Service</a></li>
              <li><a href="creator-terms.html">Creator Terms</a></li>
            </ul>
          </div>
        </div>
        <div class="ink-footer-bottom">
          <span>&copy; ${new Date().getFullYear()} InkwellMedia. All rights reserved.</span>
          <span>
            <a href="privacy.html">Privacy</a> &nbsp;&middot;&nbsp;
            <a href="terms.html">Terms</a> &nbsp;&middot;&nbsp;
            <a href="contact.html">Contact</a>
          </span>
        </div>
      </footer>
    `;
  }

  function buildCookieBanner() {
    if (localStorage.getItem('ink_cookie_ok')) return '';
    return `
      <div id="inkwell-cookie" role="dialog" aria-label="Cookie consent">
        <p>We use cookies to improve your experience. By continuing, you agree to our <a href="privacy.html">Privacy Policy</a>.</p>
        <div class="ink-cookie-actions">
          <button class="ink-btn ink-btn-ghost" onclick="document.getElementById('inkwell-cookie').remove();" style="font-size:12px; padding:8px 14px;">Decline</button>
          <button class="ink-btn ink-btn-amber" onclick="localStorage.setItem('ink_cookie_ok','1'); document.getElementById('inkwell-cookie').remove();" style="font-size:12px; padding:8px 14px;">Accept</button>
        </div>
      </div>
    `;
  }


  async function checkSession() {
    if (localStorage.getItem('gh_user')) return true;
    if (!window.supabase) return false;
    try {
      const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON, {
        auth: { persistSession: true }
      });
      const { data } = await client.auth.getSession();
      return !!(data && data.session);
    } catch { return false; }
  }


  async function init() {
    // Inject styles
    document.head.insertAdjacentHTML('beforeend', STYLES);

    // Check auth
    const isLoggedIn = await checkSession();

    // Inject nav
    const headerMount = document.getElementById('inkwell-header-mount');
    if (headerMount) {
      headerMount.outerHTML = buildNav(isLoggedIn);
    }

    // Inject footer
    const footerMount = document.getElementById('inkwell-footer-mount');
    if (footerMount) {
      footerMount.outerHTML = buildFooter();
    }

    // Inject cookie banner
    if (!localStorage.getItem('ink_cookie_ok')) {
      document.body.insertAdjacentHTML('beforeend', buildCookieBanner());
    }

    // Wire responsive navigation drawer
    const ham = document.getElementById("ink-hamburger");
    const mobileMenu = document.getElementById("inkwell-mobile-menu");
    const backdrop = document.getElementById("inkwell-menu-backdrop");
    const closeButton = document.getElementById("ink-drawer-close");
    let lastFocusedElement = null;

    if (ham && mobileMenu && backdrop && closeButton) {
      const getFocusableElements = () => Array.from(mobileMenu.querySelectorAll(
        "a[href], button:not([disabled]), [tabindex]:not([tabindex=\"-1\"])"
      )).filter((element) => element.getClientRects().length > 0);

      const openDrawer = () => {
        lastFocusedElement = document.activeElement === document.body
          ? ham
          : document.activeElement;
        mobileMenu.classList.add("open");
        backdrop.classList.add("open");
        mobileMenu.setAttribute("aria-hidden", "false");
        ham.setAttribute("aria-expanded", "true");
        ham.setAttribute("aria-label", "Close navigation");
        document.documentElement.classList.add("ink-menu-open");
        document.body.classList.add("ink-menu-open");
        window.setTimeout(() => closeButton.focus({ preventScroll: true }), 0);
      };

      const closeDrawer = (restoreFocus = true) => {
        if (!mobileMenu.classList.contains("open")) return;
        mobileMenu.classList.remove("open");
        backdrop.classList.remove("open");
        mobileMenu.setAttribute("aria-hidden", "true");
        ham.setAttribute("aria-expanded", "false");
        ham.setAttribute("aria-label", "Open navigation");
        document.documentElement.classList.remove("ink-menu-open");
        document.body.classList.remove("ink-menu-open");
        if (restoreFocus) {
          const focusTarget = lastFocusedElement && typeof lastFocusedElement.focus === "function"
            ? lastFocusedElement
            : ham;
          focusTarget.focus({ preventScroll: true });
        }
      };

      ham.addEventListener("click", () => {
        if (mobileMenu.classList.contains("open")) closeDrawer();
        else openDrawer();
      });
      closeButton.addEventListener("click", () => closeDrawer());
      backdrop.addEventListener("click", () => closeDrawer());

      mobileMenu.querySelectorAll("a[href]").forEach((link) => {
        link.addEventListener("click", () => closeDrawer(false));
      });

      document.addEventListener("keydown", (event) => {
        if (!mobileMenu.classList.contains("open")) return;
        if (event.key === "Escape") {
          event.preventDefault();
          closeDrawer();
          return;
        }
        if (event.key !== "Tab") return;

        const focusable = getFocusableElements();
        if (!focusable.length) {
          event.preventDefault();
          mobileMenu.focus();
          return;
        }
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      });

      window.addEventListener("resize", () => {
        if (window.innerWidth > 1340) closeDrawer(false);
      });
    }
  }


  window.inkwellLogout = async function() {
    localStorage.removeItem('gh_user');
    if (window.supabase) {
      const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON);
      await client.auth.signOut();
    }
    window.location.href = "index.html";
  };


  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
