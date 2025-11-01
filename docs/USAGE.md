# Usage Guide

Complete guide for using all Figma Tokens MCP tools.

## Table of Contents

- [Overview](#overview)
- [Tool 1: extract_tokens](#tool-1-extract_tokens)
- [Tool 2: convert_to_tailwind](#tool-2-convert_to_tailwind)
- [Tool 3: generate_component](#tool-3-generate_component)
- [Tool 4: health_check](#tool-4-health_check)
- [Tool 5: get_server_info](#tool-5-get_server_info)
- [Complete Workflows](#complete-workflows)
- [Tips and Best Practices](#tips-and-best-practices)

## Overview

Figma Tokens MCP provides 5 MCP tools that work together to extract design tokens from Figma and convert them into usable code.

### Quick Reference

| Tool | Purpose | Input | Output |
|------|---------|-------|--------|
| `extract_tokens` | Extract design tokens from Figma | Figma file URL | Token hierarchy |
| `convert_to_tailwind` | Convert tokens to Tailwind config | Tokens object | Config files |
| `generate_component` | Generate React components | Tokens + name | Component code |
| `health_check` | Check server health | None | Health status |
| `get_server_info` | Get server capabilities | None | Server info |

---

## Tool 1: extract_tokens

Extract design tokens (colors, typography, spacing, etc.) from Figma files.

### Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `figmaFileUrl` | string | ✅ Yes | - | Full Figma file URL |
| `tokenTypes` | string[] | ❌ No | All types | Types to extract: `colors`, `typography` |
| `extractionStrategy` | string | ❌ No | `"auto"` | Extraction strategy (see below) |

### Extraction Strategies

Choose how to extract tokens from your Figma file:

| Strategy | When to Use | Variables | Styles | Conflicts |
|----------|-------------|-----------|--------|-----------|
| `auto` | Default, lets the tool decide | ✅ | ✅ | Auto-resolved |
| `variables` | Modern Figma files using Variables only | ✅ | ❌ | None |
| `styles` | Legacy files using Styles only | ❌ | ✅ | None |
| `mixed` | Files with both, need both sources | ✅ | ✅ | Reported & resolved |

#### Strategy Details

**`auto` (Recommended)**
- Automatically detects what's available
- Currently defaults to `mixed` strategy
- Future: Will intelligently choose based on file content

**`variables` (Modern)**
- Extracts from Figma Variables only
- Recommended for new design systems
- Supports color modes (light/dark)
- Hierarchical structure
- Semantic naming

**`styles` (Legacy)**
- Extracts from Figma Styles only
- For older design systems
- Flat structure
- Pattern detection for hierarchy

**`mixed` (Comprehensive)**
- Extracts from both Variables and Styles
- Detects conflicts between sources
- Applies resolution strategy (Variables priority by default)
- Generates warnings for conflicts
- Best for migration scenarios

### Response Format

```typescript
{
  success: boolean;
  tokens: {
    // Hierarchical token structure
    colors: {
      primary: {
        blue: {
          "500": "#0066cc",
          "600": "#0052a3"
        }
      }
    },
    fontSize: {
      sm: "14px",
      base: "16px",
      lg: "18px"
    }
  };
  metadata: {
    fileKey: string;              // Figma file key
    extractedAt: string;          // ISO timestamp
    extractionStrategy: string;   // Strategy used
    sources: string[];            // ["variables", "styles"]
    tokenCounts: {
      colors: number;
      typography: number;
    }
  };
  warnings: Array<{
    type: string;
    message: string;
    severity: "low" | "medium" | "high";
  }>;
  statistics: {
    totalTokens: number;
    byType: { colors: number; typography: number; };
    conflicts: number;
    conflictsResolved: number;
  };
}
```

### Examples

#### Example 1: Basic Extraction

**In Claude Desktop:**
```
Extract design tokens from:
https://www.figma.com/file/abc123/My-Design-System
```

**Programmatic:**
```typescript
const result = await extract_tokens({
  figmaFileUrl: "https://www.figma.com/file/abc123/My-Design-System"
});

console.log(result.tokens.colors);
// {
//   primary: { "500": "#0066cc" },
//   secondary: { "500": "#6c757d" }
// }
```

#### Example 2: Extract Only Colors

```typescript
const result = await extract_tokens({
  figmaFileUrl: "https://www.figma.com/file/abc123/My-Design-System",
  tokenTypes: ["colors"]
});
```

#### Example 3: Variables Only

```typescript
const result = await extract_tokens({
  figmaFileUrl: "https://www.figma.com/file/abc123/My-Design-System",
  extractionStrategy: "variables"
});
```

#### Example 4: Styles Only (Legacy)

```typescript
const result = await extract_tokens({
  figmaFileUrl: "https://www.figma.com/file/abc123/Old-Design-System",
  extractionStrategy: "styles"
});
```

#### Example 5: Mixed with Conflict Resolution

```typescript
const result = await extract_tokens({
  figmaFileUrl: "https://www.figma.com/file/abc123/Migrating-System",
  extractionStrategy: "mixed"
});

// Check for conflicts
if (result.statistics.conflicts > 0) {
  console.log(`Found ${result.statistics.conflicts} conflicts`);
  console.log(`Resolved ${result.statistics.conflictsResolved} conflicts`);
  console.log('Warnings:', result.warnings);
}
```

### Understanding Warnings

Warnings help you understand issues found during extraction:

**Conflict Warnings:**
```json
{
  "type": "conflict",
  "message": "Token 'primary-blue' found in both Variables and Styles with different values",
  "severity": "high",
  "details": {
    "tokenName": "primary-blue",
    "variableValue": "#0066cc",
    "styleValue": "#0052a3",
    "resolution": "Using Variables value (recommended)"
  }
}
```

**Pattern Warnings:**
```json
{
  "type": "pattern_detection",
  "message": "Inconsistent naming pattern detected",
  "severity": "low",
  "details": {
    "detectedPattern": "kebab-case with / separator",
    "confidence": 0.85,
    "recommendation": "Consider standardizing naming convention"
  }
}
```

### Interpreting Token Structure

The extracted tokens follow a hierarchical structure:

```typescript
{
  colors: {
    // Semantic colors
    primary: {
      "50": "#e6f2ff",
      "500": "#0066cc",
      "900": "#001a33"
    },

    // State colors
    success: "#28a745",
    error: "#dc3545",

    // Nested categories
    text: {
      primary: "#212529",
      secondary: "#6c757d"
    }
  },

  fontSize: {
    xs: "12px",
    sm: "14px",
    base: "16px",
    lg: "18px",
    xl: "20px"
  },

  fontFamily: {
    sans: ["Inter", "system-ui", "sans-serif"],
    mono: ["'Fira Code'", "monospace"]
  },

  fontWeight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700
  },

  spacing: {
    "0": "0px",
    "1": "4px",
    "2": "8px",
    "4": "16px"
  }
}
```

---

## Tool 2: convert_to_tailwind

Convert extracted design tokens to Tailwind CSS configuration.

### Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `tokens` | object | ✅ Yes | - | Token object from extract_tokens |
| `tailwindVersion` | string | ❌ No | `"v4"` | Tailwind version: `"v3"` or `"v4"` |
| `preset` | string | ❌ No | `"merge"` | For v3: `"merge"` or `"replace"` |
| `outputPath` | string | ❌ No | `"./"` | Output directory path |
| `typescript` | boolean | ❌ No | `true` | Generate TypeScript config |

### Tailwind Versions: v3 vs v4

#### Tailwind v3

Generates a JavaScript/TypeScript config file:

**When to use:**
- Current Tailwind CSS projects (v3.x)
- Need to extend default Tailwind theme
- Want to override default Tailwind theme

**Preset options:**
- `merge` (default): Extends Tailwind defaults
- `replace`: Overrides Tailwind defaults

**Output:** `tailwind.config.ts` or `tailwind.config.js`

#### Tailwind v4

Generates CSS variables with `@theme` directive:

**When to use:**
- New projects using Tailwind v4
- Want pure CSS variable approach
- Need better CSS-in-JS compatibility

**Output:**
- `design-tokens.css` - CSS variables with @theme
- `tailwind.config.ts` - Minimal config file

### Response Format

```typescript
{
  success: boolean;
  files: Array<{
    path: string;           // File path
    filename: string;       // File name
    content: string;        // File content
    type: string;           // "config" | "css"
  }>;
  summary: {
    version: "v3" | "v4";
    preset: "merge" | "replace";
    tokenTypes: string[];   // ["colors", "fontSize", ...]
    totalTokens: number;
  };
  warnings: Array<{
    type: string;
    message: string;
    severity: "low" | "medium" | "high";
  }>;
}
```

### Examples

#### Example 1: Tailwind v4 (Default)

```typescript
const result = await convert_to_tailwind({
  tokens: extractedTokens
});

// Output files:
// - design-tokens.css
// - tailwind.config.ts
```

**design-tokens.css:**
```css
@theme {
  --color-primary-500: #0066cc;
  --color-secondary-500: #6c757d;
  --font-size-base: 16px;
  --font-size-lg: 18px;
}
```

**tailwind.config.ts:**
```typescript
import './design-tokens.css';

export default {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {}
  }
};
```

#### Example 2: Tailwind v3 with Merge

```typescript
const result = await convert_to_tailwind({
  tokens: extractedTokens,
  tailwindVersion: "v3",
  preset: "merge"
});
```

**tailwind.config.ts:**
```typescript
import type { Config } from 'tailwindcss';

export default {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          '500': '#0066cc',
          '600': '#0052a3'
        }
      },
      fontSize: {
        'base': '16px',
        'lg': '18px'
      }
    }
  }
} satisfies Config;
```

#### Example 3: Tailwind v3 with Replace

```typescript
const result = await convert_to_tailwind({
  tokens: extractedTokens,
  tailwindVersion: "v3",
  preset: "replace"
});
```

**tailwind.config.ts:**
```typescript
import type { Config } from 'tailwindcss';

export default {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    colors: {
      // Only your design tokens, no Tailwind defaults
      primary: { '500': '#0066cc' }
    },
    fontSize: {
      'base': '16px'
    }
  }
} satisfies Config;
```

#### Example 4: JavaScript Output

```typescript
const result = await convert_to_tailwind({
  tokens: extractedTokens,
  typescript: false
});

// Generates: tailwind.config.js
```

#### Example 5: Custom Output Path

```typescript
const result = await convert_to_tailwind({
  tokens: extractedTokens,
  outputPath: "./config"
});

// Files created in ./config/ directory
```

### Integrating Generated Config

#### For Tailwind v4

1. **Copy generated files:**
   ```bash
   cp design-tokens.css ./src/styles/
   cp tailwind.config.ts ./
   ```

2. **Import in your CSS:**
   ```css
   @import './design-tokens.css';

   @tailwind base;
   @tailwind components;
   @tailwind utilities;
   ```

3. **Use in components:**
   ```tsx
   <div className="bg-primary-500 text-white">
     Hello World
   </div>
   ```

#### For Tailwind v3

1. **Copy config file:**
   ```bash
   cp tailwind.config.ts ./
   ```

2. **Update postcss.config.js:**
   ```javascript
   module.exports = {
     plugins: {
       tailwindcss: {},
       autoprefixer: {}
     }
   };
   ```

3. **Import Tailwind in CSS:**
   ```css
   @tailwind base;
   @tailwind components;
   @tailwind utilities;
   ```

4. **Use in components:**
   ```tsx
   <button className="bg-primary-500 text-base">
     Click me
   </button>
   ```

### Customizing Output

After generation, you can customize the config:

**Add custom utilities:**
```typescript
export default {
  theme: {
    extend: {
      colors: {
        // Generated tokens
        primary: { '500': '#0066cc' },

        // Your custom additions
        brand: '#ff6b6b'
      }
    }
  },
  plugins: [
    // Add Tailwind plugins
  ]
}
```

**Add dark mode:**
```typescript
export default {
  darkMode: 'class', // or 'media'
  theme: {
    extend: {
      // Your tokens
    }
  }
}
```

---

## Tool 3: generate_component

Generate React components with CVA (class-variance-authority) variants from design tokens.

### Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `componentName` | string | ✅ Yes | - | Component name (PascalCase) |
| `tokens` | object | ✅ Yes | - | Token object from extract_tokens |
| `sectionUrl` | string | ❌ No | - | Figma section URL (future) |
| `framework` | string | ❌ No | `"react"` | Framework (only "react" for now) |
| `typescript` | boolean | ❌ No | `true` | Generate TypeScript |
| `outputPath` | string | ❌ No | `"./src/components"` | Output directory |

### Response Format

```typescript
{
  success: boolean;
  component: {
    path: string;           // "./src/components/Button.tsx"
    filename: string;       // "Button.tsx"
    content: string;        // Full component code
    type: "component";
  };
  metadata: {
    componentName: string;  // "Button"
    framework: string;      // "react"
    typescript: boolean;
    variants: string[];     // ["variant", "size"]
    props: string[];        // ["variant", "size", "className", ...]
  };
  usage: string;            // Usage example code
  warnings: Array<{
    type: string;
    message: string;
  }>;
}
```

### Generated Component Structure

```typescript
import { cva, type VariantProps } from 'class-variance-authority';
import { forwardRef } from 'react';

// CVA configuration with variants
const buttonCva = cva(
  // Base classes
  'inline-flex items-center justify-center rounded font-medium transition-colors',
  {
    variants: {
      variant: {
        primary: 'bg-primary-500 text-white hover:bg-primary-600',
        secondary: 'bg-secondary-500 text-white hover:bg-secondary-600',
        outline: 'border border-primary-500 text-primary-500'
      },
      size: {
        sm: 'text-sm px-3 py-1.5',
        md: 'text-base px-4 py-2',
        lg: 'text-lg px-6 py-3'
      }
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md'
    }
  }
);

// TypeScript prop types
export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonCva> {
  children?: React.ReactNode;
}

// Component with forwardRef
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant, size, className, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={buttonCva({ variant, size, className })}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
```

### Examples

#### Example 1: Generate Button Component

```typescript
const result = await generate_component({
  componentName: "Button",
  tokens: extractedTokens
});

console.log(result.usage);
// import { Button } from './components/Button';
//
// <Button variant="primary" size="md">
//   Click me
// </Button>
```

#### Example 2: Generate Card Component

```typescript
const result = await generate_component({
  componentName: "Card",
  tokens: extractedTokens
});
```

#### Example 3: JavaScript Output

```typescript
const result = await generate_component({
  componentName: "Button",
  tokens: extractedTokens,
  typescript: false
});

// Generates: Button.jsx
```

#### Example 4: Custom Output Path

```typescript
const result = await generate_component({
  componentName: "Button",
  tokens: extractedTokens,
  outputPath: "./src/ui"
});

// Generates: ./src/ui/Button.tsx
```

### Using Generated Components

1. **Install CVA:**
   ```bash
   npm install class-variance-authority
   # or
   pnpm add class-variance-authority
   ```

2. **Copy component file:**
   ```bash
   cp Button.tsx ./src/components/
   ```

3. **Import and use:**
   ```tsx
   import { Button } from './components/Button';

   export function App() {
     return (
       <div>
         <Button variant="primary" size="lg">
           Primary Button
         </Button>

         <Button variant="secondary" size="sm">
           Secondary Button
         </Button>

         <Button variant="outline">
           Outline Button
         </Button>
       </div>
     );
   }
   ```

### Customizing Generated Components

After generation, you can customize:

**Add new variants:**
```typescript
const buttonCva = cva('base-classes', {
  variants: {
    variant: {
      primary: '...',
      // Add custom variant
      danger: 'bg-red-500 text-white hover:bg-red-600'
    }
  }
});
```

**Add compound variants:**
```typescript
const buttonCva = cva('base-classes', {
  variants: { ... },
  compoundVariants: [
    {
      variant: 'primary',
      size: 'lg',
      className: 'font-bold'
    }
  ]
});
```

**Add custom props:**
```typescript
export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonCva> {
  children?: React.ReactNode;
  // Add custom props
  loading?: boolean;
  icon?: React.ReactNode;
}
```

---

## Tool 4: health_check

Check if the MCP server is running and properly configured.

### Parameters

None

### Response Format

```typescript
{
  status: "healthy" | "unhealthy";
  timestamp: string;      // ISO 8601 timestamp
  version: string;        // Server version
  figmaTokenConfigured: boolean;
}
```

### Example

**In Claude Desktop:**
```
Check Figma Tokens MCP server health
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-11-01T12:00:00.000Z",
  "version": "0.1.0",
  "figmaTokenConfigured": true
}
```

---

## Tool 5: get_server_info

Get information about server capabilities and features.

### Parameters

None

### Response Format

```typescript
{
  name: string;
  version: string;
  description: string;
  capabilities: string[];
  features: string[];
  figmaTokenConfigured: boolean;
}
```

### Example

**In Claude Desktop:**
```
What can the Figma Tokens MCP server do?
```

**Response:**
```json
{
  "name": "figma-tokens-mcp",
  "version": "0.1.0",
  "description": "MCP server for extracting design tokens from Figma",
  "capabilities": [
    "extract_tokens",
    "convert_to_tailwind",
    "generate_component",
    "health_check",
    "get_server_info"
  ],
  "features": [
    "Figma Variables extraction",
    "Figma Styles extraction",
    "Conflict resolution",
    "Tailwind v3 & v4 support",
    "React component generation"
  ],
  "figmaTokenConfigured": true
}
```

---

## Complete Workflows

### Workflow 1: From Figma to Tailwind Config

**Complete end-to-end workflow:**

1. **Extract tokens from Figma:**
   ```
   Extract design tokens from:
   https://www.figma.com/file/abc123/Design-System
   ```

2. **Review extracted tokens:**
   ```
   Show me the color tokens that were extracted
   ```

3. **Convert to Tailwind v4:**
   ```
   Convert these tokens to Tailwind v4 configuration
   ```

4. **Review generated files:**
   ```
   Show me the generated design-tokens.css file
   ```

5. **Integrate into project:**
   - Copy `design-tokens.css` to your project
   - Copy `tailwind.config.ts` to your project
   - Import in your CSS entry point

### Workflow 2: From Design Tokens to React Components

1. **Extract tokens:**
   ```
   Extract design tokens from my Figma file
   ```

2. **Generate Tailwind config:**
   ```
   Convert to Tailwind v4
   ```

3. **Generate Button component:**
   ```
   Generate a Button component using these tokens
   ```

4. **Generate Card component:**
   ```
   Generate a Card component using these tokens
   ```

5. **Integrate components:**
   ```bash
   # Install CVA
   pnpm add class-variance-authority

   # Copy components
   cp Button.tsx ./src/components/
   cp Card.tsx ./src/components/
   ```

### Workflow 3: Migration from Styles to Variables

For teams migrating from legacy Styles to modern Variables:

1. **Extract both sources:**
   ```
   Extract tokens with mixed strategy to see both Variables and Styles
   ```

2. **Review conflicts:**
   ```
   Show me any conflicts between Variables and Styles
   ```

3. **Understand warnings:**
   ```
   Explain the conflict warnings
   ```

4. **Generate Tailwind config:**
   ```
   Convert to Tailwind using Variables priority
   ```

5. **Update Figma:**
   - Review conflicts in Figma
   - Migrate Styles to Variables
   - Remove deprecated Styles

6. **Re-extract with Variables only:**
   ```
   Extract tokens using variables strategy only
   ```

### Workflow 4: Multi-Brand System

For teams managing multiple brands:

1. **Extract Brand A:**
   ```
   Extract tokens from Brand A Figma file:
   https://www.figma.com/file/brand-a/Design-System
   ```

2. **Convert Brand A:**
   ```
   Convert to Tailwind v4 with output path ./brands/brand-a
   ```

3. **Extract Brand B:**
   ```
   Extract tokens from Brand B Figma file:
   https://www.figma.com/file/brand-b/Design-System
   ```

4. **Convert Brand B:**
   ```
   Convert to Tailwind v4 with output path ./brands/brand-b
   ```

5. **Configure build:**
   ```javascript
   // Use different configs per brand
   const brandConfig = process.env.BRAND === 'a'
     ? './brands/brand-a/tailwind.config.ts'
     : './brands/brand-b/tailwind.config.ts';
   ```

---

## Tips and Best Practices

### General Tips

1. **Use Variables over Styles**
   - Figma Variables are modern and recommended
   - Better semantic naming
   - Support for modes (light/dark)
   - Easier maintenance

2. **Consistent Naming Conventions**
   - Use consistent separators (/, -, _)
   - Use semantic names (primary, secondary) over literal (blue, red)
   - Follow a depth pattern (category/subcategory/value)

3. **Review Warnings**
   - Always check warnings after extraction
   - High severity warnings may indicate issues
   - Resolve conflicts in Figma when possible

4. **Version Control**
   - Commit generated files to git
   - Track changes to design tokens
   - Use PR reviews for token updates

5. **Automate Updates**
   - Set up scripts to re-extract tokens
   - Run on design system updates
   - Include in CI/CD pipeline

### Extraction Tips

1. **Choose the Right Strategy**
   - Use `variables` for new design systems
   - Use `styles` for legacy systems
   - Use `mixed` during migration

2. **Filter Token Types**
   - Extract only what you need
   - Reduces noise and size
   - Faster processing

3. **Understand Token Structure**
   - Review extracted hierarchy
   - Ensure it matches your expectations
   - Adjust Figma naming if needed

### Tailwind Conversion Tips

1. **Choose v3 vs v4 Based on Project**
   - v4 for new projects
   - v3 for existing Tailwind projects
   - Consider team familiarity

2. **Merge vs Replace**
   - Use `merge` to keep Tailwind defaults
   - Use `replace` for full control
   - `merge` is usually safer

3. **TypeScript Recommended**
   - Better type safety
   - IntelliSense in IDE
   - Catches errors early

### Component Generation Tips

1. **Start with Common Components**
   - Button, Card, Input first
   - Build component library incrementally
   - Reuse patterns across components

2. **Customize After Generation**
   - Generated code is a starting point
   - Add business logic as needed
   - Extend variants for your use case

3. **Use CVA Properly**
   - Understand variants and compound variants
   - Use default variants
   - Leverage TypeScript types

### Performance Tips

1. **Cache Figma Responses**
   - Server caches API responses (5 min TTL)
   - Reduces API calls
   - Faster repeated extractions

2. **Batch Operations**
   - Extract all tokens at once
   - Don't extract multiple times
   - Convert and generate in one session

3. **Limit Token Types**
   - Only extract what you need
   - Smaller payloads
   - Faster processing

### Debugging Tips

1. **Enable Debug Logging**
   ```json
   {
     "env": {
       "LOG_LEVEL": "DEBUG"
     }
   }
   ```

2. **Check Server Health**
   ```
   Check Figma Tokens server health
   ```

3. **Verify Figma Access**
   - Test with a file you own
   - Check token permissions
   - Try with a public community file

4. **Review Extracted Data**
   - Inspect raw token structure
   - Check metadata
   - Verify token counts

---

**Next Steps:**
- Review [API Reference](API.md) for detailed API documentation
- See [Examples](../examples/) for real-world usage
- Check [Architecture](ARCHITECTURE.md) to understand how it works

**Need help?** [Open an issue](https://github.com/jhlee0409/figma-tokens-mcp/issues)
