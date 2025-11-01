#!/usr/bin/env node

/**
 * Figma Tokens MCP - 원클릭 설치 스크립트
 *
 * 사용법:
 *   npx @jhlee0409/figma-tokens-mcp install --figma-token YOUR_TOKEN
 *   또는
 *   npm run install -- --figma-token YOUR_TOKEN
 */

import { execSync } from 'child_process';
import { parseArgs } from 'util';

const { values } = parseArgs({
  options: {
    'figma-token': { type: 'string' },
    'smithery-key': { type: 'string' },
    'client': { type: 'string', default: 'claude' },
    'help': { type: 'boolean', short: 'h' }
  },
  allowPositionals: false
});

if (values.help) {
  console.log(`
🚀 Figma Tokens MCP - 원클릭 설치

사용법:
  npx @jhlee0409/figma-tokens-mcp install --figma-token YOUR_FIGMA_TOKEN

옵션:
  --figma-token      Figma Access Token (필수)
  --smithery-key     Smithery API Key (선택, 기본값 제공)
  --client           AI Client (기본: claude)
  --help, -h         도움말 표시

예제:
  npx @jhlee0409/figma-tokens-mcp install --figma-token figd_abc123xyz
  `);
  process.exit(0);
}

if (!values['figma-token']) {
  console.error('❌ --figma-token 옵션이 필요합니다.\n');
  console.log('사용법: npx @jhlee0409/figma-tokens-mcp install --figma-token YOUR_TOKEN');
  console.log('도움말: npx @jhlee0409/figma-tokens-mcp install --help');
  process.exit(1);
}

const smitheryKey = values['smithery-key'] || '4685f058-0354-4f45-85c4-1f7cc6abf0d0';
const client = values.client;
const figmaToken = values['figma-token'];

console.log('\n🚀 Figma Tokens MCP 설치를 시작합니다...\n');

// Smithery config JSON 생성
const config = {
  env: {
    FIGMA_ACCESS_TOKEN: figmaToken
  }
};

const configJson = JSON.stringify(config);

try {
  // Smithery CLI로 설치 (--config 옵션 사용)
  const installCmd = `npx -y @smithery/cli@latest install @jhlee0409/figma-tokens-mcp --client ${client} --key ${smitheryKey} --config '${configJson}'`;

  console.log('📦 패키지 설치 중...');
  execSync(installCmd, { stdio: 'inherit' });

  console.log('\n✅ 설치가 완료되었습니다!\n');
  console.log('📋 다음 단계:');
  console.log(`   1. ${client === 'claude' ? 'Claude Desktop' : client}을 재시작하세요`);
  console.log('   2. "Figma 파일에서 디자인 토큰 추출해줘" 라고 요청하세요\n');

} catch (error) {
  console.error('\n❌ 설치 중 오류가 발생했습니다:', error.message);
  process.exit(1);
}
