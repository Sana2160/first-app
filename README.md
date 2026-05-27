# 体重ログ — 仕様書

## 1. アプリ概要・コンセプト

**アプリ名**: 体重ログ

**目的**: 体重・体脂肪率を日々記録し、カレンダー形式で推移を把握できる個人向け健康管理アプリ。

**主な機能**:
- カレンダー上での体重・体脂肪率の日次記録
- グラフオーバーレイによる推移の視覚化（カレンダー内折れ線グラフ）
- 前日比の増減矢印表示
- 土曜日タップ時の週次サマリー（週間増減 + 目標まで残り kg）
- 目標体重設定と達成時のポップアップ祝福
- 日本の祝日カラー表示（オンラインフェッチ + localStorage キャッシュ）
- テーマカラー変更（6色）
- 月別・年別の統計グラフ

---

## 2. 技術スタック

### dependencies

| パッケージ | バージョン |
|---|---|
| next | 16.2.6 |
| react | 19.2.4 |
| react-dom | 19.2.4 |

### devDependencies

| パッケージ | バージョン |
|---|---|
| typescript | ^5 |
| tailwindcss | ^4 |
| @tailwindcss/postcss | ^4 |
| @types/node | ^20 |
| @types/react | ^19 |
| @types/react-dom | ^19 |
| eslint | ^9 |
| eslint-config-next | 16.2.6 |

---

## 3. 画面構成と遷移図

```
ホーム (/)
  ├── カレンダー表示（体重・体脂肪グラフ、前日比矢印）
  ├── 日付タップ → BottomSheet（当日の記録表示 + 週次サマリー）
  │     └── 「編集」ボタン → EditModal（体重・体脂肪率の入力・保存）
  │           └── 保存時に体重 ≤ 目標体重 → 目標達成ポップアップ
  └── 右下の ⚙ ボタン → 設定画面

設定画面 (/settings)
  ├── テーマカラー変更（6色）
  ├── 表示設定トグル（5項目）
  ├── 目標体重の設定（錠前ロック / 長押し解除）
  └── 「統計グラフを見る」ボタン → 統計画面
       ← 「戻る」リンク → ホーム

統計画面 (/stats)
  ├── 月別棒グラフ（MonthlyChart）
  ├── 年別棒グラフ（YearlyChart）
  └── ← 「ホームに戻る」リンク → ホーム
```

---

## 4. 全コンポーネントの役割と Props

### `Calendar`

**ファイル**: `app/components/Calendar.tsx`

**役割**: カレンダー本体。42 セル固定グリッドで月の全日付を表示し、体重・体脂肪グラフをオーバーレイ描画する。月移動ボタン、曜日ヘッダー、祝日カラー表示、前日比矢印も担当する。

```ts
type Props = {
  records: DailyRecord[];         // 全記録データ
  onDayPress: (date: string) => void; // セルタップ時のコールバック（YYYY-MM-DD）
  themeColor: string;             // テーマカラー（hex）
  showWeightGraph: boolean;       // 体重グラフ表示フラグ
  showBodyFatGraph: boolean;      // 体脂肪グラフ表示フラグ
  showWeightValue: boolean;       // セル内の体重数値表示フラグ
  showBodyFatValue: boolean;      // セル内の体脂肪数値表示フラグ
  showDiffArrows: boolean;        // 前日比矢印表示フラグ
  holidays: Holidays;             // 祝日マップ（Record<string, string>）
};
```

---

### `BottomSheet`

**ファイル**: `app/components/BottomSheet.tsx`

**役割**: 日付セルタップ時に画面下部からスライドアップするパネル。選択日の体重・体脂肪率を表示し、土曜日の場合は週次サマリーも表示する。ドラッグ操作による閉じるジェスチャーに対応する。

```ts
type Props = {
  date: string | null;           // 選択中の日付（null のとき非表示）
  record: DailyRecord | undefined; // 選択日の記録（未記録時は undefined）
  onEdit: () => void;            // 「編集」ボタン押下時のコールバック
  onClose: () => void;           // シート閉じる時のコールバック
  themeColor: string;            // テーマカラー（hex）
  weeklySummary: WeeklySummary | null; // 週次サマリー（土曜以外は null）
};
```

---

### `EditModal`

**ファイル**: `app/components/EditModal.tsx`

**役割**: 体重・体脂肪率を入力して保存するモーダル。新規記録時は `findPrevRecord` で直近の過去データを初期値として補完する。入力バリデーション後に `onSave` を呼び出す。

```ts
type Props = {
  date: string | null;           // 編集対象の日付
  record: DailyRecord | undefined; // 既存記録（新規時は undefined）
  records: DailyRecord[];        // 全記録（初期値補完に使用）
  isOpen: boolean;               // モーダル表示フラグ
  onSave: (record: DailyRecord) => void; // 保存時のコールバック
  onClose: () => void;           // キャンセル時のコールバック
  themeColor: string;            // テーマカラー（hex）
};
```

---

### `WeightGraph`（Calendar 内部コンポーネント）

**ファイル**: `app/components/Calendar.tsx`（非エクスポート）

**役割**: カレンダーグリッドに重ねて表示する SVG 折れ線グラフ。全 42 セル分の記録データを週ごとに分割し、当月・前後月でストロークの opacity を変えて描画する。

```ts
type WeightGraphProps = {
  cells: CalendarCell[];         // カレンダー全セル（42件）
  recordMap: Map<string, DailyRecord>; // 日付文字列 → 記録のマップ
  themeColor: string;            // ストローク色（テーマカラー）
};
```

---

### `BodyFatGraph`（Calendar 内部コンポーネント）

**ファイル**: `app/components/Calendar.tsx`（非エクスポート）

**役割**: WeightGraph と同構造の体脂肪率用 SVG 折れ線グラフ。ストローク色は固定値 `#F59E0B`。`bodyFat === 0` のセルはプロット対象外とする。

```ts
type BodyFatGraphProps = {
  cells: CalendarCell[];         // カレンダー全セル（42件）
  recordMap: Map<string, DailyRecord>; // 日付文字列 → 記録のマップ
};
```

---

### `MonthlyChart`（stats 内部コンポーネント）

**ファイル**: `app/stats/page.tsx`（非エクスポート）

**役割**: 指定月の日別体重・体脂肪率を棒グラフで表示する SVG コンポーネント。横幅は `日数 × 20px` で自動計算し、横スクロール対応。

```ts
type MonthlyChartProps = {
  records: DailyRecord[];        // 全記録データ
  themeColor: string;            // 体重バーの色
  targetYear: number;            // 表示対象の年
  targetMonth: number;           // 表示対象の月（0始まり）
  onPrevMonth: () => void;       // 前月ボタンのコールバック
  onNextMonth: () => void;       // 翌月ボタンのコールバック
};
```

---

### `YearlyChart`（stats 内部コンポーネント）

**ファイル**: `app/stats/page.tsx`（非エクスポート）

**役割**: 指定年の月別平均体重・体脂肪率を棒グラフで表示する SVG コンポーネント。固定 `viewBox="0 0 240 120"`（12ヶ月 × 20px）。

```ts
type YearlyChartProps = {
  records: DailyRecord[];        // 全記録データ
  themeColor: string;            // 体重バーの色
  targetYear: number;            // 表示対象の年
  onPrevYear: () => void;        // 前年ボタンのコールバック
  onNextYear: () => void;        // 翌年ボタンのコールバック
};
```

---

## 5. localStorage のキーと保存データ構造

### `weight-records` → `DailyRecord[]`

```ts
type DailyRecord = {
  date: string;    // "YYYY-MM-DD" 形式
  weight: number;  // kg
  bodyFat: number; // %（未入力は 0）
};
```

- `saveRecord(record)` で upsert（同一 date の既存レコードを上書き、なければ追加）
- `deleteRecord(date)` で該当日の記録を削除
- ランタイムバリデーション: `isDailyRecord` 関数で `date: string`, `weight: number`, `bodyFat: number` の型チェックを行い、不正なデータは除外する

---

### `app-settings` → `AppSettings`

```ts
type AppSettings = {
  themeColor: string;          // テーマカラー（hex）
  showWeightGraph: boolean;    // 体重グラフ表示
  showBodyFatGraph: boolean;   // 体脂肪グラフ表示
  showWeightValue: boolean;    // セル内体重数値表示
  showBodyFatValue: boolean;   // セル内体脂肪数値表示
  showDiffArrows: boolean;     // 前日比矢印表示
  targetWeight: number | null; // 目標体重（未設定は null）
};
```

**デフォルト値**:
```ts
{
  themeColor: '#4DD0C4',
  showWeightGraph: true,
  showBodyFatGraph: false,
  showWeightValue: true,
  showBodyFatValue: false,
  showDiffArrows: true,
  targetWeight: null,
}
```

---

### `holidays` → `Record<string, string>`

```ts
type Holidays = Record<string, string>;
// キー: "YYYY-MM-DD"
// 値: 祝日名（例: "元日"）
```

- オンライン時に `https://holidays-jp.github.io/api/v1/date.json` からフェッチし、バリデーション後に保存
- オフライン時は localStorage のキャッシュを使用
- 起動時に `getHolidaysFromStorage()` でキャッシュを読み込み、その後フェッチ結果で上書きする

---

## 6. 各機能の詳細仕様

### カレンダー表示（42セル固定・月移動）

- `buildCalendarCells(year, month)` が 42 セルの配列を生成する
- 月の 1 日が何曜日かに応じて、先頭を前月末日で埋める
- 当月の全日付を配置後、42 セルになるまで翌月の日付で埋める
- 前後月のセルは `isCurrentMonth: false` フラグを持ち、文字色を `text-gray-300` で薄く表示する
- カレンダーヘッダーの `<` / `>` ボタンで `currentMonth` state を 1 ヶ月ずつ移動する

---

### 日付タップ → BottomSheet 表示

- カレンダーの日付セルをタップすると `onDayPress(dateStr)` が呼ばれ、`selectedDate` state に日付文字列がセットされる
- `selectedDate !== null` のとき BottomSheet が表示状態（`translateY(0px)`）になる
- `selectedDate === null` のとき BottomSheet は画面外（`translateY(100%)`）に退避する

---

### 体重・体脂肪の記録編集（バリデーション）

EditModal の `handleSave()` 内でバリデーションを実施する。

| 項目 | 条件 |
|---|---|
| 体重 | `parseFloat` で数値変換可能かつ `0 < weight <= 300` |
| 体脂肪率 | `parseFloat` で数値変換可能かつ `0 <= bodyFat <= 100` |

チェックは 2 段階で行い、最初に `isNaN` で非数値を弾き、次に範囲チェックを行う。いずれかに該当する場合は保存処理を中断する（エラーメッセージ表示なし）。

---

### EditModal の初期値補完（`findPrevRecord`）

```ts
function findPrevRecord(date: string, records: DailyRecord[]): DailyRecord | undefined {
  return records
    .filter((r) => r.date < date)
    .sort((a, b) => b.date.localeCompare(a.date))[0];
}
```

- 新規記録時（`record === undefined`）に呼び出す
- 選択日より過去の記録を降順ソートし、最も日付が近いものを初期値として使用する
- 過去の記録が存在しない場合は空文字（入力欄が空）になる
- `useEffect` の依存配列は `[date, record]`（`records` は含まない）のため、補完値の再計算は選択日または記録の変更時のみ行われる

---

### BottomSheet のドラッグ操作

- ドラッグハンドル（灰色バー）に `onPointerDown` / `onPointerMove` / `onPointerUp` を設定
- `pointerCapture` でハンドル外へのドラッグも追跡する
- 下方向のみ追従（`Math.max(0, delta)` で上方向移動を防止）
- `translateY >= 80px` の状態でポインターを離すと `onClose()` を呼び出してシートを閉じる
- `translateY < 80px` の場合は元の位置（`translateY: 0`）に戻す
- ドラッグ中は `transition-none`、静止時は `transition-transform duration-300` を適用する

---

### 前日比矢印表示（SVG 三角形）

- 当日の記録と前日の記録が両方存在する場合に `weightDiff` を算出する
- `weightDiff !== 0` かつ `showDiffArrows === true` のとき、セル左下に 16×16px の SVG を絶対配置する
- 増加（`weightDiff > 0`）: 上向き三角形 `polygon points="8,2 14,13 2,13"` を `#EF4444` で描画
- 減少（`weightDiff < 0`）: 下向き三角形 `polygon points="8,14 14,3 2,3"` を `#3B82F6` で描画

---

### WeeklySummary（土曜タップ時のみ）

`calcWeeklySummary(date, allRecords, targetWeight)` で計算する。

- 選択日の曜日が土曜（`getDay() === 6`）でない場合は `null` を返す
- 当週の日曜日〜土曜日の記録を抽出し、日付順にソートする
- `weightChange`: 週内の最初の記録と最後の記録の体重差（2件以上の記録がある場合のみ、それ以外は 0）
- `targetDiff`: `最後の記録の体重 - 目標体重`（目標未設定または記録なしは `null`）
- BottomSheet で `targetDiff <= 0` のとき「達成済み」と表示する

---

### 目標達成ポップアップ

- EditModal で保存した体重が目標体重以下（`record.weight <= settings.targetWeight`）のとき `showCelebration` を `true` にする
- 全画面オーバーレイ（`z-[60]`）に「目標達成！おめでとうございます」のダイアログを表示する
- オーバーレイクリックまたは「× 閉じる」ボタンで `showCelebration` を `false` に戻す

---

### 祝日データ取得

```
https://holidays-jp.github.io/api/v1/date.json
```

- `useEffect` 内で `navigator.onLine` を確認し、オンライン時のみフェッチする
- フェッチ結果をバリデーション（`string: string` の形のオブジェクトであること）したうえで `saveHolidays()` で localStorage に保存する
- 起動時に `getHolidaysFromStorage()` でキャッシュを先読みし、フェッチ完了後に state を上書きする
- フェッチ失敗時は `catch` で無視し、キャッシュのデータをそのまま使用する

---

### 祝日カラー表示

| 条件 | テキスト色 | 背景色 |
|---|---|---|
| 日曜日 または 祝日（今日以外、土曜除く） | `text-red-500`（`#EF4444`） | `bg-red-500/10` |
| 土曜日（今日以外） | `text-blue-500`（`#3B82F6`） | `bg-blue-500/10` |
| 土曜日 + 祝日 | 土曜（青）優先 | 土曜（青）優先 |
| 今日 | テーマカラー太字 | `${themeColor}33`（20% 不透明度） |

```ts
const isRed = !isToday && !isSaturday && (isSunday || isHoliday);  // 土曜は青優先のため除外
const isBlue = !isToday && isSaturday;  // 土曜は祝日でも青
```

---

### 設定画面の目標体重ロック

- デフォルトは `isLocked: true`（入力欄は `readOnly`）
- 錠前アイコン（`🔒`）を 3000ms 長押し（`onPointerDown` + `setTimeout`）で解除する
- 長押し中は SVG プログレスリングが `3000ms linear` のアニメーション（`@keyframes lock-ring`）で進む
  - 外径: `r=12`、外周: `2π×12 ≈ 75.4px`（`CIRCLE_C`）
  - `strokeDashoffset` を `CIRCLE_C → 0` に変化させてプログレスを表現する
  - 色はテーマカラーを使用
- 途中でポインターを離すと `clearTimeout` でキャンセルされ `isHolding: false` に戻る
- ロック解除後は `🔓` アイコンに変わり、「保存」ボタンが表示される
- 「保存」ボタン押下で `targetWeight` を更新し `isLocked: true` に戻す

---

### 統計グラフ

**MonthlyChart（月別棒グラフ）**:
- 対象月の全日数分の横幅（`日数 × 20px`）を持つ SVG を生成する
- 体重バー: 幅 6px、x 位置 `(day - 1) * 20 + 2`、色 = テーマカラー
- 体脂肪バー: 幅 6px、x 位置 `(day - 1) * 20 + 10`、色 = `#F59E0B`
- バー高さはそれぞれ月内の最大値で正規化（描画領域 100px）。`viewBox` 高さは 120px で、バーは 0〜100 の範囲内に収まる
- `< / >` ボタンで月移動（月末を超えたとき年もインクリメント/デクリメント）

**YearlyChart（年別棒グラフ）**:
- `calcYearlyStats` で月別の平均体重・平均体脂肪率を算出する
- 固定 `viewBox="0 0 240 120"` に 12 ヶ月分の棒グラフを描画する
- バー配置: 体重 x = `i * 20 + 2`、体脂肪 x = `i * 20 + 10`
- `< / >` ボタンで年移動

---

### テーマカラー変更（6色）

設定画面でカラーサークルを選択するとテーマカラーが即座に変わり、localStorage に保存される。選択中の色には `ring-2 ring-offset-2 ring-gray-400` のリングが付く。

---

### 表示設定トグル（5項目）

| ラベル | フィールド |
|---|---|
| 体重の表示 | `showWeightValue` |
| 体脂肪の表示 | `showBodyFatValue` |
| 体重グラフの表示 | `showWeightGraph` |
| 体脂肪グラフの表示 | `showBodyFatGraph` |
| 前日比矢印の表示 | `showDiffArrows` |

トグルスイッチ ON 時の背景色はテーマカラー、OFF 時は `#D1D5DB`。

---

## 7. デザイントークン

### テーマカラー（`lib/theme.ts` の `THEME_COLORS`）

| ラベル | hex |
|---|---|
| デフォルト | `#4DD0C4` |
| インディゴ | `#6366F1` |
| アンバー | `#F59E0B` |
| エメラルド | `#10B981` |
| ピンク | `#EC4899` |
| スレート | `#64748B` |

### 固定色

| 用途 | hex |
|---|---|
| 体脂肪グラフ（棒・折れ線） | `#F59E0B` |
| 増加矢印（前日比） | `#EF4444` |
| 減少矢印（前日比） | `#3B82F6` |

### 曜日・祝日カラー

| 条件 | テキスト | 背景 |
|---|---|---|
| 日曜日・祝日 | `#EF4444`（`text-red-500`） | `bg-red-500/10` |
| 土曜日 | `#3B82F6`（`text-blue-500`） | `bg-blue-500/10` |

### フォント

- Geist Sans（`--font-geist-sans`）
- Geist Mono（`--font-geist-mono`）

### セル高さ

- モバイル: `min-h-[56px]`
- sm ブレークポイント以上: `min-h-[64px]`

---

## 8. コーディングルール

### any 禁止

`any` 型の使用を禁止する。localStorage から読み出した値は `unknown` で受け取り、型ガード関数でバリデーションしてから使用する。

```ts
// 良い例
const parsed: unknown = JSON.parse(raw);
if (!Array.isArray(parsed)) return [];
return (parsed as unknown[]).filter(isDailyRecord);
```

### 可読性重視・シンプル優先・過剰抽象化を避ける

- ロジックを不必要に汎用化しない
- 短い処理を無理にカスタムフックに切り出さない
- コメントは「なぜ（WHY）」が非自明な場合のみ記載する（「何を（WHAT）」のコメントは不要）

### Tailwind 動的クラス問題

Tailwind は静的解析でクラスを収集するため、動的な文字列結合によるクラス生成は JIT が認識できない。

```tsx
// NG: Tailwind が認識しない
<div className={`bg-[${color}]`} />

// OK: インラインスタイルを使用する
<div style={{ backgroundColor: color }} />
```

### Hydration エラー対策

`localStorage` はブラウザ環境にのみ存在するため、サーバーサイドレンダリング時に参照するとエラーになる。必ず `useEffect` 内で読み込む。

```tsx
// NG: レンダリング中に localStorage を読む
const [records, setRecords] = useState(getRecords());

// OK: useEffect 内で読み込む
const [records, setRecords] = useState<DailyRecord[]>([]);
useEffect(() => {
  setRecords(getRecords());
}, []);
```

`storage.ts` の各関数は `typeof window === 'undefined'` チェックでサーバーサイドから呼ばれた場合も安全に空値を返す。
