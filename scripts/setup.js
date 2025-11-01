#!/usr/bin/env node

/**
 * Figma Tokens MCP - 자동 설정 스크립트
 *
 * 사용법:
 *   npx figma-tokens-mcp setup
 *   또는
 *   npm run setup
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';
import readline from 'readline';

const CONFIG_PATH = join(homedir(), 'Library', 'Application Support', 'Claude', 'claude_desktop_config.json');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function setup() {
  console.log('\n🚀 Figma Tokens MCP 자동 설정을 시작합니다!\n');

  // 1. Config 파일 확인
  if (!existsSync(CONFIG_PATH)) {
    console.error('❌ Claude Desktop 설정 파일을 찾을 수 없습니다.');
    console.error(`   경로: ${CONFIG_PATH}`);
    console.error('\n💡 Claude Desktop이 설치되어 있는지 확인하세요.');
    process.exit(1);
  }

  // 2. Figma 토큰 입력받기
  console.log('📝 Figma Access Token이 필요합니다.');
  console.log('   발급 방법: https://www.figma.com/developers/api#access-tokens\n');

  const token = await question('Figma Access Token을 입력하세요: ');

  if (!token || token.trim() === '') {
    console.error('\n❌ 토큰이 입력되지 않았습니다.');
    rl.close();
    process.exit(1);
  }

  // 3. Config 파일 읽기
  let config;
  try {
    const configContent = readFileSync(CONFIG_PATH, 'utf-8');
    config = JSON.parse(configContent);
  } catch (error) {
    console.error('❌ 설정 파일을 읽을 수 없습니다:', error.message);
    rl.close();
    process.exit(1);
  }

  // 4. MCP 서버 설정 업데이트
  if (!config.mcpServers) {
    config.mcpServers = {};
  }

  const smitheryKey = process.env.SMITHERY_KEY || '4685f058-0354-4f45-85c4-1f7cc6abf0d0';

  config.mcpServers['figma-tokens-mcp'] = {
    command: 'npx',
    args: [
      '-y',
      '@smithery/cli@latest',
      'run',
      '@jhlee0409/figma-tokens-mcp',
      '--key',
      smitheryKey
    ],
    env: {
      FIGMA_ACCESS_TOKEN: token.trim()
    }
  };

  // 5. Config 파일 저장
  try {
    writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), 'utf-8');
    console.log('\n✅ 설정이 완료되었습니다!\n');
    console.log('📋 다음 단계:');
    console.log('   1. Claude Desktop을 재시작하세요');
    console.log('   2. "Figma 파일에서 디자인 토큰 추출해줘" 라고 요청하세요\n');
  } catch (error) {
    console.error('❌ 설정 파일을 저장할 수 없습니다:', error.message);
    rl.close();
    process.exit(1);
  }

  rl.close();
}

setup().catch(error => {
  console.error('\n❌ 설정 중 오류가 발생했습니다:', error.message);
  process.exit(1);
});
