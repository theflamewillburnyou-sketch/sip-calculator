import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend, Cell, PieChart, Pie
} from 'recharts';
import {
  LineChart, Line
} from 'recharts';
import {
  TrendingUp, BarChart3, Clock, Table, Info, Download, Calendar
} from 'lucide-react';
import { formatPercent } from '../engine/sipCalculator';
import { useCurrency } from '../context/CurrencyContext';

// Custom Tooltip Component
const CustomTooltip = ({ active, payload, label, showPhase = true, formatCurrency }) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-card p-3 shadow-glass rounded-xl text-left backdrop-blur-md" style={{ borderColor: 'var(--border)' }}>
        <p className="text-xs font-semibold mb-1.5 flex items-center gap-1 font-mono" style={{ color: 'var(--text-muted)' }}>
          <Calendar size={12} />
          Year {label}
        </p>
        <div className="space-y-1">
          {payload.map((item, idx) => (
            <div key={idx} className="flex items-center justify-between gap-6 text-xs">
              <span className="flex items-center gap-1.5" style={{ color: 'var(--text-secondary)' }}>
                <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: item.color || item.fill }} />
                {item.name}
              </span>
              <span className="font-mono font-bold" style={{ color: 'var(--text-primary)' }}>
                {typeof item.value === 'number' ? formatCurrency(item.value) : item.value}
              </span>
            </div>
          ))}
          {showPhase && payload[0]?.payload?.phase && (
            <div className="mt-2 pt-1 border-t flex justify-between text-[10px] font-medium" style={{ borderColor: 'var(--border-soft)', color: 'var(--text-muted)' }}>
              <span>Phase:</span>
              <span className="font-bold text-neon-purple">{payload[0].payload.phase}</span>
            </div>
          )}
        </div>
      </div>
    );
  }
  return null;
};

export default function VisualsSection({ results, theme = 'light', onDownloadChart }) {
  const { formatCurrency, currency } = useCurrency();
  const [activeTab, setActiveTab] = useState('growth');
  const [ledgerPage, setLedgerPage] = useState(1);
  const ledgerPageSize = 10;

  if (!results) return null;
  const { yearlyData, metrics, swpResult } = results;

  // Split yearly data into accumulation (SIP + Growth) vs SWP phase for specific charts
  const accumulationData = yearlyData.filter(d => d.phase !== 'Withdrawal');
  const swpData = yearlyData.filter(d => d.phase === 'Withdrawal' || d.year === results.params.totalYears);

  // Preparation for Invested vs Returns Pie Data
  const pieData = [
    { name: 'Invested', value: metrics.totalInvested, color: '#6366f1' },
    { name: 'Returns', value: metrics.totalReturns, color: '#10b981' }
  ];

  // Ledger Pagination
  const totalLedgerPages = Math.ceil(yearlyData.length / ledgerPageSize);
  const paginatedLedger = yearlyData.slice(
    (ledgerPage - 1) * ledgerPageSize,
    ledgerPage * ledgerPageSize
  );

  const chartGridColor = theme === 'dark' ? 'rgba(255,255,255,0.07)' : 'rgba(15,23,42,0.12)';
  const chartAxisColor = theme === 'dark' ? 'rgba(255,255,255,0.38)' : 'rgba(15,23,42,0.55)';
  const activeDotFill = theme === 'dark' ? '#ffffff' : '#e2e8f0';

  return (
    <div className="space-y-6">
      {/* Charts Navigation Tab Bar */}
      <div className="pb-1" style={{ borderBottom: '1px solid var(--border-soft)' }}>
        <div className="grid grid-cols-2 gap-x-2 gap-y-1 md:flex md:flex-wrap md:gap-4">
          {[
            { id: 'growth', label: '📈 Wealth Growth', icon: TrendingUp },
            { id: 'ratio', label: '💹 Invested vs Returns', icon: BarChart3 },
            { id: 'swp', label: '🏖️ Retirement Income', icon: Clock, disabled: !swpResult },
            { id: 'ledger', label: '📋 Year-by-Year Ledger', icon: Table }
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            if (tab.disabled) return null;

            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setLedgerPage(1);
                }}
                className={`relative pb-2.5 md:pb-3 px-1 text-[11px] sm:text-xs md:text-sm font-semibold flex items-center gap-1.5 transition-all outline-none text-left ${
                  active ? 'text-[color:var(--text-primary)]' : 'text-[color:var(--text-muted)] hover:text-[color:var(--text-secondary)]'
                }`}
              >
                <Icon size={14} className="shrink-0 md:w-4 md:h-4" />
                <span className="leading-tight">{tab.label}</span>
                {active && (
                  <motion.div
                    layoutId="activeVisualTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-neon-purple to-neon-cyan"
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Charts Viewport */}
      <div className="glass-card p-4 md:p-6 min-h-[350px] relative overflow-hidden">
        <AnimatePresence mode="wait">
          {activeTab === 'growth' && (
            <motion.div
              key="growth-chart"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <h3 className="text-sm font-bold font-display" style={{ color: 'var(--text-primary)' }}>Your Wealth Compounding Journey</h3>
                  <p className="text-[10px] leading-none mt-1" style={{ color: 'var(--text-muted)' }}>Watch {formatCurrency(1, { compact: false })} invested today become a wealth empire — vs. what inflation quietly steals</p>
                </div>
                <div className="flex gap-4 text-[10px] font-medium" style={{ color: 'var(--text-muted)' }}>
                  <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded bg-neon-purple" /> Corpus</span>
                  <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded bg-neon-pink" /> Inflation-Adjusted</span>
                </div>
              </div>

              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={accumulationData} margin={{ top: 10, right: 5, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorCorpus" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#a855f7" stopOpacity={0.25}/>
                        <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorInflation" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ec4899" stopOpacity={0.15}/>
                        <stop offset="95%" stopColor="#ec4899" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={chartGridColor} vertical={false} />
                    <XAxis dataKey="year" stroke={chartAxisColor} fontSize={10} fontMono tickLine={false} />
                    <YAxis
                      stroke={chartAxisColor}
                      fontSize={10}
                      fontMono
                      tickLine={false}
                      tickFormatter={(v) => formatCurrency(v, { stripSymbol: true })}
                    />
                    <Tooltip content={<CustomTooltip formatCurrency={formatCurrency} />} />
                    <Area
                      name="Total Corpus"
                      type="monotone"
                      dataKey="corpus"
                      stroke="#a855f7"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#colorCorpus)"
                      activeDot={{ r: 6, fill: activeDotFill, stroke: '#a855f7', strokeWidth: 2 }}
                    />
                    <Area
                      name="Inflation Adjusted"
                      type="monotone"
                      dataKey="inflationAdjusted"
                      stroke="#ec4899"
                      strokeWidth={1.5}
                      strokeDasharray="4 4"
                      fillOpacity={1}
                      fill="url(#colorInflation)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          )}

          {activeTab === 'ratio' && (
            <motion.div
              key="ratio-chart"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <h3 className="text-sm font-bold font-display" style={{ color: 'var(--text-primary)' }}>Investment vs Returns</h3>
                  <p className="text-[10px] leading-none mt-1" style={{ color: 'var(--text-muted)' }}>Yearly view of total contributions vs compounded returns generated</p>
                </div>
                <div className="flex gap-4 text-[10px] font-medium" style={{ color: 'var(--text-muted)' }}>
                  <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded bg-neon-blue" /> Invested Capital</span>
                  <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded bg-neon-green" /> Earned Returns</span>
                </div>
              </div>

              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={accumulationData} margin={{ top: 10, right: 5, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorInvested" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25}/>
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorReturns" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.25}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={chartGridColor} vertical={false} />
                    <XAxis dataKey="year" stroke={chartAxisColor} fontSize={10} fontMono tickLine={false} />
                    <YAxis
                      stroke={chartAxisColor}
                      fontSize={10}
                      fontMono
                      tickLine={false}
                      tickFormatter={(v) => formatCurrency(v, { stripSymbol: true })}
                    />
                    <Tooltip content={<CustomTooltip formatCurrency={formatCurrency} />} />
                    <Area
                      stackId="1"
                      name="Invested Capital"
                      type="monotone"
                      dataKey="totalInvested"
                      stroke="#6366f1"
                      strokeWidth={2}
                      fill="url(#colorInvested)"
                    />
                    <Area
                      stackId="1"
                      name="Earned Returns"
                      type="monotone"
                      dataKey="totalReturns"
                      stroke="#10b981"
                      strokeWidth={2}
                      fill="url(#colorReturns)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          )}

          {activeTab === 'swp' && swpResult && (
            <motion.div
              key="swp-chart"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <h3 className="text-sm font-bold font-display" style={{ color: 'var(--text-primary)' }}>Retirement Withdrawal & Depletion</h3>
                  <p className="text-[10px] leading-none mt-1" style={{ color: 'var(--text-muted)' }}>Corpus depletion trajectory vs cumulative SWP income withdrawn</p>
                </div>
                <div className="flex gap-4 text-[10px] font-medium" style={{ color: 'var(--text-muted)' }}>
                  <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded bg-neon-cyan" /> Remaining Corpus</span>
                  <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded bg-neon-pink" /> Cumulative SWP Income</span>
                </div>
              </div>

              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={swpData} margin={{ top: 10, right: 5, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorSwpCorpus" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.25}/>
                        <stop offset="95%" stopColor="#22d3ee" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorWithdrawn" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ec4899" stopOpacity={0.25}/>
                        <stop offset="95%" stopColor="#ec4899" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={chartGridColor} vertical={false} />
                    <XAxis dataKey="year" stroke={chartAxisColor} fontSize={10} fontMono tickLine={false} />
                    <YAxis
                      stroke={chartAxisColor}
                      fontSize={10}
                      fontMono
                      tickLine={false}
                      tickFormatter={(v) => formatCurrency(v, { stripSymbol: true })}
                    />
                    <Tooltip content={<CustomTooltip formatCurrency={formatCurrency} />} />
                    <Area
                      name="Remaining Corpus"
                      type="monotone"
                      dataKey="corpus"
                      stroke="#22d3ee"
                      strokeWidth={2.5}
                      fill="url(#colorSwpCorpus)"
                    />
                    <Area
                      name="Cumulative Withdrawn"
                      type="monotone"
                      dataKey="totalWithdrawn"
                      stroke="#ec4899"
                      strokeWidth={2}
                      fill="url(#colorWithdrawn)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          )}

          {activeTab === 'ledger' && (
            <motion.div
              key="ledger-table"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <h3 className="text-sm font-bold font-display" style={{ color: 'var(--text-primary)' }}>Detailed Ledger</h3>
                  <p className="text-[10px] leading-none mt-1" style={{ color: 'var(--text-muted)' }}>Year-wise breakdown of balance, additions, withdrawals, and interest</p>
                </div>
              </div>

              {/* Scrollable Table */}
              <div className="overflow-x-auto rounded-xl" style={{ border: '1px solid var(--border-soft)', background: 'var(--bg-elevated)' }}>
                <table className="w-full text-left border-collapse min-w-[700px] text-xs">
                  <thead>
                    <tr className="uppercase font-mono font-semibold tracking-wider" style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-soft)', color: 'var(--text-muted)' }}>
                      <th className="px-4 py-3">Year</th>
                      <th className="px-4 py-3">Phase</th>
                      <th className="px-4 py-3 text-right">Start Bal</th>
                      <th className="px-4 py-3 text-right">Added/Withdrawn</th>
                      <th className="px-4 py-3 text-right">Growth/Int</th>
                      <th className="px-4 py-3 text-right">End Bal</th>
                      <th className="px-4 py-3 text-right">Inflation Adj</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedLedger.map((row) => {
                      const isSwp = row.phase === 'Withdrawal';
                      return (
                        <tr key={row.year} className="transition-colors" style={{ borderBottom: '1px solid var(--border-soft)', color: 'var(--text-secondary)' }}>
                          <td className="px-4 py-2.5 font-mono font-bold" style={{ color: 'var(--text-primary)' }}>{row.year}</td>
                          <td className="px-4 py-2.5">
                            <span className={`inline-flex px-1.5 py-0.5 rounded-md text-[9px] font-bold ${
                              row.phase === 'SIP Active' ? 'bg-neon-blue/10 text-neon-blue' :
                              row.phase === 'Growth Only' ? 'bg-neon-purple/10 text-neon-purple' :
                              'bg-neon-pink/10 text-neon-pink'
                            }`}>
                              {row.phase}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 text-right font-mono">{formatCurrency(row.yearStart)}</td>
                          <td className="px-4 py-2.5 text-right font-mono font-medium">
                            {isSwp ? (
                              <span className="text-neon-pink">-{formatCurrency(row.withdrawn)}</span>
                            ) : (
                              <span className="text-neon-green">+{formatCurrency(row.invested)}</span>
                            )}
                          </td>
                          <td className="px-4 py-2.5 text-right font-mono" style={{ color: 'var(--text-muted)' }}>{formatCurrency(row.returns)}</td>
                          <td className="px-4 py-2.5 text-right font-mono font-bold" style={{ color: 'var(--text-primary)' }}>{formatCurrency(row.corpus)}</td>
                          <td className="px-4 py-2.5 text-right font-mono" style={{ color: 'var(--text-muted)' }}>{formatCurrency(row.inflationAdjusted)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Table Pagination */}
              {totalLedgerPages > 1 && (
                <div className="flex items-center justify-between text-xs pt-2">
                  <span style={{ color: 'var(--text-muted)' }}>
                    Showing page <span className="font-semibold font-mono" style={{ color: 'var(--text-primary)' }}>{ledgerPage}</span> of <span className="font-semibold font-mono" style={{ color: 'var(--text-primary)' }}>{totalLedgerPages}</span>
                  </span>
                  <div className="flex gap-2">
                    <button
                      disabled={ledgerPage === 1}
                      onClick={() => setLedgerPage(p => Math.max(1, p - 1))}
                      className="px-2.5 py-1.5 rounded-lg disabled:opacity-30 transition"
                      style={{ border: '1px solid var(--border)', background: 'var(--card-bg)', color: 'var(--text-secondary)' }}
                    >
                      Prev
                    </button>
                    <button
                      disabled={ledgerPage === totalLedgerPages}
                      onClick={() => setLedgerPage(p => Math.min(totalLedgerPages, p + 1))}
                      className="px-2.5 py-1.5 rounded-lg disabled:opacity-30 transition"
                      style={{ border: '1px solid var(--border)', background: 'var(--card-bg)', color: 'var(--text-secondary)' }}
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
