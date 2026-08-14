import React, { useEffect, useState } from "react"
import { listDesigns, deleteDesign } from "../api.js"

export default function DesignsDialog({ onClose, onOpen }) {
  const [designs, setDesigns] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    listDesigns()
      .then(setDesigns)
      .finally(() => setLoading(false))
  }, [])

  const remove = async (e, id) => {
    e.stopPropagation()
    await deleteDesign(id)
    setDesigns((d) => d.filter((x) => x.id !== id))
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal modal-wide" onClick={(e) => e.stopPropagation()}>
        <h3>Diseños guardados</h3>
        {loading ? (
          <p className="modal-hint">Cargando…</p>
        ) : designs.length === 0 ? (
          <p className="modal-hint">Aún no hay diseños guardados.</p>
        ) : (
          <ul className="design-list">
            {designs.map((d) => (
              <li key={d.id} onClick={() => onOpen(d.id)}>
                <div className="design-item-main">
                  <strong>{d.title}</strong>
                  <span className="design-prompt">{d.prompt}</span>
                  <span className="design-meta">
                    {d.model} · {new Date(d.createdAt).toLocaleString()}
                  </span>
                </div>
                <button className="icon-btn" title="Eliminar" onClick={(e) => remove(e, d.id)}>🗑</button>
              </li>
            ))}
          </ul>
        )}
        <div className="modal-actions">
          <button className="btn ghost" onClick={onClose}>Cerrar</button>
        </div>
      </div>
    </div>
  )
}
