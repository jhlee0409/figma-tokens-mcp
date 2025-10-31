/**
 * Tests for Figma Styles Extractor
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { StylesExtractor, extractStylesFromFile } from '@/core/extractors/styles-extractor';
import { FigmaAPIClient } from '@/core/extractors/figma-api';
import type {
  Style,
  FileNodesResponse,
  VectorNode,
  TextNode,
  TypeStyle,
} from '@/core/extractors/types';

// Mock the FigmaAPIClient
vi.mock('@/core/extractors/figma-api');

describe('StylesExtractor', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockClient: any;
  let extractor: StylesExtractor;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();

    // Create mock client
    mockClient = {
      getFileStyles: vi.fn(),
      getFileNodes: vi.fn(),
    };

    extractor = new StylesExtractor(mockClient);
  });

  // ============================================================================
  // Basic Extraction Tests
  // ============================================================================

  describe('extractStyles', () => {
    it('should extract color and text styles from a Figma file', async () => {
      // Mock style metadata
      const mockStyles: Style[] = [
        {
          key: '1:1',
          name: 'colors/primary',
          description: 'Primary brand color',
          styleType: 'FILL',
          remote: false,
        },
        {
          key: '1:2',
          name: 'typography/heading',
          description: 'Main heading style',
          styleType: 'TEXT',
          remote: false,
        },
        {
          key: '1:3',
          name: 'effects/shadow',
          description: 'Drop shadow',
          styleType: 'EFFECT',
          remote: false,
        },
      ];

      // Mock node responses
      const mockNodesResponse: FileNodesResponse = {
        name: 'Test File',
        nodes: {
          '1:1': {
            document: {
              id: '1:1',
              name: 'Primary Color',
              type: 'RECTANGLE',
              fills: [
                {
                  type: 'SOLID',
                  color: { r: 0.2, g: 0.4, b: 0.8, a: 1 },
                  visible: true,
                },
              ],
            } as VectorNode,
          },
          '1:2': {
            document: {
              id: '1:2',
              name: 'Heading Style',
              type: 'TEXT',
              characters: 'Sample',
              style: {
                fontFamily: 'Inter',
                fontWeight: 700,
                fontSize: 24,
                letterSpacing: 0,
                textAlignHorizontal: 'LEFT',
                textAlignVertical: 'TOP',
                lineHeightUnit: 'PIXELS',
              } as TypeStyle,
            } as TextNode,
          },
        },
      };

      mockClient.getFileStyles.mockResolvedValue(mockStyles);
      mockClient.getFileNodes.mockResolvedValue(mockNodesResponse);

      const result = await extractor.extractStyles('test-file-key');

      expect(result).toBeDefined();
      expect(result.colors).toBeDefined();
      expect(result.typography).toBeDefined();
      expect(result.metadata.totalStyles).toBe(3);
      expect(result.metadata.colorStyles).toBe(1);
      expect(result.metadata.textStyles).toBe(1);
      expect(Object.keys(result.colors)).toHaveLength(1);
      expect(Object.keys(result.typography)).toHaveLength(1);
    });

    it('should handle empty styles list', async () => {
      mockClient.getFileStyles.mockResolvedValue([]);

      const result = await extractor.extractStyles('test-file-key');

      expect(result.colors).toEqual({});
      expect(result.typography).toEqual({});
      expect(result.metadata.totalStyles).toBe(0);
      expect(result.metadata.colorStyles).toBe(0);
      expect(result.metadata.textStyles).toBe(0);
    });

    it('should filter out EFFECT and GRID styles', async () => {
      const mockStyles: Style[] = [
        {
          key: '1:1',
          name: 'colors/primary',
          description: '',
          styleType: 'FILL',
          remote: false,
        },
        {
          key: '1:2',
          name: 'effects/shadow',
          description: '',
          styleType: 'EFFECT',
          remote: false,
        },
        {
          key: '1:3',
          name: 'grid/8pt',
          description: '',
          styleType: 'GRID',
          remote: false,
        },
      ];

      const mockNodesResponse: FileNodesResponse = {
        name: 'Test File',
        nodes: {
          '1:1': {
            document: {
              id: '1:1',
              name: 'Color',
              type: 'RECTANGLE',
              fills: [{ type: 'SOLID', color: { r: 1, g: 0, b: 0, a: 1 } }],
            } as VectorNode,
          },
        },
      };

      mockClient.getFileStyles.mockResolvedValue(mockStyles);
      mockClient.getFileNodes.mockResolvedValue(mockNodesResponse);

      const result = await extractor.extractStyles('test-file-key');

      // Only FILL style should be extracted
      expect(result.metadata.colorStyles).toBe(1);
      expect(result.metadata.textStyles).toBe(0);
      expect(Object.keys(result.colors)).toHaveLength(1);
    });
  });

  // ============================================================================
  // Color Extraction Tests
  // ============================================================================

  describe('Color Extraction', () => {
    it('should extract solid color as hex', async () => {
      const mockStyles: Style[] = [
        {
          key: '1:1',
          name: 'blue',
          description: 'Blue color',
          styleType: 'FILL',
          remote: false,
        },
      ];

      const mockNodesResponse: FileNodesResponse = {
        name: 'Test',
        nodes: {
          '1:1': {
            document: {
              id: '1:1',
              name: 'Blue',
              type: 'RECTANGLE',
              fills: [
                {
                  type: 'SOLID',
                  color: { r: 0, g: 0.5, b: 1, a: 1 },
                  visible: true,
                },
              ],
            } as VectorNode,
          },
        },
      };

      mockClient.getFileStyles.mockResolvedValue(mockStyles);
      mockClient.getFileNodes.mockResolvedValue(mockNodesResponse);

      const result = await extractor.extractStyles('test');

      expect(result.colors['blue']).toBeDefined();
      expect(result.colors['blue'].value).toBe('#0080ff');
      expect(result.colors['blue'].type).toBe('color');
      expect(result.colors['blue'].description).toBe('Blue color');
    });

    it('should handle colors with alpha channel', async () => {
      const mockStyles: Style[] = [
        {
          key: '1:1',
          name: 'transparent-blue',
          description: '',
          styleType: 'FILL',
          remote: false,
        },
      ];

      const mockNodesResponse: FileNodesResponse = {
        name: 'Test',
        nodes: {
          '1:1': {
            document: {
              id: '1:1',
              name: 'Blue',
              type: 'RECTANGLE',
              fills: [
                {
                  type: 'SOLID',
                  color: { r: 0, g: 0, b: 1, a: 1 },
                  opacity: 0.5,
                  visible: true,
                },
              ],
            } as VectorNode,
          },
        },
      };

      mockClient.getFileStyles.mockResolvedValue(mockStyles);
      mockClient.getFileNodes.mockResolvedValue(mockNodesResponse);

      const result = await extractor.extractStyles('test');

      expect(result.colors['transparent-blue'].value).toBe('#0000ff80');
    });

    it('should convert linear gradient to CSS string', async () => {
      const mockStyles: Style[] = [
        {
          key: '1:1',
          name: 'gradient',
          description: '',
          styleType: 'FILL',
          remote: false,
        },
      ];

      const mockNodesResponse: FileNodesResponse = {
        name: 'Test',
        nodes: {
          '1:1': {
            document: {
              id: '1:1',
              name: 'Gradient',
              type: 'RECTANGLE',
              fills: [
                {
                  type: 'GRADIENT_LINEAR',
                  visible: true,
                  gradientStops: [
                    { position: 0, color: { r: 1, g: 0, b: 0, a: 1 } },
                    { position: 1, color: { r: 0, g: 0, b: 1, a: 1 } },
                  ],
                },
              ],
            } as VectorNode,
          },
        },
      };

      mockClient.getFileStyles.mockResolvedValue(mockStyles);
      mockClient.getFileNodes.mockResolvedValue(mockNodesResponse);

      const result = await extractor.extractStyles('test');

      expect(result.colors['gradient'].value).toBe('linear-gradient(#ff0000 0%, #0000ff 100%)');
    });

    it('should skip image fills', async () => {
      const mockStyles: Style[] = [
        {
          key: '1:1',
          name: 'image-fill',
          description: '',
          styleType: 'FILL',
          remote: false,
        },
      ];

      const mockNodesResponse: FileNodesResponse = {
        name: 'Test',
        nodes: {
          '1:1': {
            document: {
              id: '1:1',
              name: 'Image',
              type: 'RECTANGLE',
              fills: [
                {
                  type: 'IMAGE',
                  visible: true,
                  imageRef: 'image-123',
                },
              ],
            } as VectorNode,
          },
        },
      };

      mockClient.getFileStyles.mockResolvedValue(mockStyles);
      mockClient.getFileNodes.mockResolvedValue(mockNodesResponse);

      const result = await extractor.extractStyles('test');

      // Image fill should be skipped
      expect(Object.keys(result.colors)).toHaveLength(0);
    });

    it('should handle missing or deleted nodes', async () => {
      const mockStyles: Style[] = [
        {
          key: '1:1',
          name: 'deleted-color',
          description: '',
          styleType: 'FILL',
          remote: false,
        },
      ];

      const mockNodesResponse: FileNodesResponse = {
        name: 'Test',
        nodes: {
          '1:1': {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            document: null as any, // Deleted node
          },
        },
      };

      mockClient.getFileStyles.mockResolvedValue(mockStyles);
      mockClient.getFileNodes.mockResolvedValue(mockNodesResponse);

      const result = await extractor.extractStyles('test');

      // Deleted node should be skipped
      expect(Object.keys(result.colors)).toHaveLength(0);
      expect(result.metadata.skippedStyles).toBe(1);
    });
  });

  // ============================================================================
  // Typography Extraction Tests
  // ============================================================================

  describe('Typography Extraction', () => {
    it('should extract basic typography properties', async () => {
      const mockStyles: Style[] = [
        {
          key: '1:1',
          name: 'heading-large',
          description: 'Large heading',
          styleType: 'TEXT',
          remote: false,
        },
      ];

      const mockNodesResponse: FileNodesResponse = {
        name: 'Test',
        nodes: {
          '1:1': {
            document: {
              id: '1:1',
              name: 'Heading',
              type: 'TEXT',
              characters: 'Sample',
              style: {
                fontFamily: 'Inter',
                fontWeight: 700,
                fontSize: 32,
                letterSpacing: -0.5,
                textAlignHorizontal: 'LEFT',
                textAlignVertical: 'TOP',
                lineHeightPx: 40,
                lineHeightUnit: 'PIXELS',
              } as TypeStyle,
            } as TextNode,
          },
        },
      };

      mockClient.getFileStyles.mockResolvedValue(mockStyles);
      mockClient.getFileNodes.mockResolvedValue(mockNodesResponse);

      const result = await extractor.extractStyles('test');

      expect(result.typography['heading-large']).toBeDefined();
      expect(result.typography['heading-large'].value).toEqual({
        fontFamily: 'Inter',
        fontWeight: 700,
        fontSize: '32px',
        lineHeight: '40px',
        letterSpacing: '-0.5px',
      });
      expect(result.typography['heading-large'].type).toBe('typography');
      expect(result.typography['heading-large'].description).toBe('Large heading');
    });

    it('should convert to rem when useRem is true', async () => {
      const config = { useRem: true, baseFontSize: 16 };
      extractor = new StylesExtractor(mockClient, config);

      const mockStyles: Style[] = [
        {
          key: '1:1',
          name: 'body',
          description: '',
          styleType: 'TEXT',
          remote: false,
        },
      ];

      const mockNodesResponse: FileNodesResponse = {
        name: 'Test',
        nodes: {
          '1:1': {
            document: {
              id: '1:1',
              name: 'Body',
              type: 'TEXT',
              characters: 'Sample',
              style: {
                fontFamily: 'Inter',
                fontWeight: 400,
                fontSize: 16,
                letterSpacing: 0,
                textAlignHorizontal: 'LEFT',
                textAlignVertical: 'TOP',
                lineHeightPx: 24,
                lineHeightUnit: 'PIXELS',
              } as TypeStyle,
            } as TextNode,
          },
        },
      };

      mockClient.getFileStyles.mockResolvedValue(mockStyles);
      mockClient.getFileNodes.mockResolvedValue(mockNodesResponse);

      const result = await extractor.extractStyles('test');

      expect(result.typography['body'].value.fontSize).toBe('1rem');
      expect(result.typography['body'].value.lineHeight).toBe('1.5rem');
    });

    it('should handle text decoration and transform', async () => {
      const mockStyles: Style[] = [
        {
          key: '1:1',
          name: 'link',
          description: '',
          styleType: 'TEXT',
          remote: false,
        },
      ];

      const mockNodesResponse: FileNodesResponse = {
        name: 'Test',
        nodes: {
          '1:1': {
            document: {
              id: '1:1',
              name: 'Link',
              type: 'TEXT',
              characters: 'Sample',
              style: {
                fontFamily: 'Inter',
                fontWeight: 400,
                fontSize: 14,
                letterSpacing: 0,
                textAlignHorizontal: 'LEFT',
                textAlignVertical: 'TOP',
                lineHeightUnit: 'PIXELS',
                textDecoration: 'UNDERLINE',
                textCase: 'UPPER',
              } as TypeStyle,
            } as TextNode,
          },
        },
      };

      mockClient.getFileStyles.mockResolvedValue(mockStyles);
      mockClient.getFileNodes.mockResolvedValue(mockNodesResponse);

      const result = await extractor.extractStyles('test');

      expect(result.typography['link'].value.textDecoration).toBe('underline');
      expect(result.typography['link'].value.textTransform).toBe('uppercase');
    });

    it('should skip typography with missing style property', async () => {
      const mockStyles: Style[] = [
        {
          key: '1:1',
          name: 'broken',
          description: '',
          styleType: 'TEXT',
          remote: false,
        },
      ];

      const mockNodesResponse: FileNodesResponse = {
        name: 'Test',
        nodes: {
          '1:1': {
            document: {
              id: '1:1',
              name: 'Broken',
              type: 'TEXT',
              characters: 'Sample',
              // Missing style property
            } as TextNode,
          },
        },
      };

      mockClient.getFileStyles.mockResolvedValue(mockStyles);
      mockClient.getFileNodes.mockResolvedValue(mockNodesResponse);

      const result = await extractor.extractStyles('test');

      expect(Object.keys(result.typography)).toHaveLength(0);
      expect(result.metadata.skippedStyles).toBe(1);
    });
  });

  // ============================================================================
  // Name Normalization Tests
  // ============================================================================

  describe('Name Normalization', () => {
    it('should normalize style names to kebab-case by default', async () => {
      const mockStyles: Style[] = [
        {
          key: '1:1',
          name: 'Colors/Primary Blue',
          description: '',
          styleType: 'FILL',
          remote: false,
        },
        {
          key: '1:2',
          name: 'typography/Heading Large',
          description: '',
          styleType: 'TEXT',
          remote: false,
        },
      ];

      const mockNodesResponse: FileNodesResponse = {
        name: 'Test',
        nodes: {
          '1:1': {
            document: {
              id: '1:1',
              name: 'Color',
              type: 'RECTANGLE',
              fills: [{ type: 'SOLID', color: { r: 0, g: 0, b: 1, a: 1 } }],
            } as VectorNode,
          },
          '1:2': {
            document: {
              id: '1:2',
              name: 'Heading',
              type: 'TEXT',
              characters: 'Sample',
              style: {
                fontFamily: 'Inter',
                fontWeight: 400,
                fontSize: 16,
                letterSpacing: 0,
                textAlignHorizontal: 'LEFT',
                textAlignVertical: 'TOP',
                lineHeightUnit: 'PIXELS',
              } as TypeStyle,
            } as TextNode,
          },
        },
      };

      mockClient.getFileStyles.mockResolvedValue(mockStyles);
      mockClient.getFileNodes.mockResolvedValue(mockNodesResponse);

      const result = await extractor.extractStyles('test');

      expect(result.colors['colors-primary-blue']).toBeDefined();
      expect(result.typography['typography-heading-large']).toBeDefined();
    });

    it('should preserve original names when normalizeNames is false', async () => {
      const config = { normalizeNames: false };
      extractor = new StylesExtractor(mockClient, config);

      const mockStyles: Style[] = [
        {
          key: '1:1',
          name: 'Colors/Primary Blue',
          description: '',
          styleType: 'FILL',
          remote: false,
        },
      ];

      const mockNodesResponse: FileNodesResponse = {
        name: 'Test',
        nodes: {
          '1:1': {
            document: {
              id: '1:1',
              name: 'Color',
              type: 'RECTANGLE',
              fills: [{ type: 'SOLID', color: { r: 0, g: 0, b: 1, a: 1 } }],
            } as VectorNode,
          },
        },
      };

      mockClient.getFileStyles.mockResolvedValue(mockStyles);
      mockClient.getFileNodes.mockResolvedValue(mockNodesResponse);

      const result = await extractor.extractStyles('test');

      expect(result.colors['Colors/Primary Blue']).toBeDefined();
    });

    it('should detect naming pattern in metadata', async () => {
      const mockStyles: Style[] = [
        {
          key: '1:1',
          name: 'colors/primary',
          description: '',
          styleType: 'FILL',
          remote: false,
        },
        {
          key: '1:2',
          name: 'colors/secondary',
          description: '',
          styleType: 'FILL',
          remote: false,
        },
        {
          key: '1:3',
          name: 'typography/heading',
          description: '',
          styleType: 'TEXT',
          remote: false,
        },
      ];

      const mockNodesResponse: FileNodesResponse = {
        name: 'Test',
        nodes: {
          '1:1': {
            document: {
              id: '1:1',
              name: 'Color',
              type: 'RECTANGLE',
              fills: [{ type: 'SOLID', color: { r: 1, g: 0, b: 0, a: 1 } }],
            } as VectorNode,
          },
          '1:2': {
            document: {
              id: '1:2',
              name: 'Color',
              type: 'RECTANGLE',
              fills: [{ type: 'SOLID', color: { r: 0, g: 1, b: 0, a: 1 } }],
            } as VectorNode,
          },
          '1:3': {
            document: {
              id: '1:3',
              name: 'Heading',
              type: 'TEXT',
              characters: 'Sample',
              style: {
                fontFamily: 'Inter',
                fontWeight: 400,
                fontSize: 16,
                letterSpacing: 0,
                textAlignHorizontal: 'LEFT',
                textAlignVertical: 'TOP',
                lineHeightUnit: 'PIXELS',
              } as TypeStyle,
            } as TextNode,
          },
        },
      };

      mockClient.getFileStyles.mockResolvedValue(mockStyles);
      mockClient.getFileNodes.mockResolvedValue(mockNodesResponse);

      const result = await extractor.extractStyles('test');

      expect(result.metadata.namingPattern).toBe('slash/case');
    });
  });

  // ============================================================================
  // Batch Processing Tests
  // ============================================================================

  describe('Batch Processing', () => {
    it('should batch node requests when exceeding batchSize', async () => {
      const config = { batchSize: 2 };
      extractor = new StylesExtractor(mockClient, config);

      const mockStyles: Style[] = [
        {
          key: '1:1',
          name: 'color1',
          description: '',
          styleType: 'FILL',
          remote: false,
        },
        {
          key: '1:2',
          name: 'color2',
          description: '',
          styleType: 'FILL',
          remote: false,
        },
        {
          key: '1:3',
          name: 'color3',
          description: '',
          styleType: 'FILL',
          remote: false,
        },
      ];

      const mockNodesResponse1: FileNodesResponse = {
        name: 'Test',
        nodes: {
          '1:1': {
            document: {
              id: '1:1',
              name: 'Color',
              type: 'RECTANGLE',
              fills: [{ type: 'SOLID', color: { r: 1, g: 0, b: 0, a: 1 } }],
            } as VectorNode,
          },
          '1:2': {
            document: {
              id: '1:2',
              name: 'Color',
              type: 'RECTANGLE',
              fills: [{ type: 'SOLID', color: { r: 0, g: 1, b: 0, a: 1 } }],
            } as VectorNode,
          },
        },
      };

      const mockNodesResponse2: FileNodesResponse = {
        name: 'Test',
        nodes: {
          '1:3': {
            document: {
              id: '1:3',
              name: 'Color',
              type: 'RECTANGLE',
              fills: [{ type: 'SOLID', color: { r: 0, g: 0, b: 1, a: 1 } }],
            } as VectorNode,
          },
        },
      };

      mockClient.getFileStyles.mockResolvedValue(mockStyles);
      mockClient.getFileNodes
        .mockResolvedValueOnce(mockNodesResponse1)
        .mockResolvedValueOnce(mockNodesResponse2);

      const result = await extractor.extractStyles('test');

      // Should have made 2 batch requests
      expect(mockClient.getFileNodes).toHaveBeenCalledTimes(2);
      expect(Object.keys(result.colors)).toHaveLength(3);
    });

    it('should continue processing if one batch fails', async () => {
      const config = { batchSize: 1 };
      extractor = new StylesExtractor(mockClient, config);

      const mockStyles: Style[] = [
        {
          key: '1:1',
          name: 'color1',
          description: '',
          styleType: 'FILL',
          remote: false,
        },
        {
          key: '1:2',
          name: 'color2',
          description: '',
          styleType: 'FILL',
          remote: false,
        },
      ];

      mockClient.getFileStyles.mockResolvedValue(mockStyles);
      mockClient.getFileNodes.mockRejectedValueOnce(new Error('API error')).mockResolvedValueOnce({
        name: 'Test',
        nodes: {
          '1:2': {
            document: {
              id: '1:2',
              name: 'Color',
              type: 'RECTANGLE',
              fills: [{ type: 'SOLID', color: { r: 0, g: 1, b: 0, a: 1 } }],
            } as VectorNode,
          },
        },
      });

      const result = await extractor.extractStyles('test');

      // Should have successfully extracted the second color
      expect(Object.keys(result.colors)).toHaveLength(1);
      expect(result.colors['color-2']).toBeDefined();
    });
  });

  // ============================================================================
  // Convenience Function Tests
  // ============================================================================

  describe('extractStylesFromFile', () => {
    it('should create client and extractor internally', async () => {
      // Mock FigmaAPIClient constructor
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const MockedClient = FigmaAPIClient as any;
      MockedClient.mockImplementation(() => ({
        getFileStyles: vi.fn().mockResolvedValue([]),
        getFileNodes: vi.fn().mockResolvedValue({ name: 'Test', nodes: {} }),
      }));

      const result = await extractStylesFromFile('test-file-key');

      expect(result).toBeDefined();
      expect(result.colors).toEqual({});
      expect(result.typography).toEqual({});
    });
  });
});
