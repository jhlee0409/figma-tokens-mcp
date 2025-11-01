# Contributing to Figma Tokens MCP

Thank you for your interest in contributing! This document provides guidelines and instructions for contributing to the project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Development Workflow](#development-workflow)
- [Code Style Guidelines](#code-style-guidelines)
- [Testing](#testing)
- [Pull Request Process](#pull-request-process)
- [Reporting Bugs](#reporting-bugs)
- [Requesting Features](#requesting-features)

## Code of Conduct

### Our Pledge

We are committed to providing a welcoming and inclusive environment for all contributors, regardless of background or identity.

### Expected Behavior

- Be respectful and considerate
- Welcome newcomers and help them get started
- Accept constructive criticism gracefully
- Focus on what is best for the community
- Show empathy towards other community members

### Unacceptable Behavior

- Harassment, discrimination, or offensive comments
- Trolling, insulting, or derogatory comments
- Personal or political attacks
- Publishing others' private information
- Other conduct which could reasonably be considered inappropriate

## Getting Started

### Prerequisites

Before contributing, ensure you have:

- **Node.js** 18.0.0 or higher
- **pnpm** 9.x (recommended) or npm/yarn
- **Git** for version control
- **Figma account** with access token for testing

### Fork and Clone

1. **Fork the repository** on GitHub
2. **Clone your fork**:

   ```bash
   git clone https://github.com/YOUR_USERNAME/figma-tokens-mcp.git
   cd figma-tokens-mcp
   ```

3. **Add upstream remote**:
   ```bash
   git remote add upstream https://github.com/jhlee0409/figma-tokens-mcp.git
   ```

## Development Setup

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Set Up Environment Variables

Create a `.env` file in the project root:

```bash
FIGMA_ACCESS_TOKEN=figd_your_token_here
LOG_LEVEL=DEBUG
```

**IMPORTANT**: Never commit `.env` files!

### 3. Build the Project

```bash
pnpm build
```

### 4. Run Tests

```bash
pnpm test
```

### 5. Start Development Mode

```bash
pnpm dev
```

This runs the build in watch mode, automatically rebuilding on file changes.

## Development Workflow

### Branch Naming Convention

Use the `devbird/` prefix for all feature branches:

- Feature: `devbird/add-new-feature`
- Bug fix: `devbird/fix-bug-description`
- Documentation: `devbird/update-docs`
- Refactor: `devbird/refactor-module-name`

### Typical Workflow

1. **Create a feature branch**:

   ```bash
   git checkout -b devbird/my-feature
   ```

2. **Make your changes**:
   - Write code following style guidelines
   - Add tests for new features
   - Update documentation as needed

3. **Run checks locally**:

   ```bash
   pnpm lint
   pnpm format:check
   pnpm type-check
   pnpm test
   ```

4. **Commit your changes**:

   ```bash
   git add .
   git commit -m "feat: add new feature description"
   ```

   Follow [Conventional Commits](https://www.conventionalcommits.org/):
   - `feat:` - New feature
   - `fix:` - Bug fix
   - `docs:` - Documentation changes
   - `test:` - Test changes
   - `refactor:` - Code refactoring
   - `chore:` - Build process or tooling changes

5. **Push to your fork**:

   ```bash
   git push origin devbird/my-feature
   ```

6. **Create a Pull Request** on GitHub

## Code Style Guidelines

### TypeScript

- **Strict mode**: All code must pass TypeScript strict mode
- **Types over any**: Avoid `any`, use proper types or `unknown`
- **Explicit return types**: Always specify return types for functions
- **No unused variables**: Remove or prefix with `_`

**Example**:

```typescript
// Good
function calculateTotal(items: Item[]): number {
  return items.reduce((sum, item) => sum + item.price, 0);
}

// Bad
function calculateTotal(items: any) {
  return items.reduce((sum: any, item: any) => sum + item.price, 0);
}
```

### Naming Conventions

- **Files**: `kebab-case.ts` (e.g., `figma-api.ts`)
- **Classes**: `PascalCase` (e.g., `FigmaAPIClient`)
- **Interfaces**: `PascalCase` (e.g., `TokenMetadata`)
- **Functions**: `camelCase` (e.g., `extractTokens`)
- **Constants**: `UPPER_SNAKE_CASE` (e.g., `DEFAULT_TIMEOUT`)
- **Type aliases**: `PascalCase` (e.g., `TokenValue`)

### Code Organization

- **One class per file**: Except for closely related utilities
- **Group imports**: External, internal, types
- **Export at bottom**: Or use `export` keyword on declaration
- **Small functions**: Keep functions under 50 lines when possible

**Example**:

```typescript
// External imports
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import axios from 'axios';

// Internal imports
import { FigmaAPIClient } from './core/extractors/figma-api.js';
import { Logger } from './utils/logger.js';

// Type imports
import type { ServerConfig } from './mcp/types.js';
```

### Comments and Documentation

- **JSDoc for public APIs**: All exported functions/classes
- **Inline comments**: Explain why, not what
- **TODO comments**: Include your GitHub username

**Example**:

````typescript
/**
 * Extract design tokens from a Figma file.
 *
 * @param fileKey - Figma file key from URL
 * @param options - Extraction options
 * @returns Extracted tokens with metadata
 * @throws {FigmaAuthError} If authentication fails
 * @throws {FigmaNotFoundError} If file is not found
 *
 * @example
 * ```typescript
 * const tokens = await extractTokens('abc123', { strategy: 'variables' });
 * ```
 */
export async function extractTokens(
  fileKey: string,
  options: ExtractionOptions
): Promise<ExtractedTokens> {
  // Implementation
}
````

### Error Handling

- **Use custom error types**: Extend `Error` for specific errors
- **Descriptive messages**: Include context and suggestions
- **Never swallow errors**: Always log or rethrow
- **Validate early**: Check inputs at function entry

**Example**:

```typescript
if (!fileKey) {
  throw new FigmaInvalidUrlError('File key is required');
}

try {
  const data = await fetchData();
  return processData(data);
} catch (error) {
  if (error instanceof FigmaRateLimitError) {
    logger.warn(`Rate limited, retrying after ${error.retryAfter}s`);
    await sleep(error.retryAfter * 1000);
    return retry();
  }
  throw error;
}
```

## Testing

### Writing Tests

We use **Vitest** for testing. All new features must include tests.

**Test file structure**:

```
tests/
├── mcp/
│   ├── server.test.ts
│   └── tools.test.ts
├── extractors/
│   ├── figma-api.test.ts
│   └── variables-extractor.test.ts
└── converters/
    ├── tailwind-v3.test.ts
    └── tailwind-v4.test.ts
```

**Example test**:

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { FigmaAPIClient } from '../src/core/extractors/figma-api.js';

describe('FigmaAPIClient', () => {
  let client: FigmaAPIClient;

  beforeEach(() => {
    client = new FigmaAPIClient({
      accessToken: 'test-token',
    });
  });

  it('should parse Figma URLs correctly', () => {
    const result = client.parseFigmaUrl('https://www.figma.com/file/abc123/My-File');

    expect(result.fileKey).toBe('abc123');
    expect(result.type).toBe('file');
  });

  it('should throw on invalid URLs', () => {
    expect(() => {
      client.parseFigmaUrl('https://invalid.com');
    }).toThrow(FigmaInvalidUrlError);
  });
});
```

### Running Tests

```bash
# Run all tests
pnpm test

# Run in watch mode
pnpm test:watch

# Run with coverage
pnpm test:coverage

# Run specific test file
pnpm test figma-api.test.ts
```

### Test Coverage

- Aim for **>80% coverage** on new code
- Focus on business logic and edge cases
- Don't test external libraries
- Mock external dependencies

### Integration Tests

Located in `tests/integration/`, these test complete workflows:

```typescript
describe('Token Extraction Pipeline', () => {
  it('should extract, merge, and convert tokens', async () => {
    const tokens = await extractTokens(fileKey);
    const tailwind = await convertToTailwind(tokens);

    expect(tailwind.files).toHaveLength(2);
    expect(tailwind.summary.totalTokens).toBeGreaterThan(0);
  });
});
```

## Pull Request Process

### Before Submitting

1. **Update documentation** if you changed APIs
2. **Add tests** for new features
3. **Run all checks**:
   ```bash
   pnpm lint
   pnpm format
   pnpm type-check
   pnpm test
   ```
4. **Update CHANGELOG.md** if applicable
5. **Rebase on latest main**:
   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

### PR Title Format

Follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat: add support for gradients`
- `fix: resolve alias chain infinite loop`
- `docs: update API reference`
- `test: add tests for conflict resolver`
- `refactor: simplify token merger logic`

### PR Description Template

```markdown
## Description

Brief description of changes

## Motivation

Why is this change needed?

## Changes

- Added X feature
- Fixed Y bug
- Updated Z documentation

## Testing

- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] Manual testing performed

## Screenshots (if applicable)

Add screenshots or GIFs

## Checklist

- [ ] Code follows style guidelines
- [ ] Tests pass locally
- [ ] Documentation updated
- [ ] CHANGELOG.md updated
```

### Review Process

1. **Automated checks** must pass (CI/CD)
2. **Code review** by maintainer(s)
3. **Address feedback** and push updates
4. **Approval** from at least one maintainer
5. **Merge** by maintainer

### After Merge

- Delete your feature branch
- Pull latest main:
  ```bash
  git checkout main
  git pull upstream main
  ```

## Reporting Bugs

### Before Reporting

1. **Check existing issues** - Someone may have already reported it
2. **Try latest version** - Bug might be fixed
3. **Verify it's a bug** - Not expected behavior

### Bug Report Template

```markdown
**Describe the bug**
A clear description of what the bug is.

**To Reproduce**
Steps to reproduce:

1. Run command '...'
2. With parameters '...'
3. See error

**Expected behavior**
What you expected to happen.

**Actual behavior**
What actually happened.

**Environment**

- OS: [e.g., macOS 13.0]
- Node.js: [e.g., 18.17.0]
- Package version: [e.g., 0.1.0]

**Additional context**
Error messages, logs, screenshots, etc.
```

## Requesting Features

### Feature Request Template

```markdown
**Is your feature request related to a problem?**
Clear description of the problem.

**Describe the solution you'd like**
Clear description of what you want to happen.

**Describe alternatives you've considered**
Other solutions you've thought about.

**Additional context**
Any other context, screenshots, or examples.
```

### Feature Discussion

1. **Open a discussion** first for major features
2. **Get feedback** from maintainers
3. **Create an issue** once approach is agreed upon
4. **Implement** and submit PR

## Questions?

- **Discussions**: [GitHub Discussions](https://github.com/jhlee0409/figma-tokens-mcp/discussions)
- **Issues**: [GitHub Issues](https://github.com/jhlee0409/figma-tokens-mcp/issues)
- **Discord**: (Coming soon)

---

**Thank you for contributing to Figma Tokens MCP!** 🎉
