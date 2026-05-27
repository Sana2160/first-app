'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getRecords, getSettings } from '../lib/storage';
import { DailyRecord } from '../types';

type MonthStats = { avgWeight: number | null; avgBodyFat: number | null };

function calcYearlyStats(records: DailyRecord[], year: number): MonthStats[] {
  return Array.from({ length: 12 }, (_, i) => {
    const monthRecords = records.filter((r) => {
      const [y, m] = r.date.split('-').map(Number);
      return y === year && m === i + 1;
    });
    if (monthRecords.length === 0) return { avgWeight: null, avgBodyFat: null };
    const avgWeight =
      monthRecords.reduce((s, r) => s + r.weight, 0) / monthRecords.length;
    const bodyFatRecords = monthRecords.filter((r) => r.bodyFat > 0);
    const avgBodyFat =
      bodyFatRecords.length > 0
        ? bodyFatRecords.reduce((s, r) => s + r.bodyFat, 0) /
          bodyFatRecords.length
        : null;
    return { avgWeight, avgBodyFat };
  });
}

type MonthlyChartProps = {
  records: DailyRecord[];
  themeColor: string;
  targetYear: number;
  targetMonth: number;
  onPrevMonth: () => void;
  onNextMonth: () => void;
};

function MonthlyChart({
  records,
  themeColor,
  targetYear,
  targetMonth,
  onPrevMonth,
  onNextMonth,
}: MonthlyChartProps) {
  const monthlyRecords = records.filter((r) => {
    const [y, m] = r.date.split('-').map(Number);
    return y === targetYear && m === targetMonth + 1;
  });
  const daysInMonth = new Date(targetYear, targetMonth + 1, 0).getDate();
  const svgWidth = daysInMonth * 20;
  const svgHeight = 100;

  const maxWeight = Math.max(
    0,
    ...monthlyRecords.map((r) => r.weight),
  );
  const maxBodyFat = Math.max(
    0,
    ...monthlyRecords.filter((r) => r.bodyFat > 0).map((r) => r.bodyFat),
  );

  const monthLabel = `${targetYear}年${targetMonth + 1}月`;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={onPrevMonth}
          className="px-3 py-1 text-sm text-gray-600 bg-gray-100 rounded-lg"
        >
          ＜
        </button>
        <span className="text-sm font-medium text-gray-700">{monthLabel}</span>
        <button
          onClick={onNextMonth}
          className="px-3 py-1 text-sm text-gray-600 bg-gray-100 rounded-lg"
        >
          ＞
        </button>
      </div>

      {maxWeight === 0 ? (
        <p className="text-sm text-gray-400 text-center py-8">記録がありません</p>
      ) : (
        <div className="overflow-x-auto">
          <svg
            viewBox={`0 0 ${svgWidth} 120`}
            width={svgWidth}
            height={120}
            className="block"
          >
            {Array.from({ length: daysInMonth }, (_, i) => {
              const day = i + 1;
              const dateStr = `${targetYear}-${String(targetMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const record = monthlyRecords.find((r) => r.date === dateStr);
              if (record === undefined) return null;

              const weightBarHeight = (record.weight / maxWeight) * svgHeight;
              const weightX = (day - 1) * 20 + 2;
              const weightY = svgHeight - weightBarHeight;

              const bodyFatBar =
                record.bodyFat > 0 && maxBodyFat > 0 ? (
                  <rect
                    key={`bf-${day}`}
                    x={(day - 1) * 20 + 10}
                    y={svgHeight - (record.bodyFat / maxBodyFat) * svgHeight}
                    width={6}
                    height={(record.bodyFat / maxBodyFat) * svgHeight}
                    fill="#F59E0B"
                  />
                ) : null;

              return (
                <g key={day}>
                  <rect
                    x={weightX}
                    y={weightY}
                    width={6}
                    height={weightBarHeight}
                    fill={themeColor}
                  />
                  {bodyFatBar}
                </g>
              );
            })}
          </svg>
        </div>
      )}

      <div className="flex gap-4 mt-3">
        <div className="flex items-center gap-1">
          <span
            className="inline-block w-3 h-3 rounded-sm"
            style={{ backgroundColor: themeColor }}
          />
          <span className="text-xs text-gray-500">体重</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded-sm bg-amber-400" />
          <span className="text-xs text-gray-500">体脂肪</span>
        </div>
      </div>
    </div>
  );
}

type YearlyChartProps = {
  records: DailyRecord[];
  themeColor: string;
  targetYear: number;
  onPrevYear: () => void;
  onNextYear: () => void;
};

function YearlyChart({
  records,
  themeColor,
  targetYear,
  onPrevYear,
  onNextYear,
}: YearlyChartProps) {
  const monthStats = calcYearlyStats(records, targetYear);
  const svgHeight = 100;

  const validWeights = monthStats
    .map((s) => s.avgWeight)
    .filter((w): w is number => w !== null);
  const validBodyFats = monthStats
    .map((s) => s.avgBodyFat)
    .filter((bf): bf is number => bf !== null);

  const maxWeight = Math.max(0, ...validWeights);
  const maxBodyFat = Math.max(0, ...validBodyFats);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={onPrevYear}
          className="px-3 py-1 text-sm text-gray-600 bg-gray-100 rounded-lg"
        >
          ＜
        </button>
        <span className="text-sm font-medium text-gray-700">{targetYear}年</span>
        <button
          onClick={onNextYear}
          className="px-3 py-1 text-sm text-gray-600 bg-gray-100 rounded-lg"
        >
          ＞
        </button>
      </div>

      {maxWeight === 0 ? (
        <p className="text-sm text-gray-400 text-center py-8">記録がありません</p>
      ) : (
        <div className="overflow-x-auto">
          <svg viewBox="0 0 240 120" width={240} height={120} className="block">
            {monthStats.map((stat, i) => {
              if (stat.avgWeight === null) return null;

              const weightBarHeight = (stat.avgWeight / maxWeight) * svgHeight;
              const weightX = i * 20 + 2;
              const weightY = svgHeight - weightBarHeight;

              const bodyFatBar =
                stat.avgBodyFat !== null && maxBodyFat > 0 ? (
                  <rect
                    key={`bf-${i}`}
                    x={i * 20 + 10}
                    y={svgHeight - (stat.avgBodyFat / maxBodyFat) * svgHeight}
                    width={6}
                    height={(stat.avgBodyFat / maxBodyFat) * svgHeight}
                    fill="#F59E0B"
                  />
                ) : null;

              return (
                <g key={i}>
                  <rect
                    x={weightX}
                    y={weightY}
                    width={6}
                    height={weightBarHeight}
                    fill={themeColor}
                  />
                  {bodyFatBar}
                </g>
              );
            })}
          </svg>
        </div>
      )}

      <div className="flex gap-4 mt-3">
        <div className="flex items-center gap-1">
          <span
            className="inline-block w-3 h-3 rounded-sm"
            style={{ backgroundColor: themeColor }}
          />
          <span className="text-xs text-gray-500">体重（月平均）</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded-sm bg-amber-400" />
          <span className="text-xs text-gray-500">体脂肪（月平均）</span>
        </div>
      </div>
    </div>
  );
}

export default function StatsPage() {
  const [records, setRecords] = useState<DailyRecord[]>([]);
  const [themeColor, setThemeColor] = useState<string>('#4DD0C4');
  const [tab, setTab] = useState<'monthly' | 'yearly'>('monthly');
  const [targetYear, setTargetYear] = useState<number>(0);
  const [targetMonth, setTargetMonth] = useState<number>(0);

  useEffect(() => {
    setRecords(getRecords());
    setThemeColor(getSettings().themeColor);
    const today = new Date();
    setTargetYear(today.getFullYear());
    setTargetMonth(today.getMonth());
  }, []);

  function goToPrevMonth(): void {
    if (targetMonth === 0) {
      setTargetYear((y) => y - 1);
      setTargetMonth(11);
    } else {
      setTargetMonth((m) => m - 1);
    }
  }

  function goToNextMonth(): void {
    if (targetMonth === 11) {
      setTargetYear((y) => y + 1);
      setTargetMonth(0);
    } else {
      setTargetMonth((m) => m + 1);
    }
  }

  function goToPrevYear(): void {
    setTargetYear((y) => y - 1);
  }

  function goToNextYear(): void {
    setTargetYear((y) => y + 1);
  }

  return (
    <main className="min-h-screen bg-white px-4 py-6">
      <Link href="/" className="text-sm text-gray-500 flex items-center gap-1 mb-6">
        ← ホームに戻る
      </Link>
      <h1 className="text-xl font-semibold text-gray-800 mb-4">統計グラフ</h1>

      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setTab('monthly')}
          className="px-4 py-2 rounded-full text-sm font-medium"
          style={{
            backgroundColor: tab === 'monthly' ? themeColor : '#F3F4F6',
            color: tab === 'monthly' ? 'white' : '#6B7280',
          }}
        >
          月別
        </button>
        <button
          onClick={() => setTab('yearly')}
          className="px-4 py-2 rounded-full text-sm font-medium"
          style={{
            backgroundColor: tab === 'yearly' ? themeColor : '#F3F4F6',
            color: tab === 'yearly' ? 'white' : '#6B7280',
          }}
        >
          年別
        </button>
      </div>

      {tab === 'monthly' ? (
        <MonthlyChart
          records={records}
          themeColor={themeColor}
          targetYear={targetYear}
          targetMonth={targetMonth}
          onPrevMonth={goToPrevMonth}
          onNextMonth={goToNextMonth}
        />
      ) : (
        <YearlyChart
          records={records}
          themeColor={themeColor}
          targetYear={targetYear}
          onPrevYear={goToPrevYear}
          onNextYear={goToNextYear}
        />
      )}
    </main>
  );
}
