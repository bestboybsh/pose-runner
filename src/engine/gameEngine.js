import { GameState } from './state.js';
import { GAME_CONFIG, ITEM_CONFIG } from './constants.js';
import { checkPlayerObstacleCollision, checkPlayerItemCollision } from './collision.js';

// Core game engine - handles game logic
export class GameEngine {
  constructor() {
    this.state = new GameState();
  }

  reset() {
    this.state.reset();
  }

  spawnObstacle() {
    const rand = Math.random();
    let type, w, h, y;
    
    if (rand < GAME_CONFIG.OBSTACLE.LOW_PROBABILITY) {
      // 낮은 장애물 (점프 필요)
      type = "low";
      w = GAME_CONFIG.OBSTACLE.LOW_W;
      h = GAME_CONFIG.OBSTACLE.LOW_H;
      y = GAME_CONFIG.GROUND_Y;
    } else if (rand < GAME_CONFIG.OBSTACLE.HIGH_PROBABILITY) {
      // 높은 장애물 (점프 필요)
      type = "high";
      w = GAME_CONFIG.OBSTACLE.HIGH_W;
      h = GAME_CONFIG.OBSTACLE.HIGH_H;
      y = GAME_CONFIG.GROUND_Y - GAME_CONFIG.OBSTACLE.HIGH_OFFSET;
    } else {
      // 넓은 장애물 (스쿼트 필요) - 중간부터 위까지
      type = "duck";
      w = GAME_CONFIG.OBSTACLE.DUCK_W;
      h = GAME_CONFIG.OBSTACLE.DUCK_H;
      y = GAME_CONFIG.OBSTACLE.DUCK_Y_START + GAME_CONFIG.OBSTACLE.DUCK_H;  // 중간부터 위까지
    }
    
    this.state.obstacles.push({ 
      x: GAME_CONFIG.CANVAS_WIDTH + 20, 
      y, 
      w, 
      h, 
      type 
    });
  }

  spawnItem() {
    const y = ITEM_CONFIG.Y_MIN + Math.random() * (ITEM_CONFIG.Y_MAX - ITEM_CONFIG.Y_MIN);
    this.state.items.push({
      x: GAME_CONFIG.CANVAS_WIDTH + 20,
      y,
      w: ITEM_CONFIG.W,
      h: ITEM_CONFIG.H,
      collected: false
    });
  }

  update(actions) {
    if (this.state.over) {
      return { gameOver: true, score: this.state.score };
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

    // Item spawning
    state.itemSpawnCd -= 1;
    if (state.itemSpawnCd <= 0 && Math.random() < ITEM_CONFIG.SPAWN_CHANCE) {
      this.spawnItem();
      state.itemSpawnCd = ITEM_CONFIG.SPAWN_MIN_CD + 
        Math.floor(Math.random() * (ITEM_CONFIG.SPAWN_MAX_CD - ITEM_CONFIG.SPAWN_MIN_CD));
    }

    // Move obstacles
    for (const ob of state.obstacles) ob.x -= state.speed;
    state.obstacles = state.obstacles.filter(ob => ob.x > -100);

    // Move items
    for (const item of state.items) item.x -= state.speed;
    state.items = state.items.filter(item => item.x > -100 && !item.collected);

    // Collision detection - obstacles
    const playerRect = state.getPlayerRect();
    for (const ob of state.obstacles) {
      if (checkPlayerObstacleCollision(playerRect, ob)) {
        // duck 타입 장애물은 서 있을 때만 충돌
        if (ob.type === "duck" && state.player.duck) {
          continue;  // 숙여 있으면 통과
        }
        state.over = true;
        return { gameOver: true, score: state.score };
      }
    }

    // Collision detection - items
    for (const item of state.items) {
      if (!item.collected && checkPlayerItemCollision(playerRect, item)) {
        item.collected = true;
        state.itemsCollected += 1;
        state.itemScore += ITEM_CONFIG.SCORE_VALUE;
      }
    }

    // Score calculation: 시간 점수 + 아이템 점수
    if (state.t % 6 === 0) {  // 6프레임마다 1점 (시간 기반)
      state.timeScore += 1;
    }
    state.score = state.timeScore + state.itemScore;

    return { 
      score: state.score,
      timeScore: state.timeScore,
      itemScore: state.itemScore,
      itemsCollected: state.itemsCollected,
      gameOver: false 
    };
  }

  getState() {
    return this.state;
  }
}
