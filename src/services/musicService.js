// Background music service
export class MusicService {
  constructor(audioElement) {
    this.audio = audioElement;
    this.isPlaying = false;
    this.volume = 0.3; // 기본 볼륨 30%
    
    // 오디오 요소 설정
    if (this.audio) {
      this.audio.loop = true; // 반복 재생
      this.audio.volume = this.volume;
      
      // 이벤트 리스너
      this.audio.addEventListener('play', () => {
        this.isPlaying = true;
      });
      
      this.audio.addEventListener('pause', () => {
        this.isPlaying = false;
      });
      
      this.audio.addEventListener('ended', () => {
        this.isPlaying = false;
      });
      
      this.audio.addEventListener('error', (e) => {
        console.error('Music error:', e);
        this.isPlaying = false;
      });
    }
  }

  // 음악 파일 로드
  load(src) {
    if (!this.audio) return Promise.reject(new Error('Audio element not available'));
    
    return new Promise((resolve, reject) => {
      this.audio.src = src;
      
      this.audio.addEventListener('loadeddata', () => {
        console.log('Music loaded:', src);
        resolve();
      }, { once: true });
      
      this.audio.addEventListener('error', (e) => {
        console.error('Music load error:', e);
        reject(e);
      }, { once: true });
      
      // 로드 시작
      this.audio.load();
    });
  }

  // 음악 재생
  play() {
    if (!this.audio) {
      console.warn('Audio element not available');
      return false;
    }
    
    // 음악 파일 확인
    const source = this.audio.querySelector('source');
    if (!this.audio.src && !source) {
      console.warn('No music source found. Please add a music file in index.html.');
      return false;
    }
    
    // source 태그가 있으면 src 속성으로 설정
    if (source && source.src && !this.audio.src) {
      this.audio.src = source.src;
      console.log('Music source set from <source> tag:', source.src);
    }
    
    // 볼륨 확인 및 설정
    if (this.audio.volume === 0) {
      this.audio.volume = this.volume;
      console.log('Music volume set to:', this.volume);
    }
    
    // 반복 재생 설정
    this.audio.loop = true;
    
    // 재생 시도
    const tryPlay = () => {
      return this.audio.play().then(() => {
        console.log('Music playing successfully');
        return true;
      }).catch(e => {
        console.error('Failed to play music:', e.name, e.message);
        // 자동 재생이 차단된 경우
        if (e.name === 'NotAllowedError') {
          console.log('⚠️ Music playback requires user interaction. Please click Music button to start.');
        } else if (e.name === 'NotSupportedError') {
          console.error('❌ Audio format not supported');
        }
        return false;
      });
    };
    
    // 음악이 준비되었는지 확인
    if (this.audio.readyState >= 2) {
      // 준비됨 - 즉시 재생
      return tryPlay();
    } else {
      // 아직 로드 중 - 로드 완료 후 재생
      console.log('Music loading... readyState:', this.audio.readyState);
      
      // 로드 시도
      if (this.audio.readyState === 0) {
        this.audio.load();
      }
      
      // 로드 완료 대기
      return new Promise((resolve) => {
        const onLoaded = () => {
          console.log('Music loaded, attempting to play...');
          tryPlay().then(success => resolve(success));
        };
        
        this.audio.addEventListener('loadeddata', onLoaded, { once: true });
        this.audio.addEventListener('canplay', onLoaded, { once: true });
        
        // 에러 처리
        this.audio.addEventListener('error', (e) => {
          console.error('Music load error:', this.audio.error);
          resolve(false);
        }, { once: true });
        
        // 타임아웃 (5초)
        setTimeout(() => {
          if (this.audio.readyState < 2) {
            console.warn('Music load timeout');
            // 타임아웃되어도 재생 시도
            tryPlay().then(success => resolve(success));
          }
        }, 5000);
      });
    }
  }

  // 음악 정지
  stop() {
    if (!this.audio) return;
    this.audio.pause();
    this.audio.currentTime = 0;
  }

  // 음악 일시정지
  pause() {
    if (!this.audio) return;
    this.audio.pause();
  }

  // 볼륨 설정 (0.0 ~ 1.0)
  setVolume(volume) {
    this.volume = Math.max(0, Math.min(1, volume));
    if (this.audio) {
      this.audio.volume = this.volume;
    }
  }

  // 음악 재생 중인지 확인
  getIsPlaying() {
    return this.isPlaying && !this.audio.paused;
  }

  // 재생 속도 설정 (0.5 ~ 2.0 권장)
  setPlaybackRate(rate) {
    if (!this.audio) return;
    // 재생 속도 제한 (너무 빠르거나 느리면 음질이 떨어질 수 있음)
    const clampedRate = Math.max(0.5, Math.min(2.0, rate));
    this.audio.playbackRate = clampedRate;
  }

  // 현재 재생 속도 가져오기
  getPlaybackRate() {
    return this.audio ? this.audio.playbackRate : 1.0;
  }
}
