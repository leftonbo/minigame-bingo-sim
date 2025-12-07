/**
 * ボーナスシステム（拡張可能な設計）
 */

import { BonusType, type CellState, FREE_CELL_NUMBER } from './types';

/** ボーナスハンドラーのインターフェース */
export interface BonusHandler {
  /** ボーナスの種類 */
  type: BonusType;
  /** ボーナスを実行し、アクティブ化した数字の配列を返す */
  execute(cells: CellState[]): number[];
}

/**
 * 13が出た時のボーナス：非アクティブなマスから2つをアクティブ化
 */
export class DoubleActivateBonus implements BonusHandler {
  type = BonusType.DOUBLE_ACTIVATE;

  execute(cells: CellState[]): number[] {
    // 非アクティブなマス（フリーマス以外）を取得
    const inactiveCells = cells.filter(
      (cell) => !cell.isActive && !cell.isFree
    );

    if (inactiveCells.length === 0) {
      return [];
    }

    // ランダムに最大2つを選択
    const shuffled = [...inactiveCells].sort(() => Math.random() - 0.5);
    const toActivate = shuffled.slice(0, Math.min(2, shuffled.length));

    // アクティブ化
    const activatedNumbers: number[] = [];
    for (const targetCell of toActivate) {
      const cell = cells.find((c) => c.number === targetCell.number);
      if (cell) {
        cell.isActive = true;
        activatedNumbers.push(cell.number);
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
  registry.register(new DoubleActivateBonus());
  // 将来的に新しいボーナスをここに追加
  // registry.register(new TripleActivateBonus());
  return registry;
}

/**
 * 13が出た時に使用するボーナスタイプ
 */
export function getBonusForNumber(number: number): BonusType | null {
  if (number === FREE_CELL_NUMBER) {
    return BonusType.DOUBLE_ACTIVATE;
  }
  return null;
}
