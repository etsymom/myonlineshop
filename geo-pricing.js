/*
========================================
Geo Pricing & Currency Detection
InkwellMedia / myonlineshop
========================================
*/

const GeoPricing = (() => {

  const STORAGE_KEY = "user_currency";

  const FALLBACK_RATES = {
    USD: 1,
    ZAR: 18.50,
    GBP: 0.79,
    EUR: 0.92
  };

  const COUNTRY_MAP = {
    ZA: "ZAR",
    US: "USD",
    GB: "GBP",

    DE: "EUR",
    FR: "EUR",
    ES: "EUR",
    IT: "EUR",
    NL: "EUR",
    BE: "EUR",
    PT: "EUR",
    IE: "EUR",
    AT: "EUR",
    FI: "EUR",
    GR: "EUR"
  };

  let exchangeRates = { ...FALLBACK_RATES };

  async function loadExchangeRates() {

    try {

      const response = await fetch(
        "https://open.er-api.com/v6/latest/USD"
      );

      const data = await response.json();

      if (
        data &&
        data.rates &&
        data.rates.ZAR &&
        data.rates.GBP &&
        data.rates.EUR
      ) {

        exchangeRates = {
          USD: 1,
          ZAR: data.rates.ZAR,
          GBP: data.rates.GBP,
          EUR: data.rates.EUR
        };

        console.log(
          "✓ Live exchange rates loaded"
        );
      }

    } catch (err) {

      console.warn(
        "Using fallback exchange rates",
        err
      );
    }
  }

  async function detectCountry() {

    try {

      const response = await fetch(
        "https://ipapi.co/json/"
      );

      const data = await response.json();

      if (data.country_code) {
        return data.country_code;
      }

    } catch (e) {
      console.warn(
        "Country lookup failed"
      );
    }

    return "US";
  }

  async function detectCurrency() {

    const saved =
      localStorage.getItem(STORAGE_KEY);

    if (saved) {
      return saved;
    }

    const country =
      await detectCountry();

    const currency =
      COUNTRY_MAP[country] || "USD";

    localStorage.setItem(
      STORAGE_KEY,
      currency
    );

    return currency;
  }

  function setCurrency(currencyCode) {

    localStorage.setItem(
      STORAGE_KEY,
      currencyCode
    );

    window.location.reload();
  }

  async function getCurrency() {

    return await detectCurrency();
  }

  async function convert(amountUSD) {

    const currency =
      await detectCurrency();

    const rate =
      exchangeRates[currency] || 1;

    return amountUSD * rate;
  }

  async function formatUSD(amountUSD) {

    const currency =
      await detectCurrency();

    const converted =
      await convert(amountUSD);

    return new Intl.NumberFormat(
      navigator.language,
      {
        style: "currency",
        currency
      }
    ).format(converted);
  }

  async function formatElement(element) {

    const usd =
      parseFloat(
        element.dataset.usd
      );

    if (isNaN(usd)) return;

    element.textContent =
      await formatUSD(usd);
  }

  async function updatePagePrices() {

    const elements =
      document.querySelectorAll(
        "[data-usd]"
      );

    for (const element of elements) {

      await formatElement(
        element
      );
    }
  }

  async function createCurrencyPicker() {

    if (
      document.getElementById(
        "currencyPicker"
      )
    ) return;

    const current =
      await detectCurrency();

    const select =
      document.createElement(
        "select"
      );

    select.id =
      "currencyPicker";

    select.innerHTML = `
      <option value="USD">🇺🇸 USD</option>
      <option value="ZAR">🇿🇦 ZAR</option>
      <option value="GBP">🇬🇧 GBP</option>
      <option value="EUR">🇪🇺 EUR</option>
    `;

    select.value = current;

    select.style.padding =
      "10px 14px";

    select.style.borderRadius =
      "10px";

    select.style.border =
      "2px solid #EDE9F5";

    select.style.fontSize =
      "14px";
      
    select.style.position =
      "fixed";
      
    select.style.width =
      "auto";
      
    select.style.minWidth =
      "120px";
      
    select.style.bottom =
      "74px";
      
    select.style.left =
      "24px";
      
    select.style.zIndex =
      "9999";
      
    select.style.boxShadow =
      "0 4px 12px rgba(0,0,0,0.05)";
      
    select.style.background =
      "white";
      
    select.style.cursor =
      "pointer";

    select.onchange = () => {
      setCurrency(
        select.value
      );
    };

    document.body.appendChild(
      select
    );
  }

  async function init() {

    await loadExchangeRates();

    await updatePagePrices();

    await createCurrencyPicker();
  }

  return {
    init,
    convert,
    formatUSD,
    getCurrency,
    setCurrency,
    updatePagePrices,
    createCurrencyPicker
  };

})();

document.addEventListener(
  "DOMContentLoaded",
  () => {
    GeoPricing.init();
  }
);
