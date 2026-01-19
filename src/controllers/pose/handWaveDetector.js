import { POSE_LANDMARKS, HAND_WAVE_CONFIG } from '../../engine/constants.js';

// Hand wave detector - detects waving hand gesture
export class HandWaveDetector {
  constructor() {
    this.lWristHistory = [];
    this.rWristHistory = [];
    this.lastWaveTime = 0;
    this.waveCooldown = 1000;  // 1초 쿨다운
  }

  getWrist(landmarks, wristIdx) {
    const wrist = landmarks?.[wristIdx];
    return wrist && wrist.visibility > 0.3 ? { x: wrist.x, y: wrist.y } : null;
  }

  detectWave(landmarks) {
    if (!landmarks || landmarks.length === 0) return false;

    const now = performance.now();
    if (now - this.lastWaveTime < this.waveCooldown) {
      return false;  // 쿨다운 중
    }

    const lWrist = this.getWrist(landmarks, POSE_LANDMARKS.L_WRIST);
    const rWrist = this.getWrist(landmarks, POSE_LANDMARKS.R_WRIST);

    let detected = false;

    // 왼쪽 손 흔들기 감지
    if (lWrist) {
      this.lWristHistory.push(lWrist);
      if (this.lWristHistory.length > HAND_WAVE_CONFIG.HISTORY_SIZE) {
        this.lWristHistory.shift();
      }

      if (this.lWristHistory.length >= 3) {
        const recent = this.lWristHistory.slice(-3);
        const xValues = recent.map(w => w.x);
        const minX = Math.min(...xValues);
        const maxX = Math.max(...xValues);
        const range = maxX - minX;

        if (range > HAND_WAVE_CONFIG.WAVE_THRESHOLD) {
          // 속도 체크 (변화량)
          const speed = Math.abs(recent[recent.length - 1].x - recent[0].x);
          if (speed > HAND_WAVE_CONFIG.WAVE_MIN_SPEED) {
            detected = true;
          }
        }
      }
    }

    // 오른쪽 손 흔들기 감지
    if (!detected && rWrist) {
      this.rWristHistory.push(rWrist);
      if (this.rWristHistory.length > HAND_WAVE_CONFIG.HISTORY_SIZE) {
        this.rWristHistory.shift();
      }

      if (this.rWristHistory.length >= 3) {
        const recent = this.rWristHistory.slice(-3);
        const xValues = recent.map(w => w.x);
        const minX = Math.min(...xValues);
        const maxX = Math.max(...xValues);
        const range = maxX - minX;

        if (range > HAND_WAVE_CONFIG.WAVE_THRESHOLD) {
          const speed = Math.abs(recent[recent.length - 1].x - recent[0].x);
          if (speed > HAND_WAVE_CONFIG.WAVE_MIN_SPEED) {
            detected = true;
          }
        }
      }
    }

    if (detected) {
      this.lastWaveTime = now;
      this.lWristHistory = [];
      this.rWristHistory = [];
    }

    return detected;
  }
}
