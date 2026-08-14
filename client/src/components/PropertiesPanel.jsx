import React, { useEffect, useState } from "react"

function parsePx(v) {
  const n = parseFloat(v)
  return isNaN(n) ? 0 : n
}

function Field({ label, children }) {
  return (
    <label className="prop-field">
      <span>{label}</span>
      {children}
    </label>
  )
}

export default function PropertiesPanel({ selected, canvasRef, onClearSelection }) {
  const [text, setText] = useState("")
  const [bg, setBg] = useState("#ffffff")
  const [color, setColor] = useState("#000000")
  const [fontSize, setFontSize] = useState(16)
  const [fontWeight, setFontWeight] = useState("400")
  const [align, setAlign] = useState("left")
  const [padding, setPadding] = useState(0)
  const [radius, setRadius] = useState(0)

  useEffect(() => {
    if (!selected) return
    const s = selected.styles ?? {}
    setText(selected.text ?? "")
    setBg(s.backgroundColor ?? "#ffffff")
    setColor(s.color ?? "#000000")
    setFontSize(parsePx(s.fontSize) || 16)
    setFontWeight(s.fontWeight ?? "400")
    setAlign(s.textAlign ?? "left")
    setPadding(parsePx(s.padding))
    setRadius(parsePx(s.borderRadius))
  }, [selected])

  if (!selected) {
    return (
      <div className="props-empty">
        <div className="props-icon">👆</div>
        <p>Haz clic en un elemento del canvas para editar sus propiedades.</p>
      </div>
    )
  }

  const apply = (styles, newText) => {
    canvasRef.current?.applyStyles(selected.uid, styles)
    if (newText !== undefined) canvasRef.current?.setText(selected.uid, newText)
  }

  return (
    <div className="props-panel">
      <div className="props-header">
        <div>
          <strong className="tag-badge">{selected.tag}</strong>
          {selected.className && <span className="props-class">.{selected.className.split(" ")[0]}</span>}
        </div>
        <button
          className="btn danger small"
          onClick={() => {
            canvasRef.current?.removeElement(selected.uid)
            onClearSelection()
          }}
        >
          Eliminar
        </button>
      </div>

      <div className="props-section">
        <h4>Contenido</h4>
        <Field label="Texto">
          <input value={text} onChange={(e) => setText(e.target.value)} onBlur={() => apply(null, text)} />
        </Field>
      </div>

      <div className="props-section">
        <h4>Apariencia</h4>
        <div className="prop-grid">
          <Field label="Fondo">
            <input type="color" value={bg} onChange={(e) => { setBg(e.target.value); apply({ backgroundColor: e.target.value }) }} />
          </Field>
          <Field label="Texto">
            <input type="color" value={color} onChange={(e) => { setColor(e.target.value); apply({ color: e.target.value }) }} />
          </Field>
        </div>
        <div className="prop-grid">
          <Field label="Tamaño">
            <input type="number" value={fontSize} onChange={(e) => { setFontSize(+e.target.value); apply({ fontSize: e.target.value + "px" }) }} />
          </Field>
          <Field label="Peso">
            <select value={fontWeight} onChange={(e) => { setFontWeight(e.target.value); apply({ fontWeight: e.target.value }) }}>
              <option value="400">Normal</option>
              <option value="500">Medium</option>
              <option value="600">Semi-bold</option>
              <option value="700">Bold</option>
            </select>
          </Field>
        </div>
        <Field label="Alineación">
          <div className="align-row">
            {["left", "center", "right"].map((a) => (
              <button
                key={a}
                className={`icon-btn ${align === a ? "active" : ""}`}
                onClick={() => { setAlign(a); apply({ textAlign: a }) }}
                title={a}
              >
                {a === "left" ? "≡" : a === "center" ? "☰" : "≡"}
                <span className="align-pos">{a}</span>
              </button>
            ))}
          </div>
        </Field>
      </div>

      <div className="props-section">
        <h4>Espaciado</h4>
        <div className="prop-grid">
          <Field label="Padding">
            <input type="number" value={padding} onChange={(e) => { setPadding(+e.target.value); apply({ padding: e.target.value + "px" }) }} />
          </Field>
          <Field label="Radio">
            <input type="number" value={radius} onChange={(e) => { setRadius(+e.target.value); apply({ borderRadius: e.target.value + "px" }) }} />
          </Field>
        </div>
      </div>

      <div className="props-section">
        <h4>Elemento</h4>
        <pre className="snippet">{selected.htmlSnippet}</pre>
      </div>
    </div>
  )
}
