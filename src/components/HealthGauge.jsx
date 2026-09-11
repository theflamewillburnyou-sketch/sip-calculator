import React from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, HelpCircle } from 'lucide-react';

export default function HealthGauge({ score = 0 }) {
  // Ensure score is bounded between 0 and 100
  const cleanScore = Math.max(0, Math.min(100, Math.round(score)));

  // SVG Gauge calculations
  const radius = 50;
  const strokeWidth = 8;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (cleanScore / 100) * circumference;

  // Get status details based on score
  const getStatus = (val) => {
    if (val >= 85) return { text: 'Elite Portfolio', emoji: '👑', color: 'text-neon-green', bg: 'from-neon-green/20 to-neon-cyan/20', desc: 'Your plan is exceptionally optimized, beats inflation, and offers highly sustainable passive income.' };
    if (val >= 70) return { text: 'Solid Plan — You\'re On Track!', emoji: '💪', color: 'text-neon-cyan', bg: 'from-neon-blue/20 to-neon-cyan/20', desc: 'Excellent strategy! Your portfolio balances growth with inflation protection — a hallmark of India\'s top investors.' };
    if (val >= 50) return { text: 'Stable Outlook', emoji: '👍', color: 'text-neon-orange', bg: 'from-neon-orange/20 to-neon-yellow/20', desc: 'Decent setup, but might fall short of inflation or have a slightly aggressive SWP survival rate.' };
    return { text: 'Needs Tuning', emoji: '🩺', color: 'text-neon-pink', bg: 'from-neon-pink/20 to-neon-purple/20', desc: 'Strategy needs optimization. Try increasing your SIP step-up or extending the investment duration.' };
  };

  const status = getStatus(cleanScore);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="glass-card p-5 flex flex-col items-center justify-between min-h-[220px]"
    >
      <div className="flex w-full items-center justify-between mb-2">
        <span className="text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
          <ShieldCheck size={14} className="text-neon-purple" />
          Wealth Health Score™
        </span>
        <div className="group relative cursor-pointer">
          <HelpCircle size={14} className="transition-colors" style={{ color: 'var(--text-muted)' }} />
          <div className="absolute right-0 top-6 hidden w-48 rounded-lg p-2 text-[10px] shadow-glass group-hover:block z-50" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
            Calculated dynamically based on wealth multiplier, SWP sustainability index, CAGR, and protection against inflation.
          </div>
        </div>
      </div>

      <div className="relative flex items-center justify-center my-2">
        {/* SVG Circle Gauge */}
        <svg className="h-28 w-28 transform -rotate-90" viewBox="0 0 120 120">
          <defs>
            <linearGradient id="healthGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ec4899" />
              <stop offset="50%" stopColor="#a855f7" />
              <stop offset="100%" stopColor="#22d3ee" />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>

          {/* Background Track */}
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="transparent"
            stroke="rgba(148,163,184,0.25)"
            strokeWidth={strokeWidth}
          />

          {/* Foreground Colored Score */}
          <motion.circle
            cx="60"
            cy="60"
            r={radius}
            fill="transparent"
            stroke="url(#healthGrad)"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            strokeLinecap="round"
            filter="url(#glow)"
          />
        </svg>

        {/* Numeric Text Overlay */}
        <div className="absolute flex flex-col items-center justify-center">
          <motion.span 
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="text-3xl font-display font-bold tracking-tight text-glow"
            style={{ color: 'var(--text-primary)' }}
          >
            {cleanScore}
          </motion.span>
          <span className="text-[10px] -mt-1 font-medium" style={{ color: 'var(--text-muted)' }}>/ 100</span>
        </div>
      </div>

      {/* Dynamic Status and Badge */}
      <div className="text-center mt-2 w-full">
        <div className="flex justify-center items-center gap-1.5 mb-1">
          <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{status.emoji}</span>
          <span className={`text-sm font-bold font-display ${status.color}`}>
            {status.text}
          </span>
        </div>
        <p className="text-[10px] leading-relaxed px-1" style={{ color: 'var(--text-muted)' }}>
          {status.desc}
        </p>
      </div>
    </motion.div>
  );
}
