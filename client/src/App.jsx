import React, { useCallback, useEffect, useRef, useState } from "react"
import TopBar from "./components/TopBar.jsx"
import PromptPanel from "./components/PromptPanel.jsx"
import Canvas from "./components/Canvas.jsx"
import PropertiesPanel from "./components/PropertiesPanel.jsx"
import CodeEditor from "./components/CodeEditor.jsx"
import ShareDialog from "./components/ShareDialog.jsx"
import DesignsDialog from "./components/DesignsDialog.jsx"
import { fetchModels, generate, listDesigns, saveDesign, getDesign } from "./api.js"
import { useMediaQuery } from "./useMediaQuery.js"

export default function App() {
  const isMobile = useMediaQuery("(max-width: 768px)")
  const [models, setModels] = useState({})
  const [gateway, setGateway] = useState("opencode-go")
  const [model, setModel] = useState("")
  const [frameWidth, setFrameWidth] = useState("desktop")
  const [html, setHtml] = useState("")
  const [streaming, setStreaming] = useState("")
  const [busy, setBusy] = useState(false)
  const [designId, setDesignId] = useState(null)
  const [designTitle, setDesignTitle] = useState("Diseño sin título")
  const [selected, setSelected] = useState(null)
  const [messages, setMessages] = useState([])
  const [rightTab, setRightTab] = useState("propiedades")
  const [shareOpen, setShareOpen] = useState(false)
  const [designsOpen, setDesignsOpen] = useState(false)
  const [toast, setToast] = useState("")
  const [mobileView, setMobileView] = useState("canvas")
  const canvasRef = useRef(null)
  const toastTimer = useRef(null)

  useEffect(() => {
    fetchModels()
      .then((m) => {
        setModels(m)
        const go = m["opencode-go"]
        if (go?.models?.length) {
          const preferred = go.models.find((x) => x.includes("deepseek-v4-flash")) || go.models[0]
          setModel(preferred)
        }
      })
      .catch((e) => showToast(String(e.message || e)))
  }, [])

  useEffect(() => {
    if (isMobile && selected) setMobileView("edit")
  }, [isMobile, selected])

  const showToast = useCallback((msg) => {
    setToast(msg)
    clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(""), 3000)
  }, [])

  const handleGenerate = useCallback(async (prompt) => {
    if (busy || !prompt.trim() || !model) return
    setBusy(true)
    setStreaming("")
    setRightTab("propiedades")
    if (isMobile) setMobileView("canvas")
    setMessages((m) => [...m, { role: "user", content: prompt }])
    const userPrompt = prompt
    try {
      await generate({
        prompt: userPrompt,
        model,
        gateway,
        width: frameWidth,
        onDelta: (text) => {
          setStreaming(text)
          const el = document.getElementById("stream-html-preview")
        },
        onDone: (msg) => {
          setHtml(msg.html)
          setStreaming("")
          setDesignId(msg.design?.id ?? null)
          setDesignTitle(prompt.slice(0, 40))
          setMessages((m) => [
            ...m,
            {
              role: "assistant",
              content: "Diseño listo. Puedes seleccionar elementos en el canvas para editarlos.",
            },
          ])
          showToast("Diseño generado")
        },
        onError: (msg) => {
          setStreaming("")
          setMessages((m) => [...m, { role: "assistant", content: "Error: " + msg }])
          showToast("Error al generar")
        },
      })
    } catch (e) {
      setStreaming("")
      setMessages((m) => [...m, { role: "assistant", content: "Error: " + String(e.message || e) }])
    } finally {
      setBusy(false)
    }
  }, [busy, model, gateway, frameWidth, isMobile, showToast])

  const handleSave = useCallback(async () => {
    if (!designId) {
      showToast("Genera un diseño primero")
      return
    }
    const current = canvasRef.current?.getCurrentHtml?.() ?? html
    await saveDesign(designId, { title: designTitle, html: current })
    showToast("Diseño guardado")
  }, [designId, designTitle, html, showToast])

  const openDesign = useCallback(async (id) => {
    try {
      const d = await getDesign(id)
      setHtml(d.html)
      setStreaming("")
      setDesignId(d.id)
      setDesignTitle(d.title)
      setSelected(null)
      setDesignsOpen(false)
    } catch {
      showToast("No se pudo abrir el diseño")
    }
  }, [showToast])

  return (
    <div className="app">
      <TopBar
        title={designTitle}
        onTitleChange={setDesignTitle}
        onSave={handleSave}
        onShare={() => setShareOpen(true)}
        onDesigns={() => setDesignsOpen(true)}
        frameWidth={frameWidth}
        onFrameWidth={setFrameWidth}
        gateway={gateway}
        onGateway={setGateway}
        model={model}
        onModel={setModel}
        models={models}
        compact={isMobile}
      />
      <div className={`workspace ${isMobile ? "workspace-mobile" : ""}`}>
        <PromptPanel
          className={isMobile ? "mobile-sheet mobile-sheet-left" : ""}
          open={!isMobile || mobileView === "prompt"}
          onClose={() => setMobileView("canvas")}
          onGenerate={handleGenerate}
          busy={busy}
          messages={messages}
          streaming={streaming}
          onClear={() => setMessages([])}
        />
        <Canvas
          ref={canvasRef}
          html={html}
          streamText={streaming}
          frameWidth={frameWidth}
          isMobile={isMobile}
          selected={selected}
          onSelect={setSelected}
          onHtmlFromCanvas={(h) => {
            setHtml(h)
            setRightTab("codigo")
            showToast("Código sincronizado del canvas")
          }}
        />
        <div className={`right-panel ${isMobile ? "mobile-sheet mobile-sheet-right" : ""}`} data-open={!isMobile || mobileView === "edit"}>
          <div className="tab-bar">
            <button className={rightTab === "propiedades" ? "active" : ""} onClick={() => setRightTab("propiedades")}>
              Propiedades
            </button>
            <button className={rightTab === "codigo" ? "active" : ""} onClick={() => setRightTab("codigo")}>
              Código
            </button>
            {isMobile && (
              <button className="sheet-close" onClick={() => setMobileView("canvas")} title="Cerrar panel">✕</button>
            )}
          </div>
          {rightTab === "propiedades" ? (
            <PropertiesPanel
              selected={selected}
              canvasRef={canvasRef}
              onClearSelection={() => setSelected(null)}
            />
          ) : (
            <CodeEditor
              html={html}
              onApply={(h) => {
                setHtml(h)
                setSelected(null)
              }}
              onSyncFromCanvas={() => canvasRef.current?.syncFromCanvas()}
              dirty={selected !== null && html !== ""}
            />
          )}
        </div>
      </div>
      {isMobile && (
        <nav className="bottom-nav-mobile">
          <button className={mobileView === "prompt" ? "active" : ""} onClick={() => setMobileView("prompt")}>
            <span className="bn-icon">✨</span>
            <span>Prompt</span>
          </button>
          <button className={mobileView === "canvas" ? "active" : ""} onClick={() => setMobileView("canvas")}>
            <span className="bn-icon">🖼️</span>
            <span>Canvas</span>
          </button>
          <button className={mobileView === "edit" ? "active" : ""} onClick={() => setMobileView("edit")}>
            <span className="bn-icon">⚙️</span>
            <span>Editar</span>
          </button>
        </nav>
      )}
      {shareOpen && <ShareDialog id={designId} onClose={() => setShareOpen(false)} />}
      {designsOpen && <DesignsDialog onClose={() => setDesignsOpen(false)} onOpen={openDesign} />}
      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}
