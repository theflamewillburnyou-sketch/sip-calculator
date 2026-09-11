import React from 'react';
import { motion } from 'framer-motion';
import {
  Wallet, TrendingUp, PiggyBank, ArrowDownCircle, Landmark,
  Clock, ShieldCheck, BarChart3, Zap
} from 'lucide-react';
import MetricCard from './MetricCard';
import HealthGauge from './HealthGauge';
import FIREMeter from './FIREMeter';
import { formatCurrency } from '../engine/sipCalculator';

export default function ResultsDashboard({ results }) {
  if (!results) return null;
  const { metrics, swpResult } = results;

  return (
    <div className="space-y-4">
      {/* Health & FIRE */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <HealthGauge score={metrics.healthScore} />
        <FIREMeter progress={metrics.fireProgress} fireNumber={metrics.fireNumber} />
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <MetricCard
          icon={Wallet} label="Total Capital Invested" value={metrics.totalInvested}
          color="cyan" delay={0}
        />
        <MetricCard
          icon={TrendingUp} label="Returns Generated 🚀" value={metrics.totalReturns}
          color="green" delay={1}
          badge={metrics.wealthMultiplier > 2 ? { text: `${metrics.wealthMultiplier}x`, type: 'success' } : null}
        />
        <MetricCard
          icon={PiggyBank} label="Final Retirement Corpus" value={metrics.finalCorpus}
          color="purple" delay={2}
          subText={`Real value (inflation-adj.): ${formatCurrency(metrics.inflationAdjustedCorpus)}`}
        />
        <MetricCard
          icon={BarChart3} label="Annual Growth Rate (CAGR)" value={metrics.cagr}
          prefix="" suffix="%" color="orange" delay={3}
        />

        {swpResult && (
          <>
            <MetricCard
              icon={ArrowDownCircle} label="Total Lifetime Withdrawals" value={swpResult.totalWithdrawn}
              color="pink" delay={4}
            />
            <MetricCard
              icon={Landmark} label="Wealth Remaining / Passed On" value={swpResult.remainingCorpus}
              color="green" delay={5}
              badge={swpResult.depleted ? { text: 'Depleted', type: 'warning' } : { text: 'Safe', type: 'success' }}
            />
            <MetricCard
              icon={Clock} label="Your Money Lasts" value={swpResult.yearsLasted}
              prefix="" suffix=" yrs" color="cyan" delay={6}
              subText="Never outlive your wealth"
            />
            <MetricCard
              icon={Zap} label="Monthly Passive Income Potential" value={metrics.passiveMonthlyIncome}
              color="purple" delay={7} subText="per month — work optional 🎯"
            />
          </>
        )}

        {!swpResult && (
          <>
            <MetricCard
              icon={Zap} label="Monthly Passive Income Potential" value={metrics.passiveMonthlyIncome}
              color="pink" delay={4} subText="per month — work optional 🎯"
            />
            <MetricCard
              icon={ShieldCheck} label="Wealth Multiplier" value={metrics.wealthMultiplier}
              prefix="" suffix="x" color="green" delay={5}
            />
          </>
        )}
      </div>
    </div>
  );
}
