import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react"
import { SELECTOR_AGENT } from "../agent.js"

const FRAME_SIZES = { mobile: 390, tablet: 768, desktop: 1280 }

function withAgent(html) {
  if (!html) return ""
  const agent = `<script>${SELECTOR_AGENT}</script>`
  if (html.includes("</body>")) return html.replace("</body>", agent + "</body>")
  return html + agent
}

const Canvas = forwardRef(function Canvas({ html, streamText, frameWidth, isMobile, selected, onSelect, onHtmlFromCanvas }, ref) {
  const iframeRef = useRef(null)
  const scrollRef = useRef(null)
  const [zoomed, setZoomed] = useState(1)
  const [containerW, setContainerW] = useState(0)
  const [renderedHtml, setRenderedHtml] = useState("")
  const lastRenderAt = useRef(0)

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const ro = new ResizeObserver((entries) => {
      setContainerW(entries[0].contentRect.width)
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    if (html) {
      setRenderedHtml(html)
      return
    }
    if (!streamText) {
      setRenderedHtml("")
      return
    }
    const now = Date.now()
    if (now - lastRenderAt.current > 700) {
      lastRenderAt.current = now
      setRenderedHtml(streamText)
    }
  }, [html, streamText])

  useEffect(() => {
    const handler = (e) => {
      if (e.source !== iframeRef.current?.contentWindow) return
      let msg
      try { msg = JSON.parse(e.data) } catch { return }
      if (msg.type === "select") onSelect(msg.element)
      if (msg.type === "serialized") onHtmlFromCanvas(msg.html)
    }
    window.addEventListener("message", handler)
    return () => window.removeEventListener("message", handler)
  }, [onSelect, onHtmlFromCanvas])

  useImperativeHandle(ref, () => ({
    applyStyles(uid, styles) {
      iframeRef.current?.contentWindow?.postMessage(JSON.stringify({ type: "apply-styles", uid, styles }), "*")
    },
    setText(uid, text) {
      iframeRef.current?.contentWindow?.postMessage(JSON.stringify({ type: "set-text", uid, text }), "*")
    },
    removeElement(uid) {
      iframeRef.current?.contentWindow?.postMessage(JSON.stringify({ type: "remove-element", uid }), "*")
    },
    syncFromCanvas() {
      iframeRef.current?.contentWindow?.postMessage(JSON.stringify({ type: "serialize" }), "*")
    },
    getIframe() {
      return iframeRef.current
    },
  }))

  const width = FRAME_SIZES[frameWidth] ?? 1280
  const mobile = !!isMobile
  const autoFit = mobile && containerW > 0 ? Math.min(1, (containerW - 8) / width) : 1
  const scale = mobile ? autoFit : zoomed

  return (
    <main className="canvas-area">
      <div className="canvas-toolbar">
        <span className="canvas-info">
          Frame {width}px {frameWidth === "mobile" && "· móvil"}
          {mobile && autoFit < 1 && <span className="canvas-fit"> · ajustado {Math.round(autoFit * 100)}%</span>}
        </span>
        {!mobile && (
          <div className="zoom-controls">
            <button className="icon-btn" onClick={() => setZoomed((z) => Math.max(0.5, +(z - 0.1).toFixed(2)))}>−</button>
            <span>{Math.round(zoomed * 100)}%</span>
            <button className="icon-btn" onClick={() => setZoomed((z) => Math.min(2, +(z + 0.1).toFixed(2)))}>+</button>
          </div>
        )}
        {selected && (
          <button className="btn ghost small" onClick={() => onSelect(null)}>Deseleccionar</button>
        )}
      </div>
      <div className="canvas-scroll" ref={scrollRef}>
        <div className="canvas-center" style={{ zoom: scale }}>
          {renderedHtml ? (
            <div className={`frame ${mobile ? "frame-mobile" : ""}`} style={{ width: mobile ? width : Math.min(width, "100%") }}>
              <iframe
                ref={iframeRef}
                sandbox="allow-scripts"
                title="Vista previa del diseño"
                srcDoc={withAgent(renderedHtml)}
              />
            </div>
          ) : (
            <div className="canvas-empty">
              <div className="empty-logo">✦</div>
              <h2>Escribe un prompt para comenzar</h2>
              <p>La vista previa en vivo aparecerá aquí mientras la IA diseña tu interfaz.</p>
            </div>
          )}
        </div>
      </div>
    </main>
  )
})

export default Canvas
