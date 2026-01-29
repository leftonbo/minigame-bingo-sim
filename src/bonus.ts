/**
 * ボーナスシステム（拡張可能な設計）
 */

import { BonusType, type CellState, FREE_CELL_NUMBER } from './types';

/** ボーナスハンドラーのインターフェース */
export interface BonusHandler {
  /** ボーナスの種類 */
  type: BonusType;
  /** ボーナスを実行し、アクティブ化した数字の配列を返す */
  execute(cells: CellState[], context: BonusContext): number[];
}

/**
 * ボーナス実行に必要なコンテキスト
 */
export interface BonusContext {
  /** 基準となる数字（上下左右系で使用） */
  baseNumber?: number;
}

const GRID_SIZE = 5;

const shuffle = <T>(items: T[]): T[] =>
  [...items].sort(() => Math.random() - 0.5);

const activateCell = (cell: CellState | undefined): number | null => {
  if (!cell || cell.isActive) {
    return null;
  }
  cell.isActive = true;
  return cell.number;
};

const getBaseIndex = (baseNumber?: number): number | null => {
  if (!baseNumber) {
    return null;
  }
  const index = baseNumber - 1;
  if (index < 0 || index >= GRID_SIZE * GRID_SIZE) {
    return null;
  }
  return index;
};

const getRowCol = (index: number): { row: number; col: number } => ({
  row: index % GRID_SIZE,
  col: Math.floor(index / GRID_SIZE),
});

/**
 * ランダムで X 個埋める
 */
export class ActivateRandomBonusBase implements BonusHandler {
  type: BonusType;
  count: number;

  constructor(type: BonusType, count: number) {
    this.type = type;
    this.count = count;
  }

  execute(cells: CellState[], _context: BonusContext): number[] {
    const pickableCells = cells.filter(
      (cell) => !cell.isFree
    );
    const picked = shuffle(pickableCells).slice(0, Math.min(this.count, pickableCells.length));
    const activatedNumbers: number[] = [];
    for (const cell of picked) {
      const activated = activateCell(cell);
      if (activated !== null) {
        activatedNumbers.push(activated);
      }
    }
    return activatedNumbers;
  }
}

/**
 * ランダムで1個埋める
 */
export class ActivateRandomOneBonus extends ActivateRandomBonusBase {
  constructor() {
    super(BonusType.ACTIVATE_RANDOM_ONE, 1);
  }
}

/**
 * ランダムで2個埋める
 */
export class ActivateRandomTwoBonus extends ActivateRandomBonusBase {
  constructor() {
    super(BonusType.ACTIVATE_RANDOM_TWO, 2);
  }
}

/**
 * ランダムで4個埋める
 */
export class ActivateRandomFourBonus extends ActivateRandomBonusBase {
  constructor() {
    super(BonusType.ACTIVATE_RANDOM_FOUR, 4);
  }
}

/**
 * ランダムで8個埋める
 */
export class ActivateRandomEightBonus extends ActivateRandomBonusBase {
  constructor() {
    super(BonusType.ACTIVATE_RANDOM_EIGHT, 8);
  }
}

/**
 * 上下マス埋める
 */
export class ActivateVerticalBonus implements BonusHandler {
  type = BonusType.ACTIVATE_VERTICAL;

  execute(cells: CellState[], context: BonusContext): number[] {
    const baseIndex = getBaseIndex(context.baseNumber);
    if (baseIndex === null) {
      return [];
    }
    const { row } = getRowCol(baseIndex);
    const targets: number[] = [];
    if (row > 0) {
      targets.push(baseIndex - 1);
    }
    if (row < GRID_SIZE - 1) {
      targets.push(baseIndex + 1);
    }
    const activatedNumbers: number[] = [];
    for (const index of targets) {
      const activated = activateCell(cells[index]);
      if (activated !== null) {
        activatedNumbers.push(activated);
      }
    }
    return activatedNumbers;
  }
}

/**
 * 左右マス埋める
 */
export class ActivateHorizontalBonus implements BonusHandler {
  type = BonusType.ACTIVATE_HORIZONTAL;

  execute(cells: CellState[], context: BonusContext): number[] {
    const baseIndex = getBaseIndex(context.baseNumber);
    if (baseIndex === null) {
      return [];
    }
    const { col } = getRowCol(baseIndex);
    const targets: number[] = [];
    if (col > 0) {
      targets.push(baseIndex - GRID_SIZE);
    }
    if (col < GRID_SIZE - 1) {
      targets.push(baseIndex + GRID_SIZE);
    }
    const activatedNumbers: number[] = [];
    for (const index of targets) {
      const activated = activateCell(cells[index]);
      if (activated !== null) {
        activatedNumbers.push(activated);
      }
    }
    return activatedNumbers;
  }
}

/**
 * 上下左右マス埋める
 */
export class ActivateCrossBonus implements BonusHandler {
  type = BonusType.ACTIVATE_CROSS;

  execute(cells: CellState[], context: BonusContext): number[] {
    const baseIndex = getBaseIndex(context.baseNumber);
    if (baseIndex === null) {
      return [];
    }
    const { row, col } = getRowCol(baseIndex);
    const targets: number[] = [];
    if (row > 0) {
      targets.push(baseIndex - 1);
    }
    if (row < GRID_SIZE - 1) {
      targets.push(baseIndex + 1);
    }
    if (col > 0) {
      targets.push(baseIndex - GRID_SIZE);
    }
    if (col < GRID_SIZE - 1) {
      targets.push(baseIndex + GRID_SIZE);
    }
    const activatedNumbers: number[] = [];
    for (const index of targets) {
      const activated = activateCell(cells[index]);
      if (activated !== null) {
        activatedNumbers.push(activated);
      }
    }
    return activatedNumbers;
  }
}

/**
 * X字（斜め隣4マス）を埋める
 */
export class ActivateXDiagonalBonus implements BonusHandler {
  type = BonusType.ACTIVATE_X_DIAGONAL;

  execute(cells: CellState[], context: BonusContext): number[] {
    const baseIndex = getBaseIndex(context.baseNumber);
    if (baseIndex === null) {
      return [];
    }
    const { row, col } = getRowCol(baseIndex);
    const targets: number[] = [];
    if (row > 0 && col > 0) {
      targets.push(baseIndex - GRID_SIZE - 1);
    }
    if (row < GRID_SIZE - 1 && col > 0) {
      targets.push(baseIndex - GRID_SIZE + 1);
    }
    if (row > 0 && col < GRID_SIZE - 1) {
      targets.push(baseIndex + GRID_SIZE - 1);
    }
    if (row < GRID_SIZE - 1 && col < GRID_SIZE - 1) {
      targets.push(baseIndex + GRID_SIZE + 1);
    }
    const activatedNumbers: number[] = [];
    for (const index of targets) {
      const activated = activateCell(cells[index]);
      if (activated !== null) {
        activatedNumbers.push(activated);
      }
    }
    return activatedNumbers;
  }
}

/**
 * 周囲 8 マスを埋める
 */
export class ActivateBoxBonus implements BonusHandler {
  type = BonusType.ACTIVATE_BOX;
  
  execute(cells: CellState[], context: BonusContext): number[] {
    const baseIndex = getBaseIndex(context.baseNumber);
    if (baseIndex === null) {
      return [];
    }
    const targets: number[] = [];
    for (let i = -1; i <= 1; i++) {
      for (let j = -1; j <= 1; j++) {
        if (i === 0 && j === 0) {
          continue;
        }
        targets.push(baseIndex + i * GRID_SIZE + j);
      }
    }
    const activatedNumbers: number[] = [];
    for (const index of targets) {
      const activated = activateCell(cells[index]);
      if (activated !== null) {
        activatedNumbers.push(activated);
      }
    }
    return activatedNumbers;
  }
}

/**
 * 縦一列を埋める
 */
export class ActivateColumnLineBonus implements BonusHandler {
  type = BonusType.ACTIVATE_COLUMN_LINE;

  execute(cells: CellState[], context: BonusContext): number[] {
    const baseIndex = getBaseIndex(context.baseNumber);
    if (baseIndex === null) {
      return [];
    }
    const { col } = getRowCol(baseIndex);
    const targets: number[] = [];
    for (let row = 0; row < GRID_SIZE; row++) {
      targets.push(col * GRID_SIZE + row);
    }
    const activatedNumbers: number[] = [];
    for (const index of targets) {
      const activated = activateCell(cells[index]);
      if (activated !== null) {
        activatedNumbers.push(activated);
      }
    }
    return activatedNumbers;
  }
}

/**
 * 横一列を埋める
 */
export class ActivateRowLineBonus implements BonusHandler {
  type = BonusType.ACTIVATE_ROW_LINE;

  execute(cells: CellState[], context: BonusContext): number[] {
    const baseIndex = getBaseIndex(context.baseNumber);
    if (baseIndex === null) {
      return [];
    }
    const { row } = getRowCol(baseIndex);
    const targets: number[] = [];
    for (let col = 0; col < GRID_SIZE; col++) {
      targets.push(col * GRID_SIZE + row);
    }
    const activatedNumbers: number[] = [];
    for (const index of targets) {
      const activated = activateCell(cells[index]);
      if (activated !== null) {
        activatedNumbers.push(activated);
      }
    }
    return activatedNumbers;
  }
}

/**
 * ボーナスレジストリ
 * 新しいボーナスを追加するときはここに登録する
 */
export class BonusRegistry {
  private handlers: Map<BonusType, BonusHandler> = new Map();

  register(handler: BonusHandler): void {
    this.handlers.set(handler.type, handler);
  }

  get(type: BonusType): BonusHandler | undefined {
    return this.handlers.get(type);
  }

  getAll(): BonusHandler[] {
    return Array.from(this.handlers.values());
  }
}

/**
 * デフォルトのボーナスレジストリを作成
 */
export function createDefaultBonusRegistry(): BonusRegistry {
  const registry = new BonusRegistry();
  registry.register(new ActivateRandomOneBonus());
  registry.register(new ActivateRandomTwoBonus());
  registry.register(new ActivateRandomFourBonus());
  registry.register(new ActivateRandomEightBonus());
  registry.register(new ActivateBoxBonus());
  registry.register(new ActivateVerticalBonus());
  registry.register(new ActivateHorizontalBonus());
  registry.register(new ActivateCrossBonus());
  registry.register(new ActivateXDiagonalBonus());
  registry.register(new ActivateColumnLineBonus());
  registry.register(new ActivateRowLineBonus());
  return registry;
}

/**
 * 13が出た時にボーナス予約するか
 */
export function isBonusTriggerNumber(number: number): boolean {
  return number === FREE_CELL_NUMBER;
}
