/**
 * UI Exemples Generator
 * 
 * This module generates Storybook stories from UI exemples YAML files.
 * It processes *.ui_examples.yml files and creates stories that render
 * the specified components with their props and slots.
 */

import { readFileSync } from 'fs'
import { parse as parseYaml } from 'yaml'
import { join, basename, dirname, extname } from 'path'
import { globSync } from 'glob'
import { logger } from './logger.ts'
import { Namespaces, resolveComponentPath } from './namespaces.ts'
import { convertToKebabCase } from './utils.ts'

export interface UIExempleComponent {
  type: 'component'
  component: string
  props?: Record<string, any>
  slots?: Record<string, any>
}

export interface UIExempleImage {
  type: 'image'
  uri: string
  alt?: string
  attributes?: Record<string, any>
}

export interface UIExempleRender {
  type: 'component' | 'image'
  component?: string
  props?: Record<string, any>
  slots?: Record<string, any>
  uri?: string
  alt?: string
  attributes?: Record<string, any>
}

export interface UIExempleSchema {
  id: string
  enabled: boolean
  label: string
  description?: string
  render: UIExempleRender[]
}

// Helper to read and validate UI Exemple YAML files
const readUIExemple = (filePath: string): UIExempleSchema => {
  try {
    const content = readFileSync(filePath, 'utf8')
    const uiExemple = parseYaml(content) as UIExempleSchema
    
    if (!uiExemple.id || !uiExemple.label) {
      throw new Error('UI Exemple must have id and label')
    }
    
    return uiExemple
  } catch (error) {
    logger.error(`Error reading UI Exemple file: ${filePath}, ${error}`)
    throw error
  }
}

// Generate import statements for components used in UI Exemples
const generateComponentImports = (
  render: UIExempleRender[],
  namespaces: Namespaces
): string => {
  const imports = new Set<string>()
  
  render.forEach((item) => {
    if (item.type === 'component') {
      const [namespace, componentName] = item.component.split(':')
      const kebabCaseName = convertToKebabCase(componentName)
      
      // Use namespace alias like the existing system
      imports.add(`import ${kebabCaseName} from '@${namespace}/${componentName}/${componentName}.component.yml';`)
    }
  })
  
  return Array.from(imports).join('\n')
}

// Generate the render function for UI Exemples
const generateRenderFunction = (
  render: UIExempleRender[],
  namespaces: Namespaces
): string => {
  const renderCalls = render.map((item) => {
    if (item.type === 'component') {
      const [namespace, componentName] = item.component.split(':')
      const kebabCaseName = convertToKebabCase(componentName)
      const props = item.props ? JSON.stringify(item.props, null, 2) : '{}'
      const slots = item.slots ? JSON.stringify(item.slots, null, 2) : '{}'
      
      // Use default args to get componentMetadata and merge with custom props/slots
      return `\${${kebabCaseName}.component({ ...${kebabCaseName}.args, ...${props}, ...${slots} })}`
    } else if (item.type === 'image') {
      const attributes = item.attributes ? JSON.stringify(item.attributes, null, 2) : '{}'
      const alt = item.alt || 'Image'
      return `<img src="${item.uri}" alt="${alt}" \${Object.entries(${attributes}).map(([key, value]) => \`\${key}="\${value}"\`).join(' ')} />`
    }
    return ''
  }).filter(Boolean)
  
  return `() => {
    return \`
      ${renderCalls.join('\n      ')}
    \`
  }`
}

// Generate the complete story content for UI Exemples
export const generateUIExempleStory = (
  filePath: string,
  namespaces: Namespaces
): string => {
  try {
    const uiExemple = readUIExemple(filePath)
    
    if (!uiExemple.enabled) {
      logger.info(`UI Exemple ${uiExemple.id} is disabled, skipping`)
      return ''
    }
    
    const componentImports = generateComponentImports(uiExemple.render, namespaces)
    const renderFunction = generateRenderFunction(uiExemple.render, namespaces)
    
    const storyTitle = `UI Examples/${uiExemple.label}`
    
    return `
${componentImports}

export default {
  title: '${storyTitle}',
  render: ${renderFunction},
  play: async ({ canvasElement }) => {
    Drupal.attachBehaviors(canvasElement, window.drupalSettings)
  },
}

export const ${uiExemple.label} = {}
`
  } catch (error) {
    logger.error(`Error generating UI Exemple story: ${filePath}, ${error}`)
    throw error
  }
}

// Find all UI Exemple files in a directory
export const findUIExempleFiles = (directory: string): string[] => {
  try {
    return globSync(join(directory, '*.ui_examples.yml'))
  } catch (error) {
    logger.error(`Error finding UI Exemple files in ${directory}: ${error}`)
    return []
  }
}
