/**
 * ビンゴゲームシミュレーター UI
 */

import './style.css';
import { BingoGame } from './game';
import { BonusType, getBonusTypeLabel } from './types';
import type { BonusType as BonusTypeValue, CellState, DrawResult } from './types';

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
    this.setupAlwaysBonusSelect();
    this.setupBonusToggleControls();
    this.render();
  }

  private setupEventListeners(): void {
    const drawSelect = document.getElementById('draw-count-select') as HTMLSelectElement | null;
    document.getElementById('btn-draw')?.addEventListener('click', () => {
      const count = drawSelect ? Number(drawSelect.value) : 1;
      if (!Number.isFinite(count) || count <= 0) {
        return;
      }
      this.handleDraw(count);
    });
    document.getElementById('btn-reset')?.addEventListener('click', () => this.handleReset());
  }

  private setupAlwaysBonusSelect(): void {
    const select = document.getElementById('always-bonus-select') as HTMLSelectElement | null;
    if (!select) {
      return;
    }

    const noneOption = document.createElement('option');
    noneOption.value = '';
    noneOption.textContent = 'なし';
    select.appendChild(noneOption);

    for (const bonusType of Object.values(BonusType)) {
      const option = document.createElement('option');
      option.value = bonusType;
      option.textContent = getBonusTypeLabel(bonusType);
      select.appendChild(option);
    }

    select.value = '';
    select.addEventListener('change', () => {
      const selected = select.value;
      const nextType: BonusTypeValue | null = selected
        ? (selected as BonusTypeValue)
        : null;
      this.game.setAlwaysBonusType(nextType);
    });
  }

  private setupBonusToggleControls(): void {
    const container = document.getElementById('bonus-toggle-list') as HTMLDivElement | null;
    if (!container) {
      return;
    }

    container.innerHTML = '';

    const updateEnabledTypes = () => {
      const checkedTypes = Array.from(
        container.querySelectorAll<HTMLInputElement>('input[type="checkbox"]')
      )
        .filter((input) => input.checked && input.dataset.bonusType)
        .map((input) => input.dataset.bonusType as BonusTypeValue);
      this.game.setEnabledBonusTypes(checkedTypes);
    };

    for (const bonusType of Object.values(BonusType)) {
      const label = document.createElement('label');
      label.className = 'bonus-toggle-item';

      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.checked = true;
      checkbox.dataset.bonusType = bonusType;
      checkbox.addEventListener('change', updateEnabledTypes);

      const text = document.createElement('span');
      text.textContent = getBonusTypeLabel(bonusType);

      label.appendChild(checkbox);
      label.appendChild(text);
      container.appendChild(label);
    }

    updateEnabledTypes();
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
    
    if (result.bonusQueued) {
      const bonusName = result.bonusQueuedType
        ? getBonusTypeLabel(result.bonusQueuedType)
        : '不明';
      infoHtml += `<div class="result-info bonus">✨ ボーナス獲得！「${bonusName}」を次回の抽選で適用</div>`;
    } else {
      if (result.isDrawnHit) {
        infoHtml += `<div class="result-info bonus">ヒット！ ${result.drawnNumber} がアクティブに</div>`;
      } else {
        infoHtml += `<div class="result-info">ハズレ（${result.drawnNumber}は既にアクティブ）</div>`;
      }
    }

    if (result.bonusApplied) {
      const bonusName = result.bonusType
        ? getBonusTypeLabel(result.bonusType)
        : '不明';
      if (result.bonusNumbers.length > 0) {
        infoHtml += `<div class="result-info bonus">🎉「${bonusName}」適用！ ${result.bonusNumbers.join(', ')} がアクティブに</div>`;
      } else {
        infoHtml += `<div class="result-info">🎉「${bonusName}」適用！ ハズレ...</div>`;
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
    const totalHits = results.filter(r => r.isDrawnHit).length;
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
        <div class="distribution-header">
          <h3>スコア分布</h3>
          <button id="btn-export-score-csv" class="btn btn-export">CSV出力</button>
        </div>
        ${this.renderDistribution(distribution, totalDraws)}
      </div>
    `;

    const exportButton = this.statsElement.querySelector<HTMLButtonElement>('#btn-export-score-csv');
    exportButton?.addEventListener('click', () => this.exportScoreDistributionCsv());
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

  private exportScoreDistributionCsv(): void {
    const stats = this.game.getStatistics();
    const csv = stats.getScoreDistributionCsv();
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = this.buildScoreDistributionFilename();
    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);
  }

  private buildScoreDistributionFilename(): string {
    const now = new Date();
    const pad = (value: number) => value.toString().padStart(2, '0');
    const stamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
    return `score-distribution-${stamp}.csv`;
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
        <label class="bonus-control">
          <span class="bonus-control-label">常時ボーナス</span>
          <select id="always-bonus-select" class="bonus-control-select"></select>
        </label>
        <div class="bonus-control bonus-toggle">
          <span class="bonus-control-label">13ボーナス出現</span>
          <div id="bonus-toggle-list" class="bonus-toggle-list"></div>
        </div>
        <label class="bonus-control">
          <span class="bonus-control-label">抽選回数</span>
          <select id="draw-count-select" class="bonus-control-select">
            <option value="1">×1</option>
            <option value="10">×10</option>
            <option value="100">×100</option>
            <option value="1000">×1000</option>
            <option value="10000">×10000</option>
            <option value="100000">×100000</option>
            <option value="1000000">×1000000</option>
          </select>
        </label>
        <button id="btn-draw" class="btn btn-draw">抽選</button>
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
        <div class="distribution-header">
          <h3>スコア分布</h3>
          <button id="btn-export-score-csv" class="btn btn-export">CSV出力</button>
        </div>
        <div class="distribution-empty">データなし</div>
      </div>
    </div>
  </div>
`;

new BingoUI();
