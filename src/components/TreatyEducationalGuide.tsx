import React from 'react';
import { BookOpen, Shield, Zap, PieChart, Workflow, CheckCircle, HelpCircle } from 'lucide-react';

export const TreatyEducationalGuide: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Intro */}
      <div className="st-card p-5">
        <div className="flex items-center gap-2 mb-2">
          <BookOpen className="w-5 h-5 text-[#ff4b4b]" />
          <h3 className="text-base font-bold text-slate-900">
            Actuarial & Underwriting Reinsurance Guide
          </h3>
        </div>
        <p className="text-xs text-slate-600 leading-relaxed">
          Reinsurance structures combine proportional and non-proportional treaties to safeguard an insurance company’s capital against high-frequency attritional losses, high-severity individual risks, and aggregated catastrophe shock events.
        </p>
      </div>

      {/* 4 Treaty Pillars */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Quota Share */}
        <div className="st-card p-4 border-t-4 border-t-blue-500">
          <div className="flex items-center gap-2 mb-2">
            <PieChart className="w-4 h-4 text-blue-600" />
            <h4 className="text-sm font-bold text-slate-900">1. Quota Share (80% Retention)</h4>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed mb-3">
            <b>Proportional Treaty:</b> The ceding company retains <b>80%</b> of premium and claims, and cedes the complementary <b>20%</b> to reinsurers.
          </p>
          <div className="bg-blue-50/60 p-2.5 rounded text-[11px] text-blue-900 space-y-1">
            <div>• <b>Primary Benefit:</b> Solvency relief and growth leverage.</div>
            <div>• <b>Ceding Commission:</b> 25% reimbursement on acquisition.</div>
            <div>• <b>First Dollar:</b> Ground-up coverage on all policies.</div>
          </div>
        </div>

        {/* Risk XOL */}
        <div className="st-card p-4 border-t-4 border-t-amber-500">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-4 h-4 text-amber-600" />
            <h4 className="text-sm font-bold text-slate-900">2. Working Risk XOL (&#x20c4; 40K)</h4>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed mb-3">
            <b>Per-Risk Excess of Loss:</b> Protects against large individual claims on a single insured risk (e.g., commercial plant fire).
          </p>
          <div className="bg-amber-50/60 p-2.5 rounded text-[11px] text-amber-900 space-y-1">
            <div>• <b>Specified Limit:</b> &#x20c4; 40,000 maximum payout per risk.</div>
            <div>• <b>Attachment Point:</b> &#x20c4; 10,000 deductible paid by cedant.</div>
            <div>• <b>Inuring Order:</b> Standardly applies after QS reduction.</div>
          </div>
        </div>

        {/* Cat XOL */}
        <div className="st-card p-4 border-t-4 border-t-indigo-600">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-4 h-4 text-indigo-600" />
            <h4 className="text-sm font-bold text-slate-900">3. Cat XOL (&#x20c4; 2M xs &#x20c4; 200K)</h4>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed mb-3">
            <b>Per-Event Occurrence Treaty:</b> Protects against the accumulation of dozens of claims from a single catastrophe.
          </p>
          <div className="bg-indigo-50/60 p-2.5 rounded text-[11px] text-indigo-900 space-y-1">
            <div>• <b>Specified Limit:</b> &#x20c4; 2,000,000 capacity per event.</div>
            <div>• <b>Event Deductible:</b> Attaches at &#x20c4; 200,000 net loss.</div>
            <div>• <b>Two-Risk Warranty:</b> Requires min 2 distinct risks.</div>
          </div>
        </div>

        {/* Aggregate Stop-Loss */}
        <div className="st-card p-4 border-t-4 border-t-teal-500">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-4 h-4 text-teal-600" />
            <h4 className="text-sm font-bold text-slate-900">4. Stop-Loss ASL (Portfolio Cap)</h4>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed mb-3">
            <b>Aggregate Excess of Loss:</b> Ultimate balance sheet protection capping the insurer's cumulative annual net retention across all risks and events.
          </p>
          <div className="bg-teal-50/60 p-2.5 rounded text-[11px] text-teal-900 space-y-1">
            <div>• <b>Specified Limit:</b> &#x20c4; 600,000 aggregate protection.</div>
            <div>• <b>Attachment Point:</b> Attaches at &#x20c4; 400,000 cumulative net.</div>
            <div>• <b>Inuring Order:</b> Last line of defense (inures after Cat XOL).</div>
          </div>
        </div>
      </div>

      {/* Reinsurance Inuring Cascade Workflow */}
      <div className="st-card p-5">
        <div className="flex items-center gap-2 mb-3">
          <Workflow className="w-4 h-4 text-slate-700" />
          <h4 className="text-sm font-bold text-slate-900">
            Standard Actuarial Inuring Order (Why Order Matters)
          </h4>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
            <div className="font-bold text-slate-800 mb-1">Step 1: Gross Incurred Claim</div>
            <p className="text-slate-500 text-[11px]">
              Insured suffers property loss (e.g. $100,000). Full gross liability is recorded on the book.
            </p>
          </div>
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="font-bold text-blue-900 mb-1">Step 2: Quota Share (80% / 20%)</div>
            <p className="text-blue-800 text-[11px]">
              20% ($20,000) is immediately ceded to Quota Share reinsurers. Cedant retains 80% ($80,000).
            </p>
          </div>
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="font-bold text-amber-900 mb-1">Step 3: Risk XOL ($40k xs $10k)</div>
            <p className="text-amber-800 text-[11px]">
              The $80,000 net claim hits Risk XOL. Reinsurer pays $40,000. Cedant pays $10,000 retention + $30,000 spillover ($40,000 net).
            </p>
          </div>
          <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-lg">
            <div className="font-bold text-indigo-900 mb-1">Step 4: Cat XOL ($2M xs $200k)</div>
            <p className="text-indigo-800 text-[11px]">
              All claims from the storm are aggregated. If total net exceeds $200k, Cat XOL reimburses up to $2,000,000!
            </p>
          </div>
        </div>
      </div>

      {/* LOB Architecture Section */}
      <div className="st-card p-5">
        <h4 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
          <Workflow className="w-4 h-4 text-indigo-600" />
          <span>Line of Business (LOB) Treaty Architecture & Market Standard</span>
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div className="p-3 bg-sky-50/60 rounded-lg border border-sky-200">
            <span className="font-bold text-sky-900">Motor Lines:</span>
            <p className="text-slate-700 mt-1">
              • <b>Risk XOL:</b> Capping severe individual bodily injury / TPL awards at &#x20c4; 40k.
              <br />• <b>Cat XOL:</b> Protecting dealership fleet submergence from wadi flash floods.
            </p>
          </div>
          <div className="p-3 bg-amber-50/60 rounded-lg border border-amber-200">
            <span className="font-bold text-amber-900">P&C Lines:</span>
            <p className="text-slate-700 mt-1">
              • <b>All 4 Tiers:</b> Quota share capacity, per-risk property fire capping, cyclone cat pooling, and ASL capital preservation.
            </p>
          </div>
          <div className="p-3 bg-emerald-50/60 rounded-lg border border-emerald-200">
            <span className="font-bold text-emerald-900">Medical Lines:</span>
            <p className="text-slate-700 mt-1">
              • <b>QS & ASL:</b> Health insurance excludes property Cat XOL. Capacity is driven by QS, and loss ratio overrun is absorbed by ASL.
            </p>
          </div>
          <div className="p-3 bg-purple-50/60 rounded-lg border border-purple-200">
            <span className="font-bold text-purple-900">Group Life Lines:</span>
            <p className="text-slate-700 mt-1">
              • <b>Life XOL & Clash:</b> Strict per-life limit (&#x20c4; 40k) with Cat XOL covering multi-death workforce transit or platform accidents.
            </p>
          </div>
        </div>
      </div>

      {/* Actuarial Glossary */}
      <div className="st-card p-5">
        <h4 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-slate-500" />
          <span>Actuarial Terminology Glossary</span>
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div className="p-3 bg-slate-50 rounded border border-slate-200">
            <span className="font-bold text-slate-900">Attachment Point (Deductible):</span>
            <p className="text-slate-600 mt-1">
              The threshold of loss that the primary company must bear before the excess of loss reinsurer begins paying.
            </p>
          </div>
          <div className="p-3 bg-slate-50 rounded border border-slate-200">
            <span className="font-bold text-slate-900">Treaty Limit:</span>
            <p className="text-slate-600 mt-1">
              The maximum aggregate dollar indemnity that the reinsurer will reimburse for a single risk or event.
            </p>
          </div>
          <div className="p-3 bg-slate-50 rounded border border-slate-200">
            <span className="font-bold text-slate-900">Two-Risk Warranty:</span>
            <p className="text-slate-600 mt-1">
              Clause stipulating that a Cat XOL treaty will only respond if at least two independent policies/risks are involved in the event.
            </p>
          </div>
          <div className="p-3 bg-slate-50 rounded border border-slate-200">
            <span className="font-bold text-slate-900">Cedant Co-Participation:</span>
            <p className="text-slate-600 mt-1">
              A requirement (usually 5% to 10%) that the primary insurer retains a co-insurance share within the XOL layer to align interests with reinsurers.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
