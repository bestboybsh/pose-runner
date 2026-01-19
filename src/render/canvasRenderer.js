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
  }

  clear() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

    render(state, actions, calibrationReady, gameOver) {
    this.clear();
    
    // Background
    this.ctx.fillStyle = "#111";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Ground line
    const groundY = state.player.y; // Use player's ground position
    this.ctx.fillStyle = "#222";
    this.ctx.fillRect(0, groundY + 10, this.canvas.width, 4);

    // Obstacles
    for (const ob of state.obstacles) {
      if (ob.type === "low") {
        this.ctx.fillStyle = "#e5e5e5";  // 낮은 장애물 (회색)
      } else if (ob.type === "high") {
        this.ctx.fillStyle = "#bdbdbd";  // 높은 장애물 (연한 회색)
      } else if (ob.type === "duck") {
        this.ctx.fillStyle = "#ff6b6b";  // 스쿼트 장애물 (빨간색) - 중간부터 위까지
      }
      this.ctx.fillRect(ob.x, ob.y - ob.h, ob.w, ob.h);
    }

    // Items
    for (const item of state.items) {
      if (!item.collected) {
        // 별 모양 아이템
        this.ctx.fillStyle = "#ffd700";
        this.ctx.strokeStyle = "#ffed4e";
        this.ctx.lineWidth = 2;
        
        const centerX = item.x + item.w / 2;
        const centerY = item.y - item.h / 2;
        const radius = item.w / 2;
        
        // 별 그리기
        this.ctx.beginPath();
        for (let i = 0; i < 5; i++) {
          const angle = (i * 4 * Math.PI / 5) - Math.PI / 2;
          const x = centerX + radius * Math.cos(angle);
          const y = centerY + radius * Math.sin(angle);
          if (i === 0) {
            this.ctx.moveTo(x, y);
          } else {
            this.ctx.lineTo(x, y);
          }
        }
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.stroke();
      }
    }

    // Player
    const ph = state.player.duck ? 26 : 46;
    const py = state.player.duck 
      ? (state.player.y - 26) 
      : (state.player.y - 46);
    
    // 얼굴 이미지가 있으면 얼굴을 그리고, 없으면 기본 블록 표시
    if (state.faceImage && state.faceImage.complete) {
      // 얼굴 이미지를 플레이어 상단에 그리기
      const faceSize = Math.min(state.player.w, ph * 0.6);
      const faceY = py + ph - faceSize - 2;
      this.ctx.save();
      this.ctx.drawImage(
        state.faceImage,
        state.player.x + (state.player.w - faceSize) / 2,
        faceY,
        faceSize,
        faceSize
      );
      this.ctx.restore();
      
      // 몸통은 반투명하게
      this.ctx.fillStyle = "rgba(139, 211, 255, 0.5)";
      this.ctx.fillRect(state.player.x, py, state.player.w, ph);
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
  }
}
