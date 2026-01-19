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
      this.ctx.fillStyle = ob.type === "low" ? "#e5e5e5" : "#bdbdbd";
      this.ctx.fillRect(ob.x, ob.y - ob.h, ob.w, ob.h);
    }

    // Player
    const ph = state.player.duck ? 26 : 46;
    const py = state.player.duck 
      ? (state.player.y - 26) 
      : (state.player.y - 46);
    this.ctx.fillStyle = "#8bd3ff";
    this.ctx.fillRect(state.player.x, py, state.player.w, ph);

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
