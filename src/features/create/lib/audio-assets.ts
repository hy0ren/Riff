import type { SourceInputNormalizedMetadata } from '@/domain/source-input'

function readBlobAsDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Failed to read audio input.'))
    reader.onload = () => {
      const result = reader.result
      if (typeof result !== 'string') {
        reject(new Error('Unable to serialize audio input.'))
        return
      }

      resolve(result)
    }
    reader.readAsDataURL(blob)
  })
}

export async function fileToDataUrl(file: File): Promise<string> {
  return readBlobAsDataUrl(file)
}

export async function blobToDataUrl(blob: Blob): Promise<string> {
  return readBlobAsDataUrl(blob)
}

export function measureAudioDuration(sourceUrl: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const audio = document.createElement('audio')
    audio.preload = 'metadata'

    const cleanup = () => {
      audio.removeAttribute('src')
      audio.load()
    }

    audio.onloadedmetadata = () => {
      const duration = Number.isFinite(audio.duration) ? audio.duration : 0
      cleanup()
      resolve(duration > 0 ? duration : 0)
    }

    audio.onerror = () => {
      cleanup()
      reject(new Error('Failed to inspect audio duration.'))
    }

    audio.src = sourceUrl
  })
}

export function inferAudioFileFormat(
  name?: string,
  mimeType?: string,
): SourceInputNormalizedMetadata['fileFormat'] {
  const normalizedMimeType = mimeType?.toLowerCase()
  if (normalizedMimeType?.includes('webm')) {
    return 'webm'
  }

  if (normalizedMimeType?.includes('ogg')) {
    return 'ogg'
  }

  if (normalizedMimeType?.includes('mpeg') || normalizedMimeType?.includes('mp3')) {
    return 'mp3'
  }

  const extension = name?.split('.').pop()?.toLowerCase()
  if (extension === 'webm') {
    return 'webm'
  }

  if (extension === 'ogg') {
    return 'ogg'
  }

  if (extension === 'mp3') {
    return 'mp3'
  }

  return 'wav'
}
