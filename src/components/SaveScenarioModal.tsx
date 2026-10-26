/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ScenarioPreset, Claim } from '../types/reinsurance';
import { formatCurrency } from '../utils/reinsuranceEngine';
import { X, Save, BookmarkCheck, Sparkles, Layers } from 'lucide-react';

interface SaveScenarioModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentScenario: ScenarioPreset;
  onSaveAsNewScenario: (newScenario: ScenarioPreset) => void;
}

export const SaveScenarioModal: React.FC<SaveScenarioModalProps> = ({
  isOpen,
  onClose,
  currentScenario,
  onSaveAsNewScenario,
}) => {
  const [title, setTitle] = useState(`${currentScenario.title} (Custom)`);
  const [category, setCategory] = useState<ScenarioPreset['category']>('Custom');
  const [description, setDescription] = useState(
    `Custom modified scenario based on "${currentScenario.title}". Contains ${currentScenario.claims.length} claims.`
  );

  if (!isOpen) return null;

  const totalGross = currentScenario.claims.reduce((s, c) => s + c.grossLoss, 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const newScenarioId = `custom-${Date.now()}`;
    // Deep copy claims with new IDs so they are decoupled
    const duplicatedClaims: Claim[] = currentScenario.claims.map((c, idx) => ({
      ...c,
      id: `CLM-${newScenarioId}-${idx + 1}`,
    }));

    const newPreset: ScenarioPreset = {
      id: newScenarioId,
      title: title.trim(),
      category,
      description: description.trim(),
      claims: duplicatedClaims,
      isCustom: true,
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString(),
    };

    onSaveAsNewScenario(newPreset);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-50 border border-indigo-200 rounded-lg text-indigo-700">
              <BookmarkCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Save Custom Scenario Preset</h3>
              <p className="text-xs text-slate-500">Persists scenario configuration in browser LocalStorage</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content & Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Current Base Snapshot Info */}
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs flex justify-between items-center">
            <span className="text-slate-600">
              Cloning <strong>{currentScenario.claims.length} claims</strong> from base:
            </span>
            <span className="font-mono font-bold text-indigo-700">
              {formatCurrency(totalGross)} Gross
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Custom Scenario Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Cyclone Shaheen - 20% Inflation Stress"
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as ScenarioPreset['category'])}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white cursor-pointer"
            >
              <option value="Custom">Custom</option>
              <option value="Catastrophe">Catastrophe</option>
              <option value="Per-Risk Shock">Per-Risk Shock</option>
              <option value="Attritional / Normal">Attritional / Normal</option>
              <option value="Mixed Multi-Event">Mixed Multi-Event</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Description & Underwriting Rationale
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide context or assumptions applied to this scenario..."
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <div className="text-[11px] text-slate-500 bg-indigo-50/60 p-2.5 rounded-md border border-indigo-100 flex items-start gap-2">
            <Save className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
            <span>
              This scenario will be saved to your browser&apos;s LocalStorage and will remain accessible even when refreshing or reopening the application.
            </span>
          </div>

          {/* Action buttons */}
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-md transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-md shadow-xs transition flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              <span>Save to LocalStorage</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
