# figma-tokens-mcp

A Model Context Protocol (MCP) server for extracting design tokens from Figma and generating Tailwind CSS configurations.

## Overview

This project provides a bridge between Figma design systems and Tailwind CSS, allowing you to automatically extract design tokens (colors, typography, spacing, etc.) from Figma files and generate corresponding Tailwind configuration.

## Features (Planned)

- Extract design tokens from Figma files
- Support for colors, typography, spacing, and more
- Generate Tailwind CSS configuration automatically
- MCP server for integration with AI assistants
- Type-safe TypeScript implementation

## Prerequisites

- Node.js 18.0.0 or higher
- pnpm 9.x
- Figma API access token

## Installation

### For Development

```bash
# Clone the repository
git clone https://github.com/jhlee0409/figma-tokens-mcp.git
cd figma-tokens-mcp

# Install dependencies
pnpm install

# Build the project
pnpm build

# Run tests
pnpm test
```

### As an NPM Package

```bash
# Install globally (once published)
npm install -g figma-tokens-mcp

# Or use with npx
npx figma-tokens-mcp
```

## Development

### Project Structure

```
figma-tokens-mcp/
├── src/
│   ├── core/          # Core business logic
│   ├── mcp/           # MCP server implementation
│   └── utils/         # Utility functions
├── tests/             # Test files
├── examples/          # Usage examples
├── docs/              # Documentation
└── dist/              # Built output
```

### Available Scripts

- `pnpm build` - Build the project
- `pnpm dev` - Build in watch mode
- `pnpm test` - Run tests
- `pnpm test:watch` - Run tests in watch mode
- `pnpm test:coverage` - Run tests with coverage
- `pnpm lint` - Lint code
- `pnpm lint:fix` - Fix linting issues
- `pnpm format` - Format code with Prettier
- `pnpm format:check` - Check code formatting
- `pnpm type-check` - Run TypeScript type checking

### Code Quality

This project enforces strict code quality standards:

- **TypeScript**: Strict mode enabled with comprehensive type checking
- **ESLint**: TypeScript-specific rules for code quality
- **Prettier**: Consistent code formatting
- **Vitest**: Modern testing framework with coverage reporting
- **CI/CD**: Automated checks on all pull requests

### Testing

Tests are located in the `tests/` directory and mirror the structure of `src/`.

```bash
# Run all tests
pnpm test

# Run tests in watch mode during development
pnpm test:watch

# Generate coverage report
pnpm test:coverage
```

### Building

The project uses [tsup](https://github.com/egoist/tsup) for fast, zero-config bundling:

```bash
# Production build
pnpm build

# Development build with watch mode
pnpm dev
```

## Usage

### As an MCP Server

```bash
# Run the MCP server
figma-tokens-mcp
```

### Configuration

Configuration will be provided through environment variables or a config file (TBD).

Required:
- `FIGMA_ACCESS_TOKEN` - Your Figma API access token

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b devbird/your-feature`)
3. Make your changes
4. Run tests and linting (`pnpm test && pnpm lint`)
5. Commit your changes
6. Push to your fork
7. Create a Pull Request

## License

MIT License - see [LICENSE](LICENSE) file for details

## Resources

- [MCP Documentation](https://modelcontextprotocol.io/)
- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)
- [Figma API Documentation](https://www.figma.com/developers/api)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

## Status

This project is currently in initial setup phase. Core functionality is under development.