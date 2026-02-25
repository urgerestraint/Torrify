/// <reference lib="webworker" />

import { createOpenSCAD, type OpenSCADInstance } from 'openscad-wasm'

interface RenderRequest {
  readonly id: string
  readonly type: 'render'
  readonly code: string
}

interface RenderResponse {
  readonly id: string
  readonly success: boolean
  readonly stlBase64?: string
  readonly error?: string
}

let openscadPromise: Promise<OpenSCADInstance> | null = null

function toBase64(text: string): string {
  const bytes = new TextEncoder().encode(text)
  let binary = ''
  const chunkSize = 0x8000

  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    const chunk = bytes.subarray(offset, offset + chunkSize)
    binary += String.fromCharCode(...chunk)
  }

  return btoa(binary)
}

async function getOpenScad(): Promise<OpenSCADInstance> {
  if (!openscadPromise) {
    openscadPromise = createOpenSCAD({
      print: () => {
        // Keep worker quiet during normal operation.
      },
      printErr: () => {
        // Errors are surfaced by render failures.
      }
    })
  }
  return openscadPromise
}

function postResponse(response: RenderResponse): void {
  self.postMessage(response)
}

self.onmessage = async (event: MessageEvent<RenderRequest>) => {
  const request = event.data
  if (!request || request.type !== 'render') {
    return
  }

  if (!request.code?.trim()) {
    postResponse({
      id: request.id,
      success: false,
      error: 'No OpenSCAD code provided for rendering.'
    })
    return
  }

  try {
    const openscad = await getOpenScad()
    const stlText = await openscad.renderToStl(request.code)
    if (!stlText?.trim()) {
      postResponse({
        id: request.id,
        success: false,
        error: 'OpenSCAD rendered no STL output.'
      })
      return
    }

    postResponse({
      id: request.id,
      success: true,
      stlBase64: toBase64(stlText)
    })
  } catch (error) {
    postResponse({
      id: request.id,
      success: false,
      error: error instanceof Error ? error.message : 'OpenSCAD WASM render failed'
    })
  }
}

