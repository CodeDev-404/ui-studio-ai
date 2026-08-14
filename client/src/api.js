const API = "/api"

export async function fetchModels() {
  const r = await fetch(`${API}/models`)
  if (!r.ok) throw new Error("No se pudieron cargar los modelos")
  return r.json()
}

export async function generate({ prompt, model, gateway, width, onDelta, onDone, onError }) {
  const res = await fetch(`${API}/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, model, gateway, width }),
  })
  if (!res.ok) {
    const t = await res.text().catch(() => "")
    throw new Error(`Error ${res.status}: ${t.slice(0, 200)}`)
  }
  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ""
  let full = ""
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const parts = buffer.split("\n")
    buffer = parts.pop()
    for (const line of parts) {
      const t = line.trim()
      if (!t.startsWith("data:")) continue
      try {
        const msg = JSON.parse(t.slice(5).trim())
        if (msg.type === "delta") {
          full += msg.content
          onDelta?.(full)
        } else if (msg.type === "done") {
          onDone?.(msg)
        } else if (msg.type === "error") {
          onError?.(msg.message)
        }
      } catch { /* ignore */ }
    }
  }
  return full
}

export async function listDesigns() {
  const r = await fetch(`${API}/designs`)
  return r.json()
}

export async function getDesign(id) {
  const r = await fetch(`${API}/designs/${id}`)
  if (!r.ok) throw new Error("No encontrado")
  return r.json()
}

export async function saveDesign(id, patch) {
  const r = await fetch(`${API}/designs/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  })
  return r.json()
}

export async function deleteDesign(id) {
  await fetch(`${API}/designs/${id}`, { method: "DELETE" })
}
