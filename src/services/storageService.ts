export interface SaveEnvelope<T> {
  version: number;
  savedAt: string;
  data: T;
}

const SAVE_VERSION = 1;

function getStorage(): Storage | null {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return null;
    const probe = '__fc26_storage_probe__';
    window.localStorage.setItem(probe, '1');
    window.localStorage.removeItem(probe);
    return window.localStorage;
  } catch {
    return null;
  }
}

export function saveVersioned<T>(key: string, data: T): boolean {
  const storage = getStorage();
  if (!storage) return false;

  const envelope: SaveEnvelope<T> = {
    version: SAVE_VERSION,
    savedAt: new Date().toISOString(),
    data,
  };

  try {
    storage.setItem(key, JSON.stringify(envelope));
    return true;
  } catch (error) {
    console.error(`[Save] Failed to write ${key}`, error);
    return false;
  }
}

export function loadVersioned<T>(key: string): T | null {
  const storage = getStorage();
  if (!storage) return null;

  try {
    const raw = storage.getItem(key);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as SaveEnvelope<T> | T;

    // Legacy saves stored the raw object/array directly. Accept them and let the
    // caller re-save in the versioned format after any migration is applied.
    if (
      parsed &&
      typeof parsed === 'object' &&
      'version' in parsed &&
      'data' in parsed
    ) {
      return (parsed as SaveEnvelope<T>).data;
    }

    return parsed as T;
  } catch (error) {
    console.error(`[Save] Failed to read ${key}; ignoring corrupt save`, error);
    return null;
  }
}

export function removeSaved(key: string): void {
  const storage = getStorage();
  if (!storage) return;

  try {
    storage.removeItem(key);
  } catch (error) {
    console.error(`[Save] Failed to remove ${key}`, error);
  }
}
