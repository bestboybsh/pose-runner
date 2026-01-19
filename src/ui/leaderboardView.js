import { RankingService } from '../services/rankingService.js';

// Leaderboard UI view
export class LeaderboardView {
  constructor(containerEl) {
    this.containerEl = containerEl;
    this.rankingService = new RankingService();
    this.visible = false;
  }

  show(score = null) {
    if (score !== null) {
      this.rankingService.addScore(score);
    }
    
    const scores = this.rankingService.getTopScores(10);
    this.render(scores);
    this.visible = true;
    
    if (this.containerEl) {
      this.containerEl.style.display = 'block';
    }
  }

  hide() {
    this.visible = false;
    if (this.containerEl) {
      this.containerEl.style.display = 'none';
    }
  }

  render(scores) {
    if (!this.containerEl) return;

    if (scores.length === 0) {
      this.containerEl.innerHTML = '<p class="muted">No scores yet. Play to set a record!</p>';
      return;
    }

    const html = `
      <h3>Leaderboard</h3>
      <ol style="list-style-position: inside; padding: 0;">
        ${scores.map((s, i) => `
          <li style="padding: 4px 0;">
            ${i + 1}. ${s.score} 
            <span class="muted">(${new Date(s.date).toLocaleDateString()})</span>
          </li>
        `).join('')}
      </ol>
    `;
    
    this.containerEl.innerHTML = html;
  }

  toggle() {
    if (this.visible) {
      this.hide();
    } else {
      this.show();
    }
  }
}
