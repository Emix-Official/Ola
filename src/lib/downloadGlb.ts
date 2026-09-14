import { validateGlb } from './raceSceneTools.ts'

export type DownloadProgress = { loaded: number; total: number | null }

export async function downloadGlb(
  url: URL,
  signal: AbortSignal,
  onProgress: (progress: DownloadProgress) => void,
) {
  const response = await fetch(url, { signal })
  if (!response.ok) throw new Error(`The scene request failed (${response.status}).`)
  if (response.headers.get('content-type')?.includes('text/html')) {
    throw new Error('The scene URL returned a webpage. Check the model filename.')
  }
  const length = Number(response.headers.get('content-length'))
  // An encoded response's Content-Length may describe compressed transport bytes.
  const total = length > 0 && !response.headers.get('content-encoding') ? length : null
  onProgress({ loaded: 0, total })
  let buffer: ArrayBuffer

  if (response.body) {
    const reader = response.body.getReader()
    const chunks: Uint8Array[] = []
    let loaded = 0
    try {
      while (true) {
        signal.throwIfAborted()
        const { done, value } = await reader.read()
        if (done) break
        chunks.push(value)
        loaded += value.byteLength
        onProgress({ loaded, total: total && loaded <= total ? total : null })
      }
      signal.throwIfAborted()
      const bytes = new Uint8Array(loaded)
      let offset = 0
      for (const chunk of chunks) {
        bytes.set(chunk, offset)
        offset += chunk.byteLength
      }
      buffer = bytes.buffer
    } finally {
      reader.releaseLock()
    }
  } else {
    buffer = await response.arrayBuffer()
    signal.throwIfAborted()
  }

  validateGlb(buffer)
  onProgress({ loaded: buffer.byteLength, total: buffer.byteLength })
  return buffer
}
