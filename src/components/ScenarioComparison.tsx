import React from 'react';
import { ScenarioPreset, TreatyConfig } from '../types/reinsurance';
import { calculateReinsurance, formatCurrency, formatPercent } from '../utils/reinsuranceEngine';
import { Layers, ArrowRight, Play, Shield, Zap, TrendingUp, CheckCircle } from 'lucide-react';

interface ScenarioComparisonProps {
  scenarios: ScenarioPreset[];
  activeScenarioId: string;
  treaties: TreatyConfig;
  onSelectScenario: (scenarioId: string) => void;
}

export const ScenarioComparison: React.FC<ScenarioComparisonProps> = ({
  scenarios,
  activeScenarioId,
  treaties,
  onSelectScenario,
}) => {
  // Precalculate results for each scenario under current treaties
  const scenarioResults = scenarios.map((scenario) => {
    const summary = calculateReinsurance(scenario.claims, treaties);
    return {
      scenario,
      summary,
      isActive: scenario.id === activeScenarioId,
    };
  });

  return (
    <div className="space-y-6">
      {/* Intro Header */}
      <div className="st-card p-5">
        <div className="flex items-center gap-2 mb-1">
          <Layers className="w-5 h-5 text-[#ff4b4b]" />
          <h3 className="text-base font-bold text-slate-900">
            Cross-Scenario Comparative Stress Testing
          </h3>
        </div>
        <p className="text-xs text-slate-500">
          Evaluates how the current treaty parameters (80% QS retention, $40K Risk XOL, $2M Cat XOL) perform across different peril profiles and shock loss events.
        </p>
      </div>

      {/* Scenario Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {scenarioResults.map(({ scenario, summary, isActive }) => {
          return (
            <div
              key={scenario.id}
              className={`st-card p-5 flex flex-col justify-between transition-all ${
                isActive
                  ? 'ring-2 ring-[#ff4b4b] bg-slate-50/50 shadow-md'
                  : 'hover:border-slate-300'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span
                    className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded tracking-wide ${
                      scenario.category === 'Catastrophe'
                        ? 'bg-rose-100 text-rose-800'
                        : scenario.category === 'Per-Risk Shock'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {scenario.category}
                  </span>
                  {isActive && (
                    <span className="text-[10px] font-bold text-[#ff4b4b] flex items-center gap-1 font-mono">
                      <CheckCircle className="w-3.5 h-3.5" />
                      ACTIVE
                    </span>
                  )}
                </div>

                <h4 className="text-sm font-bold text-slate-900 leading-snug">{scenario.title}</h4>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">{scenario.description}</p>

                {/* Key Metrics for this scenario */}
                <div className="mt-4 space-y-2 border-t border-slate-100 pt-3 text-xs font-mono">
                  <div className="flex justify-between items-center text-slate-600">
                    <span className="font-sans text-slate-500">Gross Incurred:</span>
                    <span className="font-bold text-slate-900">{formatCurrency(summary.totalGrossLoss)}</span>
                  </div>

                  <div className="flex justify-between items-center text-blue-700 bg-blue-50/50 px-2 py-1 rounded">
                    <span className="font-sans text-blue-800">Quota Share Ceded:</span>
                    <span className="font-bold">{formatCurrency(summary.totalQsCeded)}</span>
                  </div>

                  <div className="flex justify-between items-center text-amber-700 bg-amber-50/50 px-2 py-1 rounded">
                    <span className="font-sans text-amber-800">Risk XOL Recovery:</span>
                    <span className="font-bold">{formatCurrency(summary.totalRiskXolCeded)}</span>
                  </div>

                  <div className="flex justify-between items-center text-indigo-700 bg-indigo-50/50 px-2 py-1 rounded">
                    <span className="font-sans text-indigo-800">Cat XOL Recovery:</span>
                    <span className="font-bold">{formatCurrency(summary.totalCatXolRecovery)}</span>
                  </div>

                  <div className="flex justify-between items-center text-teal-700 bg-teal-50/50 px-2 py-1 rounded">
                    <span className="font-sans text-teal-800">Stop-Loss ASL Recovery:</span>
                    <span className="font-bold">{formatCurrency(summary.totalAslRecovery || 0)}</span>
                  </div>

                  <div className="flex justify-between items-center text-slate-900 border-t border-slate-200 pt-1.5 font-bold">
                    <span className="font-sans text-slate-700">Company Net Retained:</span>
                    <span className={summary.totalNetRetained > 1000000 ? 'text-rose-700' : 'text-slate-900'}>
                      {formatCurrency(summary.totalNetRetained)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-[11px] text-slate-500 pt-0.5">
                    <span className="font-sans">Effective Cession:</span>
                    <span className="font-bold text-emerald-600">
                      {formatPercent(summary.effectiveCessionPercent)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="mt-4 pt-3 border-t border-slate-100">
                <button
                  onClick={() => onSelectScenario(scenario.id)}
                  disabled={isActive}
                  className={`w-full py-2 px-3 rounded-md text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                    isActive
                      ? 'bg-slate-100 text-slate-400 cursor-default'
                      : 'bg-white border border-slate-300 text-slate-800 hover:bg-[#ff4b4b] hover:text-white hover:border-[#ff4b4b]'
                  }`}
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>{isActive ? 'Currently Active' : 'Load into Active Workbench'}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary Comparison Table */}
      <div className="st-card p-5">
        <h4 className="text-sm font-bold text-slate-900 mb-3">All Scenarios Side-by-Side Summary</h4>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse font-mono">
            <thead>
              <tr className="bg-slate-50 text-slate-700 font-semibold uppercase text-[10px] border-b border-slate-200">
                <th className="py-2.5 px-3 font-sans">Scenario</th>
                <th className="py-2.5 px-3 text-center">Claims</th>
                <th className="py-2.5 px-3 text-right">Gross Loss</th>
                <th className="py-2.5 px-3 text-right text-blue-700">QS Ceded</th>
                <th className="py-2.5 px-3 text-right text-amber-700">Risk XOL</th>
                <th className="py-2.5 px-3 text-right text-indigo-700">Cat XOL</th>
                <th className="py-2.5 px-3 text-right text-teal-700">Stop-Loss</th>
                <th className="py-2.5 px-3 text-right text-emerald-700">Total Ceded</th>
                <th className="py-2.5 px-3 text-right text-slate-900 font-bold">Net Retained</th>
                <th className="py-2.5 px-3 text-right">Cession %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {scenarioResults.map(({ scenario, summary, isActive }) => (
                <tr
                  key={scenario.id}
                  onClick={() => onSelectScenario(scenario.id)}
                  className={`cursor-pointer hover:bg-slate-50 transition ${
                    isActive ? 'bg-blue-50/30 font-semibold' : ''
                  }`}
                >
                  <td className="py-2 px-3 font-sans font-medium text-slate-900">
                    {scenario.title}
                    {isActive && (
                      <span className="ml-1.5 text-[10px] text-[#ff4b4b] font-bold font-mono">
                        (Active)
                      </span>
                    )}
                  </td>
                  <td className="py-2 px-3 text-center text-slate-500">{summary.claimsCount}</td>
                  <td className="py-2 px-3 text-right font-bold text-slate-900">
                    {formatCurrency(summary.totalGrossLoss)}
                  </td>
                  <td className="py-2 px-3 text-right text-blue-600">{formatCurrency(summary.totalQsCeded)}</td>
                  <td className="py-2 px-3 text-right text-amber-600">{formatCurrency(summary.totalRiskXolCeded)}</td>
                  <td className="py-2 px-3 text-right text-indigo-600">{formatCurrency(summary.totalCatXolRecovery)}</td>
                  <td className="py-2 px-3 text-right text-teal-600 font-medium">
                    {formatCurrency(summary.totalAslRecovery || 0)}
                  </td>
                  <td className="py-2 px-3 text-right text-emerald-600 font-medium">
                    {formatCurrency(summary.totalReinsuranceRecovery)}
                  </td>
                  <td className="py-2 px-3 text-right text-slate-900 font-bold">
                    {formatCurrency(summary.totalNetRetained)}
                  </td>
                  <td className="py-2 px-3 text-right text-slate-700">
                    {formatPercent(summary.effectiveCessionPercent)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
