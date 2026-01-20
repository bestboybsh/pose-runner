// Face capture service - captures face from video
export class FaceCaptureService {
  constructor() {
    this.faceImage = null;
  }

  captureFaceFromVideo(video, landmarks) {
    if (!landmarks || landmarks.length === 0) {
      console.error('No landmarks provided');
      return null;
    }

    // 비디오가 준비되었는지 확인
    if (video.readyState < 2) {
      console.error('Video not ready, readyState:', video.readyState);
      return null;
    }

    // 비디오 크기 확인
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      console.error('Video dimensions are zero:', video.videoWidth, 'x', video.videoHeight);
      return null;
    }

    // 얼굴 랜드마크에서 얼굴 영역 계산
    const nose = landmarks[0];  // nose
    const lEye = landmarks[2];  // left eye
    const rEye = landmarks[5];  // right eye

    if (!nose || !lEye || !rEye) {
      console.error('Missing face landmarks');
      return null;
    }

    // 랜드마크 좌표가 정규화되어 있으므로 실제 픽셀 좌표로 변환
    // MediaPipe는 원본 비디오 기준 좌표를 반환 (반전되지 않은 원본)
    const videoWidth = video.videoWidth;
    const videoHeight = video.videoHeight;

    // 얼굴 영역 계산 (눈 사이 거리의 2.5배를 너비로)
    const eyeDist = Math.abs(rEye.x - lEye.x) * videoWidth;
    const faceWidth = Math.max(eyeDist * 2.5, 100);  // 최소 100px
    const faceHeight = faceWidth * 1.3;  // 얼굴 비율

    // 얼굴 중심점 (코 위치 기준)
    const centerX = nose.x * videoWidth;
    const centerY = nose.y * videoHeight;

    // 얼굴 영역 좌표 (비디오 원본 기준)
    let x = centerX - faceWidth / 2;
    let y = centerY - faceHeight * 0.4;  // 코보다 약간 위에서 시작
    let w = faceWidth;
    let h = faceHeight;

    // 비디오 경계 체크
    x = Math.max(0, Math.min(x, videoWidth - w));
    y = Math.max(0, Math.min(y, videoHeight - h));
    w = Math.min(w, videoWidth - x);
    h = Math.min(h, videoHeight - y);

    // 최소 크기 확인
    if (w < 50 || h < 50) {
      console.error('Face area too small:', w, 'x', h);
      return null;
    }

    // 캔버스에 얼굴 부분 그리기
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');

    // 비디오 원본에서 얼굴 부분만 추출 (반전 없이 - 원본 그대로)
    try {
      ctx.drawImage(
        video,
        x, y, w, h,  // 소스 영역 (비디오 원본에서)
        0, 0, w, h   // 대상 영역 (캔버스에)
      );

      // 캔버스가 비어있는지 확인 (디버깅)
      const imageData = ctx.getImageData(0, 0, Math.min(w, 10), Math.min(h, 10));
      const hasContent = imageData.data.some((pixel, i) => {
        // 알파 채널을 제외한 RGB 값 중 하나라도 0이 아니면 콘텐츠가 있음
        if (i % 4 !== 3) return pixel !== 0;
        return false;
      });

      if (!hasContent) {
        console.error('Canvas appears to be empty');
        // 반전 처리로 재시도
        ctx.clearRect(0, 0, w, h);
        ctx.save();
        ctx.scale(-1, 1);
        ctx.drawImage(video, -x - w, y, w, h, 0, 0, w, h);
        ctx.restore();
      }

      console.log('Face captured successfully:', {
        videoSize: `${videoWidth}x${videoHeight}`,
        faceArea: `${w.toFixed(0)}x${h.toFixed(0)}`,
        position: `(${x.toFixed(0)}, ${y.toFixed(0)})`,
        hasContent
      });
    } catch (e) {
      console.error('Error drawing video to canvas:', e);
      return null;
    }

    // ImageData로 변환하여 저장
    const dataUrl = canvas.toDataURL('image/png');
    this.faceImage = new Image();
    
    // Promise로 이미지 로드 완료 대기
    return new Promise((resolve, reject) => {
      this.faceImage.onload = () => {
        console.log('Face image loaded:', this.faceImage.width, 'x', this.faceImage.height);
        resolve(this.faceImage);
      };
      this.faceImage.onerror = (e) => {
        console.error('Face image load error:', e);
        reject(e);
      };
      this.faceImage.src = dataUrl;
      
      // 이미 로드되어 있으면 즉시 resolve
      if (this.faceImage.complete && this.faceImage.naturalWidth > 0) {
        console.log('Face image already loaded:', this.faceImage.width, 'x', this.faceImage.height);
        resolve(this.faceImage);
      }
    });
  }

  getFaceImage() {
    return this.faceImage;
  }

  hasFaceImage() {
    return this.faceImage !== null;
  }
}
