# Vercel 배포 가이드

## 🚀 빠른 시작

### 1. Vercel 프로젝트 생성

```bash
# Vercel CLI 설치
npm i -g vercel

# 로그인
vercel login

# 프로젝트 연결
vercel link
```

### 2. 환경 변수 설정

Vercel 대시보드에서 환경 변수를 설정하거나 CLI로 설정:

```bash
# Production 환경 변수 설정
vercel env add FIGMA_ACCESS_TOKEN production

# Development 환경 변수 설정
vercel env add FIGMA_ACCESS_TOKEN development

# Preview 환경 변수 설정
vercel env add FIGMA_ACCESS_TOKEN preview
```

**또는 Vercel 대시보드에서:**
1. 프로젝트 → Settings → Environment Variables
2. `FIGMA_ACCESS_TOKEN` 추가
3. 값: Figma Personal Access Token 입력

### 3. 배포

```bash
# Preview 배포
vercel

# Production 배포
vercel --prod
```

## 📦 배포 완료 후

배포가 완료되면 다음과 같은 URL을 받습니다:
```
https://your-project.vercel.app/api/mcp
```

## 🔧 Claude Code에서 사용

```bash
claude mcp add figma-tokens-mcp \
  "https://your-project.vercel.app/api/mcp" \
  --transport http
```

환경 변수가 Vercel에 설정되어 있으므로 **별도의 헤더 설정 불필요**!

## ✅ 테스트

배포 후 health check로 확인:

```bash
curl https://your-project.vercel.app/api/mcp/health
```

## 🔄 자동 배포

GitHub 연동 시 자동 배포:
1. Vercel 대시보드 → New Project
2. Import Git Repository 선택
3. GitHub 저장소 연결
4. Environment Variables 설정
5. Deploy 클릭

이후 `main` 브랜치에 푸시하면 자동으로 배포됩니다!

## 🐛 문제 해결

### Figma Token 에러
```
Error: FIGMA_ACCESS_TOKEN not configured
```

**해결**: Vercel 환경 변수가 제대로 설정되었는지 확인
```bash
vercel env ls
```

### 빌드 에러
```bash
# 로컬에서 먼저 테스트
pnpm build

# Vercel 로그 확인
vercel logs
```

## 📊 모니터링

- **로그**: Vercel 대시보드 → Deployments → Logs
- **Analytics**: Vercel 대시보드 → Analytics
- **Functions**: 각 API route의 실행 통계 확인

## 💰 비용

- **Hobby Plan**: 무료
  - 100GB 대역폭/월
  - 100GB-hours 함수 실행 시간
  - 1,000 이미지 최적화

대부분의 개인 프로젝트는 무료 플랜으로 충분합니다!
