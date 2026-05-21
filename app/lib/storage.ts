import { DailyRecord, AppSettings } from '../types';

const STORAGE_KEY = 'weight-records';

function isDailyRecord(v: unknown): v is DailyRecord {
  return (
    typeof v === 'object' && v !== null &&
    typeof (v as Record<string, unknown>).date === 'string' &&
    typeof (v as Record<string, unknown>).weight === 'number' &&
    typeof (v as Record<string, unknown>).bodyFat === 'number'
  );
}

export function getRecords(): DailyRecord[] {
  if (typeof window === 'undefined') {
    return [];
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === null) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return (parsed as unknown[]).filter(isDailyRecord);
  } catch {
    return [];
  }
}

export function saveRecord(record: DailyRecord): void {
  const records = getRecords();
  const index = records.findIndex((r) => r.date === record.date);
  if (index !== -1) {
    records[index] = record;
  } else {
    records.push(record);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

export function deleteRecord(date: string): void {
  const records = getRecords().filter((r) => r.date !== date);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

const SETTINGS_KEY = 'app-settings';

const DEFAULT_SETTINGS: AppSettings = {
  themeColor: '#4DD0C4',
  showWeightGraph: true,
  showBodyFatGraph: true,
  showInputValues: true,
  showDiffArrows: true,
};

export function getSettings(): AppSettings {
  if (typeof window === 'undefined') {
    return DEFAULT_SETTINGS;
  }
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw === null) return DEFAULT_SETTINGS;
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return DEFAULT_SETTINGS;
    const p = parsed as Record<string, unknown>;
    return {
      themeColor: typeof p.themeColor === 'string' ? p.themeColor : DEFAULT_SETTINGS.themeColor,
      showWeightGraph: typeof p.showWeightGraph === 'boolean' ? p.showWeightGraph : DEFAULT_SETTINGS.showWeightGraph,
      showBodyFatGraph: typeof p.showBodyFatGraph === 'boolean' ? p.showBodyFatGraph : DEFAULT_SETTINGS.showBodyFatGraph,
      showInputValues: typeof p.showInputValues === 'boolean' ? p.showInputValues : DEFAULT_SETTINGS.showInputValues,
      showDiffArrows: typeof p.showDiffArrows === 'boolean' ? p.showDiffArrows : DEFAULT_SETTINGS.showDiffArrows,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: AppSettings): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}
