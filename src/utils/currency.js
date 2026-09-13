/**
 * Native multi-currency helpers.
 * Money amounts in app state are always in the ACTIVE currency units (no live FX while editing).
 * FX is used only when switching currency or applying INR-defined presets/bounds.
 */

export const DEFAULT_CURRENCY = 'INR';

export const MONEY_PARAM_KEYS = ['lumpSum', 'monthlySIP', 'monthlyWithdrawal'];

/** ISO country → currency */
export const COUNTRY_CURRENCY = {
  IN: 'INR', US: 'USD', GB: 'GBP', AE: 'AED', SA: 'SAR', SG: 'SGD',
  AU: 'AUD', CA: 'CAD', EU: 'EUR', DE: 'EUR', FR: 'EUR', IT: 'EUR',
  ES: 'EUR', NL: 'EUR', IE: 'EUR', BE: 'EUR', AT: 'EUR', PT: 'EUR',
  FI: 'EUR', GR: 'EUR', JP: 'JPY', CN: 'CNY', HK: 'HKD', KR: 'KRW',
  CH: 'CHF', SE: 'SEK', NO: 'NOK', DK: 'DKK', NZ: 'NZD', ZA: 'ZAR',
  BR: 'BRL', MX: 'MXN', MY: 'MYR', TH: 'THB', ID: 'IDR', PH: 'PHP',
  PK: 'PKR', BD: 'BDT', LK: 'LKR', NP: 'NPR', QA: 'QAR', KW: 'KWD',
  BH: 'BHD', OM: 'OMR', TR: 'TRY', RU: 'RUB', PL: 'PLN', CZ: 'CZK',
  HU: 'HUF', RO: 'RON', IL: 'ILS', EG: 'EGP', NG: 'NGN', KE: 'KES',
  VN: 'VND', TW: 'TWD', AR: 'ARS', CL: 'CLP', CO: 'COP', PE: 'PEN',
};

export const CURRENCY_META = {
  INR: { symbol: '₹', locale: 'en-IN', ascii: 'Rs.', name: 'Indian Rupee' },
  USD: { symbol: '$', locale: 'en-US', ascii: 'USD', name: 'US Dollar' },
  GBP: { symbol: '£', locale: 'en-GB', ascii: 'GBP', name: 'British Pound' },
  EUR: { symbol: '€', locale: 'en-IE', ascii: 'EUR', name: 'Euro' },
  AED: { symbol: 'AED ', locale: 'en-AE', ascii: 'AED', name: 'UAE Dirham' },
  SAR: { symbol: 'SAR ', locale: 'en-SA', ascii: 'SAR', name: 'Saudi Riyal' },
  SGD: { symbol: 'S$', locale: 'en-SG', ascii: 'SGD', name: 'Singapore Dollar' },
  AUD: { symbol: 'A$', locale: 'en-AU', ascii: 'AUD', name: 'Australian Dollar' },
  CAD: { symbol: 'C$', locale: 'en-CA', ascii: 'CAD', name: 'Canadian Dollar' },
  JPY: { symbol: '¥', locale: 'ja-JP', ascii: 'JPY', name: 'Japanese Yen' },
  CNY: { symbol: '¥', locale: 'zh-CN', ascii: 'CNY', name: 'Chinese Yuan' },
  HKD: { symbol: 'HK$', locale: 'en-HK', ascii: 'HKD', name: 'Hong Kong Dollar' },
  KRW: { symbol: '₩', locale: 'ko-KR', ascii: 'KRW', name: 'South Korean Won' },
  CHF: { symbol: 'CHF ', locale: 'de-CH', ascii: 'CHF', name: 'Swiss Franc' },
  SEK: { symbol: 'kr ', locale: 'sv-SE', ascii: 'SEK', name: 'Swedish Krona' },
  NOK: { symbol: 'kr ', locale: 'nb-NO', ascii: 'NOK', name: 'Norwegian Krone' },
  DKK: { symbol: 'kr ', locale: 'da-DK', ascii: 'DKK', name: 'Danish Krone' },
  NZD: { symbol: 'NZ$', locale: 'en-NZ', ascii: 'NZD', name: 'New Zealand Dollar' },
  ZAR: { symbol: 'R', locale: 'en-ZA', ascii: 'ZAR', name: 'South African Rand' },
  BRL: { symbol: 'R$', locale: 'pt-BR', ascii: 'BRL', name: 'Brazilian Real' },
  MXN: { symbol: 'MX$', locale: 'es-MX', ascii: 'MXN', name: 'Mexican Peso' },
  MYR: { symbol: 'RM', locale: 'en-MY', ascii: 'MYR', name: 'Malaysian Ringgit' },
  THB: { symbol: '฿', locale: 'th-TH', ascii: 'THB', name: 'Thai Baht' },
  IDR: { symbol: 'Rp', locale: 'id-ID', ascii: 'IDR', name: 'Indonesian Rupiah' },
  PHP: { symbol: '₱', locale: 'en-PH', ascii: 'PHP', name: 'Philippine Peso' },
  PKR: { symbol: 'Rs ', locale: 'en-PK', ascii: 'PKR', name: 'Pakistani Rupee' },
  BDT: { symbol: '৳', locale: 'bn-BD', ascii: 'BDT', name: 'Bangladeshi Taka' },
  LKR: { symbol: 'Rs ', locale: 'en-LK', ascii: 'LKR', name: 'Sri Lankan Rupee' },
  NPR: { symbol: 'Rs ', locale: 'en-NP', ascii: 'NPR', name: 'Nepalese Rupee' },
  QAR: { symbol: 'QR ', locale: 'en-QA', ascii: 'QAR', name: 'Qatari Riyal' },
  KWD: { symbol: 'KD ', locale: 'en-KW', ascii: 'KWD', name: 'Kuwaiti Dinar' },
  BHD: { symbol: 'BD ', locale: 'en-BH', ascii: 'BHD', name: 'Bahraini Dinar' },
  OMR: { symbol: 'OMR ', locale: 'en-OM', ascii: 'OMR', name: 'Omani Rial' },
  TRY: { symbol: '₺', locale: 'tr-TR', ascii: 'TRY', name: 'Turkish Lira' },
  RUB: { symbol: '₽', locale: 'ru-RU', ascii: 'RUB', name: 'Russian Ruble' },
  PLN: { symbol: 'zł', locale: 'pl-PL', ascii: 'PLN', name: 'Polish Zloty' },
  CZK: { symbol: 'Kč', locale: 'cs-CZ', ascii: 'CZK', name: 'Czech Koruna' },
  HUF: { symbol: 'Ft', locale: 'hu-HU', ascii: 'HUF', name: 'Hungarian Forint' },
  RON: { symbol: 'lei', locale: 'ro-RO', ascii: 'RON', name: 'Romanian Leu' },
  ILS: { symbol: '₪', locale: 'he-IL', ascii: 'ILS', name: 'Israeli Shekel' },
  EGP: { symbol: 'E£', locale: 'en-EG', ascii: 'EGP', name: 'Egyptian Pound' },
  NGN: { symbol: '₦', locale: 'en-NG', ascii: 'NGN', name: 'Nigerian Naira' },
  KES: { symbol: 'KSh ', locale: 'en-KE', ascii: 'KES', name: 'Kenyan Shilling' },
  VND: { symbol: '₫', locale: 'vi-VN', ascii: 'VND', name: 'Vietnamese Dong' },
  TWD: { symbol: 'NT$', locale: 'zh-TW', ascii: 'TWD', name: 'Taiwan Dollar' },
  ARS: { symbol: 'AR$', locale: 'es-AR', ascii: 'ARS', name: 'Argentine Peso' },
  CLP: { symbol: 'CLP$', locale: 'es-CL', ascii: 'CLP', name: 'Chilean Peso' },
  COP: { symbol: 'COL$', locale: 'es-CO', ascii: 'COP', name: 'Colombian Peso' },
  PEN: { symbol: 'S/', locale: 'es-PE', ascii: 'PEN', name: 'Peruvian Sol' },
};

/** Rough INR→currency fallbacks if FX API fails */
export const FALLBACK_RATES_FROM_INR = {
  INR: 1, USD: 0.012, GBP: 0.0094, EUR: 0.011, AED: 0.044, SAR: 0.045,
  SGD: 0.016, AUD: 0.018, CAD: 0.016, JPY: 1.8, CNY: 0.087, HKD: 0.093,
  KRW: 16, CHF: 0.011, SEK: 0.12, NOK: 0.13, DKK: 0.082, NZD: 0.02,
  ZAR: 0.22, BRL: 0.066, MXN: 0.23, MYR: 0.056, THB: 0.43, IDR: 190,
  PHP: 0.68, PKR: 3.3, BDT: 1.4, LKR: 3.6, NPR: 1.6, QAR: 0.044,
  KWD: 0.0037, BHD: 0.0045, OMR: 0.0046, TRY: 0.39, RUB: 1.1, PLN: 0.047,
  CZK: 0.28, HUF: 4.4, RON: 0.055, ILS: 0.044, EGP: 0.58, NGN: 18,
  KES: 1.55, VND: 300, TWD: 0.38, ARS: 12, CLP: 11, COP: 48, PEN: 0.044,
};

export function getCurrencyMeta(code = DEFAULT_CURRENCY) {
  return CURRENCY_META[code] || CURRENCY_META[DEFAULT_CURRENCY];
}

export function currencyFromCountry(countryCode) {
  if (!countryCode) return DEFAULT_CURRENCY;
  return COUNTRY_CURRENCY[String(countryCode).toUpperCase()] || DEFAULT_CURRENCY;
}

export function currencyFromLocale(locale = '') {
  const tag = String(locale || '').toLowerCase();
  if (tag.includes('-in') || tag.startsWith('hi')) return 'INR';
  if (tag.includes('-us')) return 'USD';
  if (tag.includes('-gb') || tag.includes('-uk')) return 'GBP';
  if (tag.includes('-ae')) return 'AED';
  if (tag.includes('-au')) return 'AUD';
  if (tag.includes('-ca')) return 'CAD';
  if (tag.includes('-sg')) return 'SGD';
  if (tag.includes('-jp')) return 'JPY';
  if (tag.startsWith('de') || tag.startsWith('fr') || tag.startsWith('es') || tag.startsWith('it') || tag.startsWith('nl')) {
    return 'EUR';
  }
  return DEFAULT_CURRENCY;
}

export function getRateFromInr(currency, rates = FALLBACK_RATES_FROM_INR) {
  return rates?.[currency] ?? FALLBACK_RATES_FROM_INR[currency] ?? 1;
}

/** Convert amount between two currencies using INR-based rates map */
export function convertBetween(amount, fromCurrency, toCurrency, rates = FALLBACK_RATES_FROM_INR) {
  if (amount == null || isNaN(amount)) return 0;
  if (fromCurrency === toCurrency) return amount;
  const fromRate = getRateFromInr(fromCurrency, rates) || 1;
  const toRate = getRateFromInr(toCurrency, rates) || 1;
  const inInr = amount / fromRate;
  return inInr * toRate;
}

export function roundMoney(amount, currency = DEFAULT_CURRENCY) {
  if (amount == null || isNaN(amount)) return 0;
  // High-denomination currencies: whole units
  if (['JPY', 'KRW', 'VND', 'IDR', 'CLP', 'COP', 'HUF', 'ISK'].includes(currency)) {
    return Math.round(amount);
  }
  return Math.round(amount * 100) / 100;
}

/** Convert money fields on a params object from one currency to another */
export function convertMoneyParams(params, fromCurrency, toCurrency, rates = FALLBACK_RATES_FROM_INR) {
  if (!params || fromCurrency === toCurrency) return params;
  const next = { ...params };
  for (const key of MONEY_PARAM_KEYS) {
    if (next[key] == null) continue;
    next[key] = roundMoney(
      convertBetween(next[key], fromCurrency, toCurrency, rates),
      toCurrency
    );
  }
  return next;
}

/** Scale an INR-defined slider bound into active currency */
export function scaleInrBound(inrAmount, currency, rates = FALLBACK_RATES_FROM_INR, { min = 0 } = {}) {
  const scaled = convertBetween(inrAmount, 'INR', currency, rates);
  if (inrAmount <= 0) return 0;
  const rounded = roundMoney(scaled, currency);
  return Math.max(min, rounded);
}

function compactInr(abs) {
  if (abs >= 1e7) {
    const cr = abs / 1e7;
    return { n: cr.toFixed(cr >= 100 ? 0 : cr >= 10 ? 1 : 2), suffix: ' Cr' };
  }
  if (abs >= 1e5) {
    const lakh = abs / 1e5;
    return { n: lakh.toFixed(lakh >= 100 ? 0 : lakh >= 10 ? 1 : 2), suffix: ' L' };
  }
  return null;
}

function compactIntl(abs) {
  if (abs >= 1e9) return { n: (abs / 1e9).toFixed(abs >= 1e11 ? 0 : 2), suffix: 'B' };
  if (abs >= 1e6) return { n: (abs / 1e6).toFixed(abs >= 1e8 ? 0 : 2), suffix: 'M' };
  if (abs >= 1e3) return { n: (abs / 1e3).toFixed(abs >= 1e5 ? 0 : 1), suffix: 'K' };
  return null;
}

/**
 * Format an amount already denominated in `currency` (no FX).
 */
export function formatMoney(amount, opts = {}) {
  const currency = opts.currency || DEFAULT_CURRENCY;
  const meta = getCurrencyMeta(currency);

  if (amount == null || isNaN(amount)) {
    return opts.stripSymbol ? '0' : `${opts.ascii ? meta.ascii : meta.symbol}0`;
  }

  const sign = amount < 0 ? '-' : '';
  const abs = Math.abs(amount);
  const symbol = opts.ascii
    ? meta.ascii + (meta.ascii.endsWith(' ') ? '' : ' ')
    : meta.symbol;

  if (opts.compact !== false) {
    const compact = currency === 'INR' ? compactInr(abs) : compactIntl(abs);
    if (compact) {
      return opts.stripSymbol
        ? `${sign}${compact.n}${compact.suffix}`
        : `${sign}${symbol}${compact.n}${compact.suffix}`;
    }
  }

  const rounded = ['JPY', 'KRW', 'VND', 'IDR'].includes(currency)
    ? Math.round(abs)
    : Math.round(abs);
  const formatted = rounded.toLocaleString(meta.locale);
  return opts.stripSymbol
    ? `${sign}${formatted}`
    : `${sign}${symbol}${formatted}`;
}

function fetchTimeout(ms = 4000) {
  if (typeof AbortSignal !== 'undefined' && typeof AbortSignal.timeout === 'function') {
    return AbortSignal.timeout(ms);
  }
  const controller = new AbortController();
  setTimeout(() => controller.abort(), ms);
  return controller.signal;
}

/**
 * Detect country via IP (no browser permission). Falls back to locale.
 */
export async function detectCountryCode() {
  const endpoints = [
    async () => {
      const res = await fetch('https://ipapi.co/json/', { signal: fetchTimeout(4000) });
      if (!res.ok) throw new Error('ipapi failed');
      const data = await res.json();
      return data?.country_code || data?.country;
    },
    async () => {
      const res = await fetch('https://ipwho.is/', { signal: fetchTimeout(4000) });
      if (!res.ok) throw new Error('ipwho failed');
      const data = await res.json();
      return data?.country_code;
    },
  ];

  for (const run of endpoints) {
    try {
      const code = await run();
      if (code && typeof code === 'string') return code.toUpperCase();
    } catch {
      /* try next */
    }
  }

  return null;
}

/**
 * Fetch INR→all rates. Prefer frankfurter (ECB) via INR cross, else open.er-api.
 * Returns map of currency → units per 1 INR.
 */
export async function fetchRatesFromInr() {
  try {
    const res = await fetch('https://open.er-api.com/v6/latest/INR', {
      signal: fetchTimeout(5000),
    });
    if (!res.ok) throw new Error('er-api failed');
    const data = await res.json();
    if (data?.result === 'success' && data.rates) {
      return { ...FALLBACK_RATES_FROM_INR, ...data.rates, INR: 1 };
    }
  } catch {
    /* fallback below */
  }

  try {
    const [usdRes, inrRes] = await Promise.all([
      fetch('https://api.frankfurter.app/latest?from=USD', { signal: fetchTimeout(5000) }),
      fetch('https://api.frankfurter.app/latest?from=USD&to=INR', { signal: fetchTimeout(5000) }),
    ]);
    if (!usdRes.ok || !inrRes.ok) throw new Error('frankfurter failed');
    const usdData = await usdRes.json();
    const inrData = await inrRes.json();
    const inrPerUsd = inrData?.rates?.INR;
    if (!inrPerUsd || !usdData?.rates) throw new Error('incomplete frankfurter');

    const rates = { INR: 1, USD: 1 / inrPerUsd };
    for (const [code, perUsd] of Object.entries(usdData.rates)) {
      rates[code] = perUsd / inrPerUsd;
    }
    return { ...FALLBACK_RATES_FROM_INR, ...rates };
  } catch {
    return { ...FALLBACK_RATES_FROM_INR };
  }
}
