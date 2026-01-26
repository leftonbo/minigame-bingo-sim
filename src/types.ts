/**
 * ビンゴゲームの型定義
 */

/** マスの状態 */
export interface CellState {
  /** マスの数字 (1-25) */
  number: number;
  /** アクティブかどうか */
  isActive: boolean;
  /** フリーマス (13) かどうか */
  isFree: boolean;
  /** リーチ状態（あと1マスでライン成立）のラインに含まれるか */
  isReach: boolean;
  /** 前回の抽選でライン成立したマスか */
  isLine: boolean;
}

/** ビンゴカード (5x5) */
export type BingoCard = CellState[];

/** ボーナスの種類 */
export const BonusType = {
  /** 未解放マスをランダムで1個アクティブ化 */
  UNLOCK_RANDOM_ONE: 'UNLOCK_RANDOM_ONE',
  /** ランダムで3個アクティブ化（ハズレあり） */
  RANDOM_THREE_WITH_MISS: 'RANDOM_THREE_WITH_MISS',
  /** 上下マスをアクティブ化 */
  ACTIVATE_VERTICAL: 'ACTIVATE_VERTICAL',
  /** 左右マスをアクティブ化 */
  ACTIVATE_HORIZONTAL: 'ACTIVATE_HORIZONTAL',
  /** 上下左右マスをアクティブ化 */
  ACTIVATE_CROSS: 'ACTIVATE_CROSS',
} as const;

export type BonusType = typeof BonusType[keyof typeof BonusType];

/** ボーナス表示名（短い日本語） */
export const BONUS_TYPE_LABELS: Record<BonusType, string> = {
  [BonusType.UNLOCK_RANDOM_ONE]: 'ランダム1',
  [BonusType.RANDOM_THREE_WITH_MISS]: 'ランダム3',
  [BonusType.ACTIVATE_VERTICAL]: '上下',
  [BonusType.ACTIVATE_HORIZONTAL]: '左右',
  [BonusType.ACTIVATE_CROSS]: '十字',
} as const;

export const getBonusTypeLabel = (type: BonusType): string =>
  BONUS_TYPE_LABELS[type];

/** 抽選結果 */
export interface DrawResult {
  /** 抽選された数字 */
  drawnNumber: number;
  /** ヒットしたか（1個でもアクティブ化したか） */
  isHit: boolean;
  /** アクティブ化したマスの数字 */
  activatedNumbers: number[];
  /** ボーナス発生（次回適用予約）したか */
  bonusQueued: boolean;
  /** 予約済みボーナスを適用したか */
  bonusApplied: boolean;
  /** ボーナスの種類（適用された場合） */
  bonusType?: BonusType;
  /** ボーナスの種類（発生した場合） */
  bonusQueuedType?: BonusType;
  /** 成立したラインの数 */
  linesCompleted: number;
  /** 成立したラインに含まれるマスの数字 */
  lineNumbers: number[];
  /** 獲得スコア */
  score: number;
  /** 抽選後のアクティブなマスの数 */
  activeCount: number;
}

/** 1回の抽選の統計 */
export interface DrawStatistics {
  /** ヒットしたか */
  isHit: boolean;
  /** 当たり（スコア獲得）したか */
  isWin: boolean;
  /** 獲得スコア */
  score: number;
  /** 抽選後のアクティブなマスの数 */
  activeCount: number;
}

/** 累計統計 */
export interface TotalStatistics {
  /** 総抽選回数 */
  totalDraws: number;
  /** ヒット数 */
  hitCount: number;
  /** 当たり数 */
  winCount: number;
  /** 総獲得スコア */
  totalScore: number;
  /** スコア分布 (スコア => 回数) */
  scoreDistribution: Map<number, number>;
  /** 抽選後アクティブマス数の合計 */
  totalActiveCount: number;
}

/** ライン定義（マスのインデックス配列） */
export type Line = number[];

/** すべてのライン（縦5 + 横5 + 斜め2 = 12ライン） */
export const ALL_LINES: Line[] = [
  // 縦ライン（左から右）
  [0, 1, 2, 3, 4],     // 1列目
  [5, 6, 7, 8, 9],     // 2列目
  [10, 11, 12, 13, 14], // 3列目
  [15, 16, 17, 18, 19], // 4列目
  [20, 21, 22, 23, 24], // 5列目
  // 横ライン（上から下）
  [0, 5, 10, 15, 20],  // 1行目
  [1, 6, 11, 16, 21],  // 2行目
  [2, 7, 12, 17, 22],  // 3行目
  [3, 8, 13, 18, 23],  // 4行目
  [4, 9, 14, 19, 24],  // 5行目
  // 斜めライン
  [0, 6, 12, 18, 24],  // 左上→右下
  [4, 8, 12, 16, 20],  // 右上→左下
];

/** フリーマスのインデックス（13は0-indexedで12） */
export const FREE_CELL_INDEX = 12;
export const FREE_CELL_NUMBER = 13;
