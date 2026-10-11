import React, { useState } from 'react';
import { CustomerRecord } from '../types/telemetry';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  customers: CustomerRecord[];
}

export const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose, customers }) => {
  const [exportFormat, setExportFormat] = useState<'csv' | 'json'>('csv');
  const [downloadSuccess, setDownloadSuccess] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleDownload = () => {
    let content = '';
    let filename = '';
    let mimeType = '';

    if (exportFormat === 'csv') {
      const headers = ['CustomerID', 'Tenure', 'Contract', 'PaymentMethod', 'MonthlyCharges', 'ChurnProb', 'RiskTier', 'RecommendedPlaybook'];
      const rows = customers.map((c) => [
        c.id,
        c.tenure,
        `"${c.contract}"`,
        `"${c.paymentMethod}"`,
        c.monthlyCharges.toFixed(2),
        c.churnProb.toFixed(3),
        c.riskTier,
        `"${c.recommendedPlaybook}"`,
      ]);
      content = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
      filename = 'telco_churn_predictions_export.csv';
      mimeType = 'text/csv';
    } else {
      content = JSON.stringify(customers, null, 2);
      filename = 'telco_churn_predictions_export.json';
      mimeType = 'application/json';
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setDownloadSuccess(true);
    setTimeout(() => {
      setDownloadSuccess(false);
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="bg-[#171b26] border border-white/10 p-5 sm:p-6 rounded-xl max-w-md w-full shadow-2xl relative flex flex-col gap-4">
        <div className="flex items-center justify-between border-b border-white/5 pb-2">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#8ed5ff] text-xl">file_download</span>
            <h3 className="text-base font-semibold text-[#dfe2f1]">Export Telemetry &amp; Scored Cohorts</h3>
          </div>
          <button onClick={onClose} className="text-[#bdc8d1] hover:text-[#dfe2f1] p-1 transition-colors cursor-pointer">
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        <p className="text-xs text-[#bdc8d1]">
          Export active customer risk predictions, TreeSHAP scores, and recommended playbooks for integration with CRM / marketing automation systems.
        </p>

        <div className="flex flex-col gap-2">
          <label className="text-xs text-[#dfe2f1] font-semibold">Export Format</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setExportFormat('csv')}
              className={`p-2.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                exportFormat === 'csv'
                  ? 'bg-[#38bdf8] text-[#004965] border-[#38bdf8]'
                  : 'bg-[#1c1f2a] text-[#bdc8d1] border-white/5 hover:border-white/20'
              }`}
            >
              CSV Spreadsheet (.csv)
            </button>
            <button
              onClick={() => setExportFormat('json')}
              className={`p-2.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                exportFormat === 'json'
                  ? 'bg-[#38bdf8] text-[#004965] border-[#38bdf8]'
                  : 'bg-[#1c1f2a] text-[#bdc8d1] border-white/5 hover:border-white/20'
              }`}
            >
              JSON Object (.json)
            </button>
          </div>
        </div>

        {downloadSuccess && (
          <div className="p-2.5 bg-[#30c88f] text-[#004e34] rounded-lg text-xs font-bold flex items-center gap-2">
            <span className="material-symbols-outlined text-base">check</span>
            <span>Download initialized successfully!</span>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2 border-t border-white/5">
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-lg bg-[#262a35] text-[#dfe2f1] hover:bg-[#353944] text-xs font-semibold cursor-pointer border border-white/5"
          >
            Cancel
          </button>
          <button
            onClick={handleDownload}
            className="px-3.5 py-1.5 rounded-lg bg-[#38bdf8] text-[#004965] text-xs font-bold hover:bg-[#7bd0ff] cursor-pointer shadow-md shadow-[#38bdf8]/20 flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-base">download</span>
            <span>Download Data</span>
          </button>
        </div>
      </div>
    </div>
  );
};
