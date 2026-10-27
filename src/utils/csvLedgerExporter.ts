import { ClaimCalculation, TreatyConfig } from '../types/reinsurance';

export interface ExportCsvLedgerOptions {
  scenarioTitle: string;
  claimBreakdowns: ClaimCalculation[];
  treaties: TreatyConfig;
  customFilename?: string;
}

/**
 * Escapes CSV cell according to RFC 4180 standards:
 * Encloses strings containing commas, quotes, or newlines in double quotes,
 * and escapes double quotes by doubling them ("").
 */
const escapeCsvCell = (val: string | number | undefined | null): string => {
  if (val === undefined || val === null) return '';
  const str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

/**
 * Exports the active scenario's claim ledger to a downloadable CSV file,
 * including all reinsurance breakdown columns (Gross Loss, Quota Share,
 * Risk XOL, Cat XOL, Aggregate Stop-Loss, and Net Retained) plus totals
 * and treaty structure audit notes.
 */
export const exportScenarioClaimLedgerToCsv = ({
  scenarioTitle,
  claimBreakdowns,
  treaties,
  customFilename,
}: ExportCsvLedgerOptions): { rowCount: number; totalGrossLoss: number; totalRecovery: number } => {
  const headers = [
    'Claim Number',
    'Policy Number',
    'Insured Name',
    'Line of Business (LOB)',
    'Location',
    'Event Code',
    'Event Name',
    'Event Date',
    'Gross Loss (OMR)',
    'Quota Share Ceded (OMR)',
    'Net After Quota Share (OMR)',
    'Risk XOL Ceded (OMR)',
    'Spillover Above Risk Limit (OMR)',
    'Risk XOL Layer Status',
    'Cat XOL Recovery Share (OMR)',
    'Stop-Loss (ASL) Recovery Share (OMR)',
    'Total Reinsurance Recovery (OMR)',
    'Cedant Net Retained (OMR)',
    'Cedant Retention %',
    'Reinsurance Recovery %',
  ];

  // Aggregation accumulators
  let sumGross = 0;
  let sumQS = 0;
  let sumNetQS = 0;
  let sumRiskXol = 0;
  let sumSpillover = 0;
  let sumCatXol = 0;
  let sumAsl = 0;
  let sumTotalRecovery = 0;
  let sumNetRetained = 0;

  const dataRows = claimBreakdowns.map((item) => {
    const gross = Number(item.grossLoss.toFixed(2));
    const qs = Number(item.qsCeded.toFixed(2));
    const netQS = Number(item.netAfterQS.toFixed(2));
    const riskXol = Number(item.riskXolCeded.toFixed(2));
    const spillover = Number((item.spilloverAboveRiskLimit || 0).toFixed(2));
    const catXol = Number(item.catXolCededShare.toFixed(2));
    const asl = Number((item.aslCededShare || 0).toFixed(2));
    const totalRec = Number((qs + riskXol + catXol + asl).toFixed(2));
    const netRet = Number(item.finalNetRetained.toFixed(2));

    const retentionPct = gross > 0 ? Number(((netRet / gross) * 100).toFixed(1)) : 100;
    const recoveryPct = gross > 0 ? Number(((totalRec / gross) * 100).toFixed(1)) : 0;

    sumGross += gross;
    sumQS += qs;
    sumNetQS += netQS;
    sumRiskXol += riskXol;
    sumSpillover += spillover;
    sumCatXol += catXol;
    sumAsl += asl;
    sumTotalRecovery += totalRec;
    sumNetRetained += netRet;

    return [
      escapeCsvCell(item.claim.claimNumber),
      escapeCsvCell(item.claim.policyNumber),
      escapeCsvCell(item.claim.insuredName),
      escapeCsvCell(item.claim.lob),
      escapeCsvCell(item.claim.location),
      escapeCsvCell(item.claim.eventId),
      escapeCsvCell(item.claim.eventName),
      escapeCsvCell(item.claim.eventDate),
      escapeCsvCell(gross),
      escapeCsvCell(qs),
      escapeCsvCell(netQS),
      escapeCsvCell(riskXol),
      escapeCsvCell(spillover),
      escapeCsvCell(item.riskXolStatus),
      escapeCsvCell(catXol),
      escapeCsvCell(asl),
      escapeCsvCell(totalRec),
      escapeCsvCell(netRet),
      escapeCsvCell(`${retentionPct}%`),
      escapeCsvCell(`${recoveryPct}%`),
    ].join(',');
  });

  // Calculate overall portfolio retention and cession percentages
  const overallRetentionPct =
    sumGross > 0 ? ((sumNetRetained / sumGross) * 100).toFixed(1) : '100.0';
  const overallRecoveryPct =
    sumGross > 0 ? ((sumTotalRecovery / sumGross) * 100).toFixed(1) : '0.0';

  // Summary row
  const summaryRow = [
    escapeCsvCell('PORTFOLIO TOTALS'),
    escapeCsvCell(`${claimBreakdowns.length} Claims Total`),
    escapeCsvCell(''),
    escapeCsvCell(''),
    escapeCsvCell(''),
    escapeCsvCell(''),
    escapeCsvCell(''),
    escapeCsvCell(''),
    escapeCsvCell(sumGross.toFixed(2)),
    escapeCsvCell(sumQS.toFixed(2)),
    escapeCsvCell(sumNetQS.toFixed(2)),
    escapeCsvCell(sumRiskXol.toFixed(2)),
    escapeCsvCell(sumSpillover.toFixed(2)),
    escapeCsvCell(''),
    escapeCsvCell(sumCatXol.toFixed(2)),
    escapeCsvCell(sumAsl.toFixed(2)),
    escapeCsvCell(sumTotalRecovery.toFixed(2)),
    escapeCsvCell(sumNetRetained.toFixed(2)),
    escapeCsvCell(`${overallRetentionPct}%`),
    escapeCsvCell(`${overallRecoveryPct}%`),
  ].join(',');

  // Treaty Structure Audit notes at the end of the file
  const auditNotes = [
    '',
    '# --- REINSURANCE PROGRAM STRUCTURE AUDIT TRAIL ---',
    `# Scenario: ${scenarioTitle}`,
    `# Currency: Omani Rial (OMR / ﷼)`,
    `# Quota Share Treaty: ${treaties.quotaShare.enabled ? `Active (${treaties.quotaShare.retentionPercent}% Retention / ${100 - treaties.quotaShare.retentionPercent}% Cession)` : 'Disabled'}`,
    `# Risk XOL Treaty: ${treaties.riskXol.enabled ? `Active (Limit: ${treaties.riskXol.limit.toLocaleString()} OMR xs Attachment: ${treaties.riskXol.attachmentPoint.toLocaleString()} OMR)` : 'Disabled'}`,
    `# Catastrophe XOL Treaty: ${treaties.catXol.enabled ? `Active (Limit: ${treaties.catXol.limit.toLocaleString()} OMR xs Attachment: ${treaties.catXol.attachmentPoint.toLocaleString()} OMR, Co-Participation: ${treaties.catXol.cedantCoParticipation}%)` : 'Disabled'}`,
    `# Aggregate Stop-Loss (ASL): ${treaties.aggregateStopLoss.enabled ? `Active (Limit: ${treaties.aggregateStopLoss.limit.toLocaleString()} OMR xs Attachment: ${treaties.aggregateStopLoss.attachmentPoint.toLocaleString()} OMR, Co-Participation: ${treaties.aggregateStopLoss.cedantCoParticipation}%)` : 'Disabled'}`,
    `# Inuring Order: ${treaties.inuringOrder === 'QS_FIRST' ? 'Quota Share Inures First (Standard)' : 'Risk XOL Inures First'}`,
    `# Generated: ${new Date().toISOString()}`,
    `# Reinsurance Recovery Simulator (Oman)`,
  ];

  const fullCsvText = [
    headers.join(','),
    ...dataRows,
    summaryRow,
    ...auditNotes,
  ].join('\r\n');

  // Prefix with UTF-8 BOM so Microsoft Excel renders Arabic/Omani characters and symbols correctly
  const bom = '\uFEFF';
  const blob = new Blob([bom + fullCsvText], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const cleanScenarioName = scenarioTitle.replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename =
    customFilename || `reinsurance_claim_ledger_${cleanScenarioName}_OMR_${Date.now()}.csv`;

  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  return {
    rowCount: claimBreakdowns.length,
    totalGrossLoss: sumGross,
    totalRecovery: sumTotalRecovery,
  };
};
