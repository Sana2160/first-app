export type DailyRecord = {
  date: string;    // "YYYY-MM-DD" 形式
  weight: number;  // kg
  bodyFat: number; // %
};

export type AppSettings = {
  themeColor: string;
  showWeightGraph: boolean;
  showBodyFatGraph: boolean;
  showWeightValue: boolean;
  showBodyFatValue: boolean;
  showDiffArrows: boolean;
  targetWeight: number | null;
};

export type WeeklySummary = {
  weightChange: number;
  targetDiff: number | null;
};

export type Holidays = Record<string, string>;
