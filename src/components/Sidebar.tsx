import React from 'react';
import { NavigationRoute } from '../types/telemetry';

interface SidebarProps {
  currentRoute: NavigationRoute;
  onRouteChange: (route: NavigationRoute) => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentRoute,
  onRouteChange,
  isMobileOpen,
  onCloseMobile,
}) => {
  const navItems: { route: NavigationRoute; label: string; icon: string }[] = [
    { route: 'overview', label: 'Overview', icon: 'grid_view' },
    { route: 'customer-risk', label: 'Customer Risk', icon: 'warning' },
    { route: 'what-if-simulator', label: 'What-If Simulator', icon: 'tune' },
    { route: 'retention-playbook', label: 'Retention Playbook', icon: 'bolt' },
    { route: 'model-performance', label: 'Model Performance', icon: 'query_stats' },
  ];

  const handleNavClick = (route: NavigationRoute) => {
    onRouteChange(route);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`fixed left-0 top-0 h-full w-64 bg-[#171b26]/95 backdrop-blur-xl z-50 flex flex-col justify-between py-4 px-3 border-r border-white/5 transition-transform duration-300 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex flex-col gap-4">
          {/* Logo Brand Header */}
          <div className="flex items-center gap-2.5 px-2 pt-1">
            <img
              alt="ChurnLens Logo"
              className="h-8 w-auto object-contain"
              src="https://lh3.googleusercontent.com/aida/AEtjO1WO_6uL8Eaighq5EmL6e7HdgGLSGa2xESIRYiItA02I2_7W9FupL0SDHCmnKEoT-dhQyo6p7D_h7rYtWqKJO6r-OyNo43fmK6tTt1l_JnJn0iHrij2QmStPbIlis-ZJYESp4Wj05KI-2XuM4thaHvwPvxPNUR3XMfvUUiSfy-0gLRHXoQx3kUWFSzgE8I3clDxIw0mVbrTmlg0WBugNT-DKgVUbmKA4YayBKJuWFq2SGCAnCG_UR4YcHVM"
            />
            <div className="flex flex-col">
              <span className="font-semibold text-base text-[#8ed5ff] tracking-tight">
                ChurnLens
              </span>
              <span className="font-mono text-[10px] text-[#bdc8d1] uppercase tracking-wider">
                Telecom Intelligence
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-col gap-1 mt-2">
            {navItems.map((item) => {
              const isActive =
                currentRoute === item.route ||
                (item.route === 'customer-risk' && currentRoute === 'customer-risk');

              return (
                <button
                  key={item.route}
                  onClick={() => handleNavClick(item.route)}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all text-left w-full cursor-pointer ${
                    isActive
                      ? 'bg-[#38bdf8] text-[#004965] font-semibold shadow-md shadow-[#38bdf8]/20'
                      : 'text-[#bdc8d1] hover:bg-[#262a35] hover:text-[#dfe2f1]'
                  }`}
                >
                  <span className="material-symbols-outlined text-base">
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Model Health Status & Lead Profile Footer */}
        <div className="flex flex-col gap-3">
          {/* Model Health Capsule */}
          <div className="bg-[#262a35]/60 backdrop-blur-md rounded-xl p-3 flex flex-col gap-1.5 border border-white/5">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] text-[#bdc8d1] uppercase tracking-wider">
                Model Health
              </span>
              <span className="w-2 h-2 rounded-full bg-[#56e5a9] animate-pulse"></span>
            </div>
            <div className="flex items-center justify-between mt-0.5">
              <span className="text-xs text-[#dfe2f1] font-medium">XGBoost v4.2</span>
              <span className="font-mono text-xs text-[#56e5a9] font-bold">0.84 AUC</span>
            </div>
            <div className="flex items-center justify-between text-[#bdc8d1] text-[11px]">
              <span className="text-[10px]">Last trained</span>
              <span className="font-mono text-[10px] text-[#dfe2f1]">2h ago (Auto)</span>
            </div>
          </div>

          {/* User Profile */}
          <div className="bg-[#1c1f2a]/70 rounded-xl p-2.5 flex items-center justify-between border border-white/5">
            <div className="flex items-center gap-2.5">
              <img
                alt="Elena Vance"
                className="w-8 h-8 rounded-full object-cover border border-[#38bdf8]/30"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCGf2cl1wXei1dLlyJ05z1bwFqMmy-tov8ZIDTFpvTAiIZzg8omV80kxZ2Ct4MgAw1kgtrXy2Vm3v7wmU2QFWG7HV3WtpLEk1Bq1PjoC1FSV87Eina3XAd_7vFTnr_bHLBss4tShnQGpQudWqmoSh0zPTq0ZzGc4PxSxT7UD7aeIQ3noOGxGTi2qRb-Gb9KKBy7uCxpEKsNJqQON_A6GFjJqYoPWnDM2q7o6BWOhfZDJW_MwoYdm2ry"
              />
              <div className="flex flex-col">
                <span className="text-xs text-[#dfe2f1] font-semibold leading-none">
                  Elena Vance
                </span>
                <span className="text-[10px] text-[#bdc8d1] mt-0.5">
                  Retention Lead
                </span>
              </div>
            </div>
            <button
              title="Options"
              className="text-[#bdc8d1] hover:text-[#dfe2f1] transition-colors p-1"
            >
              <span className="material-symbols-outlined text-base">more_vert</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
