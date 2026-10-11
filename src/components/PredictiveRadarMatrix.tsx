import React, { useState, useMemo, useRef, useEffect } from 'react';
import { CustomerRecord } from '../types/telemetry';

interface PredictiveRadarMatrixProps {
  customers: CustomerRecord[];
  selectedCustomer: CustomerRecord;
  onSelectCustomer: (cust: CustomerRecord) => void;
  onNavigateToSimulator?: (cust: CustomerRecord) => void;
  onOpenExport?: () => void;
  selectedClusterFilter: string;
  onSelectClusterFilter: (filter: string) => void;
}

type AxisMode = 'charges_vs_churn' | 'tenure_vs_churn' | 'tenure_vs_charges';
type ColorMode = 'risk' | 'contract' | 'tech';

export const PredictiveRadarMatrix: React.FC<PredictiveRadarMatrixProps> = ({
  customers,
  selectedCustomer,
  onSelectCustomer,
  onNavigateToSimulator,
  onOpenExport,
  selectedClusterFilter,
  onSelectClusterFilter,
}) => {
  const [axisMode, setAxisMode] = useState<AxisMode>('charges_vs_churn');
  const [colorMode, setColorMode] = useState<ColorMode>('risk');
  const [thresholdCutoff, setThresholdCutoff] = useState<number>(0.70);
  const [showThresholdLine, setShowThresholdLine] = useState<boolean>(true);
  const [isSweepActive, setIsSweepActive] = useState<boolean>(false);
  const [hoveredCustomer, setHoveredCustomer] = useState<CustomerRecord | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);
  const [justClickedId, setJustClickedId] = useState<string | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  // Trigger radar sweep
  const handleTriggerSweep = () => {
    setIsSweepActive(true);
    setTimeout(() => {
      setIsSweepActive(false);
    }, 2800);
  };

  // Dimensions
  const SVG_WIDTH = 800;
  const SVG_HEIGHT = 420;
  const PADDING = { left: 70, right: 760, top: 35, bottom: 375 };
  const PLOT_WIDTH = PADDING.right - PADDING.left;
  const PLOT_HEIGHT = PADDING.bottom - PADDING.top;

  // Stratified sample for performance (max ~180 points for snappy SVG 60fps) + always include selected customer
  const plottedCustomers = useMemo(() => {
    if (customers.length <= 180) {
      return customers;
    }

    // Stratified sample across risk tiers
    const criticals = customers.filter((c) => c.riskTier === 'CRITICAL');
    const highs = customers.filter((c) => c.riskTier === 'HIGH');
    const mediums = customers.filter((c) => c.riskTier === 'MEDIUM');
    const lows = customers.filter((c) => c.riskTier === 'LOW RISK');

    const sample = (arr: CustomerRecord[], count: number) => {
      if (arr.length <= count) return arr;
      const step = Math.max(1, Math.floor(arr.length / count));
      const res: CustomerRecord[] = [];
      for (let i = 0; i < arr.length && res.length < count; i += step) {
        res.push(arr[i]);
      }
      return res;
    };

    const sampledList = [
      ...sample(criticals, 60),
      ...sample(highs, 45),
      ...sample(mediums, 40),
      ...sample(lows, 40),
    ];

    // Ensure selectedCustomer is in the plot
    if (selectedCustomer && !sampledList.some((c) => c.id === selectedCustomer.id)) {
      sampledList.push(selectedCustomer);
    }

    return sampledList;
  }, [customers, selectedCustomer]);

  // Coordinate projection mapping
  const getCoordinates = (c: CustomerRecord) => {
    let rawX = 0;
    let rawY = 0;

    if (axisMode === 'charges_vs_churn') {
      // X = Monthly Charges (min 18 to max 125)
      const clampedCharges = Math.max(18, Math.min(125, c.monthlyCharges));
      rawX = (clampedCharges - 18) / (125 - 18);
      // Y = Churn Prob (0.0 to 1.0), top is 1.0 (inverted)
      rawY = Math.max(0, Math.min(1, c.churnProb));
    } else if (axisMode === 'tenure_vs_churn') {
      // X = Tenure (0 to 72 months)
      const clampedTenure = Math.max(0, Math.min(72, c.tenure));
      rawX = clampedTenure / 72;
      // Y = Churn Prob (0.0 to 1.0)
      rawY = Math.max(0, Math.min(1, c.churnProb));
    } else {
      // tenure_vs_charges
      // X = Tenure (0 to 72)
      const clampedTenure = Math.max(0, Math.min(72, c.tenure));
      rawX = clampedTenure / 72;
      // Y = Monthly Charges (18 to 125)
      const clampedCharges = Math.max(18, Math.min(125, c.monthlyCharges));
      rawY = (clampedCharges - 18) / (125 - 18);
    }

    const svgX = PADDING.left + rawX * PLOT_WIDTH;
    const svgY = PADDING.bottom - rawY * PLOT_HEIGHT;

    return { svgX, svgY };
  };

  // Node Color determination
  const getNodeColor = (c: CustomerRecord) => {
    if (colorMode === 'risk') {
      if (c.riskTier === 'CRITICAL') return { fill: '#ffb2b7', stroke: '#ff6e78', glow: '#b50036' };
      if (c.riskTier === 'HIGH') return { fill: '#f59e0b', stroke: '#fbbf24', glow: '#d97706' };
      if (c.riskTier === 'MEDIUM') return { fill: '#38bdf8', stroke: '#7dd3fc', glow: '#0284c7' };
      return { fill: '#56e5a9', stroke: '#86efac', glow: '#059669' };
    }

    if (colorMode === 'contract') {
      if (c.contract === 'Month-to-month') return { fill: '#ffb2b7', stroke: '#ff6e78', glow: '#b50036' };
      if (c.contract === 'One year') return { fill: '#38bdf8', stroke: '#7dd3fc', glow: '#0284c7' };
      return { fill: '#56e5a9', stroke: '#86efac', glow: '#059669' };
    }

    // colorMode === 'tech'
    if (c.internetService === 'Fiber optic') return { fill: '#c084fc', stroke: '#e879f9', glow: '#9333ea' };
    if (c.internetService === 'DSL') return { fill: '#38bdf8', stroke: '#7dd3fc', glow: '#0284c7' };
    return { fill: '#94a3b8', stroke: '#cbd5e1', glow: '#475569' };
  };

  // Check if node matches selected cluster filter
  const isNodeDimmed = (c: CustomerRecord) => {
    if (selectedClusterFilter === 'all') return false;
    if (selectedClusterFilter === 'critical') {
      return !(c.churnProb >= 0.70 || c.contract === 'Month-to-month');
    }
    if (selectedClusterFilter === 'renewal') {
      return !(c.contract === 'One year' || (c.churnProb >= 0.35 && c.churnProb < 0.70));
    }
    if (selectedClusterFilter === 'safe') {
      return !(c.riskTier === 'LOW RISK' || c.contract === 'Two year');
    }
    return false;
  };

  // High risk count calculation based on current threshold
  const subscribersAboveCutoff = useMemo(() => {
    return customers.filter((c) => c.churnProb >= thresholdCutoff).length;
  }, [customers, thresholdCutoff]);

  // Click on point
  const handlePointClick = (c: CustomerRecord, e: React.MouseEvent) => {
    e.stopPropagation();
    onSelectCustomer(c);
    setJustClickedId(c.id);
    setTimeout(() => setJustClickedId(null), 1200);
  };

  // Mouse move inside SVG for tracking coordinates
  const handleSvgMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * SVG_WIDTH;
    const y = ((e.clientY - rect.top) / rect.height) * SVG_HEIGHT;
    setMousePos({ x, y });
  };

  const handleSvgMouseLeave = () => {
    setMousePos(null);
    setHoveredCustomer(null);
  };

  // Derive active coordinate readouts for current mouse or hovered point
  const activeCoordinates = useMemo(() => {
    const target = hoveredCustomer;
    if (target) {
      return {
        xLabel:
          axisMode === 'charges_vs_churn'
            ? `₹${target.monthlyCharges.toFixed(2)}/mo`
            : `${target.tenure} Mos Tenure`,
        yLabel:
          axisMode === 'tenure_vs_charges'
            ? `₹${target.monthlyCharges.toFixed(2)}/mo`
            : `${(target.churnProb * 100).toFixed(1)}% Churn Prob`,
      };
    }
    if (mousePos) {
      const normX = Math.max(0, Math.min(1, (mousePos.x - PADDING.left) / PLOT_WIDTH));
      const normY = Math.max(0, Math.min(1, (PADDING.bottom - mousePos.y) / PLOT_HEIGHT));

      if (axisMode === 'charges_vs_churn') {
        const valX = 18 + normX * (125 - 18);
        const valY = normY * 100;
        return {
          xLabel: `₹${valX.toFixed(1)}/mo`,
          yLabel: `${valY.toFixed(1)}% Prob`,
        };
      }
      if (axisMode === 'tenure_vs_churn') {
        const valX = normX * 72;
        const valY = normY * 100;
        return {
          xLabel: `${Math.round(valX)} Mos`,
          yLabel: `${valY.toFixed(1)}% Prob`,
        };
      }
      const valX = normX * 72;
      const valY = 18 + normY * (125 - 18);
      return {
        xLabel: `${Math.round(valX)} Mos`,
        yLabel: `₹${valY.toFixed(1)}/mo`,
      };
    }
    return null;
  }, [hoveredCustomer, mousePos, axisMode]);

  // Selected customer coordinates
  const selectedCoords = selectedCustomer ? getCoordinates(selectedCustomer) : null;
  const hoveredCoords = hoveredCustomer ? getCoordinates(hoveredCustomer) : null;

  // Threshold Y coordinate
  const thresholdY =
    axisMode !== 'tenure_vs_charges'
      ? PADDING.bottom - thresholdCutoff * PLOT_HEIGHT
      : null;

  return (
    <section className="bg-[#171b26]/90 backdrop-blur-xl rounded-xl p-4 sm:p-5 shadow-xl flex flex-col gap-3.5 border border-white/5 relative">
      {/* 1. Header Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#38bdf8] text-lg animate-pulse">radar</span>
            <h2 className="font-semibold text-base sm:text-lg text-[#dfe2f1] tracking-tight flex items-center gap-2">
              Interactive Churn Radar &amp; Correlation Matrix
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#38bdf8]/15 text-[#38bdf8] border border-[#38bdf8]/30 font-bold">
                REACTABLE 60FPS
              </span>
            </h2>
          </div>
          <p className="text-xs text-[#bdc8d1]">
            Multi-variable scatter correlation: Click any subscriber node to instantly inspect profile, simulate interventions, or trace drivers.
          </p>
        </div>

        {/* Action Controls & Metric Toggles */}
        <div className="flex flex-wrap items-center gap-2">
          {/* High risk flag badge */}
          <div className="flex items-center gap-1.5 bg-[#b50036]/25 border border-[#ffb2b7]/40 px-2.5 py-1 rounded-lg">
            <span className="w-2 h-2 rounded-full bg-[#ffb2b7] animate-ping"></span>
            <span className="font-mono text-xs text-[#ffb2b7] font-bold">
              {subscribersAboveCutoff} At-Risk (p &ge; {thresholdCutoff.toFixed(2)})
            </span>
          </div>

          {/* Radar Sweep Animation Button */}
          <button
            onClick={handleTriggerSweep}
            disabled={isSweepActive}
            className={`flex items-center gap-1 px-2.5 py-1 text-xs font-mono rounded-lg border transition-all cursor-pointer ${
              isSweepActive
                ? 'bg-[#38bdf8]/20 border-[#38bdf8] text-[#8ed5ff]'
                : 'bg-[#262a35] hover:bg-[#353944] border-white/10 text-[#bdc8d1] hover:text-[#dfe2f1]'
            }`}
            title="Scan matrix with sweeping beam"
          >
            <span className={`material-symbols-outlined text-[14px] ${isSweepActive ? 'animate-spin' : ''}`}>
              sensors
            </span>
            <span>Sweep Radar</span>
          </button>

          {/* Quick cluster jump */}
          <button
            onClick={() => onSelectClusterFilter(selectedClusterFilter === 'critical' ? 'all' : 'critical')}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer shadow-sm ${
              selectedClusterFilter === 'critical'
                ? 'bg-[#ffb2b7] text-[#4a0011] ring-2 ring-[#ffb2b7]/50'
                : 'bg-[#38bdf8] text-[#004965] hover:bg-[#7bd0ff]'
            }`}
          >
            <span className="material-symbols-outlined text-[14px]">group_search</span>
            <span>{selectedClusterFilter === 'critical' ? 'Show All' : 'Focus High-Risk'}</span>
          </button>

          {onOpenExport && (
            <button
              onClick={onOpenExport}
              className="flex items-center gap-1.5 px-3 py-1 bg-[#262a35] text-[#dfe2f1] hover:bg-[#353944] text-xs font-semibold rounded-lg border border-white/10 transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[14px]">file_download</span>
              <span>Export</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Graph Control Strip (Axis Mode, Color Mode, Threshold Cutoff) */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 px-3 py-2 bg-[#0a0e18]/80 rounded-lg border border-white/5 text-xs font-mono">
        {/* Left: Axis Mode Selectors */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[#87929a] text-[10px] uppercase font-semibold">Axes:</span>
          <button
            onClick={() => setAxisMode('charges_vs_churn')}
            className={`px-2 py-0.5 rounded text-[11px] transition-colors cursor-pointer ${
              axisMode === 'charges_vs_churn'
                ? 'bg-[#38bdf8] text-[#004965] font-bold shadow-sm'
                : 'text-[#bdc8d1] hover:text-[#dfe2f1] bg-[#1c1f2a]/60'
            }`}
          >
            Charges vs. Churn Prob
          </button>
          <button
            onClick={() => setAxisMode('tenure_vs_churn')}
            className={`px-2 py-0.5 rounded text-[11px] transition-colors cursor-pointer ${
              axisMode === 'tenure_vs_churn'
                ? 'bg-[#38bdf8] text-[#004965] font-bold shadow-sm'
                : 'text-[#bdc8d1] hover:text-[#dfe2f1] bg-[#1c1f2a]/60'
            }`}
          >
            Tenure vs. Churn Prob
          </button>
          <button
            onClick={() => setAxisMode('tenure_vs_charges')}
            className={`px-2 py-0.5 rounded text-[11px] transition-colors cursor-pointer ${
              axisMode === 'tenure_vs_charges'
                ? 'bg-[#38bdf8] text-[#004965] font-bold shadow-sm'
                : 'text-[#bdc8d1] hover:text-[#dfe2f1] bg-[#1c1f2a]/60'
            }`}
          >
            Tenure vs. Charges
          </button>
        </div>

        {/* Center: Color Mode */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[#87929a] text-[10px] uppercase font-semibold">Color by:</span>
          <button
            onClick={() => setColorMode('risk')}
            className={`px-2 py-0.5 rounded text-[11px] transition-colors cursor-pointer ${
              colorMode === 'risk'
                ? 'bg-[#1c1f2a] text-[#56e5a9] border border-[#56e5a9]/50 font-bold'
                : 'text-[#bdc8d1] hover:text-[#dfe2f1]'
            }`}
          >
            Risk Tier
          </button>
          <button
            onClick={() => setColorMode('contract')}
            className={`px-2 py-0.5 rounded text-[11px] transition-colors cursor-pointer ${
              colorMode === 'contract'
                ? 'bg-[#1c1f2a] text-[#8ed5ff] border border-[#8ed5ff]/50 font-bold'
                : 'text-[#bdc8d1] hover:text-[#dfe2f1]'
            }`}
          >
            Contract
          </button>
          <button
            onClick={() => setColorMode('tech')}
            className={`px-2 py-0.5 rounded text-[11px] transition-colors cursor-pointer ${
              colorMode === 'tech'
                ? 'bg-[#1c1f2a] text-[#c084fc] border border-[#c084fc]/50 font-bold'
                : 'text-[#bdc8d1] hover:text-[#dfe2f1]'
            }`}
          >
            Tech Type
          </button>
        </div>

        {/* Right: Cutoff Threshold Slider & Live readout */}
        {axisMode !== 'tenure_vs_charges' && (
          <div className="flex items-center gap-2">
            <span className="text-[#87929a] text-[10px] uppercase font-semibold">Cutoff Line:</span>
            <input
              type="range"
              min="0.30"
              max="0.85"
              step="0.05"
              value={thresholdCutoff}
              onChange={(e) => setThresholdCutoff(parseFloat(e.target.value))}
              className="w-20 accent-[#ffb2b7] bg-[#313540] rounded h-1 cursor-pointer"
            />
            <button
              onClick={() => setShowThresholdLine(!showThresholdLine)}
              className={`px-1.5 py-0.5 rounded text-[10px] border cursor-pointer ${
                showThresholdLine
                  ? 'border-[#ffb2b7]/60 text-[#ffb2b7] bg-[#ffb2b7]/10'
                  : 'border-white/10 text-[#87929a]'
              }`}
            >
              p &ge; {thresholdCutoff.toFixed(2)}
            </button>
          </div>
        )}
      </div>

      {/* 3. Interactive SVG Radar & Scatter Plot Canvas */}
      <div className="relative w-full h-[360px] sm:h-[440px] bg-[#0a0e18]/95 rounded-xl overflow-hidden shadow-inner border border-white/10 select-none">
        {/* Ambient atmospheric glows */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#b50036]/15 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-12 w-80 h-64 bg-[#30c88f]/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute top-1/3 left-1/2 w-64 h-64 bg-[#38bdf8]/10 rounded-full blur-3xl pointer-events-none"></div>

        {/* Radar Sweep Effect */}
        {isSweepActive && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden z-10">
            <div
              className="absolute top-1/2 left-1/2 w-[800px] h-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#38bdf8]/40 animate-ping opacity-30"
              style={{ animationDuration: '2.5s' }}
            ></div>
            <div
              className="absolute top-1/2 left-1/2 w-[600px] h-0.5 bg-gradient-to-r from-transparent via-[#38bdf8] to-transparent origin-left animate-spin"
              style={{ animationDuration: '2.5s' }}
            ></div>
          </div>
        )}

        {/* Live Coordinate Top HUD */}
        <div className="absolute top-2.5 left-3 right-3 z-20 flex items-center justify-between pointer-events-none text-[11px] font-mono text-[#87929a]">
          <div className="flex items-center gap-2 bg-[#0a0e18]/85 backdrop-blur-md px-2.5 py-1 rounded-md border border-white/10 shadow">
            <span className="w-1.5 h-1.5 rounded-full bg-[#38bdf8] animate-pulse"></span>
            <span>
              {axisMode === 'charges_vs_churn' && 'Y: Churn Probability (0.00 → 1.00)'}
              {axisMode === 'tenure_vs_churn' && 'Y: Churn Probability (0.00 → 1.00)'}
              {axisMode === 'tenure_vs_charges' && 'Y: Monthly Charges (₹18 → ₹125)'}
            </span>
            {activeCoordinates && (
              <span className="text-[#dfe2f1] font-bold border-l border-white/10 pl-2 text-[#8ed5ff]">
                [{activeCoordinates.yLabel}]
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 bg-[#0a0e18]/85 backdrop-blur-md px-2.5 py-1 rounded-md border border-white/10 shadow">
            <span>
              {axisMode === 'charges_vs_churn' && 'X: Monthly Charges (₹18 → ₹125)'}
              {axisMode === 'tenure_vs_churn' && 'X: Tenure (0 → 72 Mos)'}
              {axisMode === 'tenure_vs_charges' && 'X: Tenure (0 → 72 Mos)'}
            </span>
            {activeCoordinates && (
              <span className="text-[#dfe2f1] font-bold border-l border-white/10 pl-2 text-[#56e5a9]">
                [{activeCoordinates.xLabel}]
              </span>
            )}
          </div>
        </div>

        {/* SVG Visualization */}
        <svg
          ref={svgRef}
          className="absolute inset-0 w-full h-full cursor-crosshair"
          viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
          preserveAspectRatio="none"
          onMouseMove={handleSvgMouseMove}
          onMouseLeave={handleSvgMouseLeave}
        >
          <defs>
            {/* Pulsing beacon glow filters */}
            <filter id="radarGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="3.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="pointSelectGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <linearGradient id="criticalDangerZone" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#b50036" stopOpacity="0.16" />
              <stop offset="100%" stopColor="#b50036" stopOpacity="0.02" />
            </linearGradient>
          </defs>

          {/* Background Concentric Radar Arcs */}
          <path
            className="text-[#3e484f]/25"
            d={`M 0 ${SVG_HEIGHT} A 900 900 0 0 1 ${SVG_WIDTH} 80`}
            stroke="currentColor"
            strokeDasharray="4 6"
            strokeWidth="1"
            fill="none"
          />
          <path
            className="text-[#3e484f]/30"
            d={`M 0 ${SVG_HEIGHT} A 700 700 0 0 1 ${SVG_WIDTH} 180`}
            stroke="currentColor"
            strokeDasharray="4 6"
            strokeWidth="1"
            fill="none"
          />
          <path
            className="text-[#3e484f]/35"
            d={`M 0 ${SVG_HEIGHT} A 480 480 0 0 1 ${SVG_WIDTH} 280`}
            stroke="currentColor"
            strokeDasharray="3 5"
            strokeWidth="1"
            fill="none"
          />

          {/* Grid lines */}
          {[0.2, 0.4, 0.6, 0.8].map((ratio) => {
            const x = PADDING.left + ratio * PLOT_WIDTH;
            return (
              <line
                key={`grid-x-${ratio}`}
                x1={x}
                x2={x}
                y1={PADDING.top}
                y2={PADDING.bottom}
                stroke="#3e484f"
                strokeOpacity="0.18"
                strokeDasharray="3 4"
              />
            );
          })}
          {[0.25, 0.5, 0.75].map((ratio) => {
            const y = PADDING.bottom - ratio * PLOT_HEIGHT;
            return (
              <line
                key={`grid-y-${ratio}`}
                x1={PADDING.left}
                x2={PADDING.right}
                y1={y}
                y2={y}
                stroke="#3e484f"
                strokeOpacity="0.18"
                strokeDasharray="3 4"
              />
            );
          })}

          {/* Critical Threshold Area & Line */}
          {showThresholdLine && thresholdY !== null && (
            <g className="pointer-events-none">
              <rect
                x={PADDING.left}
                y={PADDING.top}
                width={PLOT_WIDTH}
                height={Math.max(0, thresholdY - PADDING.top)}
                fill="url(#criticalDangerZone)"
              />
              <line
                x1={PADDING.left}
                x2={PADDING.right}
                y1={thresholdY}
                y2={thresholdY}
                stroke="#ffb2b7"
                strokeWidth="1.5"
                strokeDasharray="6 4"
                strokeOpacity="0.75"
              />
              <text
                x={PADDING.right - 10}
                y={thresholdY - 6}
                textAnchor="end"
                className="fill-[#ffb2b7] font-mono text-[10px] font-bold"
              >
                CRITICAL THRESHOLD (p &ge; {thresholdCutoff.toFixed(2)}) • {subscribersAboveCutoff} SUBS
              </text>
            </g>
          )}

          {/* Dynamic Crosshair Guide from Hovered Point or Mouse */}
          {(hoveredCoords || mousePos) && (
            <g className="pointer-events-none">
              {hoveredCoords ? (
                <>
                  <line
                    x1={hoveredCoords.svgX}
                    x2={hoveredCoords.svgX}
                    y1={PADDING.top}
                    y2={PADDING.bottom}
                    stroke="#38bdf8"
                    strokeWidth="1.2"
                    strokeDasharray="2 3"
                    strokeOpacity="0.6"
                  />
                  <line
                    x1={PADDING.left}
                    x2={PADDING.right}
                    y1={hoveredCoords.svgY}
                    y2={hoveredCoords.svgY}
                    stroke="#38bdf8"
                    strokeWidth="1.2"
                    strokeDasharray="2 3"
                    strokeOpacity="0.6"
                  />
                </>
              ) : mousePos ? (
                <>
                  <line
                    x1={mousePos.x}
                    x2={mousePos.x}
                    y1={PADDING.top}
                    y2={PADDING.bottom}
                    stroke="#ffffff"
                    strokeWidth="0.8"
                    strokeDasharray="2 4"
                    strokeOpacity="0.25"
                  />
                  <line
                    x1={PADDING.left}
                    x2={PADDING.right}
                    y1={mousePos.y}
                    y2={mousePos.y}
                    stroke="#ffffff"
                    strokeWidth="0.8"
                    strokeDasharray="2 4"
                    strokeOpacity="0.25"
                  />
                </>
              ) : null}
            </g>
          )}

          {/* Interactive Customer Nodes */}
          {plottedCustomers.map((c) => {
            const { svgX, svgY } = getCoordinates(c);
            const isSelected = selectedCustomer?.id === c.id;
            const isHovered = hoveredCustomer?.id === c.id;
            const isDimmed = isNodeDimmed(c);
            const { fill, stroke, glow } = getNodeColor(c);
            const isJustClicked = justClickedId === c.id;

            const radius = isSelected ? 8 : isHovered ? 7.5 : c.riskTier === 'CRITICAL' ? 5.5 : 4.5;
            const opacity = isDimmed ? 0.15 : isHovered || isSelected ? 1 : 0.78;

            return (
              <g
                key={c.id}
                onClick={(e) => handlePointClick(c, e)}
                onMouseEnter={() => setHoveredCustomer(c)}
                className="cursor-pointer transition-transform duration-150"
              >
                {/* Click ripple animation */}
                {isJustClicked && (
                  <circle
                    cx={svgX}
                    cy={svgY}
                    r={28}
                    fill="none"
                    stroke="#38bdf8"
                    strokeWidth="2"
                    className="animate-ping"
                  />
                )}

                {/* Glow ring if hovered */}
                {isHovered && (
                  <circle
                    cx={svgX}
                    cy={svgY}
                    r={14}
                    fill={glow}
                    fillOpacity="0.35"
                    stroke={fill}
                    strokeWidth="1.5"
                    className="animate-pulse"
                  />
                )}

                {/* Base circle node */}
                <circle
                  cx={svgX}
                  cy={svgY}
                  r={radius}
                  fill={fill}
                  stroke={isSelected ? '#ffffff' : stroke}
                  strokeWidth={isSelected ? 2.5 : isHovered ? 2 : 1}
                  opacity={opacity}
                  filter={isSelected || isHovered ? 'url(#pointSelectGlow)' : undefined}
                />
              </g>
            );
          })}

          {/* Selected Customer Beacon Pin (Always rendered on top) */}
          {selectedCoords && (
            <g className="pointer-events-none">
              {/* Outer pulsing ring */}
              <circle
                cx={selectedCoords.svgX}
                cy={selectedCoords.svgY}
                r={22}
                fill="none"
                stroke="#38bdf8"
                strokeWidth="1.5"
                strokeDasharray="3 3"
                className="animate-spin"
                style={{ animationDuration: '6s' }}
              />
              <circle
                cx={selectedCoords.svgX}
                cy={selectedCoords.svgY}
                r={15}
                fill="#38bdf8"
                fillOpacity="0.25"
                stroke="#ffffff"
                strokeWidth="2"
              />
              <circle
                cx={selectedCoords.svgX}
                cy={selectedCoords.svgY}
                r={5}
                fill="#ffffff"
              />

              {/* Tag Pin */}
              <g transform={`translate(${selectedCoords.svgX}, ${selectedCoords.svgY - 26})`}>
                <rect
                  x="-42"
                  y="-14"
                  width="84"
                  height="18"
                  rx="4"
                  fill="#0a0e18"
                  fillOpacity="0.95"
                  stroke="#38bdf8"
                  strokeWidth="1.2"
                />
                <text
                  x="0"
                  y="-2"
                  textAnchor="middle"
                  className="fill-[#38bdf8] font-mono text-[9px] font-bold"
                >
                  TARGET: {selectedCustomer.id}
                </text>
              </g>
            </g>
          )}

          {/* Axes Borders & Labels */}
          <line
            x1={PADDING.left}
            x2={PADDING.right}
            y1={PADDING.bottom}
            y2={PADDING.bottom}
            stroke="#64748b"
            strokeWidth="1.5"
          />
          <line
            x1={PADDING.left}
            x2={PADDING.left}
            y1={PADDING.top}
            y2={PADDING.bottom}
            stroke="#64748b"
            strokeWidth="1.5"
          />

          {/* Ticks on X Axis */}
          {[0, 0.25, 0.5, 0.75, 1.0].map((t) => {
            const x = PADDING.left + t * PLOT_WIDTH;
            let label = '';
            if (axisMode === 'charges_vs_churn') {
              label = `₹${Math.round(18 + t * (125 - 18))}`;
            } else {
              label = `${Math.round(t * 72)}m`;
            }
            return (
              <g key={`xtick-${t}`}>
                <line x1={x} x2={x} y1={PADDING.bottom} y2={PADDING.bottom + 5} stroke="#64748b" />
                <text
                  x={x}
                  y={PADDING.bottom + 16}
                  textAnchor="middle"
                  className="fill-[#87929a] font-mono text-[10px]"
                >
                  {label}
                </text>
              </g>
            );
          })}

          {/* Ticks on Y Axis */}
          {[0, 0.25, 0.5, 0.75, 1.0].map((t) => {
            const y = PADDING.bottom - t * PLOT_HEIGHT;
            let label = '';
            if (axisMode === 'tenure_vs_charges') {
              label = `₹${Math.round(18 + t * (125 - 18))}`;
            } else {
              label = `${Math.round(t * 100)}%`;
            }
            return (
              <g key={`ytick-${t}`}>
                <line x1={PADDING.left - 5} x2={PADDING.left} y1={y} y2={y} stroke="#64748b" />
                <text
                  x={PADDING.left - 8}
                  y={y + 3}
                  textAnchor="end"
                  className="fill-[#87929a] font-mono text-[10px]"
                >
                  {label}
                </text>
              </g>
            );
          })}
        </svg>

        {/* 4. Interactive Floating Tooltip HUD Card */}
        {hoveredCustomer && hoveredCoords && (
          <div
            className="absolute z-30 pointer-events-auto bg-[#0a0e18]/95 backdrop-blur-xl border border-white/20 rounded-xl p-3 shadow-2xl flex flex-col gap-2 w-64 text-xs transition-opacity duration-150 animate-in fade-in"
            style={{
              left: Math.min(
                SVG_WIDTH - 280,
                Math.max(10, (hoveredCoords.svgX / SVG_WIDTH) * 100 > 65 ? hoveredCoords.svgX - 275 : hoveredCoords.svgX + 15)
              ),
              top: Math.min(
                SVG_HEIGHT - 190,
                Math.max(10, hoveredCoords.svgY - 80)
              ),
            }}
          >
            <div className="flex items-center justify-between pb-1.5 border-b border-white/10">
              <div className="flex items-center gap-1.5">
                <span className="font-mono font-bold text-[#dfe2f1]">{hoveredCustomer.id}</span>
                <span className="text-[10px] text-[#87929a] font-mono">({hoveredCustomer.plan})</span>
              </div>
              <span
                className={`font-mono text-[9px] font-bold px-1.5 py-0.5 rounded ${
                  hoveredCustomer.riskTier === 'CRITICAL'
                    ? 'bg-[#b50036]/30 text-[#ffb2b7] border border-[#ffb2b7]/40'
                    : hoveredCustomer.riskTier === 'HIGH'
                    ? 'bg-[#f59e0b]/20 text-[#f59e0b] border border-[#f59e0b]/30'
                    : 'bg-[#56e5a9]/20 text-[#56e5a9] border border-[#56e5a9]/30'
                }`}
              >
                {hoveredCustomer.riskTier}
              </span>
            </div>

            {/* Churn Probability Meter */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between font-mono text-[11px]">
                <span className="text-[#bdc8d1]">Churn Risk:</span>
                <span
                  className={`font-bold ${
                    hoveredCustomer.churnProb >= 0.70
                      ? 'text-[#ffb2b7]'
                      : hoveredCustomer.churnProb >= 0.35
                      ? 'text-[#f59e0b]'
                      : 'text-[#56e5a9]'
                  }`}
                >
                  {(hoveredCustomer.churnProb * 100).toFixed(1)}%
                </span>
              </div>
              <div className="w-full h-1.5 bg-[#1c1f2a] rounded-full overflow-hidden flex">
                <div
                  className={`h-full rounded-full ${
                    hoveredCustomer.churnProb >= 0.70
                      ? 'bg-[#ffb2b7]'
                      : hoveredCustomer.churnProb >= 0.35
                      ? 'bg-[#f59e0b]'
                      : 'bg-[#56e5a9]'
                  }`}
                  style={{ width: `${Math.min(100, hoveredCustomer.churnProb * 100)}%` }}
                ></div>
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 gap-1.5 font-mono text-[10px] bg-[#171b26]/70 p-1.5 rounded-lg border border-white/5">
              <div>
                <span className="text-[#87929a] block">Charges:</span>
                <span className="text-[#dfe2f1] font-semibold">₹{hoveredCustomer.monthlyCharges.toFixed(2)}/mo</span>
              </div>
              <div>
                <span className="text-[#87929a] block">Tenure:</span>
                <span className="text-[#dfe2f1] font-semibold">{hoveredCustomer.tenure} Months</span>
              </div>
              <div>
                <span className="text-[#87929a] block">Contract:</span>
                <span className="text-[#8ed5ff] truncate block">{hoveredCustomer.contract}</span>
              </div>
              <div>
                <span className="text-[#87929a] block">Tech:</span>
                <span className="text-[#c084fc] truncate block">{hoveredCustomer.internetService}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-1.5 pt-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectCustomer(hoveredCustomer);
                }}
                className="flex-1 py-1 px-2 bg-[#38bdf8] hover:bg-[#7bd0ff] text-[#004965] font-bold text-[10px] rounded transition-colors flex items-center justify-center gap-1 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[12px]">visibility</span>
                <span>Select &amp; Inspect</span>
              </button>

              {onNavigateToSimulator && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onNavigateToSimulator(hoveredCustomer);
                  }}
                  className="py-1 px-2 bg-[#262a35] hover:bg-[#353944] text-[#dfe2f1] font-bold text-[10px] rounded border border-white/10 transition-colors flex items-center gap-1 cursor-pointer"
                  title="Simulate What-If retention scenario"
                >
                  <span className="material-symbols-outlined text-[12px]">science</span>
                  <span>Simulate</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 5. Tactical Cluster Callout Cards (Clickable Filter Buttons) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        <button
          onClick={() =>
            onSelectClusterFilter(selectedClusterFilter === 'safe' ? 'all' : 'safe')
          }
          className={`p-2.5 rounded-lg shadow-md flex items-center gap-2.5 border transition-all text-left cursor-pointer ${
            selectedClusterFilter === 'safe'
              ? 'bg-[#1c1f2a] border-[#56e5a9] ring-2 ring-[#56e5a9]/50 shadow-[0_0_15px_rgba(86,229,169,0.2)]'
              : 'bg-[#1c1f2a]/80 border-white/10 hover:border-[#56e5a9]/50'
          }`}
        >
          <div className="w-3 h-3 rounded-full bg-[#56e5a9] shrink-0"></div>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs text-[#dfe2f1] font-semibold truncate">
                Secure Core Cohort
              </span>
              <span className="text-[10px] text-[#56e5a9] font-mono font-bold ml-1">
                {selectedClusterFilter === 'safe' ? 'Active' : 'Filter'}
              </span>
            </div>
            <span className="text-[10px] text-[#bdc8d1] font-mono truncate">
              p &lt; 0.35 • 2-Yr Lock • ₹40-80/mo
            </span>
          </div>
        </button>

        <button
          onClick={() =>
            onSelectClusterFilter(selectedClusterFilter === 'renewal' ? 'all' : 'renewal')
          }
          className={`p-2.5 rounded-lg shadow-md flex items-center gap-2.5 border transition-all text-left cursor-pointer ${
            selectedClusterFilter === 'renewal'
              ? 'bg-[#1c1f2a] border-[#38bdf8] ring-2 ring-[#38bdf8]/50 shadow-[0_0_15px_rgba(56,189,248,0.2)]'
              : 'bg-[#1c1f2a]/80 border-white/10 hover:border-[#38bdf8]/50'
          }`}
        >
          <div className="w-3 h-3 rounded-full bg-[#38bdf8] shrink-0"></div>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs text-[#dfe2f1] font-semibold truncate">
                Renewal Window (1-Yr)
              </span>
              <span className="text-[10px] text-[#8ed5ff] font-mono font-bold ml-1">
                {selectedClusterFilter === 'renewal' ? 'Active' : 'Filter'}
              </span>
            </div>
            <span className="text-[10px] text-[#bdc8d1] font-mono truncate">
              p 0.35–0.69 • 1-Yr Fixed • ₹70-95/mo
            </span>
          </div>
        </button>

        <button
          onClick={() =>
            onSelectClusterFilter(selectedClusterFilter === 'critical' ? 'all' : 'critical')
          }
          className={`p-2.5 rounded-lg shadow-md flex items-center gap-2.5 border transition-all text-left cursor-pointer ${
            selectedClusterFilter === 'critical'
              ? 'bg-[#b50036]/50 border-[#ffb2b7] ring-2 ring-[#ffb2b7]/60 shadow-[0_0_15px_rgba(255,178,183,0.3)]'
              : 'bg-[#b50036]/35 border-[#ffb2b7]/30 hover:border-[#ffb2b7]'
          }`}
        >
          <div className="w-3 h-3 rounded-full bg-[#ffb2b7] animate-ping shrink-0"></div>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs text-[#ffb2b7] font-semibold truncate">
                Month-to-Month Fiber Heavy
              </span>
              <span className="text-[10px] text-[#ffb2b7] font-mono font-bold ml-1">
                {selectedClusterFilter === 'critical' ? 'Active' : 'Filter'}
              </span>
            </div>
            <span className="text-[10px] text-[#ffc2c4] font-mono truncate">
              p &ge; 0.70 • M2M • ₹90-120/mo
            </span>
          </div>
        </button>
      </div>
    </section>
  );
};
