/**
 * WealthWise — Financial Calculation Engine
 * Pure functions for SIP, Step-Up SIP, Lump Sum, Corpus Growth, SWP, and inflation calculations.
 */

import { formatMoney } from '../utils/currency';

/** Optional display formatter injected by CurrencyProvider (amounts already in active currency). */
let _formatCurrency = (amount, opts) => formatMoney(amount, { currency: 'INR', ...opts });

export function setCurrencyFormatter(fn) {
  if (typeof fn === 'function') _formatCurrency = fn;
}

/** Format number for display in the active currency */
export function formatCurrency(amount, opts) {
  return _formatCurrency(amount, opts);
}

/** Format number with full notation (no compact suffixes) */
export function formatCurrencyFull(amount) {
  return _formatCurrency(amount, { compact: false });
}

/** Format percentage */
export function formatPercent(value, decimals = 1) {
  if (value == null || isNaN(value)) return '0%';
  return value.toFixed(decimals) + '%';
}

/**
 * Calculate SIP Future Value
 * FV = P × [((1+r)^n - 1) / r] × (1+r)
 */
export function calculateSIPFutureValue(monthlyAmount, annualRate, years) {
  if (monthlyAmount <= 0 || years <= 0) return 0;
  if (annualRate <= 0) return monthlyAmount * years * 12;
  const r = annualRate / 100 / 12;
  const n = years * 12;
  return monthlyAmount * (((Math.pow(1 + r, n) - 1) / r) * (1 + r));
}

/**
 * Calculate Step-Up SIP Future Value
 * Each year, monthly SIP increases by stepUpPercent
 */
export function calculateStepUpSIP(initialMonthly, stepUpPercent, annualRate, years) {
  if (initialMonthly <= 0 || years <= 0) return { futureValue: 0, totalInvested: 0 };
  const r = annualRate / 100 / 12;
  let totalCorpus = 0;
  let totalInvested = 0;
  let currentMonthly = initialMonthly;

  for (let year = 0; year < years; year++) {
    for (let month = 0; month < 12; month++) {
      totalInvested += currentMonthly;
      const remainingMonths = (years - year) * 12 - month - 1;
      if (annualRate <= 0) {
        totalCorpus += currentMonthly;
      } else {
        totalCorpus += currentMonthly * Math.pow(1 + r, remainingMonths + 1);
      }
    }
    currentMonthly *= (1 + stepUpPercent / 100);
  }

  return { futureValue: totalCorpus, totalInvested };
}

/**
 * Calculate Lump Sum Compound Growth
 * FV = PV × (1 + r)^n
 */
export function calculateLumpSum(principal, annualRate, years) {
  if (principal <= 0 || years <= 0) return principal;
  if (annualRate <= 0) return principal;
  return principal * Math.pow(1 + annualRate / 100, years);
}

/**
 * Calculate Corpus Growth (post-SIP, no contributions)
 */
export function calculateCorpusGrowth(corpus, annualRate, years) {
  if (corpus <= 0 || years <= 0) return corpus;
  return calculateLumpSum(corpus, annualRate, years);
}

/**
 * Calculate SWP (Systematic Withdrawal Plan)
 * Returns detailed breakdown including when corpus depletes
 */
export function calculateSWP(corpus, monthlyWithdrawal, stepUpPercent, annualReturn, years) {
  if (corpus <= 0 || monthlyWithdrawal <= 0) {
    return {
      totalWithdrawn: 0,
      remainingCorpus: corpus,
      yearsLasted: 0,
      monthlyBreakdown: [],
      depleted: false,
      depletionYear: null,
    };
  }

  const monthlyReturn = annualReturn / 100 / 12;
  let remaining = corpus;
  let totalWithdrawn = 0;
  let currentWithdrawal = monthlyWithdrawal;
  const monthlyBreakdown = [];
  let depleted = false;
  let depletionYear = null;
  const totalMonths = years * 12;

  for (let month = 1; month <= totalMonths; month++) {
    // Apply monthly return on remaining corpus
    const interest = remaining * monthlyReturn;
    remaining += interest;

    // Step up withdrawal at the start of each year
    if (month > 1 && (month - 1) % 12 === 0) {
      currentWithdrawal *= (1 + stepUpPercent / 100);
    }

    // Withdraw
    const actualWithdrawal = Math.min(currentWithdrawal, remaining);
    remaining -= actualWithdrawal;
    totalWithdrawn += actualWithdrawal;

    monthlyBreakdown.push({
      month,
      year: Math.ceil(month / 12),
      withdrawal: actualWithdrawal,
      interest,
      remaining: Math.max(0, remaining),
      totalWithdrawn,
      scheduledWithdrawal: currentWithdrawal,
    });

    if (remaining <= 0) {
      depleted = true;
      depletionYear = Math.ceil(month / 12);
      remaining = 0;
      break;
    }
  }

  return {
    totalWithdrawn,
    remainingCorpus: Math.max(0, remaining),
    yearsLasted: depleted ? depletionYear : years,
    monthlyBreakdown,
    depleted,
    depletionYear,
    monthsSurvived: monthlyBreakdown.length,
  };
}

/**
 * Calculate Inflation-Adjusted Value
 */
export function calculateInflationAdjusted(amount, inflationRate, years) {
  if (inflationRate <= 0 || years <= 0) return amount;
  return amount / Math.pow(1 + inflationRate / 100, years);
}

/**
 * Calculate CAGR
 */
export function calculateCAGR(initialValue, finalValue, years) {
  if (initialValue <= 0 || finalValue <= 0 || years <= 0) return 0;
  return (Math.pow(finalValue / initialValue, 1 / years) - 1) * 100;
}

/**
 * Generate complete year-by-year breakdown
 * This is the main engine function that produces all data for charts and dashboard
 */
export function generateFullBreakdown(params) {
  const {
    lumpSum = 0,
    monthlySIP = 0,
    stepUpPercent = 0,
    annualReturn = 12,
    totalYears = 30,
    sipStopYear = 30,
    inflationRate = 6,
    monthlyWithdrawal = 0,
    swpStepUp = 0,
    swpReturn = 8,
    swpYears = 25,
  } = params;

  const effectiveSipStop = Math.min(sipStopYear, totalYears);
  const monthlyRate = annualReturn / 100 / 12;
  const yearlyData = [];

  let corpus = lumpSum;
  let totalInvested = lumpSum;
  let totalSIPInvested = 0;
  let currentSIP = monthlySIP;
  let yearlyReturns = 0;

  // === ACCUMULATION PHASE ===
  for (let year = 1; year <= totalYears; year++) {
    const yearStart = corpus;
    let yearInvested = 0;
    yearlyReturns = 0;

    for (let month = 1; month <= 12; month++) {
      // Monthly return on existing corpus
      const monthReturn = corpus * monthlyRate;
      yearlyReturns += monthReturn;
      corpus += monthReturn;

      // Add SIP if within SIP period
      if (year <= effectiveSipStop) {
        corpus += currentSIP;
        yearInvested += currentSIP;
        totalSIPInvested += currentSIP;
        totalInvested += currentSIP;
      }
    }

    // Step up SIP at year end
    if (year < effectiveSipStop) {
      currentSIP *= (1 + stepUpPercent / 100);
    }

    const inflationAdjusted = calculateInflationAdjusted(corpus, inflationRate, year);

    yearlyData.push({
      year,
      phase: year <= effectiveSipStop ? 'SIP Active' : 'Growth Only',
      yearStart: Math.round(yearStart),
      invested: Math.round(yearInvested),
      totalInvested: Math.round(totalInvested),
      returns: Math.round(yearlyReturns),
      totalReturns: Math.round(corpus - totalInvested),
      corpus: Math.round(corpus),
      inflationAdjusted: Math.round(inflationAdjusted),
      monthlySIP: year <= effectiveSipStop ? Math.round(currentSIP / (year < effectiveSipStop ? (1 + stepUpPercent / 100) : 1)) : 0,
    });
  }

  const corpusAtEnd = corpus;
  const totalReturns = corpus - totalInvested;

  // === WITHDRAWAL PHASE (SWP) ===
  let swpResult = null;
  if (monthlyWithdrawal > 0 && swpYears > 0) {
    swpResult = calculateSWP(corpusAtEnd, monthlyWithdrawal, swpStepUp, swpReturn, swpYears);

    // Add SWP years to yearly data
    let swpCorpus = corpusAtEnd;
    let currentSwpWithdrawal = monthlyWithdrawal;
    let totalSwpWithdrawn = 0;

    for (let y = 1; y <= swpYears; y++) {
      const swpYearStart = swpCorpus;
      let yearWithdrawn = 0;
      let yearInterest = 0;

      for (let m = 1; m <= 12; m++) {
        const interest = swpCorpus * (swpReturn / 100 / 12);
        yearInterest += interest;
        swpCorpus += interest;

        if (m === 1 && y > 1) {
          currentSwpWithdrawal *= (1 + swpStepUp / 100);
        }

        const actual = Math.min(currentSwpWithdrawal, swpCorpus);
        swpCorpus -= actual;
        yearWithdrawn += actual;
        totalSwpWithdrawn += actual;

        if (swpCorpus <= 0) { swpCorpus = 0; break; }
      }

      yearlyData.push({
        year: totalYears + y,
        phase: 'Withdrawal',
        yearStart: Math.round(swpYearStart),
        invested: 0,
        totalInvested: Math.round(totalInvested),
        returns: Math.round(yearInterest),
        totalReturns: Math.round(yearInterest),
        corpus: Math.round(Math.max(0, swpCorpus)),
        inflationAdjusted: Math.round(calculateInflationAdjusted(swpCorpus, inflationRate, totalYears + y)),
        withdrawn: Math.round(yearWithdrawn),
        totalWithdrawn: Math.round(totalSwpWithdrawn),
        monthlySIP: 0,
      });

      if (swpCorpus <= 0) break;
    }
  }

  // === CALCULATE METRICS ===
  const cagr = calculateCAGR(totalInvested, corpusAtEnd, totalYears);
  const inflationAdjustedCorpus = calculateInflationAdjusted(corpusAtEnd, inflationRate, totalYears);

  // Financial health score (0-100)
  const wealthMultiplier = totalInvested > 0 ? corpusAtEnd / totalInvested : 0;
  const swpSafety = swpResult ? (swpResult.depleted ? 0 : Math.min(1, swpResult.remainingCorpus / corpusAtEnd)) : 1;
  const inflationProtection = inflationAdjustedCorpus > totalInvested ? 1 : inflationAdjustedCorpus / totalInvested;
  const healthScore = Math.round(
    Math.min(100, (
      Math.min(wealthMultiplier / 5, 1) * 35 +
      swpSafety * 30 +
      inflationProtection * 20 +
      Math.min(cagr / 15, 1) * 15
    ))
  );

  // FIRE score
  const annualExpense = monthlyWithdrawal > 0 ? monthlyWithdrawal * 12 : monthlySIP * 12;
  const fireNumber = annualExpense * 25;
  const fireProgress = fireNumber > 0 ? Math.min(100, Math.round((corpusAtEnd / fireNumber) * 100)) : 0;

  // Passive income score (monthly income from corpus at SWP return rate)
  const passiveMonthlyIncome = corpusAtEnd * (swpReturn / 100 / 12);

  return {
    yearlyData,
    metrics: {
      totalInvested: Math.round(totalInvested),
      totalReturns: Math.round(totalReturns),
      finalCorpus: Math.round(corpusAtEnd),
      cagr: Math.round(cagr * 100) / 100,
      inflationAdjustedCorpus: Math.round(inflationAdjustedCorpus),
      healthScore,
      fireProgress,
      fireNumber: Math.round(fireNumber),
      passiveMonthlyIncome: Math.round(passiveMonthlyIncome),
      wealthMultiplier: Math.round(wealthMultiplier * 100) / 100,
      totalSIPInvested: Math.round(totalSIPInvested),
      lumpSumGrowth: Math.round(calculateLumpSum(lumpSum, annualReturn, totalYears)),
    },
    swpResult: swpResult ? {
      ...swpResult,
      totalWithdrawn: Math.round(swpResult.totalWithdrawn),
      remainingCorpus: Math.round(swpResult.remainingCorpus),
    } : null,
    params,
  };
}
