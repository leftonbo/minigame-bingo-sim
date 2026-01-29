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
      totalLines: 0,
      totalScore: 0,
      linesDistribution: new Map<number, number>(),
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
    
    this.stats.totalLines += draw.linesCompleted;
    this.stats.totalScore += draw.score;
    this.stats.totalActiveCount += draw.activeCount;
    
    // 獲得ライン分布を更新
    const currentCount = this.stats.linesDistribution.get(draw.linesCompleted) || 0;
    this.stats.linesDistribution.set(draw.linesCompleted, currentCount + 1);
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

  /** 統計データを取得 */
  getStats(): TotalStatistics {
    return { ...this.stats };
  }
}
