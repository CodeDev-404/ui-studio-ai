import express from "express"
import { join, dirname } from "node:path"
import { fileURLToPath } from "node:url"
import { existsSync } from "node:fs"
import { GATEWAYS, generateStream, extractHtml, SYSTEM_PROMPT } from "./ai.js"
import { createDesign, getDesign, listDesigns, updateDesign, deleteDesign } from "./store.js"

const __dirname = dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT = process.env.PORT || 3456
const CLIENT_DIST = join(__dirname, "..", "client", "dist")

app.use(express.json({ limit: "20mb" }))
app.use(express.text({ limit: "20mb", type: "text/plain" }))

app.get("/api/models", async (_req, res) => {
  const out = {}
  for (const [id, gw] of Object.entries(GATEWAYS)) {
    try {
      const r = await fetch(`${gw.baseURL}/models`, {
        headers: { Authorization: `Bearer ${gw.key()}` },
      })
      const d = await r.json()
      out[id] = { label: gw.label, models: (d.data ?? []).map((m) => m.id) }
    } catch (e) {
      out[id] = { label: gw.label, models: [], error: String(e.message || e) }
    }
  }
  res.json(out)
})

app.post("/api/generate", async (req, res) => {
  const { prompt, model, gateway = "opencode-go", width = "desktop" } = req.body ?? {}
  if (!prompt || !model) {
    return res.status(400).json({ error: "Faltan prompt o model" })
  }

  res.setHeader("Content-Type", "text/event-stream")
  res.setHeader("Cache-Control", "no-cache")
  res.setHeader("Connection", "keep-alive")
  res.flushHeaders()

  const send = (obj) => res.write(`data: ${JSON.stringify(obj)}\n\n`)
  const history = [{ role: "system", content: SYSTEM_PROMPT }, { role: "user", content: prompt }]

  let full = ""
  try {
    for await (const chunk of generateStream({ prompt, model, gateway, width, history })) {
      full += chunk
      send({ type: "delta", content: chunk })
    }
    const html = extractHtml(full)
    const saved = createDesign({ html, title: prompt.slice(0, 60), prompt, model })
    send({ type: "done", design: { id: saved.id, title: saved.title }, html })
  } catch (e) {
    send({ type: "error", message: String(e.message || e) })
  }
  res.end()
})

app.get("/api/designs", (_req, res) => res.json(listDesigns()))

app.get("/api/designs/:id", (req, res) => {
  const d = getDesign(req.params.id)
  if (!d) return res.status(404).json({ error: "No encontrado" })
  res.json(d)
})

app.put("/api/designs/:id", (req, res) => {
  const { title, html, prompt } = req.body ?? {}
  const d = updateDesign(req.params.id, { title, html, prompt })
  if (!d) return res.status(404).json({ error: "No encontrado" })
  res.json(d)
})

app.delete("/api/designs/:id", (req, res) => {
  if (!deleteDesign(req.params.id)) return res.status(404).json({ error: "No encontrado" })
  res.json({ ok: true })
})

function cleanForPublish(html) {
  return html
    .replace(/<style>\*\[data-uid\][\s\S]*?<\/style>/g, "")
    .replace(/<div class="ui-hover-tag"[\s\S]*?<\/div>/g, "")
    .replace(/\sdata-uid="uid\d+"/g, "")
    .replace(/<script[^>]*>[\s\S]*?<\/script>\s*/g, "")
}

app.get("/p/:id/design", (req, res) => {
  const d = getDesign(req.params.id)
  if (!d) return res.status(404).send("Diseño no encontrado")
  res.setHeader("Content-Type", "text/html; charset=utf-8")
  res.send(cleanForPublish(d.html))
})

app.get("/p/:id", (req, res) => {
  const d = getDesign(req.params.id)
  if (!d) return res.status(404).send("Diseño no encontrado")
  res.setHeader("Content-Type", "text/html")
  res.send(`
<!DOCTYPE html><html><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${d.title.replace(/</g, "&lt;")}</title>
<style>
  html,body{margin:0;padding:0;background:#e5e7eb;font-family:system-ui,sans-serif}
  body{padding:24px}
  .publish-toolbar{max-width:1280px;margin:0 auto 12px;display:flex;justify-content:space-between;align-items:center;
    background:#fff;border:1px solid #d1d5db;border-radius:10px;padding:8px 14px;font-size:13px;color:#374151}
  .publish-toolbar a{color:#4f46e5;text-decoration:none;font-weight:600}
  .publish-toolbar a:hover{text-decoration:underline}
  .publish-frame{max-width:1280px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;
    box-shadow:0 4px 20px rgba(0,0,0,.08);min-height:80vh;padding:0}
  .publish-frame iframe{width:100%;height:82vh;border:0;display:block}
  @media (max-width:480px){body{padding:8px}.publish-toolbar{flex-direction:column;gap:6px}.publish-frame iframe{height:92vh}}
</style></head><body>
  <div class="publish-toolbar">
    <span>${d.title.replace(/</g, "&lt;")}</span>
    <a href="/">Crear otro diseño en UI Studio</a>
  </div>
  <div class="publish-frame"><iframe sandbox="allow-scripts" src="/p/${d.id}/design" loading="lazy"></iframe></div>
</body></html>`)
})

if (existsSync(CLIENT_DIST)) {
  app.use(express.static(CLIENT_DIST))
  app.get("*", (_req, res) => res.sendFile(join(CLIENT_DIST, "index.html")))
} else {
  app.get("/", (_req, res) =>
    res.send("Frontend no compilado. Ejecuta `npm run build` en client/ o `npm run dev` con Vite.")
  )
}

app.listen(PORT, "0.0.0.0", async () => {
  console.log(`UI Studio corriendo en http://localhost:${PORT}`)
  console.log(`(en la red local: http://${await getLanIP()}:${PORT})`)
})

async function getLanIP() {
  try {
    const { networkInterfaces } = await import("node:os")
    for (const list of Object.values(networkInterfaces())) {
      for (const i of list ?? []) {
        if (i.family === "IPv4" && !i.internal) return i.address
      }
    }
  } catch {}
  return "localhost"
}
