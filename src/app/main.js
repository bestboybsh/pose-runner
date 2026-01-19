import { GameEngine } from '../engine/gameEngine.js';
import { MediaPipePoseEngine } from '../controllers/pose/mediapipePoseEngine.js';
import { PoseController } from '../controllers/pose/poseController.js';
import { HandWaveDetector } from '../controllers/pose/handWaveDetector.js';
import { KeyboardController } from '../controllers/keyboardController.js';
import { ControllerMux } from '../controllers/controllerMux.js';
import { CanvasRenderer } from '../render/canvasRenderer.js';
import { SkeletonRenderer } from '../render/skeletonRenderer.js';
import { FaceCaptureService } from '../services/faceCaptureService.js';
import { HudView } from '../ui/hudView.js';
import { LeaderboardView } from '../ui/leaderboardView.js';
import { PoseTestView } from '../ui/poseTestView.js';
import { GameLoop } from './loop.js';
import { GAME_CONFIG } from '../engine/constants.js';

// Main application controller
export class App {
  constructor(config) {
    this.video = config.video;
    this.canvas = config.canvas;
    this.skeletonCanvas = config.skeletonCanvas;
    this.buttons = config.buttons;
    this.statusEl = config.statusEl;
    this.scoreEl = config.scoreEl;
    this.itemsEl = config.itemsEl;
    this.fpsEl = config.fpsEl;
    this.hudEl = config.hudEl;
    this.facingSel = config.facingSel;

    // Initialize components
    this.engine = new GameEngine();
    this.poseEngine = new MediaPipePoseEngine();
    this.poseController = new PoseController();
    this.keyboardController = new KeyboardController();
    this.controllerMux = new ControllerMux(this.poseController, this.keyboardController);
    this.renderer = new CanvasRenderer(this.canvas);
    this.skeletonRenderer = new SkeletonRenderer(this.skeletonCanvas, this.video);
    this.handWaveDetector = new HandWaveDetector();
    this.faceCaptureService = new FaceCaptureService();
    this.hudView = new HudView(this.statusEl, this.scoreEl, this.fpsEl, this.hudEl, this.itemsEl);
    this.leaderboardView = new LeaderboardView(config.leaderboardEl);
    this.poseTestView = new PoseTestView(config.poseTestEl);
    
    this.gameLoop = new GameLoop(
      this.engine,
      this.renderer,
      this.controllerMux,
      this.poseEngine,
      this.poseController,
      this.video,
      this.hudView,
      this.poseTestView,
      this.skeletonRenderer,
      this.handWaveDetector,
      this.faceCaptureService,
      (faceImage, calibrationResult) => {
        // 사진 캡처 및 캘리브레이션 완료 콜백
        this.hudView.log("✅ Face captured and calibrated! Game starting...");
      }
    );

    this.stream = null;
    this.setupListeners();
  }

  setupListeners() {
    // Button listeners
    this.buttons.start.addEventListener("click", () => this.startCamera());
    this.buttons.loadPose.addEventListener("click", () => this.loadPoseEngine());
    this.buttons.calibrate.addEventListener("click", () => this.calibrate());
    this.buttons.stop.addEventListener("click", () => this.stopCamera());
    this.buttons.test.addEventListener("click", () => this.poseTestView.toggle());

    // Keyboard listeners
    window.addEventListener("keydown", (e) => {
      if (e.code === "KeyR") {
        this.resetGame();
      }
      // Toggle test view with 'T' key
      if (e.code === "KeyT") {
        this.poseTestView.toggle();
      }
    });
  }

  async startCamera() {
    this.hudView.clear();
    this.hudView.setStatus("CAMERA_START");
    this.hudView.log("Starting camera...");

    if (!navigator.mediaDevices?.getUserMedia) {
      this.hudView.log("ERROR: getUserMedia not supported.");
      this.hudView.setStatus("CAMERA_FAIL");
      return;
    }

    if (this.stream) this.stopCamera();

    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: { ideal: this.facingSel.value },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });

      this.video.srcObject = this.stream;
      await this.video.play();
      
      // Show video container in small overlay
      if (this.video.parentElement) {
        this.video.parentElement.style.display = 'block';
      }

      this.hudView.log("Camera OK.");
      this.hudView.setStatus("CAMERA_OK");

      this.buttons.stop.disabled = false;
      this.buttons.loadPose.disabled = false;
    } catch (e) {
      this.hudView.log("ERROR: " + (e?.name || "Unknown") + " " + (e?.message || e));
      this.hudView.setStatus("CAMERA_FAIL");
    }
  }

  stopCamera() {
    if (this.stream) {
      this.stream.getTracks().forEach(t => t.stop());
    }
    this.stream = null;
    this.video.srcObject = null;
    if (this.video.parentElement) {
      this.video.parentElement.style.display = 'none';
    }
    this.skeletonRenderer.clear();
    this.hudView.setStatus("STOPPED");
    this.hudView.log("Stopped camera.");

    this.buttons.stop.disabled = true;
    this.buttons.loadPose.disabled = true;
    this.buttons.calibrate.disabled = true;

    this.gameLoop.stop();
  }

  async loadPoseEngine() {
    try {
      this.hudView.setStatus("POSE_LOADING");
      this.hudView.log("Loading pose engine...");
      
      await this.poseEngine.initialize();
      
      this.hudView.setStatus("POSE_OK");
      this.hudView.log("Pose engine OK.");
      
      // 캘리브레이션 버튼 활성화 (게임 시작 전에도 가능)
      this.buttons.calibrate.disabled = false;
      
      // 포즈 감지 및 스켈레톤 렌더링을 위한 루프 시작 (게임은 아직 시작 안함)
      if (!this.gameLoop.isRunning()) {
        this.gameLoop.startForCalibration();  // 캘리브레이션용 루프만 시작
        this.hudView.setStatus("READY");
        this.hudView.log("Ready to calibrate.");
        this.hudView.log("✋ Wave your hand to take a photo and calibrate automatically!");
        this.hudView.log("Or click 'Calibrate' button manually.");
      }
    } catch (e) {
      this.hudView.log("POSE LOAD ERROR: " + (e?.message || e));
      this.hudView.setStatus("POSE_FAIL");
    }
  }

  calibrate() {
    if (!this.poseEngine.isLoaded()) {
      this.hudView.log("Pose engine not loaded.");
      return;
    }

    try {
      const now = performance.now();
      const landmarks = this.poseEngine.detect(this.video, now);
      
      if (!landmarks) {
        this.hudView.log("Calibrate failed: no pose detected. Make sure full body is visible and light is good.");
        return;
      }

      const result = this.poseController.calibrate(landmarks);
      if (result.success) {
        this.hudView.log(`Calibrated. torsoY=${result.torsoY.toFixed(3)} hipY=${result.hipY.toFixed(3)}`);
        this.hudView.setStatus("CALIBRATED");
        this.hudView.log("Calibration complete! Starting game...");
        
        // 캘리브레이션 완료 후 게임 모드로 전환
        if (this.gameLoop.isRunning()) {
          this.gameLoop.calibrationMode = false;
          this.engine.reset();
          this.hudView.setStatus("RUNNING");
        } else {
          this.gameLoop.start();
          this.engine.reset();
          this.hudView.setStatus("RUNNING");
        }
      } else {
        this.hudView.log("Calibrate failed: " + result.message);
      }
    } catch (e) {
      this.hudView.log("Calibrate error: " + (e?.message || e));
    }
  }

  resetGame() {
    const state = this.engine.getState();
    const finalScore = state.score;
    
    if (finalScore > 0 && state.over) {
      this.leaderboardView.show(finalScore);
    }
    
    this.engine.reset();
    this.hudView.setScore(0);
    if (this.hudView.itemsEl) {
      this.hudView.setItemsCollected(0, 0);
    }
    this.hudView.log("Game reset.");
    
    if (this.gameLoop.isRunning()) {
      this.hudView.setStatus(this.poseController.isCalibrated() ? "RUNNING" : "READY");
    }
  }

  initialize() {
    this.hudView.log("JS loaded.");
    this.hudView.log("isSecureContext: " + window.isSecureContext);
    this.hudView.log("Tip: Start camera → Load pose → Calibrate.");
  }
}
