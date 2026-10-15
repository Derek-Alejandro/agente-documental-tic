
/* =====================================================
   ARCHIVO TIC IA - PRACTICA 2.3
   Frontend corregido
   Google Drive + OpenAI + Comparador RAG
   ===================================================== */

// FastAPI sirve el frontend y la API desde localhost.
// No necesitamos importar api.js para iniciar la app.

const API_ROOT = "";

const $ = (id) => document.getElementById(id);

const state = {
  documents: [],
  messages: [],
  busy: false,
  syncing: false
};

// Compatible con las dos versiones anteriores del HTML.
const originalWelcome =
  $("empty-state")?.cloneNode(true) || null;


/* =====================================================
   CONEXION CON FASTAPI
   ===================================================== */

async function request(path, options = {}) {
  let response;

  try {
    response = await fetch(`${API_ROOT}${path}`, {
      cache: "no-store",
      ...options
    });
  } catch {
    throw new Error(
      "No se pudo conectar al servidor. Verifica que python app.py siga ejecutándose."
    );
  }

  const raw = await response.text();
  let data;

  try {
    data = JSON.parse(raw);
  } catch {
    throw new Error(
      `La ruta ${path} no devolvió JSON válido (HTTP ${response.status}).`
    );
  }

  if (!response.ok) {
    const detail =
      typeof data.detail === "string"
        ? data.detail
        : `Error HTTP ${response.status} en ${path}`;

    throw new Error(detail);
  }

  return data;
}

const api = {
  health: () => request("/api/health"),

  documents: () => request("/api/documents"),

  ask: (question, useSearch) =>
    request("/api/ask", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        question,
        use_search: useSearch
      })
    }),

  sync: () =>
    request("/api/sync", {
      method: "POST"
    })
};


/* =====================================================
   UTILIDADES
   ===================================================== */

function make(tag, className = "", text = "") {
  const node = document.createElement(tag);

  if (className) {
    node.className = className;
  }

  node.textContent = text;

  return node;
}

function notify(text, kind = "info") {
  const box = $("message");

  if (!box) return;

  box.textContent = text;
  box.className = `notification ${kind}`;
  box.hidden = false;
}

function clearNotice() {
  const box = $("message");

  if (!box) return;

  box.hidden = true;
  box.textContent = "";
}

function driveLink(source) {
  try {
    const url = new URL(source?.url);

    if (
      url.protocol === "https:" &&
      ["drive.google.com", "docs.google.com"].includes(
        url.hostname
      )
    ) {
      return url.href;
    }
  } catch {
    // Enlace ausente o inválido.
  }

  return null;
}

function documentType(doc) {
  const mime = doc?.mime_type || "";

  if (mime === "application/pdf") {
    return {
      code: "pdf",
      label: "PDF"
    };
  }

  if (
    mime === "application/vnd.google-apps.document"
  ) {
    return {
      code: "docs",
      label: "DOC"
    };
  }

  return {
    code: "txt",
    label: "TXT"
  };
}


/* =====================================================
   LISTADO DE GOOGLE DRIVE
   ===================================================== */

function renderDocuments() {
  const list = $("documents");

  if (!list) return;

  list.replaceChildren();

  const filter = (
    $("doc-search")?.value || ""
  ).trim().toLocaleLowerCase("es");

  const format = $("doc-type")?.value || "all";

  const shown = state.documents.filter((doc) => {
    const matchesName = String(
      doc.name || ""
    ).toLocaleLowerCase("es").includes(filter);

    const matchesFormat =
      format === "all" ||
      documentType(doc).code === format;

    return matchesName && matchesFormat;
  });

  if (!shown.length) {
    list.append(
      make(
        "div",
        "docs-placeholder",
        state.documents.length
          ? "No hay documentos que coincidan con los filtros."
          : "Todavía no hay documentos indexados. Utiliza Sincronizar Drive."
      )
    );

    return;
  }

  for (const doc of shown) {
    const type = documentType(doc);

    const item = make("div", "doc-item");

    const badge = make(
      "span",
      `doc-icon ${type.code}`,
      type.label
    );

    const content = make("div", "doc-main");

    const href = driveLink(doc);

    const name = make(
      href ? "a" : "span",
      "doc-link",
      doc.name || "Documento sin nombre"
    );

    if (href) {
      name.href = href;
      name.target = "_blank";
      name.rel = "noopener noreferrer";
    }

    const meta = make(
      "div",
      "doc-meta",
      `${type.label} · indexado`
    );

    content.append(name, meta);
    item.append(badge, content);
    list.append(item);
  }
}

async function loadDocuments(showMessage = false) {
  const button = $("refresh-docs");

  if (button) {
    button.disabled = true;
  }

  try {
    const result = await api.documents();

    state.documents = Array.isArray(
      result.documents
    )
      ? result.documents
      : [];

    const count = state.documents.length;

    $("doc-count").textContent = String(count);
    $("stat-documents").textContent = String(count);

    $("index-status").textContent =
      result.vector_store_configured
        ? `${count} archivos en el índice`
        : "Índice aún no creado";

    $("index-dot").className =
      result.vector_store_configured
        ? "status-indicator ready"
        : "status-indicator";

    renderDocuments();

    if (showMessage) {
      notify(
        "Listado documental actualizado.",
        "success"
      );
    }
  } catch (error) {
    $("index-status").textContent =
      "No se pudo cargar el inventario";

    $("index-dot").className =
      "status-indicator failed";

    $("documents").replaceChildren(
      make(
        "div",
        "docs-placeholder",
        error.message
      )
    );

    notify(error.message, "error");

    console.error(
      "Error en /api/documents:",
      error
    );
  } finally {
    if (button) {
      button.disabled = false;
    }
  }
}


/* =====================================================
   COMPROBAR ESTADO DEL SERVIDOR
   ===================================================== */

async function checkHealth() {
  try {
    const result = await api.health();

    $("health").className = result.configured
      ? "health-pill ready"
      : "health-pill failed";

    $("health-label").textContent =
      result.configured
        ? "Servidor configurado"
        : "Configuración pendiente";

  } catch (error) {
    $("health").className =
      "health-pill failed";

    $("health-label").textContent =
      "Sin conexión al servidor";

    notify(error.message, "error");

    console.error(
      "Error en /api/health:",
      error
    );
  }
}


/* =====================================================
   CONTROLES RAG
   ===================================================== */

function updateMode() {
  const enabled = $("use-search").checked;

  $("stat-mode").textContent = enabled
    ? "RAG activado"
    : "Sin RAG";

  $("mode-tag").textContent = enabled
    ? "● File Search activo"
    : "○ Sin File Search";

  $("mode-tag").classList.toggle(
    "off",
    !enabled
  );

  $("mode-note").textContent = enabled
    ? "Búsqueda documental habilitada"
    : "Sin acceso al índice documental";
}

function updateCounter() {
  $("char-count").textContent =
    `${$("question").value.length} / 3000`;
}

function getQuestion() {
  const text = $("question").value.trim();

  if (
    text.length < 3 ||
    text.length > 3000
  ) {
    notify(
      "La pregunta debe tener entre 3 y 3000 caracteres.",
      "error"
    );

    $("question").focus();

    return null;
  }

  return text;
}


/* =====================================================
   FUENTES DOCUMENTALES
   ===================================================== */

function sourcesBlock(sources, usedRag) {
  const box = make(
    "div",
    "sources-block"
  );

  box.append(
    make(
      "div",
      "sources-title",
      usedRag
        ? `Fuentes verificables: ${sources.length}`
        : "Fuentes documentales"
    )
  );

  const list = make(
    "div",
    "sources-list"
  );

  if (!usedRag || sources.length === 0) {
    list.append(
      make(
        "span",
        "source-text",
        usedRag
          ? "No se devolvieron citas verificables."
          : "File Search desactivado: no se consultó el índice."
      )
    );
  } else {
    for (const source of sources) {
      const href = driveLink(source);

      const chip = make(
        href ? "a" : "span",
        href ? "source-link" : "source-text",
        `↗ ${source.name || "Documento"}`
      );

      if (href) {
        chip.href = href;
        chip.target = "_blank";
        chip.rel = "noopener noreferrer";
      }

      list.append(chip);
    }
  }

  box.append(list);

  return box;
}


/* =====================================================
   COPIAR RESPUESTAS
   ===================================================== */

function copyButton(value) {
  const button = make(
    "button",
    "message-action",
    "⧉ Copiar respuesta"
  );

  button.type = "button";

  button.addEventListener(
    "click",
    async () => {
      try {
        await navigator.clipboard.writeText(
          value
        );

        button.textContent = "✓ Copiado";
      } catch {
        notify(
          "El navegador no permitió copiar. Selecciona el texto manualmente.",
          "error"
        );
      }
    }
  );

  return button;
}


/* =====================================================
   MENSAJES DEL CHAT
   ===================================================== */

function renderMessage(entry) {
  const isUser = entry.role === "user";

  const row = make(
    "article",
    `chat-message ${isUser ? "user" : "assistant"}`
  );

  row.append(
    make(
      "div",
      "message-avatar",
      isUser ? "TÚ" : "AI"
    )
  );

  const body = make(
    "div",
    "message-body"
  );

  body.append(
    make(
      "div",
      "message-name",
      isUser
        ? "TU PREGUNTA"
        : entry.withSearch
          ? "ARCHIVO TIC IA · RAG"
          : "ARCHIVO TIC IA · SIN RAG"
    )
  );

  body.append(
    make(
      "div",
      `message-bubble ${entry.error ? "error" : ""}`,
      entry.text
    )
  );

  if (
    !isUser &&
    !entry.error &&
    !entry.pending
  ) {
    body.append(
      sourcesBlock(
        entry.sources || [],
        Boolean(entry.withSearch)
      )
    );

    const tools = make(
      "div",
      "message-tools"
    );

    tools.append(
      copyButton(entry.text)
    );

    body.append(tools);
  }

  row.append(body);

  return row;
}


/* =====================================================
   COMPARADOR RAG VS SIN RAG
   ===================================================== */

function renderComparison(entry) {
  const wrapper = make(
    "section",
    "comparison-result"
  );

  wrapper.setAttribute(
    "aria-label",
    "Comparador con y sin RAG"
  );

  const head = make(
    "div",
    "comparison-heading"
  );

  head.append(
    make(
      "span",
      "message-avatar",
      "AI"
    )
  );

  const label = make("div");

  label.append(
    make(
      "strong",
      "",
      "Comparación con y sin RAG"
    )
  );

  label.append(
    make(
      "p",
      "",
      "Misma pregunta · Dos consultas independientes"
    )
  );

  head.append(label);
  wrapper.append(head);

  const grid = make(
    "div",
    "comparison-grid"
  );

  const options = [
    {
      label: "Sin File Search",
      description: "Sin consultar el índice",
      value: entry.plain,
      rag: false
    },
    {
      label: "Con File Search (RAG)",
      description: "Con documentos de Drive",
      value: entry.rag,
      rag: true
    }
  ];

  for (const option of options) {
    const card = make(
      "article",
      `comparison-card ${option.rag ? "rag" : "plain"}`
    );

    const top = make(
      "div",
      "comparison-card-header"
    );

    top.append(
      make(
        "strong",
        "",
        option.label
      )
    );

    top.append(
      make(
        "span",
        "",
        option.description
      )
    );

    const body = make(
      "div",
      "comparison-card-body"
    );

    body.append(
      make(
        "div",
        `comparison-answer ${option.value.error ? "error" : ""}`,
        option.value.text
      )
    );

    if (!option.value.error) {
      body.append(
        sourcesBlock(
          option.value.sources || [],
          option.rag
        )
      );

      body.append(
        copyButton(
          option.value.text
        )
      );
    }

    card.append(top, body);
    grid.append(card);
  }

  wrapper.append(grid);

  // Tabla comparativa solicitada por el profesor.

  const metrics = make(
    "div",
    "comparison-metrics"
  );

  const table = document.createElement(
    "table"
  );

  table.append(
    make(
      "caption",
      "",
      "Cuadro comparativo de la práctica"
    )
  );

  const thead = document.createElement(
    "thead"
  );

  const trHead = document.createElement(
    "tr"
  );

  for (const title of [
    "Criterio",
    "Sin RAG",
    "Con RAG"
  ]) {
    const th = make(
      "th",
      "",
      title
    );

    th.scope = "col";
    trHead.append(th);
  }

  thead.append(trHead);
  table.append(thead);

  const tbody = document.createElement(
    "tbody"
  );

  const rows = [
    [
      "Uso del índice",
      "No",
      entry.rag.error
        ? "Error en consulta"
        : "Habilitado"
    ],
    [
      "Fuentes documentales",
      "Sin búsqueda",
      entry.rag.error
        ? "No disponibles"
        : `${(entry.rag.sources || []).length} citas`
    ],
    [
      "Precisión",
      "Revisión manual",
      "Revisión manual"
    ]
  ];

  for (const cells of rows) {
    const tr = document.createElement(
      "tr"
    );

    cells.forEach((value, i) => {
      const cell = make(
        i === 0 ? "th" : "td",
        "",
        value
      );

      if (i === 0) {
        cell.scope = "row";
      }

      tr.append(cell);
    });

    tbody.append(tr);
  }

  table.append(tbody);
  metrics.append(table);
  wrapper.append(metrics);

  wrapper.append(
    make(
      "p",
      "comparison-note",
      "RAG puede mejorar la evidencia, pero no garantiza precisión. Verifica las fuentes originales."
    )
  );

  return wrapper;
}


/* =====================================================
   PANTALLA DE BIENVENIDA
   ===================================================== */

function renderWelcome(conversation) {
  const template = $("empty-state-template");

  if (
    template?.content?.childElementCount
  ) {
    conversation.append(
      template.content.cloneNode(true)
    );
  } else if (originalWelcome) {
    conversation.append(
      originalWelcome.cloneNode(true)
    );
  } else {
    // Respaldo para evitar que se detenga la app.

    const fallback = make(
      "div",
      "empty-state"
    );

    fallback.append(
      make(
        "div",
        "empty-orb",
        "✦"
      )
    );

    fallback.append(
      make(
        "h3",
        "",
        "¿Qué quieres investigar hoy?"
      )
    );

    fallback.append(
      make(
        "p",
        "",
        "Pregunta sobre tus documentos de Google Drive."
      )
    );

    conversation.append(fallback);
  }

  // Activar botones de preguntas sugeridas.

  conversation
    .querySelectorAll("[data-prompt]")
    .forEach((button) => {
      button.addEventListener(
        "click",
        () => {
          $("question").value =
            button.dataset.prompt || "";

          updateCounter();
          $("question").focus();
        }
      );
    });
}


/* =====================================================
   ACTUALIZAR CONVERSACION
   ===================================================== */

function renderConversation(pending = null) {
  const area = $("conversation");

  area.replaceChildren();

  if (
    !state.messages.length &&
    !pending
  ) {
    renderWelcome(area);
  }

  for (const entry of state.messages) {
    area.append(
      entry.role === "comparison"
        ? renderComparison(entry)
        : renderMessage(entry)
    );
  }

  if (pending) {
    area.append(
      renderMessage({
        role: "assistant",
        pending: true,
        withSearch: pending.withSearch,
        text: pending.comparison
          ? "Consultando con y sin File Search..."
          : "Preparando la respuesta..."
      })
    );
  }

  $("stat-queries").textContent = String(
    state.messages.filter(
      (item) => item.role === "user"
    ).length
  );

  $("export-chat").disabled =
    state.messages.length === 0;

  area.scrollTop = area.scrollHeight;
}


/* =====================================================
   CONTROLES DE CONSULTA
   ===================================================== */

function setBusy(value) {
  state.busy = value;

  [
    "ask",
    "compare",
    "question",
    "new-chat",
    "use-search"
  ].forEach((id) => {
    if ($(id)) {
      $(id).disabled = value;
    }
  });
}

function clearInput() {
  $("question").value = "";

  updateCounter();
  clearNotice();
}


/* =====================================================
   CONSULTA NORMAL A OPENAI
   ===================================================== */

async function ask() {
  if (state.busy) return;

  const question = getQuestion();

  if (!question) return;

  const withSearch =
    $("use-search").checked;

  state.messages.push({
    role: "user",
    text: question
  });

  clearInput();
  setBusy(true);

  renderConversation({
    withSearch
  });

  try {
    const data = await api.ask(
      question,
      withSearch
    );

    state.messages.push({
      role: "assistant",
      withSearch,
      text: data.answer ||
        "La API devolvió una respuesta vacía.",
      sources: Array.isArray(data.sources)
        ? data.sources
        : []
    });

    renderConversation();

  } catch (error) {
    state.messages.push({
      role: "assistant",
      withSearch,
      error: true,
      text: error.message
    });

    renderConversation();

    notify(
      error.message,
      "error"
    );
  } finally {
    setBusy(false);
    $("question").focus();
  }
}


/* =====================================================
   COMPARACION AUTOMATICA RAG
   ===================================================== */

async function compareRag() {
  if (state.busy) return;

  const question = getQuestion();

  if (!question) return;

  state.messages.push({
    role: "user",
    text: question
  });

  clearInput();
  setBusy(true);

  renderConversation({
    withSearch: true,
    comparison: true
  });

  try {
    const results = await Promise.allSettled([
      api.ask(question, false),
      api.ask(question, true)
    ]);

    const normalize = (result) => {
      if (result.status === "fulfilled") {
        return {
          error: false,
          text: result.value.answer ||
            "Respuesta vacía.",
          sources: Array.isArray(
            result.value.sources
          )
            ? result.value.sources
            : []
        };
      }

      return {
        error: true,
        text: result.reason?.message ||
          "No se completó.",
        sources: []
      };
    };

    const [plain, rag] =
      results.map(normalize);

    state.messages.push({
      role: "comparison",
      plain,
      rag
    });

    renderConversation();

    notify(
      plain.error || rag.error
        ? "La comparación terminó con errores. Revisa cada respuesta."
        : "Comparación terminada correctamente.",
      plain.error || rag.error
        ? "error"
        : "success"
    );

  } catch (error) {
    state.messages.push({
      role: "assistant",
      withSearch: true,
      text: error.message,
      error: true
    });

    renderConversation();

    notify(
      error.message,
      "error"
    );
  } finally {
    setBusy(false);
    $("question").focus();
  }
}


/* =====================================================
   SINCRONIZAR GOOGLE DRIVE
   ===================================================== */

async function sync() {
  if (state.syncing) return;

  if (
    !window.confirm(
      "¿Sincronizar tus documentos autorizados de Google Drive?"
    )
  ) {
    return;
  }

  state.syncing = true;

  $("sync").disabled = true;
  $("sync-label").textContent =
    "Sincronizando...";

  notify(
    "Conectando con Drive e indexando archivos. Puede tardar unos minutos."
  );

  try {
    const result = await api.sync();

    await loadDocuments();

    const stats = result.stats || {};

    const nErrors = Array.isArray(
      stats.errors
    )
      ? stats.errors.length
      : 0;

    notify(
      `Sincronización: ${stats.added || 0} nuevos, ` +
      `${stats.updated || 0} actualizados, ` +
      `${stats.removed || 0} eliminados, ` +
      `${stats.unchanged || 0} sin cambios, ` +
      `${nErrors} errores.`,
      nErrors
        ? "error"
        : "success"
    );

    if (nErrors) {
      console.warn(
        "Errores de sincronización:",
        stats.errors
      );
    }

  } catch (error) {
    notify(
      error.message,
      "error"
    );

  } finally {
    state.syncing = false;

    $("sync").disabled = false;

    $("sync-label").textContent =
      "Sincronizar Drive";
  }
}


/* =====================================================
   EXPORTAR CONVERSACION A TXT
   ===================================================== */

function exportChat() {
  if (!state.messages.length) return;

  const lines = [
    "ARCHIVO TIC IA - CONVERSACIÓN",
    new Date().toLocaleString("es-MX"),
    ""
  ];

  function addAnswer(
    label,
    result,
    withSearch
  ) {
    lines.push(
      label,
      result.text,
      ""
    );

    if (withSearch) {
      lines.push("Fuentes:");

      const sources =
        result.sources || [];

      if (!sources.length) {
        lines.push(
          "Sin citas verificables."
        );
      } else {
        sources.forEach((source) => {
          const link = driveLink(source);

          lines.push(
            `- ${source.name || "Documento"}${link ? `: ${link}` : ""}`
          );
        });
      }

      lines.push("");
    }
  }

  for (const entry of state.messages) {
    if (entry.role === "user") {
      lines.push(
        "PREGUNTA:",
        entry.text,
        ""
      );

    } else if (entry.role === "comparison") {
      addAnswer(
        "SIN RAG:",
        entry.plain,
        false
      );

      addAnswer(
        "CON RAG:",
        entry.rag,
        true
      );

    } else {
      addAnswer(
        entry.withSearch
          ? "RESPUESTA CON RAG:"
          : "RESPUESTA SIN RAG:",
        entry,
        Boolean(entry.withSearch)
      );
    }

    lines.push(
      "---------------------------",
      ""
    );
  }

  const blob = new Blob(
    [
      "\uFEFF",
      lines.join("\n")
    ],
    {
      type: "text/plain;charset=utf-8"
    }
  );

  const href = URL.createObjectURL(blob);

  const a = document.createElement("a");

  a.href = href;

  a.download =
    `archivo-tic-ia-${new Date().toISOString().slice(0, 10)}.txt`;

  document.body.append(a);
  a.click();
  a.remove();

  setTimeout(() => {
    URL.revokeObjectURL(href);
  }, 1000);
}


/* =====================================================
   INICIALIZACION
   ===================================================== */

function initialize() {
  // Detectar archivos HTML incompatibles.

  const ids = [
    "health",
    "health-label",
    "documents",
    "index-status",
    "index-dot",
    "doc-count",
    "stat-documents",
    "question",
    "ask-form",
    "ask",
    "compare",
    "use-search",
    "stat-mode",
    "mode-tag",
    "mode-note",
    "stat-queries",
    "conversation",
    "export-chat",
    "char-count",
    "sync",
    "sync-label",
    "new-chat",
    "refresh-docs",
    "doc-search",
    "doc-type"
  ];

  const missing = ids.filter(
    (id) => !$(id)
  );

  if (missing.length) {
    console.error(
      "Faltan elementos HTML requeridos:",
      missing.join(", ")
    );

    const status = $("health-label");

    if (status) {
      status.textContent =
        "Error de interfaz: HTML y JS incompatibles";
    }

    return;
  }

  // Formulario del chat.

  $("ask-form").addEventListener(
    "submit",
    (event) => {
      event.preventDefault();
      ask();
    }
  );

  // Comparador RAG.

  $("compare").addEventListener(
    "click",
    compareRag
  );

  // Campo de pregunta.

  $("question").addEventListener(
    "input",
    updateCounter
  );

  $("question").addEventListener(
    "keydown",
    (event) => {
      if (
        event.key === "Enter" &&
        (
          event.ctrlKey ||
          event.metaKey
        )
      ) {
        event.preventDefault();
        ask();
      }
    }
  );

  // Interruptor File Search.

  $("use-search").addEventListener(
    "change",
    updateMode
  );

  // Filtros documentales.

  $("doc-search").addEventListener(
    "input",
    renderDocuments
  );

  $("doc-type").addEventListener(
    "change",
    renderDocuments
  );

  // Refrescar documentos.

  $("refresh-docs").addEventListener(
    "click",
    () => loadDocuments(true)
  );

  // Sincronizar Google Drive.

  $("sync").addEventListener(
    "click",
    sync
  );

  // Exportar conversación.

  $("export-chat").addEventListener(
    "click",
    exportChat
  );

  // Nueva conversación.

  $("new-chat").addEventListener(
    "click",
    () => {
      if (state.busy) return;

      state.messages = [];

      clearInput();
      renderConversation();

      $("question").focus();
    }
  );

  // Preparar interfaz.

  renderConversation();
  updateMode();
  updateCounter();

  // Consultas independientes al backend.
  // Si una falla, la otra continúa.

  void checkHealth();
  void loadDocuments();
}


// Esperar al documento HTML si todavía está cargando.

if (document.readyState === "loading") {
  document.addEventListener(
    "DOMContentLoaded",
    initialize,
    {
      once: true
    }
  );
} else {
  initialize();
}
