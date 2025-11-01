# 설치 가이드

Figma Tokens MCP를 설치하는 다양한 방법을 제공합니다.

## 🚀 빠른 설치

### 방법 1: **Vercel 배포** (가장 추천!)

```bash
# 1. Vercel CLI 설치
npm i -g vercel

# 2. 프로젝트 배포
vercel

# 3. 환경 변수 설정
vercel env add FIGMA_ACCESS_TOKEN

# 4. Claude Code에서 사용
claude mcp add figma-tokens-mcp \
  "https://your-project.vercel.app/api/mcp" \
  --transport http
```

**장점:**
- ✅ 헤더 설정 불필요 (환경 변수로 자동 처리)
- ✅ 무료 배포 가능
- ✅ 자동 HTTPS
- ✅ 팀 공유 용이
- ✅ GitHub 자동 배포 지원

[상세 가이드: VERCEL_DEPLOY.md](VERCEL_DEPLOY.md)

### 방법 2: Smithery (HTTP Transport)

```bash
claude mcp add figma-tokens-mcp \
  "https://server.smithery.ai/@jhlee0409/figma-tokens-mcp/mcp" \
  --transport http \
  --header "Authorization: Bearer YOUR_FIGMA_TOKEN"
```

### 방법 3: 로컬 설치 (stdio)

```bash
npx @jhlee0409/figma-tokens-mcp install --figma-token YOUR_FIGMA_TOKEN
```

### 방법 3: Smithery CLI + Interactive Setup

```bash
# 1. Smithery로 설치
npx -y @smithery/cli@latest install @jhlee0409/figma-tokens-mcp --client claude

# 2. Interactive 설정 실행
npx figma-tokens-setup
```

### 방법 4: 수동 설정 (Claude Desktop)

1. Figma Access Token 발급:
   - [Figma](https://www.figma.com/) → Settings → Account → Personal Access Tokens
   - "Generate new token" 클릭

2. `claude_desktop_config.json` 편집:

```json
{
  "mcpServers": {
    "figma-tokens": {
      "command": "npx",
      "args": ["-y", "figma-tokens-mcp"],
      "env": {
        "FIGMA_ACCESS_TOKEN": "your-figma-token-here"
      }
    }
  }
}
```

3. Claude Desktop 재시작

## 📦 Transport 방식 비교

| Transport | 장점 | 단점 | 사용 시나리오 |
|-----------|------|------|--------------|
| **HTTP** | - 서버리스 배포<br/>- 확장성 좋음<br/>- 중앙 관리 | - 네트워크 필요<br/>- 약간의 지연 | - 팀 공유<br/>- 프로덕션 |
| **stdio** | - 로컬 실행<br/>- 빠름<br/>- 오프라인 가능 | - 개인 설정 필요<br/>- 버전 관리 수동 | - 개인 개발<br/>- 오프라인 |

## 🔑 Figma Access Token 발급 방법

### 1. Figma 로그인
[Figma](https://www.figma.com/)에 로그인합니다.

### 2. Personal Access Token 생성
1. **Settings** (오른쪽 상단 프로필)
2. **Account** 탭
3. **Personal Access Tokens** 섹션
4. **"Generate new token"** 클릭
5. Token 이름 입력 (예: "MCP Server")
6. **"Generate"** 클릭
7. 생성된 토큰 복사 (⚠️ 한 번만 표시됨!)

### 3. Token 권한
생성된 토큰은 다음 권한을 가집니다:
- ✅ 파일 읽기
- ✅ Variables 읽기
- ✅ Styles 읽기
- ❌ 파일 쓰기 (필요 없음)

## 🛠️ 설치 확인

설치가 완료되었는지 확인하려면:

### Claude Code (HTTP)
```bash
claude mcp list
```

출력에 `figma-tokens-mcp`가 있으면 성공!

### Claude Desktop
Claude Desktop을 재시작하고, 다음과 같이 요청:
```
Figma 파일에서 디자인 토큰 추출해줘:
https://www.figma.com/file/YOUR_FILE_ID/Design-System
```

## 🔧 문제 해결

### "FIGMA_ACCESS_TOKEN not configured" 오류

**HTTP Transport:**
```bash
# Header로 토큰 전달
claude mcp add figma-tokens-mcp \
  "https://server.smithery.ai/@jhlee0409/figma-tokens-mcp/mcp" \
  --transport http \
  --header "X-Figma-Token: YOUR_TOKEN"
```

**stdio Transport:**
설정 파일에 `env` 필드가 있는지 확인:
```json
{
  "env": {
    "FIGMA_ACCESS_TOKEN": "figd_..."
  }
}
```

### Token이 만료된 경우
Figma에서 새 토큰을 생성하고 설정을 업데이트하세요.

### MCP 서버가 보이지 않는 경우
1. Claude Desktop/Code 완전히 재시작
2. `claude mcp list` 또는 설정 파일 확인
3. 로그 확인 (Claude Desktop: `~/Library/Logs/Claude/`)

## 📚 다음 단계

설치가 완료되었다면:
- [사용 가이드](docs/USAGE.md) - 기본 사용법 및 예제
- [API 문서](docs/API.md) - 모든 도구 및 옵션
- [예제](examples/) - 실제 프로젝트 예제

## 💡 팁

### 여러 환경에서 사용
팀에서 사용하는 경우, HTTP transport를 추천합니다:
```bash
# 모든 팀원이 같은 명령어 사용
claude mcp add figma-tokens-mcp \
  "https://server.smithery.ai/@jhlee0409/figma-tokens-mcp/mcp" \
  --transport http \
  --header "X-Figma-Token: TEAM_SHARED_TOKEN"
```

### 보안
- ⚠️ Token을 Git에 커밋하지 마세요
- ✅ 환경 변수나 Secret Manager 사용
- ✅ 필요한 최소 권한만 부여
- ✅ 주기적으로 토큰 갱신

### 성능
HTTP transport는 첫 요청에 약간의 지연이 있지만, 이후 요청은 빠릅니다.
로컬 개발 시 속도가 중요하다면 stdio transport를 사용하세요.
