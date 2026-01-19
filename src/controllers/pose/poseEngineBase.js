// Base class for pose engines - defines interface
export class PoseEngineBase {
  async initialize() {
    throw new Error('initialize() must be implemented');
  }

  detect(video, timestamp) {
    throw new Error('detect() must be implemented');
  }

  isLoaded() {
    throw new Error('isLoaded() must be implemented');
  }
}
