import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  DEFAULT_CURRENCY,
  FALLBACK_RATES_FROM_INR,
  convertBetween,
  convertMoneyParams,
  currencyFromCountry,
  currencyFromLocale,
  detectCountryCode,
  fetchRatesFromInr,
  formatMoney,
  getCurrencyMeta,
  getRateFromInr,
  roundMoney,
  scaleInrBound,
} from '../utils/currency';
import { setCurrencyFormatter } from '../engine/sipCalculator';

const CurrencyContext = createContext(null);
const STORAGE_KEY = 'wealthwise_currency_override';

export function CurrencyProvider({ children }) {
  const [currency, setCurrencyState] = useState(DEFAULT_CURRENCY);
  const [country, setCountry] = useState(null);
  const [rates, setRates] = useState(FALLBACK_RATES_FROM_INR);
  const [ready, setReady] = useState(false);
  const [manual, setManual] = useState(false);
  const currencyRef = useRef(currency);
  currencyRef.current = currency;

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const override = localStorage.getItem(STORAGE_KEY);
      const localeGuess = currencyFromLocale(navigator.language || navigator.languages?.[0]);

      const [countryCode, liveRates] = await Promise.all([
        detectCountryCode(),
        fetchRatesFromInr(),
      ]);

      if (cancelled) return;

      const nextRates = liveRates || FALLBACK_RATES_FROM_INR;
      setRates(nextRates);
      if (countryCode) setCountry(countryCode);

      if (override && getCurrencyMeta(override)) {
        setCurrencyState(override);
        setManual(true);
      } else {
        const detected = currencyFromCountry(countryCode) || localeGuess || DEFAULT_CURRENCY;
        setCurrencyState(detected);
        setManual(false);
      }
      setReady(true);
    })();

    return () => { cancelled = true; };
  }, []);

  const meta = getCurrencyMeta(currency);
  const rate = getRateFromInr(currency, rates);

  // Amounts are already in active currency — format only (no FX)
  const formatCurrency = useCallback(
    (amount, opts = {}) =>
      formatMoney(amount, {
        currency,
        compact: opts.compact !== false,
        ascii: opts.ascii,
        stripSymbol: opts.stripSymbol,
      }),
    [currency]
  );

  const fromInr = useCallback(
    (amountInr) => roundMoney(convertBetween(amountInr, 'INR', currency, rates), currency),
    [currency, rates]
  );

  const scaleBound = useCallback(
    (inrAmount, opts) => scaleInrBound(inrAmount, currency, rates, opts),
    [currency, rates]
  );

  /**
   * Switch currency. Optionally convert money params via onConvert callback.
   * onConvert(from, to, rates) => void
   */
  const setCurrency = useCallback((code, { convertParams } = {}) => {
    if (!code || !getCurrencyMeta(code)) return;
    const from = currencyRef.current;
    if (from === code) return;

    if (typeof convertParams === 'function') {
      convertParams(from, code, rates);
    }

    setCurrencyState(code);
    setManual(true);
    localStorage.setItem(STORAGE_KEY, code);
  }, [rates]);

  const resetToDetected = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setManual(false);
    const code = country
      ? currencyFromCountry(country)
      : currencyFromLocale(navigator.language);
    setCurrencyState(code || DEFAULT_CURRENCY);
  }, [country]);

  // Keep sipCalculator's module formatter in sync during render so children
  // see the active currency on the same pass (useEffect would run too late).
  setCurrencyFormatter(formatCurrency);

  const value = useMemo(
    () => ({
      ready,
      currency,
      country,
      manual,
      rate,
      rates,
      symbol: meta.symbol,
      asciiSymbol: meta.ascii,
      locale: meta.locale,
      currencyName: meta.name,
      formatCurrency,
      fromInr,
      scaleBound,
      convertMoneyParams,
      setCurrency,
      resetToDetected,
    }),
    [
      ready, currency, country, manual, rate, rates, meta,
      formatCurrency, fromInr, scaleBound, setCurrency, resetToDetected,
    ]
  );

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext);
  if (!ctx) {
    throw new Error('useCurrency must be used within CurrencyProvider');
  }
  return ctx;
}
