'use client';

import { useEffect, useState } from 'react';
import { DailyRecord } from '../types';

type Props = {
  date: string | null;
  record: DailyRecord | undefined;
  records: DailyRecord[];
  isOpen: boolean;
  onSave: (record: DailyRecord) => void;
  onClose: () => void;
  themeColor: string;
};

// 選択日より過去の記録の中で最も日付が近いものを返す
function findPrevRecord(date: string, records: DailyRecord[]): DailyRecord | undefined {
  return records
    .filter((r) => r.date < date)
    .sort((a, b) => b.date.localeCompare(a.date))[0];
}

function formatTitle(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  return `${year}年${month}月${day}日の記録`;
}

export default function EditModal({ date, record, records, isOpen, onSave, onClose, themeColor }: Props) {
  const [weight, setWeight] = useState<string>(
    record !== undefined ? String(record.weight) : ''
  );
  const [bodyFat, setBodyFat] = useState<string>(
    record !== undefined ? String(record.bodyFat) : ''
  );

  useEffect(() => {
    if (record !== undefined) {
      setWeight(String(record.weight));
      setBodyFat(String(record.bodyFat));
    } else {
      const prev = findPrevRecord(date ?? '', records);
      setWeight(prev !== undefined ? String(prev.weight) : '');
      setBodyFat(prev !== undefined ? String(prev.bodyFat) : '');
    }
  }, [date, record]);

  function handleSave(): void {
    if (date === null) return;

    const parsedWeight = parseFloat(weight);
    const parsedBodyFat = parseFloat(bodyFat);

    if (isNaN(parsedWeight) || isNaN(parsedBodyFat)) return;
    if (parsedWeight <= 0 || parsedWeight > 300) return;
    if (parsedBodyFat < 0 || parsedBodyFat > 100) return;

    onSave({ date, weight: parsedWeight, bodyFat: parsedBodyFat });
  }

  const isVisible = isOpen && date !== null;

  return (
    <>
      {/* オーバーレイ */}
      <div
        className="fixed inset-0 bg-black/40 z-[60] transition-opacity duration-300"
        style={{
          opacity: isVisible ? 1 : 0,
          pointerEvents: isVisible ? 'auto' : 'none',
        }}
        onClick={onClose}
      />

      {/* モーダル */}
      <div
        className="fixed inset-0 z-[70] flex items-center justify-center px-4"
        style={{ pointerEvents: 'none' }}
      >
        <div
          className="bg-white rounded-2xl shadow-xl w-[90%] md:w-full md:max-w-sm p-6 relative transition-all duration-300"
          style={{
            transform: isVisible ? 'scale(1)' : 'scale(0.95)',
            opacity: isVisible ? 1 : 0,
            pointerEvents: isVisible ? 'auto' : 'none',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* 閉じるボタン */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-xl leading-none"
            aria-label="閉じる"
          >
            ×
          </button>

          {/* タイトル */}
          <h2 className="text-base font-semibold text-gray-800 mb-5 pr-6">
            {date !== null ? formatTitle(date) : ''}
          </h2>

          {/* 入力欄 */}
          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm text-gray-500 mb-1">体重 (kg)</label>
              <input
                type="number"
                step="0.1"
                placeholder="0.0"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-gray-800 text-base focus:outline-none focus:border-gray-400"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-500 mb-1">体脂肪率 (%)</label>
              <input
                type="number"
                step="0.1"
                placeholder="0.0"
                value={bodyFat}
                onChange={(e) => setBodyFat(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-gray-800 text-base focus:outline-none focus:border-gray-400"
              />
            </div>
          </div>

          {/* 保存ボタン */}
          <button
            onClick={handleSave}
            className="w-full text-white py-3 rounded-xl font-medium"
            style={{ backgroundColor: themeColor }}
          >
            保存
          </button>
        </div>
      </div>
    </>
  );
}
