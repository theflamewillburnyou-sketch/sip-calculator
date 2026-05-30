import React, { useRef, useCallback, useEffect, useState } from 'react';

export default function SliderInput({
  label, value, onChange, min = 0, max = 100, step = 1,
  prefix = '', suffix = '', icon: Icon, color = 'purple',
  formatDisplay, helpText,
}) {
  const trackRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  const colorMap = {
    purple: 'from-neon-purple to-neon-blue',
    cyan: 'from-neon-blue to-neon-cyan',
    green: 'from-neon-green to-neon-cyan',
    pink: 'from-neon-pink to-neon-purple',
    orange: 'from-neon-orange to-neon-yellow',
  };
  const glowMap = {
    purple: 'shadow-glow-sm',
    cyan: 'shadow-glow-cyan',
    green: 'shadow-glow-green',
    pink: 'shadow-glow-pink',
    orange: 'shadow-glow-sm',
  };

  const percent = Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));

  const updateValue = useCallback((clientX) => {
    if (!trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const raw = min + pct * (max - min);
    const stepped = Math.round(raw / step) * step;
    const clamped = Math.max(min, Math.min(max, stepped));
    onChange(clamped);
  }, [min, max, step, onChange]);

  const handlePointerDown = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
    updateValue(e.clientX);
    const handleMove = (e) => updateValue(e.clientX);
    const handleUp = () => {
      setIsDragging(false);
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
    };
    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
  }, [updateValue]);

  const displayValue = formatDisplay ? formatDisplay(value) : `${prefix}${value.toLocaleString('en-IN')}${suffix}`;

  return (
    <div className="group space-y-3">
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
          {Icon && <Icon size={16} style={{ color: 'var(--text-muted)' }} />}
          {label}
        </label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={value}
            onChange={(e) => {
              const v = parseFloat(e.target.value);
              if (!isNaN(v)) onChange(Math.max(min, Math.min(max, v)));
            }}
            className="w-28 rounded-lg px-3 py-1.5 text-right text-sm font-mono outline-none focus:border-neon-purple/50 focus:ring-1 focus:ring-neon-purple/20 transition-all"
            style={{ border: '1px solid var(--border)', background: 'var(--input-bg)', color: 'var(--text-primary)' }}
            min={min}
            max={max}
            step={step}
          />
          {suffix && <span className="text-xs min-w-[20px]" style={{ color: 'var(--text-muted)' }}>{suffix}</span>}
        </div>
      </div>

      <div
        ref={trackRef}
        className="relative h-2 w-full rounded-full cursor-pointer touch-none"
        style={{ background: 'var(--bg-soft)' }}
        onPointerDown={handlePointerDown}
      >
        <div
          className={`absolute left-0 top-0 h-full rounded-full bg-gradient-to-r ${colorMap[color] || colorMap.purple} transition-all ${isDragging ? 'duration-0' : 'duration-150'}`}
          style={{ width: `${percent}%` }}
        />
        <div
          className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 h-5 w-5 rounded-full bg-white border-2 border-neon-purple cursor-grab active:cursor-grabbing transition-shadow duration-200 ${isDragging ? 'scale-125 shadow-glow-md' : glowMap[color] || 'shadow-glow-sm'} hover:shadow-glow-md`}
          style={{ left: `${percent}%` }}
        />
      </div>

      <div className="flex items-center justify-between text-xs" style={{ color: 'var(--text-muted)' }}>
        <span>{prefix}{min.toLocaleString('en-IN')}{suffix}</span>
        {helpText && <span style={{ color: 'var(--text-muted)' }}>{helpText}</span>}
        <span>{prefix}{max.toLocaleString('en-IN')}{suffix}</span>
      </div>
    </div>
  );
}
