'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { getSettings, saveSettings } from '../lib/storage';
import { THEME_COLORS } from '../lib/theme';
import { AppSettings } from '../types';

const LOCK_HOLD_MS = 3000;
const CIRCLE_R = 12;
const CIRCLE_C = 2 * Math.PI * CIRCLE_R;

export default function SettingsPage() {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [isLocked, setIsLocked] = useState(true);
  const [isHolding, setIsHolding] = useState(false);
  const [tempWeight, setTempWeight] = useState('');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const settingsRef = useRef<AppSettings | null>(null);

  useEffect(() => {
    setSettings(getSettings());
    return () => {
      if (timerRef.current !== null) clearTimeout(timerRef.current);
    };
  }, []);

  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  function handleColorSelect(color: string): void {
    if (settings === null) return;
    const next: AppSettings = { ...settings, themeColor: color };
    saveSettings(next);
    setSettings(next);
  }

  function handleToggle(field: keyof Omit<AppSettings, 'themeColor' | 'targetWeight'>): void {
    if (settings === null) return;
    const next: AppSettings = { ...settings, [field]: !settings[field] };
    saveSettings(next);
    setSettings(next);
  }

  function handleLockDown(): void {
    if (!isLocked || isHolding || settings === null) return;
    setIsHolding(true);
    timerRef.current = setTimeout(() => {
      const s = settingsRef.current;
      setIsLocked(false);
      setIsHolding(false);
      setTempWeight(s?.targetWeight !== null && s?.targetWeight !== undefined ? String(s.targetWeight) : '');
    }, LOCK_HOLD_MS);
  }

  function handleLockRelease(): void {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setIsHolding(false);
  }

  function handleSaveTargetWeight(): void {
    if (settings === null) return;
    const parsed = parseFloat(tempWeight);
    const targetWeight = tempWeight === '' ? null : (Number.isNaN(parsed) || parsed <= 0 ? null : parsed);
    const next: AppSettings = { ...settings, targetWeight };
    saveSettings(next);
    setSettings(next);
    setIsLocked(true);
  }

  type ToggleItem = {
    label: string;
    field: keyof Omit<AppSettings, 'themeColor' | 'targetWeight'>;
  };

  const toggleItems: ToggleItem[] = [
    { label: '体重の表示', field: 'showWeightValue' },
    { label: '体脂肪の表示', field: 'showBodyFatValue' },
    { label: '体重グラフの表示', field: 'showWeightGraph' },
    { label: '体脂肪グラフの表示', field: 'showBodyFatGraph' },
    { label: '前日比矢印の表示', field: 'showDiffArrows' },
  ];

  return (
    <main className="min-h-screen bg-white px-4 py-6">
      <style>{`@keyframes lock-ring { from { stroke-dashoffset: ${CIRCLE_C}; } to { stroke-dashoffset: 0; } }`}</style>
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

      <section className="mt-8">
        <h2 className="text-sm font-medium text-gray-600 mb-3">目標体重</h2>
        {settings !== null && (
          <div className="flex items-center gap-3 flex-wrap">
            <input
              type="number"
              step="0.1"
              min="0.1"
              max="300"
              readOnly={isLocked}
              value={isLocked ? (settings.targetWeight ?? '') : tempWeight}
              onChange={isLocked ? undefined : (e) => setTempWeight(e.target.value)}
              placeholder="例: 65.0"
              className={`w-32 border rounded-lg px-3 py-2 text-sm focus:outline-none ${
                isLocked
                  ? 'border-gray-200 bg-gray-50 text-gray-400'
                  : 'border-gray-300 text-gray-800 focus:ring-2 focus:ring-gray-300'
              }`}
            />
            <span className="text-sm text-gray-500">kg</span>

            <button
              onPointerDown={handleLockDown}
              onPointerUp={handleLockRelease}
              onPointerLeave={handleLockRelease}
              onPointerCancel={handleLockRelease}
              className="relative flex items-center justify-center w-9 h-9"
              style={{ touchAction: 'none', userSelect: 'none' }}
              aria-label={isLocked ? '3秒長押しでロック解除' : 'ロック解除中'}
            >
              <svg width="36" height="36" viewBox="0 0 36 36" className="absolute inset-0 pointer-events-none">
                <circle cx="18" cy="18" r={CIRCLE_R} fill="none" stroke="#E5E7EB" strokeWidth="2.5" />
                {isHolding && (
                  <circle
                    cx="18" cy="18" r={CIRCLE_R}
                    fill="none"
                    stroke={settings.themeColor}
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeDasharray={CIRCLE_C}
                    strokeDashoffset={CIRCLE_C}
                    style={{
                      transformOrigin: '18px 18px',
                      transform: 'rotate(-90deg)',
                      animation: `lock-ring ${LOCK_HOLD_MS}ms linear forwards`,
                    }}
                  />
                )}
              </svg>
              <span className="text-base z-10 pointer-events-none" style={{ userSelect: 'none' }}>
                {isLocked ? '🔒' : '🔓'}
              </span>
            </button>

            {!isLocked && (
              <button
                onClick={handleSaveTargetWeight}
                className="text-sm px-3 py-1.5 rounded-lg text-white font-medium"
                style={{ backgroundColor: settings.themeColor }}
              >
                保存
              </button>
            )}
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
