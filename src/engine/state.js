import { GAME_CONFIG, LIVES_CONFIG } from './constants.js';

// Game state management
export class GameState {
  constructor() {
    this.reset();
  }

  reset() {
    // 얼굴 이미지는 reset 시 유지 (게임 재시작해도 얼굴 유지)
    const savedFaceImage = this.faceImage;
    
    this.t = 0;
    this.score = 0;  // 시간 기반 점수 (생존 시간)
    this.startTime = null;  // 게임 시작 시간 (밀리초)
    this.speed = GAME_CONFIG.INITIAL_SPEED;
    this.bgOffset = 0;  // 배경 스크롤 오프셋
    this.lives = LIVES_CONFIG.START;  // 시작 목숨
    this.heartsCollected = 0;  // 수집한 하트 개수
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
    
    // 얼굴 이미지 복원
    this.faceImage = savedFaceImage;
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
