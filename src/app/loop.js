import { HandWaveDetector } from '../controllers/pose/handWaveDetector.js';

// Game loop manager
export class GameLoop {
  constructor(engine, renderer, controllerMux, poseEngine, poseController, video, hudView, poseTestView = null, skeletonRenderer = null, handWaveDetector = null, faceCaptureService = null, onPhotoCapture = null) {
    this.engine = engine;
    this.renderer = renderer;
    this.controllerMux = controllerMux;
    this.poseEngine = poseEngine;
    this.poseController = poseController;
    this.video = video;
    this.hudView = hudView;
    this.poseTestView = poseTestView;
    this.skeletonRenderer = skeletonRenderer;
    this.handWaveDetector = handWaveDetector;
    this.faceCaptureService = faceCaptureService;
    this.onPhotoCapture = onPhotoCapture;
    
    this.rafId = null;
    this.lastPoseTs = 0;
    this.lastFpsTick = performance.now();
    this.frames = 0;
    this.poseInterval = 33; // ~30Hz
    this.lastLandmarks = null;
    this.calibrationMode = true;  // 초기에는 캘리브레이션 모드
  }

  startForCalibration() {
    // 캘리브레이션 모드로 시작
    this.calibrationMode = true;
    this.start();
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
      let landmarks = null;
      if (this.poseEngine.isLoaded() && this.video.readyState >= 2) {
        const state = this.engine.getState();
        // 캘리브레이션 모드에서는 항상 포즈 감지
        const shouldDetect = this.calibrationMode || (!state.over && now - this.lastPoseTs > this.poseInterval);
        
        if (shouldDetect && now - this.lastPoseTs > this.poseInterval) {
          this.lastPoseTs = now;
          try {
            landmarks = this.poseEngine.detect(this.video, now);
            if (landmarks) {
              this.lastLandmarks = landmarks;
              if (!this.calibrationMode) {
                actions = this.controllerMux.getActionsFromPose(landmarks);
              }
            }
          } catch (e) {
            // Silently fail - fall back to keyboard
          }
        } else if (this.lastLandmarks) {
          landmarks = this.lastLandmarks;
        }
      }

      // Update test view if available
      if (this.poseTestView && this.poseTestView.visible) {
        this.poseTestView.update(
          landmarks,
          actions,
          this.poseController.getCalibration(),
          !!landmarks
        );
      }

      // Render skeleton on video overlay
      if (this.skeletonRenderer && landmarks) {
        this.skeletonRenderer.render(landmarks);
      } else if (this.skeletonRenderer) {
        this.skeletonRenderer.clear();
      }

      // Hand wave detection for photo capture
      if (this.handWaveDetector && landmarks && this.calibrationMode) {
        if (this.handWaveDetector.detectWave(landmarks)) {
          this.hudView.log("✋ Hand wave detected! Taking photo and calibrating...");
          this.capturePhotoAndCalibrate(landmarks);
        }
      }

      // Merge with keyboard (pose actions take precedence, but keyboard can override)
      const kbActions = this.controllerMux.getActions();
      actions = {
        jump: actions.jump || kbActions.jump,
        duck: actions.duck || kbActions.duck
      };

      // Update game (캘리브레이션 모드에서는 게임 업데이트 안함)
      let result = { gameOver: false };
      if (!this.calibrationMode) {
        result = this.engine.update(actions);
      }

      // Update UI
      if (result.score !== undefined) {
        this.hudView.setScore(result.score);
        if (result.itemsCollected !== undefined) {
          this.hudView.setItemsCollected(result.itemsCollected, result.itemScore);
        }
      }

      // Render (캘리브레이션 모드에서는 빈 화면만)
      if (!this.calibrationMode) {
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
      } else {
        // 캘리브레이션 모드에서는 빈 화면만
        this.renderer.clear();
        const ctx = this.renderer.ctx;
        ctx.fillStyle = "#111";
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        ctx.fillStyle = "#fff";
        ctx.font = "16px system-ui";
        ctx.fillText("Calibration mode - Click 'Calibrate' button when ready", 16, 28);
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

  capturePhotoAndCalibrate(landmarks) {
    if (!this.faceCaptureService || !this.onPhotoCapture) return;

    // 얼굴 캡처
    const faceImage = this.faceCaptureService.captureFaceFromVideo(this.video, landmarks);
    
    if (faceImage) {
      this.hudView.log("📸 Photo captured!");
      
      // 얼굴 이미지를 게임 상태에 설정
      const state = this.engine.getState();
      state.setFaceImage(faceImage);
      
      // 캘리브레이션 수행
      const result = this.poseController.calibrate(landmarks);
      if (result.success) {
        this.hudView.log(`Calibrated. torsoY=${result.torsoY.toFixed(3)} hipY=${result.hipY.toFixed(3)}`);
        this.hudView.setStatus("CALIBRATED");
        this.hudView.log("Calibration complete! Starting game...");
        
        // 캘리브레이션 완료 후 게임 모드로 전환
        this.calibrationMode = false;
        this.engine.reset();
        // 얼굴 이미지 다시 설정 (reset 후 유지)
        this.engine.getState().setFaceImage(faceImage);
        
        if (!this.isRunning()) {
          this.start();
        }
        
        this.hudView.setStatus("RUNNING");
        
        // 콜백 호출
        if (this.onPhotoCapture) {
          this.onPhotoCapture(faceImage, result);
        }
      } else {
        this.hudView.log("Calibration failed: " + result.message);
      }
    } else {
      this.hudView.log("Failed to capture face. Make sure face is visible.");
    }
  }
}
