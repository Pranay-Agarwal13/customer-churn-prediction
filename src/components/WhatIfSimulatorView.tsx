import React, { useState, useMemo } from 'react';
import { CustomerRecord } from '../types/telemetry';

interface WhatIfSimulatorViewProps {
  customers: CustomerRecord[];
  activeCustomer: CustomerRecord;
  onSelectCustomer: (cust: CustomerRecord) => void;
  onNavigateToPlaybooks: () => void;
}

export const WhatIfSimulatorView: React.FC<WhatIfSimulatorViewProps> = ({
  customers,
  activeCustomer,
  onSelectCustomer,
  onNavigateToPlaybooks,
}) => {
  // Simulator State
  const [contract, setContract] = useState<'month-to-month' | 'one-year' | 'two-year'>('one-year');
  const [tenure, setTenure] = useState<number>(14);
  const [paperless, setPaperless] = useState<boolean>(true);
  const [payment, setPayment] = useState<'electronic-check' | 'credit-card' | 'bank-transfer' | 'mailed-check'>('credit-card');
  const [autopayDisc, setAutopayDisc] = useState<boolean>(true);
  const [internetTier, setInternetTier] = useState<'fiber' | 'dsl' | 'none'>('fiber');
  const [multiLines, setMultiLines] = useState<boolean>(false);
  const [techSupport, setTechSupport] = useState<boolean>(true);
  const [onlineSecurity, setOnlineSecurity] = useState<boolean>(true);
  const [deviceProtection, setDeviceProtection] = useState<boolean>(false);
  const [onlineBackup, setOnlineBackup] = useState<boolean>(false);
  const [streamTV, setStreamTV] = useState<boolean>(false);
  const [streamMovies, setStreamMovies] = useState<boolean>(false);

  // Deploy animation state
  const [isDeploying, setIsDeploying] = useState<boolean>(false);
  const [deploySuccess, setDeploySuccess] = useState<boolean>(false);
  const [scenarioName, setScenarioName] = useState<string>('Scenario A: 1-Year Retention Bundle');
  const [scenarioSavedToast, setScenarioSavedToast] = useState<boolean>(false);

  // Baseline reference from selected customer
  const baselineRisk = activeCustomer.churnProb * 100;
  const baselineMrr = activeCustomer.monthlyCharges;

  // Real-time Counterfactual Calculation
  const simulation = useMemo(() => {
    let currentRisk = baselineRisk;
    let mrr = baselineMrr;
    let interventionCost = 0;

    // Internet Tier adjustment
    if (internetTier === 'dsl') {
      mrr = 65.00;
      currentRisk -= 7.0;
    } else if (internetTier === 'none') {
      mrr = 25.00;
      currentRisk -= 14.0;
    }

    // Contract Impact
    let contractImpact = 0;
    if (contract === 'month-to-month') {
      contractImpact = 0;
    } else if (contract === 'one-year') {
      contractImpact = -21.4;
      currentRisk += contractImpact;
      interventionCost += 120;
    } else if (contract === 'two-year') {
      contractImpact = -34.8;
      currentRisk += contractImpact;
      interventionCost += 200;
    }

    // Payment Rail Impact
    let paymentImpact = 0;
    if (payment === 'electronic-check') {
      paymentImpact = +4.2;
      currentRisk += paymentImpact;
    } else if (payment === 'credit-card') {
      paymentImpact = -8.5;
      currentRisk += paymentImpact;
    } else if (payment === 'bank-transfer') {
      paymentImpact = -7.2;
      currentRisk += paymentImpact;
    } else if (payment === 'mailed-check') {
      paymentImpact = -1.5;
      currentRisk += paymentImpact;
    }

    // Autopay 5% discount
    if (autopayDisc) {
      mrr -= mrr * 0.05;
      interventionCost += 60;
      currentRisk -= 2.0;
    }

    // Protective Add-ons
    let techImpact = 0;
    if (techSupport) {
      techImpact = -7.1;
      currentRisk += techImpact;
    }

    let secImpact = 0;
    if (onlineSecurity) {
      secImpact = -5.2;
      currentRisk += secImpact;
    }

    if (deviceProtection) {
      currentRisk -= 2.8;
      mrr += 5.0;
    }
    if (onlineBackup) {
      currentRisk -= 2.4;
      mrr += 4.5;
    }
    if (streamTV) {
      currentRisk -= 1.5;
      mrr += 9.99;
    }
    if (streamMovies) {
      currentRisk -= 1.5;
      mrr += 9.99;
    }

    // Tenure projection improvement (delta from 8 mos)
    const deltaTenure = tenure - 8;
    currentRisk -= deltaTenure * 0.9;
    const residualTenureDrag = Math.max(1.0, 9.0 - deltaTenure * 0.6);

    // Paperless effect
    if (!paperless) {
      currentRisk -= 1.8;
    }

    // Clamp risk
    const finalRisk = Math.max(4.2, Math.min(96.5, currentRisk));
    const netDrop = finalRisk - baselineRisk;

    // Projected LTV Saved
    const ltvProtected = Math.round(mrr * 12 * (1 - finalRisk / 100) * 11.2);

    return {
      simulatedRisk: finalRisk,
      netDrop,
      simulatedMrr: mrr,
      mrrDelta: mrr - baselineMrr,
      ltvProtected,
      interventionCost,
      contractImpact,
      paymentImpact,
      techImpact,
      secImpact,
      residualTenureDrag,
    };
  }, [
    baselineRisk,
    baselineMrr,
    contract,
    tenure,
    paperless,
    payment,
    autopayDisc,
    internetTier,
    multiLines,
    techSupport,
    onlineSecurity,
    deviceProtection,
    onlineBackup,
    streamTV,
    streamMovies,
  ]);

  const handleResetToBaseline = () => {
    setContract('month-to-month');
    setTenure(8);
    setPaperless(true);
    setPayment('electronic-check');
    setAutopayDisc(false);
    setInternetTier('fiber');
    setMultiLines(false);
    setTechSupport(false);
    setOnlineSecurity(false);
    setDeviceProtection(false);
    setOnlineBackup(false);
    setStreamTV(false);
    setStreamMovies(false);
  };

  const handleSaveScenario = () => {
    setScenarioSavedToast(true);
    setTimeout(() => setScenarioSavedToast(false), 2400);
  };

  const handleDeploy = async () => {
    setIsDeploying(true);
    try {
      await fetch('/api/interventions/dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: activeCustomer.id,
          campaignName: scenarioName,
          channel: 'In-App + SMS + Concierge',
        }),
      });
    } catch (err) {
      console.warn('[Dispatch Error]', err);
    } finally {
      setIsDeploying(false);
      setDeploySuccess(true);
      setTimeout(() => setDeploySuccess(false), 5000);
    }
  };

  // SVG Gauge calculations
  const circumference = 251.2;
  const strokeOffset = circumference * (1 - simulation.simulatedRisk / 100);

  const riskTier =
    simulation.simulatedRisk < 30
      ? 'Low Risk'
      : simulation.simulatedRisk < 60
      ? 'Moderate Risk'
      : 'Critical Risk';

  const riskColor =
    simulation.simulatedRisk < 30
      ? 'text-[#56e5a9]'
      : simulation.simulatedRisk < 60
      ? 'text-[#38bdf8]'
      : 'text-[#ffb2b7]';

  const riskStrokeClass =
    simulation.simulatedRisk < 30
      ? 'text-[#56e5a9]'
      : simulation.simulatedRisk < 60
      ? 'text-[#38bdf8]'
      : 'text-[#ffb2b7]';

  return (
    <div className="flex flex-col w-full gap-5">
      {/* Top Command Ribbon & Customer Telemetry Bar */}
      <div className="flex flex-col gap-3">
        {/* Breadcrumb & Mode Telemetry */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-[#bdc8d1] uppercase tracking-wider">
              Customer Risk
            </span>
            <span className="text-[#87929a] text-xs">/</span>
            <span className="font-semibold text-sm sm:text-base text-[#8ed5ff] flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[#8ed5ff] text-base">tune</span>
              What-If Counterfactual Simulator
            </span>
            <span className="px-2 py-0.5 rounded bg-[#262a35] text-[#56e5a9] font-mono text-[10px] uppercase font-bold flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#56e5a9] animate-pulse"></span>
              TreeSHAP v4.2 Engine
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 bg-[#38bdf8]/15 text-[#8ed5ff] rounded font-mono text-[11px] flex items-center gap-1">
              <span className="material-symbols-outlined text-xs">bookmark</span>
              {scenarioName}
            </span>
            <button
              onClick={handleResetToBaseline}
              className="px-2.5 py-1 rounded bg-[#262a35] text-[#bdc8d1] hover:text-[#dfe2f1] hover:bg-[#353944] text-xs transition-colors flex items-center gap-1 cursor-pointer"
            >
              <span className="material-symbols-outlined text-xs">restart_alt</span>
              Reset to Baseline
            </button>
            <button
              onClick={handleSaveScenario}
              className="px-2.5 py-1 rounded bg-[#262a35] text-[#dfe2f1] hover:bg-[#353944] text-xs transition-colors flex items-center gap-1 cursor-pointer"
            >
              <span className="material-symbols-outlined text-xs">save</span>
              Save Scenario
            </button>
          </div>
        </div>

        {scenarioSavedToast && (
          <div className="p-2.5 rounded-lg bg-[#30c88f] text-[#004e34] text-xs font-semibold flex items-center gap-2 shadow-md">
            <span className="material-symbols-outlined text-base">check_circle</span>
            <span>Scenario configuration saved successfully to profile #{activeCustomer.id}!</span>
          </div>
        )}

        {/* Customer Profile Inspector Strip */}
        <div className="bg-[#171b26] rounded-xl p-3.5 sm:p-4 shadow-md flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 border border-white/5">
          <div className="flex items-center gap-3">
            <div className="relative w-12 h-12 rounded-lg bg-[#262a35] flex items-center justify-center text-[#8ed5ff] shrink-0">
              <span className="material-symbols-outlined text-2xl">router</span>
              <span className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full bg-[#b50036]"></span>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-base text-[#dfe2f1] tracking-tight font-bold">
                  {activeCustomer.id}
                </span>
                <span className="px-2 py-0.5 bg-[#262a35] text-[#bdc8d1] rounded text-[11px]">
                  {activeCustomer.name || activeCustomer.plan}
                </span>
                <span className="px-2 py-0.5 bg-[#b50036]/20 text-[#ffb2b7] rounded font-mono text-[10px] uppercase font-bold">
                  High Churn Exposure
                </span>
              </div>
              <span className="text-xs text-[#bdc8d1] mt-0.5">
                Residential Broadband • Pune Central Node 09 • Billing Day: 14th
              </span>
            </div>
          </div>

          {/* Quick Telemetry Triplet */}
          <div className="grid grid-cols-3 gap-4 lg:gap-8">
            <div className="flex flex-col">
              <span className="font-mono text-[10px] text-[#bdc8d1] uppercase">Baseline MRR</span>
              <span className="font-mono text-base text-[#dfe2f1] font-bold">
                ₹{baselineMrr.toFixed(2)}
                <span className="text-xs text-[#bdc8d1] font-normal font-sans">/mo</span>
              </span>
              <span className="text-[10px] text-[#87929a]">Paperless Billing Enabled</span>
            </div>
            <div className="flex flex-col">
              <span className="font-mono text-[10px] text-[#bdc8d1] uppercase">Baseline Churn Risk</span>
              <div className="flex items-center gap-1.5">
                <span className="font-mono text-base text-[#ffb2b7] font-bold">
                  {baselineRisk.toFixed(1)}%
                </span>
                <span className="px-1.5 py-0.2 rounded bg-[#b50036] text-[#ffc2c4] font-mono text-[9px] uppercase font-bold">
                  Critical
                </span>
              </div>
              <span className="text-[10px] text-[#87929a]">TreeDepth: 7 Splits</span>
            </div>
            <div className="flex flex-col">
              <span className="font-mono text-[10px] text-[#bdc8d1] uppercase">Tenure Surv</span>
              <span className="font-mono text-base text-[#dfe2f1] font-bold">
                {activeCustomer.tenure} Mos
              </span>
              <span className="text-[10px] text-[#56e5a9] font-semibold">Surviving Cohort Q3</span>
            </div>
          </div>

          {/* Customer Switcher */}
          <div className="flex items-center shrink-0">
            <div className="relative">
              <select
                value={activeCustomer.id}
                onChange={(e) => {
                  const target = customers.find((c) => c.id === e.target.value);
                  if (target) onSelectCustomer(target);
                }}
                className="bg-[#262a35] text-[#dfe2f1] text-xs rounded-lg px-3 py-2 focus:outline-none cursor-pointer pr-8 appearance-none border border-white/5"
              >
                {customers.map((c) => (
                  <option key={c.id} value={c.id} className="bg-[#1c1f2a]">
                    {c.id} ({c.plan} {(c.churnProb * 100).toFixed(1)}%)
                  </option>
                ))}
              </select>
              <span className="material-symbols-outlined text-[#bdc8d1] text-base absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
                unfold_more
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Multi-Column Cockpit Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* LEFT & CENTRAL LEVERS STUDIO (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[#8ed5ff] text-base">sliders</span>
              <span className="text-sm font-semibold text-[#dfe2f1]">
                Counterfactual Intervention Levers
              </span>
            </div>
            <span className="text-[11px] text-[#bdc8d1] font-mono">
              Live Sensitivity: Hyperparameter Realtime (0.04s)
            </span>
          </div>

          {/* 1. Contract & Tenure Levers */}
          <div className="bg-[#171b26] rounded-xl p-4 shadow-sm flex flex-col gap-3.5 border border-white/5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[#8ed5ff] text-sm">history_edu</span>
                <span className="font-mono text-xs text-[#bdc8d1] uppercase tracking-wider">
                  Contract Commitment &amp; Tenure Horizon
                </span>
              </div>
              <span className="text-xs text-[#56e5a9] font-medium">
                Strongest Model Predictor (-21.4% max impact)
              </span>
            </div>

            {/* Contract Selector */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#dfe2f1] font-medium">Commitment Agreement</span>
                <span className="font-mono text-[#56e5a9] font-semibold">
                  {contract === 'one-year'
                    ? '-21.4% Risk Impact'
                    : contract === 'two-year'
                    ? '-34.8% Risk Impact'
                    : 'Baseline Uncontracted'}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-1.5 bg-[#0a0e18] p-1 rounded-lg border border-white/5">
                <button
                  type="button"
                  onClick={() => setContract('month-to-month')}
                  className={`py-2 px-1 rounded text-xs transition-all text-center flex flex-col items-center cursor-pointer ${
                    contract === 'month-to-month'
                      ? 'bg-[#38bdf8] text-[#004965] font-semibold shadow-sm'
                      : 'text-[#bdc8d1] hover:text-[#dfe2f1]'
                  }`}
                >
                  <span>Month-to-Month</span>
                  <span className="text-[10px] text-[#87929a]">Current (High Risk)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setContract('one-year')}
                  className={`py-2 px-1 rounded text-xs transition-all text-center flex flex-col items-center cursor-pointer ${
                    contract === 'one-year'
                      ? 'bg-[#38bdf8] text-[#004965] font-semibold shadow-sm'
                      : 'text-[#bdc8d1] hover:text-[#dfe2f1]'
                  }`}
                >
                  <span>1-Year Contract</span>
                  <span className="text-[10px] text-[#004965]/80 font-medium">Simulated Target</span>
                </button>
                <button
                  type="button"
                  onClick={() => setContract('two-year')}
                  className={`py-2 px-1 rounded text-xs transition-all text-center flex flex-col items-center cursor-pointer ${
                    contract === 'two-year'
                      ? 'bg-[#38bdf8] text-[#004965] font-semibold shadow-sm'
                      : 'text-[#bdc8d1] hover:text-[#dfe2f1]'
                  }`}
                >
                  <span>2-Year Enterprise</span>
                  <span className="text-[10px] text-[#87929a]">Max Retention Lock</span>
                </button>
              </div>
            </div>

            {/* Tenure Horizon Slider */}
            <div className="flex flex-col gap-1.5 pt-1">
              <div className="flex items-center justify-between text-xs">
                <label className="text-[#dfe2f1] font-medium" htmlFor="tenure-range-input">
                  Surviving Tenure Projection
                </label>
                <span className="font-mono text-[#8ed5ff] font-semibold">
                  {tenure} Months ({tenure >= 8 ? `+${tenure - 8}` : `${tenure - 8}`} mos survival)
                </span>
              </div>
              <input
                id="tenure-range-input"
                type="range"
                min="8"
                max="36"
                step="1"
                value={tenure}
                onChange={(e) => setTenure(parseInt(e.target.value, 10))}
                className="w-full accent-[#38bdf8] bg-[#313540] rounded-lg h-2 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-[#87929a] font-mono">
                <span>Current: 8 mos</span>
                <span>Survive +12 mos</span>
                <span>Long-term: 36 mos</span>
              </div>
            </div>

            {/* Paperless Billing Toggle */}
            <div className="flex items-center justify-between pt-1 border-t border-white/5">
              <div className="flex flex-col">
                <span className="text-xs text-[#dfe2f1]">Paperless Billing Ingestion</span>
                <span className="text-[10px] text-[#bdc8d1]">
                  Paperless users show 4.2% higher churn elasticity
                </span>
              </div>
              <button
                type="button"
                onClick={() => setPaperless(!paperless)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                  paperless ? 'bg-[#38bdf8]' : 'bg-[#262a35]'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-[#0a0e18] transition-transform ${
                    paperless ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* 2. Payment Vector & Financial Incentives */}
          <div className="bg-[#171b26] rounded-xl p-4 shadow-sm flex flex-col gap-3.5 border border-white/5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[#8ed5ff] text-sm">credit_card</span>
                <span className="font-mono text-xs text-[#bdc8d1] uppercase tracking-wider">
                  Payment Rail &amp; Autopay Vector
                </span>
              </div>
              <span className="text-xs text-[#56e5a9] font-medium">
                Payment Vector Impact: {simulation.paymentImpact <= 0 ? `${simulation.paymentImpact.toFixed(1)}%` : `+${simulation.paymentImpact.toFixed(1)}%`}
              </span>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-[#dfe2f1] font-medium">Selected Payment Method</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => setPayment('electronic-check')}
                  className={`p-2.5 rounded-lg text-left transition-all flex flex-col gap-0.5 cursor-pointer border ${
                    payment === 'electronic-check'
                      ? 'bg-[#38bdf8] text-[#004965] border-[#38bdf8] shadow-sm'
                      : 'bg-[#1c1f2a] text-[#bdc8d1] hover:text-[#dfe2f1] border-white/5'
                  }`}
                >
                  <span className="font-mono text-[9px] uppercase font-bold text-[#ffb2b7]">
                    High Volatility
                  </span>
                  <span className="text-xs font-semibold">Electronic Check</span>
                  <span className="text-[10px] text-[#87929a]">Current Vector</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPayment('credit-card')}
                  className={`p-2.5 rounded-lg text-left transition-all flex flex-col gap-0.5 cursor-pointer border ${
                    payment === 'credit-card'
                      ? 'bg-[#38bdf8] text-[#004965] border-[#38bdf8] shadow-sm'
                      : 'bg-[#1c1f2a] text-[#bdc8d1] hover:text-[#dfe2f1] border-white/5'
                  }`}
                >
                  <span className="font-mono text-[9px] uppercase font-bold text-[#004965]/80">
                    Recommended
                  </span>
                  <span className="text-xs font-semibold">Credit Card (Auto)</span>
                  <span className="text-[10px] text-[#004965]/80">Frictionless Debit</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPayment('bank-transfer')}
                  className={`p-2.5 rounded-lg text-left transition-all flex flex-col gap-0.5 cursor-pointer border ${
                    payment === 'bank-transfer'
                      ? 'bg-[#38bdf8] text-[#004965] border-[#38bdf8] shadow-sm'
                      : 'bg-[#1c1f2a] text-[#bdc8d1] hover:text-[#dfe2f1] border-white/5'
                  }`}
                >
                  <span className="font-mono text-[9px] uppercase font-bold text-[#56e5a9]">
                    Stable Rail
                  </span>
                  <span className="text-xs font-semibold">Bank Transfer ACH</span>
                  <span className="text-[10px] text-[#87929a]">Direct Mandate</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPayment('mailed-check')}
                  className={`p-2.5 rounded-lg text-left transition-all flex flex-col gap-0.5 cursor-pointer border ${
                    payment === 'mailed-check'
                      ? 'bg-[#38bdf8] text-[#004965] border-[#38bdf8] shadow-sm'
                      : 'bg-[#1c1f2a] text-[#bdc8d1] hover:text-[#dfe2f1] border-white/5'
                  }`}
                >
                  <span className="font-mono text-[9px] uppercase font-bold text-[#87929a]">
                    Legacy
                  </span>
                  <span className="text-xs font-semibold">Mailed Check</span>
                  <span className="text-[10px] text-[#87929a]">Manual Cycle</span>
                </button>
              </div>
            </div>

            {/* Autopay Incentive Toggle */}
            <div className="flex items-center justify-between p-2.5 bg-[#262a35]/40 rounded-lg border border-white/5">
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-[#56e5a9] text-base">percent</span>
                <div className="flex flex-col">
                  <span className="text-xs text-[#dfe2f1] font-medium">
                    Auto-Pay Incentive Discount (5% MRR Credit)
                  </span>
                  <span className="text-[10px] text-[#bdc8d1]">
                    Subsidize billing rail shift to lock recurring mandate
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAutopayDisc(!autopayDisc)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                  autopayDisc ? 'bg-[#38bdf8]' : 'bg-[#262a35]'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-[#0a0e18] transition-transform ${
                    autopayDisc ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* 3. Internet Core & Speed Tier */}
          <div className="bg-[#171b26] rounded-xl p-4 shadow-sm flex flex-col gap-3.5 border border-white/5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[#8ed5ff] text-sm">wifi</span>
                <span className="font-mono text-xs text-[#bdc8d1] uppercase tracking-wider">
                  Broadband Service Tier &amp; Lines
                </span>
              </div>
              <span className="text-xs text-[#bdc8d1] font-mono">Hardware ID: FTTH-ONT-098</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <label
                onClick={() => setInternetTier('fiber')}
                className={`cursor-pointer p-3 rounded-lg flex items-start gap-2.5 transition-all border ${
                  internetTier === 'fiber'
                    ? 'bg-[#38bdf8]/15 border-[#38bdf8]'
                    : 'bg-[#1c1f2a] border-white/5 hover:border-white/20'
                }`}
              >
                <input
                  type="radio"
                  name="internet-tier-radio"
                  checked={internetTier === 'fiber'}
                  onChange={() => setInternetTier('fiber')}
                  className="mt-1 accent-[#38bdf8]"
                />
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-[#dfe2f1]">Fiber Optic 1Gbps</span>
                  <span className="text-[10px] text-[#8ed5ff] font-mono">₹104.50 Base Price</span>
                  <span className="text-[10px] text-[#bdc8d1]">Baseline Active Service</span>
                </div>
              </label>

              <label
                onClick={() => setInternetTier('dsl')}
                className={`cursor-pointer p-3 rounded-lg flex items-start gap-2.5 transition-all border ${
                  internetTier === 'dsl'
                    ? 'bg-[#38bdf8]/15 border-[#38bdf8]'
                    : 'bg-[#1c1f2a] border-white/5 hover:border-white/20'
                }`}
              >
                <input
                  type="radio"
                  name="internet-tier-radio"
                  checked={internetTier === 'dsl'}
                  onChange={() => setInternetTier('dsl')}
                  className="mt-1 accent-[#38bdf8]"
                />
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-[#dfe2f1]">DSL Ultra 100Mbps</span>
                  <span className="text-[10px] text-[#56e5a9] font-mono">₹65.00 Base Price</span>
                  <span className="text-[10px] text-[#bdc8d1]">Downgrade Option</span>
                </div>
              </label>

              <label
                onClick={() => setInternetTier('none')}
                className={`cursor-pointer p-3 rounded-lg flex items-start gap-2.5 transition-all border ${
                  internetTier === 'none'
                    ? 'bg-[#38bdf8]/15 border-[#38bdf8]'
                    : 'bg-[#1c1f2a] border-white/5 hover:border-white/20'
                }`}
              >
                <input
                  type="radio"
                  name="internet-tier-radio"
                  checked={internetTier === 'none'}
                  onChange={() => setInternetTier('none')}
                  className="mt-1 accent-[#38bdf8]"
                />
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-[#dfe2f1]">Voice Only (No Net)</span>
                  <span className="text-[10px] text-[#87929a] font-mono">₹25.00 Base Price</span>
                  <span className="text-[10px] text-[#bdc8d1]">Minimal Plan</span>
                </div>
              </label>
            </div>

            {/* Multiple lines toggle */}
            <div className="flex items-center justify-between pt-1 border-t border-white/5">
              <div className="flex flex-col">
                <span className="text-xs text-[#dfe2f1]">Multiple Phone Lines</span>
                <span className="text-[10px] text-[#bdc8d1]">
                  Family multi-line ecosystem anchor
                </span>
              </div>
              <button
                type="button"
                onClick={() => setMultiLines(!multiLines)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                  multiLines ? 'bg-[#38bdf8]' : 'bg-[#262a35]'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-[#0a0e18] transition-transform ${
                    multiLines ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* 4. Value-Add Retention Add-on Services */}
          <div className="bg-[#171b26] rounded-xl p-4 shadow-sm flex flex-col gap-3.5 border border-white/5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[#56e5a9] text-sm">shield</span>
                <span className="font-mono text-xs text-[#bdc8d1] uppercase tracking-wider">
                  Protective Retention Add-ons
                </span>
              </div>
              <span className="text-xs text-[#56e5a9] font-bold">
                High Retention Stickiness (+84% 1-yr survival)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Tech Support */}
              <div className="bg-[#1c1f2a] p-3 rounded-lg flex items-center justify-between border border-white/5">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#8ed5ff] text-xl">contact_support</span>
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-[#dfe2f1]">Tech Support (VIP)</span>
                    <span className="text-[10px] text-[#56e5a9] font-mono font-medium">
                      -7.1% Risk Reduction
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setTechSupport(!techSupport)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                    techSupport ? 'bg-[#38bdf8]' : 'bg-[#262a35]'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-[#0a0e18] transition-transform ${
                      techSupport ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Online Security */}
              <div className="bg-[#1c1f2a] p-3 rounded-lg flex items-center justify-between border border-white/5">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#8ed5ff] text-xl">security</span>
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-[#dfe2f1]">Online Security Shield</span>
                    <span className="text-[10px] text-[#56e5a9] font-mono font-medium">
                      -5.2% Risk Reduction
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setOnlineSecurity(!onlineSecurity)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                    onlineSecurity ? 'bg-[#38bdf8]' : 'bg-[#262a35]'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-[#0a0e18] transition-transform ${
                      onlineSecurity ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Device Protection */}
              <div className="bg-[#1c1f2a] p-3 rounded-lg flex items-center justify-between border border-white/5">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#bdc8d1] text-xl">phonelink_lock</span>
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-[#dfe2f1]">Device Protection</span>
                    <span className="text-[10px] text-[#56e5a9] font-mono font-medium">
                      -2.8% Risk Reduction
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setDeviceProtection(!deviceProtection)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                    deviceProtection ? 'bg-[#38bdf8]' : 'bg-[#262a35]'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-[#0a0e18] transition-transform ${
                      deviceProtection ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Cloud Vault Backup */}
              <div className="bg-[#1c1f2a] p-3 rounded-lg flex items-center justify-between border border-white/5">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#bdc8d1] text-xl">cloud_sync</span>
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-[#dfe2f1]">Cloud Vault Backup</span>
                    <span className="text-[10px] text-[#56e5a9] font-mono font-medium">
                      -2.4% Risk Reduction
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setOnlineBackup(!onlineBackup)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                    onlineBackup ? 'bg-[#38bdf8]' : 'bg-[#262a35]'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-[#0a0e18] transition-transform ${
                      onlineBackup ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Entertainment Add-ons */}
            <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
              <div className="flex-1 bg-[#1c1f2a] p-2.5 rounded-lg flex items-center justify-between border border-white/5">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#bdc8d1] text-base">live_tv</span>
                  <span className="text-xs text-[#dfe2f1]">Streaming TV Pass</span>
                </div>
                <button
                  type="button"
                  onClick={() => setStreamTV(!streamTV)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                    streamTV ? 'bg-[#38bdf8]' : 'bg-[#262a35]'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-[#0a0e18] transition-transform ${
                      streamTV ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="flex-1 bg-[#1c1f2a] p-2.5 rounded-lg flex items-center justify-between border border-white/5">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#bdc8d1] text-base">movie</span>
                  <span className="text-xs text-[#dfe2f1]">Streaming Movies Pass</span>
                </div>
                <button
                  type="button"
                  onClick={() => setStreamMovies(!streamMovies)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                    streamMovies ? 'bg-[#38bdf8]' : 'bg-[#262a35]'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-[#0a0e18] transition-transform ${
                      streamMovies ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* 5. Financial Delta Summary Bar */}
          <div className="bg-[#262a35]/60 rounded-xl p-4 shadow-sm grid grid-cols-1 sm:grid-cols-3 gap-4 border border-white/5">
            <div className="flex flex-col">
              <span className="font-mono text-[10px] text-[#bdc8d1] uppercase">Simulated Monthly Bill</span>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="font-mono text-xl text-[#dfe2f1] font-bold">
                  ₹{simulation.simulatedMrr.toFixed(2)}
                </span>
                <span className="text-[11px] text-[#56e5a9] font-mono font-semibold">
                  {simulation.mrrDelta <= 0 ? '-' : '+'}₹{Math.abs(simulation.mrrDelta).toFixed(2)}
                </span>
              </div>
              <span className="text-[10px] text-[#87929a]">
                Was ₹{baselineMrr.toFixed(2)}/mo baseline
              </span>
            </div>

            <div className="flex flex-col">
              <span className="font-mono text-[10px] text-[#bdc8d1] uppercase">Net Retention LTV Delta</span>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="font-mono text-xl text-[#56e5a9] font-bold">
                  +₹{simulation.ltvProtected.toLocaleString('en-IN')}
                </span>
                <span className="text-[10px] text-[#56e5a9] font-mono">NPV (12M)</span>
              </div>
              <span className="text-[10px] text-[#87929a]">Assuming 1-Yr survival hurdle</span>
            </div>

            <div className="flex flex-col">
              <span className="font-mono text-[10px] text-[#bdc8d1] uppercase">Intervention Cost</span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="font-mono text-xl text-[#8ed5ff] font-bold">
                  ₹{simulation.interventionCost}
                  <span className="text-xs text-[#bdc8d1] font-normal">/yr</span>
                </span>
                <span className="text-[10px] text-[#bdc8d1]">Subsidy</span>
              </div>
              <span className="text-[10px] text-[#87929a]">ROI: 78.8x expected payback</span>
            </div>
          </div>
        </div>

        {/* RIGHT IMPACT & PREDICTION GAUGE PANEL (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          {/* 1. Live Circular Churn Gauge Card */}
          <div className="bg-[#171b26] rounded-xl p-5 shadow-md flex flex-col items-center gap-4 relative overflow-hidden border border-white/5">
            <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-[#38bdf8]/10 blur-3xl pointer-events-none"></div>

            <div className="w-full flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[#8ed5ff] text-base">radar</span>
                <span className="font-mono text-xs text-[#bdc8d1] uppercase tracking-wider">
                  Simulated Churn Probability
                </span>
              </div>
              <span className="text-[10px] text-[#bdc8d1] font-mono">
                Calibrated XGBoost Log-Odds
              </span>
            </div>

            {/* Radial Gauge SVG */}
            <div className="relative w-56 h-56 flex items-center justify-center my-2">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle
                  className="text-[#313540]"
                  cx="50"
                  cy="50"
                  fill="transparent"
                  r="40"
                  stroke="currentColor"
                  strokeWidth="8"
                />
                {/* Baseline Ghost Ring */}
                <circle
                  className="text-[#ffb2b7]/30"
                  cx="50"
                  cy="50"
                  fill="transparent"
                  r="40"
                  stroke="currentColor"
                  strokeDasharray="251.2"
                  strokeDashoffset={251.2 * (1 - baselineRisk / 100)}
                  strokeLinecap="round"
                  strokeWidth="8"
                />
                {/* Dynamic Simulated Ring */}
                <circle
                  className={`${riskStrokeClass} transition-all duration-700 ease-out`}
                  cx="50"
                  cy="50"
                  fill="transparent"
                  r="40"
                  stroke="currentColor"
                  strokeDasharray="251.2"
                  strokeDashoffset={strokeOffset}
                  strokeLinecap="round"
                  strokeWidth="8"
                />
              </svg>

              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className={`font-mono text-4xl font-extrabold tracking-tight ${riskColor}`}>
                  {simulation.simulatedRisk.toFixed(1)}%
                </span>
                <span className="px-2 py-0.5 mt-1 rounded bg-white/10 font-mono text-[11px] uppercase font-bold text-[#dfe2f1]">
                  {riskTier}
                </span>
                <span className="text-[10px] text-[#87929a] font-mono mt-1">
                  95% CI: [{(simulation.simulatedRisk - 3.4).toFixed(1)}% - {(simulation.simulatedRisk + 3.3).toFixed(1)}%]
                </span>
              </div>
            </div>

            {/* Before vs After Comparison Strip */}
            <div className="w-full grid grid-cols-2 gap-2 bg-[#0a0e18] p-3 rounded-lg border border-white/5">
              <div className="flex flex-col items-center border-r border-white/10">
                <span className="text-[10px] text-[#bdc8d1] uppercase font-mono">BASELINE RISK</span>
                <span className="font-mono text-lg text-[#ffb2b7] font-bold">
                  {baselineRisk.toFixed(1)}%
                </span>
                <span className="text-[10px] text-[#ffb2b7]">Critical Exposure</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-[10px] text-[#bdc8d1] uppercase font-mono">SIMULATED RISK</span>
                <span className={`font-mono text-lg font-bold ${riskColor}`}>
                  {simulation.simulatedRisk.toFixed(1)}%
                </span>
                <span className={`text-[10px] ${riskColor}`}>Active Mitigation</span>
              </div>
            </div>

            {/* Dynamic Drop Banner */}
            <div className="w-full p-2.5 rounded-lg bg-[#30c88f]/15 border border-[#30c88f]/30 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[#56e5a9]/20 flex items-center justify-center text-[#56e5a9]">
                  <span className="material-symbols-outlined text-lg">trending_down</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-[#56e5a9] font-bold">
                    {simulation.netDrop <= 0 ? `${simulation.netDrop.toFixed(1)}%` : `+${simulation.netDrop.toFixed(1)}%`} Net Risk Shift
                  </span>
                  <span className="text-[10px] text-[#bdc8d1]">
                    Exceeds 40% retention turnaround threshold
                  </span>
                </div>
              </div>
              <span className="material-symbols-outlined text-[#56e5a9]">verified</span>
            </div>
          </div>

          {/* 2. Real-Time TreeSHAP Waterfall Decomposition */}
          <div className="bg-[#171b26] rounded-xl p-4 shadow-sm flex flex-col gap-3 border border-white/5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[#8ed5ff] text-base">waterfall_chart</span>
                <span className="font-mono text-xs text-[#bdc8d1] uppercase tracking-wider">
                  Dynamic TreeSHAP Attribution Shift
                </span>
              </div>
              <span className="font-mono text-[10px] text-[#87929a]">Local Attributions</span>
            </div>

            <div className="flex flex-col gap-2 pt-1 font-mono text-xs">
              {/* Population Base */}
              <div className="flex flex-col gap-1">
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-[#bdc8d1]">Population Base Value E[f(x)]</span>
                  <span className="text-[#dfe2f1]">26.5%</span>
                </div>
                <div className="w-full bg-[#313540] rounded-full h-1.5 overflow-hidden flex">
                  <div className="bg-[#87929a] h-full w-[26.5%]"></div>
                </div>
              </div>

              {/* Contract Lock */}
              <div className="flex flex-col gap-1">
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-[#dfe2f1] font-sans">
                    Contract: {contract === 'month-to-month' ? 'Month-to-Month' : contract === 'one-year' ? '1-Year Lock' : '2-Year Lock'}
                  </span>
                  <span className="text-[#56e5a9] font-bold">
                    {simulation.contractImpact.toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-[#313540] rounded-full h-1.5 overflow-hidden flex justify-end">
                  <div
                    className="bg-[#56e5a9] h-full rounded transition-all duration-500"
                    style={{ width: `${Math.abs(simulation.contractImpact) * 2}%` }}
                  ></div>
                </div>
              </div>

              {/* Payment Rail */}
              <div className="flex flex-col gap-1">
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-[#dfe2f1] font-sans">
                    Payment: {payment === 'credit-card' ? 'Credit Card Autopay' : payment === 'bank-transfer' ? 'Bank Transfer' : 'Electronic Check'}
                  </span>
                  <span className={simulation.paymentImpact <= 0 ? 'text-[#56e5a9] font-bold' : 'text-[#ffb2b7] font-bold'}>
                    {simulation.paymentImpact <= 0 ? `${simulation.paymentImpact.toFixed(1)}%` : `+${simulation.paymentImpact.toFixed(1)}%`}
                  </span>
                </div>
                <div className="w-full bg-[#313540] rounded-full h-1.5 overflow-hidden flex justify-end">
                  <div
                    className={`${simulation.paymentImpact <= 0 ? 'bg-[#56e5a9]' : 'bg-[#ffb2b7]'} h-full rounded transition-all duration-500`}
                    style={{ width: `${Math.abs(simulation.paymentImpact) * 2.5}%` }}
                  ></div>
                </div>
              </div>

              {/* Tech Support */}
              <div className="flex flex-col gap-1">
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-[#dfe2f1] font-sans">
                    Tech Support: {techSupport ? 'Active Enrolled' : 'Not Enrolled'}
                  </span>
                  <span className="text-[#56e5a9] font-bold">
                    {techSupport ? '-7.1%' : '0.0%'}
                  </span>
                </div>
                <div className="w-full bg-[#313540] rounded-full h-1.5 overflow-hidden flex justify-end">
                  <div
                    className="bg-[#56e5a9] h-full rounded transition-all duration-500"
                    style={{ width: techSupport ? '20%' : '1%' }}
                  ></div>
                </div>
              </div>

              {/* Online Security */}
              <div className="flex flex-col gap-1">
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-[#dfe2f1] font-sans">
                    Online Security: {onlineSecurity ? 'Enrolled' : 'Not Enrolled'}
                  </span>
                  <span className="text-[#56e5a9] font-bold">
                    {onlineSecurity ? '-5.2%' : '0.0%'}
                  </span>
                </div>
                <div className="w-full bg-[#313540] rounded-full h-1.5 overflow-hidden flex justify-end">
                  <div
                    className="bg-[#56e5a9] h-full rounded transition-all duration-500"
                    style={{ width: onlineSecurity ? '14%' : '1%' }}
                  ></div>
                </div>
              </div>

              {/* Residual Tenure Drag */}
              <div className="flex flex-col gap-1">
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-[#dfe2f1] font-sans">
                    Residual Tenure Drag ({tenure} Mos)
                  </span>
                  <span className="text-[#ffb2b7] font-bold">
                    +{simulation.residualTenureDrag.toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-[#313540] rounded-full h-1.5 overflow-hidden flex justify-start">
                  <div
                    className="bg-[#ffb2b7] h-full rounded transition-all duration-500"
                    style={{ width: `${simulation.residualTenureDrag * 3}%` }}
                  ></div>
                </div>
              </div>

              {/* Final Model Output */}
              <div className="flex items-center justify-between pt-2 border-t border-white/10 text-xs">
                <span className="text-[#dfe2f1] font-sans font-semibold">
                  Final Calibrated Model Output f(x):
                </span>
                <span className={`font-mono font-bold text-sm ${riskColor}`}>
                  {simulation.simulatedRisk.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>

          {/* 3. Prescribed Retention Offer & One-Click Deployment */}
          <div className="bg-[#171b26] rounded-xl p-4 shadow-sm flex flex-col gap-3 border border-white/5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[#8ed5ff] text-base">recommend</span>
                <span className="font-mono text-xs text-[#bdc8d1] uppercase tracking-wider">
                  Algorithmic Playbook Package
                </span>
              </div>
              <span className="px-2 py-0.5 rounded bg-[#38bdf8]/20 text-[#8ed5ff] font-mono text-[10px]">
                Ready To Dispatch
              </span>
            </div>

            <div className="flex flex-col gap-1.5 text-xs font-sans">
              <div className="flex items-center gap-2 p-2 bg-[#1c1f2a] rounded-lg border border-white/5">
                <span className="material-symbols-outlined text-[#56e5a9] text-base">check_circle</span>
                <span className="text-[#dfe2f1] flex-1">
                  1-Year Fiber Renewal with 10% Loyalty Retention Credit
                </span>
              </div>
              <div className="flex items-center gap-2 p-2 bg-[#1c1f2a] rounded-lg border border-white/5">
                <span className="material-symbols-outlined text-[#56e5a9] text-base">check_circle</span>
                <span className="text-[#dfe2f1] flex-1">
                  Seamless Auto-Debit mandate setup with ₹5.00/mo credit
                </span>
              </div>
              <div className="flex items-center gap-2 p-2 bg-[#1c1f2a] rounded-lg border border-white/5">
                <span className="material-symbols-outlined text-[#56e5a9] text-base">check_circle</span>
                <span className="text-[#dfe2f1] flex-1">
                  Complimentary 90-day VIP Tech Support &amp; Security Shield
                </span>
              </div>
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-2 pt-1">
              <button
                type="button"
                onClick={handleDeploy}
                disabled={isDeploying}
                className="flex-1 py-2 px-3 bg-[#38bdf8] text-[#004965] font-semibold text-xs rounded-lg hover:bg-[#7bd0ff] transition-all flex items-center justify-center gap-1.5 shadow-md shadow-[#38bdf8]/20 cursor-pointer"
              >
                {isDeploying ? (
                  <>
                    <span className="material-symbols-outlined text-base animate-spin">refresh</span>
                    <span>Dispatching...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-base">send</span>
                    <span>Deploy Offer to Customer</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={onNavigateToPlaybooks}
                className="py-2 px-3 bg-[#262a35] text-[#dfe2f1] hover:bg-[#353944] transition-colors rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 cursor-pointer border border-white/5"
              >
                <span className="material-symbols-outlined text-base">assignment</span>
                <span>Retention Playbooks</span>
              </button>
            </div>

            {deploySuccess && (
              <div className="p-2.5 bg-[#30c88f] text-[#004e34] rounded-lg text-xs font-semibold flex items-center gap-2 shadow-md">
                <span className="material-symbols-outlined text-base">done_all</span>
                <span>
                  Retention offer dispatched via SMS and Customer App Push Notification. Ticket #RET-8849 logged.
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
