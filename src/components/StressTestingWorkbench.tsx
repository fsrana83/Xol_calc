import React, { useState, useMemo } from 'react';
import { Claim, TreatyConfig } from '../types/reinsurance';
import { runStressTests, ShockScenarioResult } from '../utils/stressTestEngine';
import { formatCurrency, formatPercent } from '../utils/reinsuranceEngine';
import {
  TrendingUp,
  AlertTriangle,
  Play,
  Sliders,
  ShieldAlert,
  Layers,
  ArrowRight,
  Zap,
  CheckCircle2,
} from 'lucide-react';

interface StressTestingWorkbenchProps {
  claims: Claim[];
  treaties: TreatyConfig;
  onApplyShockToScenario: (shockPercent: number) => void;
  onGenerateWorstCase?: () => void;
}

export const StressTestingWorkbench: React.FC<StressTestingWorkbenchProps> = ({
  claims,
  treaties,
  onApplyShockToScenario,
  onGenerateWorstCase,
}) => {
  const [customShock, setCustomShock] = useState<number>(25);
  const [selectedShock, setSelectedShock] = useState<number>(25);

  // Run the predefined stress test battery
  const stressResults = useMemo(() => {
    return runStressTests(claims, treaties);
  }, [claims, treaties]);

  // Run custom shock
  const customResult = useMemo(() => {
    const res = runStressTests(claims, treaties, [customShock]);
    return res[0];
  }, [claims, treaties, customShock]);

  // Find max gross for relative scaling
  const maxGross = Math.max(1, ...stressResults.map((r) => r.grossLoss));

  return (
    <div className="space-y-6">
      {/* Introduction Card */}
      <div className="st-card p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-[#ff4b4b]" />
            <h3 className="text-base font-bold text-slate-800">
              Automated Severity Stress Testing & Treaty Exhaustion Analysis
            </h3>
          </div>
          <div className="flex items-center gap-2">
            {onGenerateWorstCase && (
              <button
                onClick={onGenerateWorstCase}
                className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-[11px] font-bold transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
                title="Generate an extreme disaster scenario calibrated to 100% exhaust ASL"
              >
                <ShieldAlert className="w-3.5 h-3.5 text-amber-300" />
                <span>Exhaust ASL Scenario</span>
              </button>
            )}
            <span className="text-[11px] font-mono bg-blue-50 text-blue-800 border border-blue-200 px-2.5 py-1 rounded-md font-semibold">
              Currency: Omani Rial (&#x20c4;)
            </span>
          </div>
        </div>
        <p className="text-xs text-slate-600 leading-relaxed">
          Simulate instantaneous percentage severity shocks (+10%, +25%, +50%, +100%) to all gross incurred claims. Observe when Working Risk XOL limits blow through, Cat XOL layers get fully exhausted, and Aggregate Stop-Loss (ASL) triggers as the final capital buffer.
        </p>
      </div>

      {/* Interactive Custom Shock Slider Sandbox */}
      <div className="st-card p-5 bg-gradient-to-r from-slate-50 to-blue-50/30 border-blue-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-blue-600" />
            <h4 className="text-sm font-bold text-slate-900">Custom Scenario Stress Slider</h4>
          </div>
          <div className="flex items-center gap-2 font-mono">
            <span className="text-xs text-slate-600">Simulated Shock:</span>
            <span
              className={`px-2 py-0.5 rounded font-bold text-sm ${
                customShock > 0
                  ? 'bg-rose-100 text-rose-800'
                  : customShock < 0
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-slate-100 text-slate-800'
              }`}
            >
              {customShock >= 0 ? `+${customShock}%` : `${customShock}%`}
            </span>
          </div>
        </div>

        <div className="space-y-2">
          <input
            type="range"
            min="-50"
            max="150"
            step="5"
            value={customShock}
            onChange={(e) => setCustomShock(Number(e.target.value))}
            className="w-full accent-[#ff4b4b] cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-400 font-mono">
            <span>-50% (Favorable)</span>
            <span>-25%</span>
            <span>0% (Baseline)</span>
            <span>+25%</span>
            <span>+50% (Severe)</span>
            <span>+100% (Extreme)</span>
            <span>+150% (Hyper Shock)</span>
          </div>
        </div>

        {/* Custom Shock Live Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-4 pt-3 border-t border-slate-200/80 font-mono text-xs">
          <div className="p-2.5 bg-white rounded border border-slate-200">
            <span className="text-[10px] text-slate-500 font-sans block">Shocked Gross</span>
            <span className="font-bold text-slate-900 text-sm">
              {formatCurrency(customResult.grossLoss)}
            </span>
          </div>
          <div className="p-2.5 bg-white rounded border border-slate-200">
            <span className="text-[10px] text-blue-700 font-sans block">Quota Share Ceded</span>
            <span className="font-bold text-blue-600 text-sm">
              {formatCurrency(customResult.qsCeded)}
            </span>
          </div>
          <div className="p-2.5 bg-white rounded border border-slate-200">
            <span className="text-[10px] text-amber-800 font-sans block">Risk XOL Recovery</span>
            <span className="font-bold text-amber-600 text-sm">
              {formatCurrency(customResult.riskXolCeded)}
            </span>
          </div>
          <div className="p-2.5 bg-white rounded border border-slate-200">
            <span className="text-[10px] text-indigo-800 font-sans block">Cat XOL Recovery</span>
            <span className="font-bold text-indigo-600 text-sm">
              {formatCurrency(customResult.catXolRecovery)}
            </span>
            <span className="text-[9px] text-slate-400 block font-sans">
              Layer: {formatPercent(customResult.catXolLayerUtilizationPercent)}
            </span>
          </div>
          <div className="p-2.5 bg-white rounded border border-slate-200">
            <span className="text-[10px] text-teal-800 font-sans block">Stop-Loss (ASL)</span>
            <span className="font-bold text-teal-700 text-sm">
              {formatCurrency(customResult.aslRecovery)}
            </span>
            <span className="text-[9px] text-slate-400 block font-sans">
              Layer: {formatPercent(customResult.aslLayerUtilizationPercent)}
            </span>
          </div>
          <div className="p-2.5 bg-white rounded border border-slate-200">
            <span className="text-[10px] text-slate-700 font-sans block font-semibold">Net Retained</span>
            <span
              className={`font-bold text-sm ${
                customResult.netRetained > 1000000 ? 'text-rose-700' : 'text-slate-900'
              }`}
            >
              {formatCurrency(customResult.netRetained)}
            </span>
            <span className="text-[9px] text-slate-500 block font-sans">
              Cession: {formatPercent(customResult.cessionPercent)}
            </span>
          </div>
        </div>

        <div className="mt-3 flex justify-end">
          <button
            onClick={() => onApplyShockToScenario(customShock)}
            className="px-3 py-1.5 bg-[#ff4b4b] hover:bg-[#ff3333] text-white rounded text-xs font-semibold shadow-xs flex items-center gap-1.5 transition"
          >
            <Play className="w-3.5 h-3.5" />
            <span>Apply {customShock >= 0 ? `+${customShock}%` : `${customShock}%`} Shock as Active Scenario</span>
          </button>
        </div>
      </div>

      {/* Visual Stress Response Bars */}
      <div className="st-card p-5">
        <h4 className="text-sm font-bold text-slate-900 mb-3 flex items-center justify-between">
          <span>Gross Loss vs. Reinsurance Absorption Across Shock Battery</span>
          <span className="text-xs font-normal text-slate-500 font-mono">
            Comparing Retained Net vs Reinsurance Buffer
          </span>
        </h4>

        <div className="space-y-3 font-mono text-xs">
          {stressResults.map((result) => {
            const isBaseline = result.shockPercent === 0;
            const netPercent = result.grossLoss > 0 ? (result.netRetained / result.grossLoss) * 100 : 0;
            const recovPercent = result.grossLoss > 0 ? (result.totalRecovery / result.grossLoss) * 100 : 0;

            return (
              <div
                key={result.shockPercent}
                className={`p-3 rounded-lg border transition ${
                  isBaseline
                    ? 'bg-blue-50/40 border-blue-300 ring-1 ring-blue-300'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1.5">
                  <div className="flex items-center gap-2">
                    <span
                      className={`font-bold px-2 py-0.5 rounded text-xs ${
                        result.shockPercent > 0
                          ? 'bg-rose-100 text-rose-800'
                          : result.shockPercent < 0
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-800 text-white'
                      }`}
                    >
                      {result.shockLabel}
                    </span>
                    <span className="text-slate-800 font-bold text-sm">
                      Gross: {formatCurrency(result.grossLoss)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-emerald-700">
                      Reinsurance: <b>{formatCurrency(result.totalRecovery)}</b> ({formatPercent(recovPercent)})
                    </span>
                    <span>•</span>
                    <span className="text-slate-900 font-bold">
                      Net Retained: {formatCurrency(result.netRetained)} ({formatPercent(netPercent)})
                    </span>
                  </div>
                </div>

                {/* Proportional Absorption Stacked Bar */}
                <div className="h-5 w-full bg-slate-100 rounded-md overflow-hidden flex border border-slate-200">
                  {/* Quota Share */}
                  <div
                    style={{ width: `${(result.qsCeded / result.grossLoss) * 100}%` }}
                    className="bg-blue-500 h-full transition-all"
                    title={`Quota Share: ${formatCurrency(result.qsCeded)}`}
                  />
                  {/* Risk XOL */}
                  <div
                    style={{ width: `${(result.riskXolCeded / result.grossLoss) * 100}%` }}
                    className="bg-amber-500 h-full transition-all"
                    title={`Risk XOL: ${formatCurrency(result.riskXolCeded)}`}
                  />
                  {/* Cat XOL */}
                  <div
                    style={{ width: `${(result.catXolRecovery / result.grossLoss) * 100}%` }}
                    className="bg-indigo-600 h-full transition-all"
                    title={`Cat XOL: ${formatCurrency(result.catXolRecovery)}`}
                  />
                  {/* ASL */}
                  <div
                    style={{ width: `${(result.aslRecovery / result.grossLoss) * 100}%` }}
                    className="bg-teal-500 h-full transition-all"
                    title={`Stop-Loss ASL: ${formatCurrency(result.aslRecovery)}`}
                  />
                  {/* Cedant Net Retained */}
                  <div
                    style={{ width: `${netPercent}%` }}
                    className={`${
                      result.netRetained > 1000000 ? 'bg-rose-600' : 'bg-slate-700'
                    } h-full transition-all`}
                    title={`Cedant Net: ${formatCurrency(result.netRetained)}`}
                  />
                </div>

                {/* Treaty Status Pills */}
                <div className="mt-2 flex items-center gap-2 flex-wrap text-[10px] font-sans">
                  {result.riskXolExhaustedCount > 0 && (
                    <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-semibold font-mono">
                      {result.riskXolExhaustedCount} Risk XOL Limit Breached
                    </span>
                  )}
                  {result.catXolExhausted ? (
                    <span className="px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 font-bold font-mono">
                      Cat XOL 100% Exhausted (&#x20c4; 2M Cap Hit)
                    </span>
                  ) : result.catXolRecovery > 0 ? (
                    <span className="px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-800 font-mono">
                      Cat XOL {formatPercent(result.catXolLayerUtilizationPercent)} Utilized
                    </span>
                  ) : null}
                  {result.aslExhausted ? (
                    <span className="px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 font-bold font-mono">
                      ASL 100% Exhausted (&#x20c4; 600K Cap Hit)
                    </span>
                  ) : result.aslRecovery > 0 ? (
                    <span className="px-1.5 py-0.5 rounded bg-teal-100 text-teal-800 font-mono">
                      ASL {formatPercent(result.aslLayerUtilizationPercent)} Utilized
                    </span>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Comprehensive Stress Matrix Table */}
      <div className="st-card p-5">
        <h4 className="text-sm font-bold text-slate-900 mb-3">Comprehensive Stress Battery Ledger</h4>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse font-mono">
            <thead>
              <tr className="bg-slate-50 text-slate-700 font-semibold uppercase text-[10px] border-b border-slate-200">
                <th className="py-2.5 px-3 font-sans">Shock Level</th>
                <th className="py-2.5 px-3 text-right">Gross Loss</th>
                <th className="py-2.5 px-3 text-right text-blue-700">QS (20%)</th>
                <th className="py-2.5 px-3 text-right text-amber-700">Risk XOL</th>
                <th className="py-2.5 px-3 text-right text-indigo-700">Cat XOL</th>
                <th className="py-2.5 px-3 text-right text-teal-700">Stop-Loss ASL</th>
                <th className="py-2.5 px-3 text-right text-emerald-700">Total Ceded</th>
                <th className="py-2.5 px-3 text-right text-slate-900 font-bold">Net Retained</th>
                <th className="py-2.5 px-3 text-right">Cession %</th>
                <th className="py-2.5 px-3 text-center font-sans">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {stressResults.map((res) => {
                const isBaseline = res.shockPercent === 0;

                return (
                  <tr
                    key={res.shockPercent}
                    className={`hover:bg-slate-50 transition ${
                      isBaseline ? 'bg-blue-50/30 font-semibold' : ''
                    }`}
                  >
                    <td className="py-2.5 px-3 font-sans font-bold text-slate-900">
                      {res.shockLabel}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                      {formatCurrency(res.grossLoss)}
                    </td>
                    <td className="py-2.5 px-3 text-right text-blue-600">{formatCurrency(res.qsCeded)}</td>
                    <td className="py-2.5 px-3 text-right text-amber-600">{formatCurrency(res.riskXolCeded)}</td>
                    <td className="py-2.5 px-3 text-right text-indigo-600">{formatCurrency(res.catXolRecovery)}</td>
                    <td className="py-2.5 px-3 text-right text-teal-600">{formatCurrency(res.aslRecovery)}</td>
                    <td className="py-2.5 px-3 text-right text-emerald-600 font-medium">
                      {formatCurrency(res.totalRecovery)}
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-900 font-bold">
                      {formatCurrency(res.netRetained)}
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-700">{formatPercent(res.cessionPercent)}</td>
                    <td className="py-2.5 px-3 text-center font-sans">
                      <button
                        onClick={() => onApplyShockToScenario(res.shockPercent)}
                        className="px-2 py-0.5 bg-slate-100 hover:bg-[#ff4b4b] hover:text-white rounded text-[10px] font-semibold text-slate-700 transition"
                        title="Load this shocked loss portfolio into the active workbench"
                      >
                        Apply
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
