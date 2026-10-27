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
  Download,
  ShieldAlert,
  BookmarkPlus,
  Upload,
  FileSpreadsheet,
} from 'lucide-react';

interface StreamlitHeaderProps {
  scenarios: ScenarioPreset[];
  activeScenarioId: string;
  onSelectScenario: (scenarioId: string) => void;
  onToggleSidebar: () => void;
  isSidebarOpen: boolean;
  onOpenAddModal: () => void;
  onOpenBulkUploadModal?: () => void;
  onGenerateRandomEvent: () => void;
  onGenerateWorstCase: () => void;
  onExportPdf: () => void;
  isExportingPdf?: boolean;
  onExportCsv?: () => void;
  onOpenSaveModal?: () => void;
  onResetScenarios?: () => void;
  lastSavedTime?: string | null;
}

export const StreamlitHeader: React.FC<StreamlitHeaderProps> = ({
  scenarios,
  activeScenarioId,
  onSelectScenario,
  onToggleSidebar,
  isSidebarOpen,
  onOpenAddModal,
  onOpenBulkUploadModal,
  onGenerateRandomEvent,
  onGenerateWorstCase,
  onExportPdf,
  isExportingPdf = false,
  onExportCsv,
  onOpenSaveModal,
  onResetScenarios,
  lastSavedTime,
}) => {
  const activeScenario = scenarios.find((s) => s.id === activeScenarioId);

  return (
    <header className="bg-white border-b border-[#e6e9ef] sticky top-0 z-30">
      {/* Actuarial Executive Accent Bar */}
      <div className="h-1 w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-600"></div>

      <div className="px-4 sm:px-6 py-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* App Title & Branding */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            title={isSidebarOpen ? 'Collapse Treaty Sidebar' : 'Expand Treaty Sidebar'}
            className="p-1.5 rounded-md hover:bg-slate-100 text-slate-600 transition border border-slate-200 cursor-pointer"
          >
            <Sliders className="w-4 h-4 text-indigo-600" />
          </button>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
                <span>Reinsurance Recovery Simulator</span>
              </h1>
              <span className="text-[10px] font-mono font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded-full">
                Multi-Line Actuarial Engine
              </span>
            </div>
            <p className="text-xs text-slate-500 hidden sm:block">
              Currency: Omani Rial (&#x20c4;) • LOBs: Motor, P&C Lines, Medical Lines & Group Life • 80% QS • &#x20c4; 40K Risk XOL • &#x20c4; 2M Cat XOL • Stop-Loss (ASL)
            </p>
          </div>
        </div>

        {/* Right Action Bar: Scenario Selector & Quick Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* LocalStorage Sync Badge */}
          <div
            className="hidden xl:flex items-center gap-1.5 px-2 py-1 rounded-md bg-slate-50 border border-slate-200 text-[10px] text-slate-500 font-mono"
            title={`Scenarios are saved to browser LocalStorage automatically.${lastSavedTime ? ` Last synced: ${lastSavedTime}` : ''}`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>LocalStorage</span>
          </div>

          {/* Scenario Selectbox */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-md px-2.5 py-1">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider font-mono">
              Scenario:
            </span>
            <select
              value={activeScenarioId}
              onChange={(e) => onSelectScenario(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer pr-2 max-w-[200px] sm:max-w-xs truncate"
            >
              {scenarios.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.isCustom ? `★ [Custom] ${s.title}` : s.title}
                </option>
              ))}
            </select>
          </div>

          {/* Save As Custom Scenario Preset */}
          {onOpenSaveModal && (
            <button
              onClick={onOpenSaveModal}
              className="px-2.5 py-1.5 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 text-indigo-700 rounded-md text-xs font-semibold shadow-2xs flex items-center gap-1.5 transition cursor-pointer"
              title="Save current modified claims as a permanent custom scenario preset in LocalStorage"
            >
              <BookmarkPlus className="w-3.5 h-3.5 text-indigo-600" />
              <span className="hidden sm:inline">Save Preset</span>
            </button>
          )}

          {/* Export PDF Report Button */}
          <button
            onClick={onExportPdf}
            disabled={isExportingPdf}
            className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-xs font-semibold shadow-xs flex items-center gap-1.5 transition disabled:opacity-50 cursor-pointer"
            title="Download executive PDF summary and waterfall report"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>{isExportingPdf ? 'Exporting...' : 'Export PDF'}</span>
          </button>

          {/* Export CSV Ledger Button */}
          {onExportCsv && (
            <button
              onClick={onExportCsv}
              className="px-2.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-md text-xs font-semibold shadow-xs flex items-center gap-1.5 transition cursor-pointer"
              title="Download full claim ledger with Gross, QS, Risk XOL, Cat XOL, ASL, and Net breakdown to CSV"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden sm:inline">Export CSV</span>
            </button>
          )}

          {/* Bulk Upload CSV */}
          {onOpenBulkUploadModal && (
            <button
              onClick={onOpenBulkUploadModal}
              className="px-2.5 py-1.5 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 text-indigo-700 rounded-md text-xs font-semibold shadow-2xs flex items-center gap-1.5 transition cursor-pointer"
              title="Bulk upload multiple claims from a CSV file"
            >
              <Upload className="w-3.5 h-3.5 text-indigo-600" />
              <span className="hidden sm:inline">Bulk Upload</span>
            </button>
          )}

          {/* Quick Add Claim */}
          <button
            onClick={onOpenAddModal}
            className="px-2.5 py-1.5 bg-[#ff4b4b] hover:bg-[#ff3333] text-white rounded-md text-xs font-semibold shadow-xs flex items-center gap-1.5 transition cursor-pointer"
            title="Add a custom claim to the scenario"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Add Claim</span>
          </button>

          {/* Quick Random Generation */}
          <button
            onClick={onGenerateRandomEvent}
            className="px-2.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-md text-xs font-semibold shadow-xs flex items-center gap-1.5 transition cursor-pointer"
            title="Generate a randomized Catastrophe Event with varying severities"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span className="hidden sm:inline">Random Event</span>
          </button>

          {/* Worst-Case Scenario Generator (Exhaust ASL) */}
          <button
            onClick={onGenerateWorstCase}
            className="px-2.5 py-1.5 bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white rounded-md text-xs font-bold shadow-xs flex items-center gap-1.5 transition cursor-pointer border border-red-700/50"
            title="Generate an engineered worst-case disaster scenario designed to 100% exhaust the Aggregate Stop-Loss (ASL) limit"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-amber-300 shrink-0" />
            <span className="hidden sm:inline">Worst-Case (Exhaust ASL)</span>
            <span className="sm:hidden">Worst-Case</span>
          </button>
        </div>
      </div>
    </header>
  );
};
