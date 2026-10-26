import React from 'react';
import { TreatyConfig, OverallCalculationSummary, ClaimCalculation, EventCalculation } from '../types/reinsurance';
import { formatCurrency, formatPercent } from '../utils/reinsuranceEngine';
import { Shield, Zap, AlertCircle, ArrowUpRight, CheckCircle2 } from 'lucide-react';

interface TreatyTowerVisualizerProps {
  treaties: TreatyConfig;
  summary: OverallCalculationSummary;
}

export const TreatyTowerVisualizer: React.FC<TreatyTowerVisualizerProps> = ({
  treaties,
  summary,
}) => {
  // Find highest single risk claim and highest event
  const highestClaimGross = summary.claimBreakdowns.reduce(
    (max: number, c: ClaimCalculation) => Math.max(max, c.grossLoss),
    0
  );
  const highestClaimNetQS = summary.claimBreakdowns.reduce(
    (max: number, c: ClaimCalculation) => Math.max(max, c.netAfterQS),
    0
  );

  const eventList = Object.values(summary.eventBreakdowns) as EventCalculation[];
  const mainEvent = eventList[0];
  const eventNetBeforeCat = mainEvent ? mainEvent.netBeforeCat : 0;

  // Working Risk XOL limits
  const riskAttach = treaties.riskXol.attachmentPoint;
  const riskLimit = treaties.riskXol.limit;
  const riskCeiling = riskAttach + riskLimit;

  // Cat XOL limits
  const catAttach = treaties.catXol.attachmentPoint;
  const catLimit = treaties.catXol.limit;
  const catCeiling = catAttach + catLimit;

  // Aggregate Stop-Loss limits
  const aslAttach = treaties.aggregateStopLoss?.attachmentPoint || 400000;
  const aslLimit = treaties.aggregateStopLoss?.limit || 600000;
  const aslCeiling = aslAttach + aslLimit;
  const netBeforeAsl = summary.totalNetBeforeAsl;
  const totalAslRecovery = summary.totalAslRecovery;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
      {/* 1. Working Risk XOL Layer Tower */}
      <div className="st-card p-5 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-xs">
                <Shield className="w-3.5 h-3.5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">1. Per-Risk XOL Tower</h4>
                <p className="text-[11px] text-slate-500">
                  {formatCurrency(riskLimit)} xs {formatCurrency(riskAttach)}
                </p>
              </div>
            </div>
            <span
              className={`text-[10px] px-2 py-0.5 rounded font-mono font-semibold ${
                treaties.riskXol.enabled
                  ? 'bg-amber-50 text-amber-800 border border-amber-200'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              {treaties.riskXol.enabled ? 'ACTIVE' : 'OFF'}
            </span>
          </div>

          <p className="text-xs text-slate-600 mb-3">
            Individual risk cap after 80% Quota Share retention.
          </p>

          {/* Tower Visual */}
          <div className="space-y-2 font-mono text-xs">
            {/* Top: Spillover / Retained Above Limit */}
            <div
              className={`p-2.5 rounded-lg border-2 border-dashed ${
                highestClaimNetQS > riskCeiling
                  ? 'bg-rose-50 border-rose-300 text-rose-900'
                  : 'bg-slate-50/50 border-slate-200 text-slate-500'
              }`}
            >
              <div className="flex items-center justify-between font-bold text-[11px]">
                <span>&gt; {formatCurrency(riskCeiling)}: Spillover</span>
                {highestClaimNetQS > riskCeiling && (
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-rose-200 text-rose-800 uppercase">
                    Exceeded
                  </span>
                )}
              </div>
            </div>

            {/* Middle: Working Risk XOL Layer */}
            <div className="p-3 rounded-lg bg-amber-500/10 border-2 border-amber-500 text-amber-950 shadow-xs relative overflow-hidden">
              <div className="flex items-center justify-between font-bold text-xs">
                <span className="flex items-center gap-1">
                  <Shield className="w-3.5 h-3.5 text-amber-600" />
                  <span>Layer ({formatCurrency(riskLimit)})</span>
                </span>
                <span className="text-amber-800 font-mono text-[11px]">
                  {formatCurrency(riskAttach)} – {formatCurrency(riskCeiling)}
                </span>
              </div>
              <div className="mt-2 text-[10px] font-mono font-semibold text-amber-900 flex justify-between bg-amber-100/70 p-1.5 rounded">
                <span>Recovered:</span>
                <span>{formatCurrency(summary.totalRiskXolCeded)}</span>
              </div>
            </div>

            {/* Bottom: Primary Cedant Retention */}
            <div className="p-2.5 rounded-lg bg-slate-100 border border-slate-300 text-slate-800 text-[11px]">
              <div className="flex items-center justify-between font-bold">
                <span>Deductible</span>
                <span>{formatCurrency(0)} – {formatCurrency(riskAttach)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-3 pt-2 border-t border-slate-100 text-[10px] text-slate-500 flex justify-between font-mono">
          <span>Max Net Claim:</span>
          <span className="font-bold text-slate-800">{formatCurrency(highestClaimNetQS)}</span>
        </div>
      </div>

      {/* 2. Catastrophe XOL Layer Tower */}
      <div className="st-card p-5 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs">
                <Zap className="w-3.5 h-3.5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">2. Catastrophe XOL Tower</h4>
                <p className="text-[11px] text-slate-500">
                  {formatCurrency(catLimit)} xs {formatCurrency(catAttach)}
                </p>
              </div>
            </div>
            <span
              className={`text-[10px] px-2 py-0.5 rounded font-mono font-semibold ${
                treaties.catXol.enabled
                  ? 'bg-indigo-50 text-indigo-800 border border-indigo-200'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              {treaties.catXol.enabled ? 'ACTIVE' : 'OFF'}
            </span>
          </div>

          <p className="text-xs text-slate-600 mb-3">
            Accumulated losses across event policies.
          </p>

          {/* Tower Visual */}
          <div className="space-y-2 font-mono text-xs">
            {/* Top: Cat Layer Exhaustion / Spillover */}
            <div
              className={`p-2.5 rounded-lg border-2 border-dashed ${
                eventNetBeforeCat > catCeiling
                  ? 'bg-rose-50 border-rose-300 text-rose-900'
                  : 'bg-slate-50/50 border-slate-200 text-slate-500'
              }`}
            >
              <div className="flex items-center justify-between font-bold text-[11px]">
                <span>&gt; {formatCurrency(catCeiling)}: Cat Spillover</span>
                {eventNetBeforeCat > catCeiling && (
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-rose-200 text-rose-800 uppercase">
                    Exhausted
                  </span>
                )}
              </div>
            </div>

            {/* Middle: Catastrophe XOL Layer */}
            <div className="p-3 rounded-lg bg-indigo-600/10 border-2 border-indigo-600 text-indigo-950 shadow-xs relative overflow-hidden">
              <div className="flex items-center justify-between font-bold text-xs">
                <span className="flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Layer ({formatCurrency(catLimit)})</span>
                </span>
                <span className="text-indigo-800 font-mono text-[11px]">
                  {formatCurrency(catAttach)} – {formatCurrency(catCeiling)}
                </span>
              </div>
              <div className="mt-2 text-[10px] font-mono font-semibold text-indigo-900 flex justify-between bg-indigo-100/70 p-1.5 rounded">
                <span>Recovered:</span>
                <span>{formatCurrency(summary.totalCatXolRecovery)}</span>
              </div>
            </div>

            {/* Bottom: Event Attachment / Cedant Retention */}
            <div className="p-2.5 rounded-lg bg-slate-100 border border-slate-300 text-slate-800 text-[11px]">
              <div className="flex items-center justify-between font-bold">
                <span>Attachment</span>
                <span>{formatCurrency(0)} – {formatCurrency(catAttach)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-3 pt-2 border-t border-slate-100 text-[10px] text-slate-500 flex justify-between font-mono">
          <span>Event Subject Loss:</span>
          <span className="font-bold text-slate-800">{formatCurrency(eventNetBeforeCat)}</span>
        </div>
      </div>

      {/* 3. Aggregate Stop-Loss Protection Tower */}
      <div className="st-card p-5 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-teal-100 text-teal-700 flex items-center justify-center font-bold text-xs">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">3. Aggregate Stop-Loss Tower</h4>
                <p className="text-[11px] text-slate-500">
                  {formatCurrency(aslLimit)} xs {formatCurrency(aslAttach)}
                </p>
              </div>
            </div>
            <span
              className={`text-[10px] px-2 py-0.5 rounded font-mono font-semibold ${
                treaties.aggregateStopLoss?.enabled
                  ? 'bg-teal-50 text-teal-800 border border-teal-200'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              {treaties.aggregateStopLoss?.enabled ? 'ACTIVE' : 'OFF'}
            </span>
          </div>

          <p className="text-xs text-slate-600 mb-3">
            Caps annual/portfolio net losses across all events.
          </p>

          {/* Tower Visual */}
          <div className="space-y-2 font-mono text-xs">
            {/* Top: ASL Exhaustion */}
            <div
              className={`p-2.5 rounded-lg border-2 border-dashed ${
                netBeforeAsl > aslCeiling
                  ? 'bg-rose-50 border-rose-300 text-rose-900'
                  : 'bg-slate-50/50 border-slate-200 text-slate-500'
              }`}
            >
              <div className="flex items-center justify-between font-bold text-[11px]">
                <span>&gt; {formatCurrency(aslCeiling)}: ASL Spillover</span>
                {netBeforeAsl > aslCeiling && (
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-rose-200 text-rose-800 uppercase">
                    Exhausted
                  </span>
                )}
              </div>
            </div>

            {/* Middle: Aggregate Stop-Loss Layer */}
            <div className="p-3 rounded-lg bg-teal-500/10 border-2 border-teal-600 text-teal-950 shadow-xs relative overflow-hidden">
              <div className="flex items-center justify-between font-bold text-xs">
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
                  <span>Layer ({formatCurrency(aslLimit)})</span>
                </span>
                <span className="text-teal-800 font-mono text-[11px]">
                  {formatCurrency(aslAttach)} – {formatCurrency(aslCeiling)}
                </span>
              </div>
              <div className="mt-2 text-[10px] font-mono font-semibold text-teal-900 flex justify-between bg-teal-100/70 p-1.5 rounded">
                <span>Recovered:</span>
                <span>{formatCurrency(totalAslRecovery || 0)}</span>
              </div>
            </div>

            {/* Bottom: ASL Deductible / Retention */}
            <div className="p-2.5 rounded-lg bg-slate-100 border border-slate-300 text-slate-800 text-[11px]">
              <div className="flex items-center justify-between font-bold">
                <span>Cumulative Retention</span>
                <span>{formatCurrency(0)} – {formatCurrency(aslAttach)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-3 pt-2 border-t border-slate-100 text-[10px] text-slate-500 flex justify-between font-mono">
          <span>Net Loss Subject to ASL:</span>
          <span className="font-bold text-slate-800">{formatCurrency(netBeforeAsl)}</span>
        </div>
      </div>
    </div>
  );
};
