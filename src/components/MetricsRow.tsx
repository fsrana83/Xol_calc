import React from 'react';
import {
  Layers,
  Shield,
  Zap,
  TrendingDown,
  DollarSign,
  PieChart,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import { OverallCalculationSummary, formatCurrency, formatPercent } from '../utils/reinsuranceEngine';

interface MetricsRowProps {
  summary: OverallCalculationSummary;
}

export const MetricsRow: React.FC<MetricsRowProps> = ({ summary }) => {
  const isHighRetention = summary.totalNetRetained > 1000000;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-6">
      {/* 1. Gross Incurred Loss */}
      <div className="st-card p-3.5 border-l-4 border-l-slate-600 flex flex-col justify-between">
        <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
          <span>Gross Loss</span>
          <DollarSign className="w-3.5 h-3.5 text-slate-400" />
        </div>
        <div className="text-xl font-bold font-mono text-slate-900 tracking-tight">
          {formatCurrency(summary.totalGrossLoss)}
        </div>
        <div className="text-[10px] text-slate-500 mt-2 flex items-center gap-1 font-medium truncate">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-slate-400"></span>
          <span>{summary.claimsCount} claims</span>
        </div>
      </div>

      {/* 2. Quota Share Ceded */}
      <div className="st-card p-3.5 border-l-4 border-l-blue-500 flex flex-col justify-between">
        <div className="flex items-center justify-between text-[11px] font-semibold text-blue-700 uppercase tracking-wider mb-1">
          <span>Quota Share</span>
          <PieChart className="w-3.5 h-3.5 text-blue-500" />
        </div>
        <div className="text-xl font-bold font-mono text-blue-600 tracking-tight">
          {formatCurrency(summary.totalQsCeded)}
        </div>
        <div className="text-[10px] text-blue-700/80 mt-2 flex items-center justify-between font-mono">
          <span>Proportional</span>
          <span>
            {summary.totalGrossLoss > 0
              ? formatPercent((summary.totalQsCeded / summary.totalGrossLoss) * 100)
              : '0.0%'}
          </span>
        </div>
      </div>

      {/* 3. Risk XOL Recoveries */}
      <div className="st-card p-3.5 border-l-4 border-l-amber-500 flex flex-col justify-between">
        <div className="flex items-center justify-between text-[11px] font-semibold text-amber-800 uppercase tracking-wider mb-1">
          <span>Risk XOL</span>
          <Shield className="w-3.5 h-3.5 text-amber-600" />
        </div>
        <div className="text-xl font-bold font-mono text-amber-600 tracking-tight">
          {formatCurrency(summary.totalRiskXolCeded)}
        </div>
        <div className="text-[10px] text-amber-800/80 mt-2 flex items-center justify-between font-mono">
          <span>Per-Risk Cap</span>
          <span>
            {summary.totalGrossLoss > 0
              ? formatPercent((summary.totalRiskXolCeded / summary.totalGrossLoss) * 100)
              : '0.0%'}
          </span>
        </div>
      </div>

      {/* 4. Cat XOL Recoveries */}
      <div className="st-card p-3.5 border-l-4 border-l-indigo-600 flex flex-col justify-between">
        <div className="flex items-center justify-between text-[11px] font-semibold text-indigo-800 uppercase tracking-wider mb-1">
          <span>Cat XOL</span>
          <Zap className="w-3.5 h-3.5 text-indigo-600" />
        </div>
        <div className="text-xl font-bold font-mono text-indigo-600 tracking-tight">
          {formatCurrency(summary.totalCatXolRecovery)}
        </div>
        <div className="text-[10px] text-indigo-800/80 mt-2 flex items-center justify-between font-mono">
          <span>Event Layer</span>
          <span>
            {summary.totalGrossLoss > 0
              ? formatPercent((summary.totalCatXolRecovery / summary.totalGrossLoss) * 100)
              : '0.0%'}
          </span>
        </div>
      </div>

      {/* 5. Aggregate Stop-Loss Recovery */}
      <div className="st-card p-3.5 border-l-4 border-l-teal-500 flex flex-col justify-between">
        <div className="flex items-center justify-between text-[11px] font-semibold text-teal-800 uppercase tracking-wider mb-1">
          <span>Stop-Loss (ASL)</span>
          <Layers className="w-3.5 h-3.5 text-teal-600" />
        </div>
        <div className="text-xl font-bold font-mono text-teal-700 tracking-tight">
          {formatCurrency(summary.totalAslRecovery || 0)}
        </div>
        <div className="text-[10px] text-teal-800/80 mt-2 flex items-center justify-between font-mono">
          <span>Portfolio Cap</span>
          <span>
            {summary.totalGrossLoss > 0
              ? formatPercent(((summary.totalAslRecovery || 0) / summary.totalGrossLoss) * 100)
              : '0.0%'}
          </span>
        </div>
      </div>

      {/* 6. Total Reinsurance Recoveries */}
      <div className="st-card p-3.5 border-l-4 border-l-emerald-500 flex flex-col justify-between">
        <div className="flex items-center justify-between text-[11px] font-semibold text-emerald-800 uppercase tracking-wider mb-1">
          <span>Total Ceded</span>
          <TrendingDown className="w-3.5 h-3.5 text-emerald-600" />
        </div>
        <div className="text-xl font-bold font-mono text-emerald-600 tracking-tight">
          {formatCurrency(summary.totalReinsuranceRecovery)}
        </div>
        <div className="text-[10px] text-emerald-800 mt-2 flex items-center justify-between font-semibold font-mono">
          <span>Cession</span>
          <span className="text-emerald-700 bg-emerald-50 px-1 py-0.2 rounded">
            {formatPercent(summary.effectiveCessionPercent)}
          </span>
        </div>
      </div>

      {/* 7. Company Net Retained Loss */}
      <div
        className={`st-card p-3.5 border-l-4 flex flex-col justify-between ${
          isHighRetention ? 'border-l-rose-500 bg-rose-50/20' : 'border-l-slate-800'
        }`}
      >
        <div className="flex items-center justify-between text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
          <span>Net Retained</span>
          {isHighRetention ? (
            <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
          ) : (
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
          )}
        </div>
        <div
          className={`text-xl font-bold font-mono tracking-tight ${
            isHighRetention ? 'text-rose-700' : 'text-slate-900'
          }`}
        >
          {formatCurrency(summary.totalNetRetained)}
        </div>
        <div className="text-[10px] text-slate-600 mt-2 flex items-center justify-between font-semibold font-mono">
          <span>Retention</span>
          <span
            className={`px-1 py-0.2 rounded ${
              isHighRetention
                ? 'bg-rose-100 text-rose-800'
                : 'bg-slate-100 text-slate-800'
            }`}
          >
            {formatPercent(summary.effectiveNetRetentionPercent)}
          </span>
        </div>
      </div>
    </div>
  );
};
