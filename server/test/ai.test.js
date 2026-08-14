import { test } from "node:test"
import assert from "node:assert/strict"
import { extractHtml } from "../ai.js"

test("extrae el HTML de una respuesta con bloque markdown", () => {
  const text = "Aquí tienes tu diseño:\n```html\n<!DOCTYPE html><html><body><p>hola</p></body></html>\n```\nEspero que te guste."
  assert.equal(extractHtml(text), "<!DOCTYPE html><html><body><p>hola</p></body></html>")
})

test("extrae el HTML de una respuesta con bloque sin etiqueta de idioma", () => {
  const text = "```\n<!DOCTYPE html><html><body><p>ok</p></body></html>\n```"
  assert.equal(extractHtml(text), "<!DOCTYPE html><html><body><p>ok</p></body></html>")
})

test("extrae el HTML de una respuesta con bloque sin cierre", () => {
  const text = "```html\n<!DOCTYPE html><html><body><p>sin cierre</p>"
  assert.equal(extractHtml(text), "<!DOCTYPE html><html><body><p>sin cierre</p>")
})

test("devuelve el HTML tal cual cuando no hay bloque markdown", () => {
  const html = "<!DOCTYPE html><html><body><p>directo</p></body></html>"
  assert.equal(extractHtml(html), html)
})

test("maneja HTML sin DOCTYPE", () => {
  const text = "texto antes <html><body><p>sin doctype</p></body></html>"
  assert.equal(extractHtml(text), "<html><body><p>sin doctype</p></body></html>")
})

test("recorta texto suelto antes del documento", () => {
  const text = "A continuación el diseño:\n\n<!DOCTYPE html><html><head><title>X</title></head><body><h1>Hola</h1></body></html>"
  const out = extractHtml(text)
  assert.ok(out.startsWith("<!DOCTYPE html>"))
  assert.ok(out.endsWith("</html>"))
})

test("devuelve texto vacío para entrada vacía", () => {
  assert.equal(extractHtml(""), "")
})
