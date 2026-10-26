import React, { useState, useMemo } from 'react';
import { Claim, ClaimCalculation } from '../types/reinsurance';
import { formatCurrency, formatPercent } from '../utils/reinsuranceEngine';
import {
  Search,
  Filter,
  Download,
  Plus,
  Trash2,
  Edit2,
  Copy,
  ArrowUpDown,
  Check,
  X,
  FileSpreadsheet,
} from 'lucide-react';

interface ClaimLedgerTableProps {
  claimBreakdowns: ClaimCalculation[];
  onAddClaim: () => void;
  onUpdateClaimLoss: (claimId: string, newGross: number) => void;
  onDeleteClaim: (claimId: string) => void;
  onDuplicateClaim: (claimId: string) => void;
}

export const ClaimLedgerTable: React.FC<ClaimLedgerTableProps> = ({
  claimBreakdowns,
  onAddClaim,
  onUpdateClaimLoss,
  onDeleteClaim,
  onDuplicateClaim,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLob, setSelectedLob] = useState<string>('ALL');
  const [editingClaimId, setEditingClaimId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [sortField, setSortField] = useState<'gross' | 'net' | 'risk' | 'insured'>('gross');
  const [sortAsc, setSortAsc] = useState<boolean>(false);

  // Filtered & sorted claims
  const filteredClaims = useMemo(() => {
    return claimBreakdowns
      .filter((item) => {
        const matchesSearch =
          item.claim.insuredName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.claim.claimNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.claim.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.claim.eventName.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesLob = selectedLob === 'ALL' || item.claim.lob === selectedLob;

        return matchesSearch && matchesLob;
      })
      .sort((a, b) => {
        let diff = 0;
        if (sortField === 'gross') diff = a.grossLoss - b.grossLoss;
        else if (sortField === 'net') diff = a.finalNetRetained - b.finalNetRetained;
        else if (sortField === 'risk') diff = a.riskXolCeded - b.riskXolCeded;
        else if (sortField === 'insured') diff = a.claim.insuredName.localeCompare(b.claim.insuredName);
        return sortAsc ? diff : -diff;
      });
  }, [claimBreakdowns, searchTerm, selectedLob, sortField, sortAsc]);

  const handleStartEdit = (claimId: string, currentGross: number) => {
    setEditingClaimId(claimId);
    setEditValue(currentGross.toString());
  };

  const handleSaveEdit = (claimId: string) => {
    const num = parseFloat(editValue);
    if (!isNaN(num) && num >= 0) {
      onUpdateClaimLoss(claimId, num);
    }
    setEditingClaimId(null);
  };

  const handleSort = (field: 'gross' | 'net' | 'risk' | 'insured') => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  const exportToCsv = () => {
    const headers = [
      'Claim Number',
      'Policy Number',
      'Insured Name',
      'LOB',
      'Location',
      'Event Name',
      'Gross Loss',
      'Quota Share Ceded',
      'Net After QS',
      'Risk XOL Ceded',
      'Risk XOL Status',
      'Cat XOL Share',
      'Cedant Net Retained',
    ];

    const rows = claimBreakdowns.map((c) => [
      c.claim.claimNumber,
      c.claim.policyNumber,
      `"${c.claim.insuredName}"`,
      c.claim.lob,
      `"${c.claim.location}"`,
      `"${c.claim.eventName}"`,
      c.grossLoss,
      c.qsCeded,
      c.netAfterQS,
      c.riskXolCeded,
      c.riskXolStatus,
      c.catXolCededShare,
      c.finalNetRetained,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `reinsurance_claim_ledger_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Totals for current filtered set
  const totals = useMemo(() => {
    return filteredClaims.reduce(
      (acc, c) => {
        acc.gross += c.grossLoss;
        acc.qs += c.qsCeded;
        acc.netQS += c.netAfterQS;
        acc.risk += c.riskXolCeded;
        acc.cat += c.catXolCededShare;
        acc.net += c.finalNetRetained;
        return acc;
      },
      { gross: 0, qs: 0, netQS: 0, risk: 0, cat: 0, net: 0 }
    );
  }, [filteredClaims]);

  return (
    <div className="st-card p-5">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 pb-3 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-[#ff4b4b]" />
            <h3 className="text-base font-bold text-slate-800">
              Claim-by-Claim Reinsurance Ledger ({claimBreakdowns.length} Claims)
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit trail of how each individual claim triggers Quota Share, Risk XOL, and Cat XOL allocations
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={onAddClaim}
            className="px-3 py-1.5 bg-[#ff4b4b] hover:bg-[#ff3333] text-white rounded-md text-xs font-semibold shadow-xs flex items-center gap-1.5 transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Claim</span>
          </button>
          <button
            onClick={exportToCsv}
            className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-md text-xs font-semibold shadow-xs flex items-center gap-1.5 transition"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search claim #, insured, city..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#ff4b4b]"
          />
        </div>

        {/* LOB Filter */}
        <div className="flex items-center gap-1.5">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={selectedLob}
            onChange={(e) => setSelectedLob(e.target.value)}
            className="w-full py-1.5 px-2.5 text-xs bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#ff4b4b]"
          >
            <option value="ALL">All Lines of Business (LOB)</option>
            <option value="Commercial Property">Commercial Property</option>
            <option value="Industrial Plant">Industrial Plant</option>
            <option value="Residential High-Value">Residential High-Value</option>
            <option value="Warehouse & Logistics">Warehouse & Logistics</option>
            <option value="Energy & Marine">Energy & Marine</option>
          </select>
        </div>

        {/* Quick info / match count */}
        <div className="text-right text-xs text-slate-500 flex items-center justify-end font-mono">
          Showing {filteredClaims.length} of {claimBreakdowns.length} records
        </div>
      </div>

      {/* Interactive Table */}
      <div className="overflow-x-auto border border-slate-200 rounded-lg">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold uppercase tracking-wider text-[10px]">
              <th className="py-2.5 px-3">
                <button
                  onClick={() => handleSort('insured')}
                  className="flex items-center gap-1 hover:text-slate-900"
                >
                  <span>Claim / Insured</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </button>
              </th>
              <th className="py-2.5 px-3">LOB & Event</th>
              <th className="py-2.5 px-3 text-right">
                <button
                  onClick={() => handleSort('gross')}
                  className="flex items-center gap-1 justify-end hover:text-slate-900 w-full"
                >
                  <span>Gross Loss</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </button>
              </th>
              <th className="py-2.5 px-3 text-right text-blue-700">QS Ceded (20%)</th>
              <th className="py-2.5 px-3 text-right text-slate-700">Net of QS (80%)</th>
              <th className="py-2.5 px-3 text-right text-amber-700">
                <button
                  onClick={() => handleSort('risk')}
                  className="flex items-center gap-1 justify-end hover:text-amber-900 w-full"
                >
                  <span>Risk XOL Recov</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </button>
              </th>
              <th className="py-2.5 px-3 text-center">Risk XOL Status</th>
              <th className="py-2.5 px-3 text-right text-indigo-700">Cat XOL Share</th>
              <th className="py-2.5 px-3 text-right text-slate-900">
                <button
                  onClick={() => handleSort('net')}
                  className="flex items-center gap-1 justify-end hover:text-slate-900 w-full"
                >
                  <span>Final Net Retained</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </button>
              </th>
              <th className="py-2.5 px-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-mono">
            {filteredClaims.length === 0 ? (
              <tr>
                <td colSpan={10} className="py-8 text-center text-slate-400 font-sans">
                  No claims found matching your filter criteria.
                </td>
              </tr>
            ) : (
              filteredClaims.map((item) => {
                const isEditing = editingClaimId === item.claim.id;

                return (
                  <tr
                    key={item.claim.id}
                    className="hover:bg-slate-50/80 transition-colors group"
                  >
                    {/* Insured & Claim Info */}
                    <td className="py-2 px-3 font-sans">
                      <div className="font-semibold text-slate-900">{item.claim.insuredName}</div>
                      <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                        <span>{item.claim.claimNumber}</span>
                        <span>•</span>
                        <span>{item.claim.location}</span>
                      </div>
                    </td>

                    {/* LOB & Event */}
                    <td className="py-2 px-3 font-sans">
                      <div className="text-[11px] text-slate-800">{item.claim.lob}</div>
                      <div className="text-[10px] text-indigo-600 truncate max-w-[130px]">
                        {item.claim.eventName}
                      </div>
                    </td>

                    {/* Gross Incurred Loss */}
                    <td className="py-2 px-3 text-right font-bold text-slate-900">
                      {isEditing ? (
                        <div className="flex items-center justify-end gap-1">
                          <input
                            type="number"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            className="w-24 px-1.5 py-0.5 border border-blue-400 rounded text-right text-xs bg-white focus:outline-none"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveEdit(item.claim.id);
                              if (e.key === 'Escape') setEditingClaimId(null);
                            }}
                          />
                          <button
                            onClick={() => handleSaveEdit(item.claim.id)}
                            className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setEditingClaimId(null)}
                            className="p-1 text-slate-400 hover:bg-slate-100 rounded"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div
                          onClick={() => handleStartEdit(item.claim.id, item.grossLoss)}
                          className="cursor-pointer hover:text-blue-600 group-hover:underline"
                          title="Click to edit gross loss amount"
                        >
                          {formatCurrency(item.grossLoss)}
                        </div>
                      )}
                    </td>

                    {/* Quota Share Ceded */}
                    <td className="py-2 px-3 text-right text-blue-600 font-medium">
                      {formatCurrency(item.qsCeded)}
                    </td>

                    {/* Net After QS */}
                    <td className="py-2 px-3 text-right text-slate-600">
                      {formatCurrency(item.netAfterQS)}
                    </td>

                    {/* Risk XOL Ceded */}
                    <td className="py-2 px-3 text-right text-amber-600 font-semibold">
                      {formatCurrency(item.riskXolCeded)}
                    </td>

                    {/* Risk XOL Status Badge */}
                    <td className="py-2 px-3 text-center font-sans">
                      <span
                        className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                          item.riskXolStatus === 'Exhausted (Spillover)'
                            ? 'bg-rose-100 text-rose-800'
                            : item.riskXolStatus === 'Within Layer (Covered)'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {item.riskXolStatus}
                      </span>
                    </td>

                    {/* Cat XOL Share */}
                    <td className="py-2 px-3 text-right text-indigo-600 font-medium">
                      {formatCurrency(item.catXolCededShare)}
                    </td>

                    {/* Final Net Retained */}
                    <td className="py-2 px-3 text-right font-bold text-slate-900">
                      {formatCurrency(item.finalNetRetained)}
                    </td>

                    {/* Actions */}
                    <td className="py-2 px-3 text-center font-sans">
                      <div className="flex items-center justify-center gap-1 opacity-60 group-hover:opacity-100 transition">
                        <button
                          onClick={() => handleStartEdit(item.claim.id, item.grossLoss)}
                          title="Edit Gross Loss"
                          className="p-1 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => onDuplicateClaim(item.claim.id)}
                          title="Duplicate Claim"
                          className="p-1 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => onDeleteClaim(item.claim.id)}
                          title="Delete Claim"
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>

          {/* Table Totals Row */}
          {filteredClaims.length > 0 && (
            <tfoot>
              <tr className="bg-slate-100/90 font-mono font-bold text-slate-900 border-t-2 border-slate-300">
                <td className="py-2.5 px-3 font-sans" colSpan={2}>
                  TOTALS ({filteredClaims.length} Claims)
                </td>
                <td className="py-2.5 px-3 text-right">{formatCurrency(totals.gross)}</td>
                <td className="py-2.5 px-3 text-right text-blue-700">{formatCurrency(totals.qs)}</td>
                <td className="py-2.5 px-3 text-right text-slate-700">{formatCurrency(totals.netQS)}</td>
                <td className="py-2.5 px-3 text-right text-amber-700">{formatCurrency(totals.risk)}</td>
                <td className="py-2.5 px-3 text-center font-sans text-[10px] text-slate-500">
                  Portfolio Aggregated
                </td>
                <td className="py-2.5 px-3 text-right text-indigo-700">{formatCurrency(totals.cat)}</td>
                <td className="py-2.5 px-3 text-right text-slate-950">{formatCurrency(totals.net)}</td>
                <td></td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
};
