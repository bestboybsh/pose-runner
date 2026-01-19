// Skeleton renderer - draws pose skeleton on video overlay
export class SkeletonRenderer {
  constructor(canvas, video) {
    this.canvas = canvas;
    this.video = video;
    this.ctx = canvas.getContext("2d");
    this.setupCanvas();
  }

  setupCanvas() {
    // Make canvas match video size and position
    const updateSize = () => {
      if (this.video.videoWidth && this.video.videoHeight) {
        // Scale to video display size (200px width)
        const displayWidth = this.video.clientWidth || 200;
        const aspectRatio = this.video.videoHeight / this.video.videoWidth;
        const displayHeight = displayWidth * aspectRatio;
        
        this.canvas.width = this.video.videoWidth;
        this.canvas.height = this.video.videoHeight;
        this.canvas.style.width = displayWidth + 'px';
        this.canvas.style.height = displayHeight + 'px';
      }
    };

    this.video.addEventListener('loadedmetadata', updateSize);
    updateSize();
  }

  // MediaPipe pose landmark connections
  static POSE_CONNECTIONS = [
    // Face
    [0, 1], [1, 2], [2, 3], [3, 7],
    [0, 4], [4, 5], [5, 6], [6, 8],
    // Torso
    [9, 10], [11, 12], [11, 13], [13, 15],
    [12, 14], [14, 16], [11, 23], [12, 24],
    [23, 24],
    // Left arm
    [11, 13], [13, 15], [15, 17], [15, 19], [15, 21], [17, 19],
    // Right arm
    [12, 14], [14, 16], [16, 18], [16, 20], [16, 22], [18, 20],
    // Left leg
    [23, 25], [25, 27], [27, 29], [27, 31], [29, 31],
    // Right leg
    [24, 26], [26, 28], [28, 30], [28, 32], [30, 32]
  ];

  render(landmarks) {
    if (!landmarks || landmarks.length === 0) {
      this.clear();
      return;
    }

    this.clear();

    const width = this.canvas.width;
    const height = this.canvas.height;

    this.ctx.save();
    // Flip horizontally to match mirrored video
    this.ctx.scale(-1, 1);
    this.ctx.translate(-width, 0);

    // Draw connections (skeleton lines)
    this.ctx.strokeStyle = '#00ff00';
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();

    for (const [start, end] of SkeletonRenderer.POSE_CONNECTIONS) {
      const startPoint = landmarks[start];
      const endPoint = landmarks[end];

      if (startPoint && endPoint && 
          startPoint.visibility > 0.3 && endPoint.visibility > 0.3) {
        const x1 = startPoint.x * width;
        const y1 = startPoint.y * height;
        const x2 = endPoint.x * width;
        const y2 = endPoint.y * height;

        this.ctx.moveTo(x1, y1);
        this.ctx.lineTo(x2, y2);
      }
    }

    this.ctx.stroke();

    // Draw landmarks (joints)
    this.ctx.fillStyle = '#ff0000';
    for (const landmark of landmarks) {
      if (landmark.visibility > 0.3) {
        const x = landmark.x * width;
        const y = landmark.y * height;
        
        this.ctx.beginPath();
        this.ctx.arc(x, y, 3, 0, 2 * Math.PI);
        this.ctx.fill();
      }
    }

    // Highlight important points (shoulders and hips)
    const importantPoints = [11, 12, 23, 24]; // L/R Shoulder, L/R Hip
    this.ctx.fillStyle = '#00ffff';
    for (const idx of importantPoints) {
      const landmark = landmarks[idx];
      if (landmark && landmark.visibility > 0.3) {
        const x = landmark.x * width;
        const y = landmark.y * height;
        
        this.ctx.beginPath();
        this.ctx.arc(x, y, 5, 0, 2 * Math.PI);
        this.ctx.fill();
      }
    }

    this.ctx.restore();
  }

  clear() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }
}
