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
  const [lob, setLob] = useState<Claim['lob']>('P&C Lines');
  const [grossLoss, setGrossLoss] = useState<string>('75000');
  const [location, setLocation] = useState('Muscat Capital District');
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
              Quick Test Templates (by LOB)
            </label>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() =>
                  handleQuickPreset('National Transport & Commercial Logistics Fleet', 65000, 'Motor')
                }
                className="px-2 py-1 bg-sky-50 hover:bg-sky-100 rounded text-[11px] text-sky-800 font-medium border border-sky-200 transition cursor-pointer"
              >
                Motor Fleet (&#x20c4; 65k)
              </button>
              <button
                type="button"
                onClick={() =>
                  handleQuickPreset('Sohar Petrochemical Synthesis Complex', 350000, 'P&C Lines')
                }
                className="px-2 py-1 bg-amber-50 hover:bg-amber-100 rounded text-[11px] text-amber-800 font-medium border border-amber-200 transition cursor-pointer"
              >
                P&C Mega Loss (&#x20c4; 350k)
              </button>
              <button
                type="button"
                onClick={() =>
                  handleQuickPreset('Corporate Workforce Medical Epidemic Aggregation', 180000, 'Medical Lines')
                }
                className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 rounded text-[11px] text-emerald-800 font-medium border border-emerald-200 transition cursor-pointer"
              >
                Medical Spike (&#x20c4; 180k)
              </button>
              <button
                type="button"
                onClick={() =>
                  handleQuickPreset('Duqm Marine Offshore Contractor Workforce Life', 120000, 'Group Life Lines')
                }
                className="px-2 py-1 bg-purple-50 hover:bg-purple-100 rounded text-[11px] text-purple-800 font-medium border border-purple-200 transition cursor-pointer"
              >
                Group Life Clash (&#x20c4; 120k)
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
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-xs focus:ring-1 focus:ring-indigo-600 focus:outline-none"
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
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-xs font-mono font-bold text-slate-900 focus:ring-1 focus:ring-indigo-600 focus:outline-none"
              />
            </div>

            {/* Line of Business */}
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Line of Business (LOB) *
              </label>
              <select
                value={lob}
                onChange={(e) => setLob(e.target.value as Claim['lob'])}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-xs focus:ring-1 focus:ring-indigo-600 focus:outline-none bg-white font-medium"
              >
                <optgroup label="Core Lines of Business (LOB)">
                  <option value="Motor">Motor</option>
                  <option value="P&C Lines">P&C Lines</option>
                  <option value="Medical Lines">Medical Lines</option>
                  <option value="Group Life Lines">Group Life Lines</option>
                </optgroup>
                <optgroup label="Specialized Sub-Lines">
                  <option value="Commercial Property">Commercial Property</option>
                  <option value="Industrial Plant">Industrial Plant</option>
                  <option value="Residential High-Value">Residential High-Value</option>
                  <option value="Warehouse & Logistics">Warehouse & Logistics</option>
                  <option value="Energy & Marine">Energy & Marine</option>
                </optgroup>
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
