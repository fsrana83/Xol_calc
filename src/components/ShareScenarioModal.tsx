/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { ScenarioPreset, TreatyConfig, OverallCalculationSummary } from '../types/reinsurance';
import { formatCurrency, formatPercent, OMANI_RIAL_SIGN } from '../utils/reinsuranceEngine';
import {
  Share2,
  Copy,
  Check,
  Link,
  ShieldCheck,
  Clock,
  Lock,
  ExternalLink,
  QrCode,
  X,
  Sparkles,
  Mail,
  RefreshCw,
  FileText,
  CheckCircle2,
} from 'lucide-react';

interface ShareScenarioModalProps {
  isOpen: boolean;
  onClose: () => void;
  scenario: ScenarioPreset;
  treaties: TreatyConfig;
  summary: OverallCalculationSummary;
  onNotify?: (msg: string) => void;
}

export const ShareScenarioModal: React.FC<ShareScenarioModalProps> = ({
  isOpen,
  onClose,
  scenario,
  treaties,
  summary,
  onNotify,
}) => {
  const [includeTreaties, setIncludeTreaties] = useState<boolean>(true);
  const [enablePasscode, setEnablePasscode] = useState<boolean>(false);
  const [passcode, setPasscode] = useState<string>('OMAN-2026');
  const [expiryDays, setExpiryDays] = useState<number>(7);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [copiedSnippet, setCopiedSnippet] = useState<boolean>(false);
  const [showQrCode, setShowQrCode] = useState<boolean>(false);
  const [tokenSeed, setTokenSeed] = useState<string>(() =>
    Math.random().toString(36).substring(2, 9)
  );

  // Generate simulated shareable deep-link URL
  const { deepLinkUrl, expiryDateStr, shareToken } = useMemo(() => {
    const baseUrl =
      typeof window !== 'undefined' && window.location.origin
        ? window.location.origin
        : 'https://reinsurance-simulator.gov.om';

    const token = `share_sec_${tokenSeed}_${scenario.id.substring(0, 8)}`;
    const url = new URL(baseUrl);
    url.searchParams.set('scenario', scenario.id);
    url.searchParams.set('token', token);
    if (includeTreaties) {
      url.searchParams.set('qs', String(treaties.quotaShare.retentionPercent));
      url.searchParams.set('rxol', String(treaties.riskXol.limit));
      url.searchParams.set('cxol', String(treaties.catXol.limit));
      url.searchParams.set('asl', String(treaties.aggregateStopLoss.limit));
    }
    if (enablePasscode) {
      url.searchParams.set('protected', '1');
    }

    const expiry = new Date();
    expiry.setDate(expiry.getDate() + expiryDays);
    const dateFormatted = expiry.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    return {
      deepLinkUrl: url.toString(),
      expiryDateStr: dateFormatted,
      shareToken: token,
    };
  }, [scenario.id, treaties, includeTreaties, enablePasscode, expiryDays, tokenSeed]);

  // Executive summary snippet for email/Slack
  const executiveSnippet = useMemo(() => {
    return `📊 Reinsurance Recovery Scenario: "${scenario.title}"
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💰 Total Gross Losses: ${formatCurrency(summary.totalGrossLoss)} (${scenario.claims.length} Claims)
🛡️ Treaty Structure:
   • Quota Share: ${treaties.quotaShare.retentionPercent}% Retention / ${100 - treaties.quotaShare.retentionPercent}% Ceded
   • Risk XOL: ${formatCurrency(treaties.riskXol.limit)} limit xs ${formatCurrency(treaties.riskXol.attachmentPoint)}
   • Cat XOL: ${formatCurrency(treaties.catXol.limit)} limit xs ${formatCurrency(treaties.catXol.attachmentPoint)}
   • Stop-Loss (ASL): ${formatCurrency(treaties.aggregateStopLoss.limit)} limit xs ${formatCurrency(treaties.aggregateStopLoss.attachmentPoint)}
📈 Net Cedant Retention: ${formatCurrency(summary.totalNetRetained)} (${formatPercent(summary.effectiveNetRetentionPercent)})
🔗 Deep-Link URL: ${deepLinkUrl}
⏳ Valid for 7 Days (Expires: ${expiryDateStr})${enablePasscode ? `\n🔑 Access Passcode: ${passcode}` : ''}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Shared via Reinsurance Recovery Simulator (Oman)`;
  }, [scenario, treaties, summary, deepLinkUrl, expiryDateStr, enablePasscode, passcode]);

  if (!isOpen) return null;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(deepLinkUrl).then(() => {
      setCopiedLink(true);
      if (onNotify) onNotify('Deep-link URL copied to clipboard!');
      setTimeout(() => setCopiedLink(false), 2500);
    });
  };

  const handleCopySnippet = () => {
    navigator.clipboard.writeText(executiveSnippet).then(() => {
      setCopiedSnippet(true);
      if (onNotify) onNotify('Executive summary snippet copied to clipboard!');
      setTimeout(() => setCopiedSnippet(false), 2500);
    });
  };

  const handleRegenerateToken = () => {
    setTokenSeed(Math.random().toString(36).substring(2, 9));
    if (onNotify) onNotify('Generated new temporary deep-link token.');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-xl w-full max-h-[92vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">Share Scenario Deep-Link</h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-50 text-blue-700 border border-blue-200">
                  Temporary URL
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Generate a temporary, secure URL to share this exact scenario and claims portfolio with stakeholders.
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
          {/* Active Scenario Preview Card */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[10px] font-mono font-bold uppercase text-slate-500">
                Shared Scenario Snapshot
              </span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                {scenario.claims.length} Claims
              </span>
            </div>
            <h4 className="text-sm font-bold text-slate-900 truncate">{scenario.title}</h4>
            <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-200 text-xs">
              <div>
                <span className="text-[10px] text-slate-400 block font-mono">Total Gross Loss</span>
                <span className="font-bold text-slate-900 font-mono">
                  {formatCurrency(summary.totalGrossLoss)}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block font-mono">Reinsurance Recov</span>
                <span className="font-bold text-indigo-600 font-mono">
                  {formatCurrency(summary.totalReinsuranceRecovery)}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block font-mono">Cedant Retained</span>
                <span className="font-bold text-slate-900 font-mono">
                  {formatCurrency(summary.totalNetRetained)}
                </span>
              </div>
            </div>
          </div>

          {/* Generated Deep-Link URL Box */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <label className="font-bold text-slate-800 flex items-center gap-1.5">
                <Link className="w-3.5 h-3.5 text-blue-600" />
                <span>Temporary Shareable Deep-Link</span>
              </label>
              <button
                type="button"
                onClick={handleRegenerateToken}
                className="text-[11px] text-slate-500 hover:text-indigo-600 flex items-center gap-1 transition"
                title="Regenerate token"
              >
                <RefreshCw className="w-3 h-3" />
                <span>New Token</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={deepLinkUrl}
                className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono text-slate-800 select-all focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={handleCopyLink}
                className={`px-3.5 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs ${
                  copiedLink
                    ? 'bg-emerald-600 text-white'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedLink ? 'Copied!' : 'Copy Link'}</span>
              </button>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-amber-500" />
                <span>Simulated Expiry: {expiryDateStr}</span>
              </span>
              <span className="font-mono text-[10px] text-slate-400">Token: {shareToken}</span>
            </div>
          </div>

          {/* Access Scope & Configuration */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
            <span className="text-xs font-bold text-slate-800 block">
              Share Security & Parameter Inclusions
            </span>

            <div className="space-y-2 text-xs">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeTreaties}
                  onChange={(e) => setIncludeTreaties(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <span className="text-slate-700 font-medium">
                  Bundle active treaty structure (80% QS, &#x20c4; 40K Risk XOL, &#x20c4; 2M Cat XOL, Stop-Loss)
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={enablePasscode}
                  onChange={(e) => setEnablePasscode(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <span className="text-slate-700 font-medium">
                  Require Stakeholder Access Passcode
                </span>
              </label>

              {enablePasscode && (
                <div className="ml-6 flex items-center gap-2">
                  <span className="text-[11px] text-slate-500">Access PIN:</span>
                  <input
                    type="text"
                    value={passcode}
                    onChange={(e) => setPasscode(e.target.value)}
                    className="w-32 px-2 py-1 text-xs font-mono font-bold bg-white border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-600">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Access: Read-Only Stakeholder Mode</span>
              </span>

              <button
                type="button"
                onClick={() => setShowQrCode(!showQrCode)}
                className="text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1"
              >
                <QrCode className="w-3.5 h-3.5" />
                <span>{showQrCode ? 'Hide QR Code' : 'View Mobile QR Code'}</span>
              </button>
            </div>
          </div>

          {/* QR Code Visual Preview */}
          {showQrCode && (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg flex flex-col items-center justify-center gap-2 text-center animate-in fade-in duration-150">
              <div className="w-32 h-32 bg-white border-2 border-slate-900 p-2 rounded-lg flex flex-col items-center justify-center shadow-xs">
                {/* Simulated high-fidelity SVG QR pattern */}
                <svg viewBox="0 0 100 100" className="w-full h-full">
                  <rect x="0" y="0" width="30" height="30" fill="#0f172a" />
                  <rect x="5" y="5" width="20" height="20" fill="#ffffff" />
                  <rect x="9" y="9" width="12" height="12" fill="#0f172a" />

                  <rect x="70" y="0" width="30" height="30" fill="#0f172a" />
                  <rect x="75" y="5" width="20" height="20" fill="#ffffff" />
                  <rect x="79" y="9" width="12" height="12" fill="#0f172a" />

                  <rect x="0" y="70" width="30" height="30" fill="#0f172a" />
                  <rect x="5" y="75" width="20" height="20" fill="#ffffff" />
                  <rect x="9" y="79" width="12" height="12" fill="#0f172a" />

                  {/* Random simulated data matrix bits */}
                  <rect x="36" y="10" width="6" height="6" fill="#0f172a" />
                  <rect x="46" y="10" width="6" height="6" fill="#0f172a" />
                  <rect x="56" y="16" width="6" height="6" fill="#0f172a" />
                  <rect x="36" y="24" width="6" height="6" fill="#0f172a" />
                  <rect x="46" y="24" width="6" height="6" fill="#0f172a" />
                  <rect x="16" y="40" width="6" height="6" fill="#0f172a" />
                  <rect x="26" y="40" width="6" height="6" fill="#0f172a" />
                  <rect x="38" y="40" width="8" height="8" fill="#2563eb" />
                  <rect x="50" y="40" width="6" height="6" fill="#0f172a" />
                  <rect x="62" y="40" width="6" height="6" fill="#0f172a" />
                  <rect x="74" y="40" width="6" height="6" fill="#0f172a" />
                  <rect x="84" y="40" width="6" height="6" fill="#0f172a" />
                  <rect x="36" y="54" width="6" height="6" fill="#0f172a" />
                  <rect x="46" y="54" width="6" height="6" fill="#0f172a" />
                  <rect x="56" y="60" width="6" height="6" fill="#0f172a" />
                  <rect x="74" y="60" width="6" height="6" fill="#0f172a" />
                  <rect x="84" y="74" width="6" height="6" fill="#0f172a" />
                  <rect x="74" y="84" width="6" height="6" fill="#0f172a" />
                  <rect x="54" y="78" width="6" height="6" fill="#0f172a" />
                  <rect x="40" y="80" width="6" height="6" fill="#0f172a" />
                </svg>
              </div>
              <span className="text-[10px] text-slate-500 font-mono">
                Scan with mobile or tablet camera to open scenario
              </span>
            </div>
          )}

          {/* Quick Copy Snippet for Email / Slack */}
          <div className="border border-slate-200 rounded-lg p-3 bg-white space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-800 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-indigo-600" />
                <span>Executive Summary Snippet (Email / Teams / Slack)</span>
              </span>
              <button
                type="button"
                onClick={handleCopySnippet}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
              >
                {copiedSnippet ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Text</span>
                  </>
                )}
              </button>
            </div>
            <pre className="p-2.5 bg-slate-50 border border-slate-200 rounded text-[10px] font-mono text-slate-700 whitespace-pre-wrap max-h-32 overflow-y-auto">
              {executiveSnippet}
            </pre>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 rounded-lg transition"
          >
            Close
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyLink}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs flex items-center gap-1.5 transition cursor-pointer"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedLink ? 'Link Copied!' : 'Copy Deep-Link'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
