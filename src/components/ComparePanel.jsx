import React, { useState, useEffect, useMemo } from 'react';
import { Save, Trash2, LayoutGrid, Check, Play, AlertCircle } from 'lucide-react';
import { formatPercent, generateFullBreakdown } from '../engine/sipCalculator';
import { useCurrency } from '../context/CurrencyContext';
import { convertMoneyParams, DEFAULT_CURRENCY } from '../utils/currency';

export default function ComparePanel({ currentParams, currentMetrics, currentSwpResult, onLoadParams }) {
  const { currency, rates, formatCurrency } = useCurrency();
  const [scenarios, setScenarios] = useState([]);
  const [newScenarioName, setNewScenarioName] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('wealthwise_scenarios');
    if (!saved) return;
    try {
      const parsed = JSON.parse(saved);
      setScenarios(Array.isArray(parsed) ? parsed.filter((s) => s && s.params) : []);
    } catch (e) {
      console.error(e);
      setScenarios([]);
    }
  }, []);

  const handleSaveScenario = (e) => {
    e.preventDefault();
    if (!newScenarioName.trim() || !currentParams) return;

    const live = currentMetrics
      ? { metrics: currentMetrics, swpResult: currentSwpResult || null }
      : generateFullBreakdown(currentParams);

    const newScenario = {
      id: Date.now().toString(),
      name: newScenarioName.trim(),
      currency,
      params: { ...currentParams },
      metrics: { ...(live.metrics || currentMetrics || {}) },
      swpResult: live.swpResult ? { ...live.swpResult } : null,
      savedAt: new Date().toLocaleDateString(),
    };

    const updated = [newScenario, ...scenarios].slice(0, 5);
    setScenarios(updated);
    localStorage.setItem('wealthwise_scenarios', JSON.stringify(updated));
    setNewScenarioName('');
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const handleDeleteScenario = (id) => {
    const updated = scenarios.filter((s) => s.id !== id);
    setScenarios(updated);
    localStorage.setItem('wealthwise_scenarios', JSON.stringify(updated));
  };

  const handleLoadScenario = (scenario) => {
    if (!scenario?.params || typeof onLoadParams !== 'function') return;
    const srcCurrency = scenario.currency || DEFAULT_CURRENCY;
    const nextParams = srcCurrency === currency
      ? scenario.params
      : convertMoneyParams(scenario.params, srcCurrency, currency, rates);
    onLoadParams(nextParams || scenario.params);
  };

  const displayScenarios = useMemo(() => {
    return scenarios
      .filter((scen) => scen && scen.params)
      .map((scen) => {
        try {
          const srcCurrency = scen.currency || DEFAULT_CURRENCY;
          const params = srcCurrency === currency
            ? scen.params
            : convertMoneyParams(scen.params, srcCurrency, currency, rates);
          const live = generateFullBreakdown(params || scen.params);
          return {
            ...scen,
            displayParams: params || scen.params,
            displayMetrics: live?.metrics || scen.metrics || {},
            displaySwpResult: live?.swpResult ?? scen.swpResult ?? null,
          };
        } catch (err) {
          console.error('Failed to render scenario', scen?.id, err);
          return {
            ...scen,
            displayParams: scen.params,
            displayMetrics: scen.metrics || {},
            displaySwpResult: scen.swpResult || null,
          };
        }
      });
  }, [scenarios, currency, rates]);

  return (
    <div className="space-y-6">
      <div className="glass-card p-5">
        <h3 className="text-sm font-bold font-display mb-2 flex items-center gap-1.5" style={{ color: 'var(--text-primary)' }}>
          <Save size={16} className="text-neon-purple" />
          Save Current Strategy
        </h3>
        <p className="text-[10px] mb-4 leading-normal" style={{ color: 'var(--text-muted)' }}>
          Lock in your current inputs (SIP, step-ups, withdrawal goals) to compare against other strategies.
        </p>

        <form onSubmit={handleSaveScenario} className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            placeholder="e.g. Early Retirement Plan"
            value={newScenarioName}
            onChange={(e) => setNewScenarioName(e.target.value)}
            maxLength={25}
            className="flex-1 rounded-xl px-3 py-2 text-xs outline-none focus:border-neon-purple/50 focus:ring-1 focus:ring-neon-purple/20 transition-all font-sans"
            style={{ border: '1px solid var(--border)', background: 'var(--input-bg)', color: 'var(--text-primary)' }}
          />
          <button
            type="submit"
            className="rounded-xl bg-gradient-to-r from-neon-purple to-neon-blue px-4 py-2 text-xs font-semibold text-white hover:shadow-glow-sm transition-all duration-200 flex items-center gap-1 shrink-0"
          >
            {saveSuccess ? (
              <>
                <Check size={14} />
                Saved
              </>
            ) : (
              <>
                <Save size={14} />
                Save
              </>
            )}
          </button>
        </form>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
            <LayoutGrid size={14} className="text-neon-cyan" />
            Comparison Matrix ({displayScenarios.length} / 5)
          </h3>
          {displayScenarios.length === 0 && (
            <span className="text-[10px] flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
              <AlertCircle size={10} />
              No strategies saved yet
            </span>
          )}
        </div>

        {displayScenarios.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {displayScenarios.map((scen) => {
              const isSwp = (scen.displayParams?.monthlyWithdrawal || 0) > 0;
              return (
                <div
                  key={scen.id}
                  className="glass-card p-4 transition-all flex flex-col justify-between"
                >
                  <div className="flex justify-between items-start mb-3 gap-2">
                    <div>
                      <h4 className="text-xs font-bold leading-normal line-clamp-1" style={{ color: 'var(--text-primary)' }}>{scen.name}</h4>
                      <span className="text-[9px] block mt-0.5" style={{ color: 'var(--text-muted)' }}>
                        Saved {scen.savedAt}
                        {scen.currency ? ` · ${scen.currency}` : ''}
                      </span>
                    </div>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => handleLoadScenario(scen)}
                        className="h-6 w-6 rounded-lg bg-neon-purple/10 hover:bg-neon-purple/20 flex items-center justify-center text-neon-purple transition-all"
                        title="Load Strategy"
                      >
                        <Play size={12} fill="currentColor" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteScenario(scen.id)}
                        className="h-6 w-6 rounded-lg bg-neon-pink/10 hover:bg-neon-pink/20 flex items-center justify-center text-neon-pink transition-all"
                        title="Delete Strategy"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-x-2 gap-y-3 rounded-xl p-2.5 mb-2" style={{ background: 'var(--bg-soft)', border: '1px solid var(--border-soft)' }}>
                    <div>
                      <span className="text-[9px] block uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>SIP Contribution</span>
                      <span className="text-xs font-semibold font-mono" style={{ color: 'var(--text-secondary)' }}>
                        {formatCurrency(scen.displayParams?.monthlySIP || 0)}
                        <span className="text-[10px] font-sans font-medium" style={{ color: 'var(--text-muted)' }}>/{scen.displayParams?.totalYears || 0}y</span>
                      </span>
                    </div>
                    <div>
                      <span className="text-[9px] block uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Final Corpus</span>
                      <span className="text-xs font-bold text-neon-purple font-mono">
                        {formatCurrency(scen.displayMetrics?.finalCorpus || 0)}
                      </span>
                    </div>
                    {isSwp ? (
                      <>
                        <div>
                          <span className="text-[9px] block uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>SWP Withdrawal</span>
                          <span className="text-xs font-semibold font-mono" style={{ color: 'var(--text-secondary)' }}>
                            {formatCurrency(scen.displayParams?.monthlyWithdrawal || 0)}
                          </span>
                        </div>
                        <div>
                          <span className="text-[9px] block uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Corpus Survives</span>
                          <span className={`text-xs font-bold font-mono ${
                            scen.displaySwpResult?.depleted ? 'text-neon-orange' : 'text-neon-green'
                          }`}>
                            {scen.displaySwpResult?.yearsLasted ?? '—'} Years
                          </span>
                        </div>
                      </>
                    ) : (
                      <>
                        <div>
                          <span className="text-[9px] block uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>CAGR</span>
                          <span className="text-xs font-semibold font-mono" style={{ color: 'var(--text-secondary)' }}>
                            {formatPercent(scen.displayMetrics?.cagr || 0)}
                          </span>
                        </div>
                        <div>
                          <span className="text-[9px] block uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Wealth Multiplier</span>
                          <span className="text-xs font-bold text-neon-green font-mono">
                            {scen.displayMetrics?.wealthMultiplier ?? 0}x
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="glass-card p-6 text-center text-xs py-8" style={{ color: 'var(--text-muted)' }}>
            Save strategies (e.g. flat SIP vs step-up SIP) using the card above to inspect side-by-side!
          </div>
        )}
      </div>
    </div>
  );
}
