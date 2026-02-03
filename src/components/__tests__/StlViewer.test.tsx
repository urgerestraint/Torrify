import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, waitFor } from '@testing-library/react'
import React, { useEffect, useRef } from 'react'
import StlViewer, { type StlViewerHandle } from '../StlViewer'

// Mock Three.js
vi.mock('three', () => {
  // Create a proper DOM element for the canvas
  const mockCanvas = document.createElement('canvas')
  mockCanvas.toDataURL = vi.fn().mockReturnValue('data:image/png;base64,mockImage')
  
  return {
    Scene: vi.fn(() => ({
      background: null,
      add: vi.fn()
    })),
    PerspectiveCamera: vi.fn(() => ({
      position: { set: vi.fn() },
      aspect: 1,
      near: 0.1,
      far: 10000,
      updateProjectionMatrix: vi.fn()
    })),
    WebGLRenderer: vi.fn(() => ({
      setPixelRatio: vi.fn(),
      setSize: vi.fn(),
      render: vi.fn(),
      dispose: vi.fn(),
      domElement: mockCanvas
    })),
    Color: vi.fn((color) => color),
    AmbientLight: vi.fn(() => ({})),
    DirectionalLight: vi.fn(() => ({
      position: { set: vi.fn() }
    })),
    MeshStandardMaterial: vi.fn(() => ({
      dispose: vi.fn()
    })),
    Mesh: vi.fn(() => ({
      position: { sub: vi.fn() }
    })),
    Box3: vi.fn(() => ({
      setFromObject: vi.fn(() => ({
        getCenter: vi.fn(() => ({ x: 0, y: 0, z: 0 })),
        getSize: vi.fn(() => ({ x: 10, y: 10, z: 10 }))
      }))
    })),
    Vector3: vi.fn(() => ({ x: 0, y: 0, z: 0 }))
  }
})

vi.mock('three/examples/jsm/controls/OrbitControls', () => ({
  OrbitControls: vi.fn(() => ({
    enableDamping: true,
    dampingFactor: 0.1,
    target: { set: vi.fn() },
    update: vi.fn(),
    dispose: vi.fn()
  }))
}))

vi.mock('three/examples/jsm/loaders/STLLoader', () => ({
  STLLoader: vi.fn(() => ({
    parse: vi.fn(() => ({
      computeVertexNormals: vi.fn(),
      dispose: vi.fn()
    }))
  }))
}))

// Mock ResizeObserver
global.ResizeObserver = vi.fn(() => ({
  observe: vi.fn(),
  disconnect: vi.fn(),
  unobserve: vi.fn()
})) as unknown as typeof ResizeObserver

// Mock requestAnimationFrame
global.requestAnimationFrame = vi.fn((cb) => {
  setTimeout(cb, 16)
  return 1
})

global.cancelAnimationFrame = vi.fn()

// Mock window.atob
global.window.atob = vi.fn((str) => {
  return Buffer.from(str, 'base64').toString('binary')
})

describe('StlViewer', () => {
  const mockStlBase64 = 'dGVzdCBzdGwgZGF0YQ=='

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders container div', () => {
    const { container } = render(<StlViewer stlBase64={mockStlBase64} />)
    const viewerDiv = container.querySelector('.w-full.h-full')
    expect(viewerDiv).toBeInTheDocument()
  })

  it('exposes captureImage method via ref', async () => {
    let viewerRef: StlViewerHandle | null = null

    function TestWrapper() {
      const ref = useRef<StlViewerHandle>(null)
      useEffect(() => {
        viewerRef = ref.current
      })
      return <StlViewer ref={ref} stlBase64={mockStlBase64} />
    }

    render(<TestWrapper />)

    await waitFor(() => {
      expect(viewerRef).not.toBeNull()
    }, { timeout: 500 })
    const handle = viewerRef as StlViewerHandle | null
    if (handle?.captureImage) {
      const image = handle.captureImage()
      expect(image).toBeTruthy()
    }
  })

  it('returns image data from captureImage once renderer is ready', async () => {
    let ref: React.RefObject<StlViewerHandle | null> | null = null
    function Wrapper() {
      const r = useRef<StlViewerHandle>(null)
      ref = r
      return <StlViewer ref={r} stlBase64={mockStlBase64} />
    }
    render(<Wrapper />)
    await waitFor(() => {
      const image = ref?.current?.captureImage?.() ?? null
      expect(image).toBe('data:image/png;base64,mockImage')
    })
  })
})
