# Example: Legacy Team (Styles Only)

This example demonstrates a team using **Figma Styles exclusively** for their design system (legacy approach).

## Scenario

The "Legacy Team" built their design system before Figma Variables were introduced and continues to use Styles for all design tokens.

### Team Profile
- **Design System Maturity**: Established (pre-Variables)
- **Figma Features**: Styles only (FILL and TEXT styles)
- **Naming Convention**: Inconsistent (mixed separators)
- **Organization**: Flat structure
- **Migration Status**: Planning to migrate to Variables

## Figma File Structure

```
Design System (Styles)
├── 🎨 Color Styles (FILL)
│   ├── primary-blue-light
│   ├── primary-blue
│   ├── primary-blue-dark
│   ├── secondary_gray_light
│   ├── secondary_gray
│   ├── success-green
│   ├── error-red
│   └── warning-yellow
│
└── 📝 Text Styles (TEXT)
    ├── heading-xl
    ├── heading-large
    ├── body/regular
    ├── body/medium
    ├── body/bold
    └── caption_small
```

## Usage Example

### 1. Extract Tokens (Styles Strategy)

```json
{
  "figmaFileUrl": "https://www.figma.com/file/example-legacy-team/Design-System",
  "extractionStrategy": "styles"
}
```

### 2. Extraction Result

```json
{
  "success": true,
  "tokens": {
    "colors": {
      "primary": {
        "blue": {
          "light": "#e6f2ff",
          "base": "#0066cc",
          "dark": "#004d99"
        }
      },
      "secondary": {
        "gray": {
          "light": "#f8f9fa",
          "base": "#6c757d"
        }
      },
      "success": {
        "green": "#28a745"
      },
      "error": {
        "red": "#dc3545"
      },
      "warning": {
        "yellow": "#ffc107"
      }
    },
    "fontSize": {
      "xl": "24px",
      "lg": "20px",
      "base": "16px",
      "sm": "14px"
    }
  },
  "metadata": {
    "extractionStrategy": "styles",
    "sources": ["styles"]
  },
  "warnings": [
    {
      "type": "pattern_detection",
      "message": "Inconsistent naming patterns detected",
      "severity": "medium",
      "details": {
        "patterns": ["kebab-case", "snake_case", "slash-separated"],
        "recommendation": "Consider standardizing to one naming convention"
      }
    }
  ],
  "statistics": {
    "totalTokens": 15,
    "conflicts": 0
  }
}
```

### 3. Pattern Detection

The extractor automatically detects and normalizes inconsistent naming:

**Original Style Names:**
- `primary-blue-light` (kebab-case)
- `secondary_gray_light` (snake_case)
- `body/regular` (slash-separated)

**Normalized Output:**
```json
{
  "primary": {
    "blue": {
      "light": "#e6f2ff"
    }
  }
}
```

### 4. Convert to Tailwind v3

Since this is a legacy project, using Tailwind v3:

```json
{
  "tokens": {...},
  "tailwindVersion": "v3",
  "preset": "merge"
}
```

**Generated tailwind.config.ts:**
```typescript
import type { Config } from 'tailwindcss';

export default {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'primary-blue-light': '#e6f2ff',
        'primary-blue': '#0066cc',
        'primary-blue-dark': '#004d99',
        // ...
      }
    }
  }
} satisfies Config;
```

## Migration to Variables

### Recommended Migration Path

1. **Audit Current Styles**
   ```
   Total Styles: 32
   - Color Styles: 18
   - Text Styles: 14
   ```

2. **Plan Variable Structure**
   ```
   Color Tokens Collection:
     primary/blue/50
     primary/blue/500
     primary/blue/900

   Typography Tokens Collection:
     font/size/xs
     font/size/base
     font/weight/regular
   ```

3. **Create Variables in Figma**
   - Set up variable collections
   - Create hierarchical structure
   - Use consistent `/` separator

4. **Map Styles → Variables**
   ```
   Style: primary-blue-light → Variable: primary/blue/50
   Style: primary-blue → Variable: primary/blue/500
   Style: primary-blue-dark → Variable: primary/blue/900
   ```

5. **Test with Mixed Strategy**
   ```json
   {
     "extractionStrategy": "mixed"
   }
   ```

6. **Review Conflicts**
   - Check for naming conflicts
   - Verify value consistency
   - Resolve any discrepancies

7. **Update Components**
   - Detach from Styles
   - Apply Variables
   - Test thoroughly

8. **Remove Old Styles**
   - Archive or delete Styles
   - Extract with `"variables"` strategy
   - Verify no regressions

## Key Challenges

### ⚠️ Naming Inconsistency
**Problem**: Mixed naming conventions
**Solution**: Pattern detection and normalization
**Impact**: Warnings during extraction, but functional output

### ⚠️ Flat Structure
**Problem**: No hierarchy in Style names
**Solution**: Extractor builds hierarchy from name patterns
**Impact**: May not match intended organization

### ⚠️ No Modes
**Problem**: Can't support light/dark themes natively
**Solution**: Create separate Styles for each theme
**Impact**: More Styles to manage

### ⚠️ Limited Metadata
**Problem**: Styles don't store as much metadata as Variables
**Solution**: Use Style descriptions for additional context
**Impact**: Less automated organization

## Best Practices for Styles

### 1. Consistent Naming
Choose one convention and stick to it:
```
✅ primary-blue-500
✅ primary/blue/500

❌ primary-blue-500 (mixed with)
❌ secondary_gray_light
```

### 2. Semantic Names
Use meaning, not values:
```
✅ text-primary
✅ background-success

❌ gray-500
❌ color-1
```

### 3. Hierarchical Naming
Even in flat structures, use hierarchy:
```
✅ button/primary/background
✅ button/primary/text

❌ button-bg
❌ btn-text
```

## Comparison: Styles vs Variables

| Feature | Styles | Variables |
|---------|--------|-----------|
| Hierarchy | Simulated via naming | Native support |
| Modes | Not supported | Multiple modes (light/dark) |
| Aliases | Not supported | Full alias support |
| Type Safety | Basic | Strong typing |
| Scoping | Global only | Can scope to frames |
| Organization | Manual via naming | Collections & modes |
| Future | Legacy | Recommended |

## Related Documentation

- [Perfect Team Example](../perfect-team/) - Using Variables only
- [Mixed Team Example](../mixed-team/) - Using both
- [Migration Guide](../../docs/USAGE.md#workflow-3-migration-from-styles-to-variables)

---

**Legacy doesn't mean bad - just ready for an upgrade!** 🚀
