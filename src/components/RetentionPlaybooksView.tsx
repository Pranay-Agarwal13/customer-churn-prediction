import React, { useState } from 'react';
import { PLAYBOOK_CAMPAIGNS } from '../data/mockTelcoData';
import { PlaybookCampaign } from '../types/telemetry';

interface RetentionPlaybooksViewProps {
  initialCategory?: string;
  onOpenSimulationModal: (title: string, cohort: number, rev: string, drop: string) => void;
}

export const RetentionPlaybooksView: React.FC<RetentionPlaybooksViewProps> = ({
  initialCategory = 'all',
  onOpenSimulationModal,
}) => {
  const [selectedFilter, setSelectedFilter] = useState<string>(initialCategory);
  const [campaigns, setCampaigns] = useState<PlaybookCampaign[]>(PLAYBOOK_CAMPAIGNS);
  const [deployedNotice, setDeployedNotice] = useState<string | null>(null);

  const filterTabs = [
    { id: 'all', label: 'All Playbooks (4)' },
    { id: 'contract', label: 'Contract Shifts' },
    { id: 'payment', label: 'Payment Optimization' },
    { id: 'onboarding', label: 'Onboarding & Tenure' },
    { id: 'value', label: 'Value Add-ons' },
  ];

  const filteredCampaigns = campaigns.filter((camp) => {
    if (selectedFilter === 'all') return true;
    return camp.category === selectedFilter;
  });

  const handleToggleDeploy = async (campaignId: string, title: string) => {
    const target = campaigns.find((c) => c.id === campaignId);
    const newStatus = target ? !target.isDeployed : true;

    setCampaigns((prev) =>
      prev.map((c) => (c.id === campaignId ? { ...c, isDeployed: newStatus } : c))
    );

    try {
      const res = await fetch('/api/interventions/dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: `COHORT-${target?.targetCohort || 2418}`,
          campaignName: title,
          channel: 'Omnichannel Automation',
        }),
      });
      const data = await res.json();
      setDeployedNotice(
        `Campaign '${title}' ${newStatus ? 'Activated' : 'Paused'}! Ticket #${data.ticketId} logged.`
      );
    } catch {
      setDeployedNotice(`Campaign '${title}' status updated! Automated pipeline syncing...`);
    }

    setTimeout(() => setDeployedNotice(null), 3800);
  };

  return (
    <div className="flex flex-col w-full gap-5">
      {/* Section 1: Context Header & Control Bar */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1.5 text-[#bdc8d1]">
            <span className="font-mono text-[10px] text-[#8ed5ff] tracking-widest uppercase">
              CUSTOMER RETENTION
            </span>
            <span className="text-[#3e484f] font-mono text-[10px]">/</span>
            <span className="font-mono text-[10px] text-[#bdc8d1] uppercase tracking-wider">
              Automated Intervention Campaigns
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl text-[#dfe2f1] tracking-tight font-semibold flex items-center gap-2.5">
            Retention Playbooks
            <span className="px-2.5 py-0.5 rounded-full bg-[#30c88f]/15 text-[#56e5a9] font-mono text-[10px] uppercase tracking-wider flex items-center gap-1.5 font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-[#56e5a9] animate-pulse"></span>
              Engine Live
            </span>
          </h1>

          <p className="text-xs sm:text-sm text-[#bdc8d1] max-w-2xl">
            Algorithmic intervention workflows keyed to XGBoost risk triggers. Prescribe automated
            loyalty upgrades, payment migration incentives, and concierge touches.
          </p>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2.5 self-start md:self-auto flex-wrap">
          <button
            onClick={() =>
              onOpenSimulationModal('All 6 Campaigns Aggregated', 4892, '₹46.8L / yr', '-38.2% Avg')
            }
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#262a35] text-[#dfe2f1] hover:bg-[#353944] text-xs font-semibold shadow-sm transition-all cursor-pointer border border-white/5"
          >
            <span className="material-symbols-outlined text-base text-[#8ed5ff]">play_circle</span>
            <span>Run Campaign Simulation</span>
          </button>

          <button
            onClick={() =>
              onOpenSimulationModal('Custom Playbook Generator', 1250, '₹12.4L / yr', '-24.0% Yield')
            }
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#38bdf8] text-[#004965] text-xs font-semibold hover:bg-[#7bd0ff] transition-all shadow-md shadow-[#38bdf8]/20 cursor-pointer"
          >
            <span className="material-symbols-outlined text-base">add</span>
            <span>Create New Playbook</span>
          </button>
        </div>
      </div>

      {deployedNotice && (
        <div className="p-2.5 rounded-lg bg-[#30c88f] text-[#004e34] text-xs font-semibold flex items-center gap-2 shadow-md">
          <span className="material-symbols-outlined text-base">verified</span>
          <span>{deployedNotice}</span>
        </div>
      )}

      {/* Section 2: Executive Telemetry Metrics Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Metric 1 */}
        <div className="bg-[#171b26]/90 backdrop-blur-xl p-4 rounded-xl flex flex-col justify-between shadow-sm relative overflow-hidden group border border-white/5">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-[#38bdf8]/5 rounded-full blur-2xl group-hover:bg-[#38bdf8]/10 transition-all pointer-events-none"></div>
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] text-[#bdc8d1] uppercase tracking-wider">
              Active Campaigns
            </span>
            <span className="p-1 rounded-lg bg-[#262a35] text-[#8ed5ff] flex items-center justify-center">
              <span className="material-symbols-outlined text-base">auto_mode</span>
            </span>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-1.5">
              <span className="font-mono text-2xl text-[#dfe2f1] font-bold">6</span>
              <span className="font-mono text-xs text-[#56e5a9] font-medium">Running</span>
            </div>
            <div className="flex items-center justify-between mt-1 text-[#bdc8d1] text-[11px]">
              <span>2 Drafts under review</span>
              <span className="font-mono text-[#8ed5ff]">8 Total</span>
            </div>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-[#171b26]/90 backdrop-blur-xl p-4 rounded-xl flex flex-col justify-between shadow-sm relative overflow-hidden group border border-white/5">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-[#56e5a9]/5 rounded-full blur-2xl group-hover:bg-[#56e5a9]/10 transition-all pointer-events-none"></div>
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] text-[#bdc8d1] uppercase tracking-wider">
              Targeted Reach
            </span>
            <span className="p-1 rounded-lg bg-[#262a35] text-[#56e5a9] flex items-center justify-center">
              <span className="material-symbols-outlined text-base">group</span>
            </span>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-1.5">
              <span className="font-mono text-2xl text-[#dfe2f1] font-bold">4,892</span>
              <span className="font-mono text-xs text-[#bdc8d1]">Subs</span>
            </div>
            <div className="flex items-center justify-between mt-1 text-[#bdc8d1] text-[11px]">
              <div className="flex items-center gap-1">
                <span>Cohort coverage</span>
                <span className="font-mono text-[#56e5a9] font-bold">69.4%</span>
              </div>
              <span>of total base</span>
            </div>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-[#171b26]/90 backdrop-blur-xl p-4 rounded-xl flex flex-col justify-between shadow-sm relative overflow-hidden group border border-white/5">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-[#7bd0ff]/5 rounded-full blur-2xl group-hover:bg-[#7bd0ff]/10 transition-all pointer-events-none"></div>
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] text-[#bdc8d1] uppercase tracking-wider">
              Projected ARR Saved
            </span>
            <span className="p-1 rounded-lg bg-[#262a35] text-[#7bd0ff] flex items-center justify-center">
              <span className="material-symbols-outlined text-base">savings</span>
            </span>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-1.5">
              <span className="font-mono text-2xl text-[#dfe2f1] font-bold">₹46.8L</span>
              <span className="text-[10px] text-[#bdc8d1]">/ yr</span>
            </div>
            <div className="flex items-center justify-between mt-1 text-[#bdc8d1] text-[11px]">
              <span>Incentive cost: ₹8.1L</span>
              <span className="font-mono text-[#56e5a9] font-bold">5.8x ROI</span>
            </div>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-[#171b26]/90 backdrop-blur-xl p-4 rounded-xl flex flex-col justify-between shadow-sm relative overflow-hidden group border border-white/5">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-[#b50036]/5 rounded-full blur-2xl group-hover:bg-[#b50036]/10 transition-all pointer-events-none"></div>
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] text-[#bdc8d1] uppercase tracking-wider">
              Avg Churn Mitigation
            </span>
            <span className="p-1 rounded-lg bg-[#262a35] text-[#56e5a9] flex items-center justify-center">
              <span className="material-symbols-outlined text-base">trending_down</span>
            </span>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-1.5">
              <span className="font-mono text-2xl text-[#56e5a9] font-bold">-38.2%</span>
              <span className="font-mono text-xs text-[#bdc8d1]">Risk Drop</span>
            </div>
            <div className="flex items-center justify-between mt-1 text-[#bdc8d1] text-[11px]">
              <span>Control delta</span>
              <span className="font-mono text-[#dfe2f1]">p &lt; 0.001</span>
            </div>
          </div>
        </div>
      </div>

      {/* Section 3: Segment Filters & View Selector */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 bg-[#171b26]/60 backdrop-blur-md p-2 rounded-xl border border-white/5 shadow-sm">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {filterTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedFilter === tab.id
                  ? 'bg-[#38bdf8] text-[#004965] shadow-sm'
                  : 'text-[#bdc8d1] hover:text-[#dfe2f1] hover:bg-[#262a35]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <span className="font-mono text-[10px] text-[#bdc8d1] uppercase">Sort By:</span>
          <select className="bg-[#262a35] text-[#dfe2f1] text-xs px-2.5 py-1 rounded-lg focus:outline-none cursor-pointer border border-white/5">
            <option>Revenue at Risk (High → Low)</option>
            <option>Churn Prob Reduction</option>
            <option>Target Cohort Size</option>
          </select>
        </div>
      </div>

      {/* Section 4: 4 Detailed Campaign Cards (Grid) */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {filteredCampaigns.map((camp) => (
          <div
            key={camp.id}
            className="bg-[#171b26]/90 backdrop-blur-xl rounded-xl p-4 sm:p-5 flex flex-col justify-between shadow-md relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:bg-[#1c1f2a] border border-white/5"
          >
            <div>
              {/* Card Top Bar */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-[#b50036]/20 text-[#ffb2b7] font-mono text-[10px] uppercase tracking-wider flex items-center gap-1.5 font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#ffb2b7] animate-pulse"></span>
                    {camp.statusBadge}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-[#262a35] text-[#bdc8d1] font-mono text-[10px] uppercase">
                    {camp.timingBadge}
                  </span>
                </div>
                <span className="font-mono text-xs text-[#bdc8d1]">{camp.code}</span>
              </div>

              {/* Title & Segment Definition */}
              <div className="mt-3">
                <h2 className="text-base sm:text-lg text-[#dfe2f1] font-semibold tracking-tight">
                  {camp.title}
                </h2>
                <div className="flex items-center gap-1.5 mt-1 text-xs text-[#8ed5ff]">
                  <span className="material-symbols-outlined text-sm">tune</span>
                  <span>{camp.targetSegment}</span>
                </div>
              </div>

              {/* Vulnerability & Cohort Metrics Grid */}
              <div className="grid grid-cols-3 gap-2 mt-3 p-3 rounded-xl bg-[#0a0e18]/70 border border-white/5">
                <div className="flex flex-col">
                  <span className="font-mono text-[10px] text-[#bdc8d1] uppercase">Segment Volatility</span>
                  <span className="font-mono text-sm text-[#ffb2b7] font-bold mt-0.5">
                    {camp.segmentVolatility}
                  </span>
                  <span className="text-[10px] text-[#bdc8d1]">High risk index</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-mono text-[10px] text-[#bdc8d1] uppercase">Target Cohort</span>
                  <span className="font-mono text-sm text-[#dfe2f1] font-bold mt-0.5">
                    {camp.targetCohort.toLocaleString()} Subs
                  </span>
                  <span className="text-[10px] text-[#bdc8d1]">{camp.cohortPct}</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-mono text-[10px] text-[#bdc8d1] uppercase">MRR at Risk</span>
                  <span className="font-mono text-sm text-[#7bd0ff] font-bold mt-0.5">
                    {camp.mrrAtRisk}
                  </span>
                  <span className="text-[10px] text-[#56e5a9]">{camp.arrAtRisk}</span>
                </div>
              </div>

              {/* Strategy & Incentive Payload */}
              <div className="mt-3 p-3 rounded-xl bg-[#262a35]/40 border border-white/5">
                <div className="flex items-start gap-2.5">
                  <span className="p-1 rounded bg-[#38bdf8]/20 text-[#8ed5ff] shrink-0">
                    <span className="material-symbols-outlined text-base">card_giftcard</span>
                  </span>
                  <div className="flex flex-col">
                    <span className="font-mono text-[10px] text-[#8ed5ff] tracking-wider uppercase font-bold">
                      {camp.strategyTitle}
                    </span>
                    <p className="text-xs text-[#dfe2f1] mt-1 leading-relaxed">
                      {camp.strategyDesc}
                    </p>
                  </div>
                </div>
              </div>

              {/* Expected Churn Impact & Bar */}
              <div className="mt-3 flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] text-[#bdc8d1] uppercase">Expected Risk Reduction</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-xs text-[#56e5a9] font-bold">
                      {camp.expectedRiskDrop}
                    </span>
                    <span className="text-[10px] text-[#bdc8d1]">
                      ({camp.subsSaved} subs saved)
                    </span>
                  </div>
                </div>
                <div className="w-full h-2 rounded-full bg-[#262a35] overflow-hidden flex">
                  <div className="h-full bg-[#b50036]" style={{ width: '42%' }}></div>
                  <div className="h-full bg-[#56e5a9]" style={{ width: '22%' }}></div>
                </div>
                <div className="flex items-center justify-between text-[#bdc8d1] text-[10px]">
                  <span>{camp.baselineRate}</span>
                  <span className="text-[#56e5a9] font-semibold">{camp.postTarget}</span>
                </div>
              </div>
            </div>

            {/* Action Footer */}
            <div className="mt-4 pt-3 flex items-center justify-between gap-2 border-t border-white/5">
              <div className="flex items-center gap-1 text-[#bdc8d1] text-[11px]">
                <span className="material-symbols-outlined text-sm text-[#56e5a9]">check_circle</span>
                <span>{camp.subMeta}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    onOpenSimulationModal(camp.title, camp.targetCohort, camp.mrrAtRisk, camp.expectedRiskDrop)
                  }
                  className="px-3 py-1.5 rounded-lg text-[#bdc8d1] hover:text-[#dfe2f1] hover:bg-[#262a35] transition-all text-xs font-semibold cursor-pointer"
                >
                  Simulate Cohort
                </button>
                <button
                  type="button"
                  onClick={() => handleToggleDeploy(camp.id, camp.title)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm cursor-pointer ${
                    camp.isDeployed
                      ? 'bg-[#30c88f] text-[#004e34]'
                      : 'bg-[#38bdf8] text-[#004965] hover:bg-[#7bd0ff]'
                  }`}
                >
                  {camp.isDeployed ? 'Manage Automation' : 'Deploy Campaign'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Section 5: Supporting Telemetry & Engine Logic Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Sub-Section A: Active Execution Pipeline (8 cols) */}
        <div className="lg:col-span-8 bg-[#171b26]/90 backdrop-blur-xl rounded-xl p-4 sm:p-5 shadow-sm flex flex-col justify-between border border-white/5">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-[10px] text-[#56e5a9] uppercase tracking-wider font-bold">
                    Live Interventions
                  </span>
                  <span className="w-1.5 h-1.5 rounded-full bg-[#56e5a9] animate-pulse"></span>
                </div>
                <h3 className="text-base text-[#dfe2f1] font-semibold tracking-tight mt-0.5">
                  Execution Pipeline &amp; Response Telemetry
                </h3>
              </div>
              <span className="text-xs text-[#bdc8d1]">Last updated: Just now</span>
            </div>

            {/* Telemetry Ribbon */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-3 p-3 rounded-xl bg-[#0a0e18]/80 border border-white/5">
              <div className="flex flex-col">
                <span className="font-mono text-[10px] text-[#bdc8d1] uppercase">Dispatched (24h)</span>
                <span className="font-mono text-sm text-[#dfe2f1] font-bold mt-0.5">342 msgs</span>
                <span className="text-[10px] text-[#8ed5ff]">99.2% delivery</span>
              </div>
              <div className="flex flex-col">
                <span className="font-mono text-[10px] text-[#bdc8d1] uppercase">Acceptance Rate</span>
                <span className="font-mono text-sm text-[#56e5a9] font-bold mt-0.5">64.2%</span>
                <span className="text-[10px] text-[#56e5a9]">+8.4% vs benchmark</span>
              </div>
              <div className="flex flex-col">
                <span className="font-mono text-[10px] text-[#bdc8d1] uppercase">Contracts Converted</span>
                <span className="font-mono text-sm text-[#dfe2f1] font-bold mt-0.5">218 accounts</span>
                <span className="text-[10px] text-[#7bd0ff]">12-Mo lock</span>
              </div>
              <div className="flex flex-col">
                <span className="font-mono text-[10px] text-[#bdc8d1] uppercase">Auto-Retargeting</span>
                <span className="font-mono text-sm text-[#ffb2b7] font-bold mt-0.5">48 in waitlist</span>
                <span className="text-[10px] text-[#bdc8d1]">Day 3 follow-up</span>
              </div>
            </div>

            {/* Dispatch Table */}
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-[#262a35]/40 text-[#bdc8d1] font-mono text-[10px] uppercase border-y border-white/5">
                    <th className="py-2 px-3 rounded-l-lg">Subscriber / ID</th>
                    <th className="py-2 px-3">Triggered Campaign</th>
                    <th className="py-2 px-3">Pre-Risk</th>
                    <th className="py-2 px-3">Channel</th>
                    <th className="py-2 px-3">Response Status</th>
                    <th className="py-2 px-3 rounded-r-lg text-right">Protected ARR</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-sans">
                  <tr className="hover:bg-[#262a35]/30 transition-colors">
                    <td className="py-2.5 px-3 font-mono">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[#dfe2f1] font-semibold">#SUB-9204</span>
                        <span className="text-[10px] text-[#bdc8d1]">• M2M</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-[#dfe2f1] font-medium">Month-to-Month Shift</td>
                    <td className="py-2.5 px-3">
                      <span className="px-1.5 py-0.5 rounded bg-[#b50036]/20 text-[#ffb2b7] font-mono text-[11px] font-bold">
                        82%
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-[#bdc8d1]">In-App Notification</td>
                    <td className="py-2.5 px-3">
                      <span className="flex items-center gap-1 text-[#56e5a9] font-medium">
                        <span className="material-symbols-outlined text-sm">verified</span>
                        Accepted 1-Yr Contract
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-[#56e5a9] font-bold">
                      ₹14,400
                    </td>
                  </tr>

                  <tr className="hover:bg-[#262a35]/30 transition-colors">
                    <td className="py-2.5 px-3 font-mono">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[#dfe2f1] font-semibold">#SUB-8419</span>
                        <span className="text-[10px] text-[#bdc8d1]">• E-Check</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-[#dfe2f1] font-medium">Autopay Migration</td>
                    <td className="py-2.5 px-3">
                      <span className="px-1.5 py-0.5 rounded bg-[#b50036]/20 text-[#ffb2b7] font-mono text-[11px] font-bold">
                        74%
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-[#bdc8d1]">Automated SMS</td>
                    <td className="py-2.5 px-3">
                      <span className="flex items-center gap-1 text-[#56e5a9] font-medium">
                        <span className="material-symbols-outlined text-sm">verified</span>
                        Card Tokenized
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-[#56e5a9] font-bold">
                      ₹11,200
                    </td>
                  </tr>

                  <tr className="hover:bg-[#262a35]/30 transition-colors">
                    <td className="py-2.5 px-3 font-mono">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[#dfe2f1] font-semibold">#SUB-7102</span>
                        <span className="text-[10px] text-[#bdc8d1]">• Fiber Optic</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-[#dfe2f1] font-medium">Fiber Gigabit Lock</td>
                    <td className="py-2.5 px-3">
                      <span className="px-1.5 py-0.5 rounded bg-[#262a35] text-[#7bd0ff] font-mono text-[11px] font-bold">
                        66%
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-[#bdc8d1]">VIP Concierge Call</td>
                    <td className="py-2.5 px-3">
                      <span className="flex items-center gap-1 text-[#8ed5ff] font-medium">
                        <span className="material-symbols-outlined text-sm">cloud_upload</span>
                        In Negotiation (Tier 1.5G)
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-[#bdc8d1]">₹26,800</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-3 pt-2 flex items-center justify-between text-[#bdc8d1] text-[11px] border-t border-white/5">
            <span>Showing latest live dispatches in current sprint</span>
            <button
              onClick={() =>
                onOpenSimulationModal('Complete Audit Log Review', 342, '₹1.88 Cr ARR', 'Active')
              }
              className="text-[#8ed5ff] hover:underline flex items-center gap-1 font-mono uppercase text-[10px] cursor-pointer"
            >
              <span>View full execution audit log</span>
              <span className="material-symbols-outlined text-xs">arrow_forward</span>
            </button>
          </div>
        </div>

        {/* Sub-Section B: Automated Trigger Rules (4 cols) */}
        <div className="lg:col-span-4 bg-[#171b26]/90 backdrop-blur-xl rounded-xl p-4 sm:p-5 shadow-sm flex flex-col justify-between border border-white/5">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="font-mono text-[10px] text-[#8ed5ff] uppercase tracking-wider font-bold">
                  XGBoost Decision Engine
                </span>
                <h3 className="text-base text-[#dfe2f1] font-semibold tracking-tight mt-0.5">
                  Automated Trigger Rules
                </h3>
              </div>
              <span className="p-1 rounded-lg bg-[#262a35] text-[#56e5a9]">
                <span className="material-symbols-outlined text-base">rule</span>
              </span>
            </div>

            <p className="text-xs text-[#bdc8d1] mt-1.5">
              Subscribers evaluate against continuous telemetry vectors. Firing conditions dispatch
              actions in &lt;180ms.
            </p>

            <div className="flex flex-col gap-2 mt-3 font-mono text-xs">
              {/* Rule 1 */}
              <div className="p-3 rounded-xl bg-[#262a35]/40 flex flex-col gap-1 border border-white/5">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] text-[#8ed5ff] uppercase font-bold">Trigger Rule #01</span>
                  <span className="text-[10px] text-[#56e5a9] font-semibold">Priority 1 (High)</span>
                </div>
                <div className="text-[11px] text-[#dfe2f1] bg-[#0a0e18]/80 p-1.5 rounded border border-white/5">
                  IF <span className="text-[#ffb2b7] font-bold">Risk &gt; 70%</span> AND <span className="text-[#7bd0ff]">Contract == &apos;M2M&apos;</span>
                </div>
                <div className="flex items-center justify-between text-[#bdc8d1] text-[10px] mt-0.5">
                  <span>Dispatches: Playbook 1 (Shift)</span>
                  <span className="text-[#56e5a9]">Lag: 0 Days</span>
                </div>
              </div>

              {/* Rule 2 */}
              <div className="p-3 rounded-xl bg-[#262a35]/40 flex flex-col gap-1 border border-white/5">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] text-[#8ed5ff] uppercase font-bold">Trigger Rule #02</span>
                  <span className="text-[10px] text-[#56e5a9] font-semibold">Priority 2 (Med)</span>
                </div>
                <div className="text-[11px] text-[#dfe2f1] bg-[#0a0e18]/80 p-1.5 rounded border border-white/5">
                  IF <span className="text-[#ffb2b7] font-bold">Risk &gt; 50%</span> AND <span className="text-[#7bd0ff]">Payment == &apos;E-Check&apos;</span>
                </div>
                <div className="flex items-center justify-between text-[#bdc8d1] text-[10px] mt-0.5">
                  <span>Dispatches: Playbook 2 (Autopay)</span>
                  <span className="text-[#56e5a9]">Lag: Day 10</span>
                </div>
              </div>

              {/* Rule 3 */}
              <div className="p-3 rounded-xl bg-[#262a35]/40 flex flex-col gap-1 border border-white/5">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] text-[#8ed5ff] uppercase font-bold">Trigger Rule #03</span>
                  <span className="text-[10px] text-[#56e5a9] font-semibold">Priority 2 (Med)</span>
                </div>
                <div className="text-[11px] text-[#dfe2f1] bg-[#0a0e18]/80 p-1.5 rounded border border-white/5">
                  IF <span className="text-[#7bd0ff]">Tenure &lt;= 6 Mo</span> AND <span className="text-[#ffb2b7]">Tickets &gt;= 2</span>
                </div>
                <div className="flex items-center justify-between text-[#bdc8d1] text-[10px] mt-0.5">
                  <span>Dispatches: Playbook 3 (Onboarding)</span>
                  <span className="text-[#56e5a9]">Immediate</span>
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={() =>
              onOpenSimulationModal('XGBoost Trigger Config', 4892, 'Realtime 180ms', 'Tuned')
            }
            className="mt-3 w-full py-2 rounded-lg bg-[#262a35] text-[#dfe2f1] hover:bg-[#353944] transition-all text-xs font-semibold flex items-center justify-center gap-1.5 border border-white/5 cursor-pointer shadow-sm"
          >
            <span className="material-symbols-outlined text-sm">settings_suggest</span>
            <span>Configure XGBoost Thresholds</span>
          </button>
        </div>
      </div>
    </div>
  );
};
