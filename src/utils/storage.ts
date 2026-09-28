import { Entry } from '../types';
import { INITIAL_ENTRIES } from '../data/initialEntries';

const STORAGE_KEY = 'marginalia_entries_blank_v2';

export function loadEntries(): Entry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      // Pristine blank slate as requested by the user
      return [];
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    return [];
  } catch (err) {
    console.error('Failed to load entries from localStorage:', err);
    return [];
  }
}

export function saveEntries(entries: Entry[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch (err) {
    console.error('Failed to save entries to localStorage:', err);
  }
}

export function clearLocalEntries(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.error('Failed to clear local entries:', err);
  }
}

export function resetToDemoEntries(): Entry[] {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_ENTRIES));
    return INITIAL_ENTRIES;
  } catch (err) {
    console.error('Failed to reset demo entries:', err);
    return INITIAL_ENTRIES;
  }
}

export function exportEntriesAsJson(entries: Entry[]): void {
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(entries, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', dataStr);
  downloadAnchor.setAttribute('download', `marginalia-library-export-${new Date().toISOString().slice(0, 10)}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}
