/**
 * Component Templates
 * Provides templates for generating React components with CVA
 */

import type { ComponentSpecification } from '../generators/component-analyzer';

export interface ComponentTemplate {
  imports: string;
  variants: string;
  types: string;
  component: string;
}

export interface TemplateContext {
  componentName: string;
  variantsName: string;
  variantsConfig: string;
  defaultVariants: string;
  baseClasses: string;
  propsInterface: string;
  baseElement: string;
  elementProps: string;
  hasForwardRef: boolean;
}

/**
 * Generate imports section
 */
export function generateImports(hasForwardRef: boolean): string {
  const imports: string[] = ["import { cva, type VariantProps } from 'class-variance-authority'"];

  if (hasForwardRef) {
    imports.push("import { forwardRef } from 'react'");
  }

  return imports.join('\n');
}

/**
 * Generate CVA variants configuration from component specification
 */
export function generateVariantsConfig(spec: ComponentSpecification): {
  config: string;
  defaults: string;
} {
  if (spec.variants.length === 0) {
    return {
      config: '{}',
      defaults: '{}',
    };
  }

  const variantConfig: Record<string, Record<string, string>> = {};
  const defaultVariants: Record<string, string> = {};

  for (const variant of spec.variants) {
    const variantObj = variantConfig[variant.name] || {};
    variantConfig[variant.name] = variantObj;

    for (const value of variant.values) {
      // Placeholder classes - will be customized with actual tokens
      variantObj[value] = `/* ${variant.name}-${value} classes */`;
    }

    // Set first value as default
    const firstValue = variant.values[0];
    if (firstValue !== undefined) {
      defaultVariants[variant.name] = firstValue;
    }
  }

  const config = JSON.stringify(variantConfig, null, 6)
    .replace(/"\/\*/g, "'")
    .replace(/\*\/"/g, "'");

  const defaults = JSON.stringify(defaultVariants, null, 6).replace(/"/g, "'");

  return { config, defaults };
}

/**
 * Generate TypeScript props interface
 */
export function generatePropsInterface(
  componentName: string,
  variantsName: string,
  baseElement: string
): string {
  const elementType = getElementType(baseElement);

  return `export interface ${componentName}Props
  extends ${elementType},
    VariantProps<typeof ${variantsName}> {}`;
}

/**
 * Get TypeScript element type for base element
 */
function getElementType(baseElement: string): string {
  const typeMap: Record<string, string> = {
    button: 'React.ButtonHTMLAttributes<HTMLButtonElement>',
    input: 'React.InputHTMLAttributes<HTMLInputElement>',
    div: 'React.HTMLAttributes<HTMLDivElement>',
    a: 'React.AnchorHTMLAttributes<HTMLAnchorElement>',
  };

  return typeMap[baseElement] || 'React.HTMLAttributes<HTMLElement>';
}

/**
 * Generate component with forwardRef
 */
export function generateComponentWithRef(context: TemplateContext): string {
  const { componentName, variantsName, propsInterface, baseElement } = context;

  const refType = getRefType(baseElement);
  const variantProps = context.variantsConfig !== '{}' ? 'variant, size, ' : '';

  return `export const ${componentName} = forwardRef<${refType}, ${propsInterface}>(
  ({ ${variantProps}className, ...props }, ref) => {
    return (
      <${baseElement}
        ref={ref}
        className={${variantsName}({ ${variantProps}className })}
        {...props}
      ></${baseElement}>
    )
  }
)

${componentName}.displayName = '${componentName}'`;
}

/**
 * Generate component without forwardRef
 */
export function generateComponentWithoutRef(context: TemplateContext): string {
  const { componentName, variantsName, propsInterface, baseElement } = context;

  const variantProps = context.variantsConfig !== '{}' ? 'variant, ' : '';

  return `export const ${componentName} = ({ ${variantProps}className, ...props }: ${propsInterface}) => {
  return (
    <${baseElement}
      className={${variantsName}({ ${variantProps}className })}
      {...props}
    ></${baseElement}>
  )
}`;
}

/**
 * Get TypeScript ref type for base element
 */
function getRefType(baseElement: string): string {
  const refMap: Record<string, string> = {
    button: 'HTMLButtonElement',
    input: 'HTMLInputElement',
    div: 'HTMLDivElement',
    a: 'HTMLAnchorElement',
  };

  return refMap[baseElement] || 'HTMLElement';
}

/**
 * Generate base classes for component
 */
export function generateBaseClasses(spec: ComponentSpecification): string {
  const classes: string[] = [];

  // Add common base classes based on component type
  switch (spec.type) {
    case 'button':
      classes.push(
        'inline-flex',
        'items-center',
        'justify-center',
        'rounded-md',
        'font-medium',
        'transition-colors',
        'focus-visible:outline-none',
        'disabled:pointer-events-none',
        'disabled:opacity-50'
      );
      break;
    case 'input':
      classes.push(
        'flex',
        'w-full',
        'rounded-md',
        'border',
        'border-input',
        'bg-background',
        'px-3',
        'py-2',
        'text-sm',
        'ring-offset-background',
        'focus-visible:outline-none',
        'focus-visible:ring-2',
        'disabled:cursor-not-allowed',
        'disabled:opacity-50'
      );
      break;
    case 'card':
      classes.push('rounded-lg', 'border', 'bg-card', 'text-card-foreground', 'shadow-sm');
      break;
    default:
      classes.push('inline-flex');
  }

  return classes.join(' ');
}

/**
 * Generate complete component template
 */
export function generateComponentTemplate(
  spec: ComponentSpecification,
  customBaseClasses?: string
): ComponentTemplate {
  const componentName = spec.name;
  const variantsName = `${componentName.toLowerCase()}Variants`;

  const { config, defaults } = generateVariantsConfig(spec);
  const baseClasses = customBaseClasses || generateBaseClasses(spec);
  const propsInterface = `${componentName}Props`;

  const context: TemplateContext = {
    componentName,
    variantsName,
    variantsConfig: config,
    defaultVariants: defaults,
    baseClasses,
    propsInterface,
    baseElement: spec.baseElement,
    elementProps: '',
    hasForwardRef: spec.hasForwardRef,
  };

  const imports = generateImports(spec.hasForwardRef);
  const variants = generateVariants(context);
  const types = generatePropsInterface(componentName, variantsName, spec.baseElement);
  const component = spec.hasForwardRef
    ? generateComponentWithRef(context)
    : generateComponentWithoutRef(context);

  return {
    imports,
    variants,
    types,
    component,
  };
}

/**
 * Generate CVA variants definition
 */
function generateVariants(context: TemplateContext): string {
  return `const ${context.variantsName} = cva(
  '${context.baseClasses}',
  {
    variants: ${context.variantsConfig},
    defaultVariants: ${context.defaultVariants}
  }
)`;
}

/**
 * Assemble full component file content
 */
export function assembleComponentFile(template: ComponentTemplate): string {
  const sections = [
    template.imports,
    '',
    template.variants,
    '',
    template.types,
    '',
    template.component,
  ];

  return sections.join('\n');
}

/**
 * Generate file header comment
 */
export function generateFileHeader(componentName: string, source: string): string {
  const timestamp = new Date().toISOString();

  return `/**
 * ${componentName} Component
 * Generated by figma-tokens-mcp
 * Source: ${source}
 * Generated at: ${timestamp}
 */`;
}

/**
 * Generate complete component file with header
 */
export function generateCompleteComponent(
  spec: ComponentSpecification,
  customBaseClasses?: string
): string {
  const header = generateFileHeader(
    spec.name,
    spec.metadata.source === 'figma' ? (spec.metadata.figmaUrl ?? 'template') : 'template'
  );

  const template = generateComponentTemplate(spec, customBaseClasses);
  const content = assembleComponentFile(template);

  return `${header}\n\n${content}\n`;
}
