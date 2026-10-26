/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { DEFAULT_SCENARIOS } from './data/defaultScenarios';
import {
  TreatyConfig,
  ScenarioPreset,
  Claim,
} from './types/reinsurance';
import {
  DEFAULT_TREATY_CONFIG,
  calculateReinsurance,
  formatCurrency,
  formatPercent,
} from './utils/reinsuranceEngine';
import { StreamlitHeader } from './components/StreamlitHeader';
import { StreamlitSidebar } from './components/StreamlitSidebar';
import { MetricsRow } from './components/MetricsRow';
import { WaterfallChart } from './components/WaterfallChart';
import { TreatyTowerVisualizer } from './components/TreatyTowerVisualizer';
import { ClaimLedgerTable } from './components/ClaimLedgerTable';
import { SensitivityMatrix } from './components/SensitivityMatrix';
import { ScenarioComparison } from './components/ScenarioComparison';
import { AddClaimModal } from './components/AddClaimModal';
import { TreatyEducationalGuide } from './components/TreatyEducationalGuide';
import {
  BarChart3,
  FileSpreadsheet,
  Grid3X3,
  Layers,
  BookOpen,
  Info,
  CheckCircle,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';

export default function App() {
  // Treaties configuration state
  const [treaties, setTreaties] = useState<TreatyConfig>(DEFAULT_TREATY_CONFIG);

  // Scenarios state
  const [scenarios, setScenarios] = useState<ScenarioPreset[]>(DEFAULT_SCENARIOS);
  const [activeScenarioId, setActiveScenarioId] = useState<string>(DEFAULT_SCENARIOS[0].id);

  // UI state
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'ledger' | 'sensitivity' | 'scenarios' | 'guide'>('overview');
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [notification, setNotification] = useState<string | null>(null);

  // Helper to trigger toast notification
  const notify = (msg: string) => {
    setNotification(msg);
    setTimeout(() => {
      setNotification((curr) => (curr === msg ? null : curr));
    }, 3500);
  };

  // Active scenario and its claims
  const activeScenario = useMemo(() => {
    return scenarios.find((s) => s.id === activeScenarioId) || scenarios[0];
  }, [scenarios, activeScenarioId]);

  // Recalculate summary whenever claims or treaties change
  const summary = useMemo(() => {
    return calculateReinsurance(activeScenario.claims, treaties);
  }, [activeScenario.claims, treaties]);

  // Handle claim modifications
  const handleUpdateClaimLoss = (claimId: string, newGross: number) => {
    setScenarios((prev) =>
      prev.map((sc) => {
        if (sc.id !== activeScenarioId) return sc;
        return {
          ...sc,
          claims: sc.claims.map((c) =>
            c.id === claimId ? { ...c, grossLoss: Math.max(0, newGross) } : c
          ),
        };
      })
    );
    notify(`Updated claim gross loss to ${formatCurrency(newGross)}`);
  };

  const handleDeleteClaim = (claimId: string) => {
    setScenarios((prev) =>
      prev.map((sc) => {
        if (sc.id !== activeScenarioId) return sc;
        return {
          ...sc,
          claims: sc.claims.filter((c) => c.id !== claimId),
        };
      })
    );
    notify('Claim removed from scenario');
  };

  const handleDuplicateClaim = (claimId: string) => {
    const target = activeScenario.claims.find((c) => c.id === claimId);
    if (!target) return;

    const duplicated: Claim = {
      ...target,
      id: `CLM-DUP-${Date.now()}`,
      claimNumber: `${target.claimNumber}-COPY`,
      insuredName: `${target.insuredName} (Copy)`,
    };

    setScenarios((prev) =>
      prev.map((sc) => {
        if (sc.id !== activeScenarioId) return sc;
        return {
          ...sc,
          claims: [duplicated, ...sc.claims],
        };
      })
    );
    notify(`Duplicated claim: ${target.insuredName}`);
  };

  const handleAddClaim = (newClaim: Claim) => {
    setScenarios((prev) =>
      prev.map((sc) => {
        if (sc.id !== activeScenarioId) return sc;
        return {
          ...sc,
          claims: [newClaim, ...sc.claims],
        };
      })
    );
    notify(`Added new claim: ${newClaim.insuredName} (${formatCurrency(newClaim.grossLoss)})`);
  };

  // Generate randomized catastrophe portfolio
  const handleGenerateRandomEvent = () => {
    const perilTypes = [
      'Coastal Storm Surge',
      'Tornado Supercell Outbreak',
      'Industrial Complex Conflagration',
      'Wildfire Wind Front',
    ];
    const peril = perilTypes[Math.floor(Math.random() * perilTypes.length)];
    const count = 12 + Math.floor(Math.random() * 8);

    const generatedClaims: Claim[] = [];
    const eventId = `CAT-RND-${Date.now()}`;

    const sampleLobs: Claim['lob'][] = [
      'Commercial Property',
      'Industrial Plant',
      'Residential High-Value',
      'Warehouse & Logistics',
      'Energy & Marine',
    ];

    for (let i = 1; i <= count; i++) {
      // Create a Pareto-like realistic distribution: several small, some medium, 2-3 big ones
      let gross = 0;
      const rand = Math.random();
      if (rand < 0.6) {
        gross = Math.floor(15000 + Math.random() * 45000); // $15k - $60k
      } else if (rand < 0.9) {
        gross = Math.floor(70000 + Math.random() * 150000); // $70k - $220k
      } else {
        gross = Math.floor(300000 + Math.random() * 600000); // $300k - $900k
      }

      generatedClaims.push({
        id: `CLM-GEN-${i}-${Date.now()}`,
        claimNumber: `CLM-SIM-${100 + i}`,
        policyNumber: `POL-SIM-${1000 + i}`,
        insuredName: `Simulated Asset #${i} (${sampleLobs[i % sampleLobs.length]})`,
        lob: sampleLobs[i % sampleLobs.length],
        location: `Region Zone ${String.fromCharCode(65 + (i % 6))}`,
        grossLoss: gross,
        eventId,
        eventName: `${peril} Simulation`,
        eventDate: '2026-10-26',
      });
    }

    const newScenario: ScenarioPreset = {
      id: `random-${Date.now()}`,
      title: `${peril} (${count} Claims)`,
      category: 'Catastrophe',
      description: `Auto-generated realistic disaster simulation consisting of ${count} diverse commercial and residential claims.`,
      claims: generatedClaims,
    };

    setScenarios((prev) => [newScenario, ...prev]);
    setActiveScenarioId(newScenario.id);
    notify(`Generated new scenario with ${count} claims! Total gross: ${formatCurrency(generatedClaims.reduce((s, c) => s + c.grossLoss, 0))}`);
  };

  const handleSelectScenario = (id: string) => {
    setActiveScenarioId(id);
    const target = scenarios.find((s) => s.id === id);
    if (target) {
      notify(`Switched to scenario: ${target.title}`);
    }
  };

  const handleResetTreaties = () => {
    setTreaties(DEFAULT_TREATY_CONFIG);
    notify('Reset treaties to default: 80% QS, $40K Risk XOL, $2M Cat XOL (xs $200K)');
  };

  return (
    <div className="min-h-screen bg-[#fafbfc] text-[#31333f] flex flex-col font-sans">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed bottom-4 right-4 z-50 bg-slate-900 text-white text-xs px-4 py-2.5 rounded-lg shadow-xl border border-slate-700 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Streamlit Top Header */}
      <StreamlitHeader
        scenarios={scenarios}
        activeScenarioId={activeScenarioId}
        onSelectScenario={handleSelectScenario}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        isSidebarOpen={isSidebarOpen}
        onOpenAddModal={() => setIsAddModalOpen(true)}
        onGenerateRandomEvent={handleGenerateRandomEvent}
      />

      {/* Main Workspace Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Streamlit Sidebar */}
        <StreamlitSidebar
          treaties={treaties}
          onUpdateTreaties={setTreaties}
          isOpen={isSidebarOpen}
          onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        />

        {/* Content Pane */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 max-w-7xl mx-auto w-full">
          {/* Active Scenario Title Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-200">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-200 text-slate-800">
                  {activeScenario.category}
                </span>
                <h2 className="text-lg font-bold text-slate-900">
                  {activeScenario.title}
                </h2>
              </div>
              <p className="text-xs text-slate-500 mt-1 max-w-3xl">
                {activeScenario.description}
              </p>
            </div>

            {/* Quick treaty reminder pill */}
            <div className="flex items-center gap-2 self-start sm:self-center bg-white px-3 py-1.5 rounded-md border border-slate-200 text-xs shadow-2xs">
              <span className="text-slate-400">Structure:</span>
              <span className="font-mono font-bold text-blue-600">
                {treaties.quotaShare.retentionPercent}% QS
              </span>
              <span className="text-slate-300">•</span>
              <span className="font-mono font-bold text-amber-600">
                {formatCurrency(treaties.riskXol.limit)} Risk
              </span>
              <span className="text-slate-300">•</span>
              <span className="font-mono font-bold text-indigo-600">
                {formatCurrency(treaties.catXol.limit)} Cat
              </span>
            </div>
          </div>

          {/* KPI Metrics Row */}
          <MetricsRow summary={summary} />

          {/* Streamlit Tabs Navigation */}
          <div className="border-b border-slate-200 mb-6 flex items-center gap-1 sm:gap-2 overflow-x-auto text-xs font-semibold">
            <button
              onClick={() => setActiveTab('overview')}
              className={`pb-2.5 px-3 border-b-2 flex items-center gap-1.5 transition whitespace-nowrap ${
                activeTab === 'overview'
                  ? 'border-[#ff4b4b] text-[#ff4b4b]'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Loss Waterfall & Towers</span>
            </button>

            <button
              onClick={() => setActiveTab('ledger')}
              className={`pb-2.5 px-3 border-b-2 flex items-center gap-1.5 transition whitespace-nowrap ${
                activeTab === 'ledger'
                  ? 'border-[#ff4b4b] text-[#ff4b4b]'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Claim-by-Claim Ledger ({summary.claimsCount})</span>
            </button>

            <button
              onClick={() => setActiveTab('sensitivity')}
              className={`pb-2.5 px-3 border-b-2 flex items-center gap-1.5 transition whitespace-nowrap ${
                activeTab === 'sensitivity'
                  ? 'border-[#ff4b4b] text-[#ff4b4b]'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <Grid3X3 className="w-4 h-4" />
              <span>Sensitivity Matrix (What-If)</span>
            </button>

            <button
              onClick={() => setActiveTab('scenarios')}
              className={`pb-2.5 px-3 border-b-2 flex items-center gap-1.5 transition whitespace-nowrap ${
                activeTab === 'scenarios'
                  ? 'border-[#ff4b4b] text-[#ff4b4b]'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Cross-Scenario Comparison</span>
            </button>

            <button
              onClick={() => setActiveTab('guide')}
              className={`pb-2.5 px-3 border-b-2 flex items-center gap-1.5 transition whitespace-nowrap ${
                activeTab === 'guide'
                  ? 'border-[#ff4b4b] text-[#ff4b4b]'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Actuarial Guide & Terminology</span>
            </button>
          </div>

          {/* Tab 1: Overview & Waterfall */}
          {activeTab === 'overview' && (
            <div>
              <WaterfallChart summary={summary} />
              <TreatyTowerVisualizer treaties={treaties} summary={summary} />
            </div>
          )}

          {/* Tab 2: Claim Ledger */}
          {activeTab === 'ledger' && (
            <ClaimLedgerTable
              claimBreakdowns={summary.claimBreakdowns}
              onAddClaim={() => setIsAddModalOpen(true)}
              onUpdateClaimLoss={handleUpdateClaimLoss}
              onDeleteClaim={handleDeleteClaim}
              onDuplicateClaim={handleDuplicateClaim}
            />
          )}

          {/* Tab 3: Sensitivity Matrix */}
          {activeTab === 'sensitivity' && (
            <SensitivityMatrix
              claims={activeScenario.claims}
              treaties={treaties}
              onApplyTreatyConfig={(newConfig) => {
                setTreaties(newConfig);
                notify(
                  `Applied Treaty Structure: ${newConfig.quotaShare.retentionPercent}% QS & ${formatCurrency(newConfig.catXol.limit)} Cat Limit`
                );
              }}
            />
          )}

          {/* Tab 4: Scenario Comparison */}
          {activeTab === 'scenarios' && (
            <ScenarioComparison
              scenarios={scenarios}
              activeScenarioId={activeScenarioId}
              treaties={treaties}
              onSelectScenario={handleSelectScenario}
            />
          )}

          {/* Tab 5: Educational Guide */}
          {activeTab === 'guide' && <TreatyEducationalGuide />}
        </main>
      </div>

      {/* Add Claim Modal */}
      <AddClaimModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddClaim={handleAddClaim}
        activeEventName={activeScenario.title}
        activeEventId={activeScenario.claims[0]?.eventId || 'EVENT-ACTIVE'}
      />
    </div>
  );
}
