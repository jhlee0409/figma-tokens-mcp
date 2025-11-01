# Example: Mixed Team (Variables + Styles)

This example demonstrates a team **migrating from Styles to Variables** and temporarily using both.

## Scenario

The "Mixed Team" is in the middle of migrating their design system from legacy Styles to modern Variables. They have both in their Figma file and need to handle conflicts intelligently.

### Team Profile
- **Design System Maturity**: Migrating
- **Figma Features**: Both Variables and Styles (transition phase)
- **Migration Status**: 60% complete
- **Conflict Resolution**: Variables priority (new standard)
- **Timeline**: Planning to complete migration in Q2 2025

## Figma File Structure

```
Design System (Mixed)
├── 📦 Color Tokens (Variables) ✨ NEW
│   ├── primary/blue/500 = #0066cc
│   ├── secondary/gray/500 = #6c757d
│   └── semantic/success = #28a745
│
├── 🎨 Color Styles (LEGACY)
│   ├── primary-blue = #0052a3 ⚠️ CONFLICT (old value)
│   ├── secondary-gray = #6c757d ✅ Same
│   ├── error-red = #dc3545 ⚠️ Not yet in Variables
│   └── warning-yellow = #ffc107 ⚠️ Not yet in Variables
│
├── 📦 Typography Tokens (Variables) ✨ NEW
│   ├── font/size/base = 16px
│   └── font/weight/medium = 500
│
└── 📝 Text Styles (LEGACY)
    ├── body-regular ⚠️ Not yet in Variables
    └── heading-large ⚠️ Not yet in Variables
```

## Usage Example

### 1. Extract Tokens (Mixed Strategy)

```json
{
  "figmaFileUrl": "https://www.figma.com/file/example-mixed-team/Design-System",
  "extractionStrategy": "mixed"
}
```

### 2. Extraction Result with Conflicts

```json
{
  "success": true,
  "tokens": {
    "colors": {
      "primary": {
        "blue": {
          "500": "#0066cc"  // ✅ From Variables (priority)
        }
      },
      "secondary": {
        "gray": {
          "500": "#6c757d"  // ✅ Same in both
        }
      },
      "semantic": {
        "success": "#28a745",  // ✅ From Variables
        "error": "#dc3545",     // ⚠️ From Styles (not in Variables yet)
        "warning": "#ffc107"    // ⚠️ From Styles (not in Variables yet)
      }
    }
  },
  "metadata": {
    "extractionStrategy": "mixed",
    "sources": ["variables", "styles"]
  },
  "warnings": [
    {
      "type": "conflict",
      "message": "Token 'primary-blue' found in both Variables and Styles with different values",
      "severity": "high",
      "details": {
        "tokenName": "primary/blue/500",
        "variableValue": "#0066cc",
        "styleValue": "#0052a3",
        "resolution": "Using Variables value (variables_priority strategy)",
        "recommendation": "Update or remove conflicting Style"
      }
    },
    {
      "type": "coverage",
      "message": "Some Styles not yet migrated to Variables",
      "severity": "medium",
      "details": {
        "stylesOnly": ["error-red", "warning-yellow", "body-regular", "heading-large"],
        "recommendation": "Create Variables for these Styles to complete migration"
      }
    }
  ],
  "statistics": {
    "totalTokens": 8,
    "byType": {
      "colors": 5,
      "fontSize": 1,
      "fontWeight": 1
    },
    "conflicts": 1,
    "conflictsResolved": 1
  }
}
```

### 3. Understanding Conflict Resolution

The `mixed` strategy uses `variables_priority` by default:

```
Conflict: primary-blue

Variable: primary/blue/500 = #0066cc (NEW) ✨
Style: primary-blue = #0052a3 (OLD) 🗑️

Resolution: Use Variable value (#0066cc)
Reason: Variables are the new standard
```

**Available Resolution Strategies:**

| Strategy | When to Use |
|----------|-------------|
| `variables_priority` (default) | Variables are source of truth |
| `styles_priority` | Styles are source of truth (rare) |
| `newest` | Use most recently modified |
| `rename_both` | Keep both with suffixes |

### 4. Migration Progress Tracking

```json
{
  "migrationStatus": {
    "total": 32,
    "migrated": 19,
    "remaining": 13,
    "percentage": 59.4,
    "breakdown": {
      "colors": {
        "total": 18,
        "migrated": 12,
        "remaining": 6
      },
      "typography": {
        "total": 14,
        "migrated": 7,
        "remaining": 7
      }
    }
  }
}
```

## Migration Workflow

### Week 1-2: Audit and Plan
1. **Extract current state** with mixed strategy
2. **Analyze warnings** to identify conflicts
3. **Document coverage** - what's missing
4. **Create migration plan** - priority order

### Week 3-4: Create Variables
1. **Set up collections** in Figma
2. **Create Variables** for remaining Styles
3. **Resolve conflicts** - update old values
4. **Test extraction** - verify no new conflicts

### Week 5-6: Update Components
1. **Detach from Styles** gradually
2. **Apply Variables** to components
3. **Test in staging** environment
4. **Monitor for issues**

### Week 7-8: Cleanup
1. **Final extraction** with mixed strategy
2. **Verify zero conflicts**
3. **Archive Styles** (don't delete yet)
4. **Switch to `variables` strategy**
5. **Update documentation**

## Handling Specific Conflicts

### Conflict Type 1: Different Values

**Problem:**
```
Variable: primary/blue/500 = #0066cc
Style: primary-blue = #0052a3
```

**Resolution Options:**
1. **Update Style** to match Variable (recommended)
2. **Update Variable** if Style is correct
3. **Keep both** if intentionally different

**Recommended:**
```
1. Update Style value to #0066cc in Figma
2. Re-extract to verify conflict resolved
3. Plan to remove Style after migration
```

### Conflict Type 2: Missing Variables

**Problem:**
```
Style: error-red = #dc3545
Variable: (doesn't exist yet)
```

**Resolution:**
```
1. Create Variable: semantic/error = #dc3545
2. Update components to use Variable
3. Keep Style until all components updated
4. Remove Style
```

### Conflict Type 3: Naming Differences

**Problem:**
```
Variable: primary/blue/500
Style: primary-blue-medium
```

**Resolution:**
```
1. Standardize on Variable naming (semantic)
2. Map Style to Variable in documentation
3. Update components
4. Deprecate Style
```

## Best Practices During Migration

### 1. Use Mixed Strategy
```json
{
  "extractionStrategy": "mixed"
}
```
This gives you full visibility into conflicts.

### 2. Review Warnings Carefully
```json
{
  "warnings": [
    {
      "type": "conflict",
      "severity": "high",  // ⚠️ Address immediately
      "details": {...}
    },
    {
      "type": "coverage",
      "severity": "medium",  // 📋 Plan to address
      "details": {...}
    }
  ]
}
```

### 3. Track Progress
Keep a migration checklist:
```
Color Tokens:
  ✅ primary/blue/*
  ✅ secondary/gray/*
  🔄 semantic/success
  ⏳ semantic/error
  ⏳ semantic/warning

Typography:
  ✅ font/size/*
  🔄 font/weight/*
  ⏳ line-height/*
```

### 4. Test Frequently
```bash
# Test after each batch of Variables created
Extract tokens → Check for new conflicts → Resolve
```

### 5. Don't Delete Styles Too Early
Keep Styles until:
- All Variables created
- All components updated
- Production tested
- Team alignment achieved

## Troubleshooting

### Issue: Too Many Conflicts

**Symptom:** 50+ conflicts reported

**Causes:**
- Massive naming differences
- Different value systems
- Incomplete migration

**Solutions:**
1. Focus on one token type at a time (colors first)
2. Use consistent naming in Variables
3. Update Styles to match Variables before migrating

### Issue: Extraction is Slow

**Symptom:** Takes >30 seconds

**Causes:**
- Large number of Styles
- Many API calls for style nodes

**Solutions:**
1. Extract only needed token types
2. Cache is enabled (5 min TTL)
3. Consider splitting into smaller files

### Issue: Components Break After Migration

**Symptom:** UI looks different in production

**Causes:**
- Conflict resolution chose wrong value
- Missing Variables for some Styles
- Components still using Styles

**Solutions:**
1. Review all conflict resolutions
2. Verify all Styles have Variable equivalents
3. Test in staging first
4. Use feature flags for gradual rollout

## Success Metrics

Track these to measure migration success:

```
Before Migration:
  - Styles: 32
  - Variables: 0
  - Conflicts: N/A
  - Maintenance Time: High

After Week 4:
  - Styles: 32
  - Variables: 19
  - Conflicts: 3
  - Maintenance Time: Medium

After Week 8 (Complete):
  - Styles: 0 (archived)
  - Variables: 32
  - Conflicts: 0
  - Maintenance Time: Low
```

## Related Documentation

- [Perfect Team Example](../perfect-team/) - Goal state
- [Legacy Team Example](../legacy-team/) - Starting state
- [Migration Guide](../../docs/USAGE.md#workflow-3-migration-from-styles-to-variables)

---

**Migration is a journey, not a destination!** 🛤️
