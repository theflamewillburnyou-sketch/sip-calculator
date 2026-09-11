import React from 'react';
import { motion } from 'framer-motion';
import { Flame, Landmark, Award } from 'lucide-react';
import { formatCurrency } from '../engine/sipCalculator';

export default function FIREMeter({ progress = 0, fireNumber = 0 }) {
  const cleanProgress = Math.min(100, Math.max(0, Math.round(progress)));

  // Generate badges and labels based on progress and corpus targets
  const getFireMilestone = (p) => {
    if (p >= 100) return { title: 'FAT FIRE 🔥', desc: 'True financial freedom achieved. Work is now a choice, not a necessity! 🎉', badge: 'Retirement Ready 👑' };
    if (p >= 75) return { title: 'Barista FIRE ☕', desc: 'Cover expenses with passive income + a light fun job!', badge: 'Financial Boss 💸' };
    if (p >= 50) return { title: 'COAST FIRE 🌊', desc: 'Your savings will grow to cover basic retirement without extra inputs!', badge: 'Compound King 👑' };
    if (p >= 25) return { title: 'Lean FIRE 🍃', desc: 'Minimalist expenses covered. Basic needs are secure!', badge: 'Wealth Seed 🌱' };
    return { title: 'Early Stage 🚀', desc: 'Accumulation phase. Compound interest is warming up!', badge: 'Future Millionaire 🔮' };
  };

  const milestone = getFireMilestone(cleanProgress);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="glass-card p-5 flex flex-col justify-between min-h-[220px]"
    >
      <div className="flex w-full items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
          <Flame size={14} className="text-neon-pink" />
          Your FIRE Journey 🔥
        </span>
        <span className="text-[10px] font-semibold bg-neon-pink/15 text-neon-pink border border-neon-pink/20 px-2 py-0.5 rounded-full flex items-center gap-1">
          <Award size={10} />
          {milestone.badge}
        </span>
      </div>

      <div className="space-y-2 my-2">
        <div className="flex justify-between items-baseline">
          <div className="text-2xl font-display font-bold tracking-tight text-glow-pink" style={{ color: 'var(--text-primary)' }}>
            {cleanProgress}%
          </div>
          <div className="text-right">
            <span className="text-[9px] block uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>FIRE Target (25× Annual Expenses)</span>
            <span className="text-xs font-mono font-semibold" style={{ color: 'var(--text-secondary)' }}>{formatCurrency(fireNumber)}</span>
          </div>
        </div>

        {/* Custom Progress Track */}
        <div className="relative h-2 w-full rounded-full overflow-hidden" style={{ background: 'var(--bg-soft)' }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${cleanProgress}%` }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            className="absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-neon-pink via-neon-purple to-neon-blue"
          />
        </div>

        {/* Coast/Barista checkpoints */}
        <div className="flex justify-between text-[9px] font-semibold uppercase px-0.5 pt-1" style={{ color: 'var(--text-muted)' }}>
          <span>Lean (25%)</span>
          <span>Coast (50%)</span>
          <span>Barista (75%)</span>
          <span>Fat (100%)</span>
        </div>
      </div>

      <div className="rounded-xl p-2.5 flex items-start gap-2.5" style={{ background: 'var(--bg-soft)', border: '1px solid var(--border-soft)' }}>
        <div className="h-7 w-7 rounded-lg bg-neon-pink/10 flex items-center justify-center shrink-0 mt-0.5">
          <Landmark size={14} className="text-neon-pink" />
        </div>
        <div className="space-y-0.5">
          <h4 className="text-xs font-bold leading-none" style={{ color: 'var(--text-primary)' }}>{milestone.title}</h4>
          <p className="text-[10px] leading-normal" style={{ color: 'var(--text-muted)' }}>{milestone.desc}</p>
        </div>
      </div>
    </motion.div>
  );
}
