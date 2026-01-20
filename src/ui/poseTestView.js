// Pose test view - shows real-time pose detection status for testing
export class PoseTestView {
  constructor(containerEl) {
    this.containerEl = containerEl;
    this.visible = false;
    this.updateInterval = null;
  }

  show() {
    this.visible = true;
    if (this.containerEl) {
      this.containerEl.style.display = 'block';
    }
  }

  hide() {
    this.visible = false;
    if (this.containerEl) {
      this.containerEl.style.display = 'none';
    }
  }

  toggle() {
    if (this.visible) {
      this.hide();
      // 테스트 패널이 닫히면 얼굴 미리보기도 숨김
      const facePreviewEl = document.getElementById('facePreview');
      if (facePreviewEl) {
        facePreviewEl.style.display = 'none';
      }
    } else {
      this.show();
      // 테스트 패널이 열리면 얼굴 미리보기도 표시 (이미 찍은 사진이 있는 경우)
      const facePreviewEl = document.getElementById('facePreview');
      const facePreviewImg = document.getElementById('facePreviewImg');
      if (facePreviewEl && facePreviewImg && facePreviewImg.src) {
        facePreviewEl.style.display = 'block';
      }
    }
  }

  update(landmarks, actions, calibration, poseDetected) {
    if (!this.visible || !this.containerEl) return;

    let html = '<h3>포즈 인식 테스트</h3>';
    
    // 포즈 감지 상태
    html += '<div style="margin-bottom: 12px; padding: 8px; background: #fff; border-radius: 4px;">';
    html += `<strong>포즈 감지:</strong> <span style="color: ${poseDetected ? '#0a0' : '#a00'}">${poseDetected ? '✓ 감지됨' : '✗ 미감지'}</span><br>`;
    
    const calStatus = calibration.ready ? '✓ 완료' : '✗ 미완료';
    const calColor = calibration.ready ? '#0a0' : '#a00';
    html += `<strong>캘리브레이션:</strong> <span style="color: ${calColor}">${calStatus}</span><br>`;
    
    if (!calibration.ready && poseDetected) {
      html += '<small style="color: #666;">→ "Calibrate" 버튼을 눌러주세요</small><br>';
    } else if (!calibration.ready && !poseDetected) {
      html += '<small style="color: #a00;">→ 포즈가 감지되지 않습니다. 카메라 앞에 서서 온몸이 보이도록 하세요</small><br>';
    }
    html += '</div>';

    if (landmarks && landmarks.length > 0) {
      // 주요 랜드마크 정보
      html += '<div style="background: #fff; padding: 8px; border-radius: 4px; margin-bottom: 12px;">';
      html += '<strong>랜드마크 가시성:</strong><br>';
      
      const lmNames = {
        11: '왼쪽 어깨',
        12: '오른쪽 어깨',
        23: '왼쪽 엉덩이',
        24: '오른쪽 엉덩이'
      };

      const lmKeys = [11, 12, 23, 24];
      let allVisible = true;
      let missingParts = [];
      
      for (const key of lmKeys) {
        const lm = landmarks[key];
        if (lm) {
          const vis = (lm.visibility || 0).toFixed(2);
          const isGood = lm.visibility > 0.3;
          const color = isGood ? '#0a0' : '#a00';
          html += `${lmNames[key]}: <span style="color: ${color}">${vis}</span>${isGood ? ' ✓' : ' ✗'}<br>`;
          
          if (!isGood) {
            allVisible = false;
            missingParts.push(lmNames[key]);
          }
        } else {
          html += `${lmNames[key]}: <span style="color: #a00">없음 ✗</span><br>`;
          allVisible = false;
          missingParts.push(lmNames[key]);
        }
      }
      
      if (!allVisible && !calibration.ready) {
        html += `<div style="margin-top: 8px; padding: 6px; background: #fff3cd; border-radius: 4px; font-size: 0.9em;">`;
        html += `<strong>⚠ 캘리브레이션 실패 원인:</strong><br>`;
        html += `다음 부위가 충분히 보이지 않습니다:<br>`;
        html += `${missingParts.join(', ')}<br>`;
        html += `→ 조명을 밝게 하고, 카메라 앞에서 온몸이 보이도록 서세요`;
        html += `</div>`;
      }
      html += '</div>';

      // 캘리브레이션 값
      if (calibration.ready) {
        html += '<div style="background: #d4edda; padding: 8px; border-radius: 4px; margin-bottom: 12px; border-left: 4px solid #0a0;">';
        html += '<strong>✓ 캘리브레이션 값:</strong><br>';
        html += `Torso Y: ${calibration.torsoY.toFixed(3)}<br>`;
        html += `Hip Y: ${calibration.hipY.toFixed(3)}<br>`;
        html += `Jump Delta: ${calibration.jumpTorsoDelta.toFixed(3)}<br>`;
        html += `Duck Delta: ${calibration.squatHipDelta.toFixed(3)}`;
        html += '</div>';
      } else if (allVisible) {
        html += '<div style="background: #fff3cd; padding: 8px; border-radius: 4px; margin-bottom: 12px; border-left: 4px solid #ffc107;">';
        html += '<strong>ℹ 캘리브레이션 준비 완료</strong><br>';
        html += '모든 랜드마크가 감지되었습니다.<br>';
        html += '→ 상단의 "Calibrate" 버튼을 눌러주세요';
        html += '</div>';
      }

      // 현재 포즈 계산값 (캘리브레이션 후)
      if (calibration.ready) {
        const ls = landmarks[11];
        const rs = landmarks[12];
        const lh = landmarks[23];
        const rh = landmarks[24];
        
        if (ls && rs && lh && rh) {
          const torsoY = (ls.y + rs.y + lh.y + rh.y) / 4;
          const hipY = (lh.y + rh.y) / 2;
          const jumpDelta = calibration.torsoY - torsoY;
          const duckDelta = hipY - calibration.hipY;
          
          html += '<div style="background: #fff; padding: 8px; border-radius: 4px; margin-bottom: 12px;">';
          html += '<strong>현재 포즈:</strong><br>';
          html += `Torso Y: ${torsoY.toFixed(3)} (Δ: ${jumpDelta.toFixed(3)})<br>`;
          html += `Hip Y: ${hipY.toFixed(3)} (Δ: ${duckDelta.toFixed(3)})<br>`;
          html += '</div>';
        }
      }
    }

    // 액션 감지 상태
    html += '<div style="background: #fff; padding: 8px; border-radius: 4px;">';
    html += '<strong>감지된 액션:</strong><br>';
    html += `<span style="color: ${actions.jump ? '#0a0' : '#666'}">${actions.jump ? '✓ JUMP' : '○ JUMP'}</span><br>`;
    html += `<span style="color: ${actions.duck ? '#0a0' : '#666'}">${actions.duck ? '✓ DUCK' : '○ DUCK'}</span>`;
    html += '</div>';

    this.containerEl.innerHTML = html;
  }
}
