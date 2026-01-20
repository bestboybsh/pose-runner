// HUD (Heads-Up Display) view manager
export class HudView {
  constructor(statusEl, scoreEl, fpsEl, hudEl, itemsEl = null, livesEl = null) {
    this.statusEl = statusEl;
    this.scoreEl = scoreEl;
    this.fpsEl = fpsEl;
    this.hudEl = hudEl;
    this.itemsEl = itemsEl;
    this.livesEl = livesEl;
  }

  setStatus(status) {
    if (this.statusEl) {
      this.statusEl.textContent = status;
    }
  }

  setScore(score) {
    if (this.scoreEl) {
      this.scoreEl.textContent = String(score);
    }
  }

  setLives(lives) {
    if (this.livesEl) {
      this.livesEl.textContent = String(lives);
    }
  }

  setHeartsCollected(count) {
    if (this.itemsEl) {
      this.itemsEl.textContent = String(count);
    }
  }

  setItemsCollected(count, itemScore) {
    // 하위 호환성을 위해 유지
    this.setHeartsCollected(count);
  }

  setFPS(fps) {
    if (this.fpsEl) {
      this.fpsEl.textContent = String(fps);
    }
  }

  log(message) {
    if (this.hudEl) {
      this.hudEl.textContent += message + "\n";
      // Keep only last ~6000 chars
      this.hudEl.textContent = this.hudEl.textContent.slice(-6000);
    }
    console.log(message);
  }

  clear() {
    if (this.hudEl) {
      this.hudEl.textContent = "";
    }
  }
}
