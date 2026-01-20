import { POSE_LANDMARKS, CALIBRATION } from '../../engine/constants.js';

// Pose-based controller - handles calibration and action detection from pose landmarks
export class PoseController {
  constructor() {
    this.calibration = {
      ready: false,
      torsoY: null,
      hipY: null,
      squatHipDelta: CALIBRATION.SQUAT_HIP_DELTA,
      jumpTorsoDelta: CALIBRATION.JUMP_TORSO_DELTA
    };
    this.lastDuckState = false;  // 이전 프레임의 duck 상태
    this.duckReleaseThreshold = CALIBRATION.SQUAT_HIP_DELTA * 0.3;  // 일어설 때는 훨씬 더 낮은 임계값 사용 (히스터시스) - 0.7 -> 0.3으로 변경
  }

  getLm(landmarks, idx) {
    const p = (landmarks && landmarks[idx]) || null;
    return p ? { x: p.x, y: p.y, v: (p.visibility !== undefined ? p.visibility : 1) } : null;
  }

  avgY(...pts) {
    const ok = pts.filter(p => p && p.v > CALIBRATION.MIN_VISIBILITY);
    if (!ok.length) return null;
    return ok.reduce((s, p) => s + p.y, 0) / ok.length;
  }

  calibrate(landmarks) {
    const ls = this.getLm(landmarks, POSE_LANDMARKS.L_SHOULDER);
    const rs = this.getLm(landmarks, POSE_LANDMARKS.R_SHOULDER);
    const lh = this.getLm(landmarks, POSE_LANDMARKS.L_HIP);
    const rh = this.getLm(landmarks, POSE_LANDMARKS.R_HIP);

    const shoulderY = this.avgY(ls, rs);
    const hipY = this.avgY(lh, rh);
    
    if (shoulderY == null || hipY == null) {
      return { success: false, message: "Full body not visible enough." };
    }

    this.calibration.torsoY = (shoulderY + hipY) / 2;
    this.calibration.hipY = hipY;
    this.calibration.ready = true;

    return { 
      success: true, 
      torsoY: this.calibration.torsoY, 
      hipY: this.calibration.hipY 
    };
  }

  detectActions(landmarks) {
    if (!this.calibration.ready) {
      return { jump: false, duck: false };
    }

    const ls = this.getLm(landmarks, POSE_LANDMARKS.L_SHOULDER);
    const rs = this.getLm(landmarks, POSE_LANDMARKS.R_SHOULDER);
    const lh = this.getLm(landmarks, POSE_LANDMARKS.L_HIP);
    const rh = this.getLm(landmarks, POSE_LANDMARKS.R_HIP);

    const torsoY = this.avgY(ls, rs, lh, rh);
    const hipY = this.avgY(lh, rh);
    
    if (torsoY == null || hipY == null) {
      return { jump: false, duck: false };
    }

    const jump = (this.calibration.torsoY - torsoY) > this.calibration.jumpTorsoDelta;
    
    // Duck 감지에 히스터시스 적용: 한 번 숙인 상태가 되면 더 오래 유지
    const hipDelta = hipY - this.calibration.hipY;
    let duck;
    
    if (this.lastDuckState) {
      // 이미 숙인 상태라면, 일어서기 위해서는 훨씬 더 가까워져야 함 (매우 엄격한 조건)
      // 캘리브레이션 값에 거의 가까워져야 일어설 수 있음
      duck = hipDelta > this.duckReleaseThreshold;
    } else {
      // 서 있는 상태라면, 숙이기 위해서는 기존 임계값 사용
      duck = hipDelta > this.calibration.squatHipDelta;
    }
    
    this.lastDuckState = duck;  // 현재 상태 저장

    return { jump, duck };
  }

  isCalibrated() {
    return this.calibration.ready;
  }

  reset() {
    this.calibration.ready = false;
    this.calibration.torsoY = null;
    this.calibration.hipY = null;
    this.lastDuckState = false;  // duck 상태도 리셋
  }

  getCalibration() {
    return { ...this.calibration };
  }
}
