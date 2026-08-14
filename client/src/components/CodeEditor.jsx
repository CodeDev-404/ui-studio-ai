import React, { useEffect, useState } from "react"

export default function CodeEditor({ html, onApply, onSyncFromCanvas, dirty }) {
  const [code, setCode] = useState("")

  useEffect(() => {
    setCode(html)
  }, [html])

  return (
    <div className="code-panel">
      <div className="code-toolbar">
        <span className="code-hint">HTML + CSS autocontenido</span>
        <div className="code-actions">
          <button className="btn ghost small" onClick={onSyncFromCanvas}>← Del canvas</button>
          <button className="btn primary small" onClick={() => onApply(code)}>Aplicar</button>
        </div>
      </div>
      {dirty && <div className="code-warn">Los cambios del panel Propiedades aún no están en este código. Usa «Del canvas» para sincronizarlos.</div>}
      <textarea
        className="code-editor"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        spellCheck={false}
        placeholder="El código HTML del diseño aparecerá aquí…"
      />
    </div>
  )
}
