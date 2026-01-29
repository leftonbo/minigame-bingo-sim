/**
 * 統計管理
 */

import { BonusType } from './types';
import type {
  BonusTypeStatistics,
  DrawStatistics,
  TotalStatistics,
} from './types';

export class StatisticsManager {
  private stats: TotalStatistics;

  constructor() {
    this.stats = this.createEmptyStats();
  }

  private createEmptyStats(): TotalStatistics {
    return {
      totalDraws: 0,
      hitCount: 0,
      winCount: 0,
      totalLines: 0,
      totalScore: 0,
      linesDistribution: new Map<number, number>(),
      totalActiveCount: 0,
      bonusTypeStats: new Map<BonusType, BonusTypeStatistics>(),
    };
  }

  /** 統計をリセット */
  reset(): void {
    this.stats = this.createEmptyStats();
  }

  /** 1回の抽選結果を記録 */
  record(draw: DrawStatistics): void {
    this.stats.totalDraws++;
    
    if (draw.isHit) {
      this.stats.hitCount++;
    }
    
    if (draw.isWin) {
      this.stats.winCount++;
    }
    
    this.stats.totalLines += draw.linesCompleted;
    this.stats.totalScore += draw.score;
    this.stats.totalActiveCount += draw.activeCount;
    
    // 獲得ライン分布を更新
    const currentCount = this.stats.linesDistribution.get(draw.linesCompleted) || 0;
    this.stats.linesDistribution.set(draw.linesCompleted, currentCount + 1);

    if (draw.bonusApplied && draw.bonusType) {
      const bonusStats = this.getOrCreateBonusStats(draw.bonusType);
      bonusStats.appliedCount++;
      bonusStats.totalActivated += draw.bonusActivatedCount;
      bonusStats.totalLines += draw.linesCompleted;
      bonusStats.totalScore += draw.score;
      const bonusLinesCount =
        bonusStats.linesDistribution.get(draw.linesCompleted) || 0;
      bonusStats.linesDistribution.set(draw.linesCompleted, bonusLinesCount + 1);
    }
  }

  /** ヒット率を取得 */
  getHitRate(): number {
    if (this.stats.totalDraws === 0) return 0;
    return this.stats.hitCount / this.stats.totalDraws;
  }

  /** 当たり率を取得 */
  getWinRate(): number {
    if (this.stats.totalDraws === 0) return 0;
    return this.stats.winCount / this.stats.totalDraws;
  }
  
  /** 平均獲得ライン数を取得 */
  getAverageLines(): number {
    if (this.stats.totalDraws === 0) return 0;
    return this.stats.totalLines / this.stats.totalDraws;
  }

  /** 平均獲得スコアを取得 */
  getAverageScore(): number {
    if (this.stats.totalDraws === 0) return 0;
    return this.stats.totalScore / this.stats.totalDraws;
  }

  /** 抽選後アクティブマス数の平均を取得 */
  getAverageActiveCount(): number {
    if (this.stats.totalDraws === 0) return 0;
    return this.stats.totalActiveCount / this.stats.totalDraws;
  }
  
  /** 総獲得ライン数を取得 */
  getTotalLines(): number {
    return this.stats.totalLines;
  }

  /** 総獲得スコアを取得 */
  getTotalScore(): number {
    return this.stats.totalScore;
  }

  /** 総抽選回数を取得 */
  getTotalDraws(): number {
    return this.stats.totalDraws;
  }

  /** 獲得ライン分布を取得（ソート済み） */
  getLinesDistribution(): [number, number][] {
    const entries = Array.from(this.stats.linesDistribution.entries());
    return entries.sort((a, b) => a[0] - b[0]);
  }

  /** スコア分布をCSVで取得 */
  getLinesDistributionCsv(): string {
    const header = 'score,count';
    const rows = this.getLinesDistribution().map(([lines, count]) => {
      return `${lines},${count}`;
    });
    return [header, ...rows].join('\n');
  }

  /** ボーナス種類別統計をCSVで取得 */
  getBonusTypeStatsCsv(): string {
    const header = 'bonusType,appliedCount,avgActivated,avgLines,avgScore,cntLine0,cntLine1,cntLine2,cntLine3,cntLine4,cntLine5orMore';
    const rows = this.getOrderedBonusTypes()
      .map((type) => {
        const stats = this.stats.bonusTypeStats.get(type);
        if (!stats) {
          return null;
        }
        const appliedCount = stats.appliedCount;
        const avgActivated = appliedCount > 0 ? stats.totalActivated / appliedCount : 0;
        const avgLines = appliedCount > 0 ? stats.totalLines / appliedCount : 0;
        const avgScore = appliedCount > 0 ? stats.totalScore / appliedCount : 0;
        const cntLine0 = stats.linesDistribution.get(0) || 0;
        const cntLine1 = stats.linesDistribution.get(1) || 0;
        const cntLine2 = stats.linesDistribution.get(2) || 0;
        const cntLine3 = stats.linesDistribution.get(3) || 0;
        const cntLine4 = stats.linesDistribution.get(4) || 0;
        const cntLine5orMore = this.getDistributionCountSameOrMore(stats.linesDistribution, 5);
        return [
          type,
          appliedCount,
          avgActivated,
          avgLines,
          avgScore,
          cntLine0,
          cntLine1,
          cntLine2,
          cntLine3,
          cntLine4,
          cntLine5orMore,
        ].join(',');
      })
      .filter((row): row is string => row !== null);
    return [header, ...rows].join('\n');
  }
  
  /** ライン数分布から指定したライン数以上の分布数を取得 */
  private getDistributionCountSameOrMore(distribution: Map<number, number>, threshold: number): number {
    return Array
      .from(distribution.entries())
      .filter(([lines, _count]) => lines >= threshold)
      .reduce((sum, [_lines, count]) => sum + count, 0);
  }

  /** ボーナス適用時のライン数分布をCSVで取得 */
  getBonusTypeLinesDistributionCsv(): string {
    const header = 'bonusType,lines,count,rate';
    const rows: string[] = [];
    for (const type of this.getOrderedBonusTypes()) {
      const stats = this.stats.bonusTypeStats.get(type);
      if (!stats) {
        continue;
      }
      const appliedCount = stats.appliedCount;
      const entries = Array.from(stats.linesDistribution.entries()).sort(
        (a, b) => a[0] - b[0]
      );
      for (const [lines, count] of entries) {
        const rate = appliedCount > 0 ? count / appliedCount : 0;
        rows.push([type, lines, count, rate].join(','));
      }
    }
    return [header, ...rows].join('\n');
  }

  /** 統計データを取得 */
  getStats(): TotalStatistics {
    return { ...this.stats };
  }

  private getOrCreateBonusStats(type: BonusType): BonusTypeStatistics {
    const current = this.stats.bonusTypeStats.get(type);
    if (current) {
      return current;
    }
    const created: BonusTypeStatistics = {
      appliedCount: 0,
      totalActivated: 0,
      totalLines: 0,
      totalScore: 0,
      linesDistribution: new Map<number, number>(),
    };
    this.stats.bonusTypeStats.set(type, created);
    return created;
  }

  private getOrderedBonusTypes(): BonusType[] {
    return Object.values(BonusType);
  }
}
