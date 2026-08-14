import React, { useEffect, useState } from "react"

export default function ShareDialog({ id, onClose }) {
  const [url, setUrl] = useState("")

  useEffect(() => {
    if (id) {
      setUrl(`${window.location.origin}/p/${id}`)
    }
  }, [id])

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      alert("Enlace copiado al portapapeles")
    } catch {
      prompt("Copia el enlace:", url)
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>Compartir diseño</h3>
        {id ? (
          <>
            <p className="modal-hint">Este enlace abre el diseño en otra ventana, sin necesidad de la app:</p>
            <div className="url-row">
              <input readOnly value={url} onFocus={(e) => e.target.select()} />
              <button className="btn primary" onClick={copy}>Copiar</button>
            </div>
            <div className="modal-actions">
              <button className="btn ghost" onClick={() => { window.open(url, "_blank"); onClose() }}>
                Abrir en otra ventana ↗
              </button>
              <button className="btn ghost" onClick={onClose}>Cerrar</button>
            </div>
          </>
        ) : (
          <p className="modal-hint">Primero genera un diseño para poder compartirlo.</p>
        )}
      </div>
    </div>
  )
}
