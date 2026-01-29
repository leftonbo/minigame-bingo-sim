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
import { createDefaultBonusRegistry, isBonusTriggerNumber, BonusRegistry } from './bonus';
import { StatisticsManager } from './statistics';

export class BingoGame {
  private card: BingoCard;
  private bonusRegistry: BonusRegistry;
  private statisticsManager: StatisticsManager;
  private lastResult: DrawResult | null = null;
  private pendingBonus: boolean = false;
  private pendingBonusType: BonusType | null = null;
  private alwaysBonusMode: 'none' | 'disabled' | 'random' | 'fixed' = 'none';
  private alwaysBonusType: BonusType | null = null;
  private enabledBonusTypes: Set<BonusType> = new Set(Object.values(BonusType));
  private randomizeBoardEachDraw: boolean = false;

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
    this.pendingBonus = false;
    this.pendingBonusType = null;
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

  /** 常時ボーナスの設定 */
  setAlwaysBonusSetting(
    mode: 'none' | 'disabled' | 'random' | 'fixed',
    type: BonusType | null = null
  ): void {
    this.alwaysBonusMode = mode;
    this.alwaysBonusType = mode === 'fixed' ? type : null;
    if (mode !== 'none') {
      this.pendingBonus = false;
      this.pendingBonusType = null;
    }
  }

  /** 抽選ごとに盤面をランダム化するか */
  setRandomizeBoardEachDraw(enabled: boolean): void {
    this.randomizeBoardEachDraw = enabled;
  }

  /** 13ボーナスの有効種別を設定 */
  setEnabledBonusTypes(types: BonusType[]): void {
    this.enabledBonusTypes = new Set(types);
  }

  /** 1回の抽選を実行 */
  draw(): DrawResult {
    if (this.randomizeBoardEachDraw) {
      this.randomizeBoardActiveState();
    } else {
      // 前回ライン成立したマスを非アクティブに戻す（フリーマス以外）
      this.resetLineStatus();
      this.ensureReachBeforeDraw();
    }

    // 1～25からランダムに抽選
    const drawnNumber = Math.floor(Math.random() * 25) + 1;

    let isDrawnHit = false;
    let bonusNumbers: number[] = [];
    let activatedNumbers: number[] = [];
    let bonusQueued = false;
    let bonusApplied = false;
    let bonusType: BonusType | undefined;
    let bonusQueuedType: BonusType | undefined;

    const getEnabledHandlers = () =>
      this.bonusRegistry.getAll().filter((handler) =>
        this.enabledBonusTypes.has(handler.type)
      );

    const getRandomHandler = () => {
      const handlers = getEnabledHandlers();
      return handlers.length > 0
        ? handlers[Math.floor(Math.random() * handlers.length)]
        : undefined;
    };

    const isAlwaysDisabled = this.alwaysBonusMode === 'disabled';
    const isAlwaysRandom = this.alwaysBonusMode === 'random';
    const isAlwaysFixed = this.alwaysBonusMode === 'fixed';

    // ボーナス予約チェック（次回適用）
    if (!isAlwaysDisabled && !isAlwaysRandom && !isAlwaysFixed && isBonusTriggerNumber(drawnNumber)) {
      const queuedHandler = getRandomHandler();
      if (queuedHandler) {
        bonusQueued = true;
        bonusQueuedType = queuedHandler.type;
      }
    } else if (!isBonusTriggerNumber(drawnNumber)) {
      // 通常抽選
      const cell = this.card.find((c) => c.number === drawnNumber);
      if (cell && !cell.isActive) {
        cell.isActive = true;
        activatedNumbers.push(drawnNumber);
        isDrawnHit = true;
      }
    }

    // 常時ボーナス or 予約済みボーナスを適用
    if (isAlwaysFixed) {
      const handler = this.alwaysBonusType
        ? this.bonusRegistry.get(this.alwaysBonusType)
        : undefined;
      if (handler) {
        const bonusActivated = handler.execute(this.card, {
          baseNumber: drawnNumber,
        });
        bonusNumbers.push(...bonusActivated);
        activatedNumbers.push(...bonusActivated);
        bonusApplied = true;
        bonusType = handler.type;
      }
    } else if (isAlwaysRandom) {
      const handler = getRandomHandler();
      if (handler) {
        const bonusActivated = handler.execute(this.card, {
          baseNumber: drawnNumber,
        });
        bonusNumbers.push(...bonusActivated);
        activatedNumbers.push(...bonusActivated);
        bonusApplied = true;
        bonusType = handler.type;
      }
    } else if (!isAlwaysDisabled && this.pendingBonus) {
      const pendingHandler = this.pendingBonusType
        ? this.bonusRegistry.get(this.pendingBonusType)
        : undefined;
      const handler = pendingHandler && this.enabledBonusTypes.has(pendingHandler.type)
        ? pendingHandler
        : getRandomHandler();
      if (handler) {
        const bonusActivated = handler.execute(this.card, {
          baseNumber: drawnNumber,
        });
        bonusNumbers.push(...bonusActivated);
        activatedNumbers.push(...bonusActivated);
        bonusApplied = true;
        bonusType = handler.type;
      }
      this.pendingBonus = false;
      this.pendingBonusType = null;
    }
    
    if (bonusQueued) {
      this.pendingBonus = true;
      this.pendingBonusType = bonusQueuedType ?? null;
    }

    // ライン判定
    const { linesCompleted, lineNumbers } = this.checkLines();

    // スコア計算
    const score = this.getScore(linesCompleted);

    // アクティブマス数をカウント
    const activeCount = this.card.filter((c) => c.isActive).length;

    // リーチ状態を更新
    this.updateReachStatus();

    // 結果を作成
    const result: DrawResult = {
      drawnNumber,
      isDrawnHit,
      bonusNumbers,
      activatedNumbers,
      bonusQueued,
      bonusApplied,
      bonusType,
      bonusQueuedType,
      linesCompleted,
      lineNumbers,
      score,
      activeCount,
    };

    this.lastResult = result;

    // 統計を記録
    const drawStats: DrawStatistics = {
      isHit: isDrawnHit || bonusNumbers.length > 0,
      isWin: linesCompleted > 0,
      bonusApplied,
      bonusType: bonusApplied ? bonusType : undefined,
      bonusActivatedCount: bonusApplied ? bonusNumbers.length : 0,
      linesCompleted,
      score,
      activeCount,
    };
    this.statisticsManager.record(drawStats);

    return result;
  }
  
  /** 獲得ライン数からスコアを計算 */
  private getScore(linesCompleted: number): number {
    if (linesCompleted === 0) {
      return 0;
    } else if (linesCompleted === 1) {
      return 1;
    } else if (linesCompleted === 2) {
      return 3;
    } else if (linesCompleted === 3) {
      return 10;
    } else if (linesCompleted === 4) {
      return 50;
    }
    return 200;
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

  /** 抽選ごとに盤面をランダム化 */
  private randomizeBoardActiveState(): void {
    const targetActiveCount = 13;
    const maxAttempts = 12;

    const resetBoard = () => {
      for (const cell of this.card) {
        cell.isActive = cell.isFree;
        cell.isLine = false;
        cell.isReach = false;
      }
    };

    const shuffle = (items: number[]) => {
      for (let i = items.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [items[i], items[j]] = [items[j], items[i]];
      }
    };

    const fillRandomly = () => {
      const pickableIndices = this.card
        .map((cell, idx) => ({ cell, idx }))
        .filter(({ cell }) => !cell.isFree)
        .map(({ idx }) => idx);
      shuffle(pickableIndices);

      const activateCount = Math.max(0, Math.min(targetActiveCount - 1, pickableIndices.length));
      let activated = 0;
      for (const idx of pickableIndices) {
        if (activated >= activateCount) {
          break;
        }
        if (this.wouldCompleteLine(idx)) {
          continue;
        }
        this.card[idx].isActive = true;
        activated++;
      }
    };

    const tryForceReach = (): boolean => {
      const lineStates = ALL_LINES.map((line) => {
        const active = line.filter((idx) => this.card[idx].isActive);
        const inactive = line.filter((idx) => !this.card[idx].isActive);
        return { line, active, inactive };
      });

      const trySwap = (activeCount: number, activationCount: number): boolean => {
        const candidates = lineStates.filter(
          ({ active, inactive }) => active.length === activeCount && inactive.length >= activationCount
        );
        const candidateIndices = candidates.map((_, idx) => idx);
        shuffle(candidateIndices);
        for (const candidateIndex of candidateIndices) {
          const { line, inactive } = candidates[candidateIndex];
          const outsideActives = this.card
            .map((cell, idx) => ({ cell, idx }))
            .filter(({ cell, idx }) => cell.isActive && !cell.isFree && !line.includes(idx))
            .map(({ idx }) => idx);
          if (outsideActives.length < activationCount) {
            continue;
          }
          shuffle(outsideActives);
          shuffle(inactive);

          for (const idx of inactive.slice(0, activationCount)) {
            this.card[idx].isActive = true;
          }
          for (const idx of outsideActives.slice(0, activationCount)) {
            this.card[idx].isActive = false;
          }
          return true;
        }
        return false;
      };

      if (trySwap(3, 1)) {
        return true;
      }
      return trySwap(2, 2);
    };

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      resetBoard();
      fillRandomly();
      this.updateReachStatus();
      if (this.hasReachCells()) {
        return;
      }
    }

    if (tryForceReach()) {
      this.updateReachStatus();
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

  /** 抽選前にリーチマスがあるか */
  private hasReachCells(): boolean {
    return this.card.some((cell) => cell.isReach && !cell.isActive);
  }

  /** 指定マスを開けるとライン成立するか */
  private wouldCompleteLine(targetIndex: number): boolean {
    for (const line of ALL_LINES) {
      if (!line.includes(targetIndex)) {
        continue;
      }
      const activeCount = line.filter((idx) => this.card[idx].isActive).length;
      if (activeCount === 4) {
        return true;
      }
    }
    return false;
  }

  /** 抽選前にリーチが出るまでランダム開放 */
  private ensureReachBeforeDraw(): void {
    this.updateReachStatus();
    if (this.hasReachCells()) {
      return;
    }

    const maxAttempts = this.card.length;
    let attempts = 0;

    while (!this.hasReachCells() && attempts < maxAttempts) {
      const candidates = this.card
        .map((cell, idx) => ({ cell, idx }))
        .filter(({ cell, idx }) => !cell.isActive && !this.wouldCompleteLine(idx));

      if (candidates.length === 0) {
        break;
      }

      const { cell } = candidates[Math.floor(Math.random() * candidates.length)];
      cell.isActive = true;
      this.updateReachStatus();
      attempts++;
    }
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
