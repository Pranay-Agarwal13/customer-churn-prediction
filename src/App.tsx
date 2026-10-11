/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { NavigationRoute, CustomerRecord } from './types/telemetry';
import { CUSTOMER_DATABASE } from './data/mockTelcoData';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { OverviewView, TelemetryData } from './components/OverviewView';
import { WhatIfSimulatorView } from './components/WhatIfSimulatorView';
import { RetentionPlaybooksView } from './components/RetentionPlaybooksView';
import { ModelPerformanceView } from './components/ModelPerformanceView';
import { SimulationModal } from './components/SimulationModal';
import { ExportModal } from './components/ExportModal';

const DEFAULT_TELEMETRY: TelemetryData = {
  timeRange: 'Trailing 30 Days',
  activeBase: {
    value: '7,043',
    subUnit: 'lines',
    badge: '+2.1% MoM',
    isPositive: true,
    saturation: '84.2%',
    sparkline: [6890, 6920, 6950, 6980, 7010, 7030, 7043],
  },
  churnCycle: {
    value: '26.5%',
    subUnit: '/ 30-day baseline',
    badge: '+1.4% elevated',
    isPositive: false,
    dev: '+8.5% dev',
    benchmark: '<18.0%',
    sparkline: [24.8, 25.1, 24.9, 25.8, 26.1, 26.3, 26.5],
  },
  criticalRisk: {
    value: '1,248',
    subUnit: '17.7% of total',
    badge: 'p(>0.70)',
    isPositive: false,
    queue: '612 queued',
    capacityPct: 49,
    sparkline: [1180, 1195, 1210, 1225, 1238, 1248],
  },
  revAtRisk: {
    value: '₹18.4L',
    subUnit: 'Exposure Delta: +₹2.1L',
    badge: 'ARR ₹2.21 Cr',
    isPositive: false,
    recoverable: '₹11.6L (63%)',
    sparkline: [16.2, 16.8, 17.1, 17.6, 18.0, 18.4],
  },
};

export default function App() {
  const [currentRoute, setCurrentRoute] = useState<NavigationRoute>('overview');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);
  const [customerList, setCustomerList] = useState<CustomerRecord[]>(CUSTOMER_DATABASE);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerRecord>(CUSTOMER_DATABASE[0]);
  const [timeRange, setTimeRange] = useState<string>('Trailing 30 Days');
  const [contractFilter, setContractFilter] = useState<string>('all');
  const [techFilter, setTechFilter] = useState<string>('all');
  const [tierFilter, setTierFilter] = useState<string>('ALL');
  const [activeKpi, setActiveKpi] = useState<string>('churnCycle');
  const [telemetry, setTelemetry] = useState<TelemetryData>(DEFAULT_TELEMETRY);
  const [isLoadingTelemetry, setIsLoadingTelemetry] = useState<boolean>(false);
  const [playbookCategory, setPlaybookCategory] = useState<string>('all');

  // Simulation modal state
  const [simModalState, setSimModalState] = useState<{
    isOpen: boolean;
    title: string;
    cohortSize: number;
    revenueAtRisk: string;
    expectedYield: string;
  }>({
    isOpen: false,
    title: 'Cohort Simulation',
    cohortSize: 2418,
    revenueAtRisk: '₹21.6L / mo',
    expectedYield: '-21.4% Prob Drop',
  });

  // Export modal state
  const [isExportOpen, setIsExportOpen] = useState<boolean>(false);

  // Fetch telemetry & customers dynamically whenever filters change
  useEffect(() => {
    let isMounted = true;
    setIsLoadingTelemetry(true);

    const params = new URLSearchParams({
      timeRange,
      contract: contractFilter,
      internetService: techFilter,
      tier: tierFilter,
      activeKpi,
    });

    // 1. Fetch live telemetry calculation
    fetch(`/api/telemetry?${params.toString()}`)
      .then((res) => {
        if (!res.ok) throw new Error('Network response error');
        return res.json();
      })
      .then((data: TelemetryData) => {
        if (isMounted && data.activeBase) {
          setTelemetry(data);
        }
      })
      .catch((err) => {
        console.warn('[Telemetry API]', err);
      })
      .finally(() => {
        if (isMounted) setIsLoadingTelemetry(false);
      });

    // 2. Fetch customers matching current filter
    const custParams = new URLSearchParams({
      contract: contractFilter,
      internetService: techFilter,
      tier: tierFilter,
      sortBy: activeKpi === 'revAtRisk' ? 'monthlyCharges' : 'churnProb',
      limit: '100',
    });

    fetch(`/api/customers?${custParams.toString()}`)
      .then((res) => {
        if (!res.ok) throw new Error('Customer fetch error');
        return res.json();
      })
      .then((data: CustomerRecord[]) => {
        if (isMounted && Array.isArray(data) && data.length > 0) {
          setCustomerList(data);
          // Keep selected customer in sync if current one not found
          if (!data.some((c) => c.id === selectedCustomer.id)) {
            setSelectedCustomer(data[0]);
          }
        }
      })
      .catch((err) => {
        console.warn('[Customers API]', err);
      });

    return () => {
      isMounted = false;
    };
  }, [timeRange, contractFilter, techFilter, tierFilter, activeKpi]);

  const handleOpenSimulationModal = (
    title: string,
    cohortSize: number,
    revenueAtRisk: string,
    expectedYield: string
  ) => {
    setSimModalState({
      isOpen: true,
      title,
      cohortSize,
      revenueAtRisk,
      expectedYield,
    });
  };

  const handleNavigateToSimulator = (cust: CustomerRecord) => {
    setSelectedCustomer(cust);
    setCurrentRoute('what-if-simulator');
  };

  const handleNavigateToPlaybooks = (category: string = 'all') => {
    setPlaybookCategory(category);
    setCurrentRoute('retention-playbook');
  };

  return (
    <div className="min-h-screen bg-[#0f131d] text-[#dfe2f1] flex flex-col font-sans selection:bg-[#38bdf8] selection:text-[#004965]">
      {/* Sidebar Navigation */}
      <Sidebar
        currentRoute={currentRoute}
        onRouteChange={(route) => setCurrentRoute(route)}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="lg:pl-64 flex flex-col min-h-screen">
        {/* Top Header Bar */}
        <Header
          onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
          onOpenExport={() => setIsExportOpen(true)}
          timeRange={timeRange}
          setTimeRange={setTimeRange}
        />

        {/* Content Container */}
        <main className="flex-1 w-full pt-20 px-4 sm:px-6 pb-12 max-w-[1720px] mx-auto">
          {(currentRoute === 'overview' || currentRoute === 'customer-risk') && (
            <OverviewView
              customers={customerList}
              selectedCustomer={selectedCustomer}
              onSelectCustomer={(cust) => setSelectedCustomer(cust)}
              onNavigateToSimulator={handleNavigateToSimulator}
              onNavigateToPlaybooks={handleNavigateToPlaybooks}
              onOpenExport={() => setIsExportOpen(true)}
              telemetry={telemetry}
              isLoadingTelemetry={isLoadingTelemetry}
              contractFilter={contractFilter}
              onSelectContractFilter={setContractFilter}
              techFilter={techFilter}
              onSelectTechFilter={setTechFilter}
              activeKpi={activeKpi}
              onSelectActiveKpi={setActiveKpi}
              timeRange={timeRange}
              onSelectTimeRange={setTimeRange}
            />
          )}

          {currentRoute === 'what-if-simulator' && (
            <WhatIfSimulatorView
              customers={customerList}
              activeCustomer={selectedCustomer}
              onSelectCustomer={(cust) => setSelectedCustomer(cust)}
              onNavigateToPlaybooks={() => handleNavigateToPlaybooks('contract')}
            />
          )}

          {currentRoute === 'retention-playbook' && (
            <RetentionPlaybooksView
              initialCategory={playbookCategory}
              onOpenSimulationModal={handleOpenSimulationModal}
            />
          )}

          {currentRoute === 'model-performance' && <ModelPerformanceView />}
        </main>
      </div>

      {/* Cohort Simulation Modal */}
      <SimulationModal
        isOpen={simModalState.isOpen}
        onClose={() => setSimModalState((prev) => ({ ...prev, isOpen: false }))}
        title={simModalState.title}
        cohortSize={simModalState.cohortSize}
        revenueAtRisk={simModalState.revenueAtRisk}
        expectedYield={simModalState.expectedYield}
      />

      {/* Export Telemetry Modal */}
      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        customers={CUSTOMER_DATABASE}
      />
    </div>
  );
}
