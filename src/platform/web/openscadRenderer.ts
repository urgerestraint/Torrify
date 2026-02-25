interface WorkerRenderRequest {
  readonly id: string
  readonly type: 'render'
  readonly code: string
}

interface WorkerRenderResponse {
  readonly id: string
  readonly success: boolean
  readonly stlBase64?: string
  readonly error?: string
}

interface PendingRequest {
  readonly resolve: (result: WorkerRenderResponse) => void
  readonly reject: (error: Error) => void
  readonly timeoutId: number
}

export class OpenScadWasmRenderer {
  private worker: Worker | null = null
  private requestCounter = 0
  private readonly pending = new Map<string, PendingRequest>()

  private ensureWorker(): Worker {
    if (this.worker) {
      return this.worker
    }

    const worker = new Worker(new URL('./openscadWorker.ts', import.meta.url), { type: 'module' })
    worker.onmessage = (event: MessageEvent<WorkerRenderResponse>) => {
      const response = event.data
      const pending = this.pending.get(response.id)
      if (!pending) {
        return
      }

      window.clearTimeout(pending.timeoutId)
      this.pending.delete(response.id)
      pending.resolve(response)
    }
    worker.onerror = (event: ErrorEvent) => {
      const message = event.message || 'OpenSCAD worker crashed'
      this.rejectAll(new Error(message))
      this.terminate()
    }

    this.worker = worker
    return worker
  }

  private rejectAll(error: Error): void {
    for (const [id, pending] of this.pending.entries()) {
      window.clearTimeout(pending.timeoutId)
      pending.reject(error)
      this.pending.delete(id)
    }
  }

  terminate(): void {
    if (this.worker) {
      this.worker.terminate()
      this.worker = null
    }
    this.rejectAll(new Error('OpenSCAD worker terminated'))
  }

  async renderStl(code: string, timeoutMs: number): Promise<WorkerRenderResponse> {
    if (!code.trim()) {
      return {
        id: 'empty',
        success: false,
        error: 'No OpenSCAD code provided for rendering.'
      }
    }

    const worker = this.ensureWorker()
    const id = `web-render-${Date.now()}-${this.requestCounter++}`

    const response = await new Promise<WorkerRenderResponse>((resolve, reject) => {
      const timeoutId = window.setTimeout(() => {
        this.pending.delete(id)
        this.terminate()
        reject(new Error(`OpenSCAD WASM render timed out after ${Math.round(timeoutMs / 1000)}s`))
      }, timeoutMs)

      this.pending.set(id, { resolve, reject, timeoutId })

      const request: WorkerRenderRequest = {
        id,
        type: 'render',
        code
      }
      worker.postMessage(request)
    })

    return response
  }
}

