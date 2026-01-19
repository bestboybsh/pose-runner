// Face capture service - captures face from video
export class FaceCaptureService {
  constructor() {
    this.faceImage = null;
  }

  captureFaceFromVideo(video, landmarks) {
    if (!landmarks || landmarks.length === 0) return null;

    // 얼굴 랜드마크에서 얼굴 영역 계산
    const nose = landmarks[0];  // nose
    const lEye = landmarks[2];  // left eye
    const rEye = landmarks[5];  // right eye
    const lEar = landmarks[7];  // left ear
    const rEar = landmarks[8];  // right ear

    if (!nose || !lEye || !rEye) return null;

    // 얼굴 영역 계산 (눈 사이 거리의 2배를 너비로)
    const eyeDist = Math.abs(rEye.x - lEye.x) * video.videoWidth;
    const faceWidth = eyeDist * 2.5;
    const faceHeight = faceWidth * 1.3;  // 얼굴 비율

    // 얼굴 중심점 (코 위치 기준)
    const centerX = nose.x * video.videoWidth;
    const centerY = nose.y * video.videoHeight;

    // 얼굴 영역 좌표
    let x = centerX - faceWidth / 2;
    let y = centerY - faceHeight * 0.4;  // 코보다 약간 위에서 시작
    let w = faceWidth;
    let h = faceHeight;

    // 비디오 경계 체크
    x = Math.max(0, Math.min(x, video.videoWidth - w));
    y = Math.max(0, Math.min(y, video.videoHeight - h));
    w = Math.min(w, video.videoWidth - x);
    h = Math.min(h, video.videoHeight - y);

    // 캔버스에 얼굴 부분 그리기
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');

    // 비디오에서 얼굴 부분만 추출 (좌우 반전 적용)
    ctx.save();
    ctx.scale(-1, 1);  // 좌우 반전
    ctx.drawImage(
      video,
      -x - w, y, w, h,  // 소스 영역 (반전된 좌표)
      0, 0, w, h         // 대상 영역
    );
    ctx.restore();

    // ImageData로 변환하여 저장
    this.faceImage = new Image();
    this.faceImage.src = canvas.toDataURL();
    
    return this.faceImage;
  }

  getFaceImage() {
    return this.faceImage;
  }

  hasFaceImage() {
    return this.faceImage !== null;
  }
}
