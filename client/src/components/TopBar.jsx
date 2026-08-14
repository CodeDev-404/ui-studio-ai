import React from "react"

const FRAMES = [
  { id: "mobile", label: "📱", title: "Móvil 390px" },
  { id: "tablet", label: "💻", title: "Tablet 768px" },
  { id: "desktop", label: "🖥️", title: "Escritorio 1280px" },
]

export default function TopBar({
  title, onTitleChange, onSave, onShare, onDesigns,
  frameWidth, onFrameWidth, gateway, onGateway, model, onModel, models, compact,
}) {
  const currentModels = models[gateway]?.models ?? []
  return (
    <header className={`topbar ${compact ? "topbar-compact" : ""}`}>
      <div className="brand">
        <div className="brand-logo">UI</div>
        <span className="brand-name">UI Studio</span>
      </div>
      <input
        className="title-input"
        value={title}
        onChange={(e) => onTitleChange(e.target.value)}
        onBlur={onSave}
        placeholder="Nombre del diseño"
      />
      <div className="toolbar">
        <div className="frame-switch" title="Tamaño del frame">
          {FRAMES.map((f) => (
            <button
              key={f.id}
              className={frameWidth === f.id ? "active" : ""}
              onClick={() => onFrameWidth(f.id)}
              title={f.title}
            >
              {f.label}
            </button>
          ))}
        </div>
        {!compact && (
          <>
            <select
              className="select"
              value={gateway}
              onChange={(e) => {
                const g = e.target.value
                onGateway(g)
                const ms = models[g]?.models ?? []
                const preferred = ms.find((x) => x.includes("deepseek")) || ms.find((x) => x.includes("flash")) || ms[0]
                if (preferred) onModel(preferred)
              }}
            >
              {Object.entries(models).map(([id, gw]) => (
                <option key={id} value={id}>{gw.label}</option>
              ))}
            </select>
            <select className="select model-select" value={model} onChange={(e) => onModel(e.target.value)}>
              {currentModels.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </>
        )}
        {compact ? (
          <div className="toolbar-actions">
            <button className="btn ghost icon-label" onClick={onDesigns} title="Diseños guardados">📁</button>
            <button className="btn ghost icon-label" onClick={onSave} title="Guardar">💾</button>
            <button className="btn primary icon-label" onClick={onShare} title="Compartir">🔗</button>
          </div>
        ) : (
          <>
            <button className="btn ghost" onClick={onDesigns}>Diseños</button>
            <button className="btn ghost" onClick={onSave}>Guardar</button>
            <button className="btn primary" onClick={onShare}>Compartir</button>
          </>
        )}
      </div>
    </header>
  )
}
