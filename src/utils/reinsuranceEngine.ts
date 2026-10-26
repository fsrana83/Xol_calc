import {
  Claim,
  ClaimCalculation,
  EventCalculation,
  OverallCalculationSummary,
  TreatyConfig,
} from '../types/reinsurance';

export type { OverallCalculationSummary };

export const DEFAULT_TREATY_CONFIG: TreatyConfig = {
  quotaShare: {
    enabled: true,
    retentionPercent: 80, // 80% Retention as requested
    cedingCommissionPercent: 25,
  },
  riskXol: {
    enabled: true,
    attachmentPoint: 10000, // $10,000 attachment
    limit: 40000, // $40,000 limit as requested ("Risk XOL limit is 40K")
    rateOnLine: 7.5,
    reinstatements: 1,
  },
  catXol: {
    enabled: true,
    attachmentPoint: 200000, // $200,000 retention / attachment point
    limit: 2000000, // $2,000,000 ($2M) limit as requested ("Cat XOl limit is 200000K - 2 million")
    cedantCoParticipation: 5, // 5% co-reinsurance retained by cedant
    rateOnLine: 12.0,
    twoRiskWarranty: true,
  },
  inuringOrder: 'QS_FIRST',
};

/**
 * Calculates reinsurance recoveries across Quota Share, Risk XOL, and Cat XOL treaties.
 */
export function calculateReinsurance(
  claims: Claim[],
  treaties: TreatyConfig
): OverallCalculationSummary {
  const { quotaShare, riskXol, catXol, inuringOrder } = treaties;

  // Step 1: Process per-claim proportional (QS) and Risk XOL
  const intermediateClaims: Array<{
    claim: Claim;
    grossLoss: number;
    qsCeded: number;
    netAfterQS: number;
    riskXolCeded: number;
    netAfterRiskXol: number;
    riskXolStatus: 'Below Attachment' | 'Within Layer (Covered)' | 'Exhausted (Spillover)';
    spilloverAboveRiskLimit: number;
  }> = [];

  for (const claim of claims) {
    const grossLoss = Math.max(0, claim.grossLoss);

    if (inuringOrder === 'QS_FIRST') {
      // 1. Quota share first
      let qsCeded = 0;
      if (quotaShare.enabled) {
        const cessionRatio = Math.max(0, Math.min(100, 100 - quotaShare.retentionPercent)) / 100;
        qsCeded = grossLoss * cessionRatio;
      }
      const netAfterQS = grossLoss - qsCeded;

      // 2. Risk XOL on Net After QS
      let riskXolCeded = 0;
      let spillover = 0;
      let status: 'Below Attachment' | 'Within Layer (Covered)' | 'Exhausted (Spillover)' = 'Below Attachment';

      if (riskXol.enabled && riskXol.limit > 0) {
        if (netAfterQS > riskXol.attachmentPoint) {
          const excess = netAfterQS - riskXol.attachmentPoint;
          riskXolCeded = Math.min(excess, riskXol.limit);
          spillover = Math.max(0, excess - riskXol.limit);
          status = spillover > 0 ? 'Exhausted (Spillover)' : 'Within Layer (Covered)';
        }
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
      });
    } else {
      // Risk XOL applies directly to gross, then QS applies to residual
      let riskXolCeded = 0;
      let spillover = 0;
      let status: 'Below Attachment' | 'Within Layer (Covered)' | 'Exhausted (Spillover)' = 'Below Attachment';

      if (riskXol.enabled && riskXol.limit > 0) {
        if (grossLoss > riskXol.attachmentPoint) {
          const excess = grossLoss - riskXol.attachmentPoint;
          riskXolCeded = Math.min(excess, riskXol.limit);
          spillover = Math.max(0, excess - riskXol.limit);
          status = spillover > 0 ? 'Exhausted (Spillover)' : 'Within Layer (Covered)';
        }
      }
      const netAfterRiskXolInitial = grossLoss - riskXolCeded;

      let qsCeded = 0;
      if (quotaShare.enabled) {
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
      });
    }
  }

  // Step 2: Group by Catastrophe Event to apply Cat XOL
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

    const qualifyingClaimsCount = groupClaims.filter((c) => c.netAfterRiskXol > 0).length;
    const meetsTwoRisk = !catXol.twoRiskWarranty || qualifyingClaimsCount >= 2;
    const catEligible = catXol.enabled && isCatEvent && meetsTwoRisk;

    let catXolGrossRecovery = 0;
    let catCedantCoParticipation = 0;
    let catXolNetRecovery = 0;
    let catSpilloverUncovered = 0;

    if (catEligible && eventNetBeforeCat > catXol.attachmentPoint) {
      const catExcess = eventNetBeforeCat - catXol.attachmentPoint;
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
      catSubjectLoss: isCatEvent ? eventNetBeforeCat : 0,
      catEligible,
      catLayerLower: catXol.attachmentPoint,
      catLayerUpper: catXol.attachmentPoint + catXol.limit,
      catXolGrossRecovery,
      catCedantCoParticipation,
      catXolNetRecovery,
      catSpilloverUncovered,
      finalNetRetained: eventFinalNetRetained,
    };

    // Allocate Cat XOL net recovery pro-rata to claims in this event based on their netAfterRiskXol
    if (catXolNetRecovery > 0 && eventNetBeforeCat > 0) {
      for (const c of groupClaims) {
        const share = (c.netAfterRiskXol / eventNetBeforeCat) * catXolNetRecovery;
        claimCatRecoveries[c.claim.id] = share;
      }
    } else {
      for (const c of groupClaims) {
        claimCatRecoveries[c.claim.id] = 0;
      }
    }
  }

  // Final per-claim structure
  const claimBreakdowns: ClaimCalculation[] = intermediateClaims.map((item) => {
    const catShare = claimCatRecoveries[item.claim.id] || 0;
    const finalNet = item.netAfterRiskXol - catShare;
    return {
      claim: item.claim,
      grossLoss: item.grossLoss,
      qsCeded: item.qsCeded,
      netAfterQS: item.netAfterQS,
      riskXolCeded: item.riskXolCeded,
      netAfterRiskXol: item.netAfterRiskXol,
      catXolCededShare: catShare,
      finalNetRetained: Math.max(0, finalNet),
      riskXolStatus: item.riskXolStatus,
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

  const totalReinsuranceRecovery = totalQsCeded + totalRiskXolCeded + totalCatXolRecovery;
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
  if (isNaN(amount) || amount === null || amount === undefined) return '$0';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatPercent(value: number): string {
  if (isNaN(value)) return '0.0%';
  return `${value.toFixed(1)}%`;
}
