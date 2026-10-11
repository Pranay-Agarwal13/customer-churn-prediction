import React from 'react';

interface HeaderProps {
  onOpenMobileSidebar: () => void;
  onOpenExport: () => void;
  timeRange: string;
  setTimeRange: (val: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenMobileSidebar,
  onOpenExport,
  timeRange,
  setTimeRange,
}) => {
  return (
    <header className="fixed top-0 left-0 lg:left-64 right-0 h-16 bg-[#0f131d]/85 backdrop-blur-xl z-40 px-4 sm:px-6 border-b border-white/5 flex items-center justify-between">
      {/* Left controls: Mobile toggle + Date Range + Ingestion status */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileSidebar}
          className="p-1.5 rounded-lg bg-[#171b26] text-[#bdc8d1] hover:text-[#dfe2f1] lg:hidden"
          title="Open Menu"
        >
          <span className="material-symbols-outlined text-xl">menu</span>
        </button>

        {/* Date Selector */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#171b26] rounded-lg border border-white/5">
          <span className="material-symbols-outlined text-[#bdc8d1] text-base">
            calendar_today
          </span>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="bg-transparent text-[#dfe2f1] text-xs sm:text-sm focus:outline-none cursor-pointer pr-1"
          >
            <option value="Trailing 30 Days" className="bg-[#1c1f2a]">
              Trailing 30 Days
            </option>
            <option value="Past 7 Days" className="bg-[#1c1f2a]">
              Past 7 Days
            </option>
            <option value="Quarter to Date" className="bg-[#1c1f2a]">
              Quarter to Date
            </option>
            <option value="Current Sprint" className="bg-[#1c1f2a]">
              Current Sprint
            </option>
            <option value="Year to Date" className="bg-[#1c1f2a]">
              Year to Date
            </option>
            <option value="Past 6 Months" className="bg-[#1c1f2a]">
              Past 6 Months
            </option>
          </select>
        </div>

        {/* Ingestion Pill */}
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-[#30c88f]/15 border border-[#30c88f]/30 rounded-lg">
          <span className="w-1.5 h-1.5 rounded-full bg-[#56e5a9] animate-pulse"></span>
          <span className="font-mono text-[10px] text-[#56e5a9] uppercase font-bold tracking-wider">
            Live Ingestion active
          </span>
        </div>
      </div>

      {/* Right controls: Notifications, Export button, Avatar */}
      <div className="flex items-center gap-3">
        {/* Notification Bell */}
        <button
          title="Notifications"
          className="relative p-2 rounded-lg text-[#bdc8d1] hover:bg-[#262a35] hover:text-[#dfe2f1] transition-all"
        >
          <span className="material-symbols-outlined text-base">notifications</span>
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#ffb4ab]"></span>
        </button>

        {/* Export Telemetry Button */}
        <button
          onClick={onOpenExport}
          className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#38bdf8] text-[#004965] text-xs sm:text-sm font-semibold rounded-lg hover:bg-[#7bd0ff] transition-all shadow-md shadow-[#38bdf8]/20 cursor-pointer"
        >
          <span className="material-symbols-outlined text-base">download</span>
          <span className="hidden xs:inline">Export Telemetry</span>
          <span className="xs:hidden">Export</span>
        </button>

        {/* Profile Avatar */}
        <img
          alt="Elena Vance"
          className="w-8 h-8 rounded-full object-cover border border-[#38bdf8]/30 hidden sm:block"
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuCGf2cl1wXei1dLlyJ05z1bwFqMmy-tov8ZIDTFpvTAiIZzg8omV80kxZ2Ct4MgAw1kgtrXy2Vm3v7wmU2QFWG7HV3WtpLEk1Bq1PjoC1FSV87Eina3XAd_7vFTnr_bHLBss4tShnQGpQudWqmoSh0zPTq0ZzGc4PxSxT7UD7aeIQ3noOGxGTi2qRb-Gb9KKBy7uCxpEKsNJqQON_A6GFjJqYoPWnDM2q7o6BWOhfZDJW_MwoYdm2ry"
        />
      </div>
    </header>
  );
};
