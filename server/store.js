import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs"
import { join, dirname } from "node:path"
import { fileURLToPath } from "node:url"
import { randomBytes } from "node:crypto"

const __dirname = dirname(fileURLToPath(import.meta.url))
const DATA_DIR = join(__dirname, "data")
const DB_FILE = join(DATA_DIR, "designs.json")

function load() {
  if (!existsSync(DB_FILE)) return []
  try {
    return JSON.parse(readFileSync(DB_FILE, "utf8"))
  } catch {
    return []
  }
}

function save(designs) {
  mkdirSync(DATA_DIR, { recursive: true })
  writeFileSync(DB_FILE, JSON.stringify(designs, null, 2))
}

export function createDesign({ html, title, prompt, model }) {
  const designs = load()
  const design = {
    id: randomBytes(5).toString("hex"),
    title: title || "Diseño sin título",
    prompt: prompt || "",
    model: model || "",
    html,
    createdAt: Date.now(),
  }
  designs.unshift(design)
  save(designs)
  return design
}

export function getDesign(id) {
  return load().find((d) => d.id === id) ?? null
}

export function listDesigns() {
  return load().map((d) => ({
    id: d.id,
    title: d.title,
    prompt: d.prompt,
    model: d.model,
    createdAt: d.createdAt,
  }))
}

export function updateDesign(id, patch) {
  const designs = load()
  const idx = designs.findIndex((d) => d.id === id)
  if (idx === -1) return null
  designs[idx] = { ...designs[idx], ...patch }
  save(designs)
  return designs[idx]
}

export function deleteDesign(id) {
  const designs = load()
  const next = designs.filter((d) => d.id !== id)
  if (next.length === designs.length) return false
  save(next)
  return true
}
