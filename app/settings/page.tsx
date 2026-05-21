'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getSettings, saveSettings } from '../lib/storage';
import { THEME_COLORS } from '../lib/theme';
import { AppSettings } from '../types';

export default function SettingsPage() {
  const [settings, setSettings] = useState<AppSettings | null>(null);

  useEffect(() => {
    setSettings(getSettings());
  }, []);

  function handleColorSelect(color: string): void {
    if (settings === null) return;
    const next: AppSettings = { ...settings, themeColor: color };
    saveSettings(next);
    setSettings(next);
  }

  function handleToggle(field: keyof Omit<AppSettings, 'themeColor'>): void {
    if (settings === null) return;
    const next: AppSettings = { ...settings, [field]: !settings[field] };
    saveSettings(next);
    setSettings(next);
  }

  type ToggleItem = {
    label: string;
    field: keyof Omit<AppSettings, 'themeColor'>;
  };

  const toggleItems: ToggleItem[] = [
    { label: '体重グラフの表示', field: 'showWeightGraph' },
    { label: '体脂肪グラフの表示', field: 'showBodyFatGraph' },
    { label: 'カレンダー上の入力数値の表示', field: 'showInputValues' },
    { label: '前日比矢印の表示', field: 'showDiffArrows' },
  ];

  return (
    <main className="min-h-screen bg-white px-4 py-6">
      <Link href="/" className="text-sm text-gray-500 flex items-center gap-1 mb-6">
        ← 戻る
      </Link>
      <h1 className="text-xl font-semibold text-gray-800 mb-6">設定</h1>

      <section className="mb-8">
        <h2 className="text-sm font-medium text-gray-600 mb-3">テーマカラー</h2>
        {settings !== null && (
          <div className="flex gap-3 flex-wrap">
            {THEME_COLORS.map((tc) => (
              <button
                key={tc.value}
                aria-label={tc.label}
                onClick={() => handleColorSelect(tc.value)}
                className={`w-10 h-10 rounded-full border-2 ${
                  settings.themeColor === tc.value
                    ? 'ring-2 ring-offset-2 ring-gray-400 border-white'
                    : 'border-transparent'
                }`}
                style={{ backgroundColor: tc.value }}
              />
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-sm font-medium text-gray-600 mb-3">表示設定</h2>
        {settings !== null && (
          <div className="flex flex-col gap-4">
            {toggleItems.map(({ label, field }) => {
              const value = settings[field];
              return (
                <div key={field} className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">{label}</span>
                  <button
                    role="switch"
                    aria-checked={value}
                    onClick={() => handleToggle(field)}
                    className="relative w-12 h-6 rounded-full transition-colors duration-200 focus:outline-none"
                    style={{ backgroundColor: value ? settings.themeColor : '#D1D5DB' }}
                  >
                    <span
                      className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200"
                      style={{ transform: value ? 'translateX(24px)' : 'translateX(0px)' }}
                    />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <Link
        href="/stats"
        className="block text-sm text-center py-2 px-4 rounded-lg mt-4"
        style={{ backgroundColor: settings?.themeColor ?? '#4DD0C4', color: 'white' }}
      >
        統計グラフを見る
      </Link>
    </main>
  );
}
