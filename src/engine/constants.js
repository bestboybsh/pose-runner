// Game constants
export const GAME_CONFIG = {
  INITIAL_SPEED: 6,
  SPEED_INCREMENT: 0.6,
  SPEED_INTERVAL: 240,
  GRAVITY: 0.9,
  JUMP_VELOCITY: -14,
  GROUND_Y: 340,
  CANVAS_WIDTH: 980,
  CANVAS_HEIGHT: 420,
  PLAYER: {
    X: 120,
    W: 30,
    H_STANDING: 46,
    H_DUCKING: 26
  },
  OBSTACLE: {
    SPAWN_MIN_CD: 70,
    SPAWN_MAX_CD: 140,
    LOW_W: 22,
    LOW_H: 48,
    HIGH_W: 40,
    HIGH_H: 26,
    HIGH_OFFSET: 70,
    DUCK_W: 40,  // 숙여야 하는 장애물 (넓은)
    DUCK_H: 150,  // 중간부터 위까지 차지
    DUCK_Y_START: 220,  // 중간 높이부터 시작
    LOW_PROBABILITY: 0.50,  // low: 50%, high: 25%, duck: 25%
    HIGH_PROBABILITY: 0.75  // high가 나올 확률 (나머지 중 75%)
  }
};

export const POSE_LANDMARKS = {
  L_SHOULDER: 11,
  R_SHOULDER: 12,
  L_HIP: 23,
  R_HIP: 24,
  L_WRIST: 15,
  R_WRIST: 16,
  NOSE: 0,
  L_EYE: 2,
  R_EYE: 5,
  L_EAR: 7,
  R_EAR: 8,
  MOUTH_L: 9,
  MOUTH_R: 10
};

export const HAND_WAVE_CONFIG = {
  WAVE_THRESHOLD: 0.05,  // 손 흔들기 감지 임계값 (좌우 이동 거리)
  WAVE_MIN_SPEED: 0.02,  // 최소 속도
  HISTORY_SIZE: 5  // 손목 위치 히스토리 크기
};

export const CALIBRATION = {
  SQUAT_HIP_DELTA: 0.08,  // 스쿼트 감지 민감도 (낮을수록 더 민감)
  JUMP_TORSO_DELTA: 0.10,  // 점프 감지 민감도 조정 (높을수록 덜 민감)
  MIN_VISIBILITY: 0.3
};

export const ITEM_CONFIG = {
  SPAWN_CHANCE: 0.15,  // 아이템 생성 확률
  SPAWN_MIN_CD: 50,
  SPAWN_MAX_CD: 120,
  W: 20,
  H: 20,
  Y_MIN: 200,  // 아이템 높이 범위
  Y_MAX: 320,
  SCORE_VALUE: 10  // 아이템 당 점수
};
