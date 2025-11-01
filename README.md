# Figma Tokens MCP

[![npm version](https://img.shields.io/npm/v/figma-tokens-mcp.svg)](https://www.npmjs.com/package/figma-tokens-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> **Figma 디자인 토큰을 Tailwind CSS로 자동 변환하는 MCP 서버**

Figma 파일에서 디자인 토큰을 추출하고 Tailwind CSS 설정을 자동 생성하는 Model Context Protocol (MCP) 서버입니다.

## 주요 기능

- ✅ Figma Variables 및 Styles에서 디자인 토큰 추출
- ✅ Tailwind CSS v3/v4 설정 자동 생성
- ✅ React 컴포넌트 생성 (CVA variants 지원)
- ✅ 충돌 감지 및 해결
- ✅ TypeScript 완전 지원

## 빠른 시작

### 설치

```bash
npx -y figma-tokens-mcp
```

### 설정

#### 1. Figma Access Token 발급

**가장 빠른 방법**: 👉 https://www.figma.com/settings

1. Figma 로그인
2. Settings > **Security** 탭
3. **"Generate new token"** 클릭
4. 토큰 이름 입력 후 Enter
5. **즉시 복사** (한 번만 표시됩니다!)

> 📖 자세한 가이드: [SETUP.md](SETUP.md)

#### 2-A. Claude Code (CLI 도구)

```bash
claude mcp add "figma-tokens" -- npx -y figma-tokens-mcp --figma-api-key=YOUR_KEY --stdio
```

#### 2-B. Claude Desktop (앱) 설정 파일 수정

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "figma-tokens": {
      "command": "npx",
      "args": ["-y", "figma-tokens-mcp", "--figma-api-key=YOUR_KEY", "--stdio"]
    }
  }
}
```

또는 환경변수 방식:

```json
{
  "mcpServers": {
    "figma-tokens": {
      "command": "npx",
      "args": ["-y", "figma-tokens-mcp"],
      "env": {
        "FIGMA_ACCESS_TOKEN": "figd_YOUR_TOKEN_HERE"
      }
    }
  }
}
```

3. Claude Desktop 재시작

## 사용 방법

Claude Desktop에서 다음과 같이 요청하세요:

```
Figma 파일에서 디자인 토큰을 추출해줘:
https://www.figma.com/file/abc123/My-Design-System

그리고 Tailwind CSS v4 설정으로 변환해줘
```

## 사용 가능한 도구

| 도구 | 설명 |
|------|------|
| `extract_tokens` | Figma 파일에서 디자인 토큰 추출 |
| `convert_to_tailwind` | 토큰을 Tailwind CSS 설정으로 변환 |
| `generate_component` | React 컴포넌트 생성 (CVA variants) |
| `health_check` | 서버 상태 확인 |
| `get_server_info` | 서버 정보 조회 |

## 예제

### 1. 토큰 추출
```typescript
{
  "figmaFileUrl": "https://www.figma.com/file/abc123/Design-System",
  "extractionStrategy": "auto",
  "tokenTypes": ["colors", "typography"]
}
```

### 2. Tailwind 변환
```typescript
{
  "tokens": { /* 추출된 토큰 */ },
  "tailwindVersion": "v4",
  "typescript": true
}
```

### 3. 컴포넌트 생성
```typescript
{
  "componentName": "Button",
  "tokens": { /* 추출된 토큰 */ },
  "typescript": true
}
```

## 요구사항

- **Node.js**: 18.0.0 이상
- **Figma Access Token**: 개인 액세스 토큰 필요
- **MCP 클라이언트**: Claude Desktop 또는 호환 클라이언트

## 개발

```bash
# 저장소 클론
git clone https://github.com/jhlee0409/figma-tokens-mcp.git
cd figma-tokens-mcp

# 의존성 설치
pnpm install

# 빌드
pnpm build

# 테스트
pnpm test

# 개발 모드
pnpm dev
```

## 라이선스

MIT License - 자세한 내용은 [LICENSE](LICENSE) 파일을 참조하세요.

## 리소스

- [Model Context Protocol](https://modelcontextprotocol.io/)
- [Figma API](https://www.figma.com/developers/api)
- [Tailwind CSS](https://tailwindcss.com/docs)

---

**Made with ❤️ for designers and developers**
