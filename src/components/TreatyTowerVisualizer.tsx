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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      {/* 1. Working Risk XOL Layer Tower */}
      <div className="st-card p-5 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-xs">
                <Shield className="w-3.5 h-3.5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">Per-Risk XOL Coverage Tower</h4>
                <p className="text-[11px] text-slate-500">
                  Structure: {formatCurrency(riskLimit)} xs {formatCurrency(riskAttach)}
                </p>
              </div>
            </div>
            <span
              className={`text-xs px-2 py-0.5 rounded font-mono font-semibold ${
                treaties.riskXol.enabled
                  ? 'bg-amber-50 text-amber-800 border border-amber-200'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              {treaties.riskXol.enabled ? 'ACTIVE TREATY' : 'DISABLED'}
            </span>
          </div>

          <p className="text-xs text-slate-600 mb-4">
            Protects against large individual risk losses after the 80% Quota Share retention.
          </p>

          {/* Tower Visual */}
          <div className="space-y-2 font-mono text-xs">
            {/* Top: Spillover / Retained Above Limit */}
            <div
              className={`p-3 rounded-lg border-2 border-dashed ${
                highestClaimNetQS > riskCeiling
                  ? 'bg-rose-50 border-rose-300 text-rose-900'
                  : 'bg-slate-50/50 border-slate-200 text-slate-500'
              }`}
            >
              <div className="flex items-center justify-between font-bold">
                <span>Above {formatCurrency(riskCeiling)}: Retained Spillover</span>
                {highestClaimNetQS > riskCeiling && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-rose-200 text-rose-800 uppercase">
                    Breached by {formatCurrency(highestClaimNetQS - riskCeiling)}
                  </span>
                )}
              </div>
              <p className="text-[11px] font-sans text-slate-500 mt-1">
                Any loss amount per risk exceeding the {formatCurrency(riskLimit)} limit reverts to the cedant.
              </p>
            </div>

            {/* Middle: Working Risk XOL Layer */}
            <div className="p-3.5 rounded-lg bg-amber-500/10 border-2 border-amber-500 text-amber-950 shadow-xs relative overflow-hidden">
              <div className="flex items-center justify-between font-bold">
                <span className="flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-amber-600" />
                  <span>Risk XOL Layer ({formatCurrency(riskLimit)})</span>
                </span>
                <span className="text-amber-800 font-mono">
                  {formatCurrency(riskAttach)} – {formatCurrency(riskCeiling)}
                </span>
              </div>
              <div className="text-[11px] font-sans text-amber-900 mt-1">
                100% covered by reinsurers up to {formatCurrency(riskLimit)} maximum recovery per individual risk.
              </div>
              <div className="mt-2 text-[11px] font-mono font-semibold text-amber-800 flex justify-between bg-amber-100/60 p-1.5 rounded">
                <span>Current Total Recovered:</span>
                <span>{formatCurrency(summary.totalRiskXolCeded)}</span>
              </div>
            </div>

            {/* Bottom: Primary Cedant Retention */}
            <div className="p-3 rounded-lg bg-slate-100 border border-slate-300 text-slate-800">
              <div className="flex items-center justify-between font-bold">
                <span>Cedant Deductible / Retention</span>
                <span>$0 – {formatCurrency(riskAttach)}</span>
              </div>
              <p className="text-[11px] font-sans text-slate-600 mt-1">
                Primary company absorbs the first {formatCurrency(riskAttach)} of each claim (after QS).
              </p>
            </div>
          </div>
        </div>

        {/* Diagnostic footer */}
        <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-500 flex justify-between">
          <span>Max Net Claim in Scenario:</span>
          <span className="font-mono font-bold text-slate-800">
            {formatCurrency(highestClaimNetQS)} (Gross: {formatCurrency(highestClaimGross)})
          </span>
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
                <h4 className="text-sm font-bold text-slate-900">Catastrophe XOL Coverage Tower</h4>
                <p className="text-[11px] text-slate-500">
                  Structure: {formatCurrency(catLimit)} xs {formatCurrency(catAttach)}
                </p>
              </div>
            </div>
            <span
              className={`text-xs px-2 py-0.5 rounded font-mono font-semibold ${
                treaties.catXol.enabled
                  ? 'bg-indigo-50 text-indigo-800 border border-indigo-200'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              {treaties.catXol.enabled ? 'ACTIVE TREATY' : 'DISABLED'}
            </span>
          </div>

          <p className="text-xs text-slate-600 mb-4">
            Aggregates net losses across multiple risks from a single catastrophe event.
          </p>

          {/* Tower Visual */}
          <div className="space-y-2 font-mono text-xs">
            {/* Top: Cat Layer Exhaustion / Spillover */}
            <div
              className={`p-3 rounded-lg border-2 border-dashed ${
                eventNetBeforeCat > catCeiling
                  ? 'bg-rose-50 border-rose-300 text-rose-900'
                  : 'bg-slate-50/50 border-slate-200 text-slate-500'
              }`}
            >
              <div className="flex items-center justify-between font-bold">
                <span>Above {formatCurrency(catCeiling)}: Cat Spillover</span>
                {eventNetBeforeCat > catCeiling && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-rose-200 text-rose-800 uppercase">
                    Exhausted by {formatCurrency(eventNetBeforeCat - catCeiling)}
                  </span>
                )}
              </div>
              <p className="text-[11px] font-sans text-slate-500 mt-1">
                Loss exceeding the {formatCurrency(catLimit)} maximum treaty capacity reverts to the cedant.
              </p>
            </div>

            {/* Middle: Catastrophe XOL Layer */}
            <div className="p-3.5 rounded-lg bg-indigo-600/10 border-2 border-indigo-600 text-indigo-950 shadow-xs relative overflow-hidden">
              <div className="flex items-center justify-between font-bold">
                <span className="flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-indigo-600" />
                  <span>Cat XOL Layer ({formatCurrency(catLimit)})</span>
                </span>
                <span className="text-indigo-800 font-mono">
                  {formatCurrency(catAttach)} – {formatCurrency(catCeiling)}
                </span>
              </div>
              <div className="text-[11px] font-sans text-indigo-900 mt-1 flex items-center justify-between">
                <span>Reinsurer Share: {100 - treaties.catXol.cedantCoParticipation}%</span>
                <span>Cedant Co-Participation: {treaties.catXol.cedantCoParticipation}%</span>
              </div>
              <div className="mt-2 text-[11px] font-mono font-semibold text-indigo-900 flex justify-between bg-indigo-100/70 p-1.5 rounded">
                <span>Current Cat Recovery:</span>
                <span>{formatCurrency(summary.totalCatXolRecovery)}</span>
              </div>
            </div>

            {/* Bottom: Event Attachment / Cedant Retention */}
            <div className="p-3 rounded-lg bg-slate-100 border border-slate-300 text-slate-800">
              <div className="flex items-center justify-between font-bold">
                <span>Event Retention (Attachment)</span>
                <span>$0 – {formatCurrency(catAttach)}</span>
              </div>
              <p className="text-[11px] font-sans text-slate-600 mt-1">
                Cedant absorbs the first {formatCurrency(catAttach)} of event losses before Cat XOL kicks in.
              </p>
            </div>
          </div>
        </div>

        {/* Diagnostic footer */}
        <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-500 flex justify-between">
          <span>Event Loss Subject to Cat:</span>
          <span className="font-mono font-bold text-slate-800">
            {formatCurrency(eventNetBeforeCat)}{' '}
            {eventNetBeforeCat > catAttach ? '(Attached)' : '(Under Deductible)'}
          </span>
        </div>
      </div>
    </div>
  );
};
