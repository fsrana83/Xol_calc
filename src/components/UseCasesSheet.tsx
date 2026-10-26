/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  REINSURANCE_USE_CASES,
  ReinsuranceUseCase,
  exportUseCasesToDocx,
  exportUseCasesToPdf,
} from '../utils/useCasesExporter';
import { formatCurrency, formatPercent } from '../utils/reinsuranceEngine';
import {
  FileText,
  Download,
  BookOpen,
  Shield,
  Layers,
  ArrowRight,
  CheckCircle2,
  Search,
  Filter,
  Sparkles,
  Scale,
  Zap,
  Building,
  Anchor,
  Wind,
  Flame,
  Check,
} from 'lucide-react';

interface UseCasesSheetProps {
  onSelectScenarioPreset?: (scenarioId: string) => void;
}

export const UseCasesSheet: React.FC<UseCasesSheetProps> = ({ onSelectScenarioPreset }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isExportingDocx, setIsExportingDocx] = useState<boolean>(false);
  const [isExportingPdf, setIsExportingPdf] = useState<boolean>(false);
  const [expandedId, setExpandedId] = useState<string | null>(REINSURANCE_USE_CASES[0].id);
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  const categories = [
    { id: 'all', label: 'All Use Cases' },
    { id: 'Catastrophe', label: 'Catastrophe' },
    { id: 'Per-Risk Property', label: 'Per-Risk Property' },
    { id: 'Accumulation & Clash', label: 'Clash & Marine' },
    { id: 'Stress Testing', label: 'Stress Testing' },
    { id: 'Solvency & Capital', label: 'Solvency & Capital' },
  ];

  const filteredUseCases = REINSURANCE_USE_CASES.filter((uc) => {
    const matchesCat = selectedCategory === 'all' || uc.category === selectedCategory;
    const matchesSearch =
      searchQuery.trim() === '' ||
      uc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      uc.peril.toLowerCase().includes(searchQuery.toLowerCase()) ||
      uc.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      uc.objective.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const handleExportDocx = async () => {
    try {
      setIsExportingDocx(true);
      await exportUseCasesToDocx();
      setExportNotice('Successfully downloaded Word DOCX report!');
      setTimeout(() => setExportNotice(null), 4000);
    } catch (err) {
      console.error('Failed to export DOCX:', err);
      setExportNotice('Failed to export DOCX document.');
      setTimeout(() => setExportNotice(null), 4000);
    } finally {
      setIsExportingDocx(false);
    }
  };

  const handleExportPdf = () => {
    try {
      setIsExportingPdf(true);
      exportUseCasesToPdf();
      setExportNotice('Successfully downloaded PDF document!');
      setTimeout(() => setExportNotice(null), 4000);
    } catch (err) {
      console.error('Failed to export PDF:', err);
      setExportNotice('Failed to export PDF document.');
      setTimeout(() => setExportNotice(null), 4000);
    } finally {
      setIsExportingPdf(false);
    }
  };

  const getPerilIcon = (category: string) => {
    switch (category) {
      case 'Catastrophe':
        return <Wind className="w-4 h-4 text-indigo-500" />;
      case 'Per-Risk Property':
        return <Flame className="w-4 h-4 text-amber-500" />;
      case 'Accumulation & Clash':
        return <Anchor className="w-4 h-4 text-blue-500" />;
      case 'Stress Testing':
        return <Zap className="w-4 h-4 text-rose-500" />;
      case 'Solvency & Capital':
        return <Scale className="w-4 h-4 text-emerald-500" />;
      default:
        return <Building className="w-4 h-4 text-slate-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notice */}
      {exportNotice && (
        <div className="fixed bottom-4 right-4 z-50 bg-slate-900 text-white text-xs px-4 py-2.5 rounded-lg shadow-xl border border-slate-700 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{exportNotice}</span>
        </div>
      )}

      {/* Top Banner Card */}
      <div className="st-card p-6 bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white border-0 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2 text-indigo-300 font-mono text-xs uppercase tracking-wider font-semibold">
              <BookOpen className="w-4 h-4 text-indigo-400" />
              <span>Actuarial Reinsurance Master Guide & Treaty Use Cases</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Reinsurance Use Cases Catalog & Calculation Engine
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Explore 8 comprehensive real-world actuarial use cases under the Omani insurance market framework. Each case details treaty priority, mathematical mechanics, worked numerical examples, and balance sheet capital impacts denominated in Omani Rial (&#x20c4; / OMR).
            </p>
            <div className="flex flex-wrap gap-2 pt-1 text-[11px] font-mono text-slate-300">
              <span className="bg-white/10 px-2 py-0.5 rounded border border-white/10">
                80% Quota Share
              </span>
              <span className="bg-white/10 px-2 py-0.5 rounded border border-white/10">
                &#x20c4; 40K xs &#x20c4; 10K Risk XOL
              </span>
              <span className="bg-white/10 px-2 py-0.5 rounded border border-white/10">
                &#x20c4; 2M xs &#x20c4; 200K Cat XOL
              </span>
              <span className="bg-white/10 px-2 py-0.5 rounded border border-white/10">
                &#x20c4; 600K ASL Limit
              </span>
            </div>
          </div>

          {/* Export Action Buttons */}
          <div className="flex flex-col sm:flex-row md:flex-col gap-2.5 shrink-0">
            <button
              onClick={handleExportDocx}
              disabled={isExportingDocx}
              className="px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-md hover:shadow-lg disabled:opacity-50 cursor-pointer"
            >
              <FileText className="w-4 h-4" />
              <span>{isExportingDocx ? 'Generating DOCX...' : 'Export Use Cases as DOCX (.docx)'}</span>
            </button>

            <button
              onClick={handleExportPdf}
              disabled={isExportingPdf}
              className="px-4 py-2.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-md hover:shadow-lg disabled:opacity-50 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>{isExportingPdf ? 'Generating PDF...' : 'Export Use Cases as PDF (.pdf)'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="st-card p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Category Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 text-xs">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-md font-medium transition whitespace-nowrap cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative min-w-[240px]">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search use cases by peril or keyword..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-800"
          />
        </div>
      </div>

      {/* Use Cases Cards Grid / List */}
      <div className="space-y-4">
        {filteredUseCases.map((uc) => {
          const isExpanded = expandedId === uc.id;
          const b = uc.sampleBreakdown;

          return (
            <div
              key={uc.id}
              className={`st-card transition-all duration-200 overflow-hidden border ${
                isExpanded ? 'border-blue-300 ring-1 ring-blue-200 shadow-md' : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              {/* Card Header */}
              <div
                onClick={() => setExpandedId(isExpanded ? null : uc.id)}
                className="p-5 cursor-pointer bg-white hover:bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center font-mono font-bold text-slate-800 text-sm shrink-0 border border-slate-200">
                    #{uc.number}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1">
                        {getPerilIcon(uc.category)}
                        {uc.category}
                      </span>
                      <span className="text-xs text-slate-500 font-mono">
                        Peril: {uc.peril}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 mt-1">
                      {uc.title}
                    </h3>
                    <p className="text-xs text-slate-600 mt-0.5 line-clamp-2">
                      {uc.summary}
                    </p>
                  </div>
                </div>

                {/* Right Summary Badge */}
                <div className="flex sm:flex-col items-center sm:items-end justify-between shrink-0 pl-11 sm:pl-0">
                  <span className="text-[11px] text-slate-500">Gross Loss Example:</span>
                  <span className="font-mono font-bold text-slate-900 text-sm">
                    {formatCurrency(uc.sampleGrossLoss)}
                  </span>
                  <span className="text-[10px] text-emerald-600 font-semibold">
                    {b.effectiveCessionPercent.toFixed(1)}% Reinsurance Absorption
                  </span>
                </div>
              </div>

              {/* Expanded Card Details */}
              {isExpanded && (
                <div className="p-5 pt-3 border-t border-slate-100 bg-slate-50/50 space-y-5">
                  {/* Business Objective */}
                  <div className="bg-white p-3.5 rounded-lg border border-slate-200 text-xs">
                    <span className="font-bold text-slate-900 block mb-1">Business & Strategic Objective:</span>
                    <p className="text-slate-600 leading-relaxed">{uc.objective}</p>
                  </div>

                  {/* Treaty Mechanics Cascade */}
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-blue-600" />
                      <span>Treaty Inuring Cascade & Loss Allocation Sequence</span>
                    </span>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                      {uc.treatyMechanics.map((step, idx) => (
                        <div
                          key={idx}
                          className="bg-white p-3 rounded-lg border border-slate-200 text-xs flex gap-2.5"
                        >
                          <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                            {idx + 1}
                          </div>
                          <p className="text-slate-700 leading-snug">{step}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Numerical Calculation Audit Table */}
                  <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                    <div className="bg-slate-100 px-4 py-2 border-b border-slate-200 flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800">
                        Worked Loss Allocation Breakdown (Currency: Omani Rial &#x20c4;)
                      </span>
                      <span className="text-[10px] font-mono text-slate-500">
                        Actuarial Equation: {uc.formulaExplanation}
                      </span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b border-slate-200 text-slate-500 bg-slate-50/50">
                            <th className="py-2 px-3 text-left font-semibold">Treaty Stage</th>
                            <th className="py-2 px-3 text-right font-semibold">Absorbed Amount (&#x20c4;)</th>
                            <th className="py-2 px-3 text-right font-semibold">% of Gross Loss</th>
                            <th className="py-2 px-3 text-left font-semibold">Coverage Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-mono">
                          <tr>
                            <td className="py-2 px-3 font-sans font-medium text-slate-800">Gross Incurred Loss</td>
                            <td className="py-2 px-3 text-right font-bold text-slate-900">{formatCurrency(b.grossLoss)}</td>
                            <td className="py-2 px-3 text-right text-slate-500">100.0%</td>
                            <td className="py-2 px-3 font-sans text-slate-600">Direct Portfolio Incurred</td>
                          </tr>
                          <tr className="bg-blue-50/30">
                            <td className="py-2 px-3 font-sans font-medium text-blue-900">1. Quota Share Cession (20%)</td>
                            <td className="py-2 px-3 text-right text-blue-700 font-semibold">{formatCurrency(b.qsCeded)}</td>
                            <td className="py-2 px-3 text-right text-blue-600">{((b.qsCeded / b.grossLoss) * 100).toFixed(1)}%</td>
                            <td className="py-2 px-3 font-sans text-blue-700">Proportional ground-up transfer</td>
                          </tr>
                          <tr className="bg-amber-50/30">
                            <td className="py-2 px-3 font-sans font-medium text-amber-900">2. Working Risk XOL Recovery</td>
                            <td className="py-2 px-3 text-right text-amber-700 font-semibold">{formatCurrency(b.riskXolRecovery)}</td>
                            <td className="py-2 px-3 text-right text-amber-600">{((b.riskXolRecovery / b.grossLoss) * 100).toFixed(1)}%</td>
                            <td className="py-2 px-3 font-sans text-amber-700">Per-risk layer &#x20c4; 40k xs &#x20c4; 10k</td>
                          </tr>
                          <tr className="bg-indigo-50/30">
                            <td className="py-2 px-3 font-sans font-medium text-indigo-900">3. Catastrophe XOL Recovery</td>
                            <td className="py-2 px-3 text-right text-indigo-700 font-semibold">{formatCurrency(b.catXolRecovery)}</td>
                            <td className="py-2 px-3 text-right text-indigo-600">{((b.catXolRecovery / b.grossLoss) * 100).toFixed(1)}%</td>
                            <td className="py-2 px-3 font-sans text-indigo-700">Event layer &#x20c4; 2M xs &#x20c4; 200k</td>
                          </tr>
                          <tr className="bg-teal-50/30">
                            <td className="py-2 px-3 font-sans font-medium text-teal-900">4. Aggregate Stop-Loss (ASL) Recovery</td>
                            <td className="py-2 px-3 text-right text-teal-700 font-semibold">{formatCurrency(b.aslRecovery)}</td>
                            <td className="py-2 px-3 text-right text-teal-600">{((b.aslRecovery / b.grossLoss) * 100).toFixed(1)}%</td>
                            <td className="py-2 px-3 font-sans text-teal-700">Portfolio retention cap &#x20c4; 600k xs &#x20c4; 600k</td>
                          </tr>
                          <tr className="bg-emerald-50 font-bold border-t-2 border-emerald-200">
                            <td className="py-2.5 px-3 font-sans text-emerald-950">Net Retained Loss (Direct Insurer)</td>
                            <td className="py-2.5 px-3 text-right text-emerald-800 text-sm">{formatCurrency(b.netRetained)}</td>
                            <td className="py-2.5 px-3 text-right text-emerald-800">{((b.netRetained / b.grossLoss) * 100).toFixed(1)}%</td>
                            <td className="py-2.5 px-3 font-sans text-emerald-900 font-semibold">Ultimate Direct Balance Sheet Impact</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* Visual absorption stacked bar */}
                    <div className="p-3 bg-slate-50 border-t border-slate-200">
                      <div className="text-[11px] text-slate-500 mb-1.5 flex justify-between">
                        <span>Treaty Absorption Stack:</span>
                        <span className="font-semibold text-slate-800">
                          {b.effectiveCessionPercent.toFixed(1)}% Ceded / {((b.netRetained / b.grossLoss) * 100).toFixed(1)}% Retained
                        </span>
                      </div>
                      <div className="h-3 w-full bg-slate-200 rounded-full flex overflow-hidden">
                        <div style={{ width: `${(b.qsCeded / b.grossLoss) * 100}%` }} className="bg-blue-500 h-full" title="QS" />
                        <div style={{ width: `${(b.riskXolRecovery / b.grossLoss) * 100}%` }} className="bg-amber-500 h-full" title="Risk XOL" />
                        <div style={{ width: `${(b.catXolRecovery / b.grossLoss) * 100}%` }} className="bg-indigo-600 h-full" title="Cat XOL" />
                        <div style={{ width: `${(b.aslRecovery / b.grossLoss) * 100}%` }} className="bg-teal-500 h-full" title="ASL" />
                        <div style={{ width: `${(b.netRetained / b.grossLoss) * 100}%` }} className="bg-emerald-500 h-full" title="Net Retained" />
                      </div>
                    </div>
                  </div>

                  {/* Balance Sheet & Regulatory Insights */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div className="bg-white p-3.5 rounded-lg border border-slate-200">
                      <div className="flex items-center gap-1.5 font-bold text-slate-900 mb-1">
                        <Shield className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Balance Sheet & Solvency Impact</span>
                      </div>
                      <p className="text-slate-600 leading-relaxed">{uc.balanceSheetImpact}</p>
                    </div>

                    <div className="bg-white p-3.5 rounded-lg border border-slate-200">
                      <div className="flex items-center gap-1.5 font-bold text-slate-900 mb-1">
                        <Scale className="w-3.5 h-3.5 text-blue-600" />
                        <span>Regulatory Relevance (CMA Oman / ORSA)</span>
                      </div>
                      <p className="text-slate-600 leading-relaxed">{uc.regulatoryRelevance}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
