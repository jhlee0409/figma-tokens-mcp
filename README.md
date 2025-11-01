# Figma Tokens MCP

[![npm version](https://img.shields.io/npm/v/figma-tokens-mcp.svg)](https://www.npmjs.com/package/figma-tokens-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue)](https://www.typescriptlang.org/)
[![MCP](https://img.shields.io/badge/MCP-1.0-purple)](https://modelcontextprotocol.io/)

> **Bridge the gap between Figma design systems and Tailwind CSS with intelligent design token extraction and conversion.**

An **open-source** [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) server that automatically extracts design tokens from Figma files and generates production-ready Tailwind CSS configurations, complete with component generation capabilities.

> 🔒 **Security**: Each user uses their own Figma Personal Access Token. This server does not store or share tokens between users.

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Quick Start](#quick-start)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Basic Usage](#basic-usage)
- [Documentation](#documentation)
- [Use Cases](#use-cases)
- [Contributing](#contributing)
- [License](#license)
- [Resources](#resources)

## Overview

**Figma Tokens MCP** solves the common problem of manually syncing design tokens between Figma and code. Whether your team uses Figma Variables, legacy Styles, or both, this tool intelligently extracts, normalizes, and converts your design tokens into Tailwind CSS configurations with zero manual effort.

### What makes it special?

- **Intelligent Extraction**: Automatically detects and handles Figma Variables, Styles, or both
- **Conflict Resolution**: Smart conflict detection and resolution when mixing Variables and Styles
- **Pattern Recognition**: Detects your team's naming conventions and normalizes tokens accordingly
- **Tailwind v3 & v4 Support**: Generate configs for both Tailwind CSS versions
- **Component Generation**: Create React components with CVA (class-variance-authority) from your tokens
- **MCP Integration**: Works seamlessly with Claude Desktop and other MCP-compatible AI assistants

## Key Features

### Design Token Extraction

- Extract colors, typography, spacing, border radius, and more from Figma
- Support for **Figma Variables** (modern, recommended)
- Support for **Figma Styles** (legacy support for existing design systems)
- **Mixed mode** with intelligent conflict resolution
- Pattern detection for automatic token normalization
- Hierarchical token structure generation

### Tailwind CSS Generation

- **Tailwind v3**: JavaScript/TypeScript config with `extend` or `replace` presets
- **Tailwind v4**: CSS variables with `@theme` directive + minimal config
- Type-safe TypeScript output
- Comprehensive validation and warnings
- Token statistics and metadata

### React Component Generation

- Generate React components with CVA variants
- TypeScript and JavaScript support
- Automatic prop types and variant configuration
- Usage examples included
- ForwardRef support

### Developer Experience

- Type-safe TypeScript implementation
- Comprehensive error handling with helpful suggestions
- Detailed logging and diagnostics
- Health checks and server monitoring
- Extensive test coverage

## Quick Start

### ⚡ 설치 방법 선택

#### 옵션 1: **Vercel 배포** (가장 추천! 🚀)
```bash
# 1. Vercel에 배포
vercel

# 2. Claude Code에서 사용 (각 사용자가 자신의 토큰 사용)
claude mcp add figma-tokens-mcp \
  "https://your-project.vercel.app/api/mcp" \
  --transport http \
  --header "Authorization: Bearer YOUR_FIGMA_TOKEN"
```

> ✨ **장점**: 각 사용자가 자신의 Figma 토큰 사용, 무료 배포, 팀 공유 용이

[상세 배포 가이드 보기](VERCEL_DEPLOY.md)

#### 옵션 2: Smithery (HTTP)
```bash
claude mcp add figma-tokens-mcp \
  "https://server.smithery.ai/@jhlee0409/figma-tokens-mcp/mcp" \
  --transport http \
  --header "Authorization: Bearer YOUR_FIGMA_TOKEN"
```

#### 옵션 3: 로컬 설치 (stdio)
```bash
npx @jhlee0409/figma-tokens-mcp install --figma-token YOUR_FIGMA_TOKEN
```

<details>
<summary>더 많은 설치 방법 보기</summary>

#### Smithery + Interactive Setup
```bash
npx -y @smithery/cli@latest install @jhlee0409/figma-tokens-mcp --client claude
npx figma-tokens-setup
```

[전체 설치 가이드 보기](INSTALL.md)

</details>

### 📋 수동 설치 (선호하는 경우)

<details>
<summary>수동 설정 방법 보기</summary>

#### 1. Figma Access Token 발급

1. [Figma](https://www.figma.com/) 로그인
2. Settings → Account → Personal Access Tokens
3. "Generate new token" 클릭
4. 토큰 복사

[자세한 가이드 보기](docs/SETUP.md#figma-access-token-setup)

#### 2. Claude Desktop 설정

`claude_desktop_config.json`에 추가:

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

#### 3. Claude Desktop 재시작

</details>

### 🚀 시작하기!

In Claude Desktop, you can now:

```
Extract design tokens from this Figma file:
https://www.figma.com/file/abc123/My-Design-System

Then convert them to Tailwind v4 config
```

See [USAGE.md](docs/USAGE.md) for complete examples and workflows.

## Prerequisites

- **Node.js**: 18.0.0 or higher
- **Figma Account**: With access to the files you want to extract tokens from
- **Figma Access Token**: Personal access token from Figma settings
- **MCP Client**: Claude Desktop, or any MCP-compatible client

## Installation

### Option 1: Use with npx (Recommended)

No installation needed! Just use:

```bash
npx figma-tokens-mcp
```

### Option 2: Global Installation

```bash
npm install -g figma-tokens-mcp
# or
pnpm add -g figma-tokens-mcp
```

### Option 3: Local Development

```bash
git clone https://github.com/jhlee0409/figma-tokens-mcp.git
cd figma-tokens-mcp
pnpm install
pnpm build
```

See [docs/SETUP.md](docs/SETUP.md) for detailed installation instructions, troubleshooting, and alternative MCP clients.

## Basic Usage

### With Claude Desktop

Once configured, simply ask Claude to:

1. **Extract tokens from Figma:**

   ```
   Extract design tokens from https://www.figma.com/file/abc123/Design-System
   ```

2. **Convert to Tailwind:**

   ```
   Convert these tokens to Tailwind v4 configuration
   ```

3. **Generate components:**
   ```
   Generate a Button component using these design tokens
   ```

### Available MCP Tools

This server provides 5 MCP tools:

| Tool                  | Purpose                                          |
| --------------------- | ------------------------------------------------ |
| `extract_tokens`      | Extract design tokens from Figma files           |
| `convert_to_tailwind` | Convert tokens to Tailwind CSS config (v3 or v4) |
| `generate_component`  | Generate React components with CVA variants      |
| `health_check`        | Check server health and configuration            |
| `get_server_info`     | Get server capabilities and features             |

### Example Workflow

```typescript
// 1. Extract tokens from Figma
const result = await extract_tokens({
  figmaFileUrl: 'https://www.figma.com/file/abc123/Design-System',
  extractionStrategy: 'auto', // or "variables", "styles", "mixed"
  tokenTypes: ['colors', 'typography'],
});

// 2. Convert to Tailwind v4
const tailwindConfig = await convert_to_tailwind({
  tokens: result.tokens,
  tailwindVersion: 'v4',
  typescript: true,
});

// 3. Generate a Button component
const component = await generate_component({
  componentName: 'Button',
  tokens: result.tokens,
  typescript: true,
});
```

## Documentation

### User Guides

- **[Setup Guide](docs/SETUP.md)**: Detailed installation and configuration
- **[Usage Guide](docs/USAGE.md)**: Complete tool usage with examples
- **[API Reference](docs/API.md)**: Full API documentation

### Technical Documentation

- **[Architecture](docs/ARCHITECTURE.md)**: System design and data flow
- **[Contributing](CONTRIBUTING.md)**: How to contribute to the project
- **[Changelog](CHANGELOG.md)**: Version history and releases

### Examples

- **[Perfect Team](examples/perfect-team/)**: Using Variables exclusively
- **[Legacy Team](examples/legacy-team/)**: Using Styles exclusively
- **[Mixed Team](examples/mixed-team/)**: Using both Variables and Styles

## Use Cases

### Design System Migration

Convert your Figma design system to code for the first time, or migrate from legacy Styles to modern Variables.

### Design-Code Sync

Keep your codebase in sync with Figma as your design system evolves. Extract updated tokens whenever designs change.

### Multi-Brand Systems

Extract tokens from different Figma files for different brands, generating separate Tailwind configs for each.

### Component Libraries

Generate React components with design tokens baked in, ensuring perfect consistency with your Figma designs.

### Design Tokens Documentation

Generate token documentation and usage examples automatically from your Figma files.

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Quick Contribution Steps

1. Fork the repository
2. Create a feature branch: `git checkout -b devbird/amazing-feature`
3. Make your changes
4. Run tests: `pnpm test`
5. Run linting: `pnpm lint`
6. Commit your changes
7. Push and create a Pull Request

### Development Setup

```bash
git clone https://github.com/jhlee0409/figma-tokens-mcp.git
cd figma-tokens-mcp
pnpm install
pnpm build
pnpm test
```

### Code Quality

We maintain high code quality standards:

- **TypeScript strict mode** enabled
- **100% type coverage** on public APIs
- **Comprehensive test suite** with Vitest
- **ESLint + Prettier** for code consistency
- **Automated CI/CD** checks

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Resources

### Official Documentation

- [Model Context Protocol](https://modelcontextprotocol.io/) - MCP specification
- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk) - SDK we use
- [Figma API Documentation](https://www.figma.com/developers/api) - Figma REST API
- [Tailwind CSS](https://tailwindcss.com/docs) - Tailwind documentation

### Related Projects

- [Figma Tokens](https://github.com/tokens-studio/figma-plugin) - Figma plugin for token management
- [Style Dictionary](https://github.com/amzn/style-dictionary) - Design token transformer
- [CVA](https://cva.style/) - Class variance authority for React

### Community

- [Issues](https://github.com/jhlee0409/figma-tokens-mcp/issues) - Report bugs or request features
- [Discussions](https://github.com/jhlee0409/figma-tokens-mcp/discussions) - Ask questions and share ideas
- [Pull Requests](https://github.com/jhlee0409/figma-tokens-mcp/pulls) - Contribute to the project

---

**Made with ❤️ for designers and developers who believe design systems should be easy.**

_Powered by [Model Context Protocol](https://modelcontextprotocol.io/)_
