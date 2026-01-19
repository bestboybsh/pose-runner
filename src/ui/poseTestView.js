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
    } else {
      this.show();
    }
  }

  update(landmarks, actions, calibration, poseDetected) {
    if (!this.visible || !this.containerEl) return;

    let html = '<h3>포즈 인식 테스트</h3>';
    
    // 포즈 감지 상태
    html += '<div style="margin-bottom: 12px;">';
    html += `<strong>포즈 감지:</strong> <span style="color: ${poseDetected ? '#0a0' : '#a00'}">${poseDetected ? '✓ 감지됨' : '✗ 미감지'}</span><br>`;
    html += `<strong>캘리브레이션:</strong> <span style="color: ${calibration.ready ? '#0a0' : '#a00'}">${calibration.ready ? '✓ 완료' : '✗ 미완료'}</span>`;
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
      for (const key of lmKeys) {
        const lm = landmarks[key];
        if (lm) {
          const vis = (lm.visibility || 0).toFixed(2);
          const color = lm.visibility > 0.3 ? '#0a0' : '#a00';
          html += `${lmNames[key]}: <span style="color: ${color}">${vis}</span><br>`;
        } else {
          html += `${lmNames[key]}: <span style="color: #a00">없음</span><br>`;
        }
      }
      html += '</div>';

      // 캘리브레이션 값
      if (calibration.ready) {
        html += '<div style="background: #fff; padding: 8px; border-radius: 4px; margin-bottom: 12px;">';
        html += '<strong>캘리브레이션 값:</strong><br>';
        html += `Torso Y: ${calibration.torsoY.toFixed(3)}<br>`;
        html += `Hip Y: ${calibration.hipY.toFixed(3)}<br>`;
        html += `Jump Delta: ${calibration.jumpTorsoDelta.toFixed(3)}<br>`;
        html += `Duck Delta: ${calibration.squatHipDelta.toFixed(3)}`;
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
