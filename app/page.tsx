'use client';

import { useState } from 'react';
import { getRecords, saveRecord } from './lib/storage';
import { DailyRecord } from './types';
import Calendar from './components/Calendar';
import BottomSheet from './components/BottomSheet';
import EditModal from './components/EditModal';

export default function Home() {
  const [records, setRecords] = useState<DailyRecord[]>(() => getRecords());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);

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
      <Calendar records={records} onDayPress={handleDayPress} />
      <BottomSheet
        date={selectedDate}
        record={recordMap.get(selectedDate ?? '')}
        onEdit={handleEdit}
        onClose={handleCloseSheet}
      />
      <EditModal
        date={selectedDate}
        record={recordMap.get(selectedDate ?? '')}
        records={records}
        isOpen={isEditOpen}
        onSave={handleSave}
        onClose={handleCloseModal}
      />
    </main>
  );
}
