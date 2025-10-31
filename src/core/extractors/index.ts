/**
 * Figma API Client exports
 */

export { FigmaAPIClient } from './figma-api';
export type { FigmaAPIClientConfig } from './figma-api';

export {
  FigmaAPIError,
  FigmaAuthError,
  FigmaRateLimitError,
  FigmaNotFoundError,
  FigmaInvalidUrlError,
} from './errors';

export type {
  // Common types
  RGBA,
  Vector2,
  Rectangle,
  Transform,
  // Paint & Effect types
  PaintType,
  BlendMode,
  ColorStop,
  Paint,
  ImageFilters,
  EffectType,
  Effect,
  // Typography types
  TypeStyle,
  // Variable types
  VariableResolvedType,
  VariableAlias,
  VariableValue,
  Variable,
  VariableScope,
  VariableCollection,
  VariableMode,
  // Style types
  StyleType,
  Style,
  PaintStyle,
  TextStyle,
  EffectStyle,
  // Node types
  NodeType,
  BaseNode,
  DocumentNode,
  CanvasNode,
  FrameNode,
  GroupNode,
  VectorNode,
  TextNode,
  ComponentNode,
  InstanceNode,
  Node,
  LayoutConstraint,
  ExportSetting,
  // API response types
  FigmaFile,
  Component,
  ComponentSet,
  DocumentationLink,
  FileVariablesResponse,
  FileNodesResponse,
  // URL parsing types
  ParsedFigmaUrl,
} from './types';

/**
 * Variables Extractor exports
 */
export { VariablesExtractor, createVariablesExtractor } from './variables-extractor';
export type {
  ExtractedVariable,
  TokenNode,
  VariablesExtractionResult,
  VariableExtractionOptions,
} from './variables-extractor';
