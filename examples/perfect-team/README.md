# Example: Perfect Team (Variables Only)

This example demonstrates a team using **Figma Variables exclusively** for their design system.

## Scenario

The "Perfect Team" has adopted Figma's modern Variables feature and maintains a clean, well-organized design system using only Variables. No legacy Styles are present.

### Team Profile
- **Design System Maturity**: Advanced
- **Figma Features**: Variables only
- **Naming Convention**: Semantic with `/` separator
- **Modes**: Light and Dark themes
- **Token Organization**: Hierarchical structure

## Figma File Structure

```
Design System
├── 📦 Color Tokens (Collection)
│   ├── Mode: Light
│   └── Mode: Dark
│   ├── primary/blue/50
│   ├── primary/blue/100
│   ├── primary/blue/500
│   ├── primary/blue/900
│   ├── secondary/gray/50
│   ├── secondary/gray/500
│   ├── secondary/gray/900
│   ├── semantic/success
│   ├── semantic/error
│   └── semantic/warning
│
├── 📦 Typography Tokens (Collection)
│   ├── font/family/sans
│   ├── font/family/mono
│   ├── font/size/xs
│   ├── font/size/sm
│   ├── font/size/base
│   ├── font/size/lg
│   ├── font/size/xl
│   ├── font/weight/normal
│   ├── font/weight/medium
│   ├── font/weight/semibold
│   └── font/weight/bold
│
└── 📦 Spacing Tokens (Collection)
    ├── spacing/0
    ├── spacing/1
    ├── spacing/2
    ├── spacing/4
    ├── spacing/8
    └── spacing/16
```

## Usage Example

### 1. Extract Tokens (Variables Strategy)

```bash
# In Claude Desktop
Extract design tokens from this Figma file using the variables strategy:
https://www.figma.com/file/example-perfect-team/Design-System
```

**Parameters:**
```json
{
  "figmaFileUrl": "https://www.figma.com/file/example-perfect-team/Design-System",
  "extractionStrategy": "variables"
}
```

### 2. Extraction Result

<details>
<summary>View extracted tokens (click to expand)</summary>

```json
{
  "success": true,
  "tokens": {
    "colors": {
      "primary": {
        "blue": {
          "50": "#e6f2ff",
          "100": "#cce5ff",
          "500": "#0066cc",
          "900": "#001a33"
        }
      },
      "secondary": {
        "gray": {
          "50": "#f8f9fa",
          "500": "#6c757d",
          "900": "#212529"
        }
      },
      "semantic": {
        "success": "#28a745",
        "error": "#dc3545",
        "warning": "#ffc107"
      }
    },
    "fontSize": {
      "xs": "12px",
      "sm": "14px",
      "base": "16px",
      "lg": "18px",
      "xl": "20px"
    },
    "fontFamily": {
      "sans": ["Inter", "system-ui", "sans-serif"],
      "mono": ["'Fira Code'", "Consolas", "monospace"]
    },
    "fontWeight": {
      "normal": 400,
      "medium": 500,
      "semibold": 600,
      "bold": 700
    },
    "spacing": {
      "0": "0px",
      "1": "4px",
      "2": "8px",
      "4": "16px",
      "8": "32px",
      "16": "64px"
    }
  },
  "metadata": {
    "fileKey": "example-perfect-team",
    "extractedAt": "2025-11-01T12:00:00.000Z",
    "extractionStrategy": "variables",
    "sources": ["variables"],
    "tokenCounts": {
      "colors": 10,
      "typography": 12,
      "spacing": 6
    }
  },
  "warnings": [],
  "statistics": {
    "totalTokens": 28,
    "byType": {
      "colors": 10,
      "fontSize": 5,
      "fontFamily": 2,
      "fontWeight": 4,
      "spacing": 6
    },
    "conflicts": 0,
    "conflictsResolved": 0
  }
}
```

</details>

### 3. Convert to Tailwind v4

```bash
# In Claude Desktop
Convert these tokens to Tailwind v4 configuration
```

**Generated Files:**

#### design-tokens.css
```css
@theme {
  /* Colors */
  --color-primary-blue-50: #e6f2ff;
  --color-primary-blue-100: #cce5ff;
  --color-primary-blue-500: #0066cc;
  --color-primary-blue-900: #001a33;

  --color-secondary-gray-50: #f8f9fa;
  --color-secondary-gray-500: #6c757d;
  --color-secondary-gray-900: #212529;

  --color-semantic-success: #28a745;
  --color-semantic-error: #dc3545;
  --color-semantic-warning: #ffc107;

  /* Typography */
  --font-size-xs: 12px;
  --font-size-sm: 14px;
  --font-size-base: 16px;
  --font-size-lg: 18px;
  --font-size-xl: 20px;

  --font-family-sans: Inter, system-ui, sans-serif;
  --font-family-mono: 'Fira Code', Consolas, monospace;

  --font-weight-normal: 400;
  --font-weight-medium: 500;
  --font-weight-semibold: 600;
  --font-weight-bold: 700;

  /* Spacing */
  --spacing-0: 0px;
  --spacing-1: 4px;
  --spacing-2: 8px;
  --spacing-4: 16px;
  --spacing-8: 32px;
  --spacing-16: 64px;
}
```

#### tailwind.config.ts
```typescript
import './design-tokens.css';

export default {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {}
  }
};
```

### 4. Generate Button Component

```bash
# In Claude Desktop
Generate a Button component using these design tokens
```

**Generated Component:**

<details>
<summary>View Button.tsx (click to expand)</summary>

```typescript
import { cva, type VariantProps } from 'class-variance-authority';
import { forwardRef } from 'react';

const buttonCva = cva(
  'inline-flex items-center justify-center rounded font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primary: 'bg-primary-blue-500 text-white hover:bg-primary-blue-900',
        secondary: 'bg-secondary-gray-500 text-white hover:bg-secondary-gray-900',
        success: 'bg-semantic-success text-white hover:bg-semantic-success/90',
        error: 'bg-semantic-error text-white hover:bg-semantic-error/90',
        warning: 'bg-semantic-warning text-white hover:bg-semantic-warning/90',
        outline: 'border border-primary-blue-500 text-primary-blue-500 hover:bg-primary-blue-50'
      },
      size: {
        sm: 'text-sm px-3 py-1.5 h-8',
        md: 'text-base px-4 py-2 h-10',
        lg: 'text-lg px-6 py-3 h-12'
      }
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md'
    }
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonCva> {
  children?: React.ReactNode;
}

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

</details>

### 5. Usage in Application

```tsx
import { Button } from './components/Button';

export function App() {
  return (
    <div className="p-8 space-y-4">
      <h1 className="text-xl font-bold text-primary-blue-900">
        Perfect Team Design System
      </h1>

      <div className="flex gap-2">
        <Button variant="primary" size="lg">
          Primary Button
        </Button>

        <Button variant="secondary" size="md">
          Secondary Button
        </Button>

        <Button variant="success" size="sm">
          Success
        </Button>

        <Button variant="outline">
          Outline
        </Button>
      </div>
    </div>
  );
}
```

## Key Advantages

### ✅ Clean Extraction
- **No conflicts**: Only one source (Variables)
- **No warnings**: Perfect extraction
- **Hierarchical structure**: Natural organization
- **Semantic naming**: Clear intent

### ✅ Modern Figma Features
- **Variable modes**: Light/dark theme support
- **Alias support**: Reusable token references
- **Type safety**: Figma enforces variable types
- **Scoping**: Variables can be scoped to specific frames

### ✅ Maintainability
- **Single source of truth**: Variables only
- **Easy updates**: Change in Figma, extract again
- **Version control**: Track token changes in git
- **Team collaboration**: Clear organization

## Best Practices

### 1. Naming Convention
Use semantic, hierarchical names:
```
✅ primary/blue/500
✅ semantic/success
✅ font/size/base

❌ color-1
❌ blue500
❌ 16px
```

### 2. Variable Modes
Organize by theme modes:
```
Light Mode:
  primary/blue/500: #0066cc

Dark Mode:
  primary/blue/500: #3399ff
```

### 3. Collections
Group related tokens:
```
Color Tokens Collection
Typography Tokens Collection
Spacing Tokens Collection
```

### 4. Aliases
Reference other variables:
```
primary/blue/500: #0066cc
button/primary/background: {primary/blue/500}
```

## Migration Tips

If migrating from Styles to Variables:

1. **Audit existing Styles** - List all current styles
2. **Plan Variable structure** - Design hierarchy
3. **Create Variables** - Set up collections and modes
4. **Map Styles to Variables** - One-to-one mapping
5. **Test extraction** - Verify tokens are correct
6. **Update components** - Apply new variables
7. **Remove Styles** - Once migration is complete

## Troubleshooting

### Issue: Empty extraction result

**Cause**: File has no Variables
**Solution**: Verify Variables exist in Figma file

### Issue: Missing tokens

**Cause**: Variables are scoped to specific frames
**Solution**: Check variable scoping in Figma

### Issue: Incorrect hierarchy

**Cause**: Inconsistent naming convention
**Solution**: Standardize variable names with `/` separator

## Related Documentation

- [Setup Guide](../../docs/SETUP.md)
- [Usage Guide](../../docs/USAGE.md)
- [API Reference](../../docs/API.md)
- [Legacy Team Example](../legacy-team/) - Using Styles only
- [Mixed Team Example](../mixed-team/) - Using both Variables and Styles

---

**Perfect setup for modern design systems!** ✨
