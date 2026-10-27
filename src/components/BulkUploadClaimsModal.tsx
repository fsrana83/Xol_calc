import React, { useState, useRef } from 'react';
import { Claim, LineOfBusiness } from '../types/reinsurance';
import { formatCurrency } from '../utils/reinsuranceEngine';
import {
  Upload,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  AlertTriangle,
  X,
  FileText,
  Layers,
  ArrowRight,
  Database,
  RefreshCw,
  Info,
} from 'lucide-react';

interface BulkUploadClaimsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportClaims: (claims: Claim[], mode: 'append' | 'replace') => void;
  activeScenarioTitle: string;
  activeScenarioClaimCount: number;
  activeEventId?: string;
}

interface ParsedRowResult {
  claim: Claim;
  isValid: boolean;
  warnings: string[];
}

export const BulkUploadClaimsModal: React.FC<BulkUploadClaimsModalProps> = ({
  isOpen,
  onClose,
  onImportClaims,
  activeScenarioTitle,
  activeScenarioClaimCount,
  activeEventId = 'CAT-IMPORT',
}) => {
  const [activeInputMode, setActiveInputMode] = useState<'file' | 'paste'>('file');
  const [rawText, setRawText] = useState<string>('');
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [importMode, setImportMode] = useState<'append' | 'replace'>('append');
  const [parsedResults, setParsedResults] = useState<ParsedRowResult[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Normalize Line of Business string
  const normalizeLob = (raw: string): LineOfBusiness => {
    const s = (raw || '').trim().toLowerCase();
    if (s.includes('motor') || s.includes('auto') || s.includes('vehicle')) return 'Motor';
    if (s.includes('medical') || s.includes('health')) return 'Medical Lines';
    if (s.includes('group life') || s.includes('life')) return 'Group Life Lines';
    if (s.includes('marine') || s.includes('energy') || s.includes('cargo')) return 'Energy & Marine';
    if (s.includes('industrial') || s.includes('refinery') || s.includes('plant')) return 'Industrial Plant';
    if (s.includes('warehouse') || s.includes('logistics')) return 'Warehouse & Logistics';
    if (s.includes('residential')) return 'Residential High-Value';
    if (s.includes('commercial property')) return 'Commercial Property';
    if (s.includes('p&c') || s.includes('property') || s.includes('casualty') || s.includes('fire')) return 'P&C Lines';
    return 'P&C Lines';
  };

  // Parse CSV string into claims
  const parseCsvContent = (content: string) => {
    setParseError(null);
    setIsProcessing(true);

    try {
      const cleanContent = content.trim();
      if (!cleanContent) {
        setParseError('The file or pasted content is completely empty.');
        setParsedResults([]);
        setIsProcessing(false);
        return;
      }

      // Detect delimiter: tab, semicolon, or comma
      const firstLine = cleanContent.split(/\r\n|\n|\r/)[0];
      let delimiter = ',';
      if (firstLine.includes('\t') && firstLine.split('\t').length > firstLine.split(',').length) {
        delimiter = '\t';
      } else if (firstLine.includes(';') && firstLine.split(';').length > firstLine.split(',').length) {
        delimiter = ';';
      }

      // Simple regex-based CSV splitter that accounts for quotes
      const parseRow = (line: string): string[] => {
        const row: string[] = [];
        let cur = '';
        let insideQuotes = false;
        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          if (char === '"' || char === "'") {
            insideQuotes = !insideQuotes;
          } else if (char === delimiter && !insideQuotes) {
            row.push(cur.trim().replace(/^["']|["']$/g, ''));
            cur = '';
          } else {
            cur += char;
          }
        }
        row.push(cur.trim().replace(/^["']|["']$/g, ''));
        return row;
      };

      const lines = cleanContent.split(/\r\n|\n|\r/).filter((l) => l.trim().length > 0);
      if (lines.length < 2) {
        setParseError('CSV must have at least a header row and 1 row of claim data.');
        setParsedResults([]);
        setIsProcessing(false);
        return;
      }

      const headers = parseRow(lines[0]).map((h) => h.toLowerCase().replace(/[^a-z0-9]/g, ''));

      // Find column indices
      const findCol = (candidates: string[]) => {
        return headers.findIndex((h) => candidates.some((c) => h === c || h.includes(c)));
      };

      const claimNoIdx = findCol(['claimnumber', 'claimno', 'claimid', 'claim', 'id']);
      const policyNoIdx = findCol(['policynumber', 'policyno', 'policyid', 'policy']);
      const insuredIdx = findCol(['insuredname', 'insured', 'client', 'company', 'name']);
      const lobIdx = findCol(['lob', 'lineofbusiness', 'class', 'line', 'type']);
      const locationIdx = findCol(['location', 'city', 'governorate', 'wilayat', 'address', 'region']);
      const grossIdx = findCol(['grossloss', 'gross', 'loss', 'amount', 'incurred', 'incurredloss']);
      const eventIdIdx = findCol(['eventid', 'eventcode', 'catcode', 'catid']);
      const eventNameIdx = findCol(['eventname', 'event', 'catastrophe', 'catname']);
      const dateIdx = findCol(['eventdate', 'date', 'lossdate', 'occurrencedate']);

      if (grossIdx === -1) {
        setParseError(
          'Could not identify the Gross Loss column. Please include a column named "grossLoss", "gross", or "amount".'
        );
        setParsedResults([]);
        setIsProcessing(false);
        return;
      }

      const results: ParsedRowResult[] = [];
      const timestamp = Date.now();

      for (let i = 1; i < lines.length; i++) {
        const rawValues = parseRow(lines[i]);
        if (rawValues.length === 0 || rawValues.every((v) => !v)) continue;

        const warnings: string[] = [];

        // Parse gross loss
        const rawGross = grossIdx !== -1 && rawValues[grossIdx] ? rawValues[grossIdx] : '0';
        // Remove currency symbols, commas, spaces
        const cleanedGross = rawGross.replace(/[^\d.-]/g, '');
        const grossLoss = parseFloat(cleanedGross);

        let isValid = true;
        if (isNaN(grossLoss) || grossLoss <= 0) {
          warnings.push('Invalid gross loss amount');
          isValid = false;
        }

        const claimNumber =
          (claimNoIdx !== -1 && rawValues[claimNoIdx]) || `CLM-OM-${timestamp.toString().slice(-4)}-${i}`;
        const policyNumber =
          (policyNoIdx !== -1 && rawValues[policyNoIdx]) || `POL-OM-${2000 + i}`;
        const insuredName =
          (insuredIdx !== -1 && rawValues[insuredIdx]) || `Claimant / Commercial Entity #${i}`;
        const rawLob = lobIdx !== -1 && rawValues[lobIdx] ? rawValues[lobIdx] : 'P&C Lines';
        const lob = normalizeLob(rawLob);
        const location =
          (locationIdx !== -1 && rawValues[locationIdx]) || 'Muscat, Oman';
        const eventId =
          (eventIdIdx !== -1 && rawValues[eventIdIdx]) || activeEventId;
        const eventName =
          (eventNameIdx !== -1 && rawValues[eventNameIdx]) || activeScenarioTitle;
        const eventDate =
          (dateIdx !== -1 && rawValues[dateIdx]) || new Date().toISOString().split('T')[0];

        const claim: Claim = {
          id: `CLM-IMP-${timestamp}-${i}`,
          claimNumber,
          policyNumber,
          insuredName,
          lob,
          location,
          grossLoss: isNaN(grossLoss) ? 0 : Math.max(0, grossLoss),
          eventId,
          eventName,
          eventDate,
        };

        results.push({
          claim,
          isValid,
          warnings,
        });
      }

      if (results.length === 0) {
        setParseError('No claim records could be extracted from the file.');
      }

      setParsedResults(results);
    } catch (err) {
      setParseError(err instanceof Error ? err.message : 'Failed to parse CSV');
      setParsedResults([]);
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle file select
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setRawText(text);
      parseCsvContent(text);
    };
    reader.readAsText(file);
  };

  // Drag and drop handlers
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      setSelectedFileName(file.name);
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        setRawText(text);
        parseCsvContent(text);
      };
      reader.readAsText(file);
    }
  };

  // Download sample CSV template
  const handleDownloadSample = () => {
    const sampleHeaders = [
      'claimNumber',
      'policyNumber',
      'insuredName',
      'lob',
      'location',
      'grossLoss',
      'eventId',
      'eventName',
      'eventDate',
    ];

    const sampleRows = [
      [
        'CLM-OM-8801',
        'POL-OM-7712',
        'Oman LNG Qalhat Liquefaction Plant',
        'Energy & Marine',
        'Sur, Oman',
        '850000',
        'CAT-CYCLONE-SHAHEEN',
        'Cyclone Shaheen Extreme Surge',
        '2026-10-02',
      ],
      [
        'CLM-OM-8802',
        'POL-OM-6540',
        'Sohar Port Container Terminal',
        'Commercial Property',
        'Sohar, Oman',
        '420000',
        'CAT-CYCLONE-SHAHEEN',
        'Cyclone Shaheen Extreme Surge',
        '2026-10-02',
      ],
      [
        'CLM-OM-8803',
        'POL-OM-5531',
        'Al Mouj Residential Waterfront',
        'P&C Lines',
        'Muscat, Oman',
        '185000',
        'CAT-CYCLONE-SHAHEEN',
        'Cyclone Shaheen Extreme Surge',
        '2026-10-03',
      ],
      [
        'CLM-OM-8804',
        'POL-OM-9920',
        'Salalah Freezone Distribution Center',
        'Warehouse & Logistics',
        'Salalah, Oman',
        '95000',
        'CAT-CYCLONE-SHAHEEN',
        'Cyclone Shaheen Extreme Surge',
        '2026-10-03',
      ],
      [
        'CLM-OM-8805',
        'POL-OM-4410',
        'Oman National Transport Fleet',
        'Motor',
        'Nizwa, Oman',
        '48000',
        'NON-CAT',
        'Regional Fleet Motor Damage',
        '2026-10-04',
      ],
      [
        'CLM-OM-8806',
        'POL-OM-3320',
        'Sultan Qaboos Comprehensive Cancer Centre Network',
        'Medical Lines',
        'Muscat, Oman',
        '64000',
        'NON-CAT',
        'Medical Intensive Treatment Claims',
        '2026-10-05',
      ],
      [
        'CLM-OM-8807',
        'POL-OM-1122',
        'Petroleum Development Oman Support Crew',
        'Group Life Lines',
        'Fahud, Oman',
        '75000',
        'NON-CAT',
        'Group Life Accidental Indemnity',
        '2026-10-06',
      ],
      [
        'CLM-OM-8808',
        'POL-OM-2299',
        'Batinah Expressway Logistics Depot',
        'P&C Lines',
        'Barka, Oman',
        '32000',
        'NON-CAT',
        'Depot Flash Flood Damage',
        '2026-10-07',
      ],
    ];

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [sampleHeaders.join(','), ...sampleRows.map((r) => r.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'sample_claims_reinsurance_OMR.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Submit parsed claims
  const handleImport = () => {
    const validClaims = parsedResults.filter((r) => r.isValid).map((r) => r.claim);
    if (validClaims.length === 0) return;

    onImportClaims(validClaims, importMode);
    onClose();
  };

  const validCount = parsedResults.filter((r) => r.isValid).length;
  const invalidCount = parsedResults.length - validCount;
  const totalGrossLoss = parsedResults
    .filter((r) => r.isValid)
    .reduce((sum, r) => sum + r.claim.grossLoss, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-700">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">Bulk Upload Claims (CSV)</h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                  Active: {activeScenarioTitle}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Upload or paste claims in CSV format to calculate Quota Share, Risk XOL, Cat XOL, and Stop-Loss recoveries in Omani Rial (&#x20c4;).
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 flex-1 overflow-y-auto space-y-4">
          {/* Top Tabs & Sample Template Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
            {/* Input Method Switcher */}
            <div className="flex items-center gap-1.5 bg-white p-1 rounded-md border border-slate-200">
              <button
                type="button"
                onClick={() => setActiveInputMode('file')}
                className={`px-3 py-1 text-xs font-semibold rounded transition flex items-center gap-1.5 ${
                  activeInputMode === 'file'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Upload CSV File</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveInputMode('paste')}
                className={`px-3 py-1 text-xs font-semibold rounded transition flex items-center gap-1.5 ${
                  activeInputMode === 'paste'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Paste CSV Text</span>
              </button>
            </div>

            {/* Download Sample Template */}
            <button
              type="button"
              onClick={handleDownloadSample}
              className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-md text-xs font-medium flex items-center gap-1.5 transition shadow-2xs"
              title="Download pre-formatted sample CSV with realistic Omani claims across LOBs"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600" />
              <span>Download Sample CSV Template</span>
            </button>
          </div>

          {/* File Upload Zone */}
          {activeInputMode === 'file' && (
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-indigo-200 hover:border-indigo-400 bg-indigo-50/30 hover:bg-indigo-50/60 rounded-xl p-6 text-center cursor-pointer transition flex flex-col items-center justify-center gap-2 group"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,text/csv,text/plain"
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="w-12 h-12 rounded-full bg-indigo-100 text-indigo-600 group-hover:scale-105 transition flex items-center justify-center">
                <Upload className="w-6 h-6" />
              </div>
              <div className="text-sm font-semibold text-slate-800">
                {selectedFileName ? (
                  <span className="text-indigo-700 font-mono font-bold">{selectedFileName}</span>
                ) : (
                  'Click to select or drag and drop a CSV file'
                )}
              </div>
              <p className="text-xs text-slate-500 max-w-md">
                Supports standard comma, semicolon, or tab-delimited files (.csv, .txt). Auto-detects headers such as claimNumber, insuredName, lob, and grossLoss.
              </p>
            </div>
          )}

          {/* Paste CSV Text Zone */}
          {activeInputMode === 'paste' && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-700">
                  Paste Tabular Data or CSV Content
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setRawText('');
                    setParsedResults([]);
                  }}
                  className="text-[11px] text-slate-400 hover:text-slate-600"
                >
                  Clear text
                </button>
              </div>
              <textarea
                value={rawText}
                onChange={(e) => {
                  setRawText(e.target.value);
                  parseCsvContent(e.target.value);
                }}
                rows={6}
                placeholder="claimNumber,policyNumber,insuredName,lob,location,grossLoss,eventName&#10;CLM-001,POL-101,Oman Gas Hub,P&C Lines,Muscat,150000,Cyclone Shaheen&#10;CLM-002,POL-102,Sohar Fleet,Motor,Sohar,25000,Cyclone Shaheen"
                className="w-full p-3 font-mono text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-600 text-slate-800"
              />
            </div>
          )}

          {/* Error Message */}
          {parseError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{parseError}</span>
            </div>
          )}

          {/* Parse Statistics & Validation Feedback */}
          {parsedResults.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="text-[10px] uppercase font-bold text-slate-500 font-mono">
                  Total Rows
                </span>
                <p className="text-lg font-bold text-slate-900 mt-0.5">{parsedResults.length}</p>
              </div>
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                <span className="text-[10px] uppercase font-bold text-emerald-700 font-mono flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Valid Claims
                </span>
                <p className="text-lg font-bold text-emerald-800 mt-0.5">{validCount}</p>
              </div>
              <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-lg">
                <span className="text-[10px] uppercase font-bold text-indigo-700 font-mono">
                  Total Gross Loss
                </span>
                <p className="text-base font-bold text-indigo-900 mt-0.5 font-mono">
                  {formatCurrency(totalGrossLoss)}
                </p>
              </div>
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <span className="text-[10px] uppercase font-bold text-amber-700 font-mono">
                  Issues / Excluded
                </span>
                <p className="text-lg font-bold text-amber-800 mt-0.5">{invalidCount}</p>
              </div>
            </div>
          )}

          {/* Import Mode Selector: Append vs Replace */}
          {parsedResults.length > 0 && (
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-indigo-600" />
                <span>Scenario Update Mode:</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label
                  className={`flex items-start gap-2.5 p-2.5 rounded-lg border cursor-pointer transition ${
                    importMode === 'append'
                      ? 'bg-white border-indigo-600 ring-1 ring-indigo-600 shadow-2xs'
                      : 'bg-white/60 border-slate-200 hover:bg-white'
                  }`}
                >
                  <input
                    type="radio"
                    name="importMode"
                    value="append"
                    checked={importMode === 'append'}
                    onChange={() => setImportMode('append')}
                    className="mt-0.5 text-indigo-600 focus:ring-indigo-500"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">
                      Append to Scenario (Recommended)
                    </span>
                    <span className="text-[11px] text-slate-500 block mt-0.5">
                      Keep existing {activeScenarioClaimCount} claims and add {validCount} new claims (New total: {activeScenarioClaimCount + validCount}).
                    </span>
                  </div>
                </label>

                <label
                  className={`flex items-start gap-2.5 p-2.5 rounded-lg border cursor-pointer transition ${
                    importMode === 'replace'
                      ? 'bg-white border-red-500 ring-1 ring-red-500 shadow-2xs'
                      : 'bg-white/60 border-slate-200 hover:bg-white'
                  }`}
                >
                  <input
                    type="radio"
                    name="importMode"
                    value="replace"
                    checked={importMode === 'replace'}
                    onChange={() => setImportMode('replace')}
                    className="mt-0.5 text-red-600 focus:ring-red-500"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">
                      Replace All Scenario Claims
                    </span>
                    <span className="text-[11px] text-slate-500 block mt-0.5">
                      Clear existing claims in &ldquo;{activeScenarioTitle}&rdquo; and populate with the {validCount} parsed claims.
                    </span>
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* Parsed Preview Table */}
          {parsedResults.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono">
                  Claims Preview ({validCount} Valid / {parsedResults.length} Parsed)
                </h4>
                <span className="text-[11px] text-slate-500">
                  Showing top {Math.min(50, parsedResults.length)} claims
                </span>
              </div>
              <div className="border border-slate-200 rounded-lg overflow-x-auto max-h-56">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-100 text-slate-700 sticky top-0 text-[10px] uppercase font-bold tracking-wider">
                    <tr>
                      <th className="py-2 px-2.5 text-center">Status</th>
                      <th className="py-2 px-2.5">Claim #</th>
                      <th className="py-2 px-2.5">Insured Name</th>
                      <th className="py-2 px-2.5">LOB</th>
                      <th className="py-2 px-2.5">Location</th>
                      <th className="py-2 px-2.5">Event</th>
                      <th className="py-2 px-2.5 text-right">Gross Loss</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {parsedResults.slice(0, 50).map((row, idx) => (
                      <tr
                        key={idx}
                        className={row.isValid ? 'hover:bg-slate-50' : 'bg-red-50/40 text-red-700'}
                      >
                        <td className="py-1.5 px-2.5 text-center">
                          {row.isValid ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 inline" />
                          ) : (
                            <span title={row.warnings.join(', ')} className="inline-flex items-center">
                              <AlertTriangle className="w-3.5 h-3.5 text-red-600 inline" />
                            </span>
                          )}
                        </td>
                        <td className="py-1.5 px-2.5 font-mono text-[11px] text-slate-700">
                          {row.claim.claimNumber}
                        </td>
                        <td className="py-1.5 px-2.5 font-medium text-slate-900 max-w-[160px] truncate">
                          {row.claim.insuredName}
                        </td>
                        <td className="py-1.5 px-2.5">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border ${
                              row.claim.lob === 'Motor'
                                ? 'bg-sky-50 text-sky-700 border-sky-200'
                                : row.claim.lob === 'Medical Lines'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : row.claim.lob === 'Group Life Lines'
                                ? 'bg-purple-50 text-purple-700 border-purple-200'
                                : 'bg-amber-50 text-amber-800 border-amber-200'
                            }`}
                          >
                            {row.claim.lob}
                          </span>
                        </td>
                        <td className="py-1.5 px-2.5 text-slate-600 max-w-[120px] truncate">
                          {row.claim.location}
                        </td>
                        <td className="py-1.5 px-2.5 text-slate-600 max-w-[140px] truncate">
                          {row.claim.eventName}
                        </td>
                        <td className="py-1.5 px-2.5 text-right font-mono font-bold text-slate-900">
                          {formatCurrency(row.claim.grossLoss)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Quick Guide on Expected Headers */}
          <div className="p-3 bg-blue-50/60 border border-blue-200 rounded-lg text-xs text-blue-900 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-semibold block">Accepted CSV Headers & Formats</span>
              <p className="text-[11px] text-blue-800 leading-relaxed">
                Accepted column headers (case-insensitive):{' '}
                <code className="bg-blue-100 px-1 py-0.5 rounded font-mono text-[10px]">
                  claimNumber, policyNumber, insuredName, lob, location, grossLoss, eventName, eventDate
                </code>
                . Currency amounts can include commas, decimals, and rial notation. Lines of Business will automatically normalize to <em>Motor, P&amp;C Lines, Medical Lines, Group Life Lines</em>, and specific commercial categories.
              </p>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 rounded-lg transition"
          >
            Cancel
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleImport}
              disabled={validCount === 0 || isProcessing}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-xs flex items-center gap-1.5 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>
                {validCount > 0
                  ? `Import ${validCount} Claim${validCount > 1 ? 's' : ''} (${importMode === 'append' ? 'Append' : 'Replace'})`
                  : 'Import Claims'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
