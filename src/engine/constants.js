// Game constants
export const GAME_CONFIG = {
  INITIAL_SPEED: 8,  // 게임 속도 증가 (6 -> 8)
  SPEED_INCREMENT: 1.0,  // 속도 증가량 증가 (더 빠르게 증가) (0.8 -> 1.0)
  SPEED_INTERVAL: 180,  // 속도 증가 간격 감소 (더 자주 증가) (240 -> 180, 약 3초마다)
  GRAVITY: 0.9,
  JUMP_VELOCITY: -18,  // 점프 높이 증가 (더 높고 멀리 점프) (-14 -> -18)
  GROUND_Y: 340,
  CANVAS_WIDTH: 980,
  CANVAS_HEIGHT: 420,
  PLAYER: {
    X: 120,
    W: 50,  // 캐릭터 너비 증가 (30 -> 50)
    H_STANDING: 75,  // 서 있을 때 높이 증가 (46 -> 75)
    H_DUCKING: 45  // 숙일 때 높이 증가 (26 -> 45)
  },
  OBSTACLE: {
    SPAWN_MIN_CD: 70,
    SPAWN_MAX_CD: 140,
    LOW_W: 35,  // 낮은 장애물 너비 증가 (22 -> 35)
    LOW_H: 75,  // 낮은 장애물 높이 증가 (48 -> 75)
    HIGH_W: 60,  // 높은 장애물 너비 증가 (40 -> 60)
    HIGH_H: 40,  // 높은 장애물 높이 증가 (26 -> 40)
    HIGH_OFFSET: 70,
    DUCK_W: 75,  // 숙여야 하는 장애물 너비 증가 (50 -> 75)
    DUCK_H: 200,  // 숙여야 하는 장애물 높이 (점프로 넘을 수 없도록 충분히 높게, 점프 최대 높이 180보다 높음) (45 -> 200)
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
  SQUAT_HIP_DELTA: 0.05,  // 스쿼트 감지 민감도 (낮을수록 더 민감) - 0.08 -> 0.05로 개선
  JUMP_TORSO_DELTA: 0.10,  // 점프 감지 민감도 조정 (높을수록 덜 민감)
  MIN_VISIBILITY: 0.3
};

export const ITEM_CONFIG = {
  SPAWN_MIN_CD: 550,  // 10초에 하나씩: 550~650프레임 (60fps 기준 약 9~11초)
  SPAWN_MAX_CD: 650,
  W: 24,  // 하트 크기
  H: 24,
  Y_MIN: 200,  // 아이템 높이 범위
  Y_MAX: 320,
  HEART_VALUE: 1  // 하트 당 목숨 증가량
};

export const LIVES_CONFIG = {
  START: 3,  // 시작 목숨
  MAX: 100,  // 최대 목숨
  DECREASE_ON_HIT: 1  // 충돌 시 목숨 감소량
};
