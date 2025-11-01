# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Planned Features

- Figma component analysis for smarter component generation
- Support for additional token types (shadows, effects, gradients)
- CSS-in-JS output formats (styled-components, emotion)
- Vue and Svelte component generation
- CLI mode for non-MCP usage
- Watch mode for auto-regeneration on Figma changes
- Token documentation generator

## [0.1.0] - 2025-11-01

### Added - Initial Release

#### MCP Server

- **Model Context Protocol integration** - Full MCP server implementation with stdio transport
- **5 MCP tools** - extract_tokens, convert_to_tailwind, generate_component, health_check, get_server_info
- **Claude Desktop integration** - Works seamlessly with Claude Desktop
- **Environment variable configuration** - FIGMA_ACCESS_TOKEN for authentication

#### Token Extraction

- **Figma Variables extraction** - Extract modern Variables with full support for:
  - Color variables with RGBA to hex conversion
  - Typography variables (font family, weight, size)
  - Numeric variables (spacing, border radius)
  - Variable modes (light, dark, custom)
  - Variable alias resolution (including alias chains)
- **Figma Styles extraction** - Legacy Styles support for:
  - Color styles (FILL type)
  - Text styles (TEXT type) with full typography properties
  - Style to node mapping
  - Batch node fetching for efficiency
- **Pattern detection** - Automatic naming pattern detection:
  - Separator detection (/, -, \_, .)
  - Case style detection (kebab, camel, snake, pascal)
  - Hierarchy depth analysis
  - Confidence scoring
- **Token normalization** - Standardize token names and structures
- **Conflict resolution** - Smart conflict detection and resolution when mixing Variables and Styles:
  - Multiple resolution strategies (variables_priority, styles_priority, newest, rename_both)
  - Conflict reporting with severity levels
  - Detailed warnings and recommendations

#### Tailwind CSS Generation

- **Tailwind v3 support** - Generate JavaScript/TypeScript config:
  - `merge` preset - Extends Tailwind defaults
  - `replace` preset - Overrides Tailwind defaults
  - Full TypeScript support with type definitions
- **Tailwind v4 support** - Generate CSS variables with @theme directive:
  - CSS variables file (design-tokens.css)
  - Minimal JavaScript/TypeScript config file
  - Native CSS-first approach
- **Token validation** - Comprehensive validation before conversion:
  - Structure validation
  - Value validation
  - Type checking
  - Syntax validation (JavaScript and CSS)
- **Comprehensive warnings** - Detailed warnings for:
  - Invalid token values
  - Unsupported token types
  - Naming conflicts
  - Missing dependencies

#### Component Generation

- **React component generation** - Create React components with:
  - CVA (class-variance-authority) integration
  - Variant configuration from design tokens
  - TypeScript type definitions
  - ForwardRef support
  - Component props interfaces
  - Usage examples
- **Template-based generation** - Current MVP uses templates for:
  - Button components
  - Card components
  - Input components
  - Custom components
- **Tailwind class mapping** - Map design tokens to Tailwind utility classes:
  - Color tokens → bg-, text-, border- utilities
  - Typography tokens → font-, text- utilities
  - Spacing tokens → p-, m-, gap- utilities
  - Border radius tokens → rounded- utilities

#### Developer Experience

- **TypeScript strict mode** - Full type safety throughout codebase
- **Comprehensive error handling** - Custom error types for:
  - Authentication errors (FigmaAuthError)
  - Not found errors (FigmaNotFoundError)
  - Rate limit errors (FigmaRateLimitError)
  - Invalid URL errors (FigmaInvalidUrlError)
  - MCP tool errors (MCPToolError)
- **Detailed logging** - Configurable log levels:
  - DEBUG - Detailed debugging information
  - INFO - General information (default)
  - WARN - Warning messages
  - ERROR - Error messages only
- **API response caching** - 5-minute TTL cache for Figma API responses
- **Retry logic** - Exponential backoff for transient failures
- **Health checks** - Server health monitoring and diagnostics

#### Testing

- **Comprehensive test suite** - Full test coverage using Vitest:
  - Unit tests for all modules
  - Integration tests for complete workflows
  - Mock Figma API responses
  - Coverage reporting
- **Test categories**:
  - MCP server and tools tests
  - Figma API client tests
  - Variables extraction tests
  - Styles extraction tests
  - Token merger tests
  - Tailwind v3 converter tests
  - Tailwind v4 converter tests
  - Component generation tests
  - Pattern detection tests
  - Utility function tests

#### Code Quality

- **ESLint configuration** - TypeScript-specific linting rules
- **Prettier formatting** - Consistent code formatting
- **Type checking** - Strict TypeScript compilation
- **Pre-commit hooks** - Automated quality checks (planned)

#### Documentation

- **Complete README** - Project overview, quick start, installation
- **Setup guide** (docs/SETUP.md) - Detailed installation and configuration
- **Usage guide** (docs/USAGE.md) - Complete tool usage with examples
- **API reference** (docs/API.md) - Full API documentation
- **Architecture docs** (docs/ARCHITECTURE.md) - System design and decisions
- **Contributing guide** (CONTRIBUTING.md) - Contribution guidelines
- **Examples** - Real-world usage scenarios:
  - Perfect team (Variables only)
  - Legacy team (Styles only)
  - Mixed team (Variables + Styles)

### Known Limitations

#### Token Types

- Only colors and typography currently supported
- Shadows, effects, and gradients planned for future releases
- Grid and layout tokens not yet supported

#### Component Generation

- Template-based only (MVP)
- Figma component analysis planned for future releases
- React framework only
- Limited to common component patterns

#### Extraction Strategies

- `auto` strategy currently defaults to `mixed`
- Future: Intelligent detection based on file content
- No support for Figma plugins or extensions

#### MCP Integration

- stdio transport only
- No WebSocket or HTTP transport yet
- Claude Desktop is primary client

### Performance

- API responses cached for 5 minutes
- Batch node fetching for efficiency
- Alias resolution with circular detection
- No parallel extraction (sequential API calls)

### Security

- Access tokens stored in environment variables only
- No token encryption at rest
- Read-only Figma API access
- No write operations to Figma

### Future Roadmap

#### v0.2.0 (Planned)

- Shadow and effect token support
- Gradient token support
- Component variant analysis from Figma
- CLI mode for direct usage
- Watch mode for auto-regeneration

#### v0.3.0 (Planned)

- Vue component generation
- Svelte component generation
- CSS-in-JS output formats
- Token documentation generator
- Figma plugin integration

#### v1.0.0 (Planned)

- Stable API
- Production-ready
- Full test coverage
- Comprehensive documentation
- Performance optimizations
- Security audit

## Release Notes Format

Each release includes:

- **Added** - New features
- **Changed** - Changes in existing functionality
- **Deprecated** - Soon-to-be removed features
- **Removed** - Removed features
- **Fixed** - Bug fixes
- **Security** - Security fixes

---

For more details on each release, see the [GitHub Releases](https://github.com/jhlee0409/figma-tokens-mcp/releases) page.

## Upgrade Guides

### Upgrading to v0.1.0

This is the initial release, no upgrade needed.

---

**Note**: This project follows [Semantic Versioning](https://semver.org/):

- **MAJOR** version - Incompatible API changes
- **MINOR** version - Backwards-compatible functionality
- **PATCH** version - Backwards-compatible bug fixes
