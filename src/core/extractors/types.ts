/**
 * TypeScript types for Figma REST API responses
 * Based on Figma REST API spec: https://www.figma.com/developers/api
 */

// ============================================================================
// Common Types
// ============================================================================

/**
 * RGBA color value
 */
export interface RGBA {
  r: number; // 0-1
  g: number; // 0-1
  b: number; // 0-1
  a: number; // 0-1
}

/**
 * 2D Vector
 */
export interface Vector2 {
  x: number;
  y: number;
}

/**
 * Rectangle bounds
 */
export interface Rectangle {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Transform matrix (3x2)
 */
export type Transform = [[number, number, number], [number, number, number]];

// ============================================================================
// Paint & Effect Types
// ============================================================================

export type PaintType = 'SOLID' | 'GRADIENT_LINEAR' | 'GRADIENT_RADIAL' | 'GRADIENT_ANGULAR' | 'GRADIENT_DIAMOND' | 'IMAGE' | 'EMOJI';

export type BlendMode =
  | 'PASS_THROUGH'
  | 'NORMAL'
  | 'DARKEN'
  | 'MULTIPLY'
  | 'LINEAR_BURN'
  | 'COLOR_BURN'
  | 'LIGHTEN'
  | 'SCREEN'
  | 'LINEAR_DODGE'
  | 'COLOR_DODGE'
  | 'OVERLAY'
  | 'SOFT_LIGHT'
  | 'HARD_LIGHT'
  | 'DIFFERENCE'
  | 'EXCLUSION'
  | 'HUE'
  | 'SATURATION'
  | 'COLOR'
  | 'LUMINOSITY';

export interface ColorStop {
  position: number; // 0-1
  color: RGBA;
}

export interface Paint {
  type: PaintType;
  visible?: boolean;
  opacity?: number;
  color?: RGBA;
  blendMode?: BlendMode;
  gradientHandlePositions?: Vector2[];
  gradientStops?: ColorStop[];
  scaleMode?: 'FILL' | 'FIT' | 'TILE' | 'STRETCH';
  imageTransform?: Transform;
  scalingFactor?: number;
  imageRef?: string;
  filters?: ImageFilters;
}

export interface ImageFilters {
  exposure?: number;
  contrast?: number;
  saturation?: number;
  temperature?: number;
  tint?: number;
  highlights?: number;
  shadows?: number;
}

export type EffectType = 'INNER_SHADOW' | 'DROP_SHADOW' | 'LAYER_BLUR' | 'BACKGROUND_BLUR';

export interface Effect {
  type: EffectType;
  visible?: boolean;
  radius: number;
  color?: RGBA;
  blendMode?: BlendMode;
  offset?: Vector2;
  spread?: number;
  showShadowBehindNode?: boolean;
}

// ============================================================================
// Typography Types
// ============================================================================

export interface TypeStyle {
  fontFamily: string;
  fontPostScriptName?: string;
  fontWeight: number;
  fontSize: number;
  textAlignHorizontal: 'LEFT' | 'CENTER' | 'RIGHT' | 'JUSTIFIED';
  textAlignVertical: 'TOP' | 'CENTER' | 'BOTTOM';
  letterSpacing: number;
  lineHeightPx?: number;
  lineHeightPercent?: number;
  lineHeightPercentFontSize?: number;
  lineHeightUnit: 'PIXELS' | 'FONT_SIZE_%' | 'INTRINSIC_%';
  textCase?: 'ORIGINAL' | 'UPPER' | 'LOWER' | 'TITLE' | 'SMALL_CAPS' | 'SMALL_CAPS_FORCED';
  textDecoration?: 'NONE' | 'STRIKETHROUGH' | 'UNDERLINE';
}

// ============================================================================
// Variable Types
// ============================================================================

export type VariableResolvedType = 'BOOLEAN' | 'FLOAT' | 'STRING' | 'COLOR';

export interface VariableAlias {
  type: 'VARIABLE_ALIAS';
  id: string;
}

export type VariableValue = boolean | number | string | RGBA | VariableAlias;

export interface Variable {
  id: string;
  name: string;
  key: string;
  variableCollectionId: string;
  resolvedType: VariableResolvedType;
  valuesByMode: Record<string, VariableValue>;
  remote: boolean;
  description: string;
  hiddenFromPublishing: boolean;
  scopes: VariableScope[];
  codeSyntax: Record<string, string>;
}

export type VariableScope =
  | 'ALL_SCOPES'
  | 'TEXT_CONTENT'
  | 'CORNER_RADIUS'
  | 'WIDTH_HEIGHT'
  | 'GAP'
  | 'ALL_FILLS'
  | 'FRAME_FILL'
  | 'SHAPE_FILL'
  | 'TEXT_FILL'
  | 'STROKE_COLOR'
  | 'EFFECT_COLOR';

export interface VariableCollection {
  id: string;
  name: string;
  key: string;
  modes: VariableMode[];
  defaultModeId: string;
  remote: boolean;
  hiddenFromPublishing: boolean;
  variableIds: string[];
}

export interface VariableMode {
  modeId: string;
  name: string;
}

// ============================================================================
// Style Types
// ============================================================================

export type StyleType = 'FILL' | 'TEXT' | 'EFFECT' | 'GRID';

export interface Style {
  key: string;
  name: string;
  description: string;
  styleType: StyleType;
  remote: boolean;
}

export interface PaintStyle extends Style {
  styleType: 'FILL';
  paints: Paint[];
}

export interface TextStyle extends Style {
  styleType: 'TEXT';
  fontFamily: string;
  fontPostScriptName?: string;
  fontWeight: number;
  fontSize: number;
  textAlignHorizontal?: 'LEFT' | 'CENTER' | 'RIGHT' | 'JUSTIFIED';
  textAlignVertical?: 'TOP' | 'CENTER' | 'BOTTOM';
  letterSpacing?: number;
  lineHeightPx?: number;
  lineHeightPercent?: number;
  lineHeightPercentFontSize?: number;
  lineHeightUnit?: 'PIXELS' | 'FONT_SIZE_%' | 'INTRINSIC_%';
}

export interface EffectStyle extends Style {
  styleType: 'EFFECT';
  effects: Effect[];
}

// ============================================================================
// Node Types
// ============================================================================

export type NodeType =
  | 'DOCUMENT'
  | 'CANVAS'
  | 'FRAME'
  | 'GROUP'
  | 'VECTOR'
  | 'BOOLEAN_OPERATION'
  | 'STAR'
  | 'LINE'
  | 'ELLIPSE'
  | 'REGULAR_POLYGON'
  | 'RECTANGLE'
  | 'TEXT'
  | 'SLICE'
  | 'COMPONENT'
  | 'COMPONENT_SET'
  | 'INSTANCE';

export interface BaseNode {
  id: string;
  name: string;
  type: NodeType;
  visible?: boolean;
  pluginData?: Record<string, string>;
  sharedPluginData?: Record<string, Record<string, string>>;
}

export interface DocumentNode extends BaseNode {
  type: 'DOCUMENT';
  children: Node[];
}

export interface CanvasNode extends BaseNode {
  type: 'CANVAS';
  children: Node[];
  backgroundColor: RGBA;
  prototypeStartNodeID?: string | null;
  exportSettings?: ExportSetting[];
}

export interface FrameNode extends BaseNode {
  type: 'FRAME';
  children: Node[];
  backgroundColor: RGBA;
  absoluteBoundingBox?: Rectangle;
  absoluteRenderBounds?: Rectangle;
  constraints?: LayoutConstraint;
  clipsContent?: boolean;
  layoutMode?: 'NONE' | 'HORIZONTAL' | 'VERTICAL';
  primaryAxisSizingMode?: 'FIXED' | 'AUTO';
  counterAxisSizingMode?: 'FIXED' | 'AUTO';
  primaryAxisAlignItems?: 'MIN' | 'CENTER' | 'MAX' | 'SPACE_BETWEEN';
  counterAxisAlignItems?: 'MIN' | 'CENTER' | 'MAX' | 'BASELINE';
  paddingLeft?: number;
  paddingRight?: number;
  paddingTop?: number;
  paddingBottom?: number;
  itemSpacing?: number;
  fills?: Paint[];
  strokes?: Paint[];
  strokeWeight?: number;
  strokeAlign?: 'INSIDE' | 'OUTSIDE' | 'CENTER';
  cornerRadius?: number;
  rectangleCornerRadii?: [number, number, number, number];
  effects?: Effect[];
  blendMode?: BlendMode;
  opacity?: number;
  preserveRatio?: boolean;
  layoutGrow?: number;
  exportSettings?: ExportSetting[];
  styles?: Record<string, string>;
}

export interface GroupNode extends BaseNode {
  type: 'GROUP';
  children: Node[];
  absoluteBoundingBox?: Rectangle;
  absoluteRenderBounds?: Rectangle;
  blendMode?: BlendMode;
  opacity?: number;
  effects?: Effect[];
  exportSettings?: ExportSetting[];
}

export interface VectorNode extends BaseNode {
  type: 'VECTOR' | 'STAR' | 'LINE' | 'ELLIPSE' | 'REGULAR_POLYGON' | 'RECTANGLE';
  absoluteBoundingBox?: Rectangle;
  absoluteRenderBounds?: Rectangle;
  fills?: Paint[];
  strokes?: Paint[];
  strokeWeight?: number;
  strokeAlign?: 'INSIDE' | 'OUTSIDE' | 'CENTER';
  strokeCap?: 'NONE' | 'ROUND' | 'SQUARE' | 'LINE_ARROW' | 'TRIANGLE_ARROW';
  strokeJoin?: 'MITER' | 'BEVEL' | 'ROUND';
  cornerRadius?: number;
  rectangleCornerRadii?: [number, number, number, number];
  effects?: Effect[];
  blendMode?: BlendMode;
  opacity?: number;
  preserveRatio?: boolean;
  exportSettings?: ExportSetting[];
  styles?: Record<string, string>;
}

export interface TextNode extends BaseNode {
  type: 'TEXT';
  characters: string;
  style?: TypeStyle;
  characterStyleOverrides?: number[];
  styleOverrideTable?: Record<string, TypeStyle>;
  absoluteBoundingBox?: Rectangle;
  absoluteRenderBounds?: Rectangle;
  fills?: Paint[];
  strokes?: Paint[];
  strokeWeight?: number;
  effects?: Effect[];
  blendMode?: BlendMode;
  opacity?: number;
  exportSettings?: ExportSetting[];
  styles?: Record<string, string>;
}

export interface ComponentNode extends BaseNode {
  type: 'COMPONENT';
  children: Node[];
  backgroundColor?: RGBA;
  absoluteBoundingBox?: Rectangle;
  absoluteRenderBounds?: Rectangle;
  fills?: Paint[];
  strokes?: Paint[];
  effects?: Effect[];
  blendMode?: BlendMode;
  opacity?: number;
  exportSettings?: ExportSetting[];
  styles?: Record<string, string>;
}

export interface InstanceNode extends BaseNode {
  type: 'INSTANCE';
  children: Node[];
  componentId: string;
  absoluteBoundingBox?: Rectangle;
  absoluteRenderBounds?: Rectangle;
  fills?: Paint[];
  strokes?: Paint[];
  effects?: Effect[];
  blendMode?: BlendMode;
  opacity?: number;
  exportSettings?: ExportSetting[];
  styles?: Record<string, string>;
}

export type Node =
  | DocumentNode
  | CanvasNode
  | FrameNode
  | GroupNode
  | VectorNode
  | TextNode
  | ComponentNode
  | InstanceNode;

export interface LayoutConstraint {
  vertical: 'TOP' | 'BOTTOM' | 'CENTER' | 'TOP_BOTTOM' | 'SCALE';
  horizontal: 'LEFT' | 'RIGHT' | 'CENTER' | 'LEFT_RIGHT' | 'SCALE';
}

export interface ExportSetting {
  suffix: string;
  format: 'JPG' | 'PNG' | 'SVG' | 'PDF';
  constraint?: {
    type: 'SCALE' | 'WIDTH' | 'HEIGHT';
    value: number;
  };
}

// ============================================================================
// API Response Types
// ============================================================================

export interface FigmaFile {
  document: DocumentNode;
  components: Record<string, Component>;
  componentSets: Record<string, ComponentSet>;
  schemaVersion: number;
  styles: Record<string, Style>;
  name: string;
  lastModified: string;
  thumbnailUrl: string;
  version: string;
  role: string;
  editorType: string;
  linkAccess: string;
}

export interface Component {
  key: string;
  name: string;
  description: string;
  componentSetId?: string | null;
  documentationLinks?: DocumentationLink[];
}

export interface ComponentSet {
  key: string;
  name: string;
  description: string;
  documentationLinks?: DocumentationLink[];
}

export interface DocumentationLink {
  uri: string;
}

export interface FileVariablesResponse {
  status: number;
  error: boolean;
  meta: {
    variables: Record<string, Variable>;
    variableCollections: Record<string, VariableCollection>;
  };
}

export interface FileNodesResponse {
  name: string;
  lastModified: string;
  thumbnailUrl: string;
  version: string;
  role: string;
  editorType: string;
  nodes: Record<string, { document: Node } | { err: string }>;
}

// ============================================================================
// URL Parsing Types
// ============================================================================

export interface ParsedFigmaUrl {
  fileKey: string;
  nodeId?: string;
}
