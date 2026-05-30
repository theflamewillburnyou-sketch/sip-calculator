import { formatCurrency } from '../engine/sipCalculator';

/** Encodes current calculator state into a shareable URL. */
export function buildStrategyShareUrl(params) {
  const query = new URLSearchParams({
    ls: params.lumpSum,
    sip: params.monthlySIP,
    su: params.stepUpPercent,
    ar: params.annualReturn,
    ty: params.totalYears,
    ssy: params.sipStopYear,
    inf: params.inflationRate,
    mw: params.monthlyWithdrawal,
    wsu: params.swpStepUp,
    wr: params.swpReturn,
    wy: params.swpYears,
  }).toString();

  const base = typeof window !== 'undefined'
    ? `${window.location.origin}${window.location.pathname}`
    : 'https://wealthwise.app';

  return `${base}?${query}`;
}

/**
 * Dynamic share metadata from the active simulation.
 * @param {object} params - Calculator inputs
 * @param {object} results - Generated breakdown (optional)
 */
export function buildSharePayload(params, results) {
  const url = buildStrategyShareUrl(params);
  const metrics = results?.metrics;

  const corpusLine = metrics
    ? `Projected corpus: ${formatCurrency(metrics.finalCorpus)} (${metrics.wealthMultiplier}x multiplier)`
    : 'Open the link to view my full wealth projection.';

  const title = 'WealthWise — My SIP & Retirement Strategy';
  const description = [
    `Monthly SIP ${formatCurrency(params.monthlySIP)} · ${params.totalYears}-year plan · ${params.annualReturn}% expected return.`,
    corpusLine,
    'Built with WealthWise AI — plan your financial future in minutes.',
  ].join(' ');

  const text = `${title}\n\n${description}`;

  const image =
    typeof window !== 'undefined'
      ? `${window.location.origin}/og-share.png`
      : undefined;

  return { url, title, description, text, image };
}
