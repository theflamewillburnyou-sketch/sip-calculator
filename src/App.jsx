import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { jsPDF } from 'jspdf';
import {
  Sparkles, Download, Share2, Zap, RefreshCw, Layers, Sun, Moon
} from 'lucide-react';

import InputSection from './components/InputSection';
import ResultsDashboard from './components/ResultsDashboard';
import VisualsSection from './components/VisualsSection';
import ComparePanel from './components/ComparePanel';
import ShareModal from './components/ShareModal';
import { generateFullBreakdown } from './engine/sipCalculator';
import { generateInsights } from './engine/insightGenerator';
import { buildSharePayload } from './utils/buildSharePayload';

// Default parameters
const DEFAULT_PARAMS = {
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
  const [params, setParams] = useState(DEFAULT_PARAMS);
  const [activeView, setActiveView] = useState('dashboard'); // dashboard | compare
  const [showShareModal, setShowShareModal] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  
  const dashboardRef = useRef(null);
  const lastMilestone = useRef({ fire: false, cr: false });

  useEffect(() => {
    const storedTheme = localStorage.getItem('wealthwise_theme');
    const initialTheme = storedTheme === 'dark' ? 'dark' : 'light';
    setTheme(initialTheme);
    document.documentElement.setAttribute('data-theme', initialTheme);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('wealthwise_theme', theme);
  }, [theme]);

  // 1. URL Sharing Integration
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    if (searchParams.has('sip')) {
      try {
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
        setParams(parsed);
      } catch (e) {
        console.error("Failed to parse URL query params", e);
      }
    }
  }, []);

  // Compute results
  const results = generateFullBreakdown(params);
  const insights = generateInsights(results);
  const sharePayload = useMemo(() => buildSharePayload(params, results), [params, results]);

  // 2. Confetti Milestones Celebrations
  useEffect(() => {
    if (!results || !results.metrics) return;
    const { fireProgress, finalCorpus } = results.metrics;

    const currentFire = fireProgress >= 100;
    const currentCr = finalCorpus >= 1e7;

    // Trigger on transition from false to true
    if (currentFire && !lastMilestone.current.fire) {
      triggerConfetti("FIRE Achieved! 🔥 Let's celebrate financial independence!");
    }
    if (currentCr && !lastMilestone.current.cr) {
      triggerConfetti("Welcome to the Crorepati Club! 👑 ₹1 Crore Milestone crossed!");
    }

    lastMilestone.current = { fire: currentFire, cr: currentCr };
  }, [results]);

  const triggerConfetti = () => {
    // Canvas Confetti multi-burst
    const duration = 2.5 * 1000;
    const end = Date.now() + duration;

    (function frame() {
      confetti({
        particleCount: 4,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#a855f7', '#6366f1', '#22d3ee']
      });
      confetti({
        particleCount: 4,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#a855f7', '#ec4899', '#22d3ee']
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    }());
  };

  // 3. Client-side Vector PDF Report Export
  const handleExportPDF = () => {
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

      // Format Indian currency full helper (using Rs. to prevent encoding bugs)
      const fmt = (val) => {
        if (val == null || isNaN(val)) return 'Rs. 0';
        return 'Rs. ' + Math.abs(Math.round(val)).toLocaleString('en-IN');
      };

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
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-neon-purple via-neon-blue to-neon-cyan flex items-center justify-center shadow-glow-sm shrink-0">
              <Zap size={16} className="text-white fill-white" />
            </div>
            <div className="font-display font-extrabold text-base md:text-xl tracking-tight flex items-center gap-1.5 whitespace-nowrap">
              WealthWise
              <span className="hidden sm:inline-block text-[9px] font-semibold bg-neon-purple/20 text-neon-purple px-1.5 py-0.5 rounded-md font-mono tracking-wider whitespace-nowrap">AI-Powered • Free Forever</span>
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-3 shrink-0">
            <button
              onClick={() => setTheme((prev) => prev === 'dark' ? 'light' : 'dark')}
              className="rounded-xl px-2.5 py-2 text-xs font-semibold transition-all flex items-center gap-1.5"
              style={{ border: '1px solid var(--border)', background: 'var(--card-bg)', color: 'var(--text-secondary)' }}
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            >
              {theme === 'dark' ? <Sun size={14} className="text-neon-yellow" /> : <Moon size={14} className="text-neon-purple" />}
              <span className="hidden md:inline">{theme === 'dark' ? 'Light' : 'Dark'}</span>
            </button>
            <button
              onClick={() => setActiveView(activeView === 'dashboard' ? 'compare' : 'dashboard')}
              className="rounded-xl p-2 md:px-3 md:py-1.5 text-xs font-semibold transition-all flex items-center gap-1.5"
              style={{ border: '1px solid var(--border)', background: 'var(--card-bg)', color: 'var(--text-secondary)' }}
            >
              <Layers size={14} className="text-neon-cyan shrink-0" />
              <span className="hidden md:inline">
                {activeView === 'dashboard' ? 'Compare Strategies 📊' : 'Go back'}
              </span>
            </button>

            <button
              onClick={() => setShowShareModal(true)}
              className="rounded-xl p-2 transition shrink-0"
              style={{ border: '1px solid var(--border)', background: 'var(--card-bg)', color: 'var(--text-secondary)' }}
              title="Share Scenario"
            >
              <Share2 size={16} />
            </button>

            <button
              onClick={handleExportPDF}
              disabled={isExporting}
              className="rounded-xl bg-gradient-to-r from-neon-purple to-neon-blue hover:shadow-glow-sm p-2 md:px-3 md:py-1.5 text-xs font-bold flex items-center gap-1.5 transition-all text-white shrink-0"
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
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-4 md:px-6 py-5 sm:py-6 grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 z-10 relative">

        {/* Left Hand: Sliders Panel */}
        <section className="lg:col-span-4 space-y-6">
          <InputSection params={params} setParams={setParams} />
        </section>

        {/* Right Hand: Simulation Reports & Insights */}
        <section className="lg:col-span-8 space-y-6" ref={dashboardRef}>
          
          <AnimatePresence mode="wait">
            {activeView === 'dashboard' ? (
              <motion.div
                key="dashboard-view"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                {/* 1. Results Dashboard Metrics Grid */}
                <ResultsDashboard results={results} />

                {/* 2. Visualizations & Ledgers (Area, Bar, Table) */}
                <VisualsSection results={results} theme={theme} />

                {/* 3. AI Insights Feed */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold uppercase tracking-wider flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
                    <Sparkles size={16} className="text-neon-purple fill-neon-purple" />
                    🤖 Your Personal AI Wealth Coach
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {insights.slice(0, 4).map((ins) => (
                      <motion.div
                        key={ins.id}
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="glass-card p-4 hover:border-white/[0.12] transition-all flex items-start gap-3.5"
                      >
                        <div className="text-2xl mt-0.5 shrink-0 select-none">{ins.emoji}</div>
                        <div className="space-y-1.5">
                          <h4 className="text-sm font-bold leading-snug" style={{ color: 'var(--text-primary)' }}>{ins.title}</h4>
                          <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>{ins.text}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="compare-view"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3 }}
              >
                {/* Strategies Comparator matrix panel */}
                <ComparePanel
                  currentParams={params}
                  currentMetrics={results.metrics}
                  currentSwpResult={results.swpResult}
                  onLoadParams={setParams}
                />
              </motion.div>
            )}
          </AnimatePresence>
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
