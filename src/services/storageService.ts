export interface SaveEnvelope<T> {
  version: number;
  savedAt: string;
  data: T;
}

const SAVE_VERSION = 1;
const BACKUP_SUFFIX = ':backup';

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

function isEnvelope<T>(value: unknown): value is SaveEnvelope<T> {
  return Boolean(
    value &&
      typeof value === 'object' &&
      'version' in value &&
      'savedAt' in value &&
      'data' in value,
  );
}

function parseSaved<T>(raw: string): { data: T; legacy: boolean } | null {
  try {
    const parsed = JSON.parse(raw) as SaveEnvelope<T> | T;
    if (isEnvelope<T>(parsed)) return { data: parsed.data, legacy: false };
    return { data: parsed as T, legacy: true };
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
    const current = storage.getItem(key);
    if (current) storage.setItem(`${key}${BACKUP_SUFFIX}`, current);
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

  const primaryRaw = storage.getItem(key);
  const primary = primaryRaw ? parseSaved<T>(primaryRaw) : null;

  if (primary) {
    if (primary.legacy) saveVersioned(key, primary.data);
    return primary.data;
  }

  const backupRaw = storage.getItem(`${key}${BACKUP_SUFFIX}`);
  const backup = backupRaw ? parseSaved<T>(backupRaw) : null;

  if (backup) {
    console.warn(`[Save] Recovered ${key} from backup after primary save could not be read.`);
    saveVersioned(key, backup.data);
    return backup.data;
  }

  if (primaryRaw) {
    console.error(`[Save] ${key} is corrupt and no valid backup is available.`);
  }
  return null;
}

export function removeSaved(key: string): void {
  const storage = getStorage();
  if (!storage) return;

  try {
    storage.removeItem(key);
    storage.removeItem(`${key}${BACKUP_SUFFIX}`);
  } catch (error) {
    console.error(`[Save] Failed to remove ${key}`, error);
  }
}
