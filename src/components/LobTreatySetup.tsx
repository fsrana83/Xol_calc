/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  TreatyConfig,
  CoreLineOfBusiness,
  LobTreatyMap,
  LobTreatyConfig,
  OverallCalculationSummary,
} from '../types/reinsurance';
import {
  CORE_LOBS,
  DEFAULT_LOB_TREATIES,
  formatCurrency,
  formatPercent,
  getLobConfig,
} from '../utils/reinsuranceEngine';
import {
  Shield,
  Layers,
  Zap,
  Check,
  X,
  RotateCcw,
  Sparkles,
  Info,
  Car,
  Building2,
  HeartPulse,
  Users2,
  TrendingDown,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';

interface LobTreatySetupProps {
  treaties: TreatyConfig;
  onUpdateTreaties: (newTreaties: TreatyConfig) => void;
  summary: OverallCalculationSummary;
}

export const LobTreatySetup: React.FC<LobTreatySetupProps> = ({
  treaties,
  onUpdateTreaties,
  summary,
}) => {
  const currentLobTreaties: LobTreatyMap = treaties.lobTreaties || DEFAULT_LOB_TREATIES;

  const handleToggle = (lob: CoreLineOfBusiness, treatyType: keyof LobTreatyConfig) => {
    const prevConfig = getLobConfig(lob, currentLobTreaties);
    const updatedLobTreaties: LobTreatyMap = {
      ...currentLobTreaties,
      [lob]: {
        ...prevConfig,
        [treatyType]: !prevConfig[treatyType],
      },
    };

    onUpdateTreaties({
      ...treaties,
      lobTreaties: updatedLobTreaties,
    });
  };

  const handleSetLobAll = (lob: CoreLineOfBusiness, enable: boolean) => {
    const updatedLobTreaties: LobTreatyMap = {
      ...currentLobTreaties,
      [lob]: {
        quotaShare: enable,
        riskXol: enable,
        catXol: enable,
        aggregateStopLoss: enable,
      },
    };

    onUpdateTreaties({
      ...treaties,
      lobTreaties: updatedLobTreaties,
    });
  };

  const applyPreset = (presetKey: 'all' | 'market_standard' | 'asl_only' | 'no_medical_cat') => {
    let newMap: LobTreatyMap = JSON.parse(JSON.stringify(DEFAULT_LOB_TREATIES));

    if (presetKey === 'all') {
      newMap = {
        'Motor': { quotaShare: true, riskXol: true, catXol: true, aggregateStopLoss: true },
        'P&C Lines': { quotaShare: true, riskXol: true, catXol: true, aggregateStopLoss: true },
        'Medical Lines': { quotaShare: true, riskXol: true, catXol: true, aggregateStopLoss: true },
        'Group Life Lines': { quotaShare: true, riskXol: true, catXol: true, aggregateStopLoss: true },
      };
    } else if (presetKey === 'market_standard') {
      newMap = { ...DEFAULT_LOB_TREATIES };
    } else if (presetKey === 'asl_only') {
      newMap = {
        'Motor': { quotaShare: false, riskXol: false, catXol: false, aggregateStopLoss: true },
        'P&C Lines': { quotaShare: false, riskXol: false, catXol: false, aggregateStopLoss: true },
        'Medical Lines': { quotaShare: false, riskXol: false, catXol: false, aggregateStopLoss: true },
        'Group Life Lines': { quotaShare: false, riskXol: false, catXol: false, aggregateStopLoss: true },
      };
    } else if (presetKey === 'no_medical_cat') {
      newMap = {
        ...currentLobTreaties,
        'Medical Lines': {
          quotaShare: true,
          riskXol: false,
          catXol: false,
          aggregateStopLoss: true,
        },
      };
    }

    onUpdateTreaties({
      ...treaties,
      lobTreaties: newMap,
    });
  };

  // Compute stats per LOB in the current active scenario
  const getLobScenarioStats = (lob: CoreLineOfBusiness) => {
    const claims = summary.claimBreakdowns.filter((cb) => {
      if (cb.claim.lob === lob) return true;
      if (lob === 'P&C Lines') {
        return (
          cb.claim.lob === 'Commercial Property' ||
          cb.claim.lob === 'Industrial Plant' ||
          cb.claim.lob === 'Residential High-Value' ||
          cb.claim.lob === 'Energy & Marine' ||
          cb.claim.lob === 'Warehouse & Logistics'
        );
      }
      return false;
    });

    const gross = claims.reduce((s, c) => s + c.grossLoss, 0);
    const qs = claims.reduce((s, c) => s + c.qsCeded, 0);
    const risk = claims.reduce((s, c) => s + c.riskXolCeded, 0);
    const cat = claims.reduce((s, c) => s + c.catXolCededShare, 0);
    const asl = claims.reduce((s, c) => s + c.aslCededShare, 0);
    const recovered = qs + risk + cat + asl;
    const retained = Math.max(0, gross - recovered);
    const retentionRate = gross > 0 ? (retained / gross) * 100 : 0;

    return {
      count: claims.length,
      gross,
      qs,
      risk,
      cat,
      asl,
      recovered,
      retained,
      retentionRate,
    };
  };

  const getLobMeta = (lob: CoreLineOfBusiness) => {
    switch (lob) {
      case 'Motor':
        return {
          icon: <Car className="w-5 h-5 text-sky-600" />,
          color: 'bg-sky-50 text-sky-800 border-sky-200',
          badgeColor: 'bg-sky-500/10 text-sky-700',
          desc: 'Comprehensive, Commercial Fleet, Third-Party Liability & Own Damage accumulations.',
          marketStandard: 'QS + Working Risk XOL (high TPL limits) + Cat XOL (wadi/flood) + ASL.',
        };
      case 'P&C Lines':
        return {
          icon: <Building2 className="w-5 h-5 text-amber-600" />,
          color: 'bg-amber-50 text-amber-800 border-amber-200',
          badgeColor: 'bg-amber-500/10 text-amber-700',
          desc: 'Commercial Property, Industrial Manufacturing, Ports, Logistics & Energy complexes.',
          marketStandard: 'All 4 Treaties standard (Quota Share + Risk XOL + Cat XOL + ASL).',
        };
      case 'Medical Lines':
        return {
          icon: <HeartPulse className="w-5 h-5 text-emerald-600" />,
          color: 'bg-emerald-50 text-emerald-800 border-emerald-200',
          badgeColor: 'bg-emerald-500/10 text-emerald-700',
          desc: 'Corporate Health Schemes, Expatriate Mandatory Healthcare, High-Cost Inpatient.',
          marketStandard: 'Quota Share & Stop-Loss (ASL) primary. Risk XOL and Cat XOL typically excluded.',
        };
      case 'Group Life Lines':
        return {
          icon: <Users2 className="w-5 h-5 text-purple-600" />,
          color: 'bg-purple-50 text-purple-800 border-purple-200',
          badgeColor: 'bg-purple-500/10 text-purple-700',
          desc: 'Workforce Group Term Life, Industrial Contracting, Key Person & Multi-Life Clash.',
          marketStandard: 'QS + Surplus/Risk XOL (per life) + Cat Accumulation + Aggregate Stop-Loss.',
        };
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                <Shield className="w-4 h-4" />
              </div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                Line of Business (LOB) Treaty Setup Matrix
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1 max-w-2xl">
              Configure reinsurance treaty attachment rules independently across{' '}
              <strong className="text-slate-800 font-semibold">Motor</strong>,{' '}
              <strong className="text-slate-800 font-semibold">P&C Lines</strong>,{' '}
              <strong className="text-slate-800 font-semibold">Medical Lines</strong>, and{' '}
              <strong className="text-slate-800 font-semibold">Group Life Lines</strong>. Changes dynamically update recoveries, cessions, and net retention.
            </p>
          </div>

          {/* Quick Preset Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider font-mono">
              Presets:
            </span>
            <button
              onClick={() => applyPreset('all')}
              className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-md border border-indigo-200 transition cursor-pointer"
            >
              Full Protection (All On)
            </button>
            <button
              onClick={() => applyPreset('market_standard')}
              className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold rounded-md border border-emerald-200 transition cursor-pointer flex items-center gap-1"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>GCC Market Standard</span>
            </button>
            <button
              onClick={() => applyPreset('asl_only')}
              className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-md border border-slate-300 transition cursor-pointer"
            >
              Stop-Loss Only
            </button>
          </div>
        </div>
      </div>

      {/* Interactive Matrix Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4 w-72">Line of Business (LOB)</th>
                <th className="py-3 px-3 text-center">
                  <div className="flex items-center justify-center gap-1 text-blue-700">
                    <Layers className="w-3.5 h-3.5" />
                    <span>Quota Share (QS)</span>
                  </div>
                  <div className="text-[9px] text-slate-400 font-normal">
                    {treaties.quotaShare.enabled ? `${100 - treaties.quotaShare.retentionPercent}% Ceded` : 'Global Off'}
                  </div>
                </th>
                <th className="py-3 px-3 text-center">
                  <div className="flex items-center justify-center gap-1 text-amber-700">
                    <Shield className="w-3.5 h-3.5" />
                    <span>Risk XOL</span>
                  </div>
                  <div className="text-[9px] text-slate-400 font-normal">
                    {treaties.riskXol.enabled ? `${formatCurrency(treaties.riskXol.limit)} Limit` : 'Global Off'}
                  </div>
                </th>
                <th className="py-3 px-3 text-center">
                  <div className="flex items-center justify-center gap-1 text-indigo-700">
                    <Zap className="w-3.5 h-3.5" />
                    <span>Cat XOL</span>
                  </div>
                  <div className="text-[9px] text-slate-400 font-normal">
                    {treaties.catXol.enabled ? `${formatCurrency(treaties.catXol.limit)} Layer` : 'Global Off'}
                  </div>
                </th>
                <th className="py-3 px-3 text-center">
                  <div className="flex items-center justify-center gap-1 text-emerald-700">
                    <Shield className="w-3.5 h-3.5" />
                    <span>Stop-Loss (ASL)</span>
                  </div>
                  <div className="text-[9px] text-slate-400 font-normal">
                    {treaties.aggregateStopLoss.enabled ? `${formatCurrency(treaties.aggregateStopLoss.limit)} Cap` : 'Global Off'}
                  </div>
                </th>
                <th className="py-3 px-4 text-right">Scenario Exposure & Net</th>
                <th className="py-3 px-3 text-center w-28">LOB Controls</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {CORE_LOBS.map((lob) => {
                const config = getLobConfig(lob, currentLobTreaties);
                const stats = getLobScenarioStats(lob);
                const meta = getLobMeta(lob);

                return (
                  <tr key={lob} className="hover:bg-slate-50/60 transition-colors">
                    {/* LOB Identity & Market Note */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-start gap-2.5">
                        <div className="mt-0.5 p-1.5 rounded-lg bg-slate-100 border border-slate-200 shrink-0">
                          {meta.icon}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 text-sm">{lob}</span>
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${meta.badgeColor}`}>
                              {stats.count} {stats.count === 1 ? 'Claim' : 'Claims'}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{meta.desc}</p>
                          <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                            Std: {meta.marketStandard}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Quota Share Toggle */}
                    <td className="py-3.5 px-3 text-center">
                      <button
                        onClick={() => handleToggle(lob, 'quotaShare')}
                        title={`Click to ${config.quotaShare ? 'Disable' : 'Enable'} Quota Share for ${lob}`}
                        className={`w-full py-2 px-2.5 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                          config.quotaShare
                            ? 'bg-blue-50 border-blue-200 text-blue-700 shadow-xs hover:bg-blue-100'
                            : 'bg-slate-50 border-slate-200 text-slate-400 hover:bg-slate-100'
                        }`}
                      >
                        {config.quotaShare ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-blue-600 stroke-[3]" />
                            <span>Active</span>
                          </>
                        ) : (
                          <>
                            <X className="w-3.5 h-3.5 text-slate-400" />
                            <span>Excluded</span>
                          </>
                        )}
                      </button>
                    </td>

                    {/* Risk XOL Toggle */}
                    <td className="py-3.5 px-3 text-center">
                      <button
                        onClick={() => handleToggle(lob, 'riskXol')}
                        title={`Click to ${config.riskXol ? 'Disable' : 'Enable'} Risk XOL for ${lob}`}
                        className={`w-full py-2 px-2.5 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                          config.riskXol
                            ? 'bg-amber-50 border-amber-200 text-amber-800 shadow-xs hover:bg-amber-100'
                            : 'bg-slate-50 border-slate-200 text-slate-400 hover:bg-slate-100'
                        }`}
                      >
                        {config.riskXol ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-amber-600 stroke-[3]" />
                            <span>Active</span>
                          </>
                        ) : (
                          <>
                            <X className="w-3.5 h-3.5 text-slate-400" />
                            <span>Excluded</span>
                          </>
                        )}
                      </button>
                    </td>

                    {/* Cat XOL Toggle */}
                    <td className="py-3.5 px-3 text-center">
                      <button
                        onClick={() => handleToggle(lob, 'catXol')}
                        title={`Click to ${config.catXol ? 'Disable' : 'Enable'} Cat XOL for ${lob}`}
                        className={`w-full py-2 px-2.5 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                          config.catXol
                            ? 'bg-indigo-50 border-indigo-200 text-indigo-700 shadow-xs hover:bg-indigo-100'
                            : 'bg-slate-50 border-slate-200 text-slate-400 hover:bg-slate-100'
                        }`}
                      >
                        {config.catXol ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-indigo-600 stroke-[3]" />
                            <span>Active</span>
                          </>
                        ) : (
                          <>
                            <X className="w-3.5 h-3.5 text-slate-400" />
                            <span>Excluded</span>
                          </>
                        )}
                      </button>
                    </td>

                    {/* Stop-Loss (ASL) Toggle */}
                    <td className="py-3.5 px-3 text-center">
                      <button
                        onClick={() => handleToggle(lob, 'aggregateStopLoss')}
                        title={`Click to ${config.aggregateStopLoss ? 'Disable' : 'Enable'} Aggregate Stop-Loss for ${lob}`}
                        className={`w-full py-2 px-2.5 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                          config.aggregateStopLoss
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-700 shadow-xs hover:bg-emerald-100'
                            : 'bg-slate-50 border-slate-200 text-slate-400 hover:bg-slate-100'
                        }`}
                      >
                        {config.aggregateStopLoss ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />
                            <span>Active</span>
                          </>
                        ) : (
                          <>
                            <X className="w-3.5 h-3.5 text-slate-400" />
                            <span>Excluded</span>
                          </>
                        )}
                      </button>
                    </td>

                    {/* Scenario Exposure & Net Retention Stats */}
                    <td className="py-3.5 px-4 text-right font-mono">
                      {stats.gross > 0 ? (
                        <div>
                          <div className="text-xs font-bold text-slate-900">
                            Gross: {formatCurrency(stats.gross)}
                          </div>
                          <div className="text-[11px] text-emerald-600">
                            Ceded: {formatCurrency(stats.recovered)}
                          </div>
                          <div className="text-[11px] text-rose-600 font-semibold">
                            Net: {formatCurrency(stats.retained)} ({formatPercent(stats.retentionRate)})
                          </div>
                        </div>
                      ) : (
                        <div className="text-slate-400 text-[11px] italic font-sans">
                          No claims in active scenario
                        </div>
                      )}
                    </td>

                    {/* Row Quick Action Buttons */}
                    <td className="py-3.5 px-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleSetLobAll(lob, true)}
                          className="px-2 py-1 text-[10px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition cursor-pointer"
                          title={`Enable all treaties for ${lob}`}
                        >
                          All On
                        </button>
                        <button
                          onClick={() => handleSetLobAll(lob, false)}
                          className="px-2 py-1 text-[10px] font-semibold bg-rose-50 hover:bg-rose-100 text-rose-700 rounded transition cursor-pointer"
                          title={`Disable all treaties for ${lob} (100% retained by cedant)`}
                        >
                          All Off
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Explanatory Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Motor Card */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 rounded-lg bg-sky-50 text-sky-700">
              <Car className="w-4 h-4" />
            </div>
            <h4 className="text-xs font-bold text-slate-900">Motor Treaty Rationale</h4>
          </div>
          <p className="text-[11px] text-slate-600 leading-relaxed">
            In Oman and the GCC, Motor portfolios face severe third-party bodily injury liabilities and multi-vehicle highway clash. <strong>Risk XOL</strong> caps single severe collisions at &#x20c4; 40,000, while <strong>Cat XOL</strong> protects against flash flood dealership submergence.
          </p>
        </div>

        {/* P&C Card */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 rounded-lg bg-amber-50 text-amber-700">
              <Building2 className="w-4 h-4" />
            </div>
            <h4 className="text-xs font-bold text-slate-900">P&C Lines Rationale</h4>
          </div>
          <p className="text-[11px] text-slate-600 leading-relaxed">
            Commercial Property, Freezone logistics, and Industrial syntheses carry concentrated property values. All 4 treaties inure in cascade: <strong>80% QS</strong> distributes baseline exposure, <strong>Risk XOL</strong> buffers individual fires, and <strong>Cat XOL</strong> absorbs cyclones.
          </p>
        </div>

        {/* Medical Card */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700">
              <HeartPulse className="w-4 h-4" />
            </div>
            <h4 className="text-xs font-bold text-slate-900">Medical Lines Rationale</h4>
          </div>
          <p className="text-[11px] text-slate-600 leading-relaxed">
            Medical insurance rarely triggers property-style Risk XOL or physical Cat XOL. Actuaries primarily structure <strong>Quota Share</strong> for underwriting capacity and <strong>Aggregate Stop-Loss (ASL)</strong> to cap portfolio Loss Ratio overruns.
          </p>
        </div>

        {/* Group Life Card */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 rounded-lg bg-purple-50 text-purple-700">
              <Users2 className="w-4 h-4" />
            </div>
            <h4 className="text-xs font-bold text-slate-900">Group Life Lines Rationale</h4>
          </div>
          <p className="text-[11px] text-slate-600 leading-relaxed">
            Group Life covers corporate workforces and offshore contractors. <strong>Risk XOL</strong> sets a strict retention per individual death claim (&#x20c4; 40k), while <strong>Cat XOL</strong> covers multi-life disaster events (e.g. crew bus collision, offshore platform incident).
          </p>
        </div>
      </div>
    </div>
  );
};
