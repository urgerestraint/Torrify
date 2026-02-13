import fs from 'fs'
import path from 'path'
import { describe, expect, it } from 'vitest'
import { BUILD123D_SYSTEM_PROMPT, OPENSCAD_SYSTEM_PROMPT, getSystemPrompt, getSystemPromptBlocks } from '../prompts'

const fixturesDir = path.join(process.cwd(), 'src/services/llm/__tests__/fixtures')

const readFixture = (name: string): string => fs.readFileSync(path.join(fixturesDir, name), 'utf8')
const normalize = (value: string): string => value.replace(/\r\n/g, '\n').trimEnd()

describe('prompt/context golden formatting', () => {
  it('keeps OpenSCAD prompt composition stable for api context + current code', () => {
    const apiContext = readFixture('openscad.api.txt')
    const currentCode = readFixture('openscad.code.scad')
    const expectedApiSection = readFixture('openscad.expected.api-section.txt')
    const expectedDynamicBlock = readFixture('openscad.expected.dynamic.txt')

    const blocks = getSystemPromptBlocks('openscad', currentCode, apiContext)
    expect(blocks.staticBlocks[0]).toBe(OPENSCAD_SYSTEM_PROMPT)
    expect(normalize(blocks.staticBlocks[1])).toBe(normalize(expectedApiSection))
    expect(normalize(blocks.dynamicBlock ?? '')).toBe(normalize(expectedDynamicBlock))

    const expectedPrompt = OPENSCAD_SYSTEM_PROMPT + expectedApiSection + expectedDynamicBlock
    expect(normalize(getSystemPrompt('openscad', currentCode, apiContext))).toBe(normalize(expectedPrompt))
  })

  it('keeps build123d prompt composition stable for api context + current code', () => {
    const apiContext = readFixture('build123d.api.txt')
    const currentCode = readFixture('build123d.code.py')
    const expectedApiSection = readFixture('build123d.expected.api-section.txt')
    const expectedDynamicBlock = readFixture('build123d.expected.dynamic.txt')

    const blocks = getSystemPromptBlocks('build123d', currentCode, apiContext)
    expect(blocks.staticBlocks[0]).toBe(BUILD123D_SYSTEM_PROMPT)
    expect(normalize(blocks.staticBlocks[1])).toBe(normalize(expectedApiSection))
    expect(normalize(blocks.dynamicBlock ?? '')).toBe(normalize(expectedDynamicBlock))

    const expectedPrompt = BUILD123D_SYSTEM_PROMPT + expectedApiSection + expectedDynamicBlock
    expect(normalize(getSystemPrompt('build123d', currentCode, apiContext))).toBe(normalize(expectedPrompt))
  })
})
