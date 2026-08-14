import { readFileSync, existsSync } from "node:fs"
import { join, dirname } from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const HOME = process.env.HOME || "/data/data/com.termux/files/home"

function loadAuth() {
  const candidates = [
    process.env.OPENCODE_AUTH_FILE,
    join(HOME, ".local/share/opencode/auth.json"),
    join(HOME, ".config/opencode/auth.json"),
  ]
  for (const p of candidates) {
    if (p && existsSync(p)) {
      try {
        return JSON.parse(readFileSync(p, "utf8"))
      } catch {
        /* sigue */
      }
    }
  }
  throw new Error("No se pudo leer auth.json de opencode")
}

let cachedAuth = null

export function getAuth() {
  if (!cachedAuth) cachedAuth = loadAuth()
  return cachedAuth
}

export const GATEWAYS = {
  opencode: {
    label: "OpenCode Zen",
    baseURL: "https://opencode.ai/zen/v1",
    key: () => getAuth().opencode?.key,
  },
  "opencode-go": {
    label: "OpenCode Go",
    baseURL: "https://opencode.ai/zen/go/v1",
    key: () => getAuth()["opencode-go"]?.key,
  },
}

export const SYSTEM_PROMPT = `Eres "UI Designer", un diseñador de interfaces experto estilo Figma.
Tu tarea: a partir del prompt del usuario, generar una página web AUTOCONTENIDA en un SOLO archivo HTML que implemente EXACTAMENTE el diseño pedido.

REGLAS OBLIGATORIAS:
1. Responde ÚNICAMENTE con el HTML completo. NADA más: sin explicaciones, sin markdown, sin fenced blocks. Solo el HTML.
2. El HTML debe ser autocontenido: CSS en <style> y JavaScript en <script>, sin recursos externos (ni Google Fonts, ni CDNs, ni imágenes externas). Usa fuentes del sistema y SVG inline o emojis.
3. El documento comienza con <!DOCTYPE html> y termina con </html>.
4. La página debe verse completa y pulida: tipografía coherente, espaciado, colores armónicos, responsive (usa flexbox/grid), sin scroll horizontal.
5. Si el usuario pide mobile/app, simula la pantalla centrada con bordes redondeados (como un frame de Figma de 390x844 aprox).
6. Usa contenido de ejemplo realista (textos, avatares con iniciales, iconos SVG) para que el diseño se vea profesional.
7. Prefiere diseño moderno (2024-2026): colores suaves, sombras sutiles, border-radius 12-16px, gradientes sutiles.
8. NO uses bloques de código markdown (nada de \`\`\`html). Escribe el HTML directamente, siempre completo, cerrando </html> al final, aunque el diseño sea largo.

Ejemplo de formato correcto:
<!DOCTYPE html><html><head><style>/* css */</style></head><body>...</body></html>`

const WIDTHS = { mobile: 390, tablet: 768, desktop: 1280 }

export async function* generateStream({ prompt, model, gateway = "opencode-go", width = "desktop", history = [] }) {
  const gw = GATEWAYS[gateway]
  if (!gw) throw new Error(`Gateway desconocido: ${gateway}`)
  const key = gw.key()
  if (!key) throw new Error(`No hay API key para el gateway ${gateway}`)

  const userPrompt = `${prompt}

Contexto técnico: genera el diseño para un frame de ancho ${WIDTHS[width] ?? 1280}px.`

  const messages = [
    ...history,
    { role: "user", content: userPrompt },
  ]

  const body = {
    model,
    messages,
    stream: true,
    max_tokens: 20000,
  }

  const res = await fetch(`${gw.baseURL}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => "")
    throw new Error(`API error ${res.status}: ${text.slice(0, 300)}`)
  }

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ""

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split("\n")
    buffer = lines.pop() ?? ""
    for (const line of lines) {
      const t = line.trim()
      if (!t.startsWith("data:")) continue
      const payload = t.slice(5).trim()
      if (payload === "[DONE]") return
      try {
        const json = JSON.parse(payload)
        const delta = json.choices?.[0]?.delta?.content ?? ""
        if (delta) yield delta
      } catch {
        /* fragmento incompleto */
      }
    }
  }
}

export function extractHtml(text) {
  let html = text.trim()
  const fenceOpen = html.indexOf("```")
  if (fenceOpen >= 0) {
    let after = html.slice(fenceOpen + 3).trimStart()
    if (after.startsWith("html")) after = after.slice(4).trimStart()
    else if (after.startsWith("xml")) after = after.slice(3).trimStart()
    const fenceClose = after.indexOf("```")
    html = (fenceClose >= 0 ? after.slice(0, fenceClose) : after).trim()
  }
  const start = html.indexOf("<!DOCTYPE")
  const start2 = html.indexOf("<html")
  const begin = start >= 0 ? start : start2 >= 0 ? start2 : 0
  const end = html.lastIndexOf("</html>")
  if (end > begin) html = html.slice(begin, end + 7)
  else if (begin > 0) html = html.slice(begin)
  return html
}
