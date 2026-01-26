/**
 * ビンゴゲームシミュレーター UI
 */

import './style.css';
import { BingoGame } from './game';
import { getBonusTypeLabel } from './types';
import type { CellState, DrawResult } from './types';

class BingoUI {
  private game: BingoGame;
  private cardElement: HTMLElement;
  private resultElement: HTMLElement;
  private statsElement: HTMLElement;

  constructor() {
    this.game = new BingoGame();
    this.cardElement = document.getElementById('bingo-card')!;
    this.resultElement = document.getElementById('result-display')!;
    this.statsElement = document.getElementById('stats-section')!;
    
    this.setupEventListeners();
    this.render();
  }

  private setupEventListeners(): void {
    document.getElementById('btn-draw-1')?.addEventListener('click', () => this.handleDraw(1));
    document.getElementById('btn-draw-10')?.addEventListener('click', () => this.handleDraw(10));
    document.getElementById('btn-draw-100')?.addEventListener('click', () => this.handleDraw(100));
    document.getElementById('btn-draw-1000')?.addEventListener('click', () => this.handleDraw(1000));
    document.getElementById('btn-reset')?.addEventListener('click', () => this.handleReset());
  }

  private handleDraw(count: number): void {
    if (count === 1) {
      const result = this.game.draw();
      this.render();
      this.showResult(result);
    } else {
      const results = this.game.drawMultiple(count);
      this.render();
      // 最後の結果を表示
      const lastResult = results[results.length - 1];
      this.showMultipleResult(count, results, lastResult);
    }
  }

  private handleReset(): void {
    this.game.reset();
    this.render();
    this.resultElement.innerHTML = `
      <h3>抽選結果</h3>
      <div class="result-number">-</div>
      <div class="result-info">リセットしました</div>
    `;
  }

  private render(): void {
    this.renderCard();
    this.renderStats();
  }

  private renderCard(): void {
    const card = this.game.getCard();
    this.cardElement.innerHTML = '';

    for (const cell of card) {
      const cellElement = this.createCellElement(cell);
      this.cardElement.appendChild(cellElement);
    }
  }

  private createCellElement(cell: CellState): HTMLElement {
    const div = document.createElement('div');
    div.className = 'cell';
    div.textContent = cell.number.toString();

    if (cell.isFree) {
      div.classList.add('free');
    }
    if (cell.isActive && !cell.isFree) {
      div.classList.add('active');
    }
    if (cell.isLine) {
      div.classList.add('line');
    } else if (cell.isReach && !cell.isActive) {
      div.classList.add('reach');
    }

    return div;
  }

  private showResult(result: DrawResult): void {
    let infoHtml = '';
    
    if (result.bonusApplied) {
      const bonusName = result.bonusType
        ? getBonusTypeLabel(result.bonusType)
        : '不明';
      infoHtml += `<div class="result-info bonus">🎉 ボーナス適用！「${bonusName}」で ${result.activatedNumbers.join(', ')} がアクティブに</div>`;
    }
    if (result.bonusQueued) {
      const bonusName = result.bonusQueuedType
        ? getBonusTypeLabel(result.bonusQueuedType)
        : '不明';
      infoHtml += `<div class="result-info bonus">✨ ボーナス獲得！「${bonusName}」を次回の抽選で適用</div>`;
    }

    if (!result.bonusQueued) {
      if (result.activatedNumbers.includes(result.drawnNumber)) {
        infoHtml += `<div class="result-info">ヒット！ ${result.drawnNumber} がアクティブに</div>`;
      } else {
        infoHtml += `<div class="result-info">ハズレ（${result.drawnNumber}は既にアクティブ）</div>`;
      }
    }

    if (result.linesCompleted > 0) {
      infoHtml += `<div class="result-info win">🎊 ${result.linesCompleted}ライン成立！ +${result.score}点</div>`;
    }

    this.resultElement.innerHTML = `
      <h3>抽選結果</h3>
      <div class="result-number">${result.drawnNumber}</div>
      ${infoHtml}
    `;
  }

  private showMultipleResult(count: number, results: DrawResult[], lastResult: DrawResult): void {
    const totalScore = results.reduce((sum, r) => sum + r.score, 0);
    const totalHits = results.filter(r => r.isHit).length;
    const totalWins = results.filter(r => r.score > 0).length;

    this.resultElement.innerHTML = `
      <h3>${count}回抽選完了</h3>
      <div class="result-number">${lastResult.drawnNumber}</div>
      <div class="result-info">ヒット: ${totalHits}回 | 当たり: ${totalWins}回 | 獲得: ${totalScore}点</div>
    `;
  }

  private renderStats(): void {
    const stats = this.game.getStatistics();
    const totalDraws = stats.getTotalDraws();
    const hitRate = (stats.getHitRate() * 100).toFixed(1);
    const winRate = (stats.getWinRate() * 100).toFixed(1);
    const avgScore = stats.getAverageScore().toFixed(3);
    const totalScore = stats.getTotalScore();
    const avgActive = stats.getAverageActiveCount().toFixed(2);
    const distribution = stats.getScoreDistribution();
    const lastResult = this.game.getLastResult();
    const latestBonusHtml = this.renderLatestBonus(lastResult);

    this.statsElement.innerHTML = `
      <h2>📊 統計</h2>
      <div class="stats-grid">
        <div class="stat-item">
          <div class="stat-label">総抽選回数</div>
          <div class="stat-value">${totalDraws.toLocaleString()}</div>
        </div>
        <div class="stat-item">
          <div class="stat-label">ヒット率</div>
          <div class="stat-value">${hitRate}%</div>
        </div>
        <div class="stat-item">
          <div class="stat-label">当たり率</div>
          <div class="stat-value highlight">${winRate}%</div>
        </div>
        <div class="stat-item">
          <div class="stat-label">平均獲得スコア</div>
          <div class="stat-value">${avgScore}</div>
        </div>
        <div class="stat-item">
          <div class="stat-label">総獲得スコア</div>
          <div class="stat-value highlight">${totalScore.toLocaleString()}</div>
        </div>
        <div class="stat-item">
          <div class="stat-label">平均アクティブ数</div>
          <div class="stat-value">${avgActive}</div>
        </div>
      </div>
      ${latestBonusHtml}
      <div class="distribution">
        <h3>スコア分布</h3>
        ${this.renderDistribution(distribution, totalDraws)}
      </div>
    `;
  }

  private renderLatestBonus(lastResult: DrawResult | null): string {
    if (!lastResult || (!lastResult.bonusQueued && !lastResult.bonusApplied)) {
      return `
        <div class="latest-bonus">
          <div class="latest-bonus-label">最新ボーナス</div>
          <div class="latest-bonus-value">-</div>
        </div>
      `;
    }

    const items: string[] = [];
    if (lastResult.bonusQueued) {
      const bonusName = lastResult.bonusQueuedType
        ? getBonusTypeLabel(lastResult.bonusQueuedType)
        : '不明';
      items.push(`獲得: ${bonusName}`);
    }
    if (lastResult.bonusApplied) {
      const bonusName = lastResult.bonusType
        ? getBonusTypeLabel(lastResult.bonusType)
        : '不明';
      items.push(`適用: ${bonusName}`);
    }

    return `
      <div class="latest-bonus">
        <div class="latest-bonus-label">最新ボーナス</div>
        <div class="latest-bonus-value">${items.join(' / ')}</div>
      </div>
    `;
  }

  private renderDistribution(distribution: [number, number][], total: number): string {
    if (distribution.length === 0) {
      return '<div class="distribution-empty">データなし</div>';
    }

    const maxCount = Math.max(...distribution.map(([, count]) => count));
    const maxHeight = 60;

    const bars = distribution.map(([score, count]) => {
      const height = maxCount > 0 ? (count / maxCount) * maxHeight : 0;
      const percentage = total > 0 ? ((count / total) * 100).toFixed(3) : '0';
      return `
        <div class="distribution-bar" style="height: ${height}px;" title="スコア${score}: ${count}回 (${percentage}%)">
          <span class="distribution-count">${count}</span>
          <span class="distribution-percent">${percentage}%</span>
          <span class="distribution-label">${score}</span>
        </div>
      `;
    }).join('');

    return `<div class="distribution-chart">${bars}</div>`;
  }
}

// アプリケーション開始
document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <h1>🎱 ビンゴシミュレーター</h1>
  <div class="container">
    <div class="bingo-section">
      <div id="bingo-card" class="bingo-card"></div>
      <div id="result-display" class="result-display">
        <h3>抽選結果</h3>
        <div class="result-number">-</div>
        <div class="result-info">抽選ボタンを押してください</div>
      </div>
      <div class="controls">
        <button id="btn-draw-1" class="btn btn-draw">抽選×1</button>
        <button id="btn-draw-10" class="btn btn-draw">×10</button>
        <button id="btn-draw-100" class="btn btn-draw">×100</button>
        <button id="btn-draw-1000" class="btn btn-draw">×1000</button>
        <button id="btn-reset" class="btn btn-reset">リセット</button>
      </div>
    </div>
    <div id="stats-section" class="stats-section">
      <h2>📊 統計</h2>
      <div class="stats-grid">
        <div class="stat-item">
          <div class="stat-label">総抽選回数</div>
          <div class="stat-value">0</div>
        </div>
        <div class="stat-item">
          <div class="stat-label">ヒット率</div>
          <div class="stat-value">0%</div>
        </div>
        <div class="stat-item">
          <div class="stat-label">当たり率</div>
          <div class="stat-value highlight">0%</div>
        </div>
        <div class="stat-item">
          <div class="stat-label">平均獲得スコア</div>
          <div class="stat-value">0</div>
        </div>
        <div class="stat-item">
          <div class="stat-label">総獲得スコア</div>
          <div class="stat-value highlight">0</div>
        </div>
        <div class="stat-item">
          <div class="stat-label">平均アクティブ数</div>
          <div class="stat-value">0</div>
        </div>
      </div>
      <div class="distribution">
        <h3>スコア分布</h3>
        <div class="distribution-empty">データなし</div>
      </div>
    </div>
  </div>
`;

new BingoUI();
