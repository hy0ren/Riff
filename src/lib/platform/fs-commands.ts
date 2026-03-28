import { invoke } from '@tauri-apps/api/core'

/**
 * Platform-agnostic filesystem commands.
 * On Tauri, these call real native commands.
 * On Web, these are no-ops or trigger local downloads where possible.
 */

export async function revealInFolder(path: string): Promise<void> {
  try {
    // In a real Tauri app, this would be a custom command in src-tauri/src/main.rs
    await invoke('reveal_path', { path })
    console.log('[Native] Revealed path in folder:', path)
  } catch (e) {
    console.warn('[Native] Failed to reveal path (OS/Tauri mismatch):', e)
  }
}

export async function openExportFolder(): Promise<void> {
  try {
    // Reveal the default app export directory
    await invoke('open_export_dir')
  } catch (e) {
    console.warn('[Native] Could not open export directory:', e)
  }
}

export interface ExportParams {
  projectId: string
  assetId: string
  filename: string
  format: 'wav' | 'mp3' | 'zip' | 'txt'
  contents?: string
  base64Data?: string
  mimeType?: string
}

export async function exportAssetToDisk(params: ExportParams): Promise<string> {
  console.log('[Native] Initiating disk export for:', params.filename)
  
  try {
    // This command should handle writing the actual binary data to the user's selected export folder.
    // For now, it returns a simulated "final path" to the user.
    const result = await invoke<string>('export_asset', { params })
    return result
  } catch (e) {
    console.error('[Native] Export failed:', e)

    let href = ''
    if (params.base64Data) {
      href = `data:${params.mimeType ?? 'application/octet-stream'};base64,${params.base64Data}`
    } else {
      const blob = new Blob([params.contents ?? ''], {
        type: params.mimeType ?? 'text/plain',
      })
      href = URL.createObjectURL(blob)
    }

    const link = document.createElement('a')
    link.href = href
    link.download = params.filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    if (href.startsWith('blob:')) {
      window.setTimeout(() => URL.revokeObjectURL(href), 0)
    }

    return params.filename
  }
}
