import { GameEngine } from '../engine/gameEngine.js';
import { MediaPipePoseEngine } from '../controllers/pose/mediapipePoseEngine.js';
import { PoseController } from '../controllers/pose/poseController.js';
import { HandWaveDetector } from '../controllers/pose/handWaveDetector.js';
import { KeyboardController } from '../controllers/keyboardController.js';
import { ControllerMux } from '../controllers/controllerMux.js';
import { CanvasRenderer } from '../render/canvasRenderer.js';
import { SkeletonRenderer } from '../render/skeletonRenderer.js';
import { FaceCaptureService } from '../services/faceCaptureService.js';
import { MusicService } from '../services/musicService.js';
import { SoundEffectService } from '../services/soundEffectService.js';
import { HudView } from '../ui/hudView.js';
import { LeaderboardView } from '../ui/leaderboardView.js';
import { PoseTestView } from '../ui/poseTestView.js';
import { GameLoop } from './loop.js';

// Main application controller
export class App {
  constructor(config) {
    console.log('[App] Constructor called');
    this.video = config.video;
    this.canvas = config.canvas;
    this.skeletonCanvas = config.skeletonCanvas;
    this.buttons = config.buttons;
    this.statusEl = config.statusEl;
    this.scoreEl = config.scoreEl;
    this.itemsEl = config.itemsEl;
    this.livesEl = config.livesEl;
    this.fpsEl = config.fpsEl;
    this.hudEl = config.hudEl;
    this.facingSel = config.facingSel;
    this.musicEl = config.musicEl;
    this.gameOverSoundEl = config.gameOverSoundEl;
    
    console.log('[App] buttons.start:', this.buttons && this.buttons.start);
    console.log('[App] video element:', this.video);
    console.log('[App] facingSel:', this.facingSel);

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
    this.musicService = new MusicService(this.musicEl);
    this.soundEffectService = new SoundEffectService(this.gameOverSoundEl);
    this.hudView = new HudView(this.statusEl, this.scoreEl, this.fpsEl, this.hudEl, this.itemsEl, this.livesEl);
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
      null,  // onPhotoCapture (나중에 설정)
      this.musicService,
      this.soundEffectService,
      this.leaderboardView  // 리더보드 뷰 전달
    );
    
    // GameLoop 콜백 설정 - 손 흔들기 감지
    this.gameLoop.onStartGame = (landmarks) => {
      this.calibrate();
    };
    
    this.gameLoop.onPhotoCapture = (landmarks) => {
      this.takePhoto();
    };

    this.stream = null;
    this.photoTaken = false;  // 사진 촬영 완료 여부
    
    this.setupListeners();
  }

  setupListeners() {
    // Button listeners (start와 loadPose 버튼은 자동 시작으로 인해 제거됨)
    console.log('[setupListeners] Setting up listeners...');
    console.log('[setupListeners] buttons:', this.buttons);
    if (this.buttons.takePhoto) {
      this.buttons.takePhoto.addEventListener("click", () => this.takePhoto());
    }
    if (this.buttons.test) {
      this.buttons.test.addEventListener("click", () => this.poseTestView.toggle());
    }
    if (this.buttons.music) {
      this.buttons.music.addEventListener("click", () => this.toggleMusic());
    }

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
    
    console.log('[setupListeners] All listeners set up');
  }

  async startCamera() {
    console.log('[startCamera] Method called');
    this.hudView.clear();
    this.hudView.setStatus("CAMERA_START");
    this.hudView.log("Starting camera...");

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      const errorMsg = "ERROR: getUserMedia not supported. Use HTTPS or localhost.";
      console.error('[startCamera]', errorMsg);
      this.hudView.log(errorMsg);
      this.hudView.setStatus("CAMERA_FAIL");
      return;
    }

    if (this.stream) {
      console.log('[startCamera] Stopping existing stream');
      this.stopCamera();
    }

    try {
      console.log('[startCamera] Requesting camera access...');
      const facingMode = (this.facingSel && this.facingSel.value) || 'user';
      console.log('[startCamera] Facing mode:', facingMode);
      
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      console.log('[startCamera] Camera stream obtained:', this.stream);

      if (!this.video) {
        console.error('[startCamera] ERROR: video element is null!');
        this.hudView.log("ERROR: Video element not found!");
        return;
      }

      this.video.srcObject = this.stream;
      console.log('[startCamera] Video srcObject set, playing...');
      await this.video.play();
      console.log('[startCamera] Video playing');
      
      // Show video container in small overlay
      if (this.video.parentElement) {
        this.video.parentElement.style.display = 'block';
        console.log('[startCamera] Video container displayed');
      }

      this.hudView.log("✅ Camera OK.");
      this.hudView.setStatus("CAMERA_OK");

      console.log('[startCamera] Success');
      
      // 카메라 시작 후 자동으로 포즈 엔진 로드
      console.log('[startCamera] Auto-loading pose engine...');
      setTimeout(() => {
        this.loadPoseEngine();
      }, 500); // 카메라가 완전히 준비될 때까지 약간의 지연
    } catch (e) {
      const errorName = (e && e.name) || "Unknown";
      const errorMessage = (e && e.message) || e;
      const errorMsg = `ERROR: ${errorName} - ${errorMessage}`;
      console.error('[startCamera] Error:', e);
      console.error('[startCamera] Error details:', {
        name: errorName,
        message: errorMessage,
        stack: (e && e.stack) || undefined
      });
      this.hudView.log(errorMsg);
      if (errorName === 'NotAllowedError' || errorName === 'PermissionDeniedError') {
        this.hudView.log("💡 Please allow camera access in your browser settings.");
      } else if (errorName === 'NotFoundError' || errorName === 'DevicesNotFoundError') {
        this.hudView.log("💡 No camera found. Please connect a camera.");
      } else if (errorName === 'NotReadableError' || errorName === 'TrackStartError') {
        this.hudView.log("💡 Camera is already in use by another application.");
      }
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

    if (this.buttons.takePhoto) {
      this.buttons.takePhoto.disabled = true;
    }

    this.gameLoop.stop();
  }

  async loadPoseEngine() {
    if (!this.stream) {
      this.hudView.log("Start camera first.");
      return;
    }

    this.hudView.clear();
    this.hudView.setStatus("LOADING_POSE");
    this.hudView.log("Loading pose engine...");

    if (this.buttons.loadPose) {
      this.buttons.loadPose.disabled = true;
    }

    try {
      await this.poseEngine.initialize();
      this.hudView.log("Pose engine loaded.");
      this.hudView.setStatus("POSE_LOADED");

      this.buttons.takePhoto.disabled = false;
      if (!this.gameLoop.isRunning()) {
        this.gameLoop.startForCalibration();
        this.hudView.setStatus("READY");
        this.hudView.log("Ready! Steps:");
        this.hudView.log("1. 📸 Take Photo - Capture your face for character");
        this.hudView.log("2. ✋ Wave left hand - Start game (calibrate)");
      }
    } catch (e) {
      this.hudView.log("ERROR loading pose: " + ((e && e.message) || e));
      this.hudView.setStatus("POSE_FAIL");
      this.buttons.loadPose.disabled = false;
    }
  }

  takePhoto() {
    if (!this.poseEngine.isLoaded()) {
      this.hudView.log("Pose engine not loaded.");
      return;
    }

    try {
      const now = performance.now();
      const landmarks = this.poseEngine.detect(this.video, now);
      
      if (!landmarks) {
        this.hudView.log("Photo failed: no pose detected. Make sure you are visible in camera.");
        return;
      }

      // 얼굴 캡처 (Promise 반환)
      const faceImagePromise = this.faceCaptureService.captureFaceFromVideo(this.video, landmarks);
      
      if (faceImagePromise) {
        this.hudView.log("📸 Photo captured! Loading image...");
        
        faceImagePromise.then((faceImage) => {
          // 얼굴 이미지를 게임 상태에 설정
          const state = this.engine.getState();
          state.setFaceImage(faceImage);
          this.hudView.log("✅ Face image loaded! Your character will use this face in game.");
          console.log('Face image set in game state:', {
            width: faceImage.width,
            height: faceImage.height,
            complete: faceImage.complete,
            naturalWidth: faceImage.naturalWidth,
            naturalHeight: faceImage.naturalHeight,
            hasStateImage: !!state.faceImage
          });
          
          // 디버깅용 얼굴 미리보기에 표시 (테스트 패널이 열려있을 때만)
          const facePreviewEl = document.getElementById('facePreview');
          const facePreviewImg = document.getElementById('facePreviewImg');
          if (facePreviewEl && facePreviewImg) {
            facePreviewImg.src = faceImage.src;
            // 테스트 패널이 열려있을 때만 표시
            if (this.poseTestView && this.poseTestView.visible) {
              facePreviewEl.style.display = 'block';
              console.log('Face preview displayed (test panel open)');
            } else {
              facePreviewEl.style.display = 'none';
            }
          }
          
          // 게임이 이미 실행 중이면 즉시 반영
          if (this.gameLoop.isRunning() && !this.gameLoop.calibrationMode) {
            const currentState = this.engine.getState();
            currentState.setFaceImage(faceImage);
            console.log('Face image set in running game state');
          }
        }).catch((e) => {
          this.hudView.log("Failed to load face image: " + ((e && e.message) || e));
          console.error('Face image load error:', e);
        });
      } else {
        this.hudView.log("Failed to capture face. Make sure face is clearly visible.");
      }
    } catch (e) {
      this.hudView.log("Photo error: " + ((e && e.message) || e));
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
        // 얼굴 이미지 저장 (reset 전에)
        const savedFaceImage = this.engine.getState().faceImage || 
                               (this.faceCaptureService.hasFaceImage() ? this.faceCaptureService.getFaceImage() : null);
        
        if (this.gameLoop.isRunning()) {
          this.gameLoop.calibrationMode = false;
          this.engine.reset();
          
          // 얼굴 이미지 복원
          if (savedFaceImage) {
            const state = this.engine.getState();
            state.setFaceImage(savedFaceImage);
            console.log('Face image restored after reset (running):', {
              hasImage: !!state.faceImage,
              complete: savedFaceImage.complete
            });
          }
          
          this.hudView.setStatus("RUNNING");
          // 게임 시작 시 음악 재생 (사용자 인터랙션 후이므로 가능)
          this.musicService.play().then(success => {
            if (success) {
              this.hudView.log("🎵 Background music started!");
            } else {
              this.hudView.log("💡 Click Music button to start music if needed.");
            }
          });
        } else {
          this.gameLoop.start();
          this.engine.reset();
          
          // 얼굴 이미지 복원
          if (savedFaceImage) {
            const state = this.engine.getState();
            state.setFaceImage(savedFaceImage);
            console.log('Face image restored after reset (new):', {
              hasImage: !!state.faceImage,
              complete: savedFaceImage.complete
            });
          }
          
          this.hudView.setStatus("RUNNING");
          // 게임 시작 시 음악 재생 (사용자 인터랙션 후이므로 가능)
          this.musicService.play().then(success => {
            if (success) {
              this.hudView.log("🎵 Background music started!");
            } else {
              this.hudView.log("💡 Click Music button to start music if needed.");
            }
          });
        }
      } else {
        this.hudView.log("Calibrate failed: " + result.message);
      }
    } catch (e) {
      this.hudView.log("Calibrate error: " + ((e && e.message) || e));
    }
  }

  resetGame() {
    const state = this.engine.getState();
    const finalScore = state.score;
    
    if (finalScore > 0 && state.over) {
      this.leaderboardView.show(finalScore);
    }
    
    // 게임 오버 효과음 재생 플래그 리셋
    if (this.gameLoop) {
      this.gameLoop.gameOverSoundPlayed = false;
      console.log('Game reset: game over sound flag cleared');
    }
    
    this.engine.reset();
    
    // 얼굴 이미지 유지 (새로 찍은 사진이 있으면 사용, 없으면 기존 이미지 유지)
    if (this.faceCaptureService.hasFaceImage()) {
      const faceImage = this.faceCaptureService.getFaceImage();
      state.setFaceImage(faceImage);
    }
    
    this.hudView.setScore(0);
    if (this.hudView.livesEl) {
      this.hudView.setLives(3);
    }
    // heartsCollected는 내부적으로만 추적 (UI 표시 안 함)
    this.hudView.log("Game reset.");
    
    // 게임 오버 후 재시작 시 캘리브레이션 모드로 설정하여 사진 다시 찍기 가능하게 함
    if (this.gameLoop && this.gameLoop.isRunning()) {
      this.gameLoop.calibrationMode = true;
      this.poseController.calibration.ready = false;  // 캘리브레이션 초기화하여 다시 캘리브레이션 필요하게 함
      
      // Take Photo 버튼 활성화
      if (this.buttons && this.buttons.takePhoto) {
        this.buttons.takePhoto.disabled = false;
      }
      
      this.hudView.setStatus("READY");
      this.hudView.log("Ready! You can:");
      this.hudView.log("1. 📸 Take Photo - Capture a new face (optional)");
      this.hudView.log("2. ✋ Wave hand OR click 'Calibrate' - Start game");
    }
  }

  async toggleMusic() {
    if (this.musicService.getIsPlaying()) {
      this.musicService.pause();
      this.buttons.music.textContent = "🔇 Music";
      this.hudView.log("Music paused.");
    } else {
      // 사용자 인터랙션으로 재생 (브라우저 정책 준수)
      const success = await this.musicService.play();
      if (success) {
        this.buttons.music.textContent = "🔊 Music";
        this.hudView.log("🎵 Music playing!");
      } else {
        this.buttons.music.textContent = "🔇 Music";
        this.hudView.log("⚠️ Music failed to play. Check console for details.");
        console.log('Music source:', this.musicEl.src);
        console.log('Music readyState:', this.musicEl.readyState);
        console.log('Music error:', this.musicEl.error);
      }
    }
  }

  initialize() {
    this.hudView.log("JS loaded.");
    this.hudView.log("isSecureContext: " + window.isSecureContext);
    this.hudView.log("Tip: Start camera → Load pose → Take Photo → Calibrate.");
    
    // 음악 파일이 있으면 로드 상태 확인
    if (this.musicEl && this.musicEl.src) {
      this.musicEl.addEventListener('loadeddata', () => {
        this.hudView.log("🎵 Music loaded and ready!");
      }, { once: true });
      
      this.musicEl.addEventListener('error', (e) => {
        console.error('Music file error:', e);
        this.hudView.log("⚠️ Music file not found. Please check the audio file path.");
      }, { once: true });
      
      if (this.musicEl.readyState >= 2) {
        this.hudView.log("🎵 Music loaded and ready!");
      }
    } else {
      this.hudView.log("💡 Tip: Add music by uncommenting <source> tags in audio element.");
    }
    
    // 게임 오버 효과음 파일 확인 및 강제 로드
    if (this.gameOverSoundEl) {
      const gameOverSource = this.gameOverSoundEl.querySelector('source');
      if (gameOverSource && gameOverSource.src) {
        console.log('Game over sound source found:', gameOverSource.src);
        
        if (!this.gameOverSoundEl.src || this.gameOverSoundEl.src !== gameOverSource.src) {
          this.gameOverSoundEl.src = gameOverSource.src;
          this.gameOverSoundEl.load();
          console.log('Game over sound source set and loading...');
        }
        
        this.gameOverSoundEl.addEventListener('loadeddata', () => {
          console.log('✅ Game over sound loaded successfully!');
          this.hudView.log("🔊 Game over sound loaded and ready!");
        }, { once: true });
        
        this.gameOverSoundEl.addEventListener('canplay', () => {
          console.log('✅ Game over sound can play!');
        }, { once: true });
        
        this.gameOverSoundEl.addEventListener('error', (e) => {
          console.error('❌ Game over sound file error:', this.gameOverSoundEl.error);
          this.hudView.log("⚠️ Game over sound file not found. Please check: src/assets/gameover.mp3");
        }, { once: true });
        
        if (this.gameOverSoundEl.readyState >= 2) {
          console.log('✅ Game over sound already loaded');
          this.hudView.log("🔊 Game over sound loaded and ready!");
        }
      } else {
        console.warn('❌ No game over sound source found in HTML');
        this.hudView.log("💡 Tip: Add game over sound by adding <source> tag in #gameOverSound element.");
      }
    } else {
      console.warn('❌ Game over sound audio element not found');
      this.hudView.log("⚠️ Game over sound element not found.");
    }
  }
}
