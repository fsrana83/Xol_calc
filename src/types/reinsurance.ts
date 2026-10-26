export interface QuotaShareTreaty {
  enabled: boolean;
  retentionPercent: number; // e.g., 80 for 80% retained by cedant
  cedingCommissionPercent: number; // e.g., 25% commission from reinsurer
  eventLimit?: number; // optional limit on QS per event
}

export interface RiskXolTreaty {
  enabled: boolean;
  attachmentPoint: number; // e.g., $10,000 (retention before XOL kicks in)
  limit: number; // e.g., $40,000 (user specified 40K limit)
  rateOnLine: number; // e.g., 7.5% estimated premium rate
  reinstatements: number; // e.g., 1 reinstatement
}

export interface CatXolTreaty {
  enabled: boolean;
  attachmentPoint: number; // e.g., 200,000 OMR
  limit: number; // e.g., 2,000,000 OMR (user specified 200000K - 2 million)
  cedantCoParticipation: number; // e.g., 5% (Cedant's co-insurance in the layer)
  rateOnLine: number; // e.g., 11.0%
  twoRiskWarranty: boolean; // Requires minimum 2 risks to attach
}

export interface AggregateStopLossTreaty {
  enabled: boolean;
  attachmentPoint: number; // Cumulative net portfolio retention threshold before ASL attaches (e.g. 400,000 OMR)
  limit: number; // Maximum recovery under Stop-Loss (e.g. 600,000 OMR)
  cedantCoParticipation: number; // Cedant's co-insurance share within the Stop-Loss layer (e.g. 5%)
  rateOnLine?: number; // Estimated premium rate
}

export type InuringOrder = 'QS_FIRST' | 'RISK_XOL_FIRST';

export interface TreatyConfig {
  quotaShare: QuotaShareTreaty;
  riskXol: RiskXolTreaty;
  catXol: CatXolTreaty;
  aggregateStopLoss: AggregateStopLossTreaty;
  inuringOrder: InuringOrder;
}

export interface Claim {
  id: string;
  claimNumber: string;
  policyNumber: string;
  insuredName: string;
  lob: 'Commercial Property' | 'Industrial Plant' | 'Residential High-Value' | 'Energy & Marine' | 'Warehouse & Logistics';
  location: string;
  grossLoss: number;
  eventId: string; // Grouping key for Catastrophe events (e.g. "CAT-HURRICANE", "NON-CAT")
  eventName: string;
  eventDate: string;
}

export interface ClaimCalculation {
  claim: Claim;
  grossLoss: number;
  qsCeded: number;
  netAfterQS: number;
  riskXolCeded: number;
  netAfterRiskXol: number;
  catXolCededShare: number;
  aslCededShare: number;
  finalNetRetained: number;
  riskXolStatus: 'Below Attachment' | 'Within Layer (Covered)' | 'Exhausted (Spillover)';
  spilloverAboveRiskLimit: number;
}

export interface EventCalculation {
  eventId: string;
  eventName: string;
  claimCount: number;
  grossLoss: number;
  qsCeded: number;
  riskXolCeded: number;
  netBeforeCat: number;
  catSubjectLoss: number;
  catEligible: boolean; // meets 2-risk warranty
  catLayerLower: number;
  catLayerUpper: number;
  catXolGrossRecovery: number; // total recovery from the layer before co-participation
  catCedantCoParticipation: number; // cedant share of layer
  catXolNetRecovery: number; // final recovery paid to cedant
  catSpilloverUncovered: number; // loss exceeding layer limit
  finalNetRetained: number;
}

export interface OverallCalculationSummary {
  totalGrossLoss: number;
  totalQsCeded: number;
  totalRiskXolCeded: number;
  totalNetBeforeCat: number;
  totalCatXolRecovery: number;
  totalCatCoParticipation: number;
  totalCatSpillover: number;
  totalNetBeforeAsl: number;
  totalAslRecovery: number;
  totalAslCoParticipation: number;
  totalAslSpillover: number;
  aslAttachment: number;
  aslLimit: number;
  totalReinsuranceRecovery: number;
  totalNetRetained: number;
  effectiveCessionPercent: number; // Total Ceded / Gross Loss * 100
  effectiveNetRetentionPercent: number; // Total Retained / Gross Loss * 100
  claimsCount: number;
  eventsCount: number;
  claimBreakdowns: ClaimCalculation[];
  eventBreakdowns: Record<string, EventCalculation>;
}

export interface ScenarioPreset {
  id: string;
  title: string;
  description: string;
  category: 'Catastrophe' | 'Per-Risk Shock' | 'Attritional / Normal' | 'Mixed Multi-Event';
  claims: Claim[];
}
