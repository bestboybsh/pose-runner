import { GAME_CONFIG } from '../engine/constants.js';

// Base renderer interface
export class RendererBase {
  constructor(canvas) {
    if (this.constructor === RendererBase) {
      throw new Error('RendererBase cannot be instantiated directly');
    }
    this.canvas = canvas;
  }

  clear() {
    throw new Error('clear() must be implemented');
  }

  render(state, actions, calibrationReady, gameOver) {
    throw new Error('render() must be implemented');
  }
}

// Canvas-based renderer implementation
export class CanvasRenderer extends RendererBase {
  constructor(canvas) {
    super(canvas);
    this.ctx = canvas.getContext("2d");
    this.backgroundImage = null;
    this.backgroundLoaded = false;
    this.obstacleImage = null;
    this.obstacleLoaded = false;
    
    // 배경 이미지 로드
    this.loadBackgroundImage();
    // 장애물 이미지 로드
    this.loadObstacleImage();
  }

  loadBackgroundImage() {
    this.backgroundImage = new Image();
    this.backgroundImage.onload = () => {
      this.backgroundLoaded = true;
      console.log('Background image loaded:', this.backgroundImage.width, 'x', this.backgroundImage.height);
    };
    this.backgroundImage.onerror = (e) => {
      console.warn('Background image not found: src/assets/background.jpg');
      this.backgroundLoaded = false;
    };
    this.backgroundImage.src = 'src/assets/background.jpg';
  }

  loadObstacleImage() {
    this.obstacleImage = new Image();
    this.obstacleImage.onload = () => {
      this.obstacleLoaded = true;
      console.log('Obstacle image loaded:', this.obstacleImage.width, 'x', this.obstacleImage.height);
    };
    this.obstacleImage.onerror = (e) => {
      console.warn('Obstacle image not found: src/assets/obstacle.png');
      this.obstacleLoaded = false;
    };
    this.obstacleImage.src = 'src/assets/obstacle.png';
  }

  clear() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

    render(state, actions, calibrationReady, gameOver) {
    this.clear();
    
    // Background - 스크롤 배경 이미지
    const groundY = state.player.y;
    
    if (this.backgroundLoaded && this.backgroundImage.complete && this.backgroundImage.naturalWidth > 0) {
      // 배경 이미지 스크롤 위치 계산 (게임 시간 * 속도)
      const scrollOffset = (state.bgOffset || 0) % this.backgroundImage.width;
      
      // 배경 이미지를 여러 번 그려서 무한 스크롤 효과
      // 이미지를 캔버스 높이에 맞게 조정
      const bgHeight = this.canvas.height;
      const bgAspect = this.backgroundImage.width / this.backgroundImage.height;
      const bgWidth = bgHeight * bgAspect;
      
      // 배경 이미지 그리기 (연속적으로)
      for (let x = -scrollOffset; x < this.canvas.width; x += bgWidth) {
        this.ctx.drawImage(
          this.backgroundImage,
          x, 0, bgWidth, bgHeight
        );
      }
    } else {
      // 배경 이미지가 없으면 기본 배경색 사용
      this.ctx.fillStyle = "#111";
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    // Obstacles - 검은색 배경에 이미지로 렌더링
    for (const ob of state.obstacles) {
      const obX = ob.x;
      const obY = ob.y - ob.h;  // 장애물 상단 Y 좌표
      const obW = ob.w;
      const obH = ob.h;
      
      this.ctx.save();
      
      // 검은색 배경 먼저 그리기
      this.ctx.fillStyle = '#000000';
      this.ctx.fillRect(obX, obY, obW, obH);
      
      if (this.obstacleLoaded && this.obstacleImage.complete && this.obstacleImage.naturalWidth > 0) {
        // 장애물 이미지로 그리기 (리사이징)
        try {
          // 검은색 배경 위에 이미지 그리기
          this.ctx.drawImage(
            this.obstacleImage,
            obX, obY, obW, obH
          );
        } catch (e) {
          // 이미지 그리기 실패 시 기본 블록 사용
          console.error('Error drawing obstacle image:', e);
          this.drawObstacleFallback(obX, obY, obW, obH, ob.type);
        }
      } else {
        // 이미지가 없으면 기본 블록 표시
        this.drawObstacleFallback(obX, obY, obW, obH, ob.type);
      }
      
      // 테두리 추가 (배경과 구분되도록)
      this.ctx.strokeStyle = '#ffffff';  // 흰색 테두리
      this.ctx.lineWidth = 2;  // 테두리 두께
      this.ctx.strokeRect(obX, obY, obW, obH);
      
      this.ctx.restore();
    }

    // Items (하트)
    for (const item of state.items) {
      if (!item.collected) {
        // 하트 모양 아이템
        const centerX = item.x + item.w / 2;
        const centerY = item.y - item.h / 2;
        const size = item.w / 2;
        
        // 하트 그리기
        this.ctx.save();
        this.ctx.fillStyle = "#ff1744";  // 빨간색 하트
        this.ctx.strokeStyle = "#d50000";  // 진한 빨간색 테두리
        this.ctx.lineWidth = 2;
        
        this.ctx.beginPath();
        // 하트 모양 (좌측 원)
        this.ctx.arc(centerX - size * 0.3, centerY - size * 0.1, size * 0.5, Math.PI, 0, false);
        // 하트 모양 (우측 원)
        this.ctx.arc(centerX + size * 0.3, centerY - size * 0.1, size * 0.5, Math.PI, 0, false);
        // 하트 모양 (하단 V자)
        this.ctx.lineTo(centerX, centerY + size * 0.8);
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.stroke();
        this.ctx.restore();
      }
    }

    // Player
    const ph = state.player.duck ? GAME_CONFIG.PLAYER.H_DUCKING : GAME_CONFIG.PLAYER.H_STANDING;
    const py = state.player.duck 
      ? (state.player.y - GAME_CONFIG.PLAYER.H_DUCKING) 
      : (state.player.y - GAME_CONFIG.PLAYER.H_STANDING);
    
    // 얼굴 이미지가 있으면 얼굴을 그리고, 없으면 기본 블록 표시
    if (state.faceImage) {
      // 이미지가 로드되었는지 확인 (더 관대한 조건)
      const isImageReady = (state.faceImage.complete && 
                           state.faceImage.naturalWidth > 0 && 
                           state.faceImage.naturalHeight > 0) ||
                           (state.faceImage.width > 0 && state.faceImage.height > 0);
      
      if (isImageReady) {
        // 얼굴 이미지를 플레이어 전체에 그리기 (네모를 완전히 대체)
        this.ctx.save();
        try {
          // 얼굴 이미지를 플레이어 크기에 맞게 그리기
          this.ctx.drawImage(
            state.faceImage,
            state.player.x,
            py,
            state.player.w,
            ph
          );
        } catch (e) {
          // 이미지 그리기 실패 시 기본 블록 사용
          console.error('Error drawing face image:', e);
          console.error('Face image info:', {
            complete: state.faceImage.complete,
            width: state.faceImage.width,
            height: state.faceImage.height,
            naturalWidth: state.faceImage.naturalWidth,
            naturalHeight: state.faceImage.naturalHeight,
            src: (state.faceImage.src && state.faceImage.src.substring(0, 80)) || null
          });
          this.ctx.fillStyle = "#8bd3ff";
          this.ctx.fillRect(state.player.x, py, state.player.w, ph);
        }
        this.ctx.restore();
      } else {
        // 이미지 로딩 중이면 기본 블록 표시
        this.ctx.fillStyle = "#8bd3ff";
        this.ctx.fillRect(state.player.x, py, state.player.w, ph);
      }
    } else {
      // 기본 블록 표시
      this.ctx.fillStyle = "#8bd3ff";
      this.ctx.fillRect(state.player.x, py, state.player.w, ph);
    }

    // Overlay text
    this.ctx.fillStyle = "#fff";
    this.ctx.font = "16px system-ui";
    const label = [
      calibrationReady ? "" : "Not calibrated",
      actions.jump ? "JUMP" : "",
      actions.duck ? "DUCK" : "",
      gameOver ? "GAME OVER" : ""
    ].filter(Boolean).join(" | ");
    this.ctx.fillText(label, 16, 28);
    
    // 목숨과 시간 표시 (게임 화면에)
    if (!gameOver) {
      this.ctx.save();
      this.ctx.fillStyle = "#fff";
      this.ctx.font = "bold 20px system-ui";
      
      // 배경 박스 (가독성을 위해)
      this.ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
      this.ctx.fillRect(16, this.canvas.height - 60, 200, 45);
      
      // 목숨 표시
      this.ctx.fillStyle = "#ff1744";
      this.ctx.font = "bold 20px system-ui";
      this.ctx.fillText(`❤️ ${state.lives}`, 24, this.canvas.height - 35);
      
      // 시간 표시
      this.ctx.fillStyle = "#fff";
      this.ctx.font = "bold 20px system-ui";
      this.ctx.fillText(`⏱️ ${state.score}s`, 24, this.canvas.height - 15);
      
      this.ctx.restore();
    }
  }

  // 장애물 이미지가 없을 때 기본 블록 그리기 (테두리 포함)
  drawObstacleFallback(x, y, w, h, type) {
    // 그림자
    this.ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    this.ctx.shadowBlur = 8;
    this.ctx.shadowOffsetX = 3;
    this.ctx.shadowOffsetY = 3;
    
    if (type === "low") {
      this.ctx.fillStyle = "#e5e5e5";  // 낮은 장애물 (회색)
    } else if (type === "high") {
      this.ctx.fillStyle = "#bdbdbd";  // 높은 장애물 (연한 회색)
    } else if (type === "duck") {
      this.ctx.fillStyle = "#ffa500";  // 스쿼트 장애물 (주황색) - 숙여서 피하기
    }
    this.ctx.fillRect(x, y, w, h);
    
    // 그림자 리셋
    this.ctx.shadowColor = 'transparent';
    this.ctx.shadowBlur = 0;
    this.ctx.shadowOffsetX = 0;
    this.ctx.shadowOffsetY = 0;
    
    // 테두리
    this.ctx.strokeStyle = '#ffffff';
    this.ctx.lineWidth = 3;
    this.ctx.strokeRect(x - 1, y - 1, w + 2, h + 2);
    
    this.ctx.strokeStyle = '#000000';
    this.ctx.lineWidth = 1;
    this.ctx.strokeRect(x, y, w, h);
  }
}
