import { jsPDF } from 'jspdf';
import {
  ScenarioPreset,
  TreatyConfig,
  OverallCalculationSummary,
} from '../types/reinsurance';
import { formatPercent } from './reinsuranceEngine';

// Safe currency formatting for PDF text streams (ensuring clean ASCII rendering in standard PDF fonts)
function formatPdfMoney(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) return 'OMR 0';
  return `OMR ${new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(amount)}`;
}

export function generateReinsurancePdfReport(
  scenario: ScenarioPreset,
  treaties: TreatyConfig,
  summary: OverallCalculationSummary
) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;

  // Colors
  const colorDarkSlate: [number, number, number] = [30, 41, 59];
  const colorLightSlate: [number, number, number] = [241, 245, 249];
  const colorBorderSlate: [number, number, number] = [226, 232, 240];
  const colorBlue: [number, number, number] = [37, 99, 235];
  const colorAmber: [number, number, number] = [217, 119, 6];
  const colorIndigo: [number, number, number] = [79, 70, 229];
  const colorTeal: [number, number, number] = [13, 148, 136];
  const colorEmerald: [number, number, number] = [16, 185, 129];
  const colorRose: [number, number, number] = [225, 29, 72];

  let currentY = 14;

  // 1. Top Decorative Rainbow Header Line (Streamlit style)
  doc.setFillColor(255, 75, 75);
  doc.rect(margin, currentY, contentWidth * 0.35, 1.5, 'F');
  doc.setFillColor(255, 164, 33);
  doc.rect(margin + contentWidth * 0.35, currentY, contentWidth * 0.35, 1.5, 'F');
  doc.setFillColor(0, 212, 187);
  doc.rect(margin + contentWidth * 0.7, currentY, contentWidth * 0.3, 1.5, 'F');
  currentY += 5;

  // 2. Document Title & Subtitle
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(...colorDarkSlate);
  doc.text('REINSURANCE ACTUARIAL & CAPITAL REPORT', margin, currentY + 4);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
  doc.text(`Generated: ${dateStr} • Currency: OMR (Omani Rial U+20C4)`, pageWidth - margin, currentY + 4, {
    align: 'right',
  });
  currentY += 8;

  // Scenario Name Banner
  doc.setFillColor(...colorLightSlate);
  doc.roundedRect(margin, currentY, contentWidth, 14, 2, 2, 'F');
  doc.setDrawColor(...colorBorderSlate);
  doc.roundedRect(margin, currentY, contentWidth, 14, 2, 2, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(...colorDarkSlate);
  doc.text(`Scenario: ${scenario.title}`, margin + 4, currentY + 5.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  const shortDesc =
    scenario.description.length > 115
      ? scenario.description.slice(0, 115) + '...'
      : scenario.description;
  doc.text(
    `Peril: ${scenario.category} • ${summary.claimsCount} Claims • ${shortDesc}`,
    margin + 4,
    currentY + 10.5
  );
  currentY += 18;

  // 3. Treaty Parameters Summary Box (4 Columns)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...colorDarkSlate);
  doc.text('TREATY PROGRAM SPECIFICATIONS (4-TIER REINSURANCE CASCADE)', margin, currentY);
  currentY += 3;

  const treatyBoxH = 17;
  doc.setFillColor(250, 250, 252);
  doc.roundedRect(margin, currentY, contentWidth, treatyBoxH, 1.5, 1.5, 'FD');

  const colW = contentWidth / 4;

  // Col 1: Quota Share
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...colorBlue);
  doc.text('1. Quota Share (QS)', margin + 3, currentY + 4.5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`Retention: ${treaties.quotaShare.retentionPercent}%`, margin + 3, currentY + 8.5);
  doc.text(`Cession: ${100 - treaties.quotaShare.retentionPercent}%`, margin + 3, currentY + 12.5);

  // Col 2: Risk XOL
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...colorAmber);
  doc.text('2. Risk XOL', margin + colW + 3, currentY + 4.5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`Limit: ${formatPdfMoney(treaties.riskXol.limit)}`, margin + colW + 3, currentY + 8.5);
  doc.text(`Attach: ${formatPdfMoney(treaties.riskXol.attachmentPoint)} xs`, margin + colW + 3, currentY + 12.5);

  // Col 3: Cat XOL
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...colorIndigo);
  doc.text('3. Catastrophe XOL', margin + colW * 2 + 3, currentY + 4.5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`Limit: ${formatPdfMoney(treaties.catXol.limit)}`, margin + colW * 2 + 3, currentY + 8.5);
  doc.text(`Attach: ${formatPdfMoney(treaties.catXol.attachmentPoint)} xs`, margin + colW * 2 + 3, currentY + 12.5);

  // Col 4: Aggregate Stop-Loss
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...colorTeal);
  doc.text('4. Stop-Loss (ASL)', margin + colW * 3 + 3, currentY + 4.5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`Limit: ${formatPdfMoney(treaties.aggregateStopLoss?.limit || 600000)}`, margin + colW * 3 + 3, currentY + 8.5);
  doc.text(`Attach: ${formatPdfMoney(treaties.aggregateStopLoss?.attachmentPoint || 400000)} xs`, margin + colW * 3 + 3, currentY + 12.5);

  currentY += treatyBoxH + 5;

  // 4. Executive KPI Metrics Cards (7 Cards across 2 rows)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...colorDarkSlate);
  doc.text('EXECUTIVE CAPITAL & LOSS BREAKDOWN (OMANI RIAL)', margin, currentY);
  currentY += 3;

  const cardW = (contentWidth - 12) / 4;
  const cardH = 13.5;

  const kpis = [
    {
      title: 'Gross Loss',
      val: formatPdfMoney(summary.totalGrossLoss),
      sub: `${summary.claimsCount} claims in scenario`,
      border: colorDarkSlate,
    },
    {
      title: 'Quota Share Ceded',
      val: formatPdfMoney(summary.totalQsCeded),
      sub: `${formatPercent(summary.totalGrossLoss > 0 ? (summary.totalQsCeded / summary.totalGrossLoss) * 100 : 0)} of gross`,
      border: colorBlue,
    },
    {
      title: 'Risk XOL Recovery',
      val: formatPdfMoney(summary.totalRiskXolCeded),
      sub: `${formatPercent(summary.totalGrossLoss > 0 ? (summary.totalRiskXolCeded / summary.totalGrossLoss) * 100 : 0)} of gross`,
      border: colorAmber,
    },
    {
      title: 'Cat XOL Recovery',
      val: formatPdfMoney(summary.totalCatXolRecovery),
      sub: `${formatPercent(summary.totalGrossLoss > 0 ? (summary.totalCatXolRecovery / summary.totalGrossLoss) * 100 : 0)} of gross`,
      border: colorIndigo,
    },
    {
      title: 'Stop-Loss ASL Recovery',
      val: formatPdfMoney(summary.totalAslRecovery || 0),
      sub: `Portfolio Cap Recovery`,
      border: colorTeal,
    },
    {
      title: 'Total Ceded to Reinsurers',
      val: formatPdfMoney(summary.totalReinsuranceRecovery),
      sub: `Cession: ${formatPercent(summary.effectiveCessionPercent)}`,
      border: colorEmerald,
    },
    {
      title: 'Cedant Net Retained Loss',
      val: formatPdfMoney(summary.totalNetRetained),
      sub: `Retention: ${formatPercent(summary.effectiveNetRetentionPercent)}`,
      border: summary.totalNetRetained > 1000000 ? colorRose : colorDarkSlate,
    },
  ];

  kpis.forEach((kpi, idx) => {
    const colIndex = idx % 4;
    const rowIndex = Math.floor(idx / 4);
    const x = margin + colIndex * (cardW + 4);
    const y = currentY + rowIndex * (cardH + 2.5);

    doc.setFillColor(255, 255, 255);
    doc.roundedRect(x, y, cardW, cardH, 1, 1, 'F');
    doc.setDrawColor(...colorBorderSlate);
    doc.roundedRect(x, y, cardW, cardH, 1, 1, 'S');

    doc.setFillColor(...kpi.border);
    doc.rect(x, y, 2.5, cardH, 'F');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    doc.setTextColor(100, 116, 139);
    doc.text(kpi.title.toUpperCase(), x + 4.5, y + 4.2);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(...colorDarkSlate);
    doc.text(kpi.val, x + 4.5, y + 8.8);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    doc.setTextColor(148, 163, 184);
    doc.text(kpi.sub, x + 4.5, y + 12);
  });

  currentY += cardH * 2 + 7;

  // 5. VECTOR WATERFALL CHART
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...colorDarkSlate);
  doc.text('ACTUARIAL LOSS ABSORPTION WATERFALL (CASCADE TO NET RETENTION)', margin, currentY);
  currentY += 3;

  const chartBoxH = 44;
  doc.setFillColor(252, 253, 254);
  doc.roundedRect(margin, currentY, contentWidth, chartBoxH, 2, 2, 'F');
  doc.setDrawColor(...colorBorderSlate);
  doc.roundedRect(margin, currentY, contentWidth, chartBoxH, 2, 2, 'S');

  const gross = summary.totalGrossLoss;
  const qs = summary.totalQsCeded;
  const risk = summary.totalRiskXolCeded;
  const cat = summary.totalCatXolRecovery;
  const asl = summary.totalAslRecovery || 0;
  const net = summary.totalNetRetained;

  const afterQS = gross - qs;
  const afterRisk = afterQS - risk;
  const afterCat = afterRisk - cat;
  const afterAsl = afterCat - asl;

  const chartBottomY = currentY + chartBoxH - 8;
  const maxPlotHeight = chartBoxH - 18;

  const waterfallBars = [
    {
      label: 'Gross Loss',
      amount: gross,
      isReduction: false,
      color: colorDarkSlate,
      bottomVal: 0,
      topVal: gross,
    },
    {
      label: 'Quota Share',
      amount: qs,
      isReduction: true,
      color: colorBlue,
      bottomVal: afterQS,
      topVal: gross,
    },
    {
      label: 'Risk XOL',
      amount: risk,
      isReduction: true,
      color: colorAmber,
      bottomVal: afterRisk,
      topVal: afterQS,
    },
    {
      label: 'Cat XOL',
      amount: cat,
      isReduction: true,
      color: colorIndigo,
      bottomVal: Math.max(0, afterCat),
      topVal: afterRisk,
    },
    {
      label: 'Stop-Loss',
      amount: asl,
      isReduction: true,
      color: colorTeal,
      bottomVal: Math.max(0, afterAsl),
      topVal: afterCat,
    },
    {
      label: 'Net Retained',
      amount: net,
      isReduction: false,
      color: net > 1000000 ? colorRose : colorEmerald,
      bottomVal: 0,
      topVal: net,
    },
  ];

  const barCount = waterfallBars.length;
  const barW = 18;
  const barSpacing = (contentWidth - 20 - barW * barCount) / (barCount - 1);

  // Baseline line
  doc.setDrawColor(203, 213, 225);
  doc.setLineDashPattern([1, 1], 0);
  doc.line(margin + 5, chartBottomY, margin + contentWidth - 5, chartBottomY);
  doc.setLineDashPattern([], 0);

  waterfallBars.forEach((bar, bIdx) => {
    const x = margin + 8 + bIdx * (barW + barSpacing);

    const bottomFraction = gross > 0 ? bar.bottomVal / gross : 0;
    const heightFraction = gross > 0 ? bar.amount / gross : 0;

    const barPixelH = Math.max(2.5, heightFraction * maxPlotHeight);
    const barPixelBottom = chartBottomY - bottomFraction * maxPlotHeight;
    const barPixelY = barPixelBottom - barPixelH;

    // Draw Bar
    doc.setFillColor(...bar.color);
    doc.rect(x, barPixelY, barW, barPixelH, 'F');

    // Amount label above bar
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6);
    doc.setTextColor(...colorDarkSlate);
    const amountStr = (bar.isReduction ? '-' : '') + formatPdfMoney(bar.amount);
    doc.text(amountStr, x + barW / 2, Math.max(currentY + 6, barPixelY - 1.2), {
      align: 'center',
    });

    // Column name below baseline
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(71, 85, 105);
    doc.text(bar.label, x + barW / 2, chartBottomY + 4, {
      align: 'center',
    });
  });

  currentY += chartBoxH + 5;

  // 6. TOP CLAIMS AUDIT TABLE (Top 7 claims)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...colorDarkSlate);
  doc.text('PRIMARY CLAIMS ALLOCATION AUDIT TRAIL', margin, currentY);
  currentY += 3;

  const tableHeaderH = 5.5;
  const tableRowH = 5;

  // Header row
  doc.setFillColor(...colorDarkSlate);
  doc.rect(margin, currentY, contentWidth, tableHeaderH, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6);
  doc.setTextColor(255, 255, 255);

  const tCols = [
    { header: 'Insured / Risk Name', width: 44, align: 'left' },
    { header: 'LOB', width: 28, align: 'left' },
    { header: 'Gross (OMR)', width: 20, align: 'right' },
    { header: 'QS Ceded', width: 18, align: 'right' },
    { header: 'Risk XOL', width: 18, align: 'right' },
    { header: 'Cat Share', width: 18, align: 'right' },
    { header: 'ASL Share', width: 18, align: 'right' },
    { header: 'Net Retained', width: 20, align: 'right' },
  ];

  let colX = margin + 2;
  tCols.forEach((tc) => {
    if (tc.align === 'right') {
      doc.text(tc.header, colX + tc.width - 2, currentY + 3.8, { align: 'right' });
    } else {
      doc.text(tc.header, colX, currentY + 3.8);
    }
    colX += tc.width;
  });

  currentY += tableHeaderH;

  // Render top 7 claims
  const sortedClaims = [...summary.claimBreakdowns]
    .sort((a, b) => b.grossLoss - a.grossLoss)
    .slice(0, 7);

  sortedClaims.forEach((item, rIdx) => {
    const isEven = rIdx % 2 === 0;
    doc.setFillColor(isEven ? 255 : 248, isEven ? 255 : 249, isEven ? 255 : 251);
    doc.rect(margin, currentY, contentWidth, tableRowH, 'F');
    doc.setDrawColor(...colorBorderSlate);
    doc.line(margin, currentY + tableRowH, margin + contentWidth, currentY + tableRowH);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    doc.setTextColor(...colorDarkSlate);

    let rowX = margin + 2;
    // Insured
    const safeInsured =
      item.claim.insuredName.length > 25
        ? item.claim.insuredName.slice(0, 25) + '..'
        : item.claim.insuredName;
    doc.text(safeInsured, rowX, currentY + 3.5);
    rowX += tCols[0].width;

    // LOB
    doc.setTextColor(100, 116, 139);
    doc.text(item.claim.lob, rowX, currentY + 3.5);
    rowX += tCols[1].width;

    // Gross
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...colorDarkSlate);
    doc.text(formatPdfMoney(item.grossLoss), rowX + tCols[2].width - 2, currentY + 3.5, {
      align: 'right',
    });
    rowX += tCols[2].width;

    // QS
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...colorBlue);
    doc.text(formatPdfMoney(item.qsCeded), rowX + tCols[3].width - 2, currentY + 3.5, {
      align: 'right',
    });
    rowX += tCols[3].width;

    // Risk XOL
    doc.setTextColor(...colorAmber);
    doc.text(formatPdfMoney(item.riskXolCeded), rowX + tCols[4].width - 2, currentY + 3.5, {
      align: 'right',
    });
    rowX += tCols[4].width;

    // Cat Share
    doc.setTextColor(...colorIndigo);
    doc.text(formatPdfMoney(item.catXolCededShare), rowX + tCols[5].width - 2, currentY + 3.5, {
      align: 'right',
    });
    rowX += tCols[5].width;

    // ASL Share
    doc.setTextColor(...colorTeal);
    doc.text(formatPdfMoney(item.aslCededShare || 0), rowX + tCols[6].width - 2, currentY + 3.5, {
      align: 'right',
    });
    rowX += tCols[6].width;

    // Net
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...colorDarkSlate);
    doc.text(formatPdfMoney(item.finalNetRetained), rowX + tCols[7].width - 2, currentY + 3.5, {
      align: 'right',
    });

    currentY += tableRowH;
  });

  // Footer Disclaimer & Page Number
  const footerY = pageHeight - 8;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  doc.setTextColor(148, 163, 184);
  doc.text(
    'CONFIDENTIAL ACTUARIAL AUDIT REPORT • Currency: Omani Rial (OMR) • Page 1 of 1',
    margin,
    footerY
  );
  doc.text('Valid for Capital Modeling & Underwriting Audit', pageWidth - margin, footerY, {
    align: 'right',
  });

  const fileName = `Reinsurance_Report_OMR_${scenario.id}_${Date.now()}.pdf`;
  doc.save(fileName);
}
