/**
 * Vite Plugin for UI Exemples
 * 
 * This plugin processes *.ui_examples.yml files and generates Storybook stories.
 * It includes both a Vite plugin for processing files and an indexer for Storybook.
 */

import { readdirSync, readFileSync } from 'fs'
import { parse as parseYaml } from 'yaml'
import { join, basename, dirname, extname, relative, sep } from 'path'
import { globSync } from 'glob'
import { logger } from './logger.ts'

import type {
  Args,
  ArgTypes,
  Indexer,
  IndexInput,
} from 'storybook/internal/types'
import { generateUIExempleStory, findUIExempleFiles } from './uiExemplesGenerator.ts'
import { Namespaces } from './namespaces.ts'
import { capitalize, deriveGroupFromPath } from './utils.ts'
import { getProjectName } from './namespaces.ts'

// Vite plugin to process UI Exemple YAML files
export default ({
  namespaces = {} as Namespaces,
}) => ({
  name: 'vite-plugin-ui-exemples',
  async load(id: string) {
    if (!id.endsWith('.ui_examples.yml')) return

    try {
      logger.info(`Processing UI Exemple file: ${id}`)
      
      const storyContent = generateUIExempleStory(id, namespaces)
      
      if (!storyContent) {
        logger.info(`No story content generated for ${id}`)
        return ''
      }
      
      return storyContent
    } catch (error) {
      logger.error(`Error loading UI Exemple file: ${id}, ${error}`)
      throw error
    }
  },
})

// Indexer for UI Exemple YAML files
export const uiExemplesIndexer: Indexer = {
  test: /\.ui_examples\.yml$/,
  createIndex: async (fileName, { makeTitle }) => {
    try {
      const content = parseYaml(readFileSync(fileName, 'utf8')) as any
      
      if (!content.enabled) {
        logger.info(`UI Exemple ${content.id} is disabled, skipping index`)
        return []
      }
      
      // Use the story label with UI Examples group
      const baseTitle = makeTitle(
        `UI Examples/${capitalize(content.label)}`
      )
      
      const tags = ['ui-examples']
      
      return [{
        type: 'story' as const,
        importPath: fileName,
        exportName: capitalize(content.label), // Use the story name instead of "Basic"
        title: baseTitle,
        tags,
      }]
    } catch (error) {
      logger.error(`Error creating index for UI Exemple file: ${fileName}, ${error}`)
      throw error
    }
  },
}
