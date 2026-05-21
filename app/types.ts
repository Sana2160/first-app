export type DailyRecord = {
  date: string;    // "YYYY-MM-DD" 形式
  weight: number;  // kg
  bodyFat: number; // %
};

export type AppSettings = {
  themeColor: string;
  showWeightGraph: boolean;
  showBodyFatGraph: boolean;
  showInputValues: boolean;
  showDiffArrows: boolean;
};
