# Vercel 배포 가이드

> 🌐 **오픈소스 배포**: 이 가이드는 오픈소스 MCP 서버를 배포하여 **누구나** 자신의 Figma 토큰으로 사용할 수 있도록 하는 방법입니다.

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

### 2. 배포

```bash
# Preview 배포
vercel

# Production 배포
vercel --prod
```

배포가 완료되면 다음과 같은 URL을 받습니다:
```
https://your-project.vercel.app/api/mcp
```

## 🔧 Claude Code에서 사용

**각 사용자가 자신의 Figma 토큰을 사용합니다:**

```bash
claude mcp add figma-tokens-mcp \
  "https://your-project.vercel.app/api/mcp" \
  --transport http \
  --header "Authorization: Bearer YOUR_FIGMA_TOKEN"
```

> 💡 **중요**: 서버에 환경 변수를 설정하지 않습니다. 각 사용자가 요청 시마다 자신의 Figma 토큰을 `Authorization` 헤더로 전달합니다.

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

**해결**: Authorization 헤더가 올바르게 설정되었는지 확인
```bash
# 올바른 형식
claude mcp add figma-tokens-mcp \
  "https://your-project.vercel.app/api/mcp" \
  --transport http \
  --header "Authorization: Bearer YOUR_FIGMA_TOKEN"
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

## 🔒 보안

- 각 사용자가 자신의 Figma 토큰을 사용하므로 **토큰 공유 불필요**
- 서버는 토큰을 저장하지 않고 요청마다 전달받음
- `withMcpAuth`를 통한 안전한 인증 처리
- Authorization 헤더는 HTTPS로 암호화되어 전송
