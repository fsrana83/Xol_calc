import React, { useState } from 'react';
import { OverallCalculationSummary, formatCurrency, formatPercent } from '../utils/reinsuranceEngine';
import { Layers, Info, BarChart3, HelpCircle, Download } from 'lucide-react';

interface WaterfallChartProps {
  summary: OverallCalculationSummary;
  onExportPdf?: () => void;
}

export const WaterfallChart: React.FC<WaterfallChartProps> = ({ summary, onExportPdf }) => {
  const [viewMode, setViewMode] = useState<'currency' | 'percent'>('currency');

  const gross = summary.totalGrossLoss;
  if (gross <= 0) {
    return (
      <div className="st-card p-8 text-center text-slate-400">
        No claim loss data available to calculate waterfall.
      </div>
    );
  }

  // Steps in waterfall:
  // 1: Gross Loss (base 0 to gross)
  // 2: QS Ceded (from gross down by qsCeded)
  // 3: Risk XOL Ceded (from (gross - qs) down by riskXolCeded)
  // 4: Cat XOL Recovery (from (gross - qs - risk) down by catXolRecovery)
  const qs = summary.totalQsCeded;
  const risk = summary.totalRiskXolCeded;
  const cat = summary.totalCatXolRecovery;
  const asl = summary.totalAslRecovery || 0;
  const net = summary.totalNetRetained;

  const afterQS = gross - qs;
  const afterRisk = afterQS - risk;
  const afterCat = afterRisk - cat;
  const afterAsl = afterCat - asl;

  const steps = [
    {
      id: 'gross',
      label: 'Gross Loss',
      sublabel: 'Initial Portfolio Incurred',
      amount: gross,
      isReduction: false,
      isFinal: false,
      color: 'bg-slate-700',
      textColor: 'text-slate-800',
      bottomVal: 0,
      topVal: gross,
    },
    {
      id: 'qs',
      label: 'Quota Share',
      sublabel: 'Proportional Cession',
      amount: qs,
      isReduction: true,
      isFinal: false,
      color: 'bg-blue-500',
      textColor: 'text-blue-600',
      bottomVal: afterQS,
      topVal: gross,
    },
    {
      id: 'riskXol',
      label: 'Risk XOL',
      sublabel: 'Per-Risk Recoveries',
      amount: risk,
      isReduction: true,
      isFinal: false,
      color: 'bg-amber-500',
      textColor: 'text-amber-600',
      bottomVal: afterRisk,
      topVal: afterQS,
    },
    {
      id: 'catXol',
      label: 'Cat XOL',
      sublabel: 'Event Recoveries',
      amount: cat,
      isReduction: true,
      isFinal: false,
      color: 'bg-indigo-600',
      textColor: 'text-indigo-600',
      bottomVal: Math.max(0, afterCat),
      topVal: afterRisk,
    },
    {
      id: 'asl',
      label: 'Stop-Loss',
      sublabel: 'Portfolio Cap (ASL)',
      amount: asl,
      isReduction: true,
      isFinal: false,
      color: 'bg-teal-500',
      textColor: 'text-teal-600',
      bottomVal: Math.max(0, afterAsl),
      topVal: afterCat,
    },
    {
      id: 'netRetained',
      label: 'Net Retained',
      sublabel: 'Cedant Net Loss',
      amount: net,
      isReduction: false,
      isFinal: true,
      color: net > 1000000 ? 'bg-rose-600' : 'bg-emerald-600',
      textColor: net > 1000000 ? 'text-rose-700' : 'text-emerald-700',
      bottomVal: 0,
      topVal: net,
    },
  ];

  return (
    <div className="st-card p-5 mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 border-b border-slate-100 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-[#ff4b4b]" />
            <h3 className="text-base font-bold text-slate-800">
              Loss Absorption Waterfall (Actuarial Cascade)
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Step-by-step reduction from original gross loss to company net retained liability
          </p>
        </div>

        {/* View Toggle & Export */}
        <div className="flex items-center gap-2">
          {onExportPdf && (
            <button
              onClick={onExportPdf}
              className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-xs font-semibold shadow-xs flex items-center gap-1.5 transition"
              title="Download PDF report with summary and waterfall chart"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>Export PDF Report</span>
            </button>
          )}

          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
            <button
              onClick={() => setViewMode('currency')}
              className={`px-3 py-1 rounded-md font-medium transition ${
                viewMode === 'currency'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Omani Rial (&#x20c4;)
            </button>
            <button
              onClick={() => setViewMode('percent')}
              className={`px-3 py-1 rounded-md font-medium transition ${
                viewMode === 'percent'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Share of Gross (%)
            </button>
          </div>
        </div>
      </div>

      {/* Waterfall Visualization Area */}
      <div className="pt-6 pb-2 px-2">
        <div className="h-64 sm:h-72 w-full flex items-end justify-between gap-3 sm:gap-6 border-b border-slate-200 pb-2 relative">
          {/* Reference Guideline Lines */}
          <div className="absolute inset-0 pointer-events-none flex flex-col justify-between opacity-15">
            <div className="border-b border-dashed border-slate-600 w-full"></div>
            <div className="border-b border-dashed border-slate-600 w-full"></div>
            <div className="border-b border-dashed border-slate-600 w-full"></div>
            <div className="border-b border-dashed border-slate-600 w-full"></div>
          </div>

          {steps.map((step) => {
            const heightPercent = gross > 0 ? (step.amount / gross) * 100 : 0;
            const bottomPercent = gross > 0 ? (step.bottomVal / gross) * 100 : 0;
            const pctOfGross = gross > 0 ? (step.amount / gross) * 100 : 0;

            return (
              <div
                key={step.id}
                className="flex-1 flex flex-col items-center h-full justify-end relative group"
              >
                {/* Floating Value Tag */}
                <div
                  className="absolute text-center transition-all duration-300 font-mono text-xs font-bold pointer-events-none z-10"
                  style={{
                    bottom: `${Math.min(94, bottomPercent + heightPercent + 2)}%`,
                  }}
                >
                  <span
                    className={`inline-block px-1.5 py-0.5 rounded shadow-xs bg-white/95 border border-slate-200 ${step.textColor}`}
                  >
                    {step.isReduction ? '-' : ''}
                    {viewMode === 'currency'
                      ? formatCurrency(step.amount)
                      : formatPercent(pctOfGross)}
                  </span>
                </div>

                {/* Bar */}
                <div
                  className="w-full max-w-[72px] relative flex flex-col justify-end transition-all duration-500 rounded-t"
                  style={{ height: '100%' }}
                >
                  <div
                    className={`w-full rounded-md shadow-sm transition-all duration-300 group-hover:brightness-110 ${step.color}`}
                    style={{
                      height: `${Math.max(4, heightPercent)}%`,
                      marginBottom: `${bottomPercent}%`,
                    }}
                  >
                    {/* Inner texture stripes for reduction bars */}
                    {step.isReduction && (
                      <div className="w-full h-full opacity-20 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.4)_50%,transparent_75%)] bg-[length:12px_12px] rounded-md" />
                    )}
                  </div>
                </div>

                {/* Column Labels */}
                <div className="text-center mt-3 w-full">
                  <div className="text-xs font-bold text-slate-800 truncate" title={step.label}>
                    {step.label}
                  </div>
                  <div className="text-[10px] text-slate-400 truncate hidden sm:block">
                    {step.sublabel}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend & Key Takeaway Banner */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-600 gap-2">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-blue-500"></span>
            <span>Quota Share ({formatPercent(summary.totalGrossLoss > 0 ? (qs / gross) * 100 : 0)})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-amber-500"></span>
            <span>Risk XOL ({formatPercent(summary.totalGrossLoss > 0 ? (risk / gross) * 100 : 0)})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-indigo-600"></span>
            <span>Cat XOL ({formatPercent(summary.totalGrossLoss > 0 ? (cat / gross) * 100 : 0)})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-teal-500"></span>
            <span>Stop-Loss ASL ({formatPercent(summary.totalGrossLoss > 0 ? (asl / gross) * 100 : 0)})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className={`w-3 h-3 rounded ${net > 1000000 ? 'bg-rose-600' : 'bg-emerald-600'}`}></span>
            <span>Company Net Retained ({formatPercent(summary.effectiveNetRetentionPercent)})</span>
          </div>
        </div>

        <div className="text-[11px] text-slate-500 font-mono">
          Total Reinsurance Protection: <span className="font-bold text-emerald-700">{formatCurrency(summary.totalReinsuranceRecovery)}</span>
        </div>
      </div>
    </div>
  );
};
