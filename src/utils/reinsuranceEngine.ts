import {
  Claim,
  ClaimCalculation,
  EventCalculation,
  OverallCalculationSummary,
  TreatyConfig,
  CoreLineOfBusiness,
  LobTreatyConfig,
  LobTreatyMap,
} from '../types/reinsurance';

export type { OverallCalculationSummary };

export const OMANI_RIAL_SIGN = '\u20C4';

export const CORE_LOBS: CoreLineOfBusiness[] = [
  'Motor',
  'P&C Lines',
  'Medical Lines',
  'Group Life Lines',
];

export const DEFAULT_LOB_TREATIES: LobTreatyMap = {
  'Motor': {
    quotaShare: true,
    riskXol: true,
    catXol: true,
    aggregateStopLoss: true,
  },
  'P&C Lines': {
    quotaShare: true,
    riskXol: true,
    catXol: true,
    aggregateStopLoss: true,
  },
  'Medical Lines': {
    quotaShare: true,
    riskXol: false, // Standard actuarial practice: Medical utilizes QS & ASL rather than individual property-style Risk XOL
    catXol: false, // Catastrophe property treaties exclude health/medical epidemics
    aggregateStopLoss: true, // Medical heavily relies on Aggregate Stop-Loss
  },
  'Group Life Lines': {
    quotaShare: true,
    riskXol: true, // Excess of retention per life
    catXol: true, // Group life accumulation / catastrophic event
    aggregateStopLoss: true,
  },
};

/**
 * Resolves the treaty configuration for a specific Line of Business (LOB),
 * mapping any legacy or granular property sub-lines to P&C Lines.
 */
export function getLobConfig(lob: string, lobTreaties?: LobTreatyMap): LobTreatyConfig {
  if (lobTreaties && lobTreaties[lob]) {
    return lobTreaties[lob];
  }
  // If legacy P&C lines:
  if (
    lob === 'Commercial Property' ||
    lob === 'Industrial Plant' ||
    lob === 'Residential High-Value' ||
    lob === 'Energy & Marine' ||
    lob === 'Warehouse & Logistics'
  ) {
    if (lobTreaties && lobTreaties['P&C Lines']) {
      return lobTreaties['P&C Lines'];
    }
  }
  return {
    quotaShare: true,
    riskXol: true,
    catXol: true,
    aggregateStopLoss: true,
  };
}

export const DEFAULT_TREATY_CONFIG: TreatyConfig = {
  quotaShare: {
    enabled: true,
    retentionPercent: 80, // 80% Retention as requested
    cedingCommissionPercent: 25,
  },
  riskXol: {
    enabled: true,
    attachmentPoint: 10000, // 10,000 OMR attachment
    limit: 40000, // 40,000 OMR limit as requested ("Risk XOL limit is 40K")
    rateOnLine: 7.5,
    reinstatements: 1,
  },
  catXol: {
    enabled: true,
    attachmentPoint: 200000, // 200,000 OMR retention / attachment point
    limit: 2000000, // 2,000,000 OMR limit as requested ("Cat XOl limit is 200000K - 2 million")
    cedantCoParticipation: 5, // 5% co-reinsurance retained by cedant
    rateOnLine: 12.0,
    twoRiskWarranty: true,
  },
  aggregateStopLoss: {
    enabled: true,
    attachmentPoint: 400000, // 400,000 OMR attachment threshold
    limit: 600000, // 600,000 OMR aggregate stop-loss limit
    cedantCoParticipation: 5, // 5% co-participation
    rateOnLine: 8.5,
  },
  inuringOrder: 'QS_FIRST',
  lobTreaties: { ...DEFAULT_LOB_TREATIES },
};

/**
 * Calculates reinsurance recoveries across Quota Share, Risk XOL, Cat XOL, and Aggregate Stop-Loss treaties,
 * respecting per-LOB treaty enables/disables.
 */
export function calculateReinsurance(
  claims: Claim[],
  treaties: TreatyConfig
): OverallCalculationSummary {
  const { quotaShare, riskXol, catXol, aggregateStopLoss, inuringOrder, lobTreaties } = treaties;

  // Step 1: Process per-claim proportional (QS) and Risk XOL with per-LOB enforcement
  const intermediateClaims: Array<{
    claim: Claim;
    grossLoss: number;
    qsCeded: number;
    netAfterQS: number;
    riskXolCeded: number;
    netAfterRiskXol: number;
    riskXolStatus: 'Below Attachment' | 'Within Layer (Covered)' | 'Exhausted (Spillover)' | 'Excluded by LOB';
    spilloverAboveRiskLimit: number;
    lobConfig: LobTreatyConfig;
  }> = [];

  for (const claim of claims) {
    const grossLoss = Math.max(0, claim.grossLoss);
    const lobConfig = getLobConfig(claim.lob, lobTreaties);

    const isQsActiveForLob = quotaShare.enabled && lobConfig.quotaShare;
    const isRiskXolActiveForLob = riskXol.enabled && lobConfig.riskXol && riskXol.limit > 0;

    if (inuringOrder === 'QS_FIRST') {
      // 1. Quota share first (if active for this LOB)
      let qsCeded = 0;
      if (isQsActiveForLob) {
        const cessionRatio = Math.max(0, Math.min(100, 100 - quotaShare.retentionPercent)) / 100;
        qsCeded = grossLoss * cessionRatio;
      }
      const netAfterQS = grossLoss - qsCeded;

      // 2. Risk XOL on Net After QS (if active for this LOB)
      let riskXolCeded = 0;
      let spillover = 0;
      let status: 'Below Attachment' | 'Within Layer (Covered)' | 'Exhausted (Spillover)' | 'Excluded by LOB' = 'Below Attachment';

      if (!isRiskXolActiveForLob) {
        status = 'Excluded by LOB';
      } else if (netAfterQS > riskXol.attachmentPoint) {
        const excess = netAfterQS - riskXol.attachmentPoint;
        riskXolCeded = Math.min(excess, riskXol.limit);
        spillover = Math.max(0, excess - riskXol.limit);
        status = spillover > 0 ? 'Exhausted (Spillover)' : 'Within Layer (Covered)';
      }

      const netAfterRiskXol = netAfterQS - riskXolCeded;

      intermediateClaims.push({
        claim,
        grossLoss,
        qsCeded,
        netAfterQS,
        riskXolCeded,
        netAfterRiskXol,
        riskXolStatus: status,
        spilloverAboveRiskLimit: spillover,
        lobConfig,
      });
    } else {
      // Risk XOL applies directly to gross, then QS applies to residual
      let riskXolCeded = 0;
      let spillover = 0;
      let status: 'Below Attachment' | 'Within Layer (Covered)' | 'Exhausted (Spillover)' | 'Excluded by LOB' = 'Below Attachment';

      if (!isRiskXolActiveForLob) {
        status = 'Excluded by LOB';
      } else if (grossLoss > riskXol.attachmentPoint) {
        const excess = grossLoss - riskXol.attachmentPoint;
        riskXolCeded = Math.min(excess, riskXol.limit);
        spillover = Math.max(0, excess - riskXol.limit);
        status = spillover > 0 ? 'Exhausted (Spillover)' : 'Within Layer (Covered)';
      }
      const netAfterRiskXolInitial = grossLoss - riskXolCeded;

      let qsCeded = 0;
      if (isQsActiveForLob) {
        const cessionRatio = Math.max(0, Math.min(100, 100 - quotaShare.retentionPercent)) / 100;
        qsCeded = netAfterRiskXolInitial * cessionRatio;
      }
      const netAfterRiskXol = netAfterRiskXolInitial - qsCeded;

      intermediateClaims.push({
        claim,
        grossLoss,
        qsCeded,
        netAfterQS: grossLoss - qsCeded,
        riskXolCeded,
        netAfterRiskXol,
        riskXolStatus: status,
        spilloverAboveRiskLimit: spillover,
        lobConfig,
      });
    }
  }

  // Step 2: Group by Catastrophe Event to apply Cat XOL (respecting LOB exclusions)
  const eventGroups: Record<string, typeof intermediateClaims> = {};
  for (const item of intermediateClaims) {
    const eId = item.claim.eventId || 'NON-CAT';
    if (!eventGroups[eId]) {
      eventGroups[eId] = [];
    }
    eventGroups[eId].push(item);
  }

  const eventBreakdowns: Record<string, EventCalculation> = {};
  const claimCatRecoveries: Record<string, number> = {};

  for (const [eventId, groupClaims] of Object.entries(eventGroups)) {
    const eventName = groupClaims[0]?.claim.eventName || eventId;
    const isCatEvent = eventId !== 'NON-CAT' && eventId !== 'ATTRITIONAL';

    const eventGrossLoss = groupClaims.reduce((acc, c) => acc + c.grossLoss, 0);
    const eventQsCeded = groupClaims.reduce((acc, c) => acc + c.qsCeded, 0);
    const eventRiskXolCeded = groupClaims.reduce((acc, c) => acc + c.riskXolCeded, 0);
    const eventNetBeforeCat = groupClaims.reduce((acc, c) => acc + c.netAfterRiskXol, 0);

    // Filter claims in this event that belong to LOBs with Cat XOL enabled
    const catEligibleClaims = groupClaims.filter((c) => c.lobConfig.catXol);
    const catSubjectLoss = isCatEvent
      ? catEligibleClaims.reduce((acc, c) => acc + c.netAfterRiskXol, 0)
      : 0;

    const qualifyingCatRisks = catEligibleClaims.filter((c) => c.netAfterRiskXol > 0).length;
    const meetsTwoRisk = !catXol.twoRiskWarranty || qualifyingCatRisks >= 2;
    const catEligible = catXol.enabled && isCatEvent && meetsTwoRisk && qualifyingCatRisks > 0;

    let catXolGrossRecovery = 0;
    let catCedantCoParticipation = 0;
    let catXolNetRecovery = 0;
    let catSpilloverUncovered = 0;

    if (catEligible && catSubjectLoss > catXol.attachmentPoint) {
      const catExcess = catSubjectLoss - catXol.attachmentPoint;
      catXolGrossRecovery = Math.min(catExcess, catXol.limit);
      catCedantCoParticipation = catXolGrossRecovery * (Math.max(0, catXol.cedantCoParticipation) / 100);
      catXolNetRecovery = catXolGrossRecovery - catCedantCoParticipation;
      catSpilloverUncovered = Math.max(0, catExcess - catXol.limit);
    }

    const eventFinalNetRetained = eventNetBeforeCat - catXolNetRecovery;

    eventBreakdowns[eventId] = {
      eventId,
      eventName,
      claimCount: groupClaims.length,
      grossLoss: eventGrossLoss,
      qsCeded: eventQsCeded,
      riskXolCeded: eventRiskXolCeded,
      netBeforeCat: eventNetBeforeCat,
      catSubjectLoss,
      catEligible,
      catLayerLower: catXol.attachmentPoint,
      catLayerUpper: catXol.attachmentPoint + catXol.limit,
      catXolGrossRecovery,
      catCedantCoParticipation,
      catXolNetRecovery,
      catSpilloverUncovered,
      finalNetRetained: eventFinalNetRetained,
    };

    // Allocate Cat XOL net recovery pro-rata ONLY to claims whose LOB has Cat XOL enabled
    if (catXolNetRecovery > 0 && catSubjectLoss > 0) {
      for (const c of groupClaims) {
        if (c.lobConfig.catXol && c.netAfterRiskXol > 0) {
          const share = (c.netAfterRiskXol / catSubjectLoss) * catXolNetRecovery;
          claimCatRecoveries[c.claim.id] = share;
        } else {
          claimCatRecoveries[c.claim.id] = 0;
        }
      }
    } else {
      for (const c of groupClaims) {
        claimCatRecoveries[c.claim.id] = 0;
      }
    }
  }

  // Pre-Stop-Loss Claim state (after Cat XOL)
  const preAslClaims = intermediateClaims.map((item) => {
    const catShare = claimCatRecoveries[item.claim.id] || 0;
    const netAfterCat = Math.max(0, item.netAfterRiskXol - catShare);
    return {
      ...item,
      catShare,
      netAfterCat,
    };
  });

  // Step 3: Aggregate Stop-Loss (ASL) Calculation on Cumulative Portfolio Net
  // Only claims whose LOB enables ASL are subject to ASL attachment and recovery
  const aslEligibleClaims = preAslClaims.filter((c) => c.lobConfig.aggregateStopLoss);
  const aslSubjectNet = aslEligibleClaims.reduce((s, c) => s + c.netAfterCat, 0);
  const totalNetBeforeAsl = preAslClaims.reduce((s, c) => s + c.netAfterCat, 0);

  let totalAslRecovery = 0;
  let totalAslCoParticipation = 0;
  let totalAslSpillover = 0;
  const aslAttachment = aggregateStopLoss.attachmentPoint;
  const aslLimit = aggregateStopLoss.limit;

  if (aggregateStopLoss.enabled && aggregateStopLoss.limit > 0) {
    if (aslSubjectNet > aslAttachment) {
      const excess = aslSubjectNet - aslAttachment;
      const grossAslCovered = Math.min(excess, aslLimit);
      totalAslCoParticipation = grossAslCovered * (Math.max(0, aggregateStopLoss.cedantCoParticipation) / 100);
      totalAslRecovery = grossAslCovered - totalAslCoParticipation;
      totalAslSpillover = Math.max(0, excess - aslLimit);
    }
  }

  // Final per-claim structure (allocating ASL recovery pro-rata ONLY to claims whose LOB has ASL enabled)
  const claimBreakdowns: ClaimCalculation[] = preAslClaims.map((item) => {
    let aslShare = 0;
    if (item.lobConfig.aggregateStopLoss && totalAslRecovery > 0 && aslSubjectNet > 0) {
      aslShare = (item.netAfterCat / aslSubjectNet) * totalAslRecovery;
    }
    const finalNet = Math.max(0, item.netAfterCat - aslShare);
    return {
      claim: item.claim,
      grossLoss: item.grossLoss,
      qsCeded: item.qsCeded,
      netAfterQS: item.netAfterQS,
      riskXolCeded: item.riskXolCeded,
      netAfterRiskXol: item.netAfterRiskXol,
      catXolCededShare: item.catShare,
      aslCededShare: aslShare,
      finalNetRetained: finalNet,
      riskXolStatus: item.riskXolStatus === 'Excluded by LOB' ? 'Below Attachment' : item.riskXolStatus,
      spilloverAboveRiskLimit: item.spilloverAboveRiskLimit,
    };
  });

  const totalGrossLoss = claimBreakdowns.reduce((s, c) => s + c.grossLoss, 0);
  const totalQsCeded = claimBreakdowns.reduce((s, c) => s + c.qsCeded, 0);
  const totalRiskXolCeded = claimBreakdowns.reduce((s, c) => s + c.riskXolCeded, 0);
  const totalNetBeforeCat = claimBreakdowns.reduce((s, c) => s + c.netAfterRiskXol, 0);
  const totalCatXolRecovery = Object.values(eventBreakdowns).reduce((s, e) => s + e.catXolNetRecovery, 0);
  const totalCatCoParticipation = Object.values(eventBreakdowns).reduce((s, e) => s + e.catCedantCoParticipation, 0);
  const totalCatSpillover = Object.values(eventBreakdowns).reduce((s, e) => s + e.catSpilloverUncovered, 0);

  const totalReinsuranceRecovery = totalQsCeded + totalRiskXolCeded + totalCatXolRecovery + totalAslRecovery;
  const totalNetRetained = Math.max(0, totalGrossLoss - totalReinsuranceRecovery);

  const effectiveCessionPercent = totalGrossLoss > 0 ? (totalReinsuranceRecovery / totalGrossLoss) * 100 : 0;
  const effectiveNetRetentionPercent = totalGrossLoss > 0 ? (totalNetRetained / totalGrossLoss) * 100 : 0;

  return {
    totalGrossLoss,
    totalQsCeded,
    totalRiskXolCeded,
    totalNetBeforeCat,
    totalCatXolRecovery,
    totalCatCoParticipation,
    totalCatSpillover,
    totalNetBeforeAsl,
    totalAslRecovery,
    totalAslCoParticipation,
    totalAslSpillover,
    aslAttachment,
    aslLimit,
    totalReinsuranceRecovery,
    totalNetRetained,
    effectiveCessionPercent,
    effectiveNetRetentionPercent,
    claimsCount: claims.length,
    eventsCount: Object.keys(eventBreakdowns).length,
    claimBreakdowns,
    eventBreakdowns,
  };
}

export function formatCurrency(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return `${OMANI_RIAL_SIGN} 0`;
  }
  const formattedNumber = new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 0,
  }).format(amount);
  return `${OMANI_RIAL_SIGN} ${formattedNumber}`;
}

export function formatPercent(value: number): string {
  if (isNaN(value)) return '0.0%';
  return `${value.toFixed(1)}%`;
}
