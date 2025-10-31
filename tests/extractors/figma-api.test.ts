/**
 * Unit tests for Figma API Client
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import axios from 'axios';
import { FigmaAPIClient } from '../../src/core/extractors/figma-api';
import {
  FigmaAPIError,
  FigmaAuthError,
  FigmaInvalidUrlError,
} from '../../src/core/extractors/errors';
import type {
  FigmaFile,
  FileVariablesResponse,
  FileNodesResponse,
} from '../../src/core/extractors/types';

// Mock axios
vi.mock('axios');
const mockedAxios = vi.mocked(axios, true);

describe('FigmaAPIClient', () => {
  let client: FigmaAPIClient;
  const testToken = 'test-figma-token-12345';
  const testFileKey = 'ABC123DEF456';

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock axios.create to return a mock instance
    const mockAxiosInstance = {
      get: vi.fn(),
      post: vi.fn(),
      interceptors: {
        request: { use: vi.fn() },
        response: { use: vi.fn() },
      },
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockedAxios.create.mockReturnValue(mockAxiosInstance as any);
    mockedAxios.isAxiosError = vi.fn().mockReturnValue(true);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Constructor', () => {
    it('should initialize with access token from config', () => {
      expect(() => {
        new FigmaAPIClient({ accessToken: testToken });
      }).not.toThrow();
    });

    it('should initialize with access token from environment variable', () => {
      process.env['FIGMA_ACCESS_TOKEN'] = testToken;
      expect(() => {
        new FigmaAPIClient();
      }).not.toThrow();
      delete process.env['FIGMA_ACCESS_TOKEN'];
    });

    it('should throw FigmaAuthError if no token is provided', () => {
      delete process.env['FIGMA_ACCESS_TOKEN'];
      expect(() => {
        new FigmaAPIClient();
      }).toThrow(FigmaAuthError);
    });

    it('should throw FigmaAuthError if token is empty string', () => {
      expect(() => {
        new FigmaAPIClient({ accessToken: '' });
      }).toThrow(FigmaAuthError);
    });

    it('should set custom baseUrl', () => {
      const customUrl = 'https://custom-api.figma.com';
      new FigmaAPIClient({
        accessToken: testToken,
        baseUrl: customUrl,
      });
      expect(mockedAxios.create).toHaveBeenCalledWith(
        expect.objectContaining({
          baseURL: customUrl,
        })
      );
    });

    it('should set default configuration values', () => {
      new FigmaAPIClient({ accessToken: testToken });
      expect(mockedAxios.create).toHaveBeenCalledWith(
        expect.objectContaining({
          baseURL: 'https://api.figma.com/v1',
          timeout: 30000,
          headers: {
            'X-Figma-Token': testToken,
          },
        })
      );
    });
  });

  describe('parseFigmaUrl', () => {
    beforeEach(() => {
      client = new FigmaAPIClient({ accessToken: testToken });
    });

    it('should parse file URL without node ID', () => {
      const url = 'https://www.figma.com/file/ABC123/my-design';
      const result = client.parseFigmaUrl(url);
      expect(result).toEqual({
        fileKey: 'ABC123',
        nodeId: undefined,
      });
    });

    it('should parse design URL without node ID', () => {
      const url = 'https://www.figma.com/design/ABC123/my-design';
      const result = client.parseFigmaUrl(url);
      expect(result).toEqual({
        fileKey: 'ABC123',
        nodeId: undefined,
      });
    });

    it('should parse file URL with node ID', () => {
      const url = 'https://www.figma.com/file/ABC123/my-design?node-id=1-2';
      const result = client.parseFigmaUrl(url);
      expect(result).toEqual({
        fileKey: 'ABC123',
        nodeId: '1:2',
      });
    });

    it('should parse file URL with node ID and other params', () => {
      const url = 'https://www.figma.com/file/ABC123/my-design?node-id=123-456&mode=dev';
      const result = client.parseFigmaUrl(url);
      expect(result).toEqual({
        fileKey: 'ABC123',
        nodeId: '123:456',
      });
    });

    it('should throw FigmaInvalidUrlError for invalid URL', () => {
      const url = 'not-a-valid-url';
      expect(() => client.parseFigmaUrl(url)).toThrow(FigmaInvalidUrlError);
    });

    it('should throw FigmaInvalidUrlError for non-Figma URL', () => {
      const url = 'https://www.example.com/something/else';
      expect(() => client.parseFigmaUrl(url)).toThrow(FigmaInvalidUrlError);
    });

    it('should throw FigmaInvalidUrlError for Figma URL without file key', () => {
      const url = 'https://www.figma.com/files';
      expect(() => client.parseFigmaUrl(url)).toThrow(FigmaInvalidUrlError);
    });
  });

  describe('getFile', () => {
    const mockFileResponse: FigmaFile = {
      document: {
        id: '0:0',
        name: 'Document',
        type: 'DOCUMENT',
        children: [],
      },
      components: {},
      componentSets: {},
      schemaVersion: 0,
      styles: {},
      name: 'Test File',
      lastModified: '2024-01-01T00:00:00Z',
      thumbnailUrl: 'https://example.com/thumb.png',
      version: '1',
      role: 'owner',
      editorType: 'figma',
      linkAccess: 'view',
    };

    beforeEach(() => {
      client = new FigmaAPIClient({ accessToken: testToken });
    });

    it('should fetch file successfully', async () => {
      const mockGet = vi.fn().mockResolvedValue({ data: mockFileResponse });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (mockedAxios.create as any).mockReturnValue({
        get: mockGet,
        interceptors: {
          request: { use: vi.fn() },
          response: { use: vi.fn((success) => success) },
        },
      });

      client = new FigmaAPIClient({ accessToken: testToken });
      const result = await client.getFile(testFileKey);

      expect(mockGet).toHaveBeenCalledWith(`/files/${testFileKey}`);
      expect(result).toEqual(mockFileResponse);
    });

    it('should return cached file on subsequent calls', async () => {
      const mockGet = vi.fn().mockResolvedValue({ data: mockFileResponse });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (mockedAxios.create as any).mockReturnValue({
        get: mockGet,
        interceptors: {
          request: { use: vi.fn() },
          response: { use: vi.fn((success) => success) },
        },
      });

      client = new FigmaAPIClient({ accessToken: testToken });

      // First call
      await client.getFile(testFileKey);
      expect(mockGet).toHaveBeenCalledTimes(1);

      // Second call should use cache
      await client.getFile(testFileKey);
      expect(mockGet).toHaveBeenCalledTimes(1);
    });

    it('should clear cache', async () => {
      const mockGet = vi.fn().mockResolvedValue({ data: mockFileResponse });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (mockedAxios.create as any).mockReturnValue({
        get: mockGet,
        interceptors: {
          request: { use: vi.fn() },
          response: { use: vi.fn((success) => success) },
        },
      });

      client = new FigmaAPIClient({ accessToken: testToken });

      // First call
      await client.getFile(testFileKey);
      expect(mockGet).toHaveBeenCalledTimes(1);

      // Clear cache
      client.clearCache();

      // Second call should not use cache
      await client.getFile(testFileKey);
      expect(mockGet).toHaveBeenCalledTimes(2);
    });
  });

  describe('getFileVariables', () => {
    const mockVariablesResponse: FileVariablesResponse = {
      status: 200,
      error: false,
      meta: {
        variables: {
          var1: {
            id: 'var1',
            name: 'Primary Color',
            key: 'primary-color',
            variableCollectionId: 'col1',
            resolvedType: 'COLOR',
            valuesByMode: {
              mode1: { r: 1, g: 0, b: 0, a: 1 },
            },
            remote: false,
            description: 'Main brand color',
            hiddenFromPublishing: false,
            scopes: ['ALL_FILLS'],
            codeSyntax: {},
          },
        },
        variableCollections: {
          col1: {
            id: 'col1',
            name: 'Colors',
            key: 'colors',
            modes: [{ modeId: 'mode1', name: 'Default' }],
            defaultModeId: 'mode1',
            remote: false,
            hiddenFromPublishing: false,
            variableIds: ['var1'],
          },
        },
      },
    };

    beforeEach(() => {
      client = new FigmaAPIClient({ accessToken: testToken });
    });

    it('should fetch variables successfully', async () => {
      const mockGet = vi.fn().mockResolvedValue({ data: mockVariablesResponse });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (mockedAxios.create as any).mockReturnValue({
        get: mockGet,
        interceptors: {
          request: { use: vi.fn() },
          response: { use: vi.fn((success) => success) },
        },
      });

      client = new FigmaAPIClient({ accessToken: testToken });
      const result = await client.getFileVariables(testFileKey);

      expect(mockGet).toHaveBeenCalledWith(`/files/${testFileKey}/variables/local`);
      expect(result).toEqual(mockVariablesResponse);
      expect(Object.keys(result.meta.variables)).toHaveLength(1);
    });
  });

  describe('getFileNodes', () => {
    const mockNodesResponse: FileNodesResponse = {
      name: 'Test File',
      lastModified: '2024-01-01T00:00:00Z',
      thumbnailUrl: 'https://example.com/thumb.png',
      version: '1',
      role: 'owner',
      editorType: 'figma',
      nodes: {
        '1:2': {
          document: {
            id: '1:2',
            name: 'Frame',
            type: 'FRAME',
            children: [],
            backgroundColor: { r: 1, g: 1, b: 1, a: 1 },
          },
        },
      },
    };

    beforeEach(() => {
      client = new FigmaAPIClient({ accessToken: testToken });
    });

    it('should fetch nodes successfully', async () => {
      const mockGet = vi.fn().mockResolvedValue({ data: mockNodesResponse });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (mockedAxios.create as any).mockReturnValue({
        get: mockGet,
        interceptors: {
          request: { use: vi.fn() },
          response: { use: vi.fn((success) => success) },
        },
      });

      client = new FigmaAPIClient({ accessToken: testToken });
      const result = await client.getFileNodes(testFileKey, ['1:2', '1:3']);

      expect(mockGet).toHaveBeenCalledWith(`/files/${testFileKey}/nodes`, {
        params: { ids: '1:2,1:3' },
      });
      expect(result).toEqual(mockNodesResponse);
    });

    it('should throw error if nodeIds array is empty', async () => {
      await expect(client.getFileNodes(testFileKey, [])).rejects.toThrow(FigmaAPIError);
    });
  });

  describe('getFileStyles', () => {
    const mockFileResponse: FigmaFile = {
      document: {
        id: '0:0',
        name: 'Document',
        type: 'DOCUMENT',
        children: [],
      },
      components: {},
      componentSets: {},
      schemaVersion: 0,
      styles: {
        style1: {
          key: 'style1',
          name: 'Primary',
          description: 'Primary fill style',
          styleType: 'FILL',
          remote: false,
        },
        style2: {
          key: 'style2',
          name: 'Heading',
          description: 'Heading text style',
          styleType: 'TEXT',
          remote: false,
        },
      },
      name: 'Test File',
      lastModified: '2024-01-01T00:00:00Z',
      thumbnailUrl: 'https://example.com/thumb.png',
      version: '1',
      role: 'owner',
      editorType: 'figma',
      linkAccess: 'view',
    };

    beforeEach(() => {
      client = new FigmaAPIClient({ accessToken: testToken });
    });

    it('should fetch styles successfully', async () => {
      const mockGet = vi.fn().mockResolvedValue({ data: mockFileResponse });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (mockedAxios.create as any).mockReturnValue({
        get: mockGet,
        interceptors: {
          request: { use: vi.fn() },
          response: { use: vi.fn((success) => success) },
        },
      });

      client = new FigmaAPIClient({ accessToken: testToken });
      const result = await client.getFileStyles(testFileKey);

      expect(mockGet).toHaveBeenCalledWith(`/files/${testFileKey}`);
      expect(result).toHaveLength(2);
      expect(result[0]?.name).toBe('Primary');
      expect(result[1]?.name).toBe('Heading');
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      client = new FigmaAPIClient({ accessToken: testToken });
    });

    it('should throw FigmaAuthError for 401 response', async () => {
      const mockError = {
        response: {
          status: 401,
          data: { err: 'Invalid token' },
        },
        config: { url: '/files/test' },
        isAxiosError: true,
      };

      const mockGet = vi.fn().mockRejectedValue(mockError);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (mockedAxios.create as any).mockReturnValue({
        get: mockGet,
        interceptors: {
          request: { use: vi.fn() },
          response: {
            use: vi.fn(() => Promise.reject(mockError)),
          },
        },
      });

      client = new FigmaAPIClient({ accessToken: testToken });

      await expect(client.getFile(testFileKey)).rejects.toThrow();
    });

    it('should throw FigmaNotFoundError for 404 response', async () => {
      const mockError = {
        response: {
          status: 404,
          data: { err: 'File not found' },
        },
        config: { url: '/files/test' },
        isAxiosError: true,
      };

      const mockGet = vi.fn().mockRejectedValue(mockError);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (mockedAxios.create as any).mockReturnValue({
        get: mockGet,
        interceptors: {
          request: { use: vi.fn() },
          response: {
            use: vi.fn(() => Promise.reject(mockError)),
          },
        },
      });

      client = new FigmaAPIClient({ accessToken: testToken });

      await expect(client.getFile(testFileKey)).rejects.toThrow();
    });
  });

  describe('Cache Management', () => {
    beforeEach(() => {
      client = new FigmaAPIClient({ accessToken: testToken });
    });

    it('should report cache statistics', () => {
      const stats = client.getCacheStats();
      expect(stats).toEqual({
        size: 0,
        keys: [],
      });
    });

    it('should clear cache', () => {
      client.clearCache();
      const stats = client.getCacheStats();
      expect(stats.size).toBe(0);
    });
  });
});
