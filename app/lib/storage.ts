import { DailyRecord } from '../types';

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
