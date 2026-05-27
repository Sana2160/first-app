'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getRecords, saveRecord, getSettings, getHolidaysFromStorage, saveHolidays } from './lib/storage';
import { DailyRecord, AppSettings, WeeklySummary, Holidays } from './types';
import Calendar from './components/Calendar';
import BottomSheet from './components/BottomSheet';
import EditModal from './components/EditModal';

export default function Home() {
  const [records, setRecords] = useState<DailyRecord[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [settings, setSettings] = useState<AppSettings>({
    themeColor: '#4DD0C4',
    showWeightGraph: true,
    showBodyFatGraph: false,
    showWeightValue: true,
    showBodyFatValue: false,
    showDiffArrows: true,
    targetWeight: null,
  });
  const [showCelebration, setShowCelebration] = useState(false);
  const [weeklySummary, setWeeklySummary] = useState<WeeklySummary | null>(null);
  const [holidays, setHolidays] = useState<Holidays>({});

  useEffect(() => {
    setRecords(getRecords());
    setSettings(getSettings());
    setHolidays(getHolidaysFromStorage());

    if (navigator.onLine) {
      fetch('https://holidays-jp.github.io/api/v1/date.json')
        .then((res) => res.json())
        .then((data: unknown) => {
          if (typeof data === 'object' && data !== null && !Array.isArray(data)) {
            const validated: Holidays = {};
            for (const [k, v] of Object.entries(data)) {
              if (typeof k === 'string' && typeof v === 'string') validated[k] = v;
            }
            saveHolidays(validated);
            setHolidays(validated);
          }
        })
        .catch(() => {});
    }
  }, []);

  const recordMap = new Map<string, DailyRecord>();
  for (const r of records) { recordMap.set(r.date, r); }

  function calcWeeklySummary(
    date: string,
    allRecords: DailyRecord[],
    targetWeight: number | null,
  ): WeeklySummary | null {
    const [year, month, day] = date.split('-').map(Number);
    const d = new Date(year, month - 1, day);
    if (d.getDay() !== 6) return null;

    const sundayDate = new Date(year, month - 1, day - 6);
    function toDateStr(dt: Date): string {
      const y = dt.getFullYear();
      const m = String(dt.getMonth() + 1).padStart(2, '0');
      const dd = String(dt.getDate()).padStart(2, '0');
      return `${y}-${m}-${dd}`;
    }
    const sundayStr = toDateStr(sundayDate);

    const weekRecords = allRecords
      .filter((r) => r.date >= sundayStr && r.date <= date)
      .sort((a, b) => a.date.localeCompare(b.date));

    const weightChange = weekRecords.length >= 2
      ? weekRecords[weekRecords.length - 1].weight - weekRecords[0].weight
      : 0;

    const lastWeight = weekRecords.length > 0 ? weekRecords[weekRecords.length - 1].weight : null;
    const targetDiff = targetWeight !== null && lastWeight !== null
      ? lastWeight - targetWeight
      : null;

    return { weightChange, targetDiff };
  }

  function handleDayPress(date: string): void {
    setSelectedDate(date);
    setWeeklySummary(calcWeeklySummary(date, records, settings.targetWeight));
  }

  function handleEdit(): void {
    setIsEditOpen(true);
  }

  function handleSave(record: DailyRecord): void {
    saveRecord(record);
    if (
      settings.targetWeight !== null &&
      record.weight <= settings.targetWeight
    ) {
      setShowCelebration(true);
    }
    const updatedRecords = getRecords();
    setRecords(updatedRecords);
    // weeklySummaryを再計算
    if (selectedDate !== null) {
      setWeeklySummary(calcWeeklySummary(selectedDate, updatedRecords, settings.targetWeight));
    }
    setIsEditOpen(false);
    // ボトムシートは開いたまま（最新データが反映される）
  }

  function handleCloseSheet(): void {
    setSelectedDate(null);
    setIsEditOpen(false);
    setWeeklySummary(null);
  }

  function handleCloseModal(): void {
    setIsEditOpen(false);
  }

  return (
    <main className="min-h-screen bg-white flex flex-col">
      <Calendar
        records={records}
        onDayPress={handleDayPress}
        themeColor={settings.themeColor}
        showWeightGraph={settings.showWeightGraph}
        showBodyFatGraph={settings.showBodyFatGraph}
        showWeightValue={settings.showWeightValue}
        showBodyFatValue={settings.showBodyFatValue}
        showDiffArrows={settings.showDiffArrows}
        holidays={holidays}
      />
      <BottomSheet
        date={selectedDate}
        record={recordMap.get(selectedDate ?? '')}
        onEdit={handleEdit}
        onClose={handleCloseSheet}
        themeColor={settings.themeColor}
        weeklySummary={weeklySummary}
      />
      <EditModal
        date={selectedDate}
        record={recordMap.get(selectedDate ?? '')}
        records={records}
        isOpen={isEditOpen}
        onSave={handleSave}
        onClose={handleCloseModal}
        themeColor={settings.themeColor}
      />
      <Link
        href="/settings"
        className="fixed bottom-4 right-4 z-50 flex items-center justify-center min-w-[44px] min-h-[44px] bg-white rounded-full shadow-md text-gray-600 text-xl"
        aria-label="設定"
      >
        ⚙
      </Link>
      {showCelebration && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]"
          onClick={() => setShowCelebration(false)}
        >
          <div
            className="bg-white rounded-2xl px-8 py-6 flex flex-col items-center gap-4 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-lg font-semibold text-gray-800">目標達成！おめでとうございます🎉</p>
            <button
              onClick={() => setShowCelebration(false)}
              className="text-gray-400 text-sm"
            >
              × 閉じる
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
