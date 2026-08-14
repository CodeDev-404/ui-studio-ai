import React, { useEffect, useRef, useState } from "react"

const SUGGESTIONS = [
  "Landing page de una app de fitness, modo oscuro",
  "Dashboard de analíticas con gráficos para una fintech",
  "App móvil de e-commerce con carrito y checkout",
  "Login y registro de una app de streaming, tema púrpura",
  "Perfil de usuario tipo Instagram, móvil",
  "Panel de control de IoT con dispositivos y sensores",
]

export default function PromptPanel({ onGenerate, busy, messages, streaming, onClear, className, open, onClose }) {
  const [input, setInput] = useState("")
  const listRef = useRef(null)

  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight
  }, [messages, streaming])

  const send = () => {
    if (!input.trim() || busy) return
    onGenerate(input.trim())
    setInput("")
  }

  return (
    <aside className={`left-panel ${className || ""}`} data-open={open}>
      <div className="left-header">
        <span>Agente de diseño</span>
        <div className="left-header-actions">
          {onClose && (
            <button className="icon-btn sheet-close" title="Cerrar panel" onClick={onClose}>✕</button>
          )}
          <button className="icon-btn" title="Limpiar conversación" onClick={onClear}>✕</button>
        </div>
      </div>
      <div className="chat-list" ref={listRef}>
        {messages.length === 0 && !streaming && (
          <div className="empty-chat">
            <div className="empty-icon">🎨</div>
            <p>Describe la interfaz que quieres y la IA la diseñará para ti.</p>
            <div className="suggestions">
              {SUGGESTIONS.map((s) => (
                <button key={s} onClick={() => onGenerate(s)}>{s}</button>
              ))}
            </div>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`msg ${m.role}`}>
            <div className="msg-bubble">{m.content}</div>
          </div>
        ))}
        {streaming && (
          <div className="msg assistant">
            <div className="msg-bubble streaming">
              <div className="streaming-status">Generando diseño<span className="dots"><span>.</span><span>.</span><span>.</span></span></div>
              <pre className="stream-preview">{streaming.replace(/<[^>]+>/g, "").slice(0, 400)}</pre>
            </div>
          </div>
        )}
      </div>
      <div className="chat-input">
        <textarea
          placeholder="Ej: landing page de una app de fitness, modo oscuro…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault()
              send()
            }
          }}
          rows={3}
        />
        <button className="btn primary send-btn" onClick={send} disabled={busy}>
          {busy ? "Generando…" : "Generar ✨"}
        </button>
      </div>
    </aside>
  )
}
