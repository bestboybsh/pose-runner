// Sound effect service - manages game sound effects
export class SoundEffectService {
  constructor(audioElement) {
    this.audio = audioElement;
    this.volume = 0.5; // 기본 볼륨 50%
    
    if (this.audio) {
      this.audio.volume = this.volume;
    }
  }

  // 효과음 재생 (한 번만)
  play() {
    if (!this.audio) {
      console.warn('Sound effect audio element not available');
      return Promise.resolve(false);
    }

    // 음악 파일 확인
    const source = this.audio.querySelector('source');
    if (!this.audio.src && !source) {
      console.warn('❌ No sound effect source found. Please add <source> tag with sound file in HTML.');
      console.warn('   Expected: <source src="src/assets/gameover.mp3" type="audio/mpeg">');
      return Promise.resolve(false);
    }

    // source 태그가 있으면 src 속성으로 설정
    if (source && source.src) {
      if (!this.audio.src || this.audio.src !== source.src) {
        this.audio.src = source.src;
        console.log('✅ Game over sound source set:', source.src);
      }
    } else if (!this.audio.src) {
      console.warn('❌ No valid source found in audio element');
      console.warn('   Source element:', source);
      console.warn('   Audio src:', this.audio.src);
      return Promise.resolve(false);
    }

    // 볼륨 설정
    this.audio.volume = this.volume;

    // 반복 재생 안 함
    this.audio.loop = false;

    // 재생 시도
    const tryPlay = () => {
      // 처음부터 재생
      this.audio.currentTime = 0;
      
      return this.audio.play().then(() => {
        console.log('Sound effect playing successfully');
        return true;
      }).catch(e => {
        console.error('Failed to play sound effect:', e.name, e.message);
        console.error('Audio element state:', {
          readyState: this.audio.readyState,
          src: this.audio.src,
          error: this.audio.error
        });
        return false;
      });
    };

    // 음악이 준비되었는지 확인
    console.log('Sound effect readyState:', this.audio.readyState, 'src:', this.audio.src);
    
    if (this.audio.readyState >= 2) {
      // 준비됨 - 즉시 재생
      console.log('✅ Sound effect ready, playing immediately...');
      return tryPlay();
    } else {
      // 아직 로드 중 - 로드 완료 후 재생
      console.log('⏳ Sound effect loading... readyState:', this.audio.readyState);
      
      if (this.audio.readyState === 0) {
        console.log('Loading sound effect...');
        this.audio.load();
      }

      return new Promise((resolve) => {
        let resolved = false;
        
        const onLoaded = () => {
          if (resolved) return;
          resolved = true;
          console.log('✅ Sound effect loaded, attempting to play...');
          tryPlay().then(success => resolve(success));
        };

        this.audio.addEventListener('loadeddata', onLoaded, { once: true });
        this.audio.addEventListener('canplay', onLoaded, { once: true });
        this.audio.addEventListener('canplaythrough', onLoaded, { once: true });
        this.audio.addEventListener('error', (e) => {
          if (resolved) return;
          resolved = true;
          console.error('❌ Sound effect load error:', this.audio.error);
          console.error('Error code:', (this.audio.error && this.audio.error.code) || null);
          console.error('Error message:', (this.audio.error && this.audio.error.message) || null);
          resolve(false);
        }, { once: true });

        // 타임아웃 (3초로 증가)
        setTimeout(() => {
          if (!resolved && this.audio.readyState < 2) {
            resolved = true;
            console.warn('⏰ Sound effect load timeout (readyState:', this.audio.readyState, '), attempting to play anyway...');
            // 타임아웃되어도 재생 시도
            tryPlay().then(success => resolve(success));
          }
        }, 3000);
      });
    }
  }

  // 볼륨 설정 (0.0 ~ 1.0)
  setVolume(volume) {
    this.volume = Math.max(0, Math.min(1, volume));
    if (this.audio) {
      this.audio.volume = this.volume;
    }
  }
}
