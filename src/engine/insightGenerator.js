/**
 * WealthWise — AI Insight Generator
 * Generates contextual financial insights based on calculation results.
 */

import { formatCurrency, formatPercent } from './sipCalculator';

/**
 * Generate all insights from calculation results
 * @param {object} results - Output from generateFullBreakdown
 * @returns {Array} Array of insight objects
 */
export function generateInsights(results) {
  if (!results || !results.metrics) return [];

  const insights = [];
  const { metrics, swpResult, params, yearlyData } = results;
  const {
    totalInvested, totalReturns, finalCorpus, cagr,
    inflationAdjustedCorpus, healthScore, fireProgress,
    passiveMonthlyIncome, wealthMultiplier,
  } = metrics;

  // 1. Compounding power
  if (wealthMultiplier > 2) {
    insights.push({
      id: 'compounding',
      emoji: '🚀',
      type: 'success',
      title: 'Power of Compounding',
      text: `Your money grew ${wealthMultiplier.toFixed(1)}x! You invested ${formatCurrency(totalInvested)} and it became ${formatCurrency(finalCorpus)}.`,
      priority: 1,
    });
  }

  // 2. Compounding acceleration point
  if (yearlyData.length > 5) {
    const midPoint = Math.floor(yearlyData.length / 2);
    const firstHalfGrowth = yearlyData[midPoint]?.corpus - yearlyData[0]?.yearStart;
    const secondHalfGrowth = yearlyData[yearlyData.length - 1]?.corpus - yearlyData[midPoint]?.corpus;
    if (secondHalfGrowth > firstHalfGrowth * 1.5) {
      const accelYear = yearlyData.findIndex((d, i) => {
        if (i === 0) return false;
        return (d.corpus - yearlyData[i-1].corpus) > yearlyData[i-1].corpus * 0.15;
      });
      insights.push({
        id: 'acceleration',
        emoji: '📈',
        type: 'info',
        title: 'Compounding Kicks In',
        text: `Your money grows significantly faster after year ${accelYear > 0 ? yearlyData[accelYear].year : 15}. The second half generates ${formatCurrency(secondHalfGrowth)} — much more than the first half!`,
        priority: 2,
      });
    }
  }

  // 3. Returns vs Investment
  if (totalReturns > totalInvested) {
    const pct = ((totalReturns / totalInvested) * 100).toFixed(0);
    insights.push({
      id: 'returns-ratio',
      emoji: '💰',
      type: 'success',
      title: 'Returns Beat Investment',
      text: `Your returns (${formatCurrency(totalReturns)}) are ${pct}% more than what you invested. Your money is truly working for you!`,
      priority: 3,
    });
  }

  // 4. CAGR insight
  if (cagr > 0) {
    insights.push({
      id: 'cagr',
      emoji: '📊',
      type: 'info',
      title: 'Effective Growth Rate',
      text: `Your portfolio achieved a CAGR of ${formatPercent(cagr)}. ${cagr > 12 ? 'That\'s excellent!' : cagr > 8 ? 'Solid performance!' : 'Consider higher-return instruments.'}`,
      priority: 4,
    });
  }

  // 5. SWP sustainability
  if (swpResult) {
    if (swpResult.depleted) {
      insights.push({
        id: 'swp-warning',
        emoji: '⚠️',
        type: 'danger',
        title: 'Corpus Depletion Alert',
        text: `Your corpus runs out in year ${swpResult.depletionYear}! Consider reducing monthly withdrawal or increasing your investment period.`,
        priority: 1,
      });
    } else {
      insights.push({
        id: 'swp-safe',
        emoji: '✅',
        type: 'success',
        title: 'Sustainable Withdrawals',
        text: `You can safely withdraw for ${params.swpYears} years and still have ${formatCurrency(swpResult.remainingCorpus)} remaining!`,
        priority: 2,
      });
    }

    // Total withdrawn
    insights.push({
      id: 'swp-total',
      emoji: '🏦',
      type: 'info',
      title: 'Total Withdrawals',
      text: `Over the withdrawal phase, you'll receive ${formatCurrency(swpResult.totalWithdrawn)} in total — that's your retirement income!`,
      priority: 5,
    });
  }

  // 6. Inflation impact
  if (params.inflationRate > 0) {
    const erosion = ((1 - inflationAdjustedCorpus / finalCorpus) * 100).toFixed(0);
    insights.push({
      id: 'inflation',
      emoji: '📉',
      type: erosion > 60 ? 'warning' : 'info',
      title: 'Inflation Impact',
      text: `Inflation reduces your corpus's purchasing power by ${erosion}%. In today's money, ${formatCurrency(finalCorpus)} is worth ${formatCurrency(inflationAdjustedCorpus)}.`,
      priority: 4,
    });
  }

  // 7. Step-up benefit
  if (params.stepUpPercent > 0 && params.monthlySIP > 0) {
    // Calculate without step-up for comparison
    const withoutStepUp = params.monthlySIP * params.sipStopYear * 12;
    const actualInvested = metrics.totalSIPInvested;
    if (actualInvested > withoutStepUp * 1.1) {
      insights.push({
        id: 'stepup',
        emoji: '⬆️',
        type: 'success',
        title: 'Step-Up Advantage',
        text: `Annual step-up of ${params.stepUpPercent}% increased your total SIP investment by ${formatCurrency(actualInvested - withoutStepUp)} more than a flat SIP.`,
        priority: 3,
      });
    }
  }

  // 8. Passive income
  if (passiveMonthlyIncome > 0) {
    insights.push({
      id: 'passive',
      emoji: '🌴',
      type: 'success',
      title: 'Passive Income Potential',
      text: `Your corpus can generate ${formatCurrency(passiveMonthlyIncome)}/month in passive income without touching the principal!`,
      priority: 3,
    });
  }

  // 9. FIRE status
  if (fireProgress >= 100) {
    insights.push({
      id: 'fire',
      emoji: '🔥',
      type: 'success',
      title: 'FIRE Achieved!',
      text: `Congratulations! You've hit your FIRE number. You have enough to be financially independent!`,
      priority: 1,
    });
  } else if (fireProgress >= 70) {
    insights.push({
      id: 'fire-close',
      emoji: '🔥',
      type: 'info',
      title: 'Almost FIRE!',
      text: `You're ${fireProgress}% of the way to financial independence. Keep going!`,
      priority: 2,
    });
  }

  // 10. Health score
  if (healthScore >= 80) {
    insights.push({
      id: 'health-great',
      emoji: '💪',
      type: 'success',
      title: 'Excellent Financial Health',
      text: `Your financial health score is ${healthScore}/100. Your strategy is well-balanced and sustainable.`,
      priority: 5,
    });
  } else if (healthScore < 50) {
    insights.push({
      id: 'health-low',
      emoji: '🩺',
      type: 'warning',
      title: 'Room for Improvement',
      text: `Your financial health score is ${healthScore}/100. Consider increasing SIP amount or investment duration.`,
      priority: 3,
    });
  }

  // 11. Millionaire/Crorepati milestone
  if (finalCorpus >= 1e7) {
    const crores = (finalCorpus / 1e7).toFixed(1);
    insights.push({
      id: 'crorepati',
      emoji: '🏆',
      type: 'success',
      title: 'Crorepati Alert!',
      text: `You'll accumulate ₹${crores} Crore. Welcome to the Crorepati Club! 🎉`,
      priority: 1,
    });
  }

  // Sort by priority
  return insights.sort((a, b) => a.priority - b.priority);
}
