/**
 * Tests for Variables Extractor
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { VariablesExtractor } from '@/core/extractors/variables-extractor';
import { FigmaAPIClient } from '@/core/extractors/figma-api';
import type {
  FileVariablesResponse,
  Variable,
  VariableCollection,
  VariableAlias,
  RGBA,
} from '@/core/extractors/types';

// Mock FigmaAPIClient
vi.mock('@/core/extractors/figma-api');

describe('VariablesExtractor', () => {
  let extractor: VariablesExtractor;
  let mockClient: FigmaAPIClient;

  // Mock data
  const mockRGBA: RGBA = { r: 0.2, g: 0.4, b: 0.6, a: 1.0 };
  const mockRGBAWithAlpha: RGBA = { r: 1.0, g: 0.5, b: 0.0, a: 0.8 };

  const mockCollection: VariableCollection = {
    id: 'collection-1',
    name: 'Colors',
    key: 'colors-key',
    modes: [
      { modeId: 'mode-1', name: 'Light' },
      { modeId: 'mode-2', name: 'Dark' },
    ],
    defaultModeId: 'mode-1',
    remote: false,
    hiddenFromPublishing: false,
    variableIds: ['var-1', 'var-2', 'var-3'],
  };

  const mockVariables: Record<string, Variable> = {
    'var-1': {
      id: 'var-1',
      name: 'primary/blue/500',
      key: 'var-1-key',
      variableCollectionId: 'collection-1',
      resolvedType: 'COLOR',
      valuesByMode: {
        'mode-1': mockRGBA,
        'mode-2': { r: 0.3, g: 0.5, b: 0.7, a: 1.0 },
      },
      remote: false,
      description: 'Primary blue color',
      hiddenFromPublishing: false,
      scopes: ['ALL_FILLS'],
      codeSyntax: {},
    },
    'var-2': {
      id: 'var-2',
      name: 'primary/blue/600',
      key: 'var-2-key',
      variableCollectionId: 'collection-1',
      resolvedType: 'COLOR',
      valuesByMode: {
        'mode-1': { r: 0.1, g: 0.3, b: 0.5, a: 1.0 },
      },
      remote: false,
      description: '',
      hiddenFromPublishing: false,
      scopes: ['ALL_FILLS'],
      codeSyntax: {},
    },
    'var-3': {
      id: 'var-3',
      name: 'typography/size/base',
      key: 'var-3-key',
      variableCollectionId: 'collection-1',
      resolvedType: 'FLOAT',
      valuesByMode: {
        'mode-1': 16,
      },
      remote: false,
      description: 'Base font size',
      hiddenFromPublishing: false,
      scopes: ['TEXT_CONTENT'],
      codeSyntax: {},
    },
  };

  const mockResponse: FileVariablesResponse = {
    status: 200,
    error: false,
    meta: {
      variables: mockVariables,
      variableCollections: {
        'collection-1': mockCollection,
      },
    },
  };

  beforeEach(() => {
    mockClient = new FigmaAPIClient();
    vi.mocked(mockClient.getFileVariables).mockResolvedValue(mockResponse);
    vi.mocked(mockClient.parseFigmaUrl).mockReturnValue({
      fileKey: 'test-file-key',
    });

    extractor = new VariablesExtractor(mockClient, false);
  });

  describe('extract', () => {
    it('should extract variables from a file', async () => {
      const result = await extractor.extract('test-file-key');

      expect(result.variables).toHaveLength(3);
      expect(result.collections).toHaveLength(1);
      expect(result.pattern).toBeDefined();
      expect(result.warnings).toHaveLength(0);
    });

    it('should extract only COLOR variables when filtered', async () => {
      const result = await extractor.extract('test-file-key', {
        types: ['COLOR'],
      });

      expect(result.variables).toHaveLength(2);
      expect(result.variables.every((v) => v.type === 'COLOR')).toBe(true);
    });

    it('should extract only FLOAT variables when filtered', async () => {
      const result = await extractor.extract('test-file-key', {
        types: ['FLOAT'],
      });

      expect(result.variables).toHaveLength(1);
      expect(result.variables[0]?.type).toBe('FLOAT');
    });

    it('should convert RGBA to hex', async () => {
      const result = await extractor.extract('test-file-key', {
        types: ['COLOR'],
      });

      const blueVar = result.variables.find((v) => v.name === 'primary/blue/500');
      expect(blueVar?.value).toBe('#336699');
    });

    it('should convert RGBA with alpha to 8-digit hex', async () => {
      const variableWithAlpha: Variable = {
        id: 'var-alpha',
        name: 'color/alpha',
        key: 'var-alpha-key',
        variableCollectionId: 'collection-1',
        resolvedType: 'COLOR',
        valuesByMode: {
          'mode-1': mockRGBAWithAlpha,
        },
        remote: false,
        description: '',
        hiddenFromPublishing: false,
        scopes: ['ALL_FILLS'],
        codeSyntax: {},
      };

      const responseWithAlpha: FileVariablesResponse = {
        ...mockResponse,
        meta: {
          ...mockResponse.meta,
          variables: {
            ...mockResponse.meta.variables,
            'var-alpha': variableWithAlpha,
          },
        },
      };

      vi.mocked(mockClient.getFileVariables).mockResolvedValue(responseWithAlpha);

      const result = await extractor.extract('test-file-key', {
        types: ['COLOR'],
      });

      const alphaVar = result.variables.find((v) => v.name === 'color/alpha');
      expect(alphaVar?.value).toBe('#ff8000cc');
    });

    it('should detect naming pattern', async () => {
      const result = await extractor.extract('test-file-key');

      expect(result.pattern).toBeDefined();
      expect(result.pattern?.separator).toBe('/');
      expect(result.pattern?.depth).toBe(3);
    });

    it('should normalize variable names', async () => {
      const result = await extractor.extract('test-file-key');

      const blueVar = result.variables.find((v) => v.name === 'primary/blue/500');
      expect(blueVar?.normalizedName).toBe('primary/blue/500');
    });

    it('should use custom pattern when provided', async () => {
      const customPattern = {
        separator: '-',
        case: 'kebab' as const,
        depth: 3,
        type: 'mixed' as const,
        confidence: 1.0,
        sampleCount: 10,
        examples: [],
      };

      const result = await extractor.extract('test-file-key', {
        pattern: customPattern,
      });

      expect(result.pattern?.separator).toBe('-');
      const blueVar = result.variables.find((v) => v.name === 'primary/blue/500');
      expect(blueVar?.normalizedName).toBe('primary-blue-500');
    });

    it('should extract default mode when no mode specified', async () => {
      const result = await extractor.extract('test-file-key');

      expect(result.variables.every((v) => v.modeId === 'mode-1')).toBe(true);
      expect(result.variables.every((v) => v.modeName === 'Light')).toBe(true);
    });

    it('should extract specific mode when specified', async () => {
      const result = await extractor.extract('test-file-key', {
        modeId: 'mode-2',
      });

      const blueVar = result.variables.find((v) => v.name === 'primary/blue/500');
      expect(blueVar?.modeId).toBe('mode-2');
      expect(blueVar?.modeName).toBe('Dark');
    });

    it('should build hierarchical token structure', async () => {
      const result = await extractor.extract('test-file-key');

      expect(result.tokens.primary).toBeDefined();
      expect(result.tokens.primary?.children?.blue).toBeDefined();
      expect(result.tokens.primary?.children?.blue?.children?.['500']).toBeDefined();
      expect(result.tokens.primary?.children?.blue?.children?.['500']?.value).toBe('#336699');
    });

    it('should preserve metadata in token structure', async () => {
      const result = await extractor.extract('test-file-key');

      const token = result.tokens.primary?.children?.blue?.children?.['500'];
      expect(token?.metadata).toBeDefined();
      expect(token?.metadata?.variableId).toBe('var-1');
      expect(token?.metadata?.collectionId).toBe('collection-1');
      expect(token?.metadata?.description).toBe('Primary blue color');
    });

    it('should handle empty variables response', async () => {
      const emptyResponse: FileVariablesResponse = {
        status: 200,
        error: false,
        meta: {
          variables: {},
          variableCollections: {},
        },
      };

      vi.mocked(mockClient.getFileVariables).mockResolvedValue(emptyResponse);

      const result = await extractor.extract('test-file-key');

      expect(result.variables).toHaveLength(0);
      expect(result.warnings).toContain('No variables found in the file');
    });

    it('should parse file key from URL', async () => {
      const url = 'https://www.figma.com/file/ABC123/my-design';

      await extractor.extract(url);

      expect(mockClient.parseFigmaUrl).toHaveBeenCalledWith(url);
      expect(mockClient.getFileVariables).toHaveBeenCalledWith('test-file-key');
    });

    it('should include collection metadata', async () => {
      const result = await extractor.extract('test-file-key');

      expect(result.collections).toHaveLength(1);
      expect(result.collections[0]?.name).toBe('Colors');
      expect(result.collections[0]?.modes).toHaveLength(2);
      expect(result.collections[0]?.defaultModeId).toBe('mode-1');
    });

    it('should warn for missing collection', async () => {
      const varWithoutCollection: Variable = {
        ...mockVariables['var-1']!,
        id: 'var-orphan',
        variableCollectionId: 'non-existent',
      };

      const responseWithOrphan: FileVariablesResponse = {
        ...mockResponse,
        meta: {
          ...mockResponse.meta,
          variables: {
            ...mockResponse.meta.variables,
            'var-orphan': varWithoutCollection,
          },
        },
      };

      vi.mocked(mockClient.getFileVariables).mockResolvedValue(responseWithOrphan);

      const result = await extractor.extract('test-file-key');

      expect(result.warnings.length).toBeGreaterThan(0);
    });
  });

  describe('alias resolution', () => {
    it('should resolve simple alias', async () => {
      const aliasVariable: Variable = {
        id: 'var-alias',
        name: 'primary/main',
        key: 'var-alias-key',
        variableCollectionId: 'collection-1',
        resolvedType: 'COLOR',
        valuesByMode: {
          'mode-1': {
            type: 'VARIABLE_ALIAS',
            id: 'var-1',
          } as VariableAlias,
        },
        remote: false,
        description: 'Alias to primary blue',
        hiddenFromPublishing: false,
        scopes: ['ALL_FILLS'],
        codeSyntax: {},
      };

      const responseWithAlias: FileVariablesResponse = {
        ...mockResponse,
        meta: {
          ...mockResponse.meta,
          variables: {
            ...mockResponse.meta.variables,
            'var-alias': aliasVariable,
          },
        },
      };

      vi.mocked(mockClient.getFileVariables).mockResolvedValue(responseWithAlias);

      const result = await extractor.extract('test-file-key');

      const aliasVar = result.variables.find((v) => v.name === 'primary/main');
      expect(aliasVar?.isAlias).toBe(true);
      expect(aliasVar?.aliasId).toBe('var-1');
      expect(aliasVar?.value).toBe('#336699'); // Resolved value
    });

    it('should resolve chained aliases', async () => {
      const alias1: Variable = {
        id: 'var-alias-1',
        name: 'alias1',
        key: 'alias1-key',
        variableCollectionId: 'collection-1',
        resolvedType: 'COLOR',
        valuesByMode: {
          'mode-1': {
            type: 'VARIABLE_ALIAS',
            id: 'var-1',
          } as VariableAlias,
        },
        remote: false,
        description: '',
        hiddenFromPublishing: false,
        scopes: ['ALL_FILLS'],
        codeSyntax: {},
      };

      const alias2: Variable = {
        id: 'var-alias-2',
        name: 'alias2',
        key: 'alias2-key',
        variableCollectionId: 'collection-1',
        resolvedType: 'COLOR',
        valuesByMode: {
          'mode-1': {
            type: 'VARIABLE_ALIAS',
            id: 'var-alias-1',
          } as VariableAlias,
        },
        remote: false,
        description: '',
        hiddenFromPublishing: false,
        scopes: ['ALL_FILLS'],
        codeSyntax: {},
      };

      const responseWithChainedAlias: FileVariablesResponse = {
        ...mockResponse,
        meta: {
          ...mockResponse.meta,
          variables: {
            ...mockResponse.meta.variables,
            'var-alias-1': alias1,
            'var-alias-2': alias2,
          },
        },
      };

      vi.mocked(mockClient.getFileVariables).mockResolvedValue(responseWithChainedAlias);

      const result = await extractor.extract('test-file-key');

      const alias2Var = result.variables.find((v) => v.name === 'alias2');
      expect(alias2Var?.value).toBe('#336699'); // Resolved through chain
    });

    it('should detect circular alias references', async () => {
      const circular1: Variable = {
        id: 'var-circular-1',
        name: 'circular1',
        key: 'circular1-key',
        variableCollectionId: 'collection-1',
        resolvedType: 'COLOR',
        valuesByMode: {
          'mode-1': {
            type: 'VARIABLE_ALIAS',
            id: 'var-circular-2',
          } as VariableAlias,
        },
        remote: false,
        description: '',
        hiddenFromPublishing: false,
        scopes: ['ALL_FILLS'],
        codeSyntax: {},
      };

      const circular2: Variable = {
        id: 'var-circular-2',
        name: 'circular2',
        key: 'circular2-key',
        variableCollectionId: 'collection-1',
        resolvedType: 'COLOR',
        valuesByMode: {
          'mode-1': {
            type: 'VARIABLE_ALIAS',
            id: 'var-circular-1',
          } as VariableAlias,
        },
        remote: false,
        description: '',
        hiddenFromPublishing: false,
        scopes: ['ALL_FILLS'],
        codeSyntax: {},
      };

      const responseWithCircular: FileVariablesResponse = {
        ...mockResponse,
        meta: {
          ...mockResponse.meta,
          variables: {
            ...mockResponse.meta.variables,
            'var-circular-1': circular1,
            'var-circular-2': circular2,
          },
        },
      };

      vi.mocked(mockClient.getFileVariables).mockResolvedValue(responseWithCircular);

      const result = await extractor.extract('test-file-key');

      expect(result.warnings.some((w) => w.includes('Circular reference'))).toBe(true);
    });

    it('should preserve alias references when resolveAliases is false', async () => {
      const aliasVariable: Variable = {
        id: 'var-alias',
        name: 'primary/main',
        key: 'var-alias-key',
        variableCollectionId: 'collection-1',
        resolvedType: 'COLOR',
        valuesByMode: {
          'mode-1': {
            type: 'VARIABLE_ALIAS',
            id: 'var-1',
          } as VariableAlias,
        },
        remote: false,
        description: '',
        hiddenFromPublishing: false,
        scopes: ['ALL_FILLS'],
        codeSyntax: {},
      };

      const responseWithAlias: FileVariablesResponse = {
        ...mockResponse,
        meta: {
          ...mockResponse.meta,
          variables: {
            ...mockResponse.meta.variables,
            'var-alias': aliasVariable,
          },
        },
      };

      vi.mocked(mockClient.getFileVariables).mockResolvedValue(responseWithAlias);

      const result = await extractor.extract('test-file-key', {
        resolveAliases: false,
      });

      const aliasVar = result.variables.find((v) => v.name === 'primary/main');
      expect(aliasVar?.value).toContain('{');
    });
  });

  describe('rem conversion', () => {
    it('should convert FLOAT values to rem', async () => {
      const result = await extractor.extract('test-file-key', {
        types: ['FLOAT'],
        convertToRem: true,
        remBase: 16,
      });

      const sizeVar = result.variables.find((v) => v.name === 'typography/size/base');
      expect(sizeVar?.value).toBe('1.0000rem');
    });

    it('should use custom rem base', async () => {
      const result = await extractor.extract('test-file-key', {
        types: ['FLOAT'],
        convertToRem: true,
        remBase: 10,
      });

      const sizeVar = result.variables.find((v) => v.name === 'typography/size/base');
      expect(sizeVar?.value).toBe('1.6000rem');
    });

    it('should not convert FLOAT to rem by default', async () => {
      const result = await extractor.extract('test-file-key', {
        types: ['FLOAT'],
      });

      const sizeVar = result.variables.find((v) => v.name === 'typography/size/base');
      expect(sizeVar?.value).toBe(16);
    });
  });

  describe('caching', () => {
    it('should cache API responses', async () => {
      await extractor.extract('test-file-key');
      await extractor.extract('test-file-key');

      expect(mockClient.getFileVariables).toHaveBeenCalledTimes(1);
    });

    it('should clear cache', async () => {
      await extractor.extract('test-file-key');
      extractor.clearCache();
      await extractor.extract('test-file-key');

      expect(mockClient.getFileVariables).toHaveBeenCalledTimes(2);
    });
  });

  describe('edge cases', () => {
    it('should handle variables with no description', async () => {
      const result = await extractor.extract('test-file-key');

      const var2 = result.variables.find((v) => v.name === 'primary/blue/600');
      expect(var2?.description).toBe('');
    });

    it('should handle single depth variable names', async () => {
      const flatVariable: Variable = {
        id: 'var-flat',
        name: 'primary',
        key: 'var-flat-key',
        variableCollectionId: 'collection-1',
        resolvedType: 'COLOR',
        valuesByMode: {
          'mode-1': mockRGBA,
        },
        remote: false,
        description: '',
        hiddenFromPublishing: false,
        scopes: ['ALL_FILLS'],
        codeSyntax: {},
      };

      const responseWithFlat: FileVariablesResponse = {
        ...mockResponse,
        meta: {
          ...mockResponse.meta,
          variables: {
            'var-flat': flatVariable,
          },
        },
      };

      vi.mocked(mockClient.getFileVariables).mockResolvedValue(responseWithFlat);

      const result = await extractor.extract('test-file-key');

      expect(result.tokens.primary).toBeDefined();
      expect(result.tokens.primary?.value).toBe('#336699');
    });

    it('should handle multiple scopes', async () => {
      const result = await extractor.extract('test-file-key');

      const var1 = result.variables[0];
      expect(var1?.scopes).toContain('ALL_FILLS');
    });
  });
});
