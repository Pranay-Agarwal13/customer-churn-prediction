import React from 'react';

interface SimulationModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  cohortSize: number;
  revenueAtRisk: string;
  expectedYield: string;
}

export const SimulationModal: React.FC<SimulationModalProps> = ({
  isOpen,
  onClose,
  title,
  cohortSize,
  revenueAtRisk,
  expectedYield,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="bg-[#171b26] border border-white/10 p-5 sm:p-6 rounded-xl max-w-md w-full shadow-2xl relative flex flex-col gap-4">
        <div className="flex items-center justify-between border-b border-white/5 pb-2">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#8ed5ff] text-xl">insights</span>
            <h3 className="text-base font-semibold text-[#dfe2f1]">{title}</h3>
          </div>
          <button
            onClick={onClose}
            className="text-[#bdc8d1] hover:text-[#dfe2f1] p-1 transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        <div className="flex flex-col gap-2.5 font-sans">
          <div className="p-3 rounded-xl bg-[#262a35]/60 flex items-center justify-between border border-white/5">
            <span className="text-xs text-[#bdc8d1]">Simulated Cohort Size:</span>
            <span className="font-mono text-sm text-[#dfe2f1] font-bold">
              {cohortSize.toLocaleString()} Subs
            </span>
          </div>

          <div className="p-3 rounded-xl bg-[#262a35]/60 flex items-center justify-between border border-white/5">
            <span className="text-xs text-[#bdc8d1]">Estimated Retention Yield:</span>
            <span className="font-mono text-sm text-[#56e5a9] font-bold">{expectedYield}</span>
          </div>

          <div className="p-3 rounded-xl bg-[#262a35]/60 flex items-center justify-between border border-white/5">
            <span className="text-xs text-[#bdc8d1]">Annual ARR Impact:</span>
            <span className="font-mono text-sm text-[#7bd0ff] font-bold">{revenueAtRisk}</span>
          </div>

          <div className="mt-1 text-[#87929a] text-[11px] leading-relaxed">
            Monte Carlo simulation executing 10,000 iterations over historical cohort elasticity curves. Confidence interval: 95% [18.2% - 24.1%]. Firing rules synchronized with XGBoost probability threshold 0.43.
          </div>
        </div>

        <div className="mt-2 flex justify-end gap-2 pt-2 border-t border-white/5">
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-lg bg-[#262a35] text-[#dfe2f1] hover:bg-[#353944] text-xs font-semibold cursor-pointer border border-white/5"
          >
            Dismiss
          </button>
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-lg bg-[#38bdf8] text-[#004965] text-xs font-bold hover:bg-[#7bd0ff] cursor-pointer shadow-md shadow-[#38bdf8]/20"
          >
            Apply Strategy
          </button>
        </div>
      </div>
    </div>
  );
};
