import { HandWaveDetector } from '../controllers/pose/handWaveDetector.js';

// Game loop manager
export class GameLoop {
  constructor(engine, renderer, controllerMux, poseEngine, poseController, video, hudView, poseTestView = null, skeletonRenderer = null, handWaveDetector = null, faceCaptureService = null, onPhotoCapture = null, musicService = null, soundEffectService = null, leaderboardView = null) {
    this.onStartGame = null;  // 게임 시작 콜백
    this.onPhotoCapture = onPhotoCapture;  // 사진 촬영 콜백
    this.musicService = musicService;
    this.soundEffectService = soundEffectService;
    this.leaderboardView = leaderboardView; // 리더보드 뷰 (점수 표시용)
    this.gameOverSoundPlayed = false; // 게임 오버 효과음 재생 여부
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
    this.gameOverSoundPlayed = false; // 캘리브레이션 모드 시작 시 플래그 리셋
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

      // Hand wave detection - 오른손/왼손 구분
      // 오른손 흔들기: 게임 중에도 항상 감지 (사진 촬영)
      // 왼손 흔들기: 캘리브레이션 모드에서만 감지 (게임 시작)
      if (this.handWaveDetector && landmarks) {
        const waveResult = this.handWaveDetector.detectWave(landmarks);
        if (waveResult.detected) {
          if (waveResult.hand === 'right') {
            // 오른손 흔들기 → TAKE PHOTO (게임 중에도 가능)
            this.hudView.log("✋ 오른손 흔들기 감지! 얼굴 사진 촬영 중...");
            if (this.onPhotoCapture) {
              this.onPhotoCapture(landmarks);
            } else {
              this.capturePhoto(landmarks);
            }
          } else if (waveResult.hand === 'left' && this.calibrationMode) {
            // 왼손 흔들기 → CALIBRATE + 게임 시작 (캘리브레이션 모드에서만)
            this.hudView.log("👈 왼손 흔들기 감지! 게임 시작 중...");
            if (this.onStartGame) {
              this.onStartGame(landmarks);
            } else {
              this.capturePhotoAndCalibrate(landmarks);
            }
          }
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
        // 실제 시간(performance.now())을 전달하여 정확한 시간 계산
        result = this.engine.update(actions, now);
      }

      // Update UI
      if (result.score !== undefined) {
        this.hudView.setScore(result.score);
      }
      if (result.lives !== undefined) {
        this.hudView.setLives(result.lives);
      }
      // heartsCollected는 내부적으로만 추적하고 UI에는 표시하지 않음 (아이템을 먹으면 lives가 증가)

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
          // 게임 오버 효과음 재생 (한 번만)
          if (!this.gameOverSoundPlayed) {
            this.gameOverSoundPlayed = true;
            
            console.log('Game over detected, attempting to play sound...');
            
            if (this.soundEffectService) {
              // 효과음 재생 시도
              const playPromise = this.soundEffectService.play();
              
              if (playPromise && typeof playPromise.then === 'function') {
                playPromise.then(success => {
                  if (success) {
                    console.log('✅ Game over sound played successfully');
                    this.hudView.log("🔊 Game over sound played.");
                  } else {
                    console.warn('❌ Game over sound failed to play');
                    // 효과음 파일이 없거나 로드 실패
                    const audioEl = this.soundEffectService.audio;
                    if (audioEl) {
                      const source = audioEl.querySelector('source');
                      console.log('Audio element state:', {
                        hasSource: !!source,
                        sourceSrc: (source && source.src) || null,
                        audioSrc: audioEl.src,
                        readyState: audioEl.readyState,
                        error: audioEl.error
                      });
                      
                      if (!source || !source.src) {
                        this.hudView.log("💡 Tip: Add game over sound file (src/assets/gameover.mp3)");
                        this.hudView.log("   Uncomment <source> tag in #gameOverSound element in index.html");
                      } else {
                        this.hudView.log("⚠️ Game over sound file not loaded. Check console for details.");
                      }
                    }
                  }
                }).catch(e => {
                  console.error('❌ Game over sound play error:', e);
                  this.hudView.log("⚠️ Game over sound error: " + (e.message || e));
                });
              } else {
                console.warn('Sound effect play() did not return a promise');
              }
            } else {
              console.warn('❌ Sound effect service not available');
              this.hudView.log("⚠️ Sound effect service not initialized.");
            }
          }
          
          this.hudView.setStatus("GAME_OVER");
          this.hudView.log("Game over! Press R to restart, or:");
          this.hudView.log("✋ Wave right hand → Take new photo");
          this.hudView.log("👈 Wave left hand → Calibrate & Start game");
          
          // 게임 오버 시 리더보드 표시 (점수 포함)
          if (this.leaderboardView && result.score !== undefined) {
            this.leaderboardView.show(result.score);
          }
          
          // 게임 오버 시 캘리브레이션 모드로 전환하여 사진 다시 찍기 가능하게 함
          this.calibrationMode = true;
          
          // 게임 오버 시 음악 일시정지 (재시작 시 다시 재생)
          if (this.musicService) {
            this.musicService.pause();
          }
        } else {
          // 게임이 다시 시작되면 효과음 재생 플래그 리셋
          if (this.gameOverSoundPlayed) {
            this.gameOverSoundPlayed = false;
            console.log('Game over sound flag reset');
          }
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

  capturePhoto(landmarks) {
    // 사진만 촬영 (게임 시작 안 함)
    if (!this.faceCaptureService) return;
    
    const faceImagePromise = this.faceCaptureService.captureFaceFromVideo(this.video, landmarks);
    
    if (faceImagePromise) {
      this.hudView.log("📸 얼굴 사진 촬영 중...");
      
      faceImagePromise.then((faceImage) => {
        const state = this.engine.getState();
        state.setFaceImage(faceImage);
        this.hudView.log("✅ 얼굴 사진 촬영 완료!");
        console.log('Face image set in game state:', faceImage.width, 'x', faceImage.height);
        
        // 디버깅용 얼굴 미리보기 (테스트 패널이 열려있을 때만)
        const facePreviewEl = document.getElementById('facePreview');
        const facePreviewImg = document.getElementById('facePreviewImg');
        if (facePreviewEl && facePreviewImg) {
          facePreviewImg.src = faceImage.src;
          // 테스트 패널이 열려있을 때만 표시
          const poseTestView = this.poseTestView || (window.app && window.app.poseTestView);
          if (poseTestView && poseTestView.visible) {
            facePreviewEl.style.display = 'block';
          } else {
            facePreviewEl.style.display = 'none';
          }
        }
        
        // 콜백 호출 (사진만 촬영)
        if (this.onPhotoCapture) {
          this.onPhotoCapture(faceImage, null);
        }
      }).catch((e) => {
        this.hudView.log("얼굴 사진 촬영 실패: " + ((e && e.message) || e));
        console.error('Face image load error:', e);
      });
    } else {
      this.hudView.log("얼굴이 감지되지 않았습니다. 카메라 앞에 서주세요.");
    }
  }

  capturePhotoAndCalibrate(landmarks) {
    if (!this.faceCaptureService) return;

      // 얼굴 캡처 (Promise 반환)
      const faceImagePromise = this.faceCaptureService.captureFaceFromVideo(this.video, landmarks);
      
      if (faceImagePromise) {
        this.hudView.log("✋ Hand wave detected! 📸 Photo captured! Loading image...");
        
        faceImagePromise.then((faceImage) => {
          // 얼굴 이미지를 게임 상태에 설정
          const state = this.engine.getState();
          state.setFaceImage(faceImage);
          this.hudView.log("✅ Face image loaded!");
          console.log('Face image set in game state:', faceImage.width, 'x', faceImage.height);
          
          // 디버깅용 얼굴 미리보기는 버튼 클릭 시에만 표시 (자동 표시 안 함)
          // 이 메서드는 자동 호출되므로 미리보기 표시 안 함
          
          // 캘리브레이션 수행
          this.performCalibration(landmarks, faceImage);
        }).catch((e) => {
          this.hudView.log("Failed to load face image: " + ((e && e.message) || e));
          console.error('Face image load error:', e);
          // 얼굴 없이 캘리브레이션 진행
          this.performCalibration(landmarks, null);
        });
      } else {
        this.hudView.log("Failed to capture face. Calibrating without face...");
        // 얼굴 없이 캘리브레이션 진행
        this.performCalibration(landmarks, null);
      }
  }

  performCalibration(landmarks, faceImage) {
    // 캘리브레이션 수행
    const result = this.poseController.calibrate(landmarks);
    if (result.success) {
      this.hudView.log(`Calibrated. torsoY=${result.torsoY.toFixed(3)} hipY=${result.hipY.toFixed(3)}`);
      this.hudView.setStatus("CALIBRATED");
      this.hudView.log("Calibration complete! Starting game...");
      
      // 캘리브레이션 완료 후 게임 모드로 전환
      this.calibrationMode = false;
      
      // 얼굴 이미지가 있으면 임시 저장
      const savedFaceImage = faceImage || this.engine.getState().faceImage;
      
      this.engine.reset();
      // 얼굴 이미지 다시 설정 (reset 후 유지)
      if (savedFaceImage) {
        const state = this.engine.getState();
        state.setFaceImage(savedFaceImage);
        console.log('Face image restored after reset (performCalibration):', {
          hasImage: !!state.faceImage,
          complete: savedFaceImage.complete,
          width: savedFaceImage.naturalWidth,
          height: savedFaceImage.naturalHeight
        });
      }
      
      if (!this.isRunning()) {
        this.start();
      }
      
      this.hudView.setStatus("RUNNING");
      
      // 게임 시작 시 음악 재생
      if (this.musicService) {
        this.musicService.play().then(success => {
          if (!success) {
            this.hudView.log("💡 Click Music button to start music.");
          }
        });
      }
      
      // 콜백 호출
      if (this.onPhotoCapture) {
        this.onPhotoCapture(savedFaceImage, result);
      }
    } else {
      this.hudView.log("Calibration failed: " + result.message);
    }
  }
}
