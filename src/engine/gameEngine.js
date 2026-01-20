import { GameState } from './state.js';
import { GAME_CONFIG, ITEM_CONFIG, LIVES_CONFIG } from './constants.js';
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
      // 넓은 장애물 (스쿼트 필요) - 땅에서 시작하는 넓은 블록
      type = "duck";
      w = GAME_CONFIG.OBSTACLE.DUCK_W;
      h = GAME_CONFIG.OBSTACLE.DUCK_H;
      y = GAME_CONFIG.GROUND_Y;  // 땅에서 시작
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
    // 장애물과 겹치지 않는 위치 찾기
    let attempts = 0;
    let validPosition = false;
    let y, x;
    
    while (!validPosition && attempts < 20) {
      attempts++;
      y = ITEM_CONFIG.Y_MIN + Math.random() * (ITEM_CONFIG.Y_MAX - ITEM_CONFIG.Y_MIN);
      x = GAME_CONFIG.CANVAS_WIDTH + 20;
      
      // 새로 스폰할 아이템의 영역
      const itemRect = {
        x: x,
        y: y - ITEM_CONFIG.H,
        w: ITEM_CONFIG.W,
        h: ITEM_CONFIG.H
      };
      
      // 기존 장애물들과 겹치는지 확인
      validPosition = true;
      for (const ob of this.state.obstacles) {
        // 장애물의 영역
        const obRect = {
          x: ob.x,
          y: ob.y - ob.h,
          w: ob.w,
          h: ob.h
        };
        
        // X 좌표 범위가 겹치는지 확인 (장애물이 화면에 보이는 범위)
        const xOverlap = !(itemRect.x + itemRect.w < obRect.x || itemRect.x > obRect.x + obRect.w);
        
        // X 좌표가 겹치면 Y 좌표도 확인
        if (xOverlap) {
          const yOverlap = !(itemRect.y + itemRect.h < obRect.y || itemRect.y > obRect.y + obRect.h);
          if (yOverlap) {
            validPosition = false;
            break;
          }
        }
        
        // 약간의 여유 공간 추가 (너무 가까이 스폰되지 않도록)
        const minDistance = 50;
        const distanceX = Math.abs((itemRect.x + itemRect.w / 2) - (obRect.x + obRect.w / 2));
        const distanceY = Math.abs((itemRect.y + itemRect.h / 2) - (obRect.y + obRect.h / 2));
        
        if (distanceX < minDistance && distanceY < minDistance) {
          validPosition = false;
          break;
        }
      }
      
      // 기존 아이템들과도 겹치지 않는지 확인
      if (validPosition) {
        for (const item of this.state.items) {
          if (!item.collected) {
            const existingItemRect = {
              x: item.x,
              y: item.y - item.h,
              w: item.w,
              h: item.h
            };
            
            const xOverlap = !(itemRect.x + itemRect.w < existingItemRect.x || itemRect.x > existingItemRect.x + existingItemRect.w);
            if (xOverlap) {
              const yOverlap = !(itemRect.y + itemRect.h < existingItemRect.y || itemRect.y > existingItemRect.y + existingItemRect.h);
              if (yOverlap) {
                validPosition = false;
                break;
              }
            }
          }
        }
      }
    }
    
    // 유효한 위치를 찾았거나 최대 시도 횟수에 도달하면 스폰
    if (validPosition || attempts >= 20) {
      this.state.items.push({
        x: x || (GAME_CONFIG.CANVAS_WIDTH + 20),
        y: y || (ITEM_CONFIG.Y_MIN + Math.random() * (ITEM_CONFIG.Y_MAX - ITEM_CONFIG.Y_MIN)),
        w: ITEM_CONFIG.W,
        h: ITEM_CONFIG.H,
        collected: false
      });
    }
  }

  update(actions, currentTime = null) {
    if (this.state.over) {
      return { gameOver: true, score: this.state.score, lives: this.state.lives };
    }

    const { state } = this;
    state.t += 1;
    
    // 실제 시간 기반 점수 계산
    if (currentTime !== null) {
      if (state.startTime === null) {
        state.startTime = currentTime;
      }
      // 경과 시간을 초 단위로 계산 (밀리초 -> 초)
      const elapsedSeconds = Math.floor((currentTime - state.startTime) / 1000);
      state.score = elapsedSeconds;
    }
    
    // Speed increase over time (최대 3배까지)
    if (state.t % GAME_CONFIG.SPEED_INTERVAL === 0) {
      const newSpeed = state.speed + GAME_CONFIG.SPEED_INCREMENT;
      state.speed = Math.min(newSpeed, GAME_CONFIG.MAX_SPEED);  // 최대 속도 제한
    }
    
    // 배경 스크롤 업데이트 (달려나가는 느낌)
    state.bgOffset = (state.bgOffset || 0) + state.speed;

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

    // Item (하트) spawning - 30초에 1-2개 정도
    state.itemSpawnCd -= 1;
    if (state.itemSpawnCd <= 0) {
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
      // 이미 충돌 처리된 장애물은 건너뛰기
      if (ob.hit) continue;
      
      if (checkPlayerObstacleCollision(playerRect, ob)) {
        // duck 타입 장애물은 숙였을 때만 통과, 서 있거나 점프 중이면 충돌
        if (ob.type === "duck") {
          // 플레이어가 땅에 있고 숙여 있으면 통과
          if (state.player.duck && state.player.y >= GAME_CONFIG.GROUND_Y) {
            continue;  // 숙여 있으면 통과
          }
          // 서 있거나 점프 중이면 충돌 (점프로 넘을 수 없음)
        }
        // 충돌 플래그 설정 (중복 충돌 방지)
        ob.hit = true;
        
        // 충돌 시 목숨 감소
        state.lives -= LIVES_CONFIG.DECREASE_ON_HIT;
        if (state.lives <= 0) {
          state.lives = 0;
          state.over = true;
          return { gameOver: true, score: state.score, lives: 0 };
        }
        // 충돌한 장애물 제거 (목숨이 남아있으면 계속 진행)
        ob.x = -200;  // 화면 밖으로 이동하여 필터링되도록
      }
    }

    // Collision detection - items (하트)
    for (const item of state.items) {
      if (!item.collected && checkPlayerItemCollision(playerRect, item)) {
        item.collected = true;
        state.heartsCollected += 1;
        // 하트를 먹으면 목숨 증가 (최대 100개까지)
        state.lives = Math.min(state.lives + ITEM_CONFIG.HEART_VALUE, LIVES_CONFIG.MAX);
      }
    }

    // Score는 update 시작 부분에서 실제 시간 기반으로 계산됨

    return { 
      score: state.score,
      lives: state.lives,
      heartsCollected: state.heartsCollected,
      gameOver: false 
    };
  }

  getState() {
    return this.state;
  }
}
