import React, { useState } from 'react';
import {
  Shield,
  Layers,
  Zap,
  Sliders,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Info,
  HelpCircle,
  FileSpreadsheet,
  Settings2,
  Workflow,
  Sparkles,
} from 'lucide-react';
import { TreatyConfig, InuringOrder } from '../types/reinsurance';
import { DEFAULT_TREATY_CONFIG, formatCurrency } from '../utils/reinsuranceEngine';

interface StreamlitSidebarProps {
  treaties: TreatyConfig;
  onUpdateTreaties: (newTreaties: TreatyConfig) => void;
  isOpen: boolean;
  onToggle: () => void;
  onOpenQuickScenario?: (presetId: string) => void;
}

export const StreamlitSidebar: React.FC<StreamlitSidebarProps> = ({
  treaties,
  onUpdateTreaties,
  isOpen,
  onToggle,
}) => {
  const [qsExpanded, setQsExpanded] = useState(true);
  const [riskExpanded, setRiskExpanded] = useState(true);
  const [catExpanded, setCatExpanded] = useState(true);
  const [aslExpanded, setAslExpanded] = useState(true);
  const [inuringExpanded, setInuringExpanded] = useState(false);

  const updateQuotaShare = (fields: Partial<TreatyConfig['quotaShare']>) => {
    onUpdateTreaties({
      ...treaties,
      quotaShare: { ...treaties.quotaShare, ...fields },
    });
  };

  const updateRiskXol = (fields: Partial<TreatyConfig['riskXol']>) => {
    onUpdateTreaties({
      ...treaties,
      riskXol: { ...treaties.riskXol, ...fields },
    });
  };

  const updateCatXol = (fields: Partial<TreatyConfig['catXol']>) => {
    onUpdateTreaties({
      ...treaties,
      catXol: { ...treaties.catXol, ...fields },
    });
  };

  const updateAggregateStopLoss = (fields: Partial<TreatyConfig['aggregateStopLoss']>) => {
    onUpdateTreaties({
      ...treaties,
      aggregateStopLoss: { ...treaties.aggregateStopLoss, ...fields },
    });
  };

  const setInuringOrder = (order: InuringOrder) => {
    onUpdateTreaties({
      ...treaties,
      inuringOrder: order,
    });
  };

  const resetToDefaultTreaties = () => {
    onUpdateTreaties(JSON.parse(JSON.stringify(DEFAULT_TREATY_CONFIG)));
  };

  if (!isOpen) {
    return (
      <button
        onClick={onToggle}
        title="Open Sidebar"
        className="fixed top-16 left-2 z-40 p-2.5 bg-white border border-slate-200 rounded-lg shadow-md hover:bg-slate-50 text-slate-700 transition-all flex items-center gap-1.5 text-xs font-semibold"
      >
        <Sliders className="w-4 h-4 text-[#ff4b4b]" />
        <span>Treaty Controls</span>
      </button>
    );
  }

  return (
    <aside className="w-80 sm:w-88 shrink-0 bg-[#f8f9fb] border-r border-[#e6e9ef] flex flex-col h-full overflow-hidden transition-all text-slate-800">
      {/* Sidebar Header */}
      <div className="p-4 border-b border-[#e6e9ef] bg-white flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded bg-[#ff4b4b]/10 text-[#ff4b4b] flex items-center justify-center font-bold">
            <Sliders className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 tracking-tight">Treaty Architecture</h2>
            <p className="text-[11px] text-slate-500 font-mono">Streamlit Parameters</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={resetToDefaultTreaties}
            title="Reset to User Defaults (80% QS, 40K Risk, 2M Cat)"
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onToggle}
            title="Collapse Sidebar"
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded transition"
          >
            <span className="text-xs font-mono font-bold">✕</span>
          </button>
        </div>
      </div>

      {/* Sidebar Scrollable Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Quick Actuarial Info Banner */}
        <div className="p-3 bg-blue-50/70 border border-blue-200/80 rounded-md text-[11px] text-blue-900 leading-relaxed">
          <div className="font-semibold flex items-center gap-1 mb-1 text-blue-950">
            <Info className="w-3.5 h-3.5 text-blue-600" />
            <span>Assumed Reinsurance Structure (Currency: Omani Rial ﷼/&#x20c4;)</span>
          </div>
          <ul className="list-disc pl-4 space-y-0.5 text-blue-800">
            <li><b>Quota Share:</b> 80% Retention (20% Ceded)</li>
            <li><b>Risk XOL:</b> Limit {formatCurrency(40000)} per risk</li>
            <li><b>Cat XOL:</b> Limit {formatCurrency(2000000)} xs {formatCurrency(200000)}</li>
            <li><b>Aggregate Stop-Loss:</b> Limit {formatCurrency(treaties.aggregateStopLoss?.limit || 600000)} xs {formatCurrency(treaties.aggregateStopLoss?.attachmentPoint || 400000)}</li>
          </ul>
        </div>

        {/* 1. QUOTA SHARE TREATY SECTION */}
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-xs">
          <div
            onClick={() => setQsExpanded(!qsExpanded)}
            className="p-3 bg-slate-50 flex items-center justify-between cursor-pointer hover:bg-slate-100/80 transition"
          >
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                1. Quota Share (Proportional)
              </span>
            </div>
            {qsExpanded ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
          </div>

          {qsExpanded && (
            <div className="p-3.5 space-y-3.5 text-xs">
              {/* Enable Toggle */}
              <div className="flex items-center justify-between">
                <label className="text-slate-700 font-medium cursor-pointer" htmlFor="qs-toggle">
                  Enable Quota Share Treaty
                </label>
                <input
                  id="qs-toggle"
                  type="checkbox"
                  checked={treaties.quotaShare.enabled}
                  onChange={(e) => updateQuotaShare({ enabled: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer accent-blue-600"
                />
              </div>

              {treaties.quotaShare.enabled && (
                <>
                  {/* Retention Slider */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-slate-600">
                      <span className="font-medium">Company Retention %</span>
                      <span className="font-mono font-bold text-blue-600 text-sm">
                        {treaties.quotaShare.retentionPercent}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="5"
                      value={treaties.quotaShare.retentionPercent}
                      onChange={(e) => updateQuotaShare({ retentionPercent: Number(e.target.value) })}
                      className="w-full accent-blue-600 cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                      <span>0% (Full Cession)</span>
                      <span>80% (Default)</span>
                      <span>100% (No QS)</span>
                    </div>
                  </div>

                  {/* Derived Cession readout */}
                  <div className="p-2.5 bg-blue-50/50 border border-blue-100 rounded flex items-center justify-between text-slate-700 font-mono text-[11px]">
                    <span className="text-slate-500">Ceded to QS Reinsurer:</span>
                    <span className="font-bold text-blue-700">
                      {100 - treaties.quotaShare.retentionPercent}%
                    </span>
                  </div>

                  {/* Ceding Commission */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-slate-600 flex items-center gap-1">
                      <span>Ceding Commission %</span>
                      <span title="Commission paid by reinsurer to primary insurer for acquisition costs">
                        <HelpCircle className="w-3 h-3 text-slate-400" />
                      </span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="50"
                      step="1"
                      value={treaties.quotaShare.cedingCommissionPercent}
                      onChange={(e) =>
                        updateQuotaShare({ cedingCommissionPercent: Math.max(0, Number(e.target.value)) })
                      }
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded font-mono text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* 2. WORKING RISK XOL TREATY SECTION */}
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-xs">
          <div
            onClick={() => setRiskExpanded(!riskExpanded)}
            className="p-3 bg-slate-50 flex items-center justify-between cursor-pointer hover:bg-slate-100/80 transition"
          >
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                2. Working Risk XOL (Per Risk)
              </span>
            </div>
            {riskExpanded ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
          </div>

          {riskExpanded && (
            <div className="p-3.5 space-y-3.5 text-xs">
              {/* Enable Toggle */}
              <div className="flex items-center justify-between">
                <label className="text-slate-700 font-medium cursor-pointer" htmlFor="risk-toggle">
                  Enable Risk XOL Treaty
                </label>
                <input
                  id="risk-toggle"
                  type="checkbox"
                  checked={treaties.riskXol.enabled}
                  onChange={(e) => updateRiskXol({ enabled: e.target.checked })}
                  className="w-4 h-4 text-amber-600 rounded border-slate-300 focus:ring-amber-500 cursor-pointer accent-amber-600"
                />
              </div>

              {treaties.riskXol.enabled && (
                <>
                  {/* Risk XOL Limit (User specified 40K) */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-slate-600">
                      <span className="font-medium">Treaty Limit per Risk</span>
                      <span className="font-mono font-bold text-amber-700 text-sm">
                        {formatCurrency(treaties.riskXol.limit)}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="5000"
                      max="150000"
                      step="5000"
                      value={treaties.riskXol.limit}
                      onChange={(e) => updateRiskXol({ limit: Number(e.target.value) })}
                      className="w-full accent-amber-600 cursor-pointer"
                    />
                    <div className="flex gap-1.5 mt-1">
                      {[20000, 40000, 60000, 100000].map((preset) => (
                        <button
                          key={preset}
                          onClick={() => updateRiskXol({ limit: preset })}
                          className={`px-2 py-0.5 rounded text-[10px] font-mono border transition ${
                            treaties.riskXol.limit === preset
                              ? 'bg-amber-100 border-amber-300 text-amber-900 font-bold'
                              : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          ${preset / 1000}k {preset === 40000 ? '(Default)' : ''}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Attachment Point (Cedant Retention) */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-slate-600 flex items-center justify-between">
                      <span>Attachment Point (Deductible)</span>
                      <span className="font-mono font-semibold text-slate-800">
                        {formatCurrency(treaties.riskXol.attachmentPoint)}
                      </span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100000"
                      step="5000"
                      value={treaties.riskXol.attachmentPoint}
                      onChange={(e) =>
                        updateRiskXol({ attachmentPoint: Math.max(0, Number(e.target.value)) })
                      }
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded font-mono text-xs focus:ring-1 focus:ring-amber-500 focus:outline-none"
                    />
                  </div>

                  {/* Coverage Span Banner */}
                  <div className="p-2 bg-amber-50/70 border border-amber-200 rounded text-[11px] text-amber-900">
                    <span className="font-semibold">Structure:</span>{' '}
                    {formatCurrency(treaties.riskXol.limit)} xs{' '}
                    {formatCurrency(treaties.riskXol.attachmentPoint)}
                    <div className="text-[10px] text-amber-800 mt-0.5 font-mono">
                      Covers losses from {formatCurrency(treaties.riskXol.attachmentPoint)} to{' '}
                      {formatCurrency(treaties.riskXol.attachmentPoint + treaties.riskXol.limit)} per risk.
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* 3. CATASTROPHE XOL TREATY SECTION */}
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-xs">
          <div
            onClick={() => setCatExpanded(!catExpanded)}
            className="p-3 bg-slate-50 flex items-center justify-between cursor-pointer hover:bg-slate-100/80 transition"
          >
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-600"></span>
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                3. Catastrophe XOL (Per Event)
              </span>
            </div>
            {catExpanded ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
          </div>

          {catExpanded && (
            <div className="p-3.5 space-y-3.5 text-xs">
              {/* Enable Toggle */}
              <div className="flex items-center justify-between">
                <label className="text-slate-700 font-medium cursor-pointer" htmlFor="cat-toggle">
                  Enable Cat XOL Treaty
                </label>
                <input
                  id="cat-toggle"
                  type="checkbox"
                  checked={treaties.catXol.enabled}
                  onChange={(e) => updateCatXol({ enabled: e.target.checked })}
                  className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer accent-indigo-600"
                />
              </div>

              {treaties.catXol.enabled && (
                <>
                  {/* Cat XOL Limit (User specified 200000K - 2 million) */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-slate-600">
                      <span className="font-medium">Cat Limit per Event</span>
                      <span className="font-mono font-bold text-indigo-700 text-sm">
                        {formatCurrency(treaties.catXol.limit)}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="200000"
                      max="4000000"
                      step="100000"
                      value={treaties.catXol.limit}
                      onChange={(e) => updateCatXol({ limit: Number(e.target.value) })}
                      className="w-full accent-indigo-600 cursor-pointer"
                    />
                    <div className="flex gap-1 mt-1 flex-wrap">
                      {[1000000, 1500000, 2000000, 3000000].map((preset) => (
                        <button
                          key={preset}
                          onClick={() => updateCatXol({ limit: preset })}
                          className={`px-2 py-0.5 rounded text-[10px] font-mono border transition ${
                            treaties.catXol.limit === preset
                              ? 'bg-indigo-100 border-indigo-300 text-indigo-900 font-bold'
                              : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          ${(preset / 1000000).toFixed(1)}M {preset === 2000000 ? '(Prompt)' : ''}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Attachment Point / Retention */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-slate-600 flex items-center justify-between">
                      <span>Event Attachment / Deductible</span>
                      <span className="font-mono font-semibold text-slate-800">
                        {formatCurrency(treaties.catXol.attachmentPoint)}
                      </span>
                    </label>
                    <input
                      type="number"
                      min="50000"
                      max="1000000"
                      step="25000"
                      value={treaties.catXol.attachmentPoint}
                      onChange={(e) =>
                        updateCatXol({ attachmentPoint: Math.max(0, Number(e.target.value)) })
                      }
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded font-mono text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>

                  {/* Cedant Co-Participation */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-slate-600 text-[11px]">
                      <span>Cedant Co-Participation in Layer</span>
                      <span className="font-mono font-bold text-slate-800">
                        {treaties.catXol.cedantCoParticipation}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="20"
                      step="1"
                      value={treaties.catXol.cedantCoParticipation}
                      onChange={(e) =>
                        updateCatXol({ cedantCoParticipation: Number(e.target.value) })
                      }
                      className="w-full accent-indigo-600 cursor-pointer"
                    />
                  </div>

                  {/* Two Risk Warranty */}
                  <div className="flex items-center justify-between pt-1">
                    <label className="text-slate-700 text-[11px] font-medium cursor-pointer" htmlFor="two-risk">
                      Two-Risk Warranty (Min 2 risks)
                    </label>
                    <input
                      id="two-risk"
                      type="checkbox"
                      checked={treaties.catXol.twoRiskWarranty}
                      onChange={(e) => updateCatXol({ twoRiskWarranty: e.target.checked })}
                      className="w-3.5 h-3.5 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer accent-indigo-600"
                    />
                  </div>

                  {/* Coverage Summary Box */}
                  <div className="p-2 bg-indigo-50/70 border border-indigo-200 rounded text-[11px] text-indigo-900">
                    <span className="font-semibold">Layer Coverage:</span>{' '}
                    {formatCurrency(treaties.catXol.limit)} xs{' '}
                    {formatCurrency(treaties.catXol.attachmentPoint)}
                    <div className="text-[10px] text-indigo-800 mt-0.5 font-mono">
                      Attaches at {formatCurrency(treaties.catXol.attachmentPoint)}; tops out at{' '}
                      {formatCurrency(treaties.catXol.attachmentPoint + treaties.catXol.limit)}.
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* 4. AGGREGATE STOP-LOSS TREATY SECTION */}
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-xs">
          <div
            onClick={() => setAslExpanded(!aslExpanded)}
            className="p-3 bg-slate-50 flex items-center justify-between cursor-pointer hover:bg-slate-100/80 transition"
          >
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-teal-500"></span>
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                4. Aggregate Stop-Loss (ASL)
              </span>
            </div>
            {aslExpanded ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
          </div>

          {aslExpanded && (
            <div className="p-3.5 space-y-3.5 text-xs">
              {/* Enable Toggle */}
              <div className="flex items-center justify-between">
                <label className="text-slate-700 font-medium cursor-pointer" htmlFor="asl-toggle">
                  Enable Aggregate Stop-Loss
                </label>
                <input
                  id="asl-toggle"
                  type="checkbox"
                  checked={treaties.aggregateStopLoss?.enabled ?? true}
                  onChange={(e) => updateAggregateStopLoss({ enabled: e.target.checked })}
                  className="w-4 h-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500 cursor-pointer accent-teal-600"
                />
              </div>

              {treaties.aggregateStopLoss?.enabled && (
                <>
                  {/* ASL Limit */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-slate-600">
                      <span className="font-medium">Stop-Loss Limit</span>
                      <span className="font-mono font-bold text-teal-700 text-sm">
                        {formatCurrency(treaties.aggregateStopLoss.limit)}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="100000"
                      max="2000000"
                      step="50000"
                      value={treaties.aggregateStopLoss.limit}
                      onChange={(e) => updateAggregateStopLoss({ limit: Number(e.target.value) })}
                      className="w-full accent-teal-600 cursor-pointer"
                    />
                    <div className="flex gap-1 mt-1 flex-wrap">
                      {[300000, 500000, 600000, 1000000].map((preset) => (
                        <button
                          key={preset}
                          onClick={() => updateAggregateStopLoss({ limit: preset })}
                          className={`px-2 py-0.5 rounded text-[10px] font-mono border transition ${
                            treaties.aggregateStopLoss.limit === preset
                              ? 'bg-teal-100 border-teal-300 text-teal-900 font-bold'
                              : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          {formatCurrency(preset)} {preset === 600000 ? '(Default)' : ''}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Attachment Point / Deductible */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-slate-600 flex items-center justify-between">
                      <span>Portfolio Attachment Deductible</span>
                      <span className="font-mono font-semibold text-slate-800">
                        {formatCurrency(treaties.aggregateStopLoss.attachmentPoint)}
                      </span>
                    </label>
                    <input
                      type="number"
                      min="50000"
                      max="1500000"
                      step="25000"
                      value={treaties.aggregateStopLoss.attachmentPoint}
                      onChange={(e) =>
                        updateAggregateStopLoss({ attachmentPoint: Math.max(0, Number(e.target.value)) })
                      }
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded font-mono text-xs focus:ring-1 focus:ring-teal-500 focus:outline-none"
                    />
                  </div>

                  {/* Cedant Co-Participation */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-slate-600 text-[11px]">
                      <span>Cedant Co-Participation in ASL Layer</span>
                      <span className="font-mono font-bold text-slate-800">
                        {treaties.aggregateStopLoss.cedantCoParticipation}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="20"
                      step="1"
                      value={treaties.aggregateStopLoss.cedantCoParticipation}
                      onChange={(e) =>
                        updateAggregateStopLoss({ cedantCoParticipation: Number(e.target.value) })
                      }
                      className="w-full accent-teal-600 cursor-pointer"
                    />
                  </div>

                  {/* Coverage Summary Box */}
                  <div className="p-2 bg-teal-50/70 border border-teal-200 rounded text-[11px] text-teal-900">
                    <span className="font-semibold">Portfolio Cap:</span>{' '}
                    {formatCurrency(treaties.aggregateStopLoss.limit)} xs{' '}
                    {formatCurrency(treaties.aggregateStopLoss.attachmentPoint)}
                    <div className="text-[10px] text-teal-800 mt-0.5 font-mono">
                      Attaches once cumulative net retained losses hit{' '}
                      {formatCurrency(treaties.aggregateStopLoss.attachmentPoint)}; protects up to{' '}
                      {formatCurrency(treaties.aggregateStopLoss.attachmentPoint + treaties.aggregateStopLoss.limit)}.
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* 5. INURING PRIORITY ARCHITECTURE */}
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-xs">
          <div
            onClick={() => setInuringExpanded(!inuringExpanded)}
            className="p-3 bg-slate-50 flex items-center justify-between cursor-pointer hover:bg-slate-100/80 transition"
          >
            <div className="flex items-center gap-2">
              <Workflow className="w-4 h-4 text-slate-700" />
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                5. Inuring Cascade Order
              </span>
            </div>
            {inuringExpanded ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
          </div>

          {inuringExpanded && (
            <div className="p-3.5 space-y-2.5 text-xs">
              <label
                onClick={() => setInuringOrder('QS_FIRST')}
                className={`p-2.5 border rounded-md flex items-start gap-2.5 cursor-pointer transition ${
                  treaties.inuringOrder === 'QS_FIRST'
                    ? 'border-blue-500 bg-blue-50/50 text-blue-900'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <input
                  type="radio"
                  name="inuring-order"
                  checked={treaties.inuringOrder === 'QS_FIRST'}
                  onChange={() => setInuringOrder('QS_FIRST')}
                  className="mt-0.5 accent-blue-600"
                />
                <div>
                  <div className="font-semibold text-xs">Quota Share Inures First (Standard)</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Gross Claim → QS applies (20% ceded) → Net of QS fed into Risk XOL → Cat XOL.
                  </div>
                </div>
              </label>

              <label
                onClick={() => setInuringOrder('RISK_XOL_FIRST')}
                className={`p-2.5 border rounded-md flex items-start gap-2.5 cursor-pointer transition ${
                  treaties.inuringOrder === 'RISK_XOL_FIRST'
                    ? 'border-amber-500 bg-amber-50/50 text-amber-900'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <input
                  type="radio"
                  name="inuring-order"
                  checked={treaties.inuringOrder === 'RISK_XOL_FIRST'}
                  onChange={() => setInuringOrder('RISK_XOL_FIRST')}
                  className="mt-0.5 accent-amber-600"
                />
                <div>
                  <div className="font-semibold text-xs">Risk XOL Inures First</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Gross Claim → Risk XOL applied on gross → Remaining balance split with Quota Share.
                  </div>
                </div>
              </label>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};
