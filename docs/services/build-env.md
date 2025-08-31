# 빌드/환경 서비스 (Build & Environment Service)

## 목적/역할
- Vite 기반 빌드 시스템 관리 및 최적화
- TypeScript 설정 및 타입 검사 환경
- Tailwind CSS + PostCSS 스타일링 파이프라인
- 환경 변수 관리 및 배포 설정
- 개발 도구 및 품질 관리 (ESLint, 타입 체크)

## 공개 API

### npm 스크립트
```bash
# 개발 서버 (포트 8080)
npm run dev

# 프로덕션 빌드
npm run build

# 개발 모드 빌드 
npm run build:dev

# ESLint 검사
npm run lint

# 빌드 결과 미리보기
npm run preview
```

### 환경 변수 사용법
```tsx
// Vite 환경 변수 (VITE_ 접두사)
const apiUrl = import.meta.env.VITE_API_BASE_URL
const isDev = import.meta.env.DEV
const isProd = import.meta.env.PROD

// 환경별 설정
interface AppConfig {
  apiBaseUrl: string
  enableAnalytics: boolean
  debugMode: boolean
}

const config: AppConfig = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000',
  enableAnalytics: import.meta.env.PROD,
  debugMode: import.meta.env.DEV
}
```

### 경로 별칭
```tsx
// TypeScript + Vite 경로 별칭 (@/ → src/)
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import heroImage from "@/assets/hero-image.jpg"
```

## 내부 설계

### Vite 설정 분석
```ts
// vite.config.ts
export default defineConfig(({ mode }) => ({
  server: {
    host: "::", // 모든 네트워크 인터페이스에서 접근 가능
    port: 8080, // 기본 포트 (3000 대신 8080 사용)
  },
  plugins: [
    react(), // @vitejs/plugin-react-swc 사용 (SWC 기반 빠른 컴파일)
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"), // 절대 경로 별칭
    },
  },
}))
```

### TypeScript 설정 구조
```json
// tsconfig.json (Project References 방식)
{
  "files": [], // 루트에서 파일 지정 안함
  "references": [
    { "path": "./tsconfig.app.json" }, // 앱 코드용
    { "path": "./tsconfig.node.json" }  // Node.js 도구용
  ],
  "compilerOptions": {
    "baseUrl": ".",
    "paths": { "@/*": ["./src/*"] }, // 경로 별칭
    
    // 타입 체크 완화 설정 (주의 필요)
    "noImplicitAny": false,
    "noUnusedParameters": false,
    "noUnusedLocals": false,
    "strictNullChecks": false,
    "skipLibCheck": true,
    "allowJs": true
  }
}
```

### 패키지 의존성 구조
- **React 18**: 프레임워크 코어
- **Vite 5**: 빌드 도구 (SWC 플러그인)
- **TypeScript 5**: 타입 시스템
- **Tailwind CSS**: 스타일링 시스템
- **shadcn/ui + Radix**: UI 컴포넌트 라이브러리
- **React Router**: 클라이언트 사이드 라우팅

### 빌드 파이프라인
1. **개발**: `vite dev` → SWC 변환 → HMR
2. **빌드**: `tsc -b && vite build` → 타입 체크 → Rollup 번들링
3. **미리보기**: `vite preview` → 정적 서버로 빌드 결과 확인

## 의존성

### 핵심 빌드 도구
- **Vite 5.4.19**: 빌드 도구 및 개발 서버
- **@vitejs/plugin-react-swc**: SWC 기반 React 변환
- **TypeScript 5.8.3**: 타입 체크 및 변환

### 스타일링 도구
- **Tailwind CSS 3.4.17**: 유틸리티 CSS 프레임워크
- **PostCSS 8.5.6**: CSS 처리 도구
- **Autoprefixer 10.4.21**: 벤더 접두사 자동 추가

### 품질 관리 도구
- **ESLint 9**: 코드 린팅 (React 플러그인 포함)
- **TypeScript ESLint**: TS 전용 린트 규칙

### 추가 라이브러리
- **TanStack Query**: 데이터 패칭 (도입됨)
- **React Hook Form + Zod**: 폼 처리 및 검증
- **date-fns**: 날짜 처리
- **next-themes**: 테마 관리

## 예외/에러 처리

### 환경 변수 안전 처리
```tsx
// 환경 변수 검증
const requiredEnvVars = ['VITE_API_BASE_URL'] as const

function validateEnv() {
  const missing = requiredEnvVars.filter(
    key => !import.meta.env[key]
  )
  
  if (missing.length > 0) {
    console.warn(`Missing environment variables: ${missing.join(', ')}`)
    // 개발 환경에서는 기본값 사용, 프로덕션에서는 에러
    if (import.meta.env.PROD) {
      throw new Error(`Required environment variables are missing: ${missing.join(', ')}`)
    }
  }
}

// 앱 초기화 시 검증
validateEnv()

// 타입 안전한 환경 변수 접근
interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string
  readonly VITE_SENTRY_DSN?: string
  readonly VITE_GA_TRACKING_ID?: string
  // ... 기타 환경 변수
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
```

### 빌드 시간 오류 방지
```ts
// vite.config.ts에서 빌드 최적화
export default defineConfig(({ mode }) => ({
  // ... 기존 설정
  
  build: {
    // 빌드 타겟 설정
    target: 'es2020',
    
    // 소스맵 설정 (개발/프로덕션 분리)
    sourcemap: mode === 'development',
    
    // 청크 분할 최적화
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-toast'],
          router: ['react-router-dom']
        }
      }
    },
    
    // 빌드 크기 경고 임계값
    chunkSizeWarningLimit: 1000
  },
  
  // CSS 최적화
  css: {
    devSourcemap: mode === 'development'
  }
}))
```

### TypeScript 엄격성 개선
```json
// tsconfig.app.json (현재 설정 개선 권장)
{
  "compilerOptions": {
    "strict": true, // 모든 엄격 체크 활성화
    "noImplicitAny": true, // 암시적 any 금지
    "strictNullChecks": true, // null/undefined 엄격 체크
    "noUnusedLocals": true, // 사용하지 않는 지역 변수 체크
    "noUnusedParameters": true, // 사용하지 않는 매개변수 체크
    "exactOptionalPropertyTypes": true, // 선택적 프로퍼티 엄격 체크
    "noImplicitReturns": true, // 모든 코드 경로에서 반환값 보장
    "noFallthroughCasesInSwitch": true // switch문 fallthrough 방지
  }
}
```

## 테스트 포인트

### 빌드 검증
```bash
# 빌드 성공 테스트
npm run build
echo $? # 0이면 성공

# 타입 체크 테스트
npx tsc --noEmit
echo $? # 0이면 성공

# 린트 테스트
npm run lint
echo $?
```

### 환경 변수 테스트
```tsx
describe('환경 설정', () => {
  test('필수 환경 변수 존재', () => {
    expect(import.meta.env.VITE_API_BASE_URL).toBeDefined()
  })
  
  test('개발/프로덕션 모드 구분', () => {
    if (import.meta.env.DEV) {
      expect(import.meta.env.PROD).toBe(false)
    } else {
      expect(import.meta.env.PROD).toBe(true)
    }
  })
})
```

### 번들 크기 테스트
```bash
# 번들 분석 도구 설치
npm install --save-dev rollup-plugin-visualizer

# vite.config.ts에 플러그인 추가
import { visualizer } from 'rollup-plugin-visualizer'

export default defineConfig({
  plugins: [
    react(),
    visualizer({ 
      filename: 'dist/stats.html',
      open: true,
      gzipSize: true
    })
  ]
})
```

### 개발 서버 테스트
```tsx
describe('개발 서버', () => {
  test('HMR 동작', () => {
    // 컴포넌트 변경 시 페이지 새로고침 없이 업데이트
    // E2E 테스트 도구로 검증
  })
  
  test('경로 별칭 동작', () => {
    // @/ 별칭이 src/로 올바르게 해결되는지
    expect(() => import('@/components/ui/button')).not.toThrow()
  })
})
```

## 코드 리뷰 체크리스트

### 빌드 설정
- [ ] Vite 플러그인이 적절히 설정되었는가?
- [ ] 환경별 빌드 설정이 분리되었는가?
- [ ] 소스맵 설정이 환경에 맞게 구성되었는가?
- [ ] 청크 분할이 최적화되었는가?

### TypeScript 설정
- [ ] strict 모드가 활성화되었는가?
- [ ] 경로 별칭이 올바르게 설정되었는가?
- [ ] any 타입 사용이 최소화되었는가?
- [ ] 불필요한 타입 선언이 없는가?

### 환경 변수
- [ ] VITE_ 접두사를 올바르게 사용하는가?
- [ ] 민감한 정보가 클라이언트에 노출되지 않는가?
- [ ] 환경별 설정 파일이 구분되었는가?
- [ ] 기본값이 적절히 설정되었는가?

### 성능
- [ ] 불필요한 의존성이 포함되지 않았는가?
- [ ] 트리 쉐이킹이 적용 가능한가?
- [ ] 번들 크기가 적정 수준인가?
- [ ] 지연 로딩이 적절히 활용되었는가?

## 확장 가이드

### 개발 도구 추가
```bash
# Vitest 테스트 프레임워크
npm install --save-dev vitest @vitest/ui jsdom
npm install --save-dev @testing-library/react @testing-library/jest-dom

# Storybook 컴포넌트 카탈로그
npx storybook@latest init

# Bundle Analyzer
npm install --save-dev rollup-plugin-visualizer

# PWA 지원
npm install --save-dev vite-plugin-pwa
```

### Vitest 설정
```ts
// vitest.config.ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react-swc'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
    css: true
  },
})

// src/test/setup.ts
import '@testing-library/jest-dom'
```

### 환경별 설정 파일
```bash
# 환경 파일 구조
.env                # 모든 환경 공통
.env.local          # 로컬 개발 (gitignore)
.env.development    # 개발 환경
.env.production     # 프로덕션 환경
.env.staging        # 스테이징 환경
```

```env
# .env
VITE_APP_TITLE=AI 페어 프로그래머
VITE_APP_VERSION=1.0.0

# .env.development
VITE_API_BASE_URL=http://localhost:8787
VITE_DEBUG_MODE=true
VITE_ENABLE_MOCK=true

# .env.production
VITE_API_BASE_URL=https://api.ai-pair-programmer.com
VITE_DEBUG_MODE=false
VITE_ENABLE_ANALYTICS=true
VITE_SENTRY_DSN=https://...
```

### PWA 설정
```ts
// vite.config.ts
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png'],
      manifest: {
        name: 'AI 페어 프로그래머',
        short_name: 'AI Pair',
        description: '지능형 개발 동반자',
        theme_color: '#ffffff',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png', 
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ]
})
```

### Docker 배포 설정
```dockerfile
# Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

```nginx
# nginx.conf
server {
    listen 80;
    server_name localhost;
    
    location / {
        root /usr/share/nginx/html;
        index index.html index.htm;
        try_files $uri $uri/ /index.html;
    }
    
    # 정적 자산 캐싱
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Gzip 압축
    gzip on;
    gzip_vary on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
}
```

### CI/CD 설정
```yaml
# .github/workflows/ci.yml
name: CI/CD

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      
      - run: npm ci
      - run: npm run lint
      - run: npm run build
      - run: npm run test

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      
      - run: npm ci
      - run: npm run build
        env:
          VITE_API_BASE_URL: ${{ secrets.VITE_API_BASE_URL }}
          VITE_SENTRY_DSN: ${{ secrets.VITE_SENTRY_DSN }}
      
      - name: Deploy to Vercel
        uses: vercel/action@v1
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
```

## 예시/스니펫

### 환경 설정 관리
```tsx
// src/config/app.ts
interface AppConfig {
  apiBaseUrl: string
  enableAnalytics: boolean
  enableMocking: boolean
  debugMode: boolean
  version: string
  sentryDsn?: string
}

function createAppConfig(): AppConfig {
  const env = import.meta.env
  
  return {
    apiBaseUrl: env.VITE_API_BASE_URL || 'http://localhost:8787',
    enableAnalytics: env.VITE_ENABLE_ANALYTICS === 'true',
    enableMocking: env.VITE_ENABLE_MOCK === 'true',
    debugMode: env.DEV || env.VITE_DEBUG_MODE === 'true',
    version: env.VITE_APP_VERSION || '1.0.0',
    sentryDsn: env.VITE_SENTRY_DSN
  }
}

export const appConfig = createAppConfig()

// 타입 안전한 환경 변수 접근
export function getEnvVar(key: keyof ImportMetaEnv): string {
  const value = import.meta.env[key]
  if (!value) {
    throw new Error(`Environment variable ${key} is not defined`)
  }
  return value
}
```

### 개발 도구 통합
```tsx
// src/utils/devtools.ts
export function initDevTools() {
  if (import.meta.env.DEV) {
    // React DevTools 활성화
    if (typeof window !== 'undefined') {
      (window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__ = (window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__ || {}
    }
    
    // TanStack Query DevTools
    import('@tanstack/react-query-devtools').then(({ ReactQueryDevtools }) => {
      // DevTools 컴포넌트를 동적으로 추가
    })
    
    // 개발용 전역 유틸리티
    if (typeof window !== 'undefined') {
      (window as any).appConfig = appConfig
      (window as any).clearStorage = () => {
        localStorage.clear()
        sessionStorage.clear()
        console.log('Storage cleared')
      }
    }
  }
}

// main.tsx에서 호출
import { initDevTools } from './utils/devtools'

initDevTools()
```

### 빌드 정보 표시
```tsx
// src/components/BuildInfo.tsx
interface BuildInfo {
  version: string
  buildTime: string
  gitHash: string
  environment: string
}

// Vite 플러그인으로 빌드 정보 주입
function getBuildInfo(): BuildInfo {
  return {
    version: import.meta.env.VITE_APP_VERSION || '1.0.0',
    buildTime: import.meta.env.VITE_BUILD_TIME || new Date().toISOString(),
    gitHash: import.meta.env.VITE_GIT_HASH || 'unknown',
    environment: import.meta.env.MODE
  }
}

export function BuildInfo() {
  const buildInfo = getBuildInfo()
  
  if (!import.meta.env.DEV) return null
  
  return (
    <div className="fixed bottom-4 right-4 text-xs text-muted-foreground bg-muted p-2 rounded">
      <div>v{buildInfo.version}</div>
      <div>{buildInfo.environment}</div>
      <div>{buildInfo.gitHash.slice(0, 7)}</div>
    </div>
  )
}

// vite.config.ts에서 환경 변수 주입
import { execSync } from 'child_process'

export default defineConfig(({ mode }) => ({
  define: {
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
    __GIT_HASH__: JSON.stringify(
      execSync('git rev-parse HEAD').toString().trim()
    )
  },
  // ...
}))
```

## 성능 최적화

### 번들 최적화
```ts
// vite.config.ts 최적화 설정
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // 벤더 라이브러리 분리
          'vendor-react': ['react', 'react-dom'],
          'vendor-router': ['react-router-dom'],
          'vendor-ui': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-toast',
            '@radix-ui/react-dropdown-menu'
          ],
          'vendor-utils': [
            'clsx',
            'tailwind-merge', 
            'class-variance-authority'
          ],
          'vendor-icons': ['lucide-react']
        }
      }
    },
    
    // 압축 최적화
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // 프로덕션에서 console.log 제거
        drop_debugger: true
      }
    }
  }
})
```

### 개발 서버 최적화
```ts
// vite.config.ts
export default defineConfig({
  server: {
    // 파일 감시 최적화
    watch: {
      ignored: ['**/node_modules/**', '**/dist/**']
    },
    
    // 미들웨어 모드 (필요시)
    middlewareMode: false,
    
    // CORS 설정 (API 서버가 다른 포트일 때)
    cors: true,
    
    // 프록시 설정 (API 호출 프록시)
    proxy: {
      '/api': {
        target: 'http://localhost:8787',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  },
  
  // 의존성 사전 번들링 최적화
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'lucide-react'
    ],
    exclude: ['@tanstack/react-query-devtools']
  }
})
```

## 변경 이력

### v1.0 (2024-01-15)
- 초기 문서화
- Vite + React + TypeScript 설정 분석
- 현재 패키지 의존성 정리

### v1.1 (계획)
- TypeScript strict 모드 활성화
- Vitest 테스트 환경 구축
- PWA 기능 추가
- CI/CD 파이프라인 구성