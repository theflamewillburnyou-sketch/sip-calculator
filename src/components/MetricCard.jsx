import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useCurrency } from '../context/CurrencyContext';
import { formatMoney } from '../utils/currency';

function AnimatedCounter({ value, formatValue, duration = 1.2, className = '', resetKey = '' }) {
  const [display, setDisplay] = useState(0);
  const rafRef = useRef(null);

  useEffect(() => {
    setDisplay(0);

    const start = 0;
    const end = value;
    const startTime = performance.now();
    const dur = duration * 1000;

    const animate = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / dur, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = start + (end - start) * eased;
      setDisplay(current);

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      }
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [value, duration, resetKey]);

  return (
    <span className={className}>
      {formatValue(display)}
    </span>
  );
}

export default function MetricCard({
  icon: Icon, label, value, prefix, suffix = '',
  color = 'purple', subText, badge, delay = 0, isMoney = true,
}) {
  const { currency } = useCurrency();
  const colorBg = {
    purple: 'from-neon-purple/20 to-neon-blue/20',
    cyan: 'from-neon-blue/20 to-neon-cyan/20',
    green: 'from-neon-green/20 to-neon-cyan/20',
    pink: 'from-neon-pink/20 to-neon-purple/20',
    orange: 'from-neon-orange/20 to-neon-yellow/20',
  };
  const colorIcon = {
    purple: 'text-neon-purple',
    cyan: 'text-neon-cyan',
    green: 'text-neon-green',
    pink: 'text-neon-pink',
    orange: 'text-neon-orange',
  };

  const formatValue = isMoney
    ? (n) => formatMoney(Math.round(n), { currency })
    : (n) => `${prefix ?? ''}${(Math.round(n * 10) / 10).toLocaleString()}${suffix}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: delay * 0.08 }}
      className="metric-card group transition-all duration-300"
      style={{ borderColor: 'var(--border)', background: 'var(--card-bg-hover)' }}
    >
      <div className="flex items-center justify-between">
        <div className={`h-9 w-9 rounded-xl bg-gradient-to-br ${colorBg[color]} flex items-center justify-center`}>
          {Icon && <Icon size={18} className={colorIcon[color]} />}
        </div>
        {badge && (
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
            badge.type === 'success' ? 'bg-neon-green/10 text-neon-green' :
            badge.type === 'warning' ? 'bg-neon-orange/10 text-neon-orange' :
            'bg-neon-blue/10 text-neon-blue'
          }`}>
            {badge.text}
          </span>
        )}
      </div>
      <p className="text-xs font-medium mt-1" style={{ color: 'var(--text-muted)' }}>{label}</p>
      <p className="text-xl md:text-2xl font-display font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
        <AnimatedCounter
          value={value}
          formatValue={formatValue}
          resetKey={currency}
        />
      </p>
      {subText && <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{subText}</p>}
    </motion.div>
  );
}
