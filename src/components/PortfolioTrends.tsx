/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Claim, TreatyConfig, OverallCalculationSummary, LineOfBusiness } from '../types/reinsurance';
import { formatCurrency, formatPercent, OMANI_RIAL_SIGN } from '../utils/reinsuranceEngine';
import {
  TrendingUp,
  Calendar,
  Activity,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  Info,
  Table,
  Filter,
  BarChart2,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';

interface PortfolioTrendsProps {
  claims: Claim[];
  treaties: TreatyConfig;
  summary?: OverallCalculationSummary;
}

interface PeriodDataPoint {
  periodKey: string; // '2026-10' or '2026-10-04'
  label: string; // 'Oct 2026' or 'Oct 04'
  dateSortValue: number;
  claimsCount: number;
  totalGrossLoss: number;
  avgSeverity: number;
  medianSeverity: number;
  maxClaimLoss: number;
  minClaimLoss: number;
  lobBreakdown: Record<string, number>;
  topLob: string;
  momFreqChangePct: number | null;
  momSevChangePct: number | null;
  claims: Claim[];
}

export const PortfolioTrends: React.FC<PortfolioTrendsProps> = ({
  claims,
  treaties,
}) => {
  const [metricMode, setMetricMode] = useState<'dual' | 'frequency' | 'severity' | 'totalLoss'>('dual');
  const [selectedLob, setSelectedLob] = useState<string>('ALL');
  const [granularity, setGranularity] = useState<'month' | 'day'>('month');
  const [hoveredPointIndex, setHoveredPointIndex] = useState<number | null>(null);
  const [showDataTable, setShowDataTable] = useState<boolean>(false);

  // Filter claims by selected LOB
  const filteredClaims = useMemo(() => {
    if (selectedLob === 'ALL') return claims;
    if (selectedLob === 'P&C Lines') {
      return claims.filter(
        (c) =>
          c.lob === 'P&C Lines' ||
          c.lob === 'Commercial Property' ||
          c.lob === 'Industrial Plant' ||
          c.lob === 'Residential High-Value' ||
          c.lob === 'Warehouse & Logistics' ||
          c.lob === 'Energy & Marine'
      );
    }
    return claims.filter((c) => c.lob === selectedLob);
  }, [claims, selectedLob]);

  // Aggregate claims into month-over-month (or day-by-day) periods
  const trendData = useMemo<PeriodDataPoint[]>(() => {
    if (filteredClaims.length === 0) return [];

    const periodMap = new Map<string, Claim[]>();

    filteredClaims.forEach((claim) => {
      let key = '2026-10';
      if (claim.eventDate) {
        if (granularity === 'month') {
          // 'YYYY-MM'
          key = claim.eventDate.substring(0, 7);
        } else {
          // 'YYYY-MM-DD'
          key = claim.eventDate.substring(0, 10);
        }
      }
      if (!periodMap.has(key)) {
        periodMap.set(key, []);
      }
      periodMap.get(key)!.push(claim);
    });

    // Sort periods chronologically
    const sortedKeys = Array.from(periodMap.keys()).sort();

    const points: PeriodDataPoint[] = [];

    sortedKeys.forEach((key) => {
      const pClaims = periodMap.get(key)!;
      const count = pClaims.length;
      const totalGross = pClaims.reduce((s, c) => s + c.grossLoss, 0);
      const avg = count > 0 ? totalGross / count : 0;

      const sortedLosses = [...pClaims].map((c) => c.grossLoss).sort((a, b) => a - b);
      const median =
        count % 2 === 0
          ? (sortedLosses[count / 2 - 1] + sortedLosses[count / 2]) / 2
          : sortedLosses[Math.floor(count / 2)];

      const max = sortedLosses[sortedLosses.length - 1];
      const min = sortedLosses[0];

      // LOB distribution
      const lobCountMap: Record<string, number> = {};
      pClaims.forEach((c) => {
        const lob = c.lob;
        lobCountMap[lob] = (lobCountMap[lob] || 0) + 1;
      });

      let topLob = 'P&C Lines';
      let maxLobCount = -1;
      Object.entries(lobCountMap).forEach(([lob, lCount]) => {
        if (lCount > maxLobCount) {
          maxLobCount = lCount;
          topLob = lob;
        }
      });

      // Label formatting
      let label = key;
      if (granularity === 'month') {
        const [year, month] = key.split('-');
        if (year && month) {
          const monthIndex = parseInt(month, 10) - 1;
          const monthNames = [
            'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
            'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
          ];
          label = `${monthNames[monthIndex] || month} ${year}`;
        }
      } else {
        const parts = key.split('-');
        if (parts.length === 3) {
          const monthIndex = parseInt(parts[1], 10) - 1;
          const monthNames = [
            'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
            'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
          ];
          label = `${monthNames[monthIndex] || parts[1]} ${parts[2]}`;
        }
      }

      points.push({
        periodKey: key,
        label,
        dateSortValue: new Date(key).getTime(),
        claimsCount: count,
        totalGrossLoss: totalGross,
        avgSeverity: avg,
        medianSeverity: median,
        maxClaimLoss: max,
        minClaimLoss: min,
        lobBreakdown: lobCountMap,
        topLob,
        momFreqChangePct: null,
        momSevChangePct: null,
        claims: pClaims,
      });
    });

    // Compute period-over-period percentage changes
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      if (prev.claimsCount > 0) {
        curr.momFreqChangePct = ((curr.claimsCount - prev.claimsCount) / prev.claimsCount) * 100;
      }
      if (prev.avgSeverity > 0) {
        curr.momSevChangePct = ((curr.avgSeverity - prev.avgSeverity) / prev.avgSeverity) * 100;
      }
    }

    return points;
  }, [filteredClaims, granularity]);

  // Overall trends summary statistics
  const trendStats = useMemo(() => {
    if (trendData.length === 0) {
      return {
        totalPeriods: 0,
        totalClaims: 0,
        totalLoss: 0,
        avgMonthlyFrequency: 0,
        avgMonthlySeverity: 0,
        peakFrequencyPeriod: null as PeriodDataPoint | null,
        peakSeverityPeriod: null as PeriodDataPoint | null,
        lastMomFreqChange: null as number | null,
        lastMomSevChange: null as number | null,
      };
    }

    const totalClaims = trendData.reduce((s, p) => s + p.claimsCount, 0);
    const totalLoss = trendData.reduce((s, p) => s + p.totalGrossLoss, 0);
    const avgMonthlyFrequency = totalClaims / trendData.length;
    const avgMonthlySeverity = totalClaims > 0 ? totalLoss / totalClaims : 0;

    let peakFreq = trendData[0];
    let peakSev = trendData[0];

    trendData.forEach((p) => {
      if (p.claimsCount > peakFreq.claimsCount) peakFreq = p;
      if (p.avgSeverity > peakSev.avgSeverity) peakSev = p;
    });

    const lastPoint = trendData[trendData.length - 1];

    return {
      totalPeriods: trendData.length,
      totalClaims,
      totalLoss,
      avgMonthlyFrequency,
      avgMonthlySeverity,
      peakFrequencyPeriod: peakFreq,
      peakSeverityPeriod: peakSev,
      lastMomFreqChange: lastPoint.momFreqChangePct,
      lastMomSevChange: lastPoint.momSevChangePct,
    };
  }, [trendData]);

  // SVG Chart Geometry
  const chartConfig = useMemo(() => {
    const width = 800;
    const height = 300;
    const margin = { top: 35, right: 70, bottom: 45, left: 60 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    if (trendData.length === 0) {
      return { width, height, margin, innerWidth, innerHeight, pointsCoords: [] };
    }

    // Determine max values for scaling
    const maxFreqRaw = Math.max(...trendData.map((d) => d.claimsCount), 1);
    const maxFreq = Math.ceil(maxFreqRaw * 1.25); // headroom

    const maxSevRaw = Math.max(...trendData.map((d) => d.avgSeverity), 1000);
    const maxSev = Math.ceil((maxSevRaw * 1.25) / 10000) * 10000;

    const maxTotalRaw = Math.max(...trendData.map((d) => d.totalGrossLoss), 1000);
    const maxTotal = Math.ceil((maxTotalRaw * 1.2) / 10000) * 10000;

    const n = trendData.length;
    const step = n > 1 ? innerWidth / (n - 1) : innerWidth / 2;

    const pointsCoords = trendData.map((d, i) => {
      const x = n > 1 ? margin.left + i * step : margin.left + innerWidth / 2;
      const yFreq = margin.top + innerHeight - (d.claimsCount / maxFreq) * innerHeight;
      const ySev = margin.top + innerHeight - (d.avgSeverity / maxSev) * innerHeight;
      const yTotal = margin.top + innerHeight - (d.totalGrossLoss / maxTotal) * innerHeight;

      return {
        data: d,
        x,
        yFreq,
        ySev,
        yTotal,
      };
    });

    return {
      width,
      height,
      margin,
      innerWidth,
      innerHeight,
      maxFreq,
      maxSev,
      maxTotal,
      pointsCoords,
    };
  }, [trendData]);

  // Generate SVG path for a given y accessor
  const generatePath = (accessor: 'yFreq' | 'ySev' | 'yTotal'): string => {
    const coords = chartConfig.pointsCoords;
    if (coords.length === 0) return '';
    if (coords.length === 1) {
      // Single point
      return `M ${coords[0].x - 10} ${coords[0][accessor]} L ${coords[0].x + 10} ${coords[0][accessor]}`;
    }

    // Smooth path using cubic beziers or clean polyline
    return coords.reduce((acc, pt, idx) => {
      if (idx === 0) return `M ${pt.x} ${pt[accessor]}`;
      // Gentle curve between points
      const prev = coords[idx - 1];
      const cx1 = prev.x + (pt.x - prev.x) / 2;
      const cy1 = prev[accessor];
      const cx2 = prev.x + (pt.x - prev.x) / 2;
      const cy2 = pt[accessor];
      return `${acc} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${pt.x} ${pt[accessor]}`;
    }, '');
  };

  // Area under frequency line for background glow
  const generateAreaPath = (accessor: 'yFreq' | 'ySev'): string => {
    const coords = chartConfig.pointsCoords;
    if (coords.length <= 1) return '';
    const linePath = generatePath(accessor);
    const baseline = chartConfig.margin.top + chartConfig.innerHeight;
    const last = coords[coords.length - 1];
    const first = coords[0];
    return `${linePath} L ${last.x} ${baseline} L ${first.x} ${baseline} Z`;
  };

  const activeHoverData =
    hoveredPointIndex !== null && chartConfig.pointsCoords[hoveredPointIndex]
      ? chartConfig.pointsCoords[hoveredPointIndex]
      : null;

  return (
    <div className="st-card p-5 bg-white border border-slate-200 rounded-xl shadow-xs space-y-4">
      {/* Header and Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 tracking-tight">
                  Portfolio Trends: Month-over-Month Claims Frequency & Severity
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                  Actuarial Trend Engine
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Track how claim occurrence rates (frequency) and average claim severity (incurred loss in &#x20c4;) evolve over time.
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls: Metrics Mode & LOB filter */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* LOB Dropdown Filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-md px-2 py-1">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedLob}
              onChange={(e) => setSelectedLob(e.target.value)}
              className="bg-transparent text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Portfolio Lines</option>
              <option value="Motor">Motor</option>
              <option value="P&C Lines">P&C Lines (Property/Casualty)</option>
              <option value="Medical Lines">Medical Lines</option>
              <option value="Group Life Lines">Group Life Lines</option>
            </select>
          </div>

          {/* Granularity Toggle */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-md border border-slate-200 text-[11px] font-semibold">
            <button
              onClick={() => setGranularity('month')}
              className={`px-2 py-1 rounded transition cursor-pointer ${
                granularity === 'month'
                  ? 'bg-white text-indigo-700 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              MoM
            </button>
            <button
              onClick={() => setGranularity('day')}
              className={`px-2 py-1 rounded transition cursor-pointer ${
                granularity === 'day'
                  ? 'bg-white text-indigo-700 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Daily Timeline
            </button>
          </div>

          {/* Metric View Mode Toggle */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-md border border-slate-200 text-[11px] font-semibold">
            <button
              onClick={() => setMetricMode('dual')}
              className={`px-2.5 py-1 rounded transition cursor-pointer ${
                metricMode === 'dual'
                  ? 'bg-indigo-600 text-white shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Dual-Axis
            </button>
            <button
              onClick={() => setMetricMode('frequency')}
              className={`px-2.5 py-1 rounded transition cursor-pointer ${
                metricMode === 'frequency'
                  ? 'bg-cyan-600 text-white shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Frequency
            </button>
            <button
              onClick={() => setMetricMode('severity')}
              className={`px-2.5 py-1 rounded transition cursor-pointer ${
                metricMode === 'severity'
                  ? 'bg-amber-600 text-white shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Severity
            </button>
            <button
              onClick={() => setMetricMode('totalLoss')}
              className={`px-2.5 py-1 rounded transition cursor-pointer ${
                metricMode === 'totalLoss'
                  ? 'bg-rose-600 text-white shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Total Loss
            </button>
          </div>
        </div>
      </div>

      {/* Actuarial Metrics Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Metric 1: Monthly Average Frequency */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] font-bold uppercase tracking-wider font-mono">
              Avg {granularity === 'month' ? 'Monthly' : 'Daily'} Frequency
            </span>
            <Activity className="w-3.5 h-3.5 text-cyan-600" />
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-xl font-bold text-slate-900 font-mono">
              {trendStats.avgMonthlyFrequency.toFixed(1)}
            </span>
            <span className="text-xs text-slate-500">claims / {granularity === 'month' ? 'mo' : 'day'}</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
            <span>Peak:</span>
            <span className="font-semibold text-cyan-700">
              {trendStats.peakFrequencyPeriod?.label || 'N/A'} ({trendStats.peakFrequencyPeriod?.claimsCount || 0} claims)
            </span>
          </div>
        </div>

        {/* Metric 2: Average Claim Severity */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] font-bold uppercase tracking-wider font-mono">
              Weighted Avg Severity
            </span>
            <TrendingUp className="w-3.5 h-3.5 text-amber-600" />
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-xl font-bold text-slate-900 font-mono">
              {formatCurrency(trendStats.avgMonthlySeverity)}
            </span>
            <span className="text-xs text-slate-500">/ claim</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
            <span>Highest:</span>
            <span className="font-semibold text-amber-700">
              {trendStats.peakSeverityPeriod?.label || 'N/A'} ({formatCurrency(trendStats.peakSeverityPeriod?.avgSeverity || 0)})
            </span>
          </div>
        </div>

        {/* Metric 3: Latest Period Momentum */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] font-bold uppercase tracking-wider font-mono">
              Latest {granularity === 'month' ? 'MoM' : 'DoD'} Momentum
            </span>
            <Calendar className="w-3.5 h-3.5 text-indigo-600" />
          </div>
          <div className="mt-1 flex items-center gap-3">
            <div>
              <span className="text-[10px] text-slate-400 block font-mono">Freq Change</span>
              {trendStats.lastMomFreqChange !== null ? (
                <span
                  className={`text-sm font-bold font-mono flex items-center gap-0.5 ${
                    trendStats.lastMomFreqChange > 0
                      ? 'text-rose-600'
                      : trendStats.lastMomFreqChange < 0
                      ? 'text-emerald-600'
                      : 'text-slate-600'
                  }`}
                >
                  {trendStats.lastMomFreqChange > 0 ? (
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  ) : (
                    <ArrowDownRight className="w-3.5 h-3.5" />
                  )}
                  {trendStats.lastMomFreqChange > 0 ? '+' : ''}
                  {trendStats.lastMomFreqChange.toFixed(0)}%
                </span>
              ) : (
                <span className="text-xs text-slate-400">Baseline</span>
              )}
            </div>
            <div className="border-l border-slate-200 pl-3">
              <span className="text-[10px] text-slate-400 block font-mono">Sev Change</span>
              {trendStats.lastMomSevChange !== null ? (
                <span
                  className={`text-sm font-bold font-mono flex items-center gap-0.5 ${
                    trendStats.lastMomSevChange > 0
                      ? 'text-rose-600'
                      : trendStats.lastMomSevChange < 0
                      ? 'text-emerald-600'
                      : 'text-slate-600'
                  }`}
                >
                  {trendStats.lastMomSevChange > 0 ? (
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  ) : (
                    <ArrowDownRight className="w-3.5 h-3.5" />
                  )}
                  {trendStats.lastMomSevChange > 0 ? '+' : ''}
                  {trendStats.lastMomSevChange.toFixed(0)}%
                </span>
              ) : (
                <span className="text-xs text-slate-400">Baseline</span>
              )}
            </div>
          </div>
          <div className="text-[10px] text-slate-400 mt-1 truncate">
            Last period: {trendData[trendData.length - 1]?.label || 'Current'}
          </div>
        </div>

        {/* Metric 4: Risk XOL Layer Penetration Indicator */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] font-bold uppercase tracking-wider font-mono">
              Risk XOL Threshold
            </span>
            <Layers className="w-3.5 h-3.5 text-purple-600" />
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-xl font-bold text-indigo-900 font-mono">
              {formatCurrency(treaties.riskXol.limit + treaties.riskXol.attachmentPoint)}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            {trendStats.avgMonthlySeverity > treaties.riskXol.attachmentPoint ? (
              <span className="text-amber-700 font-semibold flex items-center gap-1">
                <AlertTriangle className="w-3 h-3 text-amber-600" /> Layer Triggered ({formatPercent(treaties.riskXol.rateOnLine)} ROL)
              </span>
            ) : (
              <span className="text-emerald-700 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Below Risk XOL Attachment
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Chart Legend & Interactive Hints */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs px-1">
        <div className="flex items-center gap-4 flex-wrap">
          {(metricMode === 'dual' || metricMode === 'frequency') && (
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-cyan-500 border border-cyan-600 inline-block shadow-2xs"></span>
              <span className="font-semibold text-slate-700">Frequency</span>
              <span className="text-slate-400">(Claim Count, Left Axis)</span>
            </div>
          )}

          {(metricMode === 'dual' || metricMode === 'severity') && (
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-amber-500 border border-amber-600 inline-block shadow-2xs"></span>
              <span className="font-semibold text-slate-700">Average Severity</span>
              <span className="text-slate-400">(Incurred &#x20c4; / Claim, Right Axis)</span>
            </div>
          )}

          {metricMode === 'totalLoss' && (
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-rose-500 border border-rose-600 inline-block shadow-2xs"></span>
              <span className="font-semibold text-slate-700">Total Period Loss</span>
              <span className="text-slate-400">(Aggregate Gross &#x20c4;)</span>
            </div>
          )}

          <div className="flex items-center gap-1.5">
            <span className="w-4 border-t-2 border-dashed border-indigo-400 inline-block"></span>
            <span className="text-slate-500">Risk XOL Cap ({formatCurrency(treaties.riskXol.limit + treaties.riskXol.attachmentPoint)})</span>
          </div>
        </div>

        <div className="text-[11px] text-slate-400 font-mono">
          Hover over data nodes for detailed period inspection
        </div>
      </div>

      {/* SVG Line Chart Container */}
      <div className="relative bg-gradient-to-b from-slate-50/50 to-white border border-slate-200 rounded-lg p-2 overflow-hidden">
        {trendData.length === 0 ? (
          <div className="py-20 text-center text-slate-400 text-xs">
            No claims available for the selected line of business.
          </div>
        ) : (
          <div className="w-full overflow-x-auto">
            <svg
              viewBox={`0 0 ${chartConfig.width} ${chartConfig.height}`}
              className="w-full h-auto min-w-[620px] select-none"
            >
              <defs>
                {/* Gradient for Frequency area */}
                <linearGradient id="freqGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.0" />
                </linearGradient>

                {/* Gradient for Severity area */}
                <linearGradient id="sevGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.0" />
                </linearGradient>

                {/* Gradient for Total Loss area */}
                <linearGradient id="totalLossGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#e11d48" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#e11d48" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Horizontal Grid lines (5 tiers) */}
              {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
                const y = chartConfig.margin.top + chartConfig.innerHeight * (1 - ratio);
                const freqVal = Math.round(ratio * (chartConfig.maxFreq || 1));
                const sevVal = Math.round(ratio * (chartConfig.maxSev || 1000));
                const totalVal = Math.round(ratio * (chartConfig.maxTotal || 1000));

                return (
                  <g key={idx}>
                    <line
                      x1={chartConfig.margin.left}
                      y1={y}
                      x2={chartConfig.width - chartConfig.margin.right}
                      y2={y}
                      stroke="#e2e8f0"
                      strokeDasharray={idx === 0 ? 'none' : '4,4'}
                      strokeWidth="1"
                    />

                    {/* Left Axis: Frequency ticks */}
                    {(metricMode === 'dual' || metricMode === 'frequency') && (
                      <text
                        x={chartConfig.margin.left - 10}
                        y={y + 3}
                        textAnchor="end"
                        fontSize="10"
                        className="fill-cyan-800 font-mono font-semibold"
                      >
                        {freqVal}
                      </text>
                    )}

                    {/* Left Axis: Total Loss ticks */}
                    {metricMode === 'totalLoss' && (
                      <text
                        x={chartConfig.margin.left - 10}
                        y={y + 3}
                        textAnchor="end"
                        fontSize="10"
                        className="fill-rose-700 font-mono font-semibold"
                      >
                        {totalVal >= 1000000
                          ? `${(totalVal / 1000000).toFixed(1)}M`
                          : totalVal >= 1000
                          ? `${(totalVal / 1000).toFixed(0)}k`
                          : totalVal}
                      </text>
                    )}

                    {/* Right Axis: Severity ticks */}
                    {(metricMode === 'dual' || metricMode === 'severity') && (
                      <text
                        x={chartConfig.width - chartConfig.margin.right + 10}
                        y={y + 3}
                        textAnchor="start"
                        fontSize="10"
                        className="fill-amber-800 font-mono font-semibold"
                      >
                        {OMANI_RIAL_SIGN}{' '}
                        {sevVal >= 1000000
                          ? `${(sevVal / 1000000).toFixed(1)}M`
                          : sevVal >= 1000
                          ? `${(sevVal / 1000).toFixed(0)}k`
                          : sevVal}
                      </text>
                    )}
                  </g>
                );
              })}

              {/* Risk XOL Layer Ceiling Reference Line */}
              {(() => {
                const riskCeiling = treaties.riskXol.limit + treaties.riskXol.attachmentPoint;
                if (chartConfig.maxSev && riskCeiling <= chartConfig.maxSev) {
                  const yRisk =
                    chartConfig.margin.top +
                    chartConfig.innerHeight -
                    (riskCeiling / chartConfig.maxSev) * chartConfig.innerHeight;
                  return (
                    <g>
                      <line
                        x1={chartConfig.margin.left}
                        y1={yRisk}
                        x2={chartConfig.width - chartConfig.margin.right}
                        y2={yRisk}
                        stroke="#818cf8"
                        strokeDasharray="6,4"
                        strokeWidth="1.5"
                      />
                      <text
                        x={chartConfig.width - chartConfig.margin.right - 8}
                        y={yRisk - 4}
                        textAnchor="end"
                        fontSize="9"
                        className="fill-indigo-700 font-mono font-bold"
                      >
                        Risk XOL Layer Cap: {formatCurrency(riskCeiling)}
                      </text>
                    </g>
                  );
                }
                return null;
              })()}

              {/* Area Fills */}
              {(metricMode === 'dual' || metricMode === 'frequency') && (
                <path d={generateAreaPath('yFreq')} fill="url(#freqGradient)" />
              )}
              {metricMode === 'severity' && (
                <path d={generateAreaPath('ySev')} fill="url(#sevGradient)" />
              )}
              {metricMode === 'totalLoss' && (
                <path d={generateAreaPath('yTotal' as any)} fill="url(#totalLossGradient)" />
              )}

              {/* Lines */}
              {/* Frequency Line */}
              {(metricMode === 'dual' || metricMode === 'frequency') && (
                <path
                  d={generatePath('yFreq')}
                  fill="none"
                  stroke="#0891b2"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {/* Severity Line */}
              {(metricMode === 'dual' || metricMode === 'severity') && (
                <path
                  d={generatePath('ySev')}
                  fill="none"
                  stroke="#f59e0b"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {/* Total Loss Line */}
              {metricMode === 'totalLoss' && (
                <path
                  d={generatePath('yTotal')}
                  fill="none"
                  stroke="#e11d48"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {/* Interactive Hover Crosshair */}
              {activeHoverData && (
                <g>
                  <line
                    x1={activeHoverData.x}
                    y1={chartConfig.margin.top}
                    x2={activeHoverData.x}
                    y2={chartConfig.margin.top + chartConfig.innerHeight}
                    stroke="#94a3b8"
                    strokeDasharray="3,3"
                    strokeWidth="1.5"
                  />
                </g>
              )}

              {/* Data Nodes & X-Axis Labels */}
              {chartConfig.pointsCoords.map((pt, idx) => {
                const isHovered = hoveredPointIndex === idx;

                return (
                  <g
                    key={idx}
                    className="cursor-pointer group"
                    onMouseEnter={() => setHoveredPointIndex(idx)}
                    onMouseLeave={() => setHoveredPointIndex(null)}
                  >
                    {/* Invisible expanded hit area */}
                    <rect
                      x={pt.x - 20}
                      y={chartConfig.margin.top}
                      width={40}
                      height={chartConfig.innerHeight}
                      fill="transparent"
                    />

                    {/* Frequency Node */}
                    {(metricMode === 'dual' || metricMode === 'frequency') && (
                      <circle
                        cx={pt.x}
                        cy={pt.yFreq}
                        r={isHovered ? 6 : 4}
                        fill="#0891b2"
                        stroke="#ffffff"
                        strokeWidth="2"
                        className="transition-all duration-150 shadow-xs"
                      />
                    )}

                    {/* Severity Node */}
                    {(metricMode === 'dual' || metricMode === 'severity') && (
                      <circle
                        cx={pt.x}
                        cy={pt.ySev}
                        r={isHovered ? 6 : 4}
                        fill="#f59e0b"
                        stroke="#ffffff"
                        strokeWidth="2"
                        className="transition-all duration-150 shadow-xs"
                      />
                    )}

                    {/* Total Loss Node */}
                    {metricMode === 'totalLoss' && (
                      <circle
                        cx={pt.x}
                        cy={pt.yTotal}
                        r={isHovered ? 6 : 4}
                        fill="#e11d48"
                        stroke="#ffffff"
                        strokeWidth="2"
                        className="transition-all duration-150 shadow-xs"
                      />
                    )}

                    {/* X-Axis Date Label */}
                    <text
                      x={pt.x}
                      y={chartConfig.margin.top + chartConfig.innerHeight + 20}
                      textAnchor="middle"
                      fontSize="10"
                      className={`font-mono transition ${
                        isHovered
                          ? 'fill-indigo-900 font-bold scale-105'
                          : 'fill-slate-600 font-medium'
                      }`}
                    >
                      {pt.data.label}
                    </text>

                    {/* Sub-label count badge */}
                    <text
                      x={pt.x}
                      y={chartConfig.margin.top + chartConfig.innerHeight + 32}
                      textAnchor="middle"
                      fontSize="9"
                      className="fill-slate-400 font-mono"
                    >
                      {pt.data.claimsCount} {pt.data.claimsCount === 1 ? 'clm' : 'clms'}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        )}

        {/* Floating Tooltip Card */}
        {activeHoverData && (
          <div
            className="absolute top-4 right-4 z-20 bg-slate-900/95 backdrop-blur-md text-white border border-slate-700/80 p-3.5 rounded-xl shadow-xl text-xs w-72 pointer-events-none animate-in fade-in duration-150"
          >
            <div className="flex items-center justify-between border-b border-slate-700 pb-2 mb-2.5">
              <span className="font-bold text-sm tracking-tight text-white flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                {activeHoverData.data.label}
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                Primary: {activeHoverData.data.topLob}
              </span>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 flex items-center gap-1">
                  <Activity className="w-3.5 h-3.5 text-cyan-400" /> Claims Frequency:
                </span>
                <span className="font-mono font-bold text-cyan-300">
                  {activeHoverData.data.claimsCount} claims
                  {activeHoverData.data.momFreqChangePct !== null && (
                    <span
                      className={`ml-1.5 text-[10px] ${
                        activeHoverData.data.momFreqChangePct > 0 ? 'text-rose-400' : 'text-emerald-400'
                      }`}
                    >
                      ({activeHoverData.data.momFreqChangePct > 0 ? '+' : ''}
                      {activeHoverData.data.momFreqChangePct.toFixed(0)}%)
                    </span>
                  )}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400 flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5 text-amber-400" /> Average Severity:
                </span>
                <span className="font-mono font-bold text-amber-300">
                  {formatCurrency(activeHoverData.data.avgSeverity)}
                  {activeHoverData.data.momSevChangePct !== null && (
                    <span
                      className={`ml-1.5 text-[10px] ${
                        activeHoverData.data.momSevChangePct > 0 ? 'text-rose-400' : 'text-emerald-400'
                      }`}
                    >
                      ({activeHoverData.data.momSevChangePct > 0 ? '+' : ''}
                      {activeHoverData.data.momSevChangePct.toFixed(0)}%)
                    </span>
                  )}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400">Total Period Loss:</span>
                <span className="font-mono font-bold text-white">
                  {formatCurrency(activeHoverData.data.totalGrossLoss)}
                </span>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800 pt-1.5 mt-1.5">
                <span>Max Single Loss:</span>
                <span className="font-mono text-slate-200">
                  {formatCurrency(activeHoverData.data.maxClaimLoss)}
                </span>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>Median Severity:</span>
                <span className="font-mono text-slate-200">
                  {formatCurrency(activeHoverData.data.medianSeverity)}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Toggle Monthly Data Table for Actuarial Audit Trail */}
      <div className="pt-1">
        <button
          onClick={() => setShowDataTable(!showDataTable)}
          className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition cursor-pointer"
        >
          <Table className="w-3.5 h-3.5" />
          <span>
            {showDataTable ? 'Hide Monthly Claims Trend Table' : 'Show Detailed Monthly Trend Table & Actuarial Summary'}
          </span>
        </button>

        {showDataTable && (
          <div className="mt-3 border border-slate-200 rounded-lg overflow-x-auto animate-in fade-in duration-200">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 text-slate-700 uppercase font-bold tracking-wider text-[10px] border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Period</th>
                  <th className="py-2.5 px-3 text-right">Frequency (Count)</th>
                  <th className="py-2.5 px-3 text-right">Total Incurred Loss</th>
                  <th className="py-2.5 px-3 text-right">Average Severity</th>
                  <th className="py-2.5 px-3 text-right">Median Severity</th>
                  <th className="py-2.5 px-3 text-right">Max Single Claim</th>
                  <th className="py-2.5 px-3">Leading LOB</th>
                  <th className="py-2.5 px-3 text-right">MoM Freq %</th>
                  <th className="py-2.5 px-3 text-right">MoM Sev %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {trendData.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80 transition">
                    <td className="py-2 px-3 font-semibold text-slate-900 font-mono">
                      {row.label}
                    </td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-cyan-800">
                      {row.claimsCount}
                    </td>
                    <td className="py-2 px-3 text-right font-mono font-semibold text-slate-900">
                      {formatCurrency(row.totalGrossLoss)}
                    </td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-amber-800">
                      {formatCurrency(row.avgSeverity)}
                    </td>
                    <td className="py-2 px-3 text-right font-mono text-slate-600">
                      {formatCurrency(row.medianSeverity)}
                    </td>
                    <td className="py-2 px-3 text-right font-mono text-slate-600">
                      {formatCurrency(row.maxClaimLoss)}
                    </td>
                    <td className="py-2 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                        {row.topLob}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-right font-mono">
                      {row.momFreqChangePct !== null ? (
                        <span
                          className={
                            row.momFreqChangePct > 0
                              ? 'text-rose-600 font-semibold'
                              : row.momFreqChangePct < 0
                              ? 'text-emerald-600 font-semibold'
                              : 'text-slate-500'
                          }
                        >
                          {row.momFreqChangePct > 0 ? '+' : ''}
                          {row.momFreqChangePct.toFixed(1)}%
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="py-2 px-3 text-right font-mono">
                      {row.momSevChangePct !== null ? (
                        <span
                          className={
                            row.momSevChangePct > 0
                              ? 'text-rose-600 font-semibold'
                              : row.momSevChangePct < 0
                              ? 'text-emerald-600 font-semibold'
                              : 'text-slate-500'
                          }
                        >
                          {row.momSevChangePct > 0 ? '+' : ''}
                          {row.momSevChangePct.toFixed(1)}%
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Actuarial Interpretation Note */}
      <div className="p-3 bg-indigo-50/50 border border-indigo-200/80 rounded-lg text-xs text-indigo-950 flex items-start gap-2.5">
        <Info className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-semibold block">Actuarial Trend Diagnostic</span>
          <p className="text-[11px] text-indigo-900 leading-relaxed">
            In reinsurance underwriting, a simultaneous upward spike in <strong>frequency</strong> and <strong>severity</strong> indicates a catastrophic event clash (such as tropical cyclone storm surges affecting multiple commercial risks). In contrast, elevated frequency with moderate severity signals attritional motor or medical loss accumulation, which is primarily mitigated via <em>Quota Share</em> and <em>Aggregate Stop-Loss</em> rather than per-risk XOL layers.
          </p>
        </div>
      </div>
    </div>
  );
};
