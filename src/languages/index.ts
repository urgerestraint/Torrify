import type * as Monaco from 'monaco-editor'
import {
  languageConfiguration,
  monarchLanguage,
} from './openscad'

const LANGUAGE_ID = 'openscad'

let registered = false

/**
 * Registers the OpenSCAD language with Monaco.
 * Idempotent: calling multiple times only registers once.
 */
export function registerOpenSCADLanguage(monaco: typeof Monaco): void {
  if (registered) return
  registered = true

  monaco.languages.register({
    id: LANGUAGE_ID,
    extensions: ['.scad'],
    aliases: ['OpenSCAD', 'openscad', 'scad'],
  })

  monaco.languages.setMonarchTokensProvider(LANGUAGE_ID, monarchLanguage as unknown as Monaco.languages.IMonarchLanguage)
  monaco.languages.setLanguageConfiguration(LANGUAGE_ID, languageConfiguration as unknown as Monaco.languages.LanguageConfiguration)
}

export { languageConfiguration, monarchLanguage } from './openscad'
export { keywords, controlKeywords, builtins, constants, specialVariables, functions } from './openscad'
