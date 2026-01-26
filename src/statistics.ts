/**
 * 統計管理
 */

import type { DrawStatistics, TotalStatistics } from './types';

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
      totalScore: 0,
      scoreDistribution: new Map<number, number>(),
      totalActiveCount: 0,
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
    
    this.stats.totalScore += draw.score;
    this.stats.totalActiveCount += draw.activeCount;
    
    // スコア分布を更新
    const currentCount = this.stats.scoreDistribution.get(draw.score) || 0;
    this.stats.scoreDistribution.set(draw.score, currentCount + 1);
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

  /** 総獲得スコアを取得 */
  getTotalScore(): number {
    return this.stats.totalScore;
  }

  /** 総抽選回数を取得 */
  getTotalDraws(): number {
    return this.stats.totalDraws;
  }

  /** スコア分布を取得（ソート済み） */
  getScoreDistribution(): [number, number][] {
    const entries = Array.from(this.stats.scoreDistribution.entries());
    return entries.sort((a, b) => a[0] - b[0]);
  }

  /** スコア分布をCSVで取得 */
  getScoreDistributionCsv(): string {
    const header = 'score,count,percentage';
    const total = this.getTotalDraws();
    const rows = this.getScoreDistribution().map(([score, count]) => {
      const percentage = total > 0 ? ((count / total) * 100).toFixed(3) : '0';
      return `${score},${count},${percentage}`;
    });
    return [header, ...rows].join('\n');
  }

  /** 統計データを取得 */
  getStats(): TotalStatistics {
    return { ...this.stats };
  }
}
