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
  }

  getLm(landmarks, idx) {
    const p = landmarks?.[idx];
    return p ? { x: p.x, y: p.y, v: p.visibility ?? 1 } : null;
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
    const duck = (hipY - this.calibration.hipY) > this.calibration.squatHipDelta;

    return { jump, duck };
  }

  isCalibrated() {
    return this.calibration.ready;
  }

  reset() {
    this.calibration.ready = false;
    this.calibration.torsoY = null;
    this.calibration.hipY = null;
  }
}
