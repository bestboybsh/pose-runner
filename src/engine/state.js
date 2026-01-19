import { GAME_CONFIG } from './constants.js';

// Game state management
export class GameState {
  constructor() {
    this.reset();
  }

  reset() {
    this.t = 0;
    this.score = 0;
    this.speed = GAME_CONFIG.INITIAL_SPEED;
    this.player = {
      x: GAME_CONFIG.PLAYER.X,
      y: GAME_CONFIG.GROUND_Y,
      vy: 0,
      w: GAME_CONFIG.PLAYER.W,
      h: GAME_CONFIG.PLAYER.H_STANDING,
      duck: false
    };
    this.obstacles = [];
    this.spawnCd = 0;
    this.over = false;
  }

  getPlayerRect() {
    const ph = this.player.duck ? GAME_CONFIG.PLAYER.H_DUCKING : GAME_CONFIG.PLAYER.H_STANDING;
    const py = this.player.duck 
      ? (this.player.y - GAME_CONFIG.PLAYER.H_DUCKING) 
      : (this.player.y - GAME_CONFIG.PLAYER.H_STANDING);
    return { x: this.player.x, y: py, w: this.player.w, h: ph };
  }
}
