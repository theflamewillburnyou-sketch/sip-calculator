import React, { useState, useEffect, useRef, useMemo } from 'react';
import { jsPDF } from 'jspdf';
import {
  Sparkles, Download, Share2, RefreshCw, Layers, Sun, Moon, ArrowLeft
} from 'lucide-react';

import InputSection from './components/InputSection';
import ResultsDashboard from './components/ResultsDashboard';
import VisualsSection from './components/VisualsSection';
import ComparePanel from './components/ComparePanel';
import ShareModal from './components/ShareModal';
import { generateFullBreakdown } from './engine/sipCalculator';
import { generateInsights } from './engine/insightGenerator';
import { buildSharePayload } from './utils/buildSharePayload';
import { useCurrency } from './context/CurrencyContext';
import brandIconWhite from './assets/brand-icon-white.png';
import { CURRENCY_META, DEFAULT_CURRENCY, convertMoneyParams } from './utils/currency';

// Default parameters (INR). Converted once when local currency is detected.
const DEFAULT_PARAMS_INR = {
  lumpSum: 100000,
  monthlySIP: 15000,
  stepUpPercent: 10,
  annualReturn: 12,
  totalYears: 20,
  sipStopYear: 20,
  inflationRate: 6,
  monthlyWithdrawal: 50000,
  swpStepUp: 6,
  swpReturn: 8,
  swpYears: 25,
};

export default function App() {
  const [theme, setTheme] = useState('light');
  const [params, setParams] = useState(DEFAULT_PARAMS_INR);
  const [activeView, setActiveView] = useState('dashboard'); // dashboard | compare
  const [showShareModal, setShowShareModal] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const {
    currency, symbol, country, setCurrency, ready: currencyReady, rates, formatCurrency,
  } = useCurrency();

  const dashboardRef = useRef(null);
  const paramsCurrencyRef = useRef(DEFAULT_CURRENCY);
  const [paramsCurrency, setParamsCurrency] = useState(DEFAULT_CURRENCY);
  const urlHydratedRef = useRef(false);

  useEffect(() => {
    const storedTheme = localStorage.getItem('wealthwise_theme');
    const initialTheme = storedTheme === 'dark' ? 'dark' : 'light';
    setTheme(initialTheme);
    document.documentElement.setAttribute('data-theme', initialTheme);
    document.documentElement.style.colorScheme = initialTheme;
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.style.colorScheme = theme;
    localStorage.setItem('wealthwise_theme', theme);
  }, [theme]);

  // 1. URL Sharing Integration (once)
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    if (!searchParams.has('sip')) return;
    try {
      const urlCurrency = (searchParams.get('cur') || DEFAULT_CURRENCY).toUpperCase();
      const parsed = {
        lumpSum: parseFloat(searchParams.get('ls')) || 0,
        monthlySIP: parseFloat(searchParams.get('sip')) || 0,
        stepUpPercent: parseFloat(searchParams.get('su')) || 0,
        annualReturn: parseFloat(searchParams.get('ar')) || 12,
        totalYears: parseFloat(searchParams.get('ty')) || 20,
        sipStopYear: parseFloat(searchParams.get('ssy')) || 20,
        inflationRate: parseFloat(searchParams.get('inf')) || 6,
        monthlyWithdrawal: parseFloat(searchParams.get('mw')) || 0,
        swpStepUp: parseFloat(searchParams.get('wsu')) || 0,
        swpReturn: parseFloat(searchParams.get('wr')) || 8,
        swpYears: parseFloat(searchParams.get('wy')) || 0,
      };
      const resolvedCur = CURRENCY_META[urlCurrency] ? urlCurrency : DEFAULT_CURRENCY;
      setParams(parsed);
      paramsCurrencyRef.current = resolvedCur;
      setParamsCurrency(resolvedCur);
      if (CURRENCY_META[urlCurrency]) {
        localStorage.setItem('wealthwise_currency_override', urlCurrency);
      }
      urlHydratedRef.current = true;
    } catch (e) {
      console.error("Failed to parse URL query params", e);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const syncParamsToCurrency = (targetCode) => {
    const from = paramsCurrencyRef.current;
    if (from === targetCode) {
      setParamsCurrency(targetCode);
      return;
    }
    setParams((prev) => convertMoneyParams(prev, from, targetCode, rates));
    paramsCurrencyRef.current = targetCode;
    setParamsCurrency(targetCode);
  };

  // Keep money params aligned with the active currency (geo detect + manual switch)
  useEffect(() => {
    if (!currencyReady) return;

    if (urlHydratedRef.current) {
      const urlCur = paramsCurrencyRef.current;
      if (urlCur && urlCur !== currency) {
        setCurrency(urlCur);
      } else {
        setParamsCurrency(paramsCurrencyRef.current);
      }
      return;
    }

    syncParamsToCurrency(currency);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currencyReady, currency, rates]);

  const handleCurrencyChange = (nextCode) => {
    if (!nextCode || nextCode === currency) return;
    syncParamsToCurrency(nextCode);
    setCurrency(nextCode);
  };

  const isCurrencySynced = currencyReady && paramsCurrency === currency;

  // Compute results only when params match active currency
  const results = useMemo(
    () => (isCurrencySynced ? generateFullBreakdown(params) : null),
    [params, isCurrencySynced]
  );
  const insights = useMemo(
    () => (results ? generateInsights(results, formatCurrency) : []),
    [results, formatCurrency]
  );
  const sharePayload = useMemo(
    () => (results ? buildSharePayload(params, results, currency, formatCurrency) : null),
    [params, results, currency, formatCurrency]
  );

  // 2. Client-side Vector PDF Report Export
  const handleExportPDF = () => {
    if (!results) return;
    setIsExporting(true);

    try {
      const doc = new jsPDF('p', 'mm', 'a4');
      const pageWidth = 210;
      const pageHeight = 297;
      const margin = 12;
      const contentWidth = pageWidth - (margin * 2);

      // Colors (fixed print palette for consistent A4 exports across UI themes)
      const navy = [11, 15, 30];
      const purple = [139, 92, 246];
      const cyan = [34, 211, 238];
      const lightBg = [248, 250, 252];
      const borderClr = [226, 232, 240];

      // Format using active geo currency (ASCII-safe for jsPDF)
      const fmt = (val) => formatCurrency(val, { ascii: true, compact: false });

      const pageBottomY = pageHeight - 18;
      // jsPDF Helvetica only supports WinAnsi — strip emoji & fancy Unicode that corrupt layout
      const safeText = (text) => String(text ?? '')
        .replace(/₹/g, 'Rs. ')
        .replace(/[—–―]/g, '-')
        .replace(/[“”«»]/g, '"')
        .replace(/[‘’‚‛]/g, "'")
        .replace(/[×✕✖]/g, 'x')
        .replace(/…/g, '...')
        .replace(/™/g, '(TM)')
        .replace(/®/g, '(R)')
        .replace(/[\u{1F000}-\u{1FFFF}]/gu, '')
        .replace(/[\u{2600}-\u{27BF}]/gu, '')
        .replace(/[\u{FE00}-\u{FE0F}]/gu, '')
        .replace(/[\u{200B}-\u{200D}\u{FEFF}]/gu, '')
        .replace(/[^\x09\x0A\x0D\x20-\x7E\xA0-\xFF]/g, '')
        .replace(/[ \t]+/g, ' ')
        .trim();
      const drawWrappedText = (text, x, yPos, options = {}) => {
        const width = options.maxWidth || contentWidth - 10;
        const lineHeight = options.lineHeight || 4;
        const lines = doc.splitTextToSize(safeText(text), width);
        doc.text(lines, x, yPos);
        return lines.length * lineHeight;
      };

      // --- PAGE 1: STRATEGY BRIEF & KEY STATS ---
      // Brand Header Block
      doc.setFillColor(navy[0], navy[1], navy[2]);
      doc.rect(margin, 15, contentWidth, 24, 'F');
      
      // Purple / Cyan Accent bar below header
      doc.setFillColor(purple[0], purple[1], purple[2]);
      doc.rect(margin, 39, contentWidth / 2, 1, 'F');
      doc.setFillColor(cyan[0], cyan[1], cyan[2]);
      doc.rect(margin + contentWidth / 2, 39, contentWidth / 2, 1, 'F');

      // Header Text
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(20);
      doc.text('WealthWise', margin + 6, 28);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(cyan[0], cyan[1], cyan[2]);
      doc.text('AI-POWERED FINANCIAL PLANNER & RETIREMENT BRIEF', margin + 6, 34);

      doc.setTextColor(255, 255, 255, 0.6);
      doc.setFontSize(8);
      doc.text(`Generated: ${new Date().toLocaleDateString()}`, margin + contentWidth - 6, 29, { align: 'right' });
      doc.text('Strategy: Custom Simulation', margin + contentWidth - 6, 34, { align: 'right' });

      // SECTION 1: Simulated Strategy Parameters (3-Column Vertical Grid Layout)
      let y = 48;
      doc.setFillColor(purple[0], purple[1], purple[2]);
      doc.rect(margin, y, 3, 5, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(navy[0], navy[1], navy[2]);
      doc.text('1. Simulated Strategy Parameters', margin + 5, y + 4);

      y += 8;
      doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
      doc.setDrawColor(borderClr[0], borderClr[1], borderClr[2]);
      doc.rect(margin, y, contentWidth, 42, 'FD'); // Box height 42mm

      const pColWidth = (contentWidth - 6) / 3; // 60mm columns

      // --- Column 1: INVESTMENT ACCUMULATION ---
      let cx = margin + 4;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(purple[0], purple[1], purple[2]);
      doc.text('ACCUMULATION PHASE', cx, y + 6);
      doc.setDrawColor(borderClr[0], borderClr[1], borderClr[2]);
      doc.line(cx, y + 8, cx + pColWidth - 6, y + 8);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      doc.text('Initial Lump Sum:', cx, y + 13);
      doc.text('Monthly SIP Amount:', cx, y + 23);
      doc.text('Annual SIP Step-Up:', cx, y + 33);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(navy[0], navy[1], navy[2]);
      doc.text(fmt(params.lumpSum), cx, y + 17);
      doc.text(fmt(params.monthlySIP), cx, y + 27);
      doc.text(`${params.stepUpPercent}%`, cx, y + 37);

      // --- Column 2: TIMEFRAME & CAGR ---
      cx = margin + pColWidth + 3;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(cyan[0], cyan[1], cyan[2]);
      doc.text('GROWTH & TIMELINES', cx, y + 6);
      doc.line(cx, y + 8, cx + pColWidth - 6, y + 8);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      doc.text('Expected CAGR:', cx, y + 13);
      doc.text('Investment Tenure:', cx, y + 23);
      doc.text('SIP Stops After:', cx, y + 33);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(navy[0], navy[1], navy[2]);
      doc.text(`${params.annualReturn}% / year`, cx, y + 17);
      doc.text(`${params.totalYears} Years`, cx, y + 27);
      doc.text(`Year ${params.sipStopYear}`, cx, y + 37);

      // --- Column 3: RETIREMENT SWP ---
      cx = margin + (pColWidth * 2) + 2;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(navy[0], navy[1], navy[2]);
      doc.text('RETIREMENT (SWP)', cx, y + 6);
      doc.line(cx, y + 8, cx + pColWidth - 6, y + 8);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      doc.text('Monthly SWP Amount:', cx, y + 13);
      doc.text('Expected Return (SWP):', cx, y + 23);
      doc.text('SWP Tenure & Step-Up:', cx, y + 33);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(navy[0], navy[1], navy[2]);
      doc.text(params.monthlyWithdrawal > 0 ? fmt(params.monthlyWithdrawal) : 'No Withdrawal', cx, y + 17);
      doc.text(params.monthlyWithdrawal > 0 ? `${params.swpReturn}% / year` : 'N/A', cx, y + 27);
      doc.text(params.monthlyWithdrawal > 0 ? `${params.swpYears} Yrs (Step: ${params.swpStepUp}%)` : 'N/A', cx, y + 37);

      // SECTION 2: Core Simulation Metrics (2-Column Grid Layout)
      y += 50;
      doc.setFillColor(cyan[0], cyan[1], cyan[2]);
      doc.rect(margin, y, 3, 5, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(navy[0], navy[1], navy[2]);
      doc.text('2. Portfolio Growth & SWP Results', margin + 5, y + 4);

      y += 8;
      const colWidth = (contentWidth - 4) / 2; // 2 wide columns!
      const metricsList = [
        { label: 'Total Invested Capital', val: fmt(results.metrics.totalInvested), color: navy },
        { label: 'Total Earned Returns', val: fmt(results.metrics.totalReturns), color: [16, 185, 129] },
        { label: 'Final Accumulated Corpus', val: fmt(results.metrics.finalCorpus), color: purple },
        { label: 'Inflation-Adjusted Value', val: fmt(results.metrics.inflationAdjustedCorpus), color: [236, 72, 153] },
        { label: 'Wealth Multiplier', val: `${results.metrics.wealthMultiplier}x`, color: [16, 185, 129] },
        { label: 'Passive Income Potential', val: `${fmt(results.metrics.passiveMonthlyIncome)}/mo`, color: purple },
      ];

      if (results.swpResult) {
        metricsList.push(
          { label: 'Total SWP Withdrawn', val: fmt(results.swpResult.totalWithdrawn), color: [236, 72, 153] },
          { label: 'Remaining Retirement Wealth', val: fmt(results.swpResult.remainingCorpus), color: [16, 185, 129] },
          { label: 'Corpus Survival Time', val: `${results.swpResult.yearsLasted} Years`, color: cyan }
        );
      }

      let row = 0, col = 0;
      metricsList.forEach((m, idx) => {
        const mx = margin + col * (colWidth + 4);
        const my = y + row * 18;
        
        doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
        doc.setDrawColor(borderClr[0], borderClr[1], borderClr[2]);
        doc.rect(mx, my, colWidth, 15, 'FD');

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(100, 116, 139);
        doc.text(m.label, mx + 5, my + 5);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10.5);
        doc.setTextColor(m.color[0], m.color[1], m.color[2]);
        doc.text(m.val, mx + 5, my + 11);

        col++;
        if (col >= 2) { col = 0; row++; }
      });

      // SECTION 3: AI Recommendations (Dynamic Word Wrapping)
      y += (Math.ceil(metricsList.length / 2) * 18) + 4;
      const ensureSpace = (needed) => {
        if (y + needed > pageBottomY) {
          doc.addPage();
          y = 18;
        }
      };
      ensureSpace(20);
      doc.setFillColor(purple[0], purple[1], purple[2]);
      doc.rect(margin, y, 3, 5, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(navy[0], navy[1], navy[2]);
      doc.text('3. AI Intelligence Recommendations', margin + 5, y + 4);

      y += 8;
      const getPdfTag = (emoji) => {
        if (emoji === '🚀') return '[ACCUMULATION]';
        if (emoji === '📈') return '[GROWTH]';
        if (emoji === '💰') return '[RETURNS]';
        if (emoji === '📊') return '[ANALYSIS]';
        if (emoji === '⚠️') return '[WARNING]';
        if (emoji === '✅') return '[SUSTAINABILITY]';
        if (emoji === '🏦') return '[WITHDRAWALS]';
        if (emoji === '🌴') return '[PASSIVE INCOME]';
        if (emoji === '🔥') return '[FIRE GOAL]';
        if (emoji === '💪') return '[HEALTH]';
        if (emoji === '🏆') return '[MILESTONE]';
        if (emoji === '📉') return '[INFLATION]';
        if (emoji === '⬆️') return '[STEP-UP]';
        if (emoji === '🩺') return '[HEALTH]';
        return '[INSIGHT]';
      };
      const activeInsights = insights.slice(0, 4);
      activeInsights.forEach((ins) => {
        const tag = getPdfTag(ins.emoji);
        const safeTitle = safeText(ins.title);
        const safeBody = safeText(ins.text);
        const bodyLines = doc.splitTextToSize(safeBody, contentWidth - 10);
        const cardHeight = Math.max(13, 7.5 + bodyLines.length * 3.4);
        ensureSpace(cardHeight + 3);
        const iy = y;
        doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
        doc.setDrawColor(borderClr[0], borderClr[1], borderClr[2]);
        doc.rect(margin, iy, contentWidth, cardHeight, 'FD');

        let borderIndicator = purple;
        if (ins.type === 'danger' || ins.type === 'warning') borderIndicator = [236, 72, 153];
        if (ins.type === 'success') borderIndicator = [16, 185, 129];
        doc.setFillColor(borderIndicator[0], borderIndicator[1], borderIndicator[2]);
        doc.rect(margin, iy, 1.5, cardHeight, 'F');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(navy[0], navy[1], navy[2]);
        doc.text(`${tag}  ${safeTitle}`, margin + 5, iy + 4);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(71, 85, 105);
        doc.text(bodyLines, margin + 5, iy + 7.5);
        y += cardHeight + 2.5;
      });

      // --- SECTION 4: LEDGER (continue on same page when space allows) ---
      const ledgerMilestones = results.yearlyData.filter(d =>
        d.year === 1 ||
        d.year % 5 === 0 ||
        d.year === results.yearlyData.length
      );
      const ledgerBlockNeeded = 20 + ledgerMilestones.length * 7.5;
      ensureSpace(Math.min(ledgerBlockNeeded, 60));

      y += 4;
      doc.setFillColor(cyan[0], cyan[1], cyan[2]);
      doc.rect(margin, y, 3, 5, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(navy[0], navy[1], navy[2]);
      doc.text('4. Projected Milestone Compounding Ledgers (5-Year Milestones)', margin + 5, y + 4);

      y += 9;
      const drawLedgerHeader = () => {
        doc.setFillColor(navy[0], navy[1], navy[2]);
        doc.rect(margin, y, contentWidth, 8, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(255, 255, 255);
        doc.text('Year', margin + 4, y + 5.5);
        doc.text('Phase', margin + 15, y + 5.5);
        doc.text('Start Balance', margin + 62, y + 5.5, { align: 'right' });
        doc.text('Added / Withdrawn', margin + 102, y + 5.5, { align: 'right' });
        doc.text('Compound Growth', margin + 142, y + 5.5, { align: 'right' });
        doc.text('Ending Balance', margin + 182, y + 5.5, { align: 'right' });
        y += 8;
      };
      drawLedgerHeader();

      ledgerMilestones.forEach((row, idx) => {
        const rowHeight = 7.5;
        if (y + rowHeight > pageBottomY) {
          doc.addPage();
          y = 18;
          drawLedgerHeader();
        }

        const isSwp = row.phase === 'Withdrawal';

        if (idx % 2 === 0) {
          doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
          doc.rect(margin, y, contentWidth, rowHeight, 'F');
        }

        doc.setDrawColor(241, 245, 249);
        doc.line(margin, y + rowHeight, margin + contentWidth, y + rowHeight);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(navy[0], navy[1], navy[2]);
        doc.text(row.year.toString(), margin + 4, y + 5);

        doc.setFont('helvetica', 'bold');
        if (row.phase === 'SIP Active') doc.setTextColor(purple[0], purple[1], purple[2]);
        else if (row.phase === 'Growth Only') doc.setTextColor(cyan[0], cyan[1], cyan[2]);
        else doc.setTextColor(236, 72, 153);
        doc.text(row.phase, margin + 15, y + 5);

        doc.setFont('helvetica', 'normal');
        doc.setTextColor(71, 85, 105);
        doc.text(fmt(row.yearStart), margin + 62, y + 5, { align: 'right' });

        if (isSwp) {
          doc.setTextColor(236, 72, 153);
          doc.text(`-${fmt(row.withdrawn)}`, margin + 102, y + 5, { align: 'right' });
        } else {
          doc.setTextColor(16, 185, 129);
          doc.text(`+${fmt(row.invested)}`, margin + 102, y + 5, { align: 'right' });
        }

        doc.setTextColor(71, 85, 105);
        doc.text(fmt(row.returns), margin + 142, y + 5, { align: 'right' });

        doc.setFont('helvetica', 'bold');
        doc.setTextColor(navy[0], navy[1], navy[2]);
        doc.text(fmt(row.corpus), margin + 182, y + 5, { align: 'right' });

        y += rowHeight;
      });

      // Disclaimer directly under content (no forced bottom gap)
      ensureSpace(28);
      y += 8;
      doc.setFillColor(254, 242, 242);
      doc.setDrawColor(254, 202, 202);
      doc.rect(margin, y, contentWidth, 22, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(185, 28, 28);
      doc.text('[IMPORTANT] Financial Disclaimer & Compound Projection Rules', margin + 5, y + 4.5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(127, 29, 29);
      drawWrappedText(
        'Calculations shown in this report are projections based on steady compound interest formulas and do not constitute absolute guarantees of market returns.',
        margin + 5,
        y + 9,
        { maxWidth: contentWidth - 10, lineHeight: 3.5 }
      );
      drawWrappedText(
        'Future asset values are calculated on consistent monthly growth; actual mutual funds, equity indices, or debt instruments fluctuate based on market volatility.',
        margin + 5,
        y + 15.5,
        { maxWidth: contentWidth - 10, lineHeight: 3.5 }
      );

      // Dynamic footers on every page
      const totalPages = doc.internal.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(148, 163, 184);
        doc.text(
          `Page ${i} of ${totalPages}  |  WealthWise AI Strategy Report`,
          pageWidth / 2,
          pageHeight - 10,
          { align: 'center' }
        );
      }

      // Save PDF
      doc.save(`WealthWise-Strategy-Brief-${new Date().toISOString().slice(0,10)}.pdf`);
    } catch (e) {
      console.error('Failed generating PDF export', e);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-grid relative antialiased flex flex-col theme-transition" style={{ backgroundColor: 'var(--bg)', color: 'var(--text-primary)' }}>
      {/* Background Radial Glow */}
      <div className="absolute top-0 left-0 right-0 h-[40vh] pointer-events-none z-0" style={{ background: 'var(--hero-glow)' }} />

      {/* Main Header / Navigation */}
      <header className="backdrop-blur-md sticky top-0 z-40 theme-transition" style={{ borderBottom: '1px solid var(--border-soft)', background: 'color-mix(in srgb, var(--bg) 84%, transparent)' }}>
        <div className="max-w-7xl mx-auto px-2.5 sm:px-4 md:px-6 h-14 sm:h-16 flex items-center justify-between gap-1.5 sm:gap-3">
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
            <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg sm:rounded-xl bg-gradient-to-tr from-neon-purple via-neon-blue to-neon-cyan flex items-center justify-center shadow-glow-sm shrink-0 overflow-hidden">
              <img
                src={brandIconWhite}
                alt=""
                width={16}
                height={16}
                className="w-3.5 h-3.5 sm:w-[18px] sm:h-[18px] object-contain"
                draggable={false}
              />
            </div>
            <div className="font-display font-extrabold text-sm sm:text-base md:text-xl tracking-tight flex items-center gap-1.5 whitespace-nowrap truncate">
              SIP FirePlan
              <span className="hidden sm:inline-block text-[9px] font-semibold text-neon-purple px-1.5 py-0.5 rounded-md font-mono tracking-wider whitespace-nowrap">AI-Powered • Free Forever</span>
            </div>
          </div>

          <div className="flex items-center gap-1 sm:gap-2 md:gap-3 shrink-0">
            <label className="rounded-lg sm:rounded-xl px-1.5 sm:px-2 py-1 sm:py-1.5 text-[10px] md:text-xs font-semibold flex items-center gap-1 sm:gap-1.5"
              style={{ border: '1px solid var(--border)', background: 'var(--card-bg)', color: 'var(--text-secondary)' }}
              title={country ? `Detected location: ${country}` : 'Currency based on your location'}
            >
              <span className="hidden sm:inline text-[10px]" style={{ color: 'var(--text-muted)' }}>
                {currencyReady ? (country || '—') : '…'}
              </span>
              <select
                value={currency}
                onChange={(e) => handleCurrencyChange(e.target.value)}
                disabled={!currencyReady}
                className="currency-select outline-none font-mono font-bold cursor-pointer max-w-[3.6rem] sm:max-w-[4.5rem] disabled:opacity-50 rounded-md"
                style={{
                  color: 'var(--text-primary)',
                  backgroundColor: 'var(--bg-elevated)',
                  colorScheme: theme,
                }}
                aria-label="Display currency"
              >
                {Object.keys(CURRENCY_META).map((code) => (
                  <option key={code} value={code}>{code}</option>
                ))}
              </select>
              <span className="text-neon-cyan font-bold">{symbol.trim()}</span>
            </label>
            <button
              onClick={() => setTheme((prev) => prev === 'dark' ? 'light' : 'dark')}
              className="rounded-lg sm:rounded-xl p-1.5 sm:px-2.5 sm:py-2 text-xs font-semibold transition-all flex items-center gap-1.5"
              style={{ border: '1px solid var(--border)', background: 'var(--card-bg)', color: 'var(--text-secondary)' }}
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            >
              {theme === 'dark' ? <Sun size={14} className="text-neon-yellow" /> : <Moon size={14} className="text-neon-purple" />}
              <span className="hidden md:inline">{theme === 'dark' ? 'Light' : 'Dark'}</span>
            </button>
            <button
              onClick={() => setActiveView(activeView === 'dashboard' ? 'compare' : 'dashboard')}
              className={`rounded-lg sm:rounded-xl p-1.5 md:px-3 md:py-1.5 text-xs font-semibold transition-all flex items-center gap-1.5 ${
                activeView === 'compare'
                  ? 'bg-neon-cyan/15 border-neon-cyan/40 text-neon-cyan shadow-glow-cyan'
                  : ''
              }`}
              style={activeView === 'compare'
                ? { border: '1px solid rgba(34,211,238,0.45)' }
                : { border: '1px solid var(--border)', background: 'var(--card-bg)', color: 'var(--text-secondary)' }}
              aria-pressed={activeView === 'compare'}
              aria-label={activeView === 'compare' ? 'Back to dashboard' : 'Compare strategies'}
              title={activeView === 'compare' ? 'Go back' : 'Compare strategies'}
            >
              {/* Mobile: swap icon so active state is obvious */}
              <span className="md:hidden flex items-center justify-center">
                {activeView === 'compare'
                  ? <ArrowLeft size={15} className="text-neon-cyan" />
                  : <Layers size={15} className="text-neon-cyan" />}
              </span>
              {/* Desktop: keep layers icon + label */}
              <Layers size={14} className={`hidden md:block shrink-0 ${activeView === 'compare' ? 'text-neon-cyan' : 'text-neon-cyan'}`} />
              <span className="hidden md:inline">
                {activeView === 'dashboard' ? 'Compare Strategies 📊' : 'Go back'}
              </span>
            </button>

            <button
              onClick={() => setShowShareModal(true)}
              className="rounded-lg sm:rounded-xl p-1.5 sm:p-2 transition shrink-0"
              style={{ border: '1px solid var(--border)', background: 'var(--card-bg)', color: 'var(--text-secondary)' }}
              title="Share Scenario"
            >
              <Share2 size={15} className="sm:w-4 sm:h-4" />
            </button>

            <button
              onClick={handleExportPDF}
              disabled={isExporting}
              className="rounded-lg sm:rounded-xl bg-gradient-to-r from-neon-purple to-neon-blue hover:shadow-glow-sm p-1.5 sm:p-2 md:px-3 md:py-1.5 text-xs font-bold flex items-center gap-1.5 transition-all text-white shrink-0"
            >
              {isExporting ? (
                <>
                  <RefreshCw size={14} className="animate-spin shrink-0" />
                  <span className="hidden md:inline">Generating...</span>
                </>
              ) : (
                <>
                  <Download size={14} className="shrink-0" />
                  <span className="hidden md:inline">Export PDF Report 📄</span>
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      <h1 className="sr-only">SIPFirePlan — Free FIRE Calculator & SIP Planner for India | Financial Independence Made Simple</h1>

      {/* Main Body Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-2.5 sm:px-4 md:px-6 py-3.5 sm:py-6 grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-6 z-10 relative">

        {/* Left Hand: Sliders Panel */}
        <section className="lg:col-span-4 space-y-6">
          <InputSection params={params} setParams={setParams} />
        </section>

        {/* Right Hand: Simulation Reports & Insights */}
        <section className="lg:col-span-8 space-y-6" ref={dashboardRef}>
          {activeView === 'dashboard' ? (
            <div className="space-y-6">
              {!isCurrencySynced ? (
                <div className="glass-card p-10 flex flex-col items-center justify-center gap-3 text-center">
                  <RefreshCw size={24} className="animate-spin text-neon-purple" />
                  <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                    Updating amounts to {currency}…
                  </p>
                </div>
              ) : (
                <>
                  <ResultsDashboard key={`results-${currency}`} results={results} />
                  <VisualsSection key={`visuals-${currency}`} results={results} theme={theme} />
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold uppercase tracking-wider flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
                      <Sparkles size={16} className="text-neon-purple fill-neon-purple" />
                      🤖 Your Personal AI Wealth Coach
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {insights.slice(0, 4).map((ins) => (
                        <div
                          key={`${ins.id}-${currency}`}
                          className="glass-card p-4 hover:border-white/[0.12] transition-all flex items-start gap-3.5"
                        >
                          <div className="text-2xl mt-0.5 shrink-0 select-none">{ins.emoji}</div>
                          <div className="space-y-1.5">
                            <h4 className="text-sm font-bold leading-snug" style={{ color: 'var(--text-primary)' }}>{ins.title}</h4>
                            <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>{ins.text}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              <ComparePanel
                currentParams={params}
                currentMetrics={results?.metrics}
                currentSwpResult={results?.swpResult}
                onLoadParams={(loaded) => {
                  setParams(loaded);
                  paramsCurrencyRef.current = currency;
                  setParamsCurrency(currency);
                }}
              />
            </div>
          )}
        </section>
      </main>

      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        payload={sharePayload}
      />

      {/* Modern Fintech Footer */}
      <footer className="py-6 mt-12 text-center text-xs z-10 relative" style={{ borderTop: '1px solid var(--border-soft)', background: 'color-mix(in srgb, var(--bg) 90%, transparent)', color: 'var(--text-muted)' }}>
        <div className="max-w-7xl mx-auto px-4 flex flex-col items-center gap-3">
          <p className="font-medium">© 2026 SIPFirePlan.com — India's #1 Free AI FIRE & SIP Calculator. Built for future builders. Work is optional. 🚀</p>
          <nav className="flex flex-wrap justify-center gap-x-3 gap-y-1 text-[10px]" style={{ color: 'var(--text-muted)' }} aria-label="SEO footer links">
            <a href="#fire-calculator" className="hover:text-neon-purple transition">FIRE Calculator</a>
            <span aria-hidden="true">|</span>
            <a href="#sip-step-up" className="hover:text-neon-cyan transition">SIP Step-Up Calculator</a>
            <span aria-hidden="true">|</span>
            <a href="#swp-planner" className="hover:text-neon-pink transition">SWP Planner</a>
            <span aria-hidden="true">|</span>
            <a href="#retirement-planning" className="hover:text-neon-purple transition">Retirement Planning India</a>
            <span aria-hidden="true">|</span>
            <a href="#wealth-health-score" className="hover:text-neon-cyan transition">Wealth Health Score</a>
            <span aria-hidden="true">|</span>
            <a href="#crorepati-calculator" className="hover:text-neon-pink transition">Crorepati Calculator</a>
          </nav>
        </div>
      </footer>
    </div>
  );
}
