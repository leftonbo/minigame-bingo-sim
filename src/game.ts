/**
 * ビンゴゲームのメインロジック
 */

import type {
  BingoCard,
  DrawResult,
  DrawStatistics,
} from './types';
import {
  ALL_LINES,
  FREE_CELL_NUMBER,
  BonusType,
} from './types';
import { createDefaultBonusRegistry, getBonusForNumber, BonusRegistry } from './bonus';
import { StatisticsManager } from './statistics';

export class BingoGame {
  private card: BingoCard;
  private bonusRegistry: BonusRegistry;
  private statisticsManager: StatisticsManager;
  private lastResult: DrawResult | null = null;

  constructor() {
    this.card = this.createInitialCard();
    this.bonusRegistry = createDefaultBonusRegistry();
    this.statisticsManager = new StatisticsManager();
  }

  /** 初期カードを作成 */
  private createInitialCard(): BingoCard {
    const card: BingoCard = [];
    for (let i = 0; i < 25; i++) {
      const number = i + 1;
      card.push({
        number,
        isActive: number === FREE_CELL_NUMBER, // 13のみ初期アクティブ
        isFree: number === FREE_CELL_NUMBER,
        isReach: false,
        isLine: false,
      });
    }
    return card;
  }

  /** カードと統計をリセット */
  reset(): void {
    this.card = this.createInitialCard();
    this.statisticsManager.reset();
    this.lastResult = null;
    this.updateReachStatus();
  }

  /** カードを取得 */
  getCard(): BingoCard {
    return [...this.card];
  }

  /** 統計マネージャーを取得 */
  getStatistics(): StatisticsManager {
    return this.statisticsManager;
  }

  /** 最新の抽選結果を取得 */
  getLastResult(): DrawResult | null {
    return this.lastResult;
  }

  /** 1回の抽選を実行 */
  draw(): DrawResult {
    // 前回ライン成立したマスを非アクティブに戻す（フリーマス以外）
    this.resetLineStatus();

    // 1～25からランダムに抽選
    const drawnNumber = Math.floor(Math.random() * 25) + 1;

    let isHit = false;
    let activatedNumbers: number[] = [];
    let bonusTriggered = false;
    let bonusType: BonusType | undefined;

    // ボーナスチェック
    const bonus = getBonusForNumber(drawnNumber);
    if (bonus) {
      const handler = this.bonusRegistry.get(bonus);
      if (handler) {
        activatedNumbers = handler.execute(this.card);
        bonusTriggered = true;
        bonusType = bonus;
        isHit = activatedNumbers.length > 0;
      }
    } else {
      // 通常抽選
      const cell = this.card.find((c) => c.number === drawnNumber);
      if (cell && !cell.isActive) {
        cell.isActive = true;
        activatedNumbers = [drawnNumber];
        isHit = true;
      }
    }

    // ライン判定
    const { linesCompleted, lineNumbers } = this.checkLines();

    // スコア計算
    const score = linesCompleted;

    // アクティブマス数をカウント
    const activeCount = this.card.filter((c) => c.isActive).length;

    // リーチ状態を更新
    this.updateReachStatus();

    // 結果を作成
    const result: DrawResult = {
      drawnNumber,
      isHit,
      activatedNumbers,
      bonusTriggered,
      bonusType,
      linesCompleted,
      lineNumbers,
      score,
      activeCount,
    };

    this.lastResult = result;

    // 統計を記録
    const drawStats: DrawStatistics = {
      isHit,
      isWin: score > 0,
      score,
      activeCount,
    };
    this.statisticsManager.record(drawStats);

    return result;
  }

  /** 複数回抽選を実行 */
  drawMultiple(count: number): DrawResult[] {
    const results: DrawResult[] = [];
    for (let i = 0; i < count; i++) {
      results.push(this.draw());
    }
    return results;
  }

  /** 前回ライン成立したマスを非アクティブに戻す */
  private resetLineStatus(): void {
    for (const cell of this.card) {
      if (cell.isLine && !cell.isFree) {
        cell.isActive = false;
      }
      cell.isLine = false;
    }
  }

  /** ライン成立をチェック */
  private checkLines(): { linesCompleted: number; lineNumbers: number[] } {
    const lineNumbersSet = new Set<number>();
    let linesCompleted = 0;

    for (const line of ALL_LINES) {
      const isLineComplete = line.every((idx) => this.card[idx].isActive);
      if (isLineComplete) {
        linesCompleted++;
        for (const idx of line) {
          this.card[idx].isLine = true;
          lineNumbersSet.add(this.card[idx].number);
        }
      }
    }

    return {
      linesCompleted,
      lineNumbers: Array.from(lineNumbersSet).sort((a, b) => a - b),
    };
  }

  /** リーチ状態を更新 */
  private updateReachStatus(): void {
    // まずリセット
    for (const cell of this.card) {
      cell.isReach = false;
    }

    // 各ラインをチェック
    for (const line of ALL_LINES) {
      const activeCells = line.filter((idx) => this.card[idx].isActive);
      const inactiveCells = line.filter((idx) => !this.card[idx].isActive);

      // アクティブが4つで非アクティブが1つの場合、リーチ
      if (activeCells.length === 4 && inactiveCells.length === 1) {
        // ライン全体をリーチとしてマーク
        for (const idx of line) {
          this.card[idx].isReach = true;
        }
      }
    }
  }
}
