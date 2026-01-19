import { ScoreStore } from './scoreStore.js';

// Ranking service - manages score ranking
export class RankingService {
  constructor() {
    this.store = new ScoreStore();
  }

  addScore(score) {
    return this.store.save(score);
  }

  getTopScores(n = 10) {
    return this.store.getTop(n);
  }

  clearScores() {
    return this.store.clear();
  }

  getRank(score) {
    const allScores = this.store.loadAll();
    let rank = 1;
    for (const s of allScores) {
      if (s.score > score) {
        rank++;
      } else {
        break;
      }
    }
    return rank;
  }
}
