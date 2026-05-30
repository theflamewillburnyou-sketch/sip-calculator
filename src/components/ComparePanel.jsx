import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Save, Trash2, LayoutGrid, Check, Play, AlertCircle } from 'lucide-react';
import { formatCurrency, formatPercent } from '../engine/sipCalculator';

export default function ComparePanel({ currentParams, currentMetrics, currentSwpResult, onLoadParams }) {
  const [scenarios, setScenarios] = useState([]);
  const [newScenarioName, setNewScenarioName] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Load scenarios on mount
  useEffect(() => {
    const saved = localStorage.getItem('wealthwise_scenarios');
    if (saved) {
      try {
        setScenarios(JSON.parse(saved));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const handleSaveScenario = (e) => {
    e.preventDefault();
    if (!newScenarioName.trim()) return;

    const newScenario = {
      id: Date.now().toString(),
      name: newScenarioName.trim(),
      params: { ...currentParams },
      metrics: { ...currentMetrics },
      swpResult: currentSwpResult ? { ...currentSwpResult } : null,
      savedAt: new Date().toLocaleDateString()
    };

    const updated = [newScenario, ...scenarios].slice(0, 5); // Limit to 5 scenarios
    setScenarios(updated);
    localStorage.setItem('wealthwise_scenarios', JSON.stringify(updated));
    setNewScenarioName('');
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const handleDeleteScenario = (id) => {
    const updated = scenarios.filter(s => s.id !== id);
    setScenarios(updated);
    localStorage.setItem('wealthwise_scenarios', JSON.stringify(updated));
  };

  const handleLoadScenario = (scenario) => {
    onLoadParams(scenario.params);
  };

  return (
    <div className="space-y-6">
      {/* Save Scenario Card */}
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

      {/* Comparisons Ledger Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
            <LayoutGrid size={14} className="text-neon-cyan" />
            Comparison Matrix ({scenarios.length} / 5)
          </h3>
          {scenarios.length === 0 && (
            <span className="text-[10px] flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
              <AlertCircle size={10} />
              No strategies saved yet
            </span>
          )}
        </div>

        {scenarios.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {scenarios.map((scen) => {
              const isSwp = scen.params.monthlyWithdrawal > 0;
              return (
                <motion.div
                  key={scen.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass-card p-4 transition-all flex flex-col justify-between"
                >
                  <div className="flex justify-between items-start mb-3 gap-2">
                    <div>
                      <h4 className="text-xs font-bold leading-normal line-clamp-1" style={{ color: 'var(--text-primary)' }}>{scen.name}</h4>
                      <span className="text-[9px] block mt-0.5" style={{ color: 'var(--text-muted)' }}>Saved {scen.savedAt}</span>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleLoadScenario(scen)}
                        className="h-6 w-6 rounded-lg bg-neon-purple/10 hover:bg-neon-purple/20 flex items-center justify-center text-neon-purple transition-all"
                        title="Load Strategy"
                      >
                        <Play size={12} fill="currentColor" />
                      </button>
                      <button
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
                        {formatCurrency(scen.params.monthlySIP)}
                        <span className="text-[10px] font-sans font-medium" style={{ color: 'var(--text-muted)' }}>/{scen.params.totalYears}y</span>
                      </span>
                    </div>
                    <div>
                      <span className="text-[9px] block uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Final Corpus</span>
                      <span className="text-xs font-bold text-neon-purple font-mono">
                        {formatCurrency(scen.metrics.finalCorpus)}
                      </span>
                    </div>
                    {isSwp ? (
                      <>
                        <div>
                          <span className="text-[9px] block uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>SWP Withdrawal</span>
                          <span className="text-xs font-semibold font-mono" style={{ color: 'var(--text-secondary)' }}>
                            {formatCurrency(scen.params.monthlyWithdrawal)}
                          </span>
                        </div>
                        <div>
                          <span className="text-[9px] block uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Corpus Survives</span>
                          <span className={`text-xs font-bold font-mono ${
                            scen.swpResult?.depleted ? 'text-neon-orange' : 'text-neon-green'
                          }`}>
                            {scen.swpResult?.yearsLasted} Years
                          </span>
                        </div>
                      </>
                    ) : (
                      <>
                        <div>
                          <span className="text-[9px] block uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>CAGR</span>
                          <span className="text-xs font-semibold font-mono" style={{ color: 'var(--text-secondary)' }}>
                            {formatPercent(scen.metrics.cagr)}
                          </span>
                        </div>
                        <div>
                          <span className="text-[9px] block uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Wealth Multiplier</span>
                          <span className="text-xs font-bold text-neon-green font-mono">
                            {scen.metrics.wealthMultiplier}x
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </motion.div>
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
