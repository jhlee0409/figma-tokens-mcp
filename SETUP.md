# Figma Tokens MCP 설정 가이드

## 1단계: Figma Access Token 발급

### 방법 1: Figma 웹사이트에서 직접 발급

1. **Figma에 로그인**
   - https://www.figma.com/ 접속
   - 계정 로그인

2. **설정 메뉴 열기**
   - 좌측 상단 프로필 아이콘 클릭
   - **"Settings"** 선택

3. **보안 탭으로 이동**
   - **"Security"** 탭 클릭

4. **토큰 생성**
   - "Personal access tokens" 섹션 찾기
   - **"Generate new token"** 버튼 클릭
   - 토큰 이름 입력 (예: "Claude MCP")
   - **Enter 키** 누르기

5. **토큰 복사**
   - 생성된 토큰이 **한 번만** 표시됩니다
   - 반드시 **즉시 복사**하세요
   - 토큰은 `figd_` 로 시작합니다
   - 예: `figd_AbCdEfGhIjKlMnOpQrStUvWxYz1234567890`

⚠️ **중요**: 페이지를 벗어나면 토큰을 다시 볼 수 없습니다!

### 방법 2: 다이렉트 링크

빠르게 접근하려면 이 링크를 사용하세요:
👉 https://www.figma.com/settings

## 2단계: Claude Desktop 설정

### macOS 사용자

1. **설정 파일 열기**
   ```bash
   open ~/Library/Application\ Support/Claude/claude_desktop_config.json
   ```

2. **설정 추가** (두 가지 방법 중 선택)

   **방법 1: CLI 인자 (권장)** - Figma-Context-MCP와 동일
   ```json
   {
     "mcpServers": {
       "figma-tokens": {
         "command": "npx",
         "args": [
           "-y",
           "figma-tokens-mcp",
           "--figma-api-key=figd_여기에_복사한_토큰_붙여넣기",
           "--stdio"
         ]
       }
     }
   }
   ```

   **방법 2: 환경변수**
   ```json
   {
     "mcpServers": {
       "figma-tokens": {
         "command": "npx",
         "args": ["-y", "figma-tokens-mcp"],
         "env": {
           "FIGMA_ACCESS_TOKEN": "figd_여기에_복사한_토큰_붙여넣기"
         }
       }
     }
   }
   ```

### Windows 사용자

1. **설정 파일 열기**
   - 탐색기에서 `%APPDATA%\Claude\` 폴더 열기
   - `claude_desktop_config.json` 파일 편집

2. **설정 추가** (위 macOS와 동일한 내용)

## 3단계: Claude Desktop 재시작

1. Claude Desktop 완전히 종료
2. Claude Desktop 다시 실행
3. 🔌 MCP 아이콘 확인 (연결됨)

## 4단계: 테스트

Claude에게 다음과 같이 물어보세요:

```
Figma 서버 상태 확인해줘
```

또는

```
Figma 파일에서 디자인 토큰 추출해줘:
https://www.figma.com/file/YOUR_FILE_KEY/File-Name
```

## 문제 해결

### "FIGMA_ACCESS_TOKEN이 설정되지 않았습니다"

- 설정 파일에 토큰을 올바르게 붙여넣었는지 확인
- 토큰이 `figd_`로 시작하는지 확인
- Claude Desktop을 완전히 재시작했는지 확인

### "401 Unauthorized"

- 토큰이 만료되었을 수 있습니다
- Figma에서 새 토큰을 생성하세요
- 토큰을 올바르게 복사했는지 확인

### "MCP 서버에 연결할 수 없습니다"

```bash
# Node.js가 설치되어 있는지 확인
node --version

# 18.0.0 이상이어야 합니다
# 없다면 https://nodejs.org/ 에서 설치
```

## 보안 주의사항

⚠️ **Figma Access Token은 비밀번호와 같습니다!**

- 토큰을 다른 사람과 공유하지 마세요
- GitHub에 커밋하지 마세요
- 의심스러운 경우 Figma에서 토큰을 삭제하고 새로 생성하세요

## 토큰 삭제 방법

1. Figma Settings > Security
2. Personal access tokens 섹션
3. 해당 토큰 옆의 **휴지통 아이콘** 클릭
4. 확인

---

## 추가 도움말

- [Figma API 공식 문서](https://www.figma.com/developers/api)
- [Model Context Protocol](https://modelcontextprotocol.io/)
- [이슈 리포트](https://github.com/jhlee0409/figma-tokens-mcp/issues)
