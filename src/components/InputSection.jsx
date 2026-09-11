import React from 'react';
import { motion } from 'framer-motion';
import {
  Wallet, TrendingUp, Percent, Calendar, PauseCircle, BarChart3,
  ArrowDownCircle, ArrowUpCircle, Flame
} from 'lucide-react';
import SliderInput from './SliderInput';

const presets = [
  { name: '🔥 Early Retirement (FIRE)', lumpSum: 500000, monthlySIP: 50000, stepUpPercent: 15, annualReturn: 14, totalYears: 40, sipStopYear: 15, inflationRate: 6, monthlyWithdrawal: 200000, swpStepUp: 7, swpReturn: 9, swpYears: 30 },
  { name: '🎓 Child\'s Future Fund', lumpSum: 200000, monthlySIP: 25000, stepUpPercent: 10, annualReturn: 12, totalYears: 18, sipStopYear: 18, inflationRate: 7, monthlyWithdrawal: 0, swpStepUp: 0, swpReturn: 8, swpYears: 0 },
  { name: '💎 Crorepati Blueprint', lumpSum: 1000000, monthlySIP: 30000, stepUpPercent: 10, annualReturn: 13, totalYears: 30, sipStopYear: 20, inflationRate: 6, monthlyWithdrawal: 150000, swpStepUp: 8, swpReturn: 9, swpYears: 25 },
  { name: '💰 Passive Income Machine', lumpSum: 2000000, monthlySIP: 40000, stepUpPercent: 12, annualReturn: 12, totalYears: 25, sipStopYear: 15, inflationRate: 6, monthlyWithdrawal: 100000, swpStepUp: 6, swpReturn: 8, swpYears: 30 },
  { name: '🚀 Aggressive Growth', lumpSum: 100000, monthlySIP: 75000, stepUpPercent: 20, annualReturn: 15, totalYears: 35, sipStopYear: 20, inflationRate: 6, monthlyWithdrawal: 300000, swpStepUp: 8, swpReturn: 10, swpYears: 25 },
];

export default function InputSection({ params, setParams }) {
  const update = (key) => (val) => setParams(prev => ({ ...prev, [key]: val }));

  const applyPreset = (preset) => {
    const { name, ...values } = preset;
    setParams(prev => ({ ...prev, ...values }));
  };

  return (
    <div className="space-y-6">
      {/* Presets */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>
          Quick Templates
        </h3>
        <div className="flex flex-wrap gap-2">
          {presets.map((p) => (
            <motion.button
              key={p.name}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => applyPreset(p)}
              className="rounded-full px-3 py-1.5 text-xs font-medium hover:border-neon-purple/30 transition-all duration-200"
              style={{ border: '1px solid var(--border)', background: 'var(--card-bg)', color: 'var(--text-secondary)' }}
            >
              {p.name}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Investment Inputs */}
      <div className="glass-card p-6 space-y-6">
        <div className="flex items-center gap-2 mb-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-neon-purple to-neon-blue flex items-center justify-center">
            <TrendingUp size={16} className="text-white" />
          </div>
          <h2 className="font-display text-lg font-semibold">Investment Phase — Build Your Corpus</h2>
        </div>

        <SliderInput
          label="One-Time Lump Sum Investment" icon={Wallet}
          value={params.lumpSum} onChange={update('lumpSum')}
          min={0} max={50000000} step={500} prefix="₹" color="purple"
        />
        <SliderInput
          label="Monthly SIP Amount" icon={BarChart3}
          value={params.monthlySIP} onChange={update('monthlySIP')}
          min={0} max={500000} step={500} prefix="₹" color="cyan"
        />
        <SliderInput
          label="Annual SIP Step-Up (%)" icon={ArrowUpCircle}
          value={params.stepUpPercent} onChange={update('stepUpPercent')}
          min={0} max={50} step={1} suffix="%" color="green"
          helpText="Increase SIP by this % every year"
        />
        <SliderInput
          label="Expected CAGR (%)" icon={Percent}
          value={params.annualReturn} onChange={update('annualReturn')}
          min={0} max={30} step={0.5} suffix="%" color="purple"
        />
        <SliderInput
          label="Investment Duration (Years)" icon={Calendar}
          value={params.totalYears} onChange={update('totalYears')}
          min={0} max={50} step={1} suffix=" yrs" color="cyan"
        />
        <SliderInput
          label="SIP Investment Period (Years)" icon={PauseCircle}
          value={params.sipStopYear} onChange={update('sipStopYear')}
          min={1} max={params.totalYears} step={1} suffix=" yrs" color="orange"
          helpText="Corpus compounds silently after SIP ends"
        />
        <SliderInput
          label="Assumed Inflation Rate (%)" icon={Flame}
          value={params.inflationRate} onChange={update('inflationRate')}
          min={0} max={15} step={0.5} suffix="%" color="pink"
        />
      </div>

      {/* Withdrawal Inputs */}
      <div className="glass-card p-6 space-y-6">
        <div className="flex items-center gap-2 mb-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-neon-green to-neon-cyan flex items-center justify-center">
            <ArrowDownCircle size={16} className="text-white" />
          </div>
          <h2 className="font-display text-lg font-semibold">Withdrawal Phase — Live Off Your Wealth</h2>
        </div>

        <SliderInput
          label="Monthly Withdrawal Amount (₹)" icon={Wallet}
          value={params.monthlyWithdrawal} onChange={update('monthlyWithdrawal')}
          min={0} max={1000000} step={5000} prefix="₹" color="green"
        />
        <SliderInput
          label="Yearly Withdrawal Increase (%)" icon={ArrowUpCircle}
          value={params.swpStepUp} onChange={update('swpStepUp')}
          min={0} max={20} step={1} suffix="%" color="cyan"
          helpText="Adjust withdrawals for lifestyle inflation"
        />
        <SliderInput
          label="Portfolio Return During Retirement (%)" icon={Percent}
          value={params.swpReturn} onChange={update('swpReturn')}
          min={1} max={20} step={0.5} suffix="%" color="purple"
        />
        <SliderInput
          label="Retirement Duration (Years)" icon={Calendar}
          value={params.swpYears} onChange={update('swpYears')}
          min={0} max={50} step={1} suffix=" yrs" color="pink"
        />
      </div>
    </div>
  );
}