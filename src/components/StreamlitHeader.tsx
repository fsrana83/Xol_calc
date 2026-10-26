import React from 'react';
import { ScenarioPreset } from '../types/reinsurance';
import {
  Sliders,
  Sparkles,
  Plus,
  RefreshCw,
  FolderGit2,
  ChevronDown,
  Layers,
  Activity,
} from 'lucide-react';

interface StreamlitHeaderProps {
  scenarios: ScenarioPreset[];
  activeScenarioId: string;
  onSelectScenario: (scenarioId: string) => void;
  onToggleSidebar: () => void;
  isSidebarOpen: boolean;
  onOpenAddModal: () => void;
  onGenerateRandomEvent: () => void;
}

export const StreamlitHeader: React.FC<StreamlitHeaderProps> = ({
  scenarios,
  activeScenarioId,
  onSelectScenario,
  onToggleSidebar,
  isSidebarOpen,
  onOpenAddModal,
  onGenerateRandomEvent,
}) => {
  const activeScenario = scenarios.find((s) => s.id === activeScenarioId);

  return (
    <header className="bg-white border-b border-[#e6e9ef] sticky top-0 z-30">
      {/* Streamlit Iconic Rainbow Bar */}
      <div className="st-rainbow-header w-full"></div>

      <div className="px-4 sm:px-6 py-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* App Title & Branding */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            title={isSidebarOpen ? 'Collapse Treaty Sidebar' : 'Expand Treaty Sidebar'}
            className="p-1.5 rounded-md hover:bg-slate-100 text-slate-600 transition border border-slate-200"
          >
            <Sliders className="w-4 h-4 text-[#ff4b4b]" />
          </button>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
                <span>Reinsurance XOL & Quota Share Calculator</span>
              </h1>
              <span className="text-[10px] font-mono font-bold bg-[#ff4b4b]/10 text-[#ff4b4b] px-2 py-0.5 rounded-full">
                Streamlit UI
              </span>
            </div>
            <p className="text-xs text-slate-500 hidden sm:block">
              80% Quota Share • $40K Risk XOL • $2M Cat XOL (xs $200K) • Real-Time Cascade Simulation
            </p>
          </div>
        </div>

        {/* Right Action Bar: Scenario Selector & Quick Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Streamlit Scenario Selectbox */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-md px-2.5 py-1">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider font-mono">
              Scenario:
            </span>
            <select
              value={activeScenarioId}
              onChange={(e) => onSelectScenario(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer pr-2"
            >
              {scenarios.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title}
                </option>
              ))}
            </select>
          </div>

          {/* Quick Add Claim */}
          <button
            onClick={onOpenAddModal}
            className="px-2.5 py-1.5 bg-[#ff4b4b] hover:bg-[#ff3333] text-white rounded-md text-xs font-semibold shadow-xs flex items-center gap-1.5 transition"
            title="Add a custom claim to the scenario"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Add Claim</span>
          </button>

          {/* Quick Random Generation */}
          <button
            onClick={onGenerateRandomEvent}
            className="px-2.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-md text-xs font-semibold shadow-xs flex items-center gap-1.5 transition"
            title="Generate a randomized Catastrophe Event with varying severities"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span className="hidden sm:inline">Random Event</span>
          </button>
        </div>
      </div>
    </header>
  );
};
