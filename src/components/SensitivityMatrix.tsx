import React, { useState } from 'react';
import { Claim, TreatyConfig } from '../types/reinsurance';
import { calculateReinsurance, formatCurrency, formatPercent } from '../utils/reinsuranceEngine';
import { Sliders, Grid3X3, ArrowRight, Gauge, Check } from 'lucide-react';

interface SensitivityMatrixProps {
  claims: Claim[];
  treaties: TreatyConfig;
  onApplyTreatyConfig: (newConfig: TreatyConfig) => void;
}

export const SensitivityMatrix: React.FC<SensitivityMatrixProps> = ({
  claims,
  treaties,
  onApplyTreatyConfig,
}) => {
  // Test variations
  const qsRetentionOptions = [70, 75, 80, 85, 90];
  const catLimitOptions = [1000000, 1500000, 2000000, 2500000, 3000000];

  const [activeMetric, setActiveMetric] = useState<'netRetained' | 'totalRecovery' | 'cessionPercent'>(
    'netRetained'
  );

  // Compute 5x5 grid
  const matrixData = qsRetentionOptions.map((qsRet) => {
    return catLimitOptions.map((catLim) => {
      const testConfig: TreatyConfig = {
        ...treaties,
        quotaShare: {
          ...treaties.quotaShare,
          retentionPercent: qsRet,
        },
        catXol: {
          ...treaties.catXol,
          limit: catLim,
        },
      };

      const result = calculateReinsurance(claims, testConfig);

      const isCurrent =
        treaties.quotaShare.retentionPercent === qsRet &&
        treaties.catXol.limit === catLim;

      return {
        qsRet,
        catLim,
        isCurrent,
        netRetained: result.totalNetRetained,
        totalRecovery: result.totalReinsuranceRecovery,
        cessionPercent: result.effectiveCessionPercent,
        config: testConfig,
      };
    });
  });

  // Calculate min and max for heatmap coloring
  const allNetValues = matrixData.flat().map((d) => d.netRetained);
  const minNet = Math.min(...allNetValues);
  const maxNet = Math.max(...allNetValues);

  const getHeatmapColor = (val: number) => {
    if (maxNet === minNet) return 'bg-slate-50 text-slate-800';
    const ratio = (val - minNet) / (maxNet - minNet); // 0 (safest/lowest net) to 1 (highest net)
    if (ratio < 0.25) return 'bg-emerald-50 text-emerald-900 border-emerald-200';
    if (ratio < 0.5) return 'bg-blue-50 text-blue-900 border-blue-200';
    if (ratio < 0.75) return 'bg-amber-50 text-amber-900 border-amber-200';
    return 'bg-rose-50 text-rose-900 border-rose-200';
  };

  return (
    <div className="st-card p-5 mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 border-b border-slate-100 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <Grid3X3 className="w-5 h-5 text-[#ff4b4b]" />
            <h3 className="text-base font-bold text-slate-800">
              Sensitivity Matrix: Quota Share Retention vs. Cat XOL Limit
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Test how combinations of Quota Share retention (80% default) and Cat XOL limit (&#x20c4; 2M default) impact net retained loss
          </p>
        </div>

        {/* Metric Selector */}
        <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
          <button
            onClick={() => setActiveMetric('netRetained')}
            className={`px-2.5 py-1 rounded-md font-medium transition ${
              activeMetric === 'netRetained'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Cedant Net Retained (&#x20c4;)
          </button>
          <button
            onClick={() => setActiveMetric('totalRecovery')}
            className={`px-2.5 py-1 rounded-md font-medium transition ${
              activeMetric === 'totalRecovery'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Reinsurance Recovery (&#x20c4;)
          </button>
          <button
            onClick={() => setActiveMetric('cessionPercent')}
            className={`px-2.5 py-1 rounded-md font-medium transition ${
              activeMetric === 'cessionPercent'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Cession Ratio (%)
          </button>
        </div>
      </div>

      {/* Matrix Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-center border-collapse text-xs">
          <thead>
            <tr>
              <th className="p-2 border border-slate-200 bg-slate-100 text-left text-slate-600 font-semibold text-[11px]">
                QS Retention \ Cat Limit
              </th>
              {catLimitOptions.map((lim) => (
                <th
                  key={lim}
                  className={`p-2 border border-slate-200 font-mono font-bold text-slate-800 text-xs ${
                    treaties.catXol.limit === lim ? 'bg-indigo-50 border-indigo-300 text-indigo-900' : 'bg-slate-50'
                  }`}
                >
                  ${(lim / 1000000).toFixed(1)}M Limit
                  {treaties.catXol.limit === lim && (
                    <span className="block text-[9px] text-indigo-600 uppercase font-sans">Active</span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {matrixData.map((row, rIdx) => {
              const qsRet = qsRetentionOptions[rIdx];
              const isCurrentRow = treaties.quotaShare.retentionPercent === qsRet;

              return (
                <tr key={qsRet}>
                  <td
                    className={`p-2 border border-slate-200 font-mono font-bold text-left text-xs ${
                      isCurrentRow ? 'bg-blue-50 border-blue-300 text-blue-900' : 'bg-slate-50 text-slate-700'
                    }`}
                  >
                    {qsRet}% Retention
                    <span className="block text-[10px] text-slate-400 font-sans font-normal">
                      ({100 - qsRet}% Ceded to QS)
                    </span>
                  </td>

                  {row.map((cell) => {
                    const colorClass = getHeatmapColor(cell.netRetained);

                    return (
                      <td
                        key={`${cell.qsRet}-${cell.catLim}`}
                        onClick={() => onApplyTreatyConfig(cell.config)}
                        title="Click to apply this treaty configuration to active simulation"
                        className={`p-2.5 border border-slate-200 cursor-pointer font-mono font-bold transition hover:scale-105 hover:z-10 relative shadow-2xs ${colorClass} ${
                          cell.isCurrent ? 'ring-2 ring-[#ff4b4b] ring-inset' : ''
                        }`}
                      >
                        {cell.isCurrent && (
                          <div className="absolute top-1 right-1">
                            <span className="w-2 h-2 rounded-full bg-[#ff4b4b] inline-block animate-pulse"></span>
                          </div>
                        )}

                        <div className="text-xs">
                          {activeMetric === 'netRetained' && formatCurrency(cell.netRetained)}
                          {activeMetric === 'totalRecovery' && formatCurrency(cell.totalRecovery)}
                          {activeMetric === 'cessionPercent' && formatPercent(cell.cessionPercent)}
                        </div>

                        <div className="text-[10px] font-sans font-normal opacity-75 mt-0.5">
                          {activeMetric === 'netRetained'
                            ? `Recov: ${formatCurrency(cell.totalRecovery)}`
                            : `Net: ${formatCurrency(cell.netRetained)}`}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Helper Legend */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-600">
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-slate-400 font-semibold uppercase">Net Retained Heatmap:</span>
          <div className="flex items-center gap-1.5 text-[11px]">
            <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-mono">Lowest Loss</span>
            <span>→</span>
            <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-mono">Medium</span>
            <span>→</span>
            <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 font-mono">Highest Retention</span>
          </div>
        </div>

        <div className="text-[11px] text-slate-500 italic">
          💡 Click any cell to immediately switch the calculator to that treaty structure!
        </div>
      </div>
    </div>
  );
};
