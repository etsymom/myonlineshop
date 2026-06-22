/*
========================================
Language Manager
myonlineshop
========================================
*/

const LocaleManager = (() => {

  const STORAGE_KEY = "user_language";

  const SUPPORTED_LANGUAGES = {
    en: {
      name: "English",
      flag: "🇺🇸"
    },
    af: {
      name: "Afrikaans",
      flag: "🇿🇦"
    },
    fr: {
      name: "Français",
      flag: "🇫🇷"
    },
    de: {
      name: "Deutsch",
      flag: "🇩🇪"
    },
    es: {
      name: "Español",
      flag: "🇪🇸"
    },
    pt: {
      name: "Português",
      flag: "🇵🇹"
    }
  };

  let translations = {};

  async function detectLanguage() {

    const saved =
      localStorage.getItem(STORAGE_KEY);

    if (
      saved &&
      SUPPORTED_LANGUAGES[saved]
    ) {
      return saved;
    }

    const browserLanguage =
      navigator.language
        .toLowerCase()
        .split("-")[0];

    if (
      SUPPORTED_LANGUAGES[
        browserLanguage
      ]
    ) {
      return browserLanguage;
    }

    return "en";
  }

  function setLanguage(language) {

    localStorage.setItem(
      STORAGE_KEY,
      language
    );

    location.reload();
  }

  async function getLanguage() {

    return await detectLanguage();
  }

  async function loadTranslations() {

    const language =
      await detectLanguage();

    if (language === "en") {
      translations = {};
      return;
    }

    try {

      const response =
        await fetch(
          `translations/${language}.json`
        );

      if (!response.ok) {
        throw new Error(
          "Translation file not found"
        );
      }

      translations =
        await response.json();

      console.log(
        "✓ Loaded language:",
        language
      );

    } catch (error) {

      console.warn(
        "Could not load translations",
        error
      );

      translations = {};
    }
  }

  function translateText(text) {

    const key = text.trim();

    if (
      translations[key]
    ) {
      return translations[key];
    }

    return text;
  }

  function translatePage() {

    const elements =
      document.querySelectorAll(
        "h1,h2,h3,h4,h5,h6,p,span,button,a,label,option"
      );

    elements.forEach(
      element => {

        if (
          element.children.length > 0
        ) {
          return;
        }

        const text =
          element.textContent.trim();

        if (!text) {
          return;
        }

        const translated =
          translateText(text);

        if (
          translated !== text
        ) {
          element.textContent =
            translated;
        }
      }
    );
  }

  function translateInputs() {

    document
      .querySelectorAll(
        "input[placeholder]"
      )
      .forEach(input => {

        const placeholder =
          input.placeholder.trim();

        if (
          translations[
            placeholder
          ]
        ) {
          input.placeholder =
            translations[
              placeholder
            ];
        }
      });

    document
      .querySelectorAll(
        "textarea[placeholder]"
      )
      .forEach(textarea => {

        const placeholder =
          textarea.placeholder.trim();

        if (
          translations[
            placeholder
          ]
        ) {
          textarea.placeholder =
            translations[
              placeholder
            ];
        }
      });
  }

  function createLanguagePicker() {

    if (
      document.getElementById(
        "languagePicker"
      )
    ) {
      return;
    }

    const select =
      document.createElement(
        "select"
      );

    select.id =
      "languagePicker";

    select.style.position =
      "fixed";

    select.style.bottom =
      "24px";

    select.style.left =
      "24px";

    select.style.zIndex =
      "9999";

    select.style.padding =
      "10px 14px";
      
    select.style.width =
      "auto";
      
    select.style.minWidth =
      "120px";

    select.style.borderRadius =
      "10px";

    select.style.border =
      "2px solid #EDE9F5";

    select.style.background =
      "white";

    select.style.cursor =
      "pointer";
      
    select.style.boxShadow =
      "0 4px 12px rgba(0,0,0,0.05)";
      
    select.style.outline =
      "none";
      
    select.style.margin =
      "0";

    Object.entries(
      SUPPORTED_LANGUAGES
    ).forEach(
      ([code, info]) => {

        const option =
          document.createElement(
            "option"
          );

        option.value = code;

        option.textContent =
          `${info.flag} ${info.name}`;

        select.appendChild(
          option
        );
      }
    );

    detectLanguage()
      .then(language => {
        select.value =
          language;
      });

    select.addEventListener(
      "change",
      () => {
        setLanguage(
          select.value
        );
      }
    );

    document.body.appendChild(
      select
    );
  }

  async function init() {

    await loadTranslations();

    translatePage();

    translateInputs();

    createLanguagePicker();

    document.documentElement.lang =
      await detectLanguage();
  }

  return {
    init,
    getLanguage,
    setLanguage,
    translatePage
  };

})();

document.addEventListener(
  "DOMContentLoaded",
  async () => {
    await LocaleManager.init();
  }
);
