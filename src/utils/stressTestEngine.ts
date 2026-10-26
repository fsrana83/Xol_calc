import { Claim, TreatyConfig, OverallCalculationSummary } from '../types/reinsurance';
import { calculateReinsurance } from './reinsuranceEngine';

export interface ShockScenarioResult {
  shockPercent: number; // e.g. -20, 0, 10, 25, 50, 75, 100, 150
  shockLabel: string;
  grossLoss: number;
  qsCeded: number;
  riskXolCeded: number;
  catXolRecovery: number;
  aslRecovery: number;
  totalRecovery: number;
  netRetained: number;
  cessionPercent: number;
  netRetentionPercent: number;
  riskXolExhaustedCount: number;
  catXolExhausted: boolean;
  catXolLayerUtilizationPercent: number;
  aslExhausted: boolean;
  aslLayerUtilizationPercent: number;
  summary: OverallCalculationSummary;
}

export const DEFAULT_SHOCK_LEVELS = [-20, -10, 0, 10, 25, 50, 75, 100, 150];

export function runStressTests(
  baseClaims: Claim[],
  treaties: TreatyConfig,
  shockLevels: number[] = DEFAULT_SHOCK_LEVELS
): ShockScenarioResult[] {
  return shockLevels.map((shock) => {
    const factor = 1 + shock / 100;

    // Apply shock multiplier to all claims
    const shockedClaims: Claim[] = baseClaims.map((c) => ({
      ...c,
      grossLoss: Math.max(0, c.grossLoss * factor),
    }));

    const result = calculateReinsurance(shockedClaims, treaties);

    // Analyze treaty exhaustion
    const riskXolExhaustedCount = result.claimBreakdowns.filter(
      (c) => c.riskXolStatus === 'Exhausted (Spillover)'
    ).length;

    const catLimit = treaties.catXol.limit;
    const catRecovery = result.totalCatXolRecovery;
    const catUtilization = catLimit > 0 ? (catRecovery / catLimit) * 100 : 0;
    const catXolExhausted = catUtilization >= 99.5;

    const aslLimit = treaties.aggregateStopLoss?.limit || 600000;
    const aslRecovery = result.totalAslRecovery || 0;
    const aslUtilization = aslLimit > 0 ? (aslRecovery / aslLimit) * 100 : 0;
    const aslExhausted = aslUtilization >= 99.5;

    let shockLabel = `${shock >= 0 ? '+' : ''}${shock}%`;
    if (shock === 0) shockLabel = 'Baseline (0%)';

    return {
      shockPercent: shock,
      shockLabel,
      grossLoss: result.totalGrossLoss,
      qsCeded: result.totalQsCeded,
      riskXolCeded: result.totalRiskXolCeded,
      catXolRecovery: result.totalCatXolRecovery,
      aslRecovery: result.totalAslRecovery || 0,
      totalRecovery: result.totalReinsuranceRecovery,
      netRetained: result.totalNetRetained,
      cessionPercent: result.effectiveCessionPercent,
      netRetentionPercent: result.effectiveNetRetentionPercent,
      riskXolExhaustedCount,
      catXolExhausted,
      catXolLayerUtilizationPercent: Math.min(100, catUtilization),
      aslExhausted,
      aslLayerUtilizationPercent: Math.min(100, aslUtilization),
      summary: result,
    };
  });
}
