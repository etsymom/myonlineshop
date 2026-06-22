/*
========================================
Cookie Consent Manager
myonlineshop
========================================
*/

const CookieConsent = (() => {

  const STORAGE_KEY = "cookie_consent";

  function getConsent() {

    try {

      const saved =
        localStorage.getItem(
          STORAGE_KEY
        );

      return saved
        ? JSON.parse(saved)
        : null;

    } catch {

      return null;
    }
  }

  function saveConsent(data) {

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(data)
    );

    removeBanner();
  }

  function removeBanner() {

    const banner =
      document.getElementById(
        "cookieConsentBanner"
      );

    if (banner) {
      banner.remove();
    }
  }

  function createBanner() {

    if (getConsent()) {
      return;
    }

    const banner =
      document.createElement("div");

    banner.id =
      "cookieConsentBanner";

    banner.innerHTML = `
      <div class="cookie-card">

        <div class="cookie-title">
          🍪 Cookie Preferences
        </div>

        <div class="cookie-text">
          We use cookies to improve your experience,
          remember your preferences and provide
          essential functionality.

          You can choose which cookies to allow.
        </div>

        <div class="cookie-options">

          <label>
            <input
              type="checkbox"
              checked
              disabled
            />
            Essential Cookies
          </label>

          <label>
            <input
              type="checkbox"
              id="analyticsCookies"
              checked
            />
            Analytics Cookies
          </label>

          <label>
            <input
              type="checkbox"
              id="marketingCookies"
            />
            Marketing Cookies
          </label>

        </div>

        <div class="cookie-buttons">

          <button
            id="cookieReject"
            class="cookie-btn secondary"
          >
            Reject Non-Essential
          </button>

          <button
            id="cookieSave"
            class="cookie-btn secondary"
          >
            Save Preferences
          </button>

          <button
            id="cookieAccept"
            class="cookie-btn primary"
          >
            Accept All
          </button>

        </div>

        <div class="cookie-links">
          <a href="privacy-policy.html">
            Privacy Policy
          </a>

          •

          <a href="cookie-policy.html">
            Cookie Policy
          </a>
        </div>

      </div>
    `;

    document.body.appendChild(
      banner
    );

    attachEvents();
  }

  function attachEvents() {

    const accept =
      document.getElementById(
        "cookieAccept"
      );

    const reject =
      document.getElementById(
        "cookieReject"
      );

    const save =
      document.getElementById(
        "cookieSave"
      );

    accept.addEventListener(
      "click",
      () => {

        saveConsent({
          essential: true,
          analytics: true,
          marketing: true,
          timestamp:
            new Date().toISOString()
        });

      }
    );

    reject.addEventListener(
      "click",
      () => {

        saveConsent({
          essential: true,
          analytics: false,
          marketing: false,
          timestamp:
            new Date().toISOString()
        });

      }
    );

    save.addEventListener(
      "click",
      () => {

        const analytics =
          document.getElementById(
            "analyticsCookies"
          ).checked;

        const marketing =
          document.getElementById(
            "marketingCookies"
          ).checked;

        saveConsent({
          essential: true,
          analytics,
          marketing,
          timestamp:
            new Date().toISOString()
        });

      }
    );
  }

  function createManageButton() {

    if (
      document.getElementById(
        "manageCookiesBtn"
      )
    ) {
      return;
    }

    const button =
      document.createElement(
        "button"
      );

    button.id =
      "manageCookiesBtn";

    button.innerHTML =
      "🍪 Cookies";

    button.style.position =
      "fixed";

    button.style.bottom =
      "20px";

    button.style.left =
      "20px";

    button.style.zIndex =
      "9998";

    button.style.background =
      "#2D1B4E";

    button.style.color =
      "#FFFFFF";

    button.style.border =
      "none";

    button.style.padding =
      "10px 14px";

    button.style.borderRadius =
      "12px";

    button.style.cursor =
      "pointer";

    button.style.fontWeight =
      "700";

    button.style.boxShadow =
      "0 4px 12px rgba(0,0,0,.2)";

    button.onclick = () => {

      localStorage.removeItem(
        STORAGE_KEY
      );

      location.reload();
    };

    document.body.appendChild(
      button
    );
  }

  function injectStyles() {

    const style =
      document.createElement(
        "style"
      );

    style.innerHTML = `
      #cookieConsentBanner {

        position: fixed;
        inset: 0;

        background:
          rgba(0,0,0,.45);

        display: flex;

        align-items: center;

        justify-content: center;

        z-index: 9999;

        padding: 20px;
      }

      .cookie-card {

        width: 100%;
        max-width: 600px;

        background: #FFFFFF;

        border-radius: 18px;

        padding: 28px;

        box-shadow:
          0 20px 60px
          rgba(0,0,0,.25);
      }

      .cookie-title {

        font-size: 24px;

        font-weight: 800;

        color: #2D1B4E;

        margin-bottom: 12px;
      }

      .cookie-text {

        color: #555;

        line-height: 1.6;

        margin-bottom: 22px;
      }

      .cookie-options {

        display: flex;

        flex-direction: column;

        gap: 12px;

        margin-bottom: 22px;
      }

      .cookie-options label {

        display: flex;

        gap: 10px;

        align-items: center;

        font-size: 15px;
      }

      .cookie-buttons {

        display: flex;

        gap: 10px;

        flex-wrap: wrap;
      }

      .cookie-btn {

        flex: 1;

        min-width: 140px;

        border: none;

        border-radius: 12px;

        padding: 12px;

        font-weight: 700;

        cursor: pointer;
      }

      .cookie-btn.primary {

        background: #F5A623;

        color: #2D1B4E;
      }

      .cookie-btn.secondary {

        background: #EDE9F5;

        color: #2D1B4E;
      }

      .cookie-links {

        margin-top: 20px;

        text-align: center;

        font-size: 13px;
      }

      .cookie-links a {

        color: #2D1B4E;

        text-decoration: none;

        font-weight: 700;
      }

      @media(max-width:600px){

        .cookie-buttons{

          flex-direction:column;
        }

        .cookie-btn{

          width:100%;
        }

      }
    `;

    document.head.appendChild(
      style
    );
  }

  function init() {

    injectStyles();

    createManageButton();

    createBanner();
  }

  return {
    init,
    getConsent
  };

})();

document.addEventListener(
  "DOMContentLoaded",
  () => {
    CookieConsent.init();
  }
);
