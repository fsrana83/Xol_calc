/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType, BorderStyle, AlignmentType } from 'docx';
import jsPDF from 'jspdf';
import { TreatyConfig } from '../types/reinsurance';
import { formatCurrency, formatPercent } from './reinsuranceEngine';

export interface ReinsuranceUseCase {
  id: string;
  number: number;
  title: string;
  category: 'Catastrophe' | 'Per-Risk Property' | 'Accumulation & Clash' | 'Stress Testing' | 'Solvency & Capital';
  peril: string;
  summary: string;
  objective: string;
  treatyMechanics: string[];
  formulaExplanation: string;
  sampleGrossLoss: number;
  sampleBreakdown: {
    grossLoss: number;
    qsCeded: number;
    riskXolRecovery: number;
    catXolRecovery: number;
    aslRecovery: number;
    netRetained: number;
    effectiveCessionPercent: number;
  };
  actuarialInsights: string[];
  balanceSheetImpact: string;
  regulatoryRelevance: string;
}

export const REINSURANCE_USE_CASES: ReinsuranceUseCase[] = [
  {
    id: 'uc-1',
    number: 1,
    title: 'Tropical Cyclone & Coastal Storm Surge (Catastrophe Protection)',
    category: 'Catastrophe',
    peril: 'Cyclone / Hurricane (Arabian Sea Category 3-4)',
    summary: 'Massive windstorm and tidal surge hitting coastal commercial assets, ports, and high-value villas across Muscat and Al Batinah coastal plains.',
    objective: 'Protect direct underwriting capital against high-severity multi-location accumulation exceeding single-event PML.',
    treatyMechanics: [
      'Step 1 (Quota Share): Direct company cedes 20% of every gross claim to proportional treaty reinsurers, retaining 80%.',
      'Step 2 (Risk XOL): For each individual claim exceeding \u20c4 10,000, Working Risk XOL absorbs up to \u20c4 40,000 (layer \u20c4 40k xs \u20c4 10k). Spillover remains retained.',
      'Step 3 (Cat XOL): All post-Risk net claims from the cyclone event aggregate under the "Hours Clause" (72 hours). If cumulative event loss exceeds \u20c4 200,000, Cat XOL absorbs up to \u20c4 2,000,000.',
      'Step 4 (Aggregate Stop-Loss): If annual net retained aggregate breaches \u20c4 600,000, ASL provides a secondary safety shield up to \u20c4 600,000.'
    ],
    formulaExplanation: 'L_net = max(0, min(L_event_post_risk - Cat_Attach, Cat_Limit)) -> L_retained = L_event_post_risk - L_cat_recovery - L_asl_recovery',
    sampleGrossLoss: 2850000,
    sampleBreakdown: {
      grossLoss: 2850000,
      qsCeded: 570000,
      riskXolRecovery: 240000,
      catXolRecovery: 1840000,
      aslRecovery: 0,
      netRetained: 200000,
      effectiveCessionPercent: 93.0,
    },
    actuarialInsights: [
      'Cat XOL absorbs the massive middle layer of loss, transferring 64.5% of the gross loss alone.',
      'Quota Share provided immediate front-line proportional mitigation across all damaged locations.',
      'Working Risk XOL trimmed 8 major commercial facility claims down to the primary deductible.'
    ],
    balanceSheetImpact: 'Direct company capital and solvency ratio preserved; net retained loss strictly capped at primary Cat deductible (\u20c4 200,000) instead of experiencing a \u20c4 2.85M direct solvency hit.',
    regulatoryRelevance: 'Complies with CMA Oman guidelines requiring catastrophic PML reinsurance protection down to 1-in-200 year return periods.'
  },
  {
    id: 'uc-2',
    number: 2,
    title: 'Industrial Petrochemical Conflagration (Per-Risk Working Capacity)',
    category: 'Per-Risk Property',
    peril: 'Industrial Explosion & Fire / Business Interruption',
    summary: 'A localized explosion and ensuing fire in a single refinery cracking unit in the Sohar Industrial Zone with large single-policy exposure.',
    objective: 'Provide high single-risk underwriting capacity for high-hazard commercial industrial clients without risking capital on isolated large claims.',
    treatyMechanics: [
      'Step 1 (Quota Share): Proportional 80/20 treaty cedes \u20c4 240,000 of the \u20c4 1,200,000 gross loss, retaining \u20c4 960,000.',
      'Step 2 (Risk XOL): Working Risk XOL attaches at \u20c4 10,000 and pays the maximum layer limit of \u20c4 40,000.',
      'Step 3 (Cat XOL): Because this is a single-policy isolated risk event, Cat XOL two-risk warranty excludes activation unless multiple separate policies are involved.',
      'Step 4 (Aggregate Stop-Loss): The remaining \u20c4 920,000 retained loss breaches the annual ASL deductible of \u20c4 600,000, recovering \u20c4 320,000 from the ASL reinsurer.'
    ],
    formulaExplanation: 'Single Risk: QS Cession = 20% * Loss; Risk XOL Recovery = min(Limit, max(0, Net_QS - Attach)); ASL Recovery = min(ASL_Limit, max(0, Net_Retained - ASL_Attach))',
    sampleGrossLoss: 1200000,
    sampleBreakdown: {
      grossLoss: 1200000,
      qsCeded: 240000,
      riskXolRecovery: 40000,
      catXolRecovery: 0,
      aslRecovery: 320000,
      netRetained: 600000,
      effectiveCessionPercent: 50.0,
    },
    actuarialInsights: [
      'Highlights the difference between Per-Risk XOL (which capped out at \u20c4 40,000) and Cat XOL (which requires multi-risk occurrence).',
      'The Aggregate Stop-Loss (ASL) stepped in as the critical portfolio backstop when a single severe risk blew past working layers.'
    ],
    balanceSheetImpact: 'The ASL protection saved the insurer from a \u20c4 920,000 net drain, containing net retention strictly to the budgeted \u20c4 600,000 aggregate tolerance.',
    regulatoryRelevance: 'Aligns with maximum single-risk retention rules (not exceeding 10% of company shareholders equity).'
  },
  {
    id: 'uc-3',
    number: 3,
    title: 'Flash Floods & Wadi Inundation (Multiple Accumulation Clusters)',
    category: 'Catastrophe',
    peril: 'Wadi Flash Flood & Heavy Monsoon Downpour',
    summary: 'Localized convective cloudburst causing sudden wadi flooding across Nizwa, Al Rustaq, and Sur, affecting 25+ mid-sized commercial and residential structures.',
    objective: 'Manage frequency of mid-severity claims that individually do not breach Risk XOL caps but aggregate into a severe catastrophic event.',
    treatyMechanics: [
      'Step 1 (Quota Share): Each flooded property loss is proportionally ceded 20% to reinsurers.',
      'Step 2 (Risk XOL): Modest-sized losses between \u20c4 15,000 and \u20c4 45,000 partially utilize the Risk XOL layer (recovering between \u20c4 5,000 and \u20c4 35,000 each).',
      'Step 3 (Cat XOL): Net claims from all 25 affected policies accumulate under the event definition, aggregating to \u20c4 580,000 post-Risk XOL. Cat XOL attaches at \u20c4 200,000 and pays \u20c4 380,000.',
      'Step 4 (Aggregate Stop-Loss): Not triggered as retained loss remains well below \u20c4 600,000.'
    ],
    formulaExplanation: 'Event Aggregation: Total_Post_Risk = Sum(Net_Risk_i); Cat_Recovery = min(Cat_Limit, max(0, Total_Post_Risk - Cat_Attach))',
    sampleGrossLoss: 890000,
    sampleBreakdown: {
      grossLoss: 890000,
      qsCeded: 178000,
      riskXolRecovery: 132000,
      catXolRecovery: 380000,
      aslRecovery: 0,
      netRetained: 200000,
      effectiveCessionPercent: 77.5,
    },
    actuarialInsights: [
      'The combination of Risk XOL (smoothing mid-size spikes) and Cat XOL (capping aggregate event accumulation) works in harmonious succession.',
      'Direct company net loss is limited to exactly the \u20c4 200,000 Cat XOL attachment point.'
    ],
    balanceSheetImpact: 'Stabilizes quarterly loss ratio, converting what would be a 180% combined ratio quarter into a controlled 95% operating ratio.',
    regulatoryRelevance: 'Demonstrates robust spatial aggregation monitoring across hydrological wadi zones.'
  },
  {
    id: 'uc-4',
    number: 4,
    title: 'Deep Subduction Earthquake & Tsunami Threat (Extreme Tail Risk)',
    category: 'Catastrophe',
    peril: 'Earthquake (Makran Trench Mw 8.1 & Tsunami Wave)',
    summary: 'A subduction fault rupture in the Sea of Oman generating heavy seismic shaking and maritime harbor wave damage at Duqm Port.',
    objective: 'Defend insurer against catastrophic tail events (1-in-250 year return period) where total losses threaten total enterprise solvency.',
    treatyMechanics: [
      'Step 1 (Quota Share): 20% proportional cession absorbs \u20c4 900,000 of the \u20c4 4,500,000 gross loss.',
      'Step 2 (Risk XOL): Exhausted on 12 major port warehouses and cranes, recovering total \u20c4 480,000.',
      'Step 3 (Cat XOL): Post-Risk residual claims aggregate to \u20c4 3,120,000. Cat XOL attaches at \u20c4 200,000 and exhausts its full \u20c4 2,000,000 limit.',
      'Step 4 (Aggregate Stop-Loss): After Cat XOL exhaustion, net retained loss of \u20c4 1,120,000 breaches the \u20c4 600,000 ASL threshold, triggering full \u20c4 520,000 recovery up to the \u20c4 600,000 ASL limit.'
    ],
    formulaExplanation: 'Tail Exhaustion: Cat XOL Limit Fully Claimed (\u20c4 2,000,000); Spillover passed into ASL layer; Net Retained = Max(0, Spillover - ASL Recovery)',
    sampleGrossLoss: 4500000,
    sampleBreakdown: {
      grossLoss: 4500000,
      qsCeded: 900000,
      riskXolRecovery: 480000,
      catXolRecovery: 2000000,
      aslRecovery: 520000,
      netRetained: 600000,
      effectiveCessionPercent: 86.7,
    },
    actuarialInsights: [
      'Both non-proportional treaties (Cat XOL and ASL) were fully mobilized to contain extreme systemic catastrophe.',
      'Without Aggregate Stop-Loss (ASL), the direct insurer would have faced \u20c4 1,120,000 net retained loss, exceeding standard regulatory capital buffers.'
    ],
    balanceSheetImpact: 'Prevents insolvency; statutory capital remains compliant with minimum solvency margin of 150%.',
    regulatoryRelevance: 'Meets stress-test criteria required for international rating agency (AM Best / S&P) Financial Strength Ratings.'
  },
  {
    id: 'uc-5',
    number: 5,
    title: 'Attritional Operations & Low-Severity Frequency (Benign Underwriting Year)',
    category: 'Per-Risk Property',
    peril: 'Routine Attritional Losses (Electrical Fires, Water Pipe Bursts, Minor Thefts)',
    summary: 'A standard operating year without catastrophe events; 40 minor to medium property claims ranging between \u20c4 2,000 and \u20c4 25,000.',
    objective: 'Evaluate the cost of reinsurance and retain maximum profitable premium while maintaining risk protection.',
    treatyMechanics: [
      'Step 1 (Quota Share): Proportional 20% cession takes off \u20c4 70,000 across all policies. Direct insurer earns 20% ceding commission.',
      'Step 2 (Risk XOL): Only 4 claims breach the \u20c4 10,000 attachment point, yielding modest recoveries of \u20c4 18,000.',
      'Step 3 (Cat XOL): No single event reaches the \u20c4 200,000 Cat XOL attachment point. Cat XOL layer remains completely untouched.',
      'Step 4 (Aggregate Stop-Loss): Total annual retained loss of \u20c4 262,000 is well below the \u20c4 600,000 ASL attachment point.'
    ],
    formulaExplanation: 'Benign State: Cat_Recovery = 0; ASL_Recovery = 0; Net_Retained = Gross_Loss - QS_Ceded - Minor_Risk_XOL',
    sampleGrossLoss: 350000,
    sampleBreakdown: {
      grossLoss: 350000,
      qsCeded: 70000,
      riskXolRecovery: 18000,
      catXolRecovery: 0,
      aslRecovery: 0,
      netRetained: 262000,
      effectiveCessionPercent: 25.1,
    },
    actuarialInsights: [
      'Demonstrates treaty efficiency in calm years: the company retains 74.9% of losses alongside 80% retained net premium.',
      'Allows company to build up underwriting equalization reserves.'
    ],
    balanceSheetImpact: 'Maximizes underwriting profit margin and return on equity (ROE) due to low non-proportional reinstatement costs.',
    regulatoryRelevance: 'Demonstrates baseline unencumbered underwriting performance to shareholders and regulatory auditors.'
  },
  {
    id: 'uc-6',
    number: 6,
    title: 'Marine Terminal Clash & Logistics Conflagration (Two-Risk Clash)',
    category: 'Accumulation & Clash',
    peril: 'Port Logistics Collision & Multi-Policy Fire',
    summary: 'A container ship unmooring incident causing collision with a gantry crane that collapses onto a bonded warehouse and petroleum pipeline.',
    objective: 'Test Risk Clash protection where multiple separate commercial policies underwritten by the same insurer are damaged by one physical incident.',
    treatyMechanics: [
      'Step 1 (Quota Share): 20% proportional cession across the 4 involved policies (Marine Hull, Cargo, Property Fire, Business Interruption).',
      'Step 2 (Risk XOL): Risk XOL applies on each policy independently: \u20c4 40,000 limit recovered on Policy A, \u20c4 35,000 on Policy B, \u20c4 40,000 on Policy C, total \u20c4 115,000.',
      'Step 3 (Cat XOL / Clash): Satisfies the "Two or more risks" warranty clause. The accumulated post-Risk loss of \u20c4 525,000 attaches to Cat XOL at \u20c4 200,000, recovering \u20c4 325,000.',
      'Step 4 (Aggregate Stop-Loss): Not triggered as net retained is kept to \u20c4 200,000.'
    ],
    formulaExplanation: 'Clash Mechanics: Sum(Risk_XOL_Recoveries) across separate policies; Residual aggregate claims trigger Cat XOL via multi-risk clause.',
    sampleGrossLoss: 800000,
    sampleBreakdown: {
      grossLoss: 800000,
      qsCeded: 160000,
      riskXolRecovery: 115000,
      catXolRecovery: 325000,
      aslRecovery: 0,
      netRetained: 200000,
      effectiveCessionPercent: 75.0,
    },
    actuarialInsights: [
      'Highlights the crucial distinction between "each risk" and "each event" reinsurance definitions.',
      'Proves that without Cat XOL clash coverage, multiple policy retentions would pile up on the balance sheet.'
    ],
    balanceSheetImpact: 'Direct net retained exposure locked at \u20c4 200,000 instead of suffering cumulative retained losses of \u20c4 525,000.',
    regulatoryRelevance: 'Validates multi-line accumulation control required under enterprise risk management (ERM) frameworks.'
  },
  {
    id: 'uc-7',
    number: 7,
    title: 'Forward-Looking Climate Severity Stress Test (+25% to +50% Severity Shock)',
    category: 'Stress Testing',
    peril: 'Elevated Sea Surface Temperature & Cyclone Intensification',
    summary: 'Evaluating portfolio resilience if Arabian Sea cyclonic storms increase in kinetic energy, generating a uniform +35% severity shock to all gross losses.',
    objective: 'Conduct dynamic stress testing to detect treaty exhaustion thresholds and anticipate future reinsurance purchasing requirements.',
    treatyMechanics: [
      'Step 1: Baseline scenario of \u20c4 1,800,000 gross loss is shocked by +35% to \u20c4 2,430,000.',
      'Step 2 (Quota Share): Proportional cession automatically expands from \u20c4 360,000 to \u20c4 486,000 (20% linear scaling).',
      'Step 3 (Risk XOL): As more claims exceed \u20c4 50,000, Risk XOL recovery expands from \u20c4 160,000 to \u20c4 220,000, but faces spillover on severe industrial assets.',
      'Step 4 (Cat XOL): Event accumulation expands to \u20c4 1,724,000, recovering \u20c4 1,524,000 (utilizing 76.2% of the \u20c4 2,000,000 Cat limit).',
      'Step 5 (ASL): Retained loss stays at \u20c4 200,000; the structure safely absorbs the +35% climate shock without blowing through Cat XOL capacity.'
    ],
    formulaExplanation: 'Stress Sensitivity: Gross_Shock = Gross * (1 + delta); Net_Sensitivity = d(Net_Retained) / d(Gross_Loss) -> 0 across Cat XOL covered band.',
    sampleGrossLoss: 2430000,
    sampleBreakdown: {
      grossLoss: 2430000,
      qsCeded: 486000,
      riskXolRecovery: 220000,
      catXolRecovery: 1524000,
      aslRecovery: 0,
      netRetained: 200000,
      effectiveCessionPercent: 91.8,
    },
    actuarialInsights: [
      'The treaty structure exhibits near-zero net retention sensitivity to severity shocks within the \u20c4 200k to \u20c4 2.2M Cat band.',
      'Reinsurers absorb 91.8% of the incremental climate shock volume.'
    ],
    balanceSheetImpact: 'Direct company earnings are immune to the +35% shock; however, future Cat XOL reinsurance reinstatement premiums will rise.',
    regulatoryRelevance: 'Directly fulfills TCFD (Task Force on Climate-Related Financial Disclosures) and Central Bank physical climate scenario modeling.'
  },
  {
    id: 'uc-8',
    number: 8,
    title: 'Capital Adequacy & Solvency Structure Optimization (Treaty Restructuring)',
    category: 'Solvency & Capital',
    peril: 'Corporate Capital Restructuring & Reinsurance Treaty Renewal',
    summary: 'Evaluating whether to shift Quota Share retention from 80% to 70% vs expanding Cat XOL limit from \u20c4 2M to \u20c4 3M to optimize Return on Equity (ROE).',
    objective: 'Balance the cost of reinsurance premiums against risk-weighted capital relief and net earnings volatility.',
    treatyMechanics: [
      'Option A (Current Baseline): 80% QS, \u20c4 40k xs \u20c4 10k Risk XOL, \u20c4 2M xs \u20c4 200k Cat XOL, \u20c4 600k ASL.',
      'Option B (Capital Release): 70% QS (cede 30%) provides an extra \u20c4 250,000 in proportional reinsurance recovery on large years but cedes \u20c4 180,000 in net margin.',
      'Option C (Cat Tail Expansion): Keep 80% QS, expand Cat XOL to \u20c4 3,000,000 xs \u20c4 200,000 for a modest non-proportional premium loading.',
      'Actuarial Conclusion: Option C is superior—it preserves 80% premium profit in normal years while protecting against 1-in-250 year mega-events.'
    ],
    formulaExplanation: 'Economic Capital Relief = delta(PML_99.5%) * Target_Solvency_Ratio - Reinsurance_Cost_Margin',
    sampleGrossLoss: 3200000,
    sampleBreakdown: {
      grossLoss: 3200000,
      qsCeded: 640000,
      riskXolRecovery: 280000,
      catXolRecovery: 2000000,
      aslRecovery: 80000,
      netRetained: 200000,
      effectiveCessionPercent: 93.8,
    },
    actuarialInsights: [
      'Expanding non-proportional Cat XOL limit provides much more cost-effective tail risk capital relief than ceding away 10% more profitable Quota Share premium.',
      'Maintains optimal capital efficiency under risk-based capital (RBC) regimes.'
    ],
    balanceSheetImpact: 'Maximizes shareholder Return on Equity (ROE) by 2.4 percentage points while maintaining an AA- equivalent solvency capital ratio.',
    regulatoryRelevance: 'Aligns with ORSA (Own Risk and Solvency Assessment) and supervisory stress test benchmarks.'
  },
  {
    id: 'uc-9',
    number: 9,
    title: 'Multi-Line LOB Treaty Segmentation (Motor, P&C, Medical & Group Life)',
    category: 'Solvency & Capital',
    peril: 'Multi-Line Underwriting Aggregation & Selective Treaty Enrolment',
    summary: 'Customizing treaty protection across Motor, P&C Lines, Medical Lines, and Group Life Lines to align reinsurance structures with distinct underwriting loss frequency and severity profiles.',
    objective: 'Prevent over-reinsuring non-catastrophe lines (such as Medical) through expensive property Cat treaties while maintaining strict per-life, per-risk, and aggregate Stop-Loss boundaries.',
    treatyMechanics: [
      'Motor: Enrolls in 80% Quota Share, \u20c4 40,000 Risk XOL (caps high third-party bodily injury awards), and \u20c4 2,000,000 Cat XOL (absorbs flash flood accumulation on dealership fleets).',
      'P&C Lines: Enrolls in all 4 tiers (Quota Share + Risk XOL + Cat XOL + Stop-Loss) for full commercial property and industrial infrastructure coverage.',
      'Medical Lines: Excluded from property Cat XOL and property-style Risk XOL; fully protected under 80% Quota Share for capacity and \u20c4 600,000 Aggregate Stop-Loss for loss-ratio overrun defense.',
      'Group Life Lines: Enrolls in Quota Share, \u20c4 40,000 per-life Risk XOL, and \u20c4 2,000,000 Cat XOL for multi-life workforce transport and worksite clash protection.'
    ],
    formulaExplanation: 'L_lob_recovery = sum_{treaty in Active_LOB_Treaties} Recovery(treaty, Loss_lob)',
    sampleGrossLoss: 2150000,
    sampleBreakdown: {
      grossLoss: 2150000,
      qsCeded: 430000,
      riskXolRecovery: 185000,
      catXolRecovery: 1120000,
      aslRecovery: 145000,
      netRetained: 270000,
      effectiveCessionPercent: 87.4,
    },
    actuarialInsights: [
      'Segmenting treaties prevents premium bleed: health/medical policies do not pay loaded Cat XOL rates on peril exposures they cannot incur.',
      'Motor and Group Life retain dedicated clash protection against sudden multi-claim wadi disasters and industrial transport incidents.',
      'Portfolio-wide Aggregate Stop-Loss (ASL) absorbs cross-line attritional spikes across Medical and attritional Motor without exhausting Cat XOL.'
    ],
    balanceSheetImpact: 'Reduces net annual reinsurance spend by 14.2% while achieving an 87.4% recovery on combined multi-line shock disasters.',
    regulatoryRelevance: 'Aligns with Capital Adequacy Regulations for Composite Insurers operating dual Life/Health and General insurance licenses in Oman.'
  }
];

/**
 * Export Use Cases to DOCX (.docx)
 */
export async function exportUseCasesToDocx(): Promise<void> {
  const sectionsChildren: (Paragraph | Table)[] = [];

  // Title Paragraph
  sectionsChildren.push(
    new Paragraph({
      heading: HeadingLevel.TITLE,
      children: [
        new TextRun({
          text: 'REINSURANCE TREATY USE CASES & ACTUARIAL SPECIFICATION',
          bold: true,
          size: 32,
          color: '1E293B',
        }),
      ],
      spacing: { after: 140 },
    })
  );

  // Subtitle / Metadata
  sectionsChildren.push(
    new Paragraph({
      children: [
        new TextRun({
          text: 'Actuarial Reference Master Sheet | Sultanate of Oman | Currency: Omani Rial (OMR / \u20c4)',
          italics: true,
          size: 20,
          color: '64748B',
        }),
      ],
      spacing: { after: 280 },
    })
  );

  // Overview Paragraph
  sectionsChildren.push(
    new Paragraph({
      children: [
        new TextRun({
          text: 'This document details the functional specifications, inuring treaty cascade mechanics, worked numerical calculations, and solvency balance sheet impacts for eight (8) foundational reinsurance use cases. All monetary figures are denominated in Omani Rial (\u20c4 / OMR).',
          size: 20,
          color: '334155',
        }),
      ],
      spacing: { after: 360 },
    })
  );

  // Baseline Treaty Structure Summary Box
  sectionsChildren.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_2,
      children: [
        new TextRun({
          text: 'Standard Treaty Architecture Baseline',
          bold: true,
          size: 24,
          color: '0F172A',
        }),
      ],
      spacing: { before: 200, after: 120 },
    })
  );

  const baselineRows = [
    new TableRow({
      children: [
        new TableCell({
          width: { size: 30, type: WidthType.PERCENTAGE },
          children: [new Paragraph({ children: [new TextRun({ text: 'Treaty Layer', bold: true, size: 18 })] })],
        }),
        new TableCell({
          width: { size: 35, type: WidthType.PERCENTAGE },
          children: [new Paragraph({ children: [new TextRun({ text: 'Structure / Limit', bold: true, size: 18 })] })],
        }),
        new TableCell({
          width: { size: 35, type: WidthType.PERCENTAGE },
          children: [new Paragraph({ children: [new TextRun({ text: 'Inuring Priority & Role', bold: true, size: 18 })] })],
        }),
      ],
    }),
    new TableRow({
      children: [
        new TableCell({
          children: [new Paragraph({ children: [new TextRun({ text: '1. Quota Share (QS)', size: 18, bold: true })] })],
        }),
        new TableCell({
          children: [new Paragraph({ children: [new TextRun({ text: '80% Retention / 20% Cession', size: 18 })] })],
        }),
        new TableCell({
          children: [new Paragraph({ children: [new TextRun({ text: '1st inuring layer. Proportional ground-up.', size: 18 })] })],
        }),
      ],
    }),
    new TableRow({
      children: [
        new TableCell({
          children: [new Paragraph({ children: [new TextRun({ text: '2. Working Risk XOL', size: 18, bold: true })] })],
        }),
        new TableCell({
          children: [new Paragraph({ children: [new TextRun({ text: 'Limit \u20c4 40,000 xs \u20c4 10,000 Attach', size: 18 })] })],
        }),
        new TableCell({
          children: [new Paragraph({ children: [new TextRun({ text: '2nd inuring layer. Per individual claim.', size: 18 })] })],
        }),
      ],
    }),
    new TableRow({
      children: [
        new TableCell({
          children: [new Paragraph({ children: [new TextRun({ text: '3. Catastrophe XOL', size: 18, bold: true })] })],
        }),
        new TableCell({
          children: [new Paragraph({ children: [new TextRun({ text: 'Limit \u20c4 2,000,000 xs \u20c4 200,000 Deductible', size: 18 })] })],
        }),
      ],
    }),
    new TableRow({
      children: [
        new TableCell({
          children: [new Paragraph({ children: [new TextRun({ text: '4. Aggregate Stop-Loss (ASL)', size: 18, bold: true })] })],
        }),
        new TableCell({
          children: [new Paragraph({ children: [new TextRun({ text: 'Limit \u20c4 600,000 xs \u20c4 600,000 Retention', size: 18 })] })],
        }),
        new TableCell({
          children: [new Paragraph({ children: [new TextRun({ text: '4th inuring layer. Annual portfolio retention cap.', size: 18 })] })],
        }),
      ],
    }),
  ];

  sectionsChildren.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: baselineRows,
    })
  );

  sectionsChildren.push(new Paragraph({ spacing: { after: 300 } }));

  // Iterate through all 8 use cases
  for (const uc of REINSURANCE_USE_CASES) {
    // Header for Use Case
    sectionsChildren.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [
          new TextRun({
            text: `Use Case ${uc.number}: ${uc.title}`,
            bold: true,
            size: 24,
            color: '0F172A',
          }),
        ],
        spacing: { before: 300, after: 80 },
      })
    );

    // Metadata Tag
    sectionsChildren.push(
      new Paragraph({
        children: [
          new TextRun({ text: `Category: ${uc.category} | Peril: ${uc.peril}`, bold: true, size: 18, color: '2563EB' }),
        ],
        spacing: { after: 120 },
      })
    );

    // Summary & Objective
    sectionsChildren.push(
      new Paragraph({
        children: [
          new TextRun({ text: 'Overview: ', bold: true, size: 20 }),
          new TextRun({ text: uc.summary, size: 20 }),
        ],
        spacing: { after: 80 },
      })
    );

    sectionsChildren.push(
      new Paragraph({
        children: [
          new TextRun({ text: 'Business Objective: ', bold: true, size: 20 }),
          new TextRun({ text: uc.objective, size: 20 }),
        ],
        spacing: { after: 140 },
      })
    );

    // Treaty Mechanics bullet points
    sectionsChildren.push(
      new Paragraph({
        children: [new TextRun({ text: 'Treaty Inuring Cascade Mechanics:', bold: true, size: 20 })],
        spacing: { after: 60 },
      })
    );

    for (const step of uc.treatyMechanics) {
      sectionsChildren.push(
        new Paragraph({
          bullet: { level: 0 },
          children: [new TextRun({ text: step, size: 19 })],
          spacing: { after: 40 },
        })
      );
    }

    // Formula & Worked Example Table
    sectionsChildren.push(
      new Paragraph({
        children: [
          new TextRun({ text: 'Actuarial Formula: ', bold: true, size: 20 }),
          new TextRun({ text: uc.formulaExplanation, italics: true, size: 19, color: '475569' }),
        ],
        spacing: { before: 80, after: 120 },
      })
    );

    // Numerical breakdown table
    const b = uc.sampleBreakdown;
    const tableRows = [
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Metric', bold: true, size: 17 })] })] }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Amount (OMR / \u20c4)', bold: true, size: 17 })] })] }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: '% of Gross', bold: true, size: 17 })] })] }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Total Gross Incurred Loss', size: 17 })] })] }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: formatCurrency(b.grossLoss), size: 17 })] })] }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: '100.0%', size: 17 })] })] }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Quota Share Ceded (20%)', size: 17 })] })] }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: formatCurrency(b.qsCeded), size: 17 })] })] }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `${((b.qsCeded / b.grossLoss) * 100).toFixed(1)}%`, size: 17 })] })] }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Working Risk XOL Recovery', size: 17 })] })] }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: formatCurrency(b.riskXolRecovery), size: 17 })] })] }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `${((b.riskXolRecovery / b.grossLoss) * 100).toFixed(1)}%`, size: 17 })] })] }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Catastrophe XOL Recovery', size: 17 })] })] }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: formatCurrency(b.catXolRecovery), size: 17 })] })] }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `${((b.catXolRecovery / b.grossLoss) * 100).toFixed(1)}%`, size: 17 })] })] }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Aggregate Stop-Loss (ASL) Recovery', size: 17 })] })] }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: formatCurrency(b.aslRecovery), size: 17 })] })] }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `${((b.aslRecovery / b.grossLoss) * 100).toFixed(1)}%`, size: 17 })] })] }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Total Net Retained by Company', bold: true, size: 17 })] })] }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: formatCurrency(b.netRetained), bold: true, size: 17 })] })] }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `${((b.netRetained / b.grossLoss) * 100).toFixed(1)}%`, bold: true, size: 17 })] })] }),
        ],
      }),
    ];

    sectionsChildren.push(
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: tableRows,
      })
    );

    // Balance Sheet Impact & Actuarial Insights
    sectionsChildren.push(
      new Paragraph({
        children: [
          new TextRun({ text: 'Balance Sheet & Capital Impact: ', bold: true, size: 20 }),
          new TextRun({ text: uc.balanceSheetImpact, size: 19 }),
        ],
        spacing: { before: 120, after: 60 },
      })
    );

    sectionsChildren.push(
      new Paragraph({
        children: [
          new TextRun({ text: 'Regulatory Relevance: ', bold: true, size: 20 }),
          new TextRun({ text: uc.regulatoryRelevance, size: 19 }),
        ],
        spacing: { after: 200 },
      })
    );
  }

  // Create document
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: sectionsChildren,
      },
    ],
  });

  // Export to Blob and download
  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `Reinsurance_Treaty_Use_Cases_Master_Sheet_${new Date().toISOString().slice(0, 10)}.docx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export Use Cases to PDF (.pdf)
 */
export function exportUseCasesToPdf(): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  let y = margin;

  const checkPageBreak = (neededHeight: number) => {
    if (y + neededHeight > pageHeight - margin) {
      doc.addPage();
      y = margin;
      renderHeaderFooter();
    }
  };

  const renderHeaderFooter = () => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(140, 145, 155);
    doc.text('Reinsurance Treaty Use Cases Master Sheet | Sultanate of Oman (OMR)', margin, 8);
    doc.text(
      `Page ${doc.internal.pages.length - 1}`,
      pageWidth - margin - 15,
      pageHeight - 6
    );
    doc.setDrawColor(220, 225, 230);
    doc.line(margin, 10, pageWidth - margin, 10);
  };

  // First page banner
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(margin, y, pageWidth - margin * 2, 22, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.text('REINSURANCE TREATY USE CASES & ACTUARIAL SPECIFICATION', margin + 4, y + 8);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(203, 213, 225);
  doc.text(
    `8 Foundation Use Cases | Quota Share (80%) + Risk XOL (40k) + Cat XOL (2M) + ASL (600k) | Currency: Omani Rial`,
    margin + 4,
    y + 16
  );

  y += 26;

  // Render each use case
  REINSURANCE_USE_CASES.forEach((uc) => {
    checkPageBreak(50);

    // Box Header
    doc.setFillColor(241, 245, 249); // slate-100
    doc.rect(margin, y, pageWidth - margin * 2, 8, 'F');
    doc.setDrawColor(203, 213, 225);
    doc.rect(margin, y, pageWidth - margin * 2, 8, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(15, 23, 42);
    doc.text(`Use Case ${uc.number}: ${uc.title}`, margin + 3, y + 5.5);

    y += 10;

    // Category pill
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(37, 99, 235);
    doc.text(`CATEGORY: ${uc.category.toUpperCase()} | PERIL: ${uc.peril}`, margin + 2, y + 2);
    y += 5;

    // Objective
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(51, 65, 85);
    const objLines = doc.splitTextToSize(`Objective: ${uc.objective}`, pageWidth - margin * 2 - 4);
    doc.text(objLines, margin + 2, y + 2);
    y += objLines.length * 4 + 2;

    // Mechanics
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(15, 23, 42);
    doc.text('Cascade Mechanics:', margin + 2, y + 2);
    y += 4;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);

    uc.treatyMechanics.forEach((step) => {
      const stepLines = doc.splitTextToSize(`• ${step}`, pageWidth - margin * 2 - 6);
      checkPageBreak(stepLines.length * 3.5 + 2);
      doc.text(stepLines, margin + 4, y + 2);
      y += stepLines.length * 3.5;
    });

    y += 2;

    // Numerical snapshot bar
    checkPageBreak(16);
    doc.setFillColor(248, 250, 252);
    doc.rect(margin + 2, y, pageWidth - margin * 2 - 4, 12, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.rect(margin + 2, y, pageWidth - margin * 2 - 4, 12, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text('Gross Loss', margin + 6, y + 4);
    doc.text('QS Ceded', margin + 42, y + 4);
    doc.text('Risk XOL', margin + 74, y + 4);
    doc.text('Cat XOL', margin + 104, y + 4);
    doc.text('ASL', margin + 132, y + 4);
    doc.text('Net Retained', margin + 152, y + 4);

    const b = uc.sampleBreakdown;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(15, 23, 42);
    doc.text(`${b.grossLoss.toLocaleString()} OMR`, margin + 6, y + 9);
    doc.setTextColor(37, 99, 235);
    doc.text(`${b.qsCeded.toLocaleString()} OMR`, margin + 42, y + 9);
    doc.setTextColor(217, 119, 6);
    doc.text(`${b.riskXolRecovery.toLocaleString()} OMR`, margin + 74, y + 9);
    doc.setTextColor(79, 70, 229);
    doc.text(`${b.catXolRecovery.toLocaleString()} OMR`, margin + 104, y + 9);
    doc.setTextColor(13, 148, 136);
    doc.text(`${b.aslRecovery.toLocaleString()} OMR`, margin + 132, y + 9);
    doc.setTextColor(16, 185, 129);
    doc.text(`${b.netRetained.toLocaleString()} OMR`, margin + 152, y + 9);

    y += 16;

    // Balance Sheet Impact
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(15, 23, 42);
    doc.text('Balance Sheet & Solvency Impact: ', margin + 2, y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    const impLines = doc.splitTextToSize(uc.balanceSheetImpact, pageWidth - margin * 2 - 45);
    doc.text(impLines, margin + 45, y);
    y += impLines.length * 3.5 + 4;

    doc.setDrawColor(226, 232, 240);
    doc.line(margin, y, pageWidth - margin, y);
    y += 4;
  });

  renderHeaderFooter();
  doc.save(`Reinsurance_Treaty_Use_Cases_Master_Sheet_${new Date().toISOString().slice(0, 10)}.pdf`);
}
