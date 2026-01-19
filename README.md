# Pose Runner

포즈 인식 기반 러너 게임

## 로컬에서 테스트하기

이 프로젝트는 ES6 모듈을 사용하므로 로컬 서버가 필요합니다.

### 방법 1: Python 사용 (가장 간단)

프로젝트 폴더에서 다음 명령어 실행:

```bash
# Python 3.x
python -m http.server 8000

# 또는 Python 2.x
python -m SimpleHTTPServer 8000
```

브라우저에서 `http://localhost:8000` 접속

### 방법 2: Node.js 사용

```bash
# npx 사용 (설치 불필요)
npx http-server -p 8000

# 또는 http-server 글로벌 설치 후
npm install -g http-server
http-server -p 8000
```

### 방법 3: VS Code Live Server

1. VS Code에서 프로젝트 열기
2. "Live Server" 확장 설치
3. `index.html` 우클릭 → "Open with Live Server"

### 방법 4: 다른 옵션

- PHP: `php -S localhost:8000`
- PHP 서버가 있다면 프로젝트 폴더에서 실행

## 사용 방법

1. 로컬 서버 실행 (위 방법 중 하나)
2. 브라우저에서 `http://localhost:8000` 접속
3. 카메라 권한 허용
4. "Start camera" → "Load pose" → "Calibrate" 순서로 진행
5. `T` 키로 테스트 패널 열기

## 특징

- 모듈화된 아키텍처 (Engine/Controller/Renderer/UI/Services)
- 포즈 엔진 교체 가능 (인터페이스 기반)
- 렌더러 교체 가능 (얼굴 캐릭터 등 추가 가능)
- 로컬 랭킹 (localStorage 기반)
- 실시간 포즈 인식 테스트 패널
