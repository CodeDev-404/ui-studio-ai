# UI Studio — Diseña interfaces con IA (estilo Figma)

App web que genera diseños UI desde un prompt usando la API de opencode
(tus mismas claves/configuración, sin coste extra). Incluye vista previa en
tiempo real, canvas editable tipo Figma, editor de código y enlaces públicos
para compartir.

## Requisitos

- opencode instalado y con credenciales configuradas
  (`~/.local/share/opencode/auth.json` con los providers `opencode` y/o `opencode-go`)
- Node.js 20+

## Arrancar

```bash
cd ui-studio
./start.sh
```

Abre `http://localhost:3456` en el navegador.
(Si quieres verlo desde otro dispositivo en la misma red, usa la IP local:
`http://10.2.0.2:3456` — la imprime el servidor al arrancar.)

Para desarrollo del frontend:

```bash
cd client && npm install
npm run build     # compila a dist/ (lo sirve el servidor en :3456)
npm run dev       # Vite en :5173 con proxy al backend
```

## Cómo se usa

1. Escribe un prompt en el panel izquierdo (o usa una sugerencia).
   Ej: *"landing page de una app de fitness, modo oscuro"*.
2. La IA genera el HTML en streaming y lo ves renderizarse en el canvas.
   Puedes cambiar el frame: 📱 móvil (390px), 💻 tablet (768px), 🖥️ escritorio (1280px).
3. **Editar como en Figma**: haz clic en cualquier elemento del diseño.
   El panel derecho muestra sus propiedades (texto, colores, tamaño,
   padding, radio, peso, alineación) y puedes cambiarlas en vivo.
4. **Código**: pestaña "Código" para ver/editar el HTML generado.
   "← Del canvas" sincroniza los cambios visuales al código.
5. **Guardar**: los diseños se guardan automáticamente al generarse.
   "Diseños" los lista y permite reabrirlos o borrarlos.
6. **Compartir**: genera un enlace público (`/p/<id>`) que abre el diseño
   en otra ventana sin necesidad de la app.

## Estructura

```
ui-studio/
├── start.sh          # arranca el servidor (puerto 3456)
├── server/           # backend Node (Express)
│   ├── index.js      # API: /api/generate (SSE), /api/models, /api/designs, /p/:id
│   ├── ai.js         # cliente de la API de opencode (Zen y Go) + prompt del diseñador
│   ├── store.js      # persistencia de diseños en server/data/designs.json
│   └── data/         # diseños guardados (JSON)
└── client/           # frontend React + Vite
    └── src/
        ├── App.jsx               # layout y estado
        ├── agent.js              # agente inyectado en el iframe (selección/edición)
        └── components/           # TopBar, PromptPanel, Canvas, PropertiesPanel, ...
```

## Detalles técnicos

- **Responsive**: tres modos según pantalla —
  - escritorio (>1200px): layout completo de 3 columnas;
  - tablet (769–1200px): paneles laterales reducidos;
  - móvil (≤768px): canvas a pantalla completa con navegación inferior
    (Prompt / Canvas / Editar), paneles deslizables y auto-ajuste del frame
    para que cualquier tamaño (390/768/1280px) quepa en la pantalla.
- **Generación**: el backend llama a `https://opencode.ai/zen/v1` (OpenCode Zen)
  o `/zen/go/v1` (OpenCode Go) — API compatible con OpenAI, streaming SSE.
  Las claves se leen del `auth.json` de opencode, nunca llegan al navegador.
- **Modelos**: selector en la barra superior; lista dinámica por gateway
  (Claude, GPT, Gemini, DeepSeek, Kimi, GLM…).
- **Canvas editable**: se inyecta un pequeño agente JS en el iframe
  (`sandbox="allow-scripts"`) que detecta clics sobre elementos, reporta sus
  estilos al panel y aplica cambios vía `postMessage`.
- **Seguridad**: los enlaces públicos solo exponen el HTML del diseño, no
  claves ni la API.
