// Local storage service for scores
export class ScoreStore {
  constructor(storageKey = 'poseRunnerScores') {
    this.storageKey = storageKey;
  }

  save(score) {
    try {
      const scores = this.loadAll();
      scores.push({
        score,
        date: Date.now()
      });
      // Sort by score descending
      scores.sort((a, b) => b.score - a.score);
      localStorage.setItem(this.storageKey, JSON.stringify(scores));
      return true;
    } catch (e) {
      console.error('Failed to save score:', e);
      return false;
    }
  }

  loadAll() {
    try {
      const data = localStorage.getItem(this.storageKey);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Failed to load scores:', e);
      return [];
    }
  }

  getTop(n = 10) {
    const scores = this.loadAll();
    return scores.slice(0, n);
  }

  clear() {
    try {
      localStorage.removeItem(this.storageKey);
      return true;
    } catch (e) {
      console.error('Failed to clear scores:', e);
      return false;
    }
  }
}
