export async function fetchPageTitle(url: string): Promise<string | null> {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 5000)

    const res = await fetch(url, { signal: controller.signal })
    clearTimeout(timeout)

    if (!res.ok) return null

    const contentType = res.headers.get('content-type') ?? ''
    if (!contentType.includes('text/html')) return null

    const reader = res.body?.getReader()
    if (!reader) return null

    const decoder = new TextDecoder()
    let html = ''
    const maxBytes = 100_000

    while (html.length < maxBytes) {
      const { done, value } = await reader.read()
      if (done) break
      html += decoder.decode(value, { stream: true })
      if (/<\/head>/i.test(html)) break
    }
    reader.cancel()

    const match = html.match(/<title[^>]*>([^<]*)<\/title>/i)
    if (!match) return null

    return decodeHtmlEntities(match[1].trim()) || null
  } catch {
    return null
  }
}

function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
}
