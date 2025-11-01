# 설치 가이드

Figma Tokens MCP를 설치하는 다양한 방법을 제공합니다.

> 🔒 **중요**: 이 프로젝트는 오픈소스 MCP 서버입니다. **각 사용자가 자신의 Figma Personal Access Token을 사용**해야 하며, 서버는 토큰을 저장하거나 공유하지 않습니다.

## 🚀 빠른 설치

> 💡 **MCP 클라이언트 선택**
> - **Claude Code (CLI)**: HTTP transport 직접 지원, 명령어로 간단 설치
> - **Claude Desktop (GUI)**: Settings > Connectors 메뉴에서 설치 (Pro/Max/Team/Enterprise 플랜)
> - **기타 MCP 클라이언트**: 각 클라이언트의 설정 방법 참고

### 방법 1: **Vercel 배포** (가장 추천!)

```bash
# 1. Vercel CLI 설치
npm i -g vercel

# 2. 프로젝트 배포
vercel

# 3-A. Claude Code에서 사용
claude mcp add --transport http \
  --scope user \
  --header "Authorization: Bearer YOUR_FIGMA_TOKEN" \
  figma-tokens-mcp \
  https://your-project.vercel.app/api/mcp

# 3-B. Claude Desktop에서 사용
# Settings > Connectors > Add Connector
# URL: https://your-project.vercel.app/api/mcp
# Authentication: Bearer Token (YOUR_FIGMA_TOKEN)
```

**장점:**
- ✅ 각 사용자가 자신의 Figma 토큰 사용
- ✅ 무료 배포 가능
- ✅ 자동 HTTPS
- ✅ 팀 공유 용이
- ✅ GitHub 자동 배포 지원

[상세 가이드: VERCEL_DEPLOY.md](VERCEL_DEPLOY.md)

### 방법 2: Smithery (HTTP Transport)

```bash
claude mcp add --transport http \
  --scope user \
  --header "Authorization: Bearer YOUR_FIGMA_TOKEN" \
  figma-tokens-mcp \
  https://server.smithery.ai/@jhlee0409/figma-tokens-mcp/mcp
```

### 방법 3: 로컬 설치 (stdio)

```bash
claude mcp add --transport stdio \
  --scope user \
  --env FIGMA_ACCESS_TOKEN=YOUR_FIGMA_TOKEN \
  figma-tokens-mcp \
  -- npx -y @jhlee0409/figma-tokens-mcp
```

### 방법 3: Smithery CLI + Interactive Setup

```bash
# 1. Smithery로 설치
npx -y @smithery/cli@latest install @jhlee0409/figma-tokens-mcp --client claude

# 2. Interactive 설정 실행
npx figma-tokens-setup
```

### 방법 4: Claude Desktop 로컬 stdio 설정

**Claude Desktop의 경우 stdio transport만 지원합니다** (HTTP는 Settings > Connectors에서만 가능)

1. Figma Access Token 발급:
   - [Figma](https://www.figma.com/) → Settings → Account → Personal Access Tokens
   - "Generate new token" 클릭

2. `claude_desktop_config.json` 편집:

```json
{
  "mcpServers": {
    "figma-tokens": {
      "command": "npx",
      "args": ["-y", "@jhlee0409/figma-tokens-mcp"],
      "env": {
        "FIGMA_ACCESS_TOKEN": "your-figma-token-here"
      }
    }
  }
}
```

**설정 파일 위치:**
- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Windows: `%APPDATA%\Claude\claude_desktop_config.json`

3. Claude Desktop 재시작

## 📦 클라이언트별 지원 방식

| 클라이언트 | HTTP Transport | stdio Transport | 비고 |
|-----------|---------------|-----------------|------|
| **Claude Code (CLI)** | ✅ `claude mcp add` | ✅ `claude mcp add` | 모든 transport 지원 |
| **Claude Desktop (GUI)** | ✅ Settings > Connectors<br/>(Pro/Max/Team/Enterprise) | ✅ `claude_desktop_config.json` | HTTP는 유료 플랜만 |
| **기타 MCP 클라이언트** | 클라이언트마다 다름 | 대부분 지원 | 문서 참고 |

## 📦 Transport 방식 비교

| Transport | 장점 | 단점 | 사용 시나리오 |
|-----------|------|------|--------------|
| **HTTP** | - 서버리스 배포<br/>- 확장성 좋음<br/>- 중앙 관리<br/>- 팀 공유 용이 | - 네트워크 필요<br/>- 약간의 지연<br/>- Claude Desktop은 유료 플랜 | - Claude Code 사용<br/>- 팀 협업<br/>- 프로덕션 |
| **stdio** | - 로컬 실행<br/>- 빠름<br/>- 오프라인 가능<br/>- 모든 플랜 지원 | - 개인 설정 필요<br/>- 버전 관리 수동 | - Claude Desktop 무료 플랜<br/>- 개인 개발<br/>- 오프라인 |

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
claude mcp add --transport http \
  --scope user \
  --header "Authorization: Bearer YOUR_FIGMA_TOKEN" \
  figma-tokens-mcp \
  https://your-project.vercel.app/api/mcp
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
팀에서 사용하는 경우, Vercel 배포를 추천합니다:
```bash
# 각 팀원이 자신의 Figma 토큰 사용
claude mcp add --transport http \
  --scope user \
  --header "Authorization: Bearer YOUR_FIGMA_TOKEN" \
  figma-tokens-mcp \
  https://your-project.vercel.app/api/mcp
```

> 💡 **--scope user**: 모든 프로젝트에서 이 MCP 서버를 사용할 수 있습니다.

### 보안
- ⚠️ Token을 Git에 커밋하지 마세요
- ✅ 환경 변수나 Secret Manager 사용
- ✅ 필요한 최소 권한만 부여
- ✅ 주기적으로 토큰 갱신

### 성능
HTTP transport는 첫 요청에 약간의 지연이 있지만, 이후 요청은 빠릅니다.
로컬 개발 시 속도가 중요하다면 stdio transport를 사용하세요.
