import React, { useState, useMemo } from 'react';
import { Claim, TreatyConfig } from '../types/reinsurance';
import { formatCurrency, formatPercent } from '../utils/reinsuranceEngine';
import { BarChart2, Info, TrendingUp, Layers, Shield, AlertTriangle } from 'lucide-react';

interface LossDistributionHistogramProps {
  claims: Claim[];
  treaties: TreatyConfig;
}

interface HistogramBin {
  id: string;
  label: string;
  min: number;
  max: number;
  count: number;
  totalLoss: number;
  percentageCount: number;
  percentageLoss: number;
  claims: Claim[];
  statusColor: string;
  statusBadge: string;
}

export const LossDistributionHistogram: React.FC<LossDistributionHistogramProps> = ({
  claims,
  treaties,
}) => {
  const [binMode, setBinMode] = useState<'actuarial' | 'equal'>('actuarial');
  const [metricView, setMetricView] = useState<'count' | 'loss'>('count');
  const [hoveredBin, setHoveredBin] = useState<HistogramBin | null>(null);

  // Treaties markers
  const riskAttach = treaties.riskXol.attachmentPoint;
  const riskLimit = treaties.riskXol.limit;
  const riskCeiling = riskAttach + riskLimit; // e.g. 10k + 40k = 50k
  const catAttach = treaties.catXol.attachmentPoint; // e.g. 200k

  // Statistics
  const stats = useMemo(() => {
    if (claims.length === 0) {
      return { count: 0, mean: 0, median: 0, min: 0, max: 0, stdDev: 0, p95: 0, total: 0 };
    }
    const losses = claims.map((c) => c.grossLoss).sort((a, b) => a - b);
    const total = losses.reduce((acc, v) => acc + v, 0);
    const count = losses.length;
    const mean = total / count;
    const median =
      count % 2 === 0
        ? (losses[count / 2 - 1] + losses[count / 2]) / 2
        : losses[Math.floor(count / 2)];
    const min = losses[0];
    const max = losses[count - 1];

    // Standard deviation
    const variance = losses.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / count;
    const stdDev = Math.sqrt(variance);

    // 95th Percentile
    const p95Index = Math.min(count - 1, Math.floor(count * 0.95));
    const p95 = losses[p95Index];

    return { count, mean, median, min, max, stdDev, p95, total };
  }, [claims]);

  // Generate Bins
  const bins: HistogramBin[] = useMemo(() => {
    if (claims.length === 0) return [];

    if (binMode === 'actuarial') {
      const predefinedBrackets = [
        { label: '< \u20c4 25K', min: 0, max: 25000 },
        { label: '\u20c4 25K – 50K', min: 25000, max: 50000 },
        { label: '\u20c4 50K – 100K', min: 50000, max: 100000 },
        { label: '\u20c4 100K – 250K', min: 100000, max: 250000 },
        { label: '\u20c4 250K – 500K', min: 250000, max: 500000 },
        { label: '\u20c4 500K – 1M', min: 500000, max: 1000000 },
        { label: '> \u20c4 1M', min: 1000000, max: Infinity },
      ];

      return predefinedBrackets.map((bracket, idx) => {
        const binClaims = claims.filter((c) => {
          if (bracket.max === Infinity) return c.grossLoss >= bracket.min;
          return c.grossLoss >= bracket.min && c.grossLoss < bracket.max;
        });

        const count = binClaims.length;
        const totalLoss = binClaims.reduce((s, c) => s + c.grossLoss, 0);

        // Determine relation to Risk XOL layer
        let statusColor = 'bg-slate-500';
        let statusBadge = 'Attritional';
        if (bracket.max <= riskAttach) {
          statusColor = 'bg-emerald-500';
          statusBadge = 'Under Deductible';
        } else if (bracket.min < riskCeiling) {
          statusColor = 'bg-amber-500';
          statusBadge = 'Within Risk XOL Layer';
        } else {
          statusColor = 'bg-rose-500';
          statusBadge = 'Exceeds Risk XOL (Spillover)';
        }

        return {
          id: `bin-${idx}`,
          label: bracket.label,
          min: bracket.min,
          max: bracket.max,
          count,
          totalLoss,
          percentageCount: stats.count > 0 ? (count / stats.count) * 100 : 0,
          percentageLoss: stats.total > 0 ? (totalLoss / stats.total) * 100 : 0,
          claims: binClaims,
          statusColor,
          statusBadge,
        };
      });
    } else {
      // 8 Equal interval bins between min and max
      const numBins = 8;
      const range = Math.max(10000, stats.max - stats.min);
      const binWidth = Math.ceil(range / numBins / 10000) * 10000;

      const generated: HistogramBin[] = [];
      for (let i = 0; i < numBins; i++) {
        const min = stats.min + i * binWidth;
        const max = i === numBins - 1 ? Infinity : min + binWidth;

        const binClaims = claims.filter((c) => {
          if (max === Infinity) return c.grossLoss >= min;
          return c.grossLoss >= min && c.grossLoss < max;
        });

        const count = binClaims.length;
        const totalLoss = binClaims.reduce((s, c) => s + c.grossLoss, 0);

        let statusColor = 'bg-amber-500';
        let statusBadge = 'Mid-tier';
        if (max <= riskCeiling) {
          statusColor = 'bg-emerald-500';
          statusBadge = 'Covered / Under Cap';
        } else {
          statusColor = 'bg-rose-500';
          statusBadge = 'Spillover Exposure';
        }

        generated.push({
          id: `eq-bin-${i}`,
          label: `${formatCurrency(min)} – ${max === Infinity ? 'Max' : formatCurrency(max)}`,
          min,
          max,
          count,
          totalLoss,
          percentageCount: stats.count > 0 ? (count / stats.count) * 100 : 0,
          percentageLoss: stats.total > 0 ? (totalLoss / stats.total) * 100 : 0,
          claims: binClaims,
          statusColor,
          statusBadge,
        });
      }
      return generated;
    }
  }, [claims, binMode, stats, riskAttach, riskCeiling]);

  // Max value for scaling histogram bars
  const maxBarValue = useMemo(() => {
    if (bins.length === 0) return 1;
    if (metricView === 'count') {
      return Math.max(1, ...bins.map((b) => b.count));
    } else {
      return Math.max(1, ...bins.map((b) => b.totalLoss));
    }
  }, [bins, metricView]);

  return (
    <div className="st-card p-5 mb-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-[#ff4b4b]" />
            <h3 className="text-base font-bold text-slate-800">
              Gross Claim Size Distribution & Concentration Histogram
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Identify claim frequency clusters, severity outliers, and treaty absorption thresholds across portfolio losses
          </p>
        </div>

        {/* View mode toggle */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
            <button
              onClick={() => setMetricView('count')}
              className={`px-2.5 py-1 rounded-md font-medium transition ${
                metricView === 'count'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Claim Count (Frequency)
            </button>
            <button
              onClick={() => setMetricView('loss')}
              className={`px-2.5 py-1 rounded-md font-medium transition ${
                metricView === 'loss'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Total Incurred Loss
            </button>
          </div>

          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
            <button
              onClick={() => setBinMode('actuarial')}
              className={`px-2.5 py-1 rounded-md font-medium transition ${
                binMode === 'actuarial'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Severity Brackets
            </button>
            <button
              onClick={() => setBinMode('equal')}
              className={`px-2.5 py-1 rounded-md font-medium transition ${
                binMode === 'equal'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Equal Width Bins
            </button>
          </div>
        </div>
      </div>

      {/* Distribution Key Statistics Callout Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 mb-5 text-xs font-mono">
        <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
          <span className="text-[10px] text-slate-500 uppercase block font-sans">Mean Claim Size</span>
          <span className="font-bold text-slate-900 text-sm">{formatCurrency(stats.mean)}</span>
        </div>
        <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
          <span className="text-[10px] text-slate-500 uppercase block font-sans">Median Claim Size</span>
          <span className="font-bold text-blue-700 text-sm">{formatCurrency(stats.median)}</span>
        </div>
        <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
          <span className="text-[10px] text-slate-500 uppercase block font-sans">Peak Single Claim</span>
          <span className="font-bold text-rose-700 text-sm">{formatCurrency(stats.max)}</span>
        </div>
        <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
          <span className="text-[10px] text-slate-500 uppercase block font-sans">Std Deviation (σ)</span>
          <span className="font-bold text-slate-700 text-sm">{formatCurrency(stats.stdDev)}</span>
        </div>
        <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
          <span className="text-[10px] text-slate-500 uppercase block font-sans">95th Percentile VaR</span>
          <span className="font-bold text-amber-700 text-sm">{formatCurrency(stats.p95)}</span>
        </div>
        <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
          <span className="text-[10px] text-slate-500 uppercase block font-sans">Risk XOL Limit Cap</span>
          <span className="font-bold text-amber-900 text-sm">{formatCurrency(riskCeiling)}</span>
        </div>
      </div>

      {/* Visual Histogram Chart */}
      <div className="pt-2 pb-2">
        <div className="h-60 sm:h-64 w-full flex items-end justify-between gap-2 sm:gap-3 border-b border-slate-200 pb-2 relative">
          {/* Reference Guideline lines */}
          <div className="absolute inset-0 pointer-events-none flex flex-col justify-between opacity-15">
            <div className="border-b border-dashed border-slate-600 w-full"></div>
            <div className="border-b border-dashed border-slate-600 w-full"></div>
            <div className="border-b border-dashed border-slate-600 w-full"></div>
          </div>

          {bins.map((bin) => {
            const barValue = metricView === 'count' ? bin.count : bin.totalLoss;
            const heightPercent = maxBarValue > 0 ? (barValue / maxBarValue) * 100 : 0;
            const isHovered = hoveredBin?.id === bin.id;

            return (
              <div
                key={bin.id}
                onMouseEnter={() => setHoveredBin(bin)}
                onMouseLeave={() => setHoveredBin(null)}
                className="flex-1 flex flex-col items-center h-full justify-end relative group cursor-pointer"
              >
                {/* Floating Tag */}
                <div
                  className={`absolute text-center transition-all duration-200 font-mono text-[11px] font-bold z-20 pointer-events-none ${
                    isHovered ? 'scale-110' : ''
                  }`}
                  style={{
                    bottom: `${Math.min(96, Math.max(8, heightPercent) + 3)}%`,
                  }}
                >
                  <span
                    className={`inline-block px-1.5 py-0.5 rounded shadow-xs border ${
                      isHovered
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-white/95 text-slate-800 border-slate-200'
                    }`}
                  >
                    {metricView === 'count' ? `${bin.count} claims` : formatCurrency(bin.totalLoss)}
                  </span>
                </div>

                {/* Histogram Bar */}
                <div
                  className="w-full max-w-[56px] relative flex flex-col justify-end transition-all duration-300"
                  style={{ height: '100%' }}
                >
                  <div
                    className={`w-full rounded-t-md shadow-xs transition-all duration-300 ${
                      bin.statusColor
                    } ${isHovered ? 'brightness-125 ring-2 ring-slate-900' : 'group-hover:brightness-110'}`}
                    style={{
                      height: `${Math.max(4, heightPercent)}%`,
                    }}
                  />
                </div>

                {/* X-axis Label */}
                <div className="text-center mt-2.5 w-full">
                  <div
                    className="text-[10px] sm:text-[11px] font-semibold text-slate-700 truncate font-mono"
                    title={bin.label}
                  >
                    {bin.label}
                  </div>
                  <div className="text-[9px] text-slate-400 font-sans truncate">
                    {formatPercent(metricView === 'count' ? bin.percentageCount : bin.percentageLoss)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Hovered Bin Details Drawer */}
      {hoveredBin && (
        <div className="mt-3 p-3 bg-slate-900 text-white rounded-lg text-xs animate-in fade-in duration-150 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="font-bold flex items-center gap-2">
              <span>Bracket: {hoveredBin.label}</span>
              <span className="px-1.5 py-0.2 rounded text-[10px] bg-white/20 font-mono">
                {hoveredBin.statusBadge}
              </span>
            </div>
            <div className="text-slate-300 text-[11px] mt-0.5">
              Contains {hoveredBin.count} claims ({formatPercent(hoveredBin.percentageCount)} of portfolio) totaling{' '}
              <span className="font-bold text-emerald-400 font-mono">
                {formatCurrency(hoveredBin.totalLoss)}
              </span>{' '}
              ({formatPercent(hoveredBin.percentageLoss)} of total gross loss)
            </div>
          </div>
          {hoveredBin.claims.length > 0 && (
            <div className="text-[11px] text-slate-300 font-mono text-right truncate max-w-xs">
              Sample: {hoveredBin.claims[0].insuredName} ({formatCurrency(hoveredBin.claims[0].grossLoss)})
            </div>
          )}
        </div>
      )}

      {/* Legend & Risk Interpretation */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-600 gap-2">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-emerald-500"></span>
            <span>Below Risk XOL Retention (&lt; {formatCurrency(riskAttach)})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-amber-500"></span>
            <span>Within Risk XOL Layer ({formatCurrency(riskAttach)} – {formatCurrency(riskCeiling)})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-rose-500"></span>
            <span>Exceeds Risk XOL Limit (&gt; {formatCurrency(riskCeiling)} Spillover)</span>
          </div>
        </div>

        <div className="text-[11px] text-slate-500 italic">
          💡 Large right tail indicates high concentration requiring Cat XOL & Aggregate Stop-Loss!
        </div>
      </div>
    </div>
  );
};
