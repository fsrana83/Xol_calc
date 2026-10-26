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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 mb-6">
      {/* 1. Gross Incurred Loss */}
      <div className="st-card p-4 border-l-4 border-l-slate-600 flex flex-col justify-between">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
          <span>Gross Incurred Loss</span>
          <DollarSign className="w-4 h-4 text-slate-400" />
        </div>
        <div className="text-2xl font-bold font-mono text-slate-900 tracking-tight">
          {formatCurrency(summary.totalGrossLoss)}
        </div>
        <div className="text-xs text-slate-500 mt-2 flex items-center gap-1 font-medium">
          <span className="inline-block w-2 h-2 rounded-full bg-slate-400"></span>
          <span>{summary.claimsCount} claims across {summary.eventsCount} event{summary.eventsCount > 1 ? 's' : ''}</span>
        </div>
      </div>

      {/* 2. Quota Share Ceded */}
      <div className="st-card p-4 border-l-4 border-l-blue-500 flex flex-col justify-between">
        <div className="flex items-center justify-between text-xs font-semibold text-blue-700 uppercase tracking-wider mb-1">
          <span>Quota Share Ceded</span>
          <PieChart className="w-4 h-4 text-blue-500" />
        </div>
        <div className="text-2xl font-bold font-mono text-blue-600 tracking-tight">
          {formatCurrency(summary.totalQsCeded)}
        </div>
        <div className="text-xs text-blue-700/80 mt-2 flex items-center justify-between">
          <span>Proportional</span>
          <span className="font-mono font-semibold">
            {summary.totalGrossLoss > 0
              ? formatPercent((summary.totalQsCeded / summary.totalGrossLoss) * 100)
              : '0.0%'}
          </span>
        </div>
      </div>

      {/* 3. Risk XOL Recoveries */}
      <div className="st-card p-4 border-l-4 border-l-amber-500 flex flex-col justify-between">
        <div className="flex items-center justify-between text-xs font-semibold text-amber-800 uppercase tracking-wider mb-1">
          <span>Risk XOL Recovery</span>
          <Shield className="w-4 h-4 text-amber-600" />
        </div>
        <div className="text-2xl font-bold font-mono text-amber-600 tracking-tight">
          {formatCurrency(summary.totalRiskXolCeded)}
        </div>
        <div className="text-xs text-amber-800/80 mt-2 flex items-center justify-between">
          <span>Per-Risk Cap</span>
          <span className="font-mono font-semibold">
            {summary.totalGrossLoss > 0
              ? formatPercent((summary.totalRiskXolCeded / summary.totalGrossLoss) * 100)
              : '0.0%'}
          </span>
        </div>
      </div>

      {/* 4. Cat XOL Recoveries */}
      <div className="st-card p-4 border-l-4 border-l-indigo-600 flex flex-col justify-between">
        <div className="flex items-center justify-between text-xs font-semibold text-indigo-800 uppercase tracking-wider mb-1">
          <span>Cat XOL Recovery</span>
          <Zap className="w-4 h-4 text-indigo-600" />
        </div>
        <div className="text-2xl font-bold font-mono text-indigo-600 tracking-tight">
          {formatCurrency(summary.totalCatXolRecovery)}
        </div>
        <div className="text-xs text-indigo-800/80 mt-2 flex items-center justify-between">
          <span>Per-Occurrence</span>
          <span className="font-mono font-semibold">
            {summary.totalGrossLoss > 0
              ? formatPercent((summary.totalCatXolRecovery / summary.totalGrossLoss) * 100)
              : '0.0%'}
          </span>
        </div>
      </div>

      {/* 5. Total Reinsurance Recoveries */}
      <div className="st-card p-4 border-l-4 border-l-emerald-500 flex flex-col justify-between">
        <div className="flex items-center justify-between text-xs font-semibold text-emerald-800 uppercase tracking-wider mb-1">
          <span>Total Ceded</span>
          <TrendingDown className="w-4 h-4 text-emerald-600" />
        </div>
        <div className="text-2xl font-bold font-mono text-emerald-600 tracking-tight">
          {formatCurrency(summary.totalReinsuranceRecovery)}
        </div>
        <div className="text-xs text-emerald-800/80 mt-2 flex items-center justify-between font-semibold">
          <span>Total Cession</span>
          <span className="font-mono text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
            {formatPercent(summary.effectiveCessionPercent)}
          </span>
        </div>
      </div>

      {/* 6. Company Net Retained Loss */}
      <div
        className={`st-card p-4 border-l-4 flex flex-col justify-between ${
          isHighRetention ? 'border-l-rose-500 bg-rose-50/20' : 'border-l-slate-800'
        }`}
      >
        <div className="flex items-center justify-between text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
          <span>Net Retained Loss</span>
          {isHighRetention ? (
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          )}
        </div>
        <div
          className={`text-2xl font-bold font-mono tracking-tight ${
            isHighRetention ? 'text-rose-700' : 'text-slate-900'
          }`}
        >
          {formatCurrency(summary.totalNetRetained)}
        </div>
        <div className="text-xs text-slate-600 mt-2 flex items-center justify-between font-semibold">
          <span>Cedant Net</span>
          <span
            className={`font-mono px-1.5 py-0.5 rounded ${
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
