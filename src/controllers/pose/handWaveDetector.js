import { POSE_LANDMARKS, HAND_WAVE_CONFIG } from '../../engine/constants.js';

// Hand wave detector - detects waving hand gesture
export class HandWaveDetector {
  constructor() {
    this.lWristHistory = [];
    this.rWristHistory = [];
    this.lastWaveTime = 0;
    this.waveCooldown = 2000;  // 2초 쿨다운 (오인식 방지)
  }

  getWrist(landmarks, wristIdx) {
    const wrist = (landmarks && landmarks[wristIdx]) || null;
    return wrist && wrist.visibility > 0.3 ? { x: wrist.x, y: wrist.y } : null;
  }

  detectWave(landmarks) {
    if (!landmarks || landmarks.length === 0) return { detected: false, hand: null };

    const now = performance.now();
    if (now - this.lastWaveTime < this.waveCooldown) {
      return { detected: false, hand: null };  // 쿨다운 중
    }

    const lWrist = this.getWrist(landmarks, POSE_LANDMARKS.L_WRIST);
    const rWrist = this.getWrist(landmarks, POSE_LANDMARKS.R_WRIST);

    let leftDetected = false;
    let rightDetected = false;

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
            leftDetected = true;
          }
        }
      }
    }

    // 오른쪽 손 흔들기 감지
    if (rWrist) {
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
            rightDetected = true;
          }
        }
      }
    }

    if (leftDetected || rightDetected) {
      this.lastWaveTime = now;
      this.lWristHistory = [];
      this.rWristHistory = [];
      
      if (leftDetected) {
        return { detected: true, hand: 'left' };
      } else {
        return { detected: true, hand: 'right' };
      }
    }

    return { detected: false, hand: null };
  }
}
