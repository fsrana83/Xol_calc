/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ScenarioPreset, TreatyConfig, Claim } from '../types/reinsurance';
import { DEFAULT_SCENARIOS } from '../data/defaultScenarios';
import { DEFAULT_TREATY_CONFIG } from './reinsuranceEngine';

const STORAGE_KEY_SCENARIOS = 'reinsurance_simulator_scenarios_v2';
const STORAGE_KEY_ACTIVE_ID = 'reinsurance_simulator_active_scenario_id_v2';
const STORAGE_KEY_TREATIES = 'reinsurance_simulator_treaties_v2';
const STORAGE_KEY_LAST_SAVED = 'reinsurance_simulator_last_saved_v2';

/**
 * Checks if browser LocalStorage is available
 */
function isLocalStorageAvailable(): boolean {
  try {
    const testKey = '__reinsurance_storage_test__';
    window.localStorage.setItem(testKey, testKey);
    window.localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

/**
 * Safely loads scenarios from LocalStorage.
 * Falls back to DEFAULT_SCENARIOS if empty or corrupted.
 */
export function loadSavedScenarios(): ScenarioPreset[] {
  if (!isLocalStorageAvailable()) {
    return DEFAULT_SCENARIOS;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY_SCENARIOS);
    if (!raw) {
      return DEFAULT_SCENARIOS;
    }

    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      // Basic validation: ensure each scenario has an id and claims array
      const validScenarios = parsed.filter(
        (s): s is ScenarioPreset =>
          typeof s === 'object' &&
          s !== null &&
          typeof s.id === 'string' &&
          typeof s.title === 'string' &&
          Array.isArray(s.claims)
      );

      if (validScenarios.length > 0) {
        return validScenarios;
      }
    }
  } catch (err) {
    console.warn('Failed to parse scenarios from LocalStorage, falling back to defaults:', err);
  }

  return DEFAULT_SCENARIOS;
}

/**
 * Persists scenarios array to LocalStorage.
 */
export function saveScenariosToStorage(scenarios: ScenarioPreset[]): boolean {
  if (!isLocalStorageAvailable()) return false;

  try {
    const payload = JSON.stringify(scenarios);
    window.localStorage.setItem(STORAGE_KEY_SCENARIOS, payload);
    const nowIso = new Date().toISOString();
    window.localStorage.setItem(STORAGE_KEY_LAST_SAVED, nowIso);
    return true;
  } catch (err) {
    console.error('Failed to save scenarios to LocalStorage (possibly quota exceeded):', err);
    return false;
  }
}

/**
 * Loads the last viewed active scenario ID, validating it exists in available scenarios.
 */
export function loadSavedActiveScenarioId(availableScenarios: ScenarioPreset[]): string {
  if (!isLocalStorageAvailable()) {
    return availableScenarios[0]?.id || DEFAULT_SCENARIOS[0].id;
  }

  try {
    const savedId = window.localStorage.getItem(STORAGE_KEY_ACTIVE_ID);
    if (savedId && availableScenarios.some((s) => s.id === savedId)) {
      return savedId;
    }
  } catch (err) {
    console.warn('Failed to load active scenario id from LocalStorage:', err);
  }

  return availableScenarios[0]?.id || DEFAULT_SCENARIOS[0].id;
}

/**
 * Saves active scenario ID to LocalStorage.
 */
export function saveActiveScenarioIdToStorage(id: string): void {
  if (!isLocalStorageAvailable()) return;
  try {
    window.localStorage.setItem(STORAGE_KEY_ACTIVE_ID, id);
  } catch (err) {
    console.warn('Failed to save active scenario id to LocalStorage:', err);
  }
}

/**
 * Loads saved Treaty Configuration from LocalStorage.
 */
export function loadSavedTreaties(): TreatyConfig {
  if (!isLocalStorageAvailable()) {
    return DEFAULT_TREATY_CONFIG;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY_TREATIES);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object' && parsed.quotaShare && parsed.riskXol) {
        return {
          ...DEFAULT_TREATY_CONFIG,
          ...parsed,
        };
      }
    }
  } catch (err) {
    console.warn('Failed to parse treaty config from LocalStorage:', err);
  }

  return DEFAULT_TREATY_CONFIG;
}

/**
 * Saves Treaty Configuration to LocalStorage.
 */
export function saveTreatiesToStorage(treaties: TreatyConfig): boolean {
  if (!isLocalStorageAvailable()) return false;

  try {
    window.localStorage.setItem(STORAGE_KEY_TREATIES, JSON.stringify(treaties));
    return true;
  } catch (err) {
    console.error('Failed to save treaty config to LocalStorage:', err);
    return false;
  }
}

/**
 * Returns formatted time of last LocalStorage save.
 */
export function getLastSavedTimestamp(): string | null {
  if (!isLocalStorageAvailable()) return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY_LAST_SAVED);
    if (!raw) return null;
    const date = new Date(raw);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  } catch {
    return null;
  }
}

/**
 * Resets scenarios and treaties back to original factory defaults.
 */
export function resetScenariosStorage(): void {
  if (!isLocalStorageAvailable()) return;
  try {
    window.localStorage.removeItem(STORAGE_KEY_SCENARIOS);
    window.localStorage.removeItem(STORAGE_KEY_ACTIVE_ID);
    window.localStorage.removeItem(STORAGE_KEY_TREATIES);
    window.localStorage.removeItem(STORAGE_KEY_LAST_SAVED);
  } catch (err) {
    console.error('Failed to reset LocalStorage:', err);
  }
}

/**
 * Exports current scenarios and optional treaty configuration as a downloadable JSON file.
 */
export function exportScenariosAsJson(
  scenarios: ScenarioPreset[],
  treaties?: TreatyConfig
): void {
  const exportPayload = {
    exportedAt: new Date().toISOString(),
    simulator: 'Reinsurance Recovery Simulator',
    currency: 'OMR (\u20c4)',
    treaties,
    scenarios,
  };

  const blob = new Blob([JSON.stringify(exportPayload, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `reinsurance_scenarios_backup_${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Parses and validates an imported JSON file string.
 */
export function parseImportedScenarios(jsonString: string): {
  scenarios: ScenarioPreset[];
  treaties?: TreatyConfig;
} | null {
  try {
    const parsed = JSON.parse(jsonString);

    // Support both wrapped export payload { scenarios: [...] } and raw array [...]
    let scenarioList: unknown[] = [];
    let treatyConfig: TreatyConfig | undefined = undefined;

    if (Array.isArray(parsed)) {
      scenarioList = parsed;
    } else if (parsed && typeof parsed === 'object') {
      if (Array.isArray(parsed.scenarios)) {
        scenarioList = parsed.scenarios;
      }
      if (parsed.treaties && typeof parsed.treaties === 'object') {
        treatyConfig = parsed.treaties as TreatyConfig;
      }
    }

    const validated: ScenarioPreset[] = scenarioList
      .filter((s): s is ScenarioPreset => {
        if (!s || typeof s !== 'object') return false;
        const candidate = s as Partial<ScenarioPreset>;
        return (
          typeof candidate.id === 'string' &&
          typeof candidate.title === 'string' &&
          Array.isArray(candidate.claims)
        );
      })
      .map((s) => ({
        ...s,
        isCustom: true,
        lastModified: new Date().toISOString(),
      }));

    if (validated.length === 0) {
      return null;
    }

    return {
      scenarios: validated,
      treaties: treatyConfig,
    };
  } catch (err) {
    console.error('Failed to parse imported scenarios JSON:', err);
    return null;
  }
}
