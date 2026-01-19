import { GAME_CONFIG } from './constants.js';

// Game state management
export class GameState {
  constructor() {
    this.reset();
  }

  reset() {
    this.t = 0;
    this.timeScore = 0;  // 시간 기반 점수
    this.itemScore = 0;  // 아이템 점수
    this.score = 0;  // 총점
    this.itemsCollected = 0;
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
    this.items = [];
    this.spawnCd = 0;
    this.itemSpawnCd = 0;
    this.over = false;
    // faceImage는 reset 시 유지 (게임 재시작해도 얼굴 유지)
  }

  setFaceImage(image) {
    this.faceImage = image;
  }

  getPlayerRect() {
    const ph = this.player.duck ? GAME_CONFIG.PLAYER.H_DUCKING : GAME_CONFIG.PLAYER.H_STANDING;
    const py = this.player.duck 
      ? (this.player.y - GAME_CONFIG.PLAYER.H_DUCKING) 
      : (this.player.y - GAME_CONFIG.PLAYER.H_STANDING);
    return { x: this.player.x, y: py, w: this.player.w, h: ph };
  }
}
