/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  Claim,
  TreatyConfig,
  OverallCalculationSummary,
  CoreLineOfBusiness,
  LobTreatyMap,
} from '../types/reinsurance';
import {
  CORE_LOBS,
  DEFAULT_LOB_TREATIES,
  formatCurrency,
  formatPercent,
  getLobConfig,
  OMANI_RIAL_SIGN,
} from '../utils/reinsuranceEngine';
import {
  AlertTriangle,
  ShieldAlert,
  Flame,
  AlertCircle,
  CheckCircle2,
  TrendingUp,
  Car,
  Building2,
  HeartPulse,
  Users2,
  ArrowUpRight,
  Filter,
  Search,
  SlidersHorizontal,
  ChevronRight,
  Layers,
  Shield,
  Zap,
  Info,
} from 'lucide-react';

export type ThreatSeverity = 'critical' | 'high' | 'moderate' | 'controlled';

export interface AnalyzedClaimThreat {
  claim: Claim;
  coreLob: CoreLineOfBusiness;
  grossLoss: number;
  lobTotalGross: number;
  lobSharePercent: number; // Claim gross / LOB gross * 100
  portfolioSharePercent: number; // Claim gross / total portfolio gross * 100
  severity: ThreatSeverity;
  riskXolStatus: 'exhausted' | 'heavy_penetration' | 'attached' | 'below_attachment' | 'not_applicable';
  riskXolSpillover: number;
  catContributionPercent: number; // Claim gross / Cat attachment (200k) * 100
  diagnosisTitle: string;
  diagnosisDetails: string;
}

interface LobAggregateLimitThreatMonitorProps {
  claims: Claim[];
  treaties: TreatyConfig;
  summary: OverallCalculationSummary;
  onUpdateClaimLoss?: (claimId: string, newGross: number) => void;
  onNavigateToLobSetup?: () => void;
}

/**
 * Normalizes any specific LOB string to one of the 4 core Lines of Business
 */
function normalizeToCoreLob(lob: string): CoreLineOfBusiness {
  if (lob === 'Motor') return 'Motor';
  if (lob === 'Medical Lines') return 'Medical Lines';
  if (lob === 'Group Life Lines') return 'Group Life Lines';
  // Commercial Property, Industrial, Marine, etc. map to P&C Lines
  return 'P&C Lines';
}

export const LobAggregateLimitThreatMonitor: React.FC<LobAggregateLimitThreatMonitorProps> = ({
  claims,
  treaties,
  summary,
  onUpdateClaimLoss,
  onNavigateToLobSetup,
}) => {
  const [selectedLobFilter, setSelectedLobFilter] = useState<string>('ALL');
  const [selectedSeverityFilter, setSelectedSeverityFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [editingClaimId, setEditingClaimId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');

  const currentLobTreaties: LobTreatyMap = treaties.lobTreaties || DEFAULT_LOB_TREATIES;

  // Key treaty thresholds
  const riskXolAttach = treaties.riskXol?.attachmentPoint || 10000;
  const riskXolLimit = treaties.riskXol?.limit || 40000;
  const riskXolExhaustion = riskXolAttach + riskXolLimit; // e.g. 50,000 OMR
  const catXolAttach = treaties.catXol?.attachmentPoint || 200000; // e.g. 200,000 OMR
  const aslAttach = treaties.aggregateStopLoss?.attachmentPoint || 400000; // 400,000 OMR
  const aslLimit = treaties.aggregateStopLoss?.limit || 600000; // 600,000 OMR

  // Group claims by Core LOB and calculate totals
  const lobAggregates = useMemo(() => {
    const map: Record<CoreLineOfBusiness, { gross: number; claimsCount: number; claims: Claim[] }> = {
      'Motor': { gross: 0, claimsCount: 0, claims: [] },
      'P&C Lines': { gross: 0, claimsCount: 0, claims: [] },
      'Medical Lines': { gross: 0, claimsCount: 0, claims: [] },
      'Group Life Lines': { gross: 0, claimsCount: 0, claims: [] },
    };

    claims.forEach((c) => {
      const core = normalizeToCoreLob(c.lob);
      map[core].gross += c.grossLoss;
      map[core].claimsCount += 1;
      map[core].claims.push(c);
    });

    return map;
  }, [claims]);

  // Evaluate each claim's threat level against LOB aggregates & treaty limits
  const analyzedClaims: AnalyzedClaimThreat[] = useMemo(() => {
    const totalPortfolioGross = Math.max(1, summary.totalGrossLoss);

    return claims.map((c) => {
      const coreLob = normalizeToCoreLob(c.lob);
      const lobTotalGross = Math.max(1, lobAggregates[coreLob].gross);
      const lobConfig = getLobConfig(coreLob, currentLobTreaties);
      const lobShare = (c.grossLoss / lobTotalGross) * 100;
      const portfolioShare = (c.grossLoss / totalPortfolioGross) * 100;
      const catContribution = (c.grossLoss / catXolAttach) * 100;

      // Risk XOL layer evaluation
      let riskStatus: AnalyzedClaimThreat['riskXolStatus'] = 'below_attachment';
      let spillover = 0;

      if (!lobConfig.riskXol) {
        riskStatus = 'not_applicable';
      } else if (c.grossLoss >= riskXolExhaustion) {
        riskStatus = 'exhausted';
        spillover = c.grossLoss - riskXolExhaustion;
      } else if (c.grossLoss >= riskXolAttach + 0.6 * riskXolLimit) {
        riskStatus = 'heavy_penetration';
      } else if (c.grossLoss >= riskXolAttach) {
        riskStatus = 'attached';
      } else {
        riskStatus = 'below_attachment';
      }

      // Determine Severity
      let severity: ThreatSeverity = 'controlled';
      let diagnosisTitle = 'Controlled Attritional Claim';
      let diagnosisDetails = 'Absorbed within Quota Share baseline retention; minimal pressure on treaty layers.';

      // Critical criteria (Red):
      // - Exhausts Risk XOL layer with spillover (> 50,000 OMR)
      // - Single claim >= 100,000 OMR
      // - Single claim represents >= 35% of the entire LOB aggregate
      // - Claim alone pushes > 45% of the Cat XOL attachment
      if (
        (riskStatus === 'exhausted' && spillover > 0) ||
        c.grossLoss >= 100000 ||
        lobShare >= 35 ||
        catContribution >= 45
      ) {
        severity = 'critical';
        if (riskStatus === 'exhausted') {
          diagnosisTitle = `Critical: Risk XOL Exhausted (+${formatCurrency(spillover)} Spillover)`;
          diagnosisDetails = `Exhausts full ${formatCurrency(riskXolLimit)} Risk XOL limit. Unhedged spillover returns to cedant net account and drives ${formatPercent(lobShare)} of ${coreLob} aggregate.`;
        } else if (lobShare >= 35) {
          diagnosisTitle = `Critical LOB Accumulation Threat (${formatPercent(lobShare)} of LOB)`;
          diagnosisDetails = `Single-handedly consumes more than a third of the entire ${coreLob} portfolio loss, pushing line aggregate directly towards treaty thresholds.`;
        } else {
          diagnosisTitle = `Catastrophic Shock Loss (${formatCurrency(c.grossLoss)})`;
          diagnosisDetails = `Absorbs ${formatPercent(catContribution)} of Cat XOL attachment threshold alone. Severe capital strain on cedant retention.`;
        }
      }
      // High severity criteria (Orange):
      // - Heavy Risk XOL penetration (between 34,000 and 50,000 OMR)
      // - Or represents 20% to 35% of LOB aggregate
      // - Or gross loss >= 50,000 OMR in an LOB without Risk XOL
      // - Or Cat contribution 25% to 45%
      else if (
        riskStatus === 'heavy_penetration' ||
        lobShare >= 20 ||
        c.grossLoss >= 50000 ||
        catContribution >= 25
      ) {
        severity = 'high';
        if (riskStatus === 'heavy_penetration') {
          diagnosisTitle = `High Risk XOL Utilization (Deep Penetration)`;
          diagnosisDetails = `Loss between ${formatCurrency(riskXolAttach + 0.6 * riskXolLimit)} and ${formatCurrency(riskXolExhaustion)}. Consumes majority of layer recovery and accounts for ${formatPercent(lobShare)} of ${coreLob}.`;
        } else {
          diagnosisTitle = `High LOB Aggregate Driver (${formatPercent(lobShare)} of Line)`;
          diagnosisDetails = `Substantial claim volume driving ${coreLob} towards Cat XOL (${formatCurrency(catXolAttach)}) and ASL limits.`;
        }
      }
      // Moderate severity criteria (Yellow):
      // - Attached to Risk XOL (10,000 to 34,000 OMR)
      // - Or represents 10% to 20% of LOB aggregate
      // - Or gross loss between 15,000 and 50,000 OMR
      else if (
        riskStatus === 'attached' ||
        lobShare >= 10 ||
        c.grossLoss >= 15000
      ) {
        severity = 'moderate';
        diagnosisTitle = `Moderate: Attaches to Treaty Layer`;
        diagnosisDetails = `Penetrates Risk XOL attachment threshold (${formatCurrency(riskXolAttach)}) or contributes moderate aggregation share (${formatPercent(lobShare)}).`;
      }

      return {
        claim: c,
        coreLob,
        grossLoss: c.grossLoss,
        lobTotalGross,
        lobSharePercent: lobShare,
        portfolioSharePercent: portfolioShare,
        severity,
        riskXolStatus: riskStatus,
        riskXolSpillover: spillover,
        catContributionPercent: catContribution,
        diagnosisTitle,
        diagnosisDetails,
      };
    });
  }, [claims, lobAggregates, summary.totalGrossLoss, currentLobTreaties, riskXolAttach, riskXolLimit, riskXolExhaustion, catXolAttach]);

  // Aggregate counts by severity
  const severityCounts = useMemo(() => {
    const counts = { critical: 0, high: 0, moderate: 0, controlled: 0 };
    analyzedClaims.forEach((item) => {
      counts[item.severity]++;
    });
    return counts;
  }, [analyzedClaims]);

  // Top critical claim across entire portfolio
  const topThreatClaim = useMemo(() => {
    if (analyzedClaims.length === 0) return null;
    return [...analyzedClaims].sort((a, b) => b.grossLoss - a.grossLoss)[0];
  }, [analyzedClaims]);

  // Filtered claims based on UI filters
  const filteredClaims = useMemo(() => {
    return analyzedClaims
      .filter((item) => {
        if (selectedLobFilter !== 'ALL' && item.coreLob !== selectedLobFilter) {
          return false;
        }
        if (selectedSeverityFilter !== 'ALL' && item.severity !== selectedSeverityFilter) {
          return false;
        }
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchNumber = item.claim.claimNumber.toLowerCase().includes(q);
          const matchInsured = item.claim.insuredName.toLowerCase().includes(q);
          const matchEvent = item.claim.eventName.toLowerCase().includes(q);
          const matchLoc = item.claim.location.toLowerCase().includes(q);
          if (!matchNumber && !matchInsured && !matchEvent && !matchLoc) {
            return false;
          }
        }
        return true;
      })
      .sort((a, b) => {
        // Sort critical first, then high, moderate, controlled, then gross loss descending
        const severityRank: Record<ThreatSeverity, number> = {
          critical: 4,
          high: 3,
          moderate: 2,
          controlled: 1,
        };
        const rankDiff = severityRank[b.severity] - severityRank[a.severity];
        if (rankDiff !== 0) return rankDiff;
        return b.grossLoss - a.grossLoss;
      });
  }, [analyzedClaims, selectedLobFilter, selectedSeverityFilter, searchQuery]);

  const handleStartEdit = (claimId: string, currentGross: number) => {
    setEditingClaimId(claimId);
    setEditValue(currentGross.toString());
  };

  const handleSaveEdit = (claimId: string) => {
    const val = parseFloat(editValue);
    if (!isNaN(val) && val >= 0 && onUpdateClaimLoss) {
      onUpdateClaimLoss(claimId, val);
    }
    setEditingClaimId(null);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden transition-all">
      {/* Top Actuarial Threat Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-5 text-white">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="p-1.5 bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-4 h-4 text-rose-400 animate-pulse" />
              </span>
              <h3 className="text-base font-bold tracking-tight text-white flex items-center gap-2">
                <span>LOB Aggregate Limit Pressure & Critical Claims Radar</span>
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                Live Actuarial Surveillance
              </span>
            </div>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              Detects large concentration claims pushing individual Line of Business (LOB) aggregates toward Risk XOL limits ({formatCurrency(riskXolLimit)}), Cat XOL attachment ({formatCurrency(catXolAttach)}), and Stop-Loss boundaries ({formatCurrency(aslAttach)}).
            </p>
          </div>

          {/* Severity Counters Strip */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            {/* Critical */}
            <button
              onClick={() => setSelectedSeverityFilter(selectedSeverityFilter === 'critical' ? 'ALL' : 'critical')}
              className={`px-3 py-1.5 rounded-lg border text-left transition cursor-pointer ${
                selectedSeverityFilter === 'critical'
                  ? 'bg-rose-500/30 border-rose-400 ring-2 ring-rose-400'
                  : 'bg-rose-950/40 border-rose-800/80 hover:bg-rose-900/40'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping"></span>
                <span className="text-[10px] uppercase font-bold text-rose-300 tracking-wider">Critical</span>
              </div>
              <div className="text-lg font-mono font-bold text-white mt-0.5">
                {severityCounts.critical}
                <span className="text-[10px] font-normal text-rose-300 ml-1">claims</span>
              </div>
            </button>

            {/* High */}
            <button
              onClick={() => setSelectedSeverityFilter(selectedSeverityFilter === 'high' ? 'ALL' : 'high')}
              className={`px-3 py-1.5 rounded-lg border text-left transition cursor-pointer ${
                selectedSeverityFilter === 'high'
                  ? 'bg-amber-500/30 border-amber-400 ring-2 ring-amber-400'
                  : 'bg-amber-950/40 border-amber-800/80 hover:bg-amber-900/40'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                <span className="text-[10px] uppercase font-bold text-amber-300 tracking-wider">High</span>
              </div>
              <div className="text-lg font-mono font-bold text-white mt-0.5">
                {severityCounts.high}
                <span className="text-[10px] font-normal text-amber-300 ml-1">claims</span>
              </div>
            </button>

            {/* Moderate */}
            <button
              onClick={() => setSelectedSeverityFilter(selectedSeverityFilter === 'moderate' ? 'ALL' : 'moderate')}
              className={`px-3 py-1.5 rounded-lg border text-left transition cursor-pointer ${
                selectedSeverityFilter === 'moderate'
                  ? 'bg-yellow-500/30 border-yellow-400 ring-2 ring-yellow-400'
                  : 'bg-yellow-950/40 border-yellow-800/80 hover:bg-yellow-900/40'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-yellow-400"></span>
                <span className="text-[10px] uppercase font-bold text-yellow-300 tracking-wider">Moderate</span>
              </div>
              <div className="text-lg font-mono font-bold text-white mt-0.5">
                {severityCounts.moderate}
                <span className="text-[10px] font-normal text-yellow-300 ml-1">claims</span>
              </div>
            </button>

            {/* Controlled */}
            <button
              onClick={() => setSelectedSeverityFilter(selectedSeverityFilter === 'controlled' ? 'ALL' : 'controlled')}
              className={`px-3 py-1.5 rounded-lg border text-left transition cursor-pointer ${
                selectedSeverityFilter === 'controlled'
                  ? 'bg-emerald-500/30 border-emerald-400 ring-2 ring-emerald-400'
                  : 'bg-emerald-950/40 border-emerald-800/80 hover:bg-emerald-900/40'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                <span className="text-[10px] uppercase font-bold text-emerald-300 tracking-wider">Stable</span>
              </div>
              <div className="text-lg font-mono font-bold text-white mt-0.5">
                {severityCounts.controlled}
                <span className="text-[10px] font-normal text-emerald-300 ml-1">claims</span>
              </div>
            </button>
          </div>
        </div>

        {/* Highlight Callout: Top Risk Driver */}
        {topThreatClaim && (
          <div className="mt-4 pt-3 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-rose-400 font-bold flex items-center gap-1 uppercase tracking-wider text-[10px] bg-rose-500/20 px-2 py-0.5 rounded border border-rose-500/30">
                <Flame className="w-3.5 h-3.5" /> Primary Treaty Threat
              </span>
              <span className="text-slate-200 font-medium">
                <strong>{topThreatClaim.claim.insuredName}</strong> ({topThreatClaim.coreLob})
              </span>
              <span className="text-rose-300 font-mono font-bold">
                {formatCurrency(topThreatClaim.grossLoss)}
              </span>
            </div>
            <div className="text-slate-400 text-[11px] flex items-center gap-2">
              <span>{topThreatClaim.diagnosisTitle}</span>
              <span className="hidden md:inline">• Drives {formatPercent(topThreatClaim.lobSharePercent)} of {topThreatClaim.coreLob} volume</span>
            </div>
          </div>
        )}
      </div>

      {/* LOB Aggregate Pressure Grid (4 Core Lines) */}
      <div className="p-5 border-b border-slate-200 bg-slate-50/70">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-600" />
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              LOB Aggregate Accumulation vs Treaty Thresholds
            </h4>
          </div>
          {onNavigateToLobSetup && (
            <button
              onClick={onNavigateToLobSetup}
              className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
            >
              <span>Manage LOB Treaty Rules</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {CORE_LOBS.map((lob) => {
            const data = lobAggregates[lob];
            const lobConfig = getLobConfig(lob, currentLobTreaties);
            const isSelected = selectedLobFilter === lob;

            // Compute % of Cat XOL attachment (200k)
            const catProgress = Math.min(100, (data.gross / catXolAttach) * 100);
            const isCatAttached = data.gross >= catXolAttach;

            // Highest claim in this LOB
            const topClaimInLob = analyzedClaims
              .filter((c) => c.coreLob === lob)
              .sort((a, b) => b.grossLoss - a.grossLoss)[0];

            // Critical or high claims count in this LOB
            const criticalInLob = analyzedClaims.filter(
              (c) => c.coreLob === lob && (c.severity === 'critical' || c.severity === 'high')
            ).length;

            let icon = <Building2 className="w-4 h-4 text-amber-600" />;
            let borderColor = 'border-amber-200';
            let activePillBg = 'bg-amber-50 text-amber-800';

            if (lob === 'Motor') {
              icon = <Car className="w-4 h-4 text-sky-600" />;
              borderColor = 'border-sky-200';
              activePillBg = 'bg-sky-50 text-sky-800';
            } else if (lob === 'Medical Lines') {
              icon = <HeartPulse className="w-4 h-4 text-emerald-600" />;
              borderColor = 'border-emerald-200';
              activePillBg = 'bg-emerald-50 text-emerald-800';
            } else if (lob === 'Group Life Lines') {
              icon = <Users2 className="w-4 h-4 text-purple-600" />;
              borderColor = 'border-purple-200';
              activePillBg = 'bg-purple-50 text-purple-800';
            }

            return (
              <div
                key={lob}
                onClick={() => setSelectedLobFilter(isSelected ? 'ALL' : lob)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer bg-white ${
                  isSelected
                    ? 'ring-2 ring-indigo-600 shadow-md border-indigo-500'
                    : 'hover:shadow-xs hover:border-slate-300 ' + borderColor
                }`}
              >
                {/* LOB Card Header */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-md bg-slate-100">{icon}</div>
                    <div>
                      <span className="text-xs font-bold text-slate-900 block leading-tight">
                        {lob}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {data.claimsCount} {data.claimsCount === 1 ? 'claim' : 'claims'}
                      </span>
                    </div>
                  </div>

                  {criticalInLob > 0 ? (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-100 text-rose-700 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-ping"></span>
                      {criticalInLob} Threat{criticalInLob > 1 ? 's' : ''}
                    </span>
                  ) : (
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700">
                      Stable
                    </span>
                  )}
                </div>

                {/* Aggregate Gross Metric */}
                <div className="mb-2">
                  <div className="text-base font-mono font-bold text-slate-900">
                    {formatCurrency(data.gross)}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    {formatPercent((data.gross / Math.max(1, summary.totalGrossLoss)) * 100)} of portfolio gross
                  </div>
                </div>

                {/* Treaty Limit Progress vs Cat XOL (200K OMR) */}
                <div className="space-y-1 mb-2.5">
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="text-slate-500">Cat XOL Attachment ({formatCurrency(catXolAttach)}):</span>
                    <span className={`font-mono font-bold ${isCatAttached ? 'text-rose-600' : 'text-slate-700'}`}>
                      {formatPercent(catProgress)}
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        isCatAttached
                          ? 'bg-gradient-to-r from-amber-500 to-rose-600'
                          : catProgress > 60
                          ? 'bg-amber-500'
                          : 'bg-indigo-500'
                      }`}
                      style={{ width: `${Math.min(100, catProgress)}%` }}
                    />
                  </div>
                </div>

                {/* Top Single Claim in Line */}
                {topClaimInLob ? (
                  <div className="pt-2 border-t border-slate-100 text-[10px]">
                    <div className="text-slate-400 flex items-center justify-between">
                      <span>Max Single Claim:</span>
                      <span className="font-mono font-bold text-slate-800">
                        {formatCurrency(topClaimInLob.grossLoss)}
                      </span>
                    </div>
                    <div className="truncate text-slate-600 mt-0.5 font-medium">
                      {topClaimInLob.claim.insuredName} ({formatPercent(topClaimInLob.lobSharePercent)} of LOB)
                    </div>
                  </div>
                ) : (
                  <div className="pt-2 border-t border-slate-100 text-[10px] text-slate-400 italic">
                    No claims reported in this line
                  </div>
                )}

                {/* Treaty Badges Enabled */}
                <div className="mt-2.5 flex items-center gap-1 flex-wrap">
                  <span
                    className={`text-[9px] font-mono px-1.5 py-0.2 rounded ${
                      lobConfig.quotaShare ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-slate-100 text-slate-400'
                    }`}
                  >
                    QS
                  </span>
                  <span
                    className={`text-[9px] font-mono px-1.5 py-0.2 rounded ${
                      lobConfig.riskXol ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-slate-100 text-slate-400'
                    }`}
                  >
                    Risk
                  </span>
                  <span
                    className={`text-[9px] font-mono px-1.5 py-0.2 rounded ${
                      lobConfig.catXol ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' : 'bg-slate-100 text-slate-400'
                    }`}
                  >
                    Cat
                  </span>
                  <span
                    className={`text-[9px] font-mono px-1.5 py-0.2 rounded ${
                      lobConfig.aggregateStopLoss ? 'bg-teal-50 text-teal-700 border border-teal-200' : 'bg-slate-100 text-slate-400'
                    }`}
                  >
                    ASL
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Controls & Filter Toolbar */}
      <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white">
        {/* Left: LOB Filter Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto text-xs pb-1 sm:pb-0">
          <span className="text-slate-400 text-xs font-semibold mr-1 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Line:
          </span>
          <button
            onClick={() => setSelectedLobFilter('ALL')}
            className={`px-2.5 py-1 rounded-md font-semibold transition cursor-pointer ${
              selectedLobFilter === 'ALL'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            All Lines ({claims.length})
          </button>
          {CORE_LOBS.map((lob) => {
            const count = lobAggregates[lob].claimsCount;
            return (
              <button
                key={lob}
                onClick={() => setSelectedLobFilter(lob)}
                className={`px-2.5 py-1 rounded-md font-semibold transition whitespace-nowrap cursor-pointer ${
                  selectedLobFilter === lob
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {lob} ({count})
              </button>
            );
          })}
        </div>

        {/* Right: Severity Filter Pills & Search */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-xs">
            <button
              onClick={() => setSelectedSeverityFilter('ALL')}
              className={`px-2 py-0.5 rounded-md font-medium transition cursor-pointer ${
                selectedSeverityFilter === 'ALL' ? 'bg-white shadow-2xs text-slate-900 font-bold' : 'text-slate-600'
              }`}
            >
              All Alerts
            </button>
            <button
              onClick={() => setSelectedSeverityFilter('critical')}
              className={`px-2 py-0.5 rounded-md font-medium transition flex items-center gap-1 cursor-pointer ${
                selectedSeverityFilter === 'critical' ? 'bg-rose-600 text-white font-bold' : 'text-rose-700'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
              Critical ({severityCounts.critical})
            </button>
            <button
              onClick={() => setSelectedSeverityFilter('high')}
              className={`px-2 py-0.5 rounded-md font-medium transition flex items-center gap-1 cursor-pointer ${
                selectedSeverityFilter === 'high' ? 'bg-amber-500 text-white font-bold' : 'text-amber-700'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
              High ({severityCounts.high})
            </button>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter claims or insured..."
              className="pl-8 pr-3 py-1 text-xs border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 w-44 sm:w-56"
            />
          </div>
        </div>
      </div>

      {/* Claims Threat Radar List / Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[10px]">
              <th className="py-2.5 px-4">Threat Level</th>
              <th className="py-2.5 px-4">Claim Details & Insured</th>
              <th className="py-2.5 px-3">LOB</th>
              <th className="py-2.5 px-3 text-right">Gross Loss</th>
              <th className="py-2.5 px-3">Share of LOB Aggregate</th>
              <th className="py-2.5 px-4">Treaty Limit Diagnosis & Layer Impact</th>
              <th className="py-2.5 px-3 text-center">Quick Adjust</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-sans">
            {filteredClaims.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-8 text-slate-400 italic">
                  No claims match the active filter criteria.
                </td>
              </tr>
            ) : (
              filteredClaims.map((item) => {
                const isEditing = editingClaimId === item.claim.id;

                // Color-coded styling variables
                let rowBg = 'hover:bg-slate-50/80';
                let borderLeft = 'border-l-4 border-l-emerald-400';
                let badgeClass = 'bg-emerald-100 text-emerald-800 border-emerald-200';
                let indicatorDot = 'bg-emerald-500';
                let severityLabel = 'Stable Retention';

                if (item.severity === 'critical') {
                  rowBg = 'bg-rose-50/40 hover:bg-rose-50/70';
                  borderLeft = 'border-l-4 border-l-rose-600';
                  badgeClass = 'bg-rose-100 text-rose-800 border-rose-300 font-bold';
                  indicatorDot = 'bg-rose-600 animate-ping';
                  severityLabel = 'Critical Breach';
                } else if (item.severity === 'high') {
                  rowBg = 'bg-amber-50/40 hover:bg-amber-50/70';
                  borderLeft = 'border-l-4 border-l-amber-500';
                  badgeClass = 'bg-amber-100 text-amber-800 border-amber-300 font-bold';
                  indicatorDot = 'bg-amber-500';
                  severityLabel = 'High Pressure';
                } else if (item.severity === 'moderate') {
                  rowBg = 'bg-yellow-50/30 hover:bg-yellow-50/60';
                  borderLeft = 'border-l-4 border-l-yellow-400';
                  badgeClass = 'bg-yellow-100 text-yellow-800 border-yellow-300 font-medium';
                  indicatorDot = 'bg-yellow-500';
                  severityLabel = 'Moderate Layer';
                }

                return (
                  <tr key={item.claim.id} className={`${rowBg} ${borderLeft} transition-colors`}>
                    {/* Threat Level Badge */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="relative flex h-2 w-2">
                          {item.severity === 'critical' && (
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                          )}
                          <span
                            className={`relative inline-flex rounded-full h-2 w-2 ${
                              item.severity === 'critical'
                                ? 'bg-rose-600'
                                : item.severity === 'high'
                                ? 'bg-amber-500'
                                : item.severity === 'moderate'
                                ? 'bg-yellow-500'
                                : 'bg-emerald-500'
                            }`}
                          ></span>
                        </span>
                        <span
                          className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border ${badgeClass}`}
                        >
                          {severityLabel}
                        </span>
                      </div>
                    </td>

                    {/* Claim Details & Insured */}
                    <td className="py-3 px-4">
                      <div>
                        <div className="font-bold text-slate-900 flex items-center gap-1.5">
                          <span>{item.claim.insuredName}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono mt-0.5 flex items-center gap-2">
                          <span>{item.claim.claimNumber}</span>
                          <span>•</span>
                          <span className="text-slate-400">{item.claim.location}</span>
                          <span>•</span>
                          <span className="text-indigo-600 font-semibold">{item.claim.eventName}</span>
                        </div>
                      </div>
                    </td>

                    {/* LOB */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded font-mono ${
                          item.coreLob === 'Motor'
                            ? 'bg-sky-100 text-sky-800'
                            : item.coreLob === 'Medical Lines'
                            ? 'bg-emerald-100 text-emerald-800'
                            : item.coreLob === 'Group Life Lines'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {item.coreLob}
                      </span>
                    </td>

                    {/* Gross Loss */}
                    <td className="py-3 px-3 text-right whitespace-nowrap font-mono font-bold text-slate-900">
                      {isEditing ? (
                        <div className="flex items-center justify-end gap-1">
                          <input
                            type="number"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            className="w-24 px-1.5 py-0.5 text-xs border border-indigo-400 rounded focus:outline-none"
                            autoFocus
                          />
                          <button
                            onClick={() => handleSaveEdit(item.claim.id)}
                            className="px-2 py-0.5 bg-indigo-600 text-white rounded text-[10px] font-bold cursor-pointer"
                          >
                            Save
                          </button>
                        </div>
                      ) : (
                        <span
                          className={`text-xs ${
                            item.grossLoss >= 100000
                              ? 'text-rose-700 font-extrabold text-sm'
                              : item.grossLoss >= 50000
                              ? 'text-amber-800 font-bold'
                              : 'text-slate-900'
                          }`}
                        >
                          {formatCurrency(item.grossLoss)}
                        </span>
                      )}
                    </td>

                    {/* Share of LOB Aggregate */}
                    <td className="py-3 px-3 whitespace-nowrap min-w-[150px]">
                      <div className="space-y-1">
                        <div className="flex justify-between items-center text-[11px] font-mono">
                          <span className="text-slate-500">of {item.coreLob}:</span>
                          <span
                            className={`font-bold ${
                              item.lobSharePercent >= 35
                                ? 'text-rose-700'
                                : item.lobSharePercent >= 20
                                ? 'text-amber-700'
                                : 'text-slate-700'
                            }`}
                          >
                            {formatPercent(item.lobSharePercent)}
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-200/70 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              item.lobSharePercent >= 35
                                ? 'bg-rose-600'
                                : item.lobSharePercent >= 20
                                ? 'bg-amber-500'
                                : item.lobSharePercent >= 10
                                ? 'bg-yellow-500'
                                : 'bg-emerald-500'
                            }`}
                            style={{ width: `${Math.min(100, item.lobSharePercent)}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Treaty Limit Diagnosis */}
                    <td className="py-3 px-4 max-w-sm">
                      <div>
                        <div
                          className={`text-xs font-semibold leading-snug flex items-center gap-1 ${
                            item.severity === 'critical'
                              ? 'text-rose-900'
                              : item.severity === 'high'
                              ? 'text-amber-900'
                              : item.severity === 'moderate'
                              ? 'text-yellow-900'
                              : 'text-slate-700'
                          }`}
                        >
                          {item.severity === 'critical' && (
                            <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                          )}
                          <span>{item.diagnosisTitle}</span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5 leading-tight">
                          {item.diagnosisDetails}
                        </p>
                      </div>
                    </td>

                    {/* Quick Adjust Button */}
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      {!isEditing ? (
                        <button
                          onClick={() => handleStartEdit(item.claim.id, item.grossLoss)}
                          className="px-2 py-1 bg-white border border-slate-200 hover:border-indigo-400 hover:text-indigo-600 text-slate-600 rounded text-[11px] font-medium transition cursor-pointer"
                          title="Stress test this claim with custom loss amount"
                        >
                          Stress Loss
                        </button>
                      ) : (
                        <button
                          onClick={() => setEditingClaimId(null)}
                          className="text-[11px] text-slate-400 hover:text-slate-600 cursor-pointer"
                        >
                          Cancel
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Actuarial Guidance Footer */}
      <div className="p-3.5 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-indigo-600 shrink-0" />
          <span>
            Color Warning Logic: 🔴 Critical = Loss ≥ {formatCurrency(riskXolExhaustion)} (Risk XOL exhausted + cedant spillover) or ≥ 35% of LOB aggregate • 🟠 High = Deep layer absorption (60-100% of Risk XOL) or ≥ 20% of LOB • 🟡 Moderate = Attaches to treaty layer.
          </span>
        </div>
        <div className="text-[11px] text-slate-400 font-mono shrink-0">
          Evaluated under OMR ({OMANI_RIAL_SIGN}) Actuarial Standards
        </div>
      </div>
    </div>
  );
};
