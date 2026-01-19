// Game loop manager
export class GameLoop {
  constructor(engine, renderer, controllerMux, poseEngine, poseController, video, hudView) {
    this.engine = engine;
    this.renderer = renderer;
    this.controllerMux = controllerMux;
    this.poseEngine = poseEngine;
    this.poseController = poseController;
    this.video = video;
    this.hudView = hudView;
    
    this.rafId = null;
    this.lastPoseTs = 0;
    this.lastFpsTick = performance.now();
    this.frames = 0;
    this.poseInterval = 33; // ~30Hz
  }

  start() {
    if (this.rafId) return;
    
    const tick = () => {
      this.rafId = requestAnimationFrame(tick);

      // FPS calculation
      this.frames += 1;
      const now = performance.now();
      if (now - this.lastFpsTick >= 1000) {
        this.hudView.setFPS(this.frames);
        this.frames = 0;
        this.lastFpsTick = now;
      }

      // Get actions
      let actions = { jump: false, duck: false };

      // Try pose detection
      if (this.poseEngine.isLoaded() && this.video.readyState >= 2) {
        const state = this.engine.getState();
        if (!state.over && now - this.lastPoseTs > this.poseInterval) {
          this.lastPoseTs = now;
          try {
            const landmarks = this.poseEngine.detect(this.video, now);
            if (landmarks) {
              actions = this.controllerMux.getActionsFromPose(landmarks);
            }
          } catch (e) {
            // Silently fail - fall back to keyboard
          }
        }
      }

      // Merge with keyboard (pose actions take precedence, but keyboard can override)
      const kbActions = this.controllerMux.getActions();
      actions = {
        jump: actions.jump || kbActions.jump,
        duck: actions.duck || kbActions.duck
      };

      // Update game
      const result = this.engine.update(actions);

      // Update UI
      if (result.score !== undefined) {
        this.hudView.setScore(result.score);
      }

      // Render
      const gameState = this.engine.getState();
      this.renderer.render(
        gameState,
        actions,
        this.poseController.isCalibrated(),
        gameState.over
      );

      // Handle game over
      if (result.gameOver) {
        this.hudView.setStatus("GAME_OVER (R)");
        this.hudView.log("Game over. Press R to restart.");
      }
    };

    this.rafId = requestAnimationFrame(tick);
    this.hudView.log("Game loop started.");
  }

  stop() {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.hudView.setFPS(0);
    this.hudView.log("Game loop stopped.");
  }

  isRunning() {
    return this.rafId !== null;
  }
}
