export async function hashJsonPayload(value: unknown): Promise<string> {
  const text = JSON.stringify(value)
  const buffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
  return Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}
