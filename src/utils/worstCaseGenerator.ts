/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Claim, ScenarioPreset, TreatyConfig } from '../types/reinsurance';
import { calculateReinsurance, formatCurrency } from './reinsuranceEngine';

/**
 * Generates an engineered 'Worst-Case Scenario' guaranteed to blow past
 * Working Risk XOL, completely exhaust Catastrophe XOL, and 100% exhaust
 * the Aggregate Stop-Loss (ASL) layer with significant spillover.
 */
export function generateWorstCaseScenario(
  treaties: TreatyConfig,
  customTitle?: string
): ScenarioPreset {
  const timestamp = Date.now();
  const eventId = `CAT-WORST-CASE-${timestamp}`;

  // Current treaty parameters
  const qsRetentionRatio = Math.max(0.1, (treaties.quotaShare.enabled ? treaties.quotaShare.retentionPercent : 100) / 100);
  const catLimit = treaties.catXol.enabled ? treaties.catXol.limit : 2000000;
  const catAttach = treaties.catXol.enabled ? treaties.catXol.attachmentPoint : 200000;
  const aslLimit = treaties.aggregateStopLoss?.enabled ? treaties.aggregateStopLoss.limit : 600000;
  const aslAttach = treaties.aggregateStopLoss?.enabled ? treaties.aggregateStopLoss.attachmentPoint : 600000;
  const riskLimit = treaties.riskXol.enabled ? treaties.riskXol.limit : 40000;
  const riskAttach = treaties.riskXol.enabled ? treaties.riskXol.attachmentPoint : 10000;

  // We want net loss before ASL to exceed (aslAttach + aslLimit * 1.4)
  // And eventNetBeforeCat to exceed (catAttach + catLimit * 1.35)
  // This guarantees both Cat XOL and ASL are 100% EXHAUSTED with high visible spillover.
  const targetNetBeforeAsl = aslAttach + aslLimit * 1.45;
  const targetEventNetBeforeCat = Math.max(
    catAttach + catLimit * 1.35,
    catAttach + catLimit + (targetNetBeforeAsl - catAttach)
  );

  // Define realistic multi-line asset templates in key Omani economic corridors
  const assetTemplates = [
    {
      name: 'Duqm Integrated Petroleum & LNG Export Marine Terminal',
      lob: 'P&C Lines' as const,
      location: 'Duqm SEZ (Special Economic Zone), Al Wusta',
      baseWeight: 0.22,
    },
    {
      name: 'Sohar Industrial Port - Hydrocracker & Ethylene Complex',
      lob: 'P&C Lines' as const,
      location: 'Sohar Port Industrial Corridor, North Al Batinah',
      baseWeight: 0.16,
    },
    {
      name: 'National Commercial Logistics Fleet & Tanker Transport Submergence',
      lob: 'Motor' as const,
      location: 'Barka Coastal Highway Corridor, South Al Batinah',
      baseWeight: 0.14,
    },
    {
      name: 'Offshore Energy Drilling Contractor Multiple-Life Incident',
      lob: 'Group Life Lines' as const,
      location: 'Mina Al Fahal Marine Oil Terminal, Muscat',
      baseWeight: 0.12,
    },
    {
      name: 'Corporate Critical Care & High-Cost Inpatient Surge Pool',
      lob: 'Medical Lines' as const,
      location: 'Muscat Specialized Medical Centers',
      baseWeight: 0.10,
    },
    {
      name: 'Salalah Port International Container Terminal (Quay Cranes & Berths)',
      lob: 'P&C Lines' as const,
      location: 'Port of Salalah Deep-Water Terminal, Dhofar',
      baseWeight: 0.08,
    },
    {
      name: 'Wattayah Dealership Showrooms & Commercial Vehicle Yards',
      lob: 'Motor' as const,
      location: 'Wattayah Commercial Corridor, Muscat',
      baseWeight: 0.06,
    },
    {
      name: 'Petroleum Contractor Field Workforce Transport Multiple-Death Clash',
      lob: 'Group Life Lines' as const,
      location: 'Nimr Field Oil Corridor, Dhofar',
      baseWeight: 0.05,
    },
    {
      name: 'Expatriate Specialized Oncology & Intensive Therapy Aggregation',
      lob: 'Medical Lines' as const,
      location: 'Al Khoudh Specialized Medical City, Muscat',
      baseWeight: 0.04,
    },
    {
      name: 'Barka Coastal Seawater Desalination & Combined Cycle Power Plant',
      lob: 'P&C Lines' as const,
      location: 'Barka Industrial Waterfront, South Al Batinah',
      baseWeight: 0.03,
    },
  ];

  // We need the sum of post-risk net losses to equal targetEventNetBeforeCat
  // Let grossLoss for each claim be sized so after QS and Risk XOL (each getting max Risk XOL limit absorbed)
  // the aggregate hits targetEventNetBeforeCat.
  const numClaims = assetTemplates.length;
  const totalRiskRecoveryEstimate = numClaims * riskLimit;
  const totalNetAfterQsTarget = targetEventNetBeforeCat + totalRiskRecoveryEstimate;
  const totalGrossNeeded = totalNetAfterQsTarget / qsRetentionRatio;

  // Ensure totalGrossNeeded is at least 6,500,000 OMR to guarantee extreme severity
  const finalTotalGross = Math.max(6800000, totalGrossNeeded);

  // Generate claims
  let claims: Claim[] = assetTemplates.map((template, idx) => {
    // Pro-rate gross loss according to economic weight
    let grossLoss = Math.round((finalTotalGross * template.baseWeight) / 1000) * 1000;
    // Ensure every claim is at least well above the Risk XOL attachment
    grossLoss = Math.max(grossLoss, (riskAttach + riskLimit * 3) / qsRetentionRatio);

    return {
      id: `CLM-WORST-${idx + 1}-${timestamp}`,
      claimNumber: `CLM-EXT-${1000 + idx + 1}`,
      policyNumber: `POL-OMN-${8000 + idx + 1}`,
      insuredName: template.name,
      lob: template.lob,
      location: template.location,
      grossLoss,
      eventId,
      eventName: "Worst-Case Mega-Disaster: Super Cyclone 'Gonu II' & Industrial Complex Conflagration",
      eventDate: new Date().toISOString().slice(0, 10),
    };
  });

  // Verify and fine-tune using the reinsurance engine to guarantee ASL exhaustion
  let summary = calculateReinsurance(claims, treaties);
  let attempts = 0;

  // If ASL is not yet 100% exhausted, scale upward
  while (attempts < 5 && ((summary.totalAslRecovery || 0) < aslLimit * 0.999 || (summary.totalAslSpillover || 0) <= 0)) {
    const scaleFactor = 1.35;
    claims = claims.map((c) => ({
      ...c,
      grossLoss: Math.round(c.grossLoss * scaleFactor),
    }));
    summary = calculateReinsurance(claims, treaties);
    attempts++;
  }

  const defaultTitle = customTitle || "Worst-Case Disaster: Super Cyclone & Industrial Clash (ASL Exhausted)";

  const newScenario: ScenarioPreset = {
    id: `worst-case-${timestamp}`,
    title: defaultTitle,
    category: 'Catastrophe',
    description: `Engineered extreme tail-risk catastrophe (1-in-250 year PML shock). Deliberately sized with ${claims.length} mega-severity industrial & coastal port claims to blow past Working Risk XOL limits, completely exhaust Catastrophe XOL (\u20c4 ${catLimit.toLocaleString()} limit), and 100% exhaust the Aggregate Stop-Loss (ASL) layer (\u20c4 ${aslLimit.toLocaleString()} limit) with severe net retained spillover.`,
    claims,
  };

  return newScenario;
}
