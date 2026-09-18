import { MatchHighlightEvent } from '../types/soccer';

const STORAGE_KEY = 'fc25_saved_match_highlights';
const MAX_SAVED_HIGHLIGHTS = 15;

/**
 * Retrieve all persistently saved match highlights from localStorage
 */
export function getSavedHighlights(): MatchHighlightEvent[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    return [];
  } catch (err) {
    console.warn('Failed to load saved match highlights from localStorage:', err);
    return [];
  }
}

/**
 * Check if a highlight is already stored in the vault
 */
export function isHighlightSaved(highlightId: string): boolean {
  const current = getSavedHighlights();
  return current.some(h => h.id === highlightId);
}

/**
 * Persist a highlight to the vault with quota management
 */
export function saveHighlightToVault(highlight: MatchHighlightEvent): { success: boolean; message: string } {
  try {
    const current = getSavedHighlights();
    
    // Check if already saved
    if (current.some(h => h.id === highlight.id)) {
      return { success: true, message: 'Highlight is already saved in your Vault!' };
    }

    // Keep within capacity limit (drop oldest if exceeding MAX)
    const updated = [highlight, ...current.filter(h => h.id !== highlight.id)];
    if (updated.length > MAX_SAVED_HIGHLIGHTS) {
      updated.splice(MAX_SAVED_HIGHLIGHTS);
    }

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return { success: true, message: 'Highlight successfully saved to your Vault!' };
    } catch (quotaError) {
      // If quota exceeded, prune older highlights and retry
      if (updated.length > 3) {
        const pruned = updated.slice(0, 5);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(pruned));
        return { success: true, message: 'Saved to Vault (older highlights pruned to optimize storage)' };
      }
      return { success: false, message: 'Storage capacity full. Please remove some older highlights.' };
    }
  } catch (err) {
    console.error('Error saving highlight:', err);
    return { success: false, message: 'Failed to save highlight.' };
  }
}

/**
 * Remove a highlight from the persistent vault
 */
export function removeHighlightFromVault(highlightId: string): boolean {
  try {
    const current = getSavedHighlights();
    const updated = current.filter(h => h.id !== highlightId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return true;
  } catch (err) {
    console.error('Error removing highlight:', err);
    return false;
  }
}

/**
 * Clear all highlights from the vault
 */
export function clearAllSavedHighlights(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.error('Error clearing highlights:', err);
  }
}
