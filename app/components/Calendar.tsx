"use client";

import React, { useState, useEffect } from "react";
import { DailyRecord, Holidays } from "../types";

type Props = {
  records: DailyRecord[];
  onDayPress: (date: string) => void;
  themeColor: string;
  showWeightGraph: boolean;
  showBodyFatGraph: boolean;
  showWeightValue: boolean;
  showBodyFatValue: boolean;
  showDiffArrows: boolean;
  holidays: Holidays;
};

type CalendarCell = {
  date: Date;
  isCurrentMonth: boolean;
};

function toDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function getPrevDateString(dateStr: string): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() - 1);
  return toDateString(d);
}

function buildCalendarCells(year: number, month: number): CalendarCell[] {
  const firstDay = new Date(year, month, 1);
  const startDayOfWeek = firstDay.getDay(); // 0=日

  const cells: CalendarCell[] = [];

  // 前月末の日付で先頭を埋める
  const prevMonthLastDay = new Date(year, month, 0).getDate();
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    cells.push({
      date: new Date(year, month - 1, prevMonthLastDay - i),
      isCurrentMonth: false,
    });
  }

  // 当月の全日付
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({
      date: new Date(year, month, d),
      isCurrentMonth: true,
    });
  }

  // 次月頭で 42 セルに揃える
  let nextDay = 1;
  while (cells.length < 42) {
    cells.push({
      date: new Date(year, month + 1, nextDay),
      isCurrentMonth: false,
    });
    nextDay++;
  }

  return cells;
}

type WeightGraphProps = {
  cells: CalendarCell[];
  recordMap: Map<string, DailyRecord>;
  themeColor: string;
};

function WeightGraph({
  cells,
  recordMap,
  themeColor,
}: WeightGraphProps): React.ReactElement | null {
  type Dot = { x: number; y: number; col: number; row: number; isCurrentMonth: boolean };

  // min/max は全セル（前後月含む）の記録値で計算する
  const weights: number[] = [];
  for (let cellIndex = 0; cellIndex < cells.length; cellIndex++) {
    const dateStr = toDateString(cells[cellIndex].date);
    const record = recordMap.get(dateStr);
    if (record !== undefined) weights.push(record.weight);
  }

  if (weights.length === 0) return null;

  const minWeight = Math.min(...weights);
  const maxWeight = Math.max(...weights);

  // 全セルを対象に座標を収集し、isCurrentMonth フラグも保持する
  const dots: Dot[] = [];
  for (let cellIndex = 0; cellIndex < cells.length; cellIndex++) {
    const cell = cells[cellIndex];
    const dateStr = toDateString(cell.date);
    const record = recordMap.get(dateStr);
    if (record === undefined) continue;

    const col = cellIndex % 7;
    const row = Math.floor(cellIndex / 7);
    const cx = (col + 0.5) * 100;
    const baseCenterY = (row + 0.5) * 56;

    const normalizedY =
      minWeight === maxWeight
        ? baseCenterY
        : baseCenterY +
          16 -
          ((record.weight - minWeight) / (maxWeight - minWeight)) * 32;

    dots.push({ x: cx, y: normalizedY, col, row, isCurrentMonth: cell.isCurrentMonth });
  }

  // dots を週ごとのグループに分割（col が前の点以下になったら週をまたいだと判断）
  type WeekDot = { x: number; y: number; isCurrentMonth: boolean };
  const weekGroups: WeekDot[][] = [];
  let currentWeek: WeekDot[] = [];

  for (let i = 0; i < dots.length; i++) {
    if (i > 0 && dots[i].row !== dots[i - 1].row) {
      weekGroups.push(currentWeek);
      currentWeek = [];
    }
    currentWeek.push({ x: dots[i].x, y: dots[i].y, isCurrentMonth: dots[i].isCurrentMonth });
  }
  if (currentWeek.length > 0) weekGroups.push(currentWeek);

  return (
    <svg
      viewBox="0 0 700 336"
      className="absolute inset-0 w-full h-full pointer-events-none"
      preserveAspectRatio="none"
    >
      {weekGroups.map((week, wi) => {
        // 週内を isCurrentMonth が変わる境界でセグメントに分割する
        const segments: { points: WeekDot[]; isCurrentMonth: boolean }[] = [];
        let seg: WeekDot[] = [];
        let segCurrent = week[0]?.isCurrentMonth ?? true;
        for (const dot of week) {
          if (dot.isCurrentMonth !== segCurrent) {
            if (seg.length > 0) segments.push({ points: seg, isCurrentMonth: segCurrent });
            seg = [];
            segCurrent = dot.isCurrentMonth;
          }
          seg.push(dot);
        }
        if (seg.length > 0) segments.push({ points: seg, isCurrentMonth: segCurrent });

        return segments.map((segment, si) => (
          <polyline
            key={`${wi}-${si}`}
            points={segment.points.map((d) => `${d.x},${d.y}`).join(" ")}
            fill="none"
            stroke={themeColor}
            strokeWidth="2"
            opacity={segment.isCurrentMonth ? 0.6 : 0.3}
          />
        ));
      })}
      {dots.map((dot, i) => (
        <circle
          key={i}
          cx={dot.x}
          cy={dot.y}
          r="3"
          fill={themeColor}
          opacity={dot.isCurrentMonth ? 0.8 : 0.3}
        />
      ))}
    </svg>
  );
}

type BodyFatGraphProps = {
  cells: CalendarCell[];
  recordMap: Map<string, DailyRecord>;
};

function BodyFatGraph({ cells, recordMap }: BodyFatGraphProps): React.ReactElement | null {
  type Dot = { x: number; y: number; col: number; row: number; isCurrentMonth: boolean };
  const BODY_FAT_COLOR = '#F59E0B';

  const dots: Dot[] = [];
  const bodyFats: number[] = [];

  for (let cellIndex = 0; cellIndex < cells.length; cellIndex++) {
    const cell = cells[cellIndex];
    const dateStr = toDateString(cell.date);
    const record = recordMap.get(dateStr);
    if (record === undefined || record.bodyFat === 0) continue;
    bodyFats.push(record.bodyFat);
  }

  if (bodyFats.length === 0) return null;

  const minBodyFat = Math.min(...bodyFats);
  const maxBodyFat = Math.max(...bodyFats);

  for (let cellIndex = 0; cellIndex < cells.length; cellIndex++) {
    const cell = cells[cellIndex];
    const dateStr = toDateString(cell.date);
    const record = recordMap.get(dateStr);
    if (record === undefined || record.bodyFat === 0) continue;

    const col = cellIndex % 7;
    const row = Math.floor(cellIndex / 7);
    const cx = (col + 0.5) * 100;
    const baseCenterY = (row + 0.5) * 56;

    const normalizedY =
      minBodyFat === maxBodyFat
        ? baseCenterY
        : baseCenterY + 16 - ((record.bodyFat - minBodyFat) / (maxBodyFat - minBodyFat)) * 32;

    dots.push({ x: cx, y: normalizedY, col, row, isCurrentMonth: cell.isCurrentMonth });
  }

  type WeekDot = { x: number; y: number; isCurrentMonth: boolean };
  const weekGroups: WeekDot[][] = [];
  let currentWeek: WeekDot[] = [];

  for (let i = 0; i < dots.length; i++) {
    if (i > 0 && dots[i].row !== dots[i - 1].row) {
      weekGroups.push(currentWeek);
      currentWeek = [];
    }
    currentWeek.push({ x: dots[i].x, y: dots[i].y, isCurrentMonth: dots[i].isCurrentMonth });
  }
  if (currentWeek.length > 0) weekGroups.push(currentWeek);

  return (
    <svg
      viewBox="0 0 700 336"
      className="absolute inset-0 w-full h-full pointer-events-none"
      preserveAspectRatio="none"
    >
      {weekGroups.map((week, wi) => {
        const segments: { points: WeekDot[]; isCurrentMonth: boolean }[] = [];
        let seg: WeekDot[] = [];
        let segCurrent = week[0]?.isCurrentMonth ?? true;
        for (const dot of week) {
          if (dot.isCurrentMonth !== segCurrent) {
            if (seg.length > 0) segments.push({ points: seg, isCurrentMonth: segCurrent });
            seg = [];
            segCurrent = dot.isCurrentMonth;
          }
          seg.push(dot);
        }
        if (seg.length > 0) segments.push({ points: seg, isCurrentMonth: segCurrent });

        return segments.map((segment, si) => (
          <polyline
            key={`${wi}-${si}`}
            points={segment.points.map((d) => `${d.x},${d.y}`).join(' ')}
            fill="none"
            stroke={BODY_FAT_COLOR}
            strokeWidth="2"
            opacity={segment.isCurrentMonth ? 0.6 : 0.3}
          />
        ));
      })}
      {dots.map((dot, i) => (
        <circle key={i} cx={dot.x} cy={dot.y} r="3" fill={BODY_FAT_COLOR} opacity={dot.isCurrentMonth ? 0.8 : 0.3} />
      ))}
    </svg>
  );
}

const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];

export default function Calendar({ records, onDayPress, themeColor, showWeightGraph, showBodyFatGraph, showWeightValue, showBodyFatValue, showDiffArrows, holidays }: Props) {
  const [currentMonth, setCurrentMonth] = useState<Date | null>(null);
  const [todayString, setTodayString] = useState<string>('');

  useEffect(() => {
    const today = new Date();
    setCurrentMonth(new Date(today.getFullYear(), today.getMonth(), 1));
    setTodayString(toDateString(today));
  }, []);

  if (currentMonth === null) return null;

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const cells = buildCalendarCells(year, month);

  const recordMap = new Map<string, DailyRecord>();
  for (const r of records) {
    recordMap.set(r.date, r);
  }

  function goToPrevMonth() {
    setCurrentMonth(new Date(year, month - 1, 1));
  }

  function goToNextMonth() {
    setCurrentMonth(new Date(year, month + 1, 1));
  }

  return (
    <div className="w-full">
      {/* ヘッダー */}
      <div
        className="flex items-center justify-between px-4 py-3 relative z-50"
        style={{ backgroundColor: themeColor }}
      >
        <button
          onClick={goToPrevMonth}
          className="text-white text-xl font-bold p-3 min-w-[44px] min-h-[44px] flex items-center justify-center"
          aria-label="前の月"
        >
          {"<"}
        </button>
        <span className="text-white font-semibold text-lg">
          {year}年{month + 1}月
        </span>
        <button
          onClick={goToNextMonth}
          className="text-white text-xl font-bold p-3 min-w-[44px] min-h-[44px] flex items-center justify-center"
          aria-label="次の月"
        >
          {">"}
        </button>
      </div>

      {/* 曜日行 */}
      <div
        className="grid grid-cols-7"
        style={{ backgroundColor: `${themeColor}1A` }}
      >
        {WEEKDAYS.map((day, dayIndex) => {
          const headerTextColor =
            dayIndex === 0 ? 'text-red-500' :
            dayIndex === 6 ? 'text-blue-500' :
            'text-gray-600';
          return (
            <div
              key={day}
              className={`text-center text-xs font-medium py-2 ${headerTextColor}`}
            >
              {day}
            </div>
          );
        })}
      </div>

      {/* 日付グリッド */}
      <div className="relative grid grid-cols-7">
        {showWeightGraph && <WeightGraph cells={cells} recordMap={recordMap} themeColor={themeColor} />}
        {showBodyFatGraph && <BodyFatGraph cells={cells} recordMap={recordMap} />}
        {cells.map((cell, index) => {
          const dateStr = toDateString(cell.date);
          const record = recordMap.get(dateStr);
          const prevRecord = recordMap.get(getPrevDateString(dateStr));
          const weightDiff: number | null =
            record !== undefined && prevRecord !== undefined
              ? record.weight - prevRecord.weight
              : null;
          const isToday = dateStr === todayString;
          const dayOfWeek = index % 7; // 0=日, 6=土
          const isHoliday = dateStr in holidays;
          const isSunday = dayOfWeek === 0;
          const isSaturday = dayOfWeek === 6;
          const isRed = !isToday && !isSaturday && (isSunday || isHoliday);
          const isBlue = !isToday && isSaturday;

          return (
            <button
              key={dateStr}
              onClick={() => onDayPress(dateStr)}
              className={[
                "relative z-10 flex flex-col items-center justify-between py-1 px-0.5 min-h-[56px] sm:min-h-[64px] border-b border-r border-gray-100",
                cell.isCurrentMonth ? "text-gray-800" : "text-gray-300",
                isRed ? 'text-red-500' : '',
                isBlue ? 'text-blue-500' : '',
                isRed ? 'bg-red-500/10' : '',
                isBlue ? 'bg-blue-500/10' : '',
              ]
                .filter(Boolean)
                .join(" ")}
              style={isToday ? { backgroundColor: `${themeColor}33` } : undefined}
            >
              <span
                className="text-sm"
                style={isToday ? { fontWeight: 'bold', color: themeColor } : undefined}
              >
                {cell.date.getDate()}
              </span>
              <div className="flex flex-col items-center w-full mt-auto">
                {record !== undefined && showWeightValue && (
                  <span className="text-[10px] text-gray-500 leading-tight">
                    {record.weight.toFixed(1)} kg
                  </span>
                )}
                {record !== undefined && showBodyFatValue && record.bodyFat > 0 && (
                  <span className="text-[10px] text-gray-400 leading-tight">
                    {record.bodyFat.toFixed(1)} %
                  </span>
                )}
              </div>
              {weightDiff !== null && weightDiff !== 0 && showDiffArrows && (
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  className="absolute bottom-0 left-0 pointer-events-none"
    aria-hidden="true"
                >
                  {weightDiff > 0 ? (
                    <polygon points="8,2 14,13 2,13" fill="#EF4444" />
                  ) : (
                    <polygon points="8,14 14,3 2,3" fill="#3B82F6" />
                  )}
                </svg>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
