import React, { useRef, useCallback, useState, useEffect } from 'react';
import { useCurrency } from '../context/CurrencyContext';

export default function SliderInput({
  label, value, onChange, min = 0, max = 100, step = 1,
  prefix = '', suffix = '', icon: Icon, color = 'purple',
  formatDisplay, helpText, isMoney = false,
}) {
  const trackRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState('');
  const { symbol, locale, currency } = useCurrency();

  // Drop any in-progress edit when currency switches
  useEffect(() => {
    setEditing(false);
  }, [currency]);

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

  const moneyPrefix = isMoney ? (prefix || symbol) : prefix;
  const effectiveMax = Math.max(max, value || 0);
  const percent = Math.min(100, Math.max(0, (((value || 0) - min) / ((effectiveMax - min) || 1)) * 100));

  // Keep draft text in sync when value changes from slider (not while typing)
  useEffect(() => {
    if (!editing) {
      setText(value == null || value === '' ? '' : String(value));
    }
  }, [value, editing]);

  const commitText = useCallback((raw) => {
    if (raw === '' || raw === '-' || raw === '.' || raw === '-.') {
      onChange(min);
      return;
    }
    const v = parseFloat(raw);
    if (isNaN(v)) {
      onChange(min);
      return;
    }
    onChange(Math.max(min, v));
  }, [min, onChange]);

  const updateValue = useCallback((clientX) => {
    if (!trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const currentMax = Math.max(max, value || 0);
    const raw = min + pct * (currentMax - min);
    const stepped = Math.round(raw / step) * step;
    const clamped = Math.max(min, Math.min(currentMax, stepped));
    onChange(clamped);
  }, [min, max, value, step, onChange]);

  const handlePointerDown = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
    setEditing(false);
    updateValue(e.clientX);
    const handleMove = (ev) => updateValue(ev.clientX);
    const handleUp = () => {
      setIsDragging(false);
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
    };
    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
  }, [updateValue]);

  const formatBound = (n) => Math.round(n || 0).toLocaleString(locale);
  const inputValue = editing ? text : (value ?? '');

  return (
    <div className="group space-y-3">
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
          {Icon && <Icon size={16} style={{ color: 'var(--text-muted)' }} />}
          {label}
        </label>
        <div className="flex items-center gap-2">
          {isMoney && (
            <span className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>{moneyPrefix}</span>
          )}
          <input
            type="text"
            inputMode="decimal"
            value={inputValue}
            onFocus={(e) => {
              setEditing(true);
              const next = value == null ? '' : String(value);
              setText(next);
              // Select all so the next keypress replaces instead of appending to 0
              requestAnimationFrame(() => e.target.select());
            }}
            onBlur={() => {
              commitText(text);
              setEditing(false);
            }}
            onChange={(e) => {
              let raw = e.target.value.trim();
              // Allow empty / partial numeric typing
              if (raw === '' || /^-?\d*\.?\d*$/.test(raw)) {
                // Strip leading zeros: "06" → "6", keep "0" and "0.5"
                if (/^-?0\d+/.test(raw)) {
                  raw = String(parseFloat(raw));
                }
                setText(raw);
                if (raw !== '' && raw !== '-' && raw !== '.' && raw !== '-.') {
                  const v = parseFloat(raw);
                  if (!isNaN(v)) onChange(Math.max(min, v));
                }
              }
            }}
            className="w-28 rounded-lg px-3 py-1.5 text-right text-sm font-mono outline-none focus:border-neon-purple/50 focus:ring-1 focus:ring-neon-purple/20 transition-all"
            style={{ border: '1px solid var(--border)', background: 'var(--input-bg)', color: 'var(--text-primary)' }}
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
        <span>{moneyPrefix}{formatBound(min)}{suffix}</span>
        {helpText && <span style={{ color: 'var(--text-muted)' }}>{helpText}</span>}
        <span>{moneyPrefix}{formatBound(effectiveMax)}{suffix}</span>
      </div>
      {formatDisplay && <span className="sr-only">{formatDisplay(value)}</span>}
    </div>
  );
}
