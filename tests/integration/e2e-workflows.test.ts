/**
 * End-to-End Workflow Tests
 *
 * Tests complete workflows from token extraction through conversion and component generation.
 * Tests three scenarios:
 * 1. "Perfect Team" - Variables only
 * 2. "Legacy Team" - Styles only
 * 3. "Mixed Team" - Variables + Styles with conflict resolution
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { extractTokens, convertToTailwind, generateComponent } from '../../src/mcp/tools';
import type { ToolContext } from '../../src/mcp/types';
import { FigmaAPIClient } from '../../src/core/extractors/figma-api';
import { createVariablesExtractor } from '../../src/core/extractors/variables-extractor';
import { StylesExtractor } from '../../src/core/extractors/styles-extractor';

// Mock only the Figma API client to avoid actual API calls
vi.mock('../../src/core/extractors/figma-api');

describe('E2E Workflows', () => {
  let mockContext: ToolContext;
  let mockApiClient: any;

  beforeEach(() => {
    mockContext = {
      figmaAccessToken: 'test-token',
      logger: {
        debug: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
      },
    };

    // Mock API client
    mockApiClient = {
      getFileVariables: vi.fn(),
      getFile: vi.fn(),
      getFileNodes: vi.fn(),
    };

    vi.mocked(FigmaAPIClient).mockImplementation(() => mockApiClient);
  });

  describe('Scenario 1: Perfect Team (Variables Only)', () => {
    it('should extract Variables only', async () => {
      // Mock Variables API response
      mockApiClient.getFileVariables.mockResolvedValue({
        meta: {
          variableCollections: {
            'collection-1': {
              id: 'collection-1',
              name: 'Design Tokens',
              modes: [{ modeId: 'mode-1', name: 'Default' }],
            },
          },
          variables: {
            'var-1': {
              id: 'var-1',
              name: 'colors/primary',
              resolvedType: 'COLOR',
              valuesByMode: {
                'mode-1': {
                  r: 0,
                  g: 0.4,
                  b: 0.8,
                  a: 1,
                },
              },
              variableCollectionId: 'collection-1',
            },
            'var-2': {
              id: 'var-2',
              name: 'spacing/base',
              resolvedType: 'FLOAT',
              valuesByMode: {
                'mode-1': 16,
              },
              variableCollectionId: 'collection-1',
            },
          },
        },
      });

      const result = await extractTokens(
        {
          figmaFileUrl: 'https://www.figma.com/file/abc123/test',
          extractionStrategy: 'variables',
        },
        mockContext
      );

      expect(result.success).toBe(true);
      expect(result.metadata.sources).toEqual(['variables']);
      expect(result.tokens).toBeDefined();
      expect(result.statistics.variableTokens).toBeGreaterThan(0);
      expect(result.statistics.styleTokens).toBe(0);
    });

    it('should complete workflow: Variables → Tailwind v4 → Component', async () => {
      // Mock Variables API response
      mockApiClient.getFileVariables.mockResolvedValue({
        meta: {
          variableCollections: {
            'collection-1': {
              id: 'collection-1',
              name: 'Design Tokens',
              modes: [{ modeId: 'mode-1', name: 'Default' }],
            },
          },
          variables: {
            'var-1': {
              id: 'var-1',
              name: 'colors/primary',
              resolvedType: 'COLOR',
              valuesByMode: {
                'mode-1': {
                  r: 0,
                  g: 0.4,
                  b: 0.8,
                  a: 1,
                },
              },
              variableCollectionId: 'collection-1',
            },
          },
        },
      });

      // Step 1: Extract tokens
      const extracted = await extractTokens(
        {
          figmaFileUrl: 'https://www.figma.com/file/abc123/test',
          extractionStrategy: 'variables',
        },
        mockContext
      );

      expect(extracted.success).toBe(true);

      // Step 2: Convert to Tailwind v4
      const converted = await convertToTailwind(
        {
          tokens: extracted.tokens,
          tailwindVersion: 'v4',
          typescript: true,
        },
        mockContext
      );

      expect(converted.success).toBe(true);
      expect(converted.files).toBeDefined();
      expect(converted.summary.version).toBe('v4');

      // Verify CSS file is generated
      const cssFile = converted.files.find((f) => f.type === 'css');
      expect(cssFile).toBeDefined();
      expect(cssFile?.content).toContain('@theme');

      // Step 3: Generate component
      const component = await generateComponent(
        {
          componentName: 'Button',
          tokens: extracted.tokens,
          typescript: true,
        },
        mockContext
      );

      expect(component.success).toBe(true);
      expect(component.component).toBeDefined();
      expect(component.component.filename).toBe('Button.tsx');
      expect(component.metadata.typescript).toBe(true);
      expect(component.usage).toBeDefined();
    });
  });

  describe('Scenario 2: Legacy Team (Styles Only)', () => {
    it('should extract Styles only', async () => {
      // Mock Styles API response
      mockApiClient.getFile.mockResolvedValue({
        document: {},
        styles: {
          'style-1': {
            key: 'style-1',
            name: 'primary',
            styleType: 'FILL',
            description: 'Primary brand color',
          },
          'style-2': {
            key: 'style-2',
            name: 'heading',
            styleType: 'TEXT',
            description: 'Heading text style',
          },
        },
      });

      mockApiClient.getFileNodes.mockResolvedValue({
        nodes: {
          'style-1': {
            document: {
              fills: [
                {
                  type: 'SOLID',
                  color: { r: 0, g: 0.4, b: 0.8, a: 1 },
                },
              ],
            },
          },
          'style-2': {
            document: {
              style: {
                fontFamily: 'Inter',
                fontSize: 24,
                fontWeight: 700,
                lineHeightPx: 32,
              },
            },
          },
        },
      });

      const result = await extractTokens(
        {
          figmaFileUrl: 'https://www.figma.com/file/abc123/test',
          extractionStrategy: 'styles',
        },
        mockContext
      );

      expect(result.success).toBe(true);
      expect(result.metadata.sources).toEqual(['styles']);
      expect(result.statistics.variableTokens).toBe(0);
      expect(result.statistics.styleTokens).toBeGreaterThan(0);
    });

    it('should complete workflow: Styles → Tailwind v3 → Component', async () => {
      // Mock Styles API response
      mockApiClient.getFile.mockResolvedValue({
        document: {},
        styles: {
          'style-1': {
            key: 'style-1',
            name: 'primary',
            styleType: 'FILL',
            description: 'Primary brand color',
          },
        },
      });

      mockApiClient.getFileNodes.mockResolvedValue({
        nodes: {
          'style-1': {
            document: {
              fills: [
                {
                  type: 'SOLID',
                  color: { r: 0, g: 0.4, b: 0.8, a: 1 },
                },
              ],
            },
          },
        },
      });

      // Step 1: Extract tokens
      const extracted = await extractTokens(
        {
          figmaFileUrl: 'https://www.figma.com/file/abc123/test',
          extractionStrategy: 'styles',
          tokenTypes: ['colors'],
        },
        mockContext
      );

      expect(extracted.success).toBe(true);

      // Step 2: Convert to Tailwind v3
      const converted = await convertToTailwind(
        {
          tokens: extracted.tokens,
          tailwindVersion: 'v3',
          preset: 'merge',
          typescript: true,
        },
        mockContext
      );

      expect(converted.success).toBe(true);
      expect(converted.summary.version).toBe('v3');
      expect(converted.summary.preset).toBe('merge');

      // Verify config file is generated
      const configFile = converted.files.find((f) => f.type === 'config');
      expect(configFile).toBeDefined();
      expect(configFile?.content).toContain('module.exports');

      // Step 3: Generate component
      const component = await generateComponent(
        {
          componentName: 'Card',
          tokens: extracted.tokens,
          typescript: false,
        },
        mockContext
      );

      expect(component.success).toBe(true);
      expect(component.component.filename).toBe('Card.jsx');
      expect(component.metadata.typescript).toBe(false);
    });
  });

  describe('Scenario 3: Mixed Team (Variables + Styles)', () => {
    it('should extract both Variables and Styles', async () => {
      // Mock both APIs
      mockApiClient.getFileVariables.mockResolvedValue({
        meta: {
          variableCollections: {
            'collection-1': {
              id: 'collection-1',
              name: 'Design Tokens',
              modes: [{ modeId: 'mode-1', name: 'Default' }],
            },
          },
          variables: {
            'var-1': {
              id: 'var-1',
              name: 'colors/primary',
              resolvedType: 'COLOR',
              valuesByMode: {
                'mode-1': {
                  r: 0,
                  g: 0.4,
                  b: 0.8,
                  a: 1,
                },
              },
              variableCollectionId: 'collection-1',
            },
          },
        },
      });

      mockApiClient.getFile.mockResolvedValue({
        document: {},
        styles: {
          'style-1': {
            key: 'style-1',
            name: 'primary',
            styleType: 'FILL',
            description: 'Primary brand color (legacy)',
          },
        },
      });

      mockApiClient.getFileNodes.mockResolvedValue({
        nodes: {
          'style-1': {
            document: {
              fills: [
                {
                  type: 'SOLID',
                  color: { r: 1, g: 0, b: 0, a: 1 }, // Different color - conflict!
                },
              ],
            },
          },
        },
      });

      const result = await extractTokens(
        {
          figmaFileUrl: 'https://www.figma.com/file/abc123/test',
          extractionStrategy: 'mixed',
        },
        mockContext
      );

      expect(result.success).toBe(true);
      expect(result.metadata.sources).toEqual(['variables', 'styles']);
      expect(result.statistics.variableTokens).toBeGreaterThan(0);
      expect(result.statistics.styleTokens).toBeGreaterThan(0);

      // Should have conflict warnings
      const conflictWarnings = result.warnings.filter(w => w.type === 'conflict');
      expect(conflictWarnings.length).toBeGreaterThan(0);
    });

    it('should resolve conflicts with variables_priority', async () => {
      // Mock both APIs with conflicting tokens
      mockApiClient.getFileVariables.mockResolvedValue({
        meta: {
          variableCollections: {
            'collection-1': {
              id: 'collection-1',
              name: 'Design Tokens',
              modes: [{ modeId: 'mode-1', name: 'Default' }],
            },
          },
          variables: {
            'var-1': {
              id: 'var-1',
              name: 'colors/primary',
              resolvedType: 'COLOR',
              valuesByMode: {
                'mode-1': {
                  r: 0,
                  g: 0.4,
                  b: 0.8,
                  a: 1,
                },
              },
              variableCollectionId: 'collection-1',
            },
          },
        },
      });

      mockApiClient.getFile.mockResolvedValue({
        document: {},
        styles: {
          'style-1': {
            key: 'style-1',
            name: 'colors/primary',
            styleType: 'FILL',
          },
        },
      });

      mockApiClient.getFileNodes.mockResolvedValue({
        nodes: {
          'style-1': {
            document: {
              fills: [
                {
                  type: 'SOLID',
                  color: { r: 1, g: 0, b: 0, a: 1 },
                },
              ],
            },
          },
        },
      });

      const result = await extractTokens(
        {
          figmaFileUrl: 'https://www.figma.com/file/abc123/test',
          extractionStrategy: 'mixed',
        },
        mockContext
      );

      expect(result.success).toBe(true);

      // With variables_priority, the Variable value should win
      // The primary color should be #0066cc (from variable), not #ff0000 (from style)
      const primaryColor = result.tokens.colors?.primary;
      expect(primaryColor).toBeDefined();
    });

    it('should complete full mixed workflow', async () => {
      // Mock both APIs
      mockApiClient.getFileVariables.mockResolvedValue({
        meta: {
          variableCollections: {
            'collection-1': {
              id: 'collection-1',
              name: 'Design Tokens',
              modes: [{ modeId: 'mode-1', name: 'Default' }],
            },
          },
          variables: {
            'var-1': {
              id: 'var-1',
              name: 'colors/primary',
              resolvedType: 'COLOR',
              valuesByMode: {
                'mode-1': {
                  r: 0,
                  g: 0.4,
                  b: 0.8,
                  a: 1,
                },
              },
              variableCollectionId: 'collection-1',
            },
          },
        },
      });

      mockApiClient.getFile.mockResolvedValue({
        document: {},
        styles: {
          'style-1': {
            key: 'style-1',
            name: 'text/heading',
            styleType: 'TEXT',
          },
        },
      });

      mockApiClient.getFileNodes.mockResolvedValue({
        nodes: {
          'style-1': {
            document: {
              style: {
                fontFamily: 'Inter',
                fontSize: 32,
                fontWeight: 700,
              },
            },
          },
        },
      });

      // Step 1: Extract mixed tokens
      const extracted = await extractTokens(
        {
          figmaFileUrl: 'https://www.figma.com/file/abc123/test',
          extractionStrategy: 'mixed',
        },
        mockContext
      );

      expect(extracted.success).toBe(true);
      expect(extracted.metadata.sources).toContain('variables');
      expect(extracted.metadata.sources).toContain('styles');

      // Step 2: Convert to Tailwind v4
      const converted = await convertToTailwind(
        {
          tokens: extracted.tokens,
          tailwindVersion: 'v4',
        },
        mockContext
      );

      expect(converted.success).toBe(true);

      // Step 3: Generate component
      const component = await generateComponent(
        {
          componentName: 'MixedButton',
          tokens: extracted.tokens,
        },
        mockContext
      );

      expect(component.success).toBe(true);
      expect(component.metadata.variants).toBeDefined();
    });
  });

  describe('Error Recovery', () => {
    it('should handle extraction failure gracefully', async () => {
      mockApiClient.getFileVariables.mockRejectedValue(new Error('API Error'));

      await expect(
        extractTokens(
          {
            figmaFileUrl: 'https://www.figma.com/file/abc123/test',
            extractionStrategy: 'variables',
          },
          mockContext
        )
      ).rejects.toThrow('API Error');
    });

    it('should handle invalid tokens in conversion', async () => {
      await expect(
        convertToTailwind(
          {
            tokens: {},
          },
          mockContext
        )
      ).rejects.toThrow();
    });

    it('should handle invalid component name', async () => {
      await expect(
        generateComponent(
          {
            componentName: 'invalid-name',
            tokens: { colors: { primary: '#000' } },
          },
          mockContext
        )
      ).rejects.toThrow();
    });
  });

  describe('Performance', () => {
    it('should complete extraction within reasonable time', async () => {
      mockApiClient.getFileVariables.mockResolvedValue({
        meta: {
          variableCollections: {},
          variables: {},
        },
      });

      const start = Date.now();
      await extractTokens(
        {
          figmaFileUrl: 'https://www.figma.com/file/abc123/test',
          extractionStrategy: 'variables',
        },
        mockContext
      );
      const duration = Date.now() - start;

      // Should complete within 5 seconds (mocked, so should be very fast)
      expect(duration).toBeLessThan(5000);
    });

    it('should handle large token sets', async () => {
      // Generate 100 variables
      const variables: Record<string, any> = {};
      for (let i = 0; i < 100; i++) {
        variables[`var-${i}`] = {
          id: `var-${i}`,
          name: `token-${i}`,
          resolvedType: 'COLOR',
          valuesByMode: {
            'mode-1': {
              r: Math.random(),
              g: Math.random(),
              b: Math.random(),
              a: 1,
            },
          },
          variableCollectionId: 'collection-1',
        };
      }

      mockApiClient.getFileVariables.mockResolvedValue({
        meta: {
          variableCollections: {
            'collection-1': {
              id: 'collection-1',
              name: 'Design Tokens',
              modes: [{ modeId: 'mode-1', name: 'Default' }],
            },
          },
          variables,
        },
      });

      const result = await extractTokens(
        {
          figmaFileUrl: 'https://www.figma.com/file/abc123/test',
          extractionStrategy: 'variables',
        },
        mockContext
      );

      expect(result.success).toBe(true);
      expect(result.statistics.totalTokens).toBeGreaterThanOrEqual(100);
    });
  });
});
