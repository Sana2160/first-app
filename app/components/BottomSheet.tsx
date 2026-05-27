'use client';

import { useRef, useState } from 'react';
import { DailyRecord, WeeklySummary } from '../types';

type Props = {
  date: string | null;
  record: DailyRecord | undefined;
  onEdit: () => void;
  onClose: () => void;
  themeColor: string;
  weeklySummary: WeeklySummary | null;
};

function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
  const weekday = weekdays[date.getDay()];
  return `${month}月${day}日（${weekday}）`;
}

export default function BottomSheet({ date, record, onEdit, onClose, themeColor, weeklySummary }: Props) {
  const [translateY, setTranslateY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startYRef = useRef<number>(0);

  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>): void {
    startYRef.current = e.clientY;
    setIsDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>): void {
    if (!isDragging) return;
    const delta = e.clientY - startYRef.current;
    setTranslateY(Math.max(0, delta));
  }

  function handlePointerUp(): void {
    setIsDragging(false);
    if (translateY >= 80) {
      onClose();
      setTranslateY(0);
    } else {
      setTranslateY(0);
    }
  }

  const isOpen = date !== null;

  const panelTransform = isOpen
    ? `translateY(${translateY}px)`
    : 'translateY(100%)';

  const panelTransitionClass = isDragging ? 'transition-none' : 'transition-transform duration-300';

  return (
    <>
      {/* オーバーレイ */}
      <div
        className="fixed inset-0 bg-black/40 z-40 transition-opacity duration-300"
        style={{
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? 'auto' : 'none',
        }}
        onClick={onClose}
      />

      {/* パネル */}
      <div
        className={`fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-lg bg-white rounded-t-2xl shadow-xl z-50 ${panelTransitionClass}`}
        style={{
          transform: panelTransform,
          pointerEvents: isOpen ? 'auto' : 'none',
        }}
      >
        {/* ドラッグハンドル */}
        <div
          className="flex justify-center py-4 cursor-grab"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
        >
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>

        {/* コンテンツ */}
        <div className="px-6 pb-[calc(2rem+env(safe-area-inset-bottom))] pt-2">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            {date !== null ? formatDate(date) : ''}
          </h2>

          <div className="space-y-3 mb-6">
            <div className="flex justify-between items-center">
              <span className="text-gray-500">体重</span>
              <span className="text-gray-800 font-medium">
                {record !== undefined ? `${record.weight.toFixed(1)} kg` : '未記録'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500">体脂肪</span>
              <span className="text-gray-800 font-medium">
                {record !== undefined ? `${record.bodyFat.toFixed(1)} %` : '未記録'}
              </span>
            </div>
          </div>

          {weeklySummary !== null && (
            <div className="mb-4">
              <hr className="border-gray-200 mb-4" />
              <p className="text-xs font-medium text-gray-500 mb-2">今週の記録</p>
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">体重増減</span>
                  <span className={`text-sm font-medium ${weeklySummary.weightChange > 0 ? 'text-red-500' : weeklySummary.weightChange < 0 ? 'text-blue-500' : 'text-gray-800'}`}>
                    {weeklySummary.weightChange > 0 ? '+' : ''}{weeklySummary.weightChange.toFixed(1)} kg
                  </span>
                </div>
                {weeklySummary.targetDiff !== null && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">目標まで</span>
                    <span className="text-sm font-medium text-gray-800">
                      {weeklySummary.targetDiff <= 0 ? '達成済み' : `あと ${weeklySummary.targetDiff.toFixed(1)} kg`}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            onPointerDown={(e) => e.stopPropagation()}
            className="w-full text-white py-3 rounded-xl font-medium"
            style={{ backgroundColor: themeColor }}
          >
            編集
          </button>
        </div>
      </div>
    </>
  );
}
