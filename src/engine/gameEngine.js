import { GameState } from './state.js';
import { GAME_CONFIG } from './constants.js';
import { checkPlayerObstacleCollision } from './collision.js';

// Core game engine - handles game logic
export class GameEngine {
  constructor() {
    this.state = new GameState();
  }

  reset() {
    this.state.reset();
  }

  spawnObstacle() {
    const type = Math.random() < GAME_CONFIG.OBSTACLE.LOW_PROBABILITY ? "low" : "high";
    const w = type === "low" ? GAME_CONFIG.OBSTACLE.LOW_W : GAME_CONFIG.OBSTACLE.HIGH_W;
    const h = type === "low" ? GAME_CONFIG.OBSTACLE.LOW_H : GAME_CONFIG.OBSTACLE.HIGH_H;
    const y = type === "low" 
      ? GAME_CONFIG.GROUND_Y 
      : (GAME_CONFIG.GROUND_Y - GAME_CONFIG.OBSTACLE.HIGH_OFFSET);
    
    this.state.obstacles.push({ 
      x: GAME_CONFIG.CANVAS_WIDTH + 20, 
      y, 
      w, 
      h, 
      type 
    });
  }

  update(actions) {
    if (this.state.over) {
      return { gameOver: true, score: Math.floor(this.state.score / 6) };
    }

    const { state } = this;
    state.t += 1;
    
    // Speed increase over time
    if (state.t % GAME_CONFIG.SPEED_INTERVAL === 0) {
      state.speed += GAME_CONFIG.SPEED_INCREMENT;
    }

    // Player movement
    state.player.duck = actions.duck && (state.player.y >= GAME_CONFIG.GROUND_Y);

    if (actions.jump && state.player.y >= GAME_CONFIG.GROUND_Y) {
      state.player.vy = GAME_CONFIG.JUMP_VELOCITY;
    }

    state.player.vy += GAME_CONFIG.GRAVITY;
    state.player.y += state.player.vy;
    
    if (state.player.y > GAME_CONFIG.GROUND_Y) {
      state.player.y = GAME_CONFIG.GROUND_Y;
      state.player.vy = 0;
    }

    // Obstacle spawning
    state.spawnCd -= 1;
    if (state.spawnCd <= 0) {
      this.spawnObstacle();
      state.spawnCd = GAME_CONFIG.OBSTACLE.SPAWN_MIN_CD + 
        Math.floor(Math.random() * (GAME_CONFIG.OBSTACLE.SPAWN_MAX_CD - GAME_CONFIG.OBSTACLE.SPAWN_MIN_CD));
    }

    // Move obstacles
    for (const ob of state.obstacles) ob.x -= state.speed;
    state.obstacles = state.obstacles.filter(ob => ob.x > -100);

    // Collision detection
    const playerRect = state.getPlayerRect();
    for (const ob of state.obstacles) {
      if (checkPlayerObstacleCollision(playerRect, ob)) {
        state.over = true;
        return { gameOver: true };
      }
    }

    // Score
    state.score += 1;
    const displayScore = Math.floor(state.score / 6);

    return { 
      score: displayScore, 
      gameOver: false 
    };
  }

  getState() {
    return this.state;
  }
}
