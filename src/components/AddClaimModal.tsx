import React, { useState } from 'react';
import { Claim } from '../types/reinsurance';
import { Plus, X, Sparkles, AlertCircle } from 'lucide-react';

interface AddClaimModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddClaim: (claim: Claim) => void;
  activeEventName: string;
  activeEventId: string;
}

export const AddClaimModal: React.FC<AddClaimModalProps> = ({
  isOpen,
  onClose,
  onAddClaim,
  activeEventName,
  activeEventId,
}) => {
  const [insuredName, setInsuredName] = useState('');
  const [lob, setLob] = useState<Claim['lob']>('Commercial Property');
  const [grossLoss, setGrossLoss] = useState<string>('75000');
  const [location, setLocation] = useState('Metro City, District 1');
  const [claimNumber, setClaimNumber] = useState(`CLM-2026-${Math.floor(100 + Math.random() * 900)}`);
  const [policyNumber, setPolicyNumber] = useState(`POL-2026-${Math.floor(1000 + Math.random() * 9000)}`);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(grossLoss);
    if (isNaN(amount) || amount <= 0) {
      setError('Please enter a valid positive gross loss amount');
      return;
    }
    if (!insuredName.trim()) {
      setError('Please enter the insured name');
      return;
    }

    const newClaim: Claim = {
      id: `CLM-USR-${Date.now()}`,
      claimNumber: claimNumber.trim() || `CLM-${Date.now()}`,
      policyNumber: policyNumber.trim() || `POL-${Date.now()}`,
      insuredName: insuredName.trim(),
      lob,
      location: location.trim() || 'Undisclosed Location',
      grossLoss: amount,
      eventId: activeEventId || 'CUSTOM-EVENT',
      eventName: activeEventName || 'Custom Event',
      eventDate: new Date().toISOString().split('T')[0],
    };

    onAddClaim(newClaim);
    onClose();
  };

  const handleQuickPreset = (presetName: string, amount: number, presetLob: Claim['lob']) => {
    setInsuredName(presetName);
    setGrossLoss(amount.toString());
    setLob(presetLob);
    setError('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-[#ff4b4b]/10 text-[#ff4b4b] flex items-center justify-center font-bold">
              <Plus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Add Claim to Scenario</h3>
              <p className="text-[11px] text-slate-500 font-mono">Simulate treaty impact</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 rounded transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 rounded text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Quick Preset Buttons */}
          <div>
            <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">
              Quick Test Templates
            </label>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() =>
                  handleQuickPreset('Duqm Marine Engineering Facility', 280000, 'Warehouse & Logistics')
                }
                className="px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded text-[11px] text-slate-700 font-medium transition"
              >
                Mega Loss (&#x20c4; 280k)
              </button>
              <button
                type="button"
                onClick={() =>
                  handleQuickPreset('Al Khuwair Commercial Plaza', 50000, 'Commercial Property')
                }
                className="px-2 py-1 bg-amber-50 hover:bg-amber-100 rounded text-[11px] text-amber-800 font-medium border border-amber-200 transition"
              >
                Risk Limit Test (&#x20c4; 50k)
              </button>
              <button
                type="button"
                onClick={() =>
                  handleQuickPreset('Qurum Retail Center', 12500, 'Commercial Property')
                }
                className="px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded text-[11px] text-slate-700 font-medium transition"
              >
                Small Loss (&#x20c4; 12.5k)
              </button>
            </div>
          </div>

          {/* Insured Name */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Insured / Risk Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g., Muscat Hills Executive Tower"
              value={insuredName}
              onChange={(e) => setInsuredName(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-xs focus:ring-1 focus:ring-[#ff4b4b] focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Gross Loss */}
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Gross Incurred Loss (&#x20c4; OMR) *
              </label>
              <input
                type="number"
                required
                min="1"
                step="1000"
                placeholder="75000"
                value={grossLoss}
                onChange={(e) => setGrossLoss(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-xs font-mono font-bold text-slate-900 focus:ring-1 focus:ring-[#ff4b4b] focus:outline-none"
              />
            </div>

            {/* Line of Business */}
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Line of Business (LOB)
              </label>
              <select
                value={lob}
                onChange={(e) => setLob(e.target.value as Claim['lob'])}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-xs focus:ring-1 focus:ring-[#ff4b4b] focus:outline-none"
              >
                <option value="Commercial Property">Commercial Property</option>
                <option value="Industrial Plant">Industrial Plant</option>
                <option value="Residential High-Value">Residential High-Value</option>
                <option value="Warehouse & Logistics">Warehouse & Logistics</option>
                <option value="Energy & Marine">Energy & Marine</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Location */}
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Location</label>
              <input
                type="text"
                placeholder="Miami, FL"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-xs focus:ring-1 focus:ring-[#ff4b4b] focus:outline-none"
              />
            </div>

            {/* Event Name */}
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Event Tag</label>
              <input
                type="text"
                value={activeEventName}
                disabled
                className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-md text-xs text-slate-600 font-mono"
              />
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 text-slate-700 rounded-md text-xs font-semibold hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-[#ff4b4b] hover:bg-[#ff3333] text-white rounded-md text-xs font-bold shadow-xs transition"
            >
              Add Claim & Recalculate
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
