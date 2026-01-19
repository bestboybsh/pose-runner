import { PoseEngineBase } from './poseEngineBase.js';

// MediaPipe pose detection engine implementation
export class MediaPipePoseEngine extends PoseEngineBase {
  constructor() {
    super();
    this.vision = null;
    this.poseLandmarker = null;
    this.loaded = false;
  }

  async initialize() {
    if (this.loaded) return;

    try {
      this.vision = await import("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14");
      const { PoseLandmarker, FilesetResolver } = this.vision;

      const fileset = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm"
      );

      this.poseLandmarker = await PoseLandmarker.createFromOptions(fileset, {
        baseOptions: {
          modelAssetPath: "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task"
        },
        runningMode: "VIDEO",
        numPoses: 1
      });

      this.loaded = true;
      return true;
    } catch (e) {
      console.error("MediaPipe load error:", e);
      throw e;
    }
  }

  detect(video, timestamp) {
    if (!this.poseLandmarker || video.readyState < 2) {
      return null;
    }
    const res = this.poseLandmarker.detectForVideo(video, timestamp);
    return res?.landmarks?.[0] || null;
  }

  isLoaded() {
    return this.loaded;
  }
}
