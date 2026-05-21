'use client';

import { useState } from 'react';
import Link from 'next/link';
import { getRecords, saveRecord, getSettings } from './lib/storage';
import { DailyRecord, AppSettings } from './types';
import Calendar from './components/Calendar';
import BottomSheet from './components/BottomSheet';
import EditModal from './components/EditModal';

export default function Home() {
  const [records, setRecords] = useState<DailyRecord[]>(() => getRecords());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [settings] = useState<AppSettings>(() => getSettings());

  const recordMap = new Map<string, DailyRecord>();
  for (const r of records) { recordMap.set(r.date, r); }

  function handleDayPress(date: string): void {
    setSelectedDate(date);
  }

  function handleEdit(): void {
    setIsEditOpen(true);
  }

  function handleSave(record: DailyRecord): void {
    saveRecord(record);
    setRecords(getRecords());
    setIsEditOpen(false);
    // ボトムシートは開いたまま（最新データが反映される）
  }

  function handleCloseSheet(): void {
    setSelectedDate(null);
    setIsEditOpen(false);
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
        showInputValues={settings.showInputValues}
        showDiffArrows={settings.showDiffArrows}
      />
      <BottomSheet
        date={selectedDate}
        record={recordMap.get(selectedDate ?? '')}
        onEdit={handleEdit}
        onClose={handleCloseSheet}
        themeColor={settings.themeColor}
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
    </main>
  );
}
