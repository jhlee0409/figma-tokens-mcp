# 설치 테스트 가이드

## 1. npm 레지스트리 확인

```bash
# 패키지가 npm에 등록되었는지 확인
npm view figma-tokens-mcp

# 최신 버전 확인
npm view figma-tokens-mcp version

# 전체 정보 보기
npm info figma-tokens-mcp
```

**예상 결과**: `figma-tokens-mcp@0.1.0` 정보가 표시됨

---

## 2. npx 직접 실행 테스트

```bash
# 도움말 출력 테스트
npx -y figma-tokens-mcp --help

# 버전 확인
npx -y figma-tokens-mcp --version

# 서버 시작 테스트 (Ctrl+C로 중단)
npx -y figma-tokens-mcp --figma-api-key=test123 --stdio
```

**예상 결과**:
- 패키지가 다운로드되고 실행됨
- 에러 없이 MCP 서버가 시작됨

---

## 3. Claude Desktop 설정 테스트

### macOS
```bash
# 설정 파일 열기
open ~/Library/Application\ Support/Claude/claude_desktop_config.json
```

### Windows
```
%APPDATA%\Claude\claude_desktop_config.json
```

### 설정 추가

```json
{
  "mcpServers": {
    "figma-tokens": {
      "command": "npx",
      "args": ["-y", "figma-tokens-mcp", "--figma-api-key=YOUR_FIGMA_TOKEN", "--stdio"]
    }
  }
}
```

**테스트 순서**:
1. 설정 파일 저장
2. Claude Desktop 완전히 종료
3. Claude Desktop 재시작
4. 🔌 아이콘 확인 (연결됨 상태)
5. Claude에게 "Figma 서버 상태 확인해줘" 요청

---

## 4. 실제 Figma 토큰으로 테스트

### Figma 토큰 발급
1. https://www.figma.com/settings 접속
2. Security 탭 → "Generate new token"
3. 토큰 이름 입력 후 Enter
4. `figd_`로 시작하는 토큰 복사

### 설정 업데이트
```json
{
  "mcpServers": {
    "figma-tokens": {
      "command": "npx",
      "args": [
        "-y",
        "figma-tokens-mcp",
        "--figma-api-key=figd_실제_토큰_여기에_붙여넣기",
        "--stdio"
      ]
    }
  }
}
```

### Claude에서 테스트
```
Figma 파일에서 디자인 토큰 추출해줘:
https://www.figma.com/file/YOUR_FILE_KEY/File-Name
```

---

## 5. 문제 해결

### "FIGMA_ACCESS_TOKEN이 설정되지 않았습니다"
- 설정 파일에 `--figma-api-key` 인자가 올바르게 추가되었는지 확인
- Claude Desktop을 완전히 재시작했는지 확인

### "401 Unauthorized"
- Figma 토큰이 올바른지 확인
- 토큰이 `figd_`로 시작하는지 확인
- Figma에서 새 토큰을 생성해보기

### "MCP 서버에 연결할 수 없습니다"
```bash
# Node.js 버전 확인 (18.0.0 이상 필요)
node --version

# npm 캐시 정리 후 재시도
npm cache clean --force
npx -y figma-tokens-mcp --version
```

---

## 6. 빠른 검증 스크립트

```bash
#!/bin/bash
echo "=== figma-tokens-mcp 설치 테스트 ==="

echo -e "\n1. npm 레지스트리 확인..."
npm view figma-tokens-mcp version

echo -e "\n2. npx 실행 테스트..."
npx -y figma-tokens-mcp --version 2>&1 | head -5

echo -e "\n3. MCP 서버 시작 테스트..."
timeout 3 npx -y figma-tokens-mcp --figma-api-key=test --stdio 2>&1 &
PID=$!
sleep 2
kill $PID 2>/dev/null
echo "✅ 서버 실행 확인"

echo -e "\n=== 테스트 완료 ==="
```

실행:
```bash
chmod +x test.sh
./test.sh
```

---

## 참고

- **공식 문서**: [README.md](README.md)
- **자세한 설정 가이드**: [SETUP.md](SETUP.md)
- **이슈 리포트**: https://github.com/jhlee0409/figma-tokens-mcp/issues
