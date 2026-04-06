const API_URL = "https://api.github.com/repos/OWASP/AISVS/contents/1.0/en";
const CONTROL_FILE_PATTERN = /^0x10-C\d{2}-.+\.md$/;
const THEME_STORAGE_KEY = "aisvs-theme";
const LANGUAGE_STORAGE_KEY = "aisvs-language";
const TRANSLATION_CACHE_KEY = "aisvs-translation-cache-pt";
const CHECKLIST_STORAGE_KEY = "aisvs-checklist-state";
const TRANSLATION_WORKERS = 3;

const CHAPTER_TRANSLATIONS = {
  "C1 Training Data Integrity & Traceability": "C1 Integridade e Rastreabilidade de Dados de Treinamento",
  "C2 User Input Validation": "C2 Validação de Entrada do Usuário",
  "C3 Model Lifecycle Management": "C3 Gestão do Ciclo de Vida do Modelo",
  "C4 Infrastructure, Configuration & Deployment Security":
    "C4 Segurança de Infraestrutura, Configuração e Implantação",
  "C5 Access Control & Identity": "C5 Controle de Acesso e Identidade",
  "C6 Supply Chain Security for Models, Frameworks & Data":
    "C6 Segurança da Cadeia de Suprimentos para Modelos, Frameworks e Dados",
  "C7 Model Behavior, Output Control & Safety Assurance":
    "C7 Comportamento do Modelo, Controle de Saída e Garantia de Segurança",
  "C8 Memory, Embeddings & Vector Database Security":
    "C8 Segurança de Memória, Embeddings e Banco de Vetores",
  "C9 Autonomous Orchestration & Agentic Action Security":
    "C9 Segurança de Orquestração Autônoma e Ações Agênticas",
  "C10 Model Context Protocol (MCP) Security": "C10 Segurança do Model Context Protocol (MCP)",
  "C11 Adversarial Robustness & Attack Resistance":
    "C11 Robustez Adversarial e Resistência a Ataques",
  "C12 Privacy Protection & Personal Data Management":
    "C12 Proteção de Privacidade e Gestão de Dados Pessoais",
  "C13 Monitoring, Logging & Anomaly Detection":
    "C13 Monitoramento, Logs e Detecção de Anomalias",
  "C14 Human Oversight and Trust": "C14 Supervisão Humana e Confiança",
};

const I18N = {
  pt: {
    pageTitle: "Controles OWASP AISVS",
    languageLabel: "Idioma",
    totalLabel: "Total",
    levelLabel: (level) => `Nível ${level}`,
    allLabel: "Todos",
    searchLabel: "Buscar controle",
    searchPlaceholder: "Ex.: autenticacao, prompt injection, C9.4...",
    chapterLabel: "Capítulo",
    allChapters: "Todos os capítulos",
    thLevel: "Nível",
    thChecklist: "Checklist",
    thChapter: "Capítulo",
    thSection: "Seção",
    thControl: "Descrição do controle",
    implementedLabel: "Implementados",
    pendingLabel: "Pendentes",
    downloadPdf: "Baixar PDF",
    downloadingPdf: "Gerando PDF...",
    pdfSuccess: "PDF gerado com sucesso.",
    pdfNoData: "Nenhum resultado para exportar em PDF.",
    pdfLibError: "Não foi possível carregar a biblioteca de PDF.",
    reportTitle: "Relatório de Checklist AISVS",
    reportDateLabel: "Data",
    reportFiltersLabel: "Filtros aplicados",
    reportSearchLabel: "Busca",
    reportChapterLabel: "Capítulo",
    reportLevelLabel: "Nível",
    reportSummaryLabel: "Resumo",
    reportImplementedLabel: "Implementados",
    reportPendingLabel: "Pendentes",
    reportStatusLabel: "Status",
    reportDescriptionLabel: "Descrição",
    implementedStatus: "Implementado",
    pendingStatus: "Pendente",
    themeDark: "Modo escuro",
    themeLight: "Modo claro",
    statusLoadingList: "Carregando lista de capítulos do AISVS...",
    statusReading: (count) => `Lendo ${count} capítulo(s)...`,
    statusShown: (count) => `${count} controle(s) exibido(s).`,
    emptyResults: "Nenhum controle encontrado para o filtro aplicado.",
    errorLoading: (message) => `Erro ao carregar dados: ${message}`,
    cellLevel: "Nível",
    cellChecklist: "Checklist",
    cellChapter: "Capítulo",
    cellSection: "Seção",
    cellControl: "Descrição do controle",
    markAsImplemented: "Marcar como implementado",
    markAsPending: "Marcar como pendente",
  },
  en: {
    pageTitle: "OWASP AISVS Controls",
    languageLabel: "Language",
    totalLabel: "Total",
    levelLabel: (level) => `Level ${level}`,
    allLabel: "All",
    searchLabel: "Search control",
    searchPlaceholder: "Ex.: authentication, prompt injection, C9.4...",
    chapterLabel: "Chapter",
    allChapters: "All chapters",
    thLevel: "Level",
    thChecklist: "Checklist",
    thChapter: "Chapter",
    thSection: "Section",
    thControl: "Control",
    implementedLabel: "Implemented",
    pendingLabel: "Pending",
    downloadPdf: "Download PDF",
    downloadingPdf: "Generating PDF...",
    pdfSuccess: "PDF generated successfully.",
    pdfNoData: "No results to export as PDF.",
    pdfLibError: "Could not load the PDF library.",
    reportTitle: "AISVS Checklist Report",
    reportDateLabel: "Date",
    reportFiltersLabel: "Applied filters",
    reportSearchLabel: "Search",
    reportChapterLabel: "Chapter",
    reportLevelLabel: "Level",
    reportSummaryLabel: "Summary",
    reportImplementedLabel: "Implemented",
    reportPendingLabel: "Pending",
    reportStatusLabel: "Status",
    reportDescriptionLabel: "Description",
    implementedStatus: "Implemented",
    pendingStatus: "Pending",
    themeDark: "Dark mode",
    themeLight: "Light mode",
    statusLoadingList: "Loading AISVS chapter list...",
    statusReading: (count) => `Reading ${count} chapter(s)...`,
    statusShown: (count) => `${count} control(s) shown.`,
    emptyResults: "No controls found for the selected filters.",
    errorLoading: (message) => `Error loading data: ${message}`,
    cellLevel: "Level",
    cellChecklist: "Checklist",
    cellChapter: "Chapter",
    cellSection: "Section",
    cellControl: "Control",
    markAsImplemented: "Mark as implemented",
    markAsPending: "Mark as pending",
  },
};

const state = {
  controls: [],
  filtered: [],
  level: "all",
  chapter: "all",
  search: "",
  language: "pt",
  translationCache: {},
  inFlightTranslations: new Set(),
  checkedControls: new Set(),
};

const refs = {
  root: document.documentElement,
  pageTitle: document.getElementById("pageTitle"),
  languageLabel: document.getElementById("languageLabel"),
  languageSelect: document.getElementById("languageSelect"), 
  totalLabel: document.getElementById("totalLabel"),
  level1Label: document.getElementById("level1Label"),
  level2Label: document.getElementById("level2Label"),
  level3Label: document.getElementById("level3Label"),
  implementedLabel: document.getElementById("implementedLabel"),
  pendingLabel: document.getElementById("pendingLabel"),
  btnAll: document.getElementById("btnAll"),
  btnL1: document.getElementById("btnL1"),
  btnL2: document.getElementById("btnL2"),
  btnL3: document.getElementById("btnL3"),
  searchLabel: document.getElementById("searchLabel"),
  searchInput: document.getElementById("searchInput"),
  chapterLabel: document.getElementById("chapterLabel"),
  chapterSelect: document.getElementById("chapterSelect"),
  downloadPdfBtn: document.getElementById("downloadPdfBtn"),
  statusText: document.getElementById("statusText"),
  tableBody: document.getElementById("controlsTableBody"),
  thLevel: document.getElementById("thLevel"),
  thChecklist: document.getElementById("thChecklist"),
  thChapter: document.getElementById("thChapter"),
  thSection: document.getElementById("thSection"),
  thControl: document.getElementById("thControl"),
  levelButtons: document.getElementById("levelButtons"),
  themeToggle: document.getElementById("themeToggle"),
  totalCount: document.getElementById("totalCount"),
  l1Count: document.getElementById("l1Count"),
  l2Count: document.getElementById("l2Count"),
  l3Count: document.getElementById("l3Count"),
  implementedCount: document.getElementById("implementedCount"),
  pendingCount: document.getElementById("pendingCount"),
};

function t(key, ...args) {
  const value = I18N[state.language][key];
  return typeof value === "function" ? value(...args) : value;
}

function loadTranslationCache() {
  const raw = getStoredValue(TRANSLATION_CACHE_KEY);
  if (!raw) {
    state.translationCache = {};
    return;
  }

  try {
    const parsed = JSON.parse(raw);
    state.translationCache = parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    state.translationCache = {};
  }
}

function loadChecklistState() {
  const raw = getStoredValue(CHECKLIST_STORAGE_KEY);
  if (!raw) {
    state.checkedControls = new Set();
    return;
  }

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      state.checkedControls = new Set();
      return;
    }
    state.checkedControls = new Set(parsed.filter((id) => typeof id === "string"));
  } catch {
    state.checkedControls = new Set();
  }
}

function persistChecklistState() {
  setStoredValue(CHECKLIST_STORAGE_KEY, JSON.stringify([...state.checkedControls]));
}

function persistTranslationCache() {
  setStoredValue(TRANSLATION_CACHE_KEY, JSON.stringify(state.translationCache));
}

function getStoredValue(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function setStoredValue(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {
  }
}

function getNumberFormatter() {
  return new Intl.NumberFormat(state.language === "en" ? "en-US" : "pt-BR");
}

function setLabelText(labelEl, text, inputEl) {
  labelEl.textContent = "";
  labelEl.append(text, inputEl);
}

function setupLanguage() {
  const savedLanguage = getStoredValue(LANGUAGE_STORAGE_KEY);
  state.language = savedLanguage === "en" ? "en" : "pt";
  refs.languageSelect.value = state.language;
}

function getPreferredTheme() {
  const savedTheme = getStoredValue(THEME_STORAGE_KEY);
  if (savedTheme === "light" || savedTheme === "dark") {
    return savedTheme;
  }

  if (typeof window.matchMedia === "function") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }

  return "light";
}

function applyTheme(theme) {
  refs.root.dataset.theme = theme;
  refs.themeToggle.textContent = theme === "dark" ? t("themeLight") : t("themeDark");
}

function setupThemeToggle() {
  applyTheme(getPreferredTheme());

  refs.themeToggle.addEventListener("click", () => {
    const nextTheme = refs.root.dataset.theme === "dark" ? "light" : "dark";
    applyTheme(nextTheme);
    setStoredValue(THEME_STORAGE_KEY, nextTheme);
  });
}

function updateUiLanguage() {
  refs.pageTitle.textContent = t("pageTitle");
  refs.languageLabel.textContent = t("languageLabel");
  refs.totalLabel.textContent = t("totalLabel");
  refs.level1Label.textContent = t("levelLabel", 1);
  refs.level2Label.textContent = t("levelLabel", 2);
  refs.level3Label.textContent = t("levelLabel", 3);
  refs.implementedLabel.textContent = t("implementedLabel");
  refs.pendingLabel.textContent = t("pendingLabel");
  refs.btnAll.textContent = t("allLabel");
  refs.btnL1.textContent = t("levelLabel", 1);
  refs.btnL2.textContent = t("levelLabel", 2);
  refs.btnL3.textContent = t("levelLabel", 3);
  refs.downloadPdfBtn.textContent = t("downloadPdf");
  setLabelText(refs.searchLabel, `${t("searchLabel")} `, refs.searchInput);
  refs.searchInput.placeholder = t("searchPlaceholder");
  setLabelText(refs.chapterLabel, `${t("chapterLabel")} `, refs.chapterSelect);
  refs.thLevel.textContent = t("thLevel");
  refs.thChecklist.textContent = t("thChecklist");
  refs.thChapter.textContent = t("thChapter");
  refs.thSection.textContent = t("thSection");
  refs.thControl.textContent = t("thControl");
  applyTheme(refs.root.dataset.theme || "light");
}

function sanitizeDescription(description) {
  return description.replace(/\*\*/g, "").replace(/\s+/g, " ").trim();
}

function getCachedTranslation(text) {
  return state.translationCache[text] || null;
}

async function translateTextToPortuguese(text) {
  const endpoint = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=pt&dt=t&q=${encodeURIComponent(text)}`;
  const response = await fetch(endpoint);
  if (!response.ok) {
    throw new Error(`Translation API status ${response.status}`);
  }

  const data = await response.json();
  if (!Array.isArray(data) || !Array.isArray(data[0])) {
    throw new Error("Unexpected translation response format");
  }

  return data[0].map((part) => (Array.isArray(part) ? part[0] : "")).join("").trim();
}

async function ensurePortugueseTranslations(controls) {
  if (state.language !== "pt" || controls.length === 0) {
    return;
  }

  const pendingTexts = [];
  for (const control of controls) {
    const candidates = [control.sectionEn, control.descriptionEn];
    for (const text of candidates) {
      if (!text || getCachedTranslation(text) || state.inFlightTranslations.has(text)) {
        continue;
      }
      state.inFlightTranslations.add(text);
      pendingTexts.push(text);
    }
  }

  if (pendingTexts.length === 0) {
    return;
  }

  const queue = [...pendingTexts];
  let translatedCount = 0;

  const worker = async () => {
    while (queue.length > 0 && state.language === "pt") {
      const text = queue.shift();
      if (!text) continue;

      try {
        const translated = await translateTextToPortuguese(text);
        if (translated) {
          state.translationCache[text] = translated;
        }
      } finally {
        state.inFlightTranslations.delete(text);
      }

      translatedCount += 1;
      if (translatedCount % 15 === 0) {
        persistTranslationCache();
        renderTable(state.filtered);
      }
    }
  };

  await Promise.all(Array.from({ length: TRANSLATION_WORKERS }, () => worker()));
  persistTranslationCache();
  if (state.language === "pt") {
    renderTable(state.filtered);
  }
}

function parseChapterMarkdown(content, fileName) {
  const lines = content.split("\n");
  let chapterEn = fileName;
  let chapterPt = fileName;
  let currentSection = "";
  const controls = [];

  for (const line of lines) {
    if (line.startsWith("# C")) {
      chapterEn = line.replace(/^#\s*/, "").trim();
      chapterPt = CHAPTER_TRANSLATIONS[chapterEn] || chapterEn;
      continue;
    }

    if (line.startsWith("## C")) {
      currentSection = line.replace(/^##\s*/, "").trim();
      continue;
    }

    const rowMatch = line.match(/^\|\s*\*\*([0-9]+\.[0-9]+\.[0-9]+)\*\*\s*\|\s*(.+)\s*\|\s*([123])\s*\|$/);
    if (!rowMatch) continue;

    controls.push({
      id: `v1.0-C${rowMatch[1]}`,
      rawId: `C${rowMatch[1]}`,
      level: rowMatch[3],
      chapterEn,
      chapterPt,
      sectionEn: currentSection || "No section",
      descriptionEn: sanitizeDescription(rowMatch[2]),
    });
  }

  return controls;
}

function getChapterName(control) {
  return state.language === "en" ? control.chapterEn : control.chapterPt;
}

function getSectionName(control) {
  if (state.language === "en") {
    return control.sectionEn;
  }
  return getCachedTranslation(control.sectionEn) || control.sectionEn;
}

function getDescription(control) {
  if (state.language === "en") {
    return control.descriptionEn;
  }
  return getCachedTranslation(control.descriptionEn) || control.descriptionEn;
}

function getControlStatusLabel(control) {
  return state.checkedControls.has(control.id) ? t("implementedStatus") : t("pendingStatus");
}

function getCurrentFiltersLabel() {
  const levelLabel = state.level === "all" ? t("allLabel") : t("levelLabel", state.level);
  const chapterLabel =
    state.chapter === "all"
      ? t("allChapters")
      : state.language === "en"
        ? state.chapter
        : CHAPTER_TRANSLATIONS[state.chapter] || state.chapter;
  const searchLabel = state.search || "-";

  return `${t("reportLevelLabel")}: ${levelLabel} | ${t("reportChapterLabel")}: ${chapterLabel} | ${t("reportSearchLabel")}: ${searchLabel}`;
}

function addPdfLine(doc, text, x, y, maxWidth, lineHeight, pageHeight, bottomMargin) {
  const wrapped = doc.splitTextToSize(String(text), maxWidth);
  let currentY = y;
  for (const line of wrapped) {
    if (currentY > pageHeight - bottomMargin) {
      doc.addPage();
      currentY = 40;
    }
    doc.text(line, x, currentY);
    currentY += lineHeight;
  }
  return currentY;
}

function generatePdfReport() {
  if (!window.jspdf || !window.jspdf.jsPDF) {
    refs.statusText.textContent = t("pdfLibError");
    return;
  }

  if (state.filtered.length === 0) {
    refs.statusText.textContent = t("pdfNoData");
    return;
  }

  refs.downloadPdfBtn.disabled = true;
  refs.statusText.textContent = t("downloadingPdf");

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const marginX = 40;
  const topStart = 44;
  const contentWidth = doc.internal.pageSize.getWidth() - marginX * 2;
  const pageHeight = doc.internal.pageSize.getHeight();
  const lineHeight = 14;
  const bottomMargin = 40;

  const implemented = state.filtered.filter((control) => state.checkedControls.has(control.id)).length;
  const pending = Math.max(state.filtered.length - implemented, 0);
  const now = new Date();
  const dateText = now.toLocaleString(state.language === "en" ? "en-US" : "pt-BR");

  let y = topStart;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  y = addPdfLine(doc, t("reportTitle"), marginX, y, contentWidth, 18, pageHeight, bottomMargin);
  y += 4;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  y = addPdfLine(
    doc,
    `${t("reportDateLabel")}: ${dateText}`,
    marginX,
    y,
    contentWidth,
    lineHeight,
    pageHeight,
    bottomMargin,
  );
  y = addPdfLine(
    doc,
    `${t("reportFiltersLabel")}: ${getCurrentFiltersLabel()}`,
    marginX,
    y,
    contentWidth,
    lineHeight,
    pageHeight,
    bottomMargin,
  );
  y += 4;

  doc.setFont("helvetica", "bold");
  y = addPdfLine(doc, `${t("reportSummaryLabel")}:`, marginX, y, contentWidth, lineHeight, pageHeight, bottomMargin);
  doc.setFont("helvetica", "normal");
  y = addPdfLine(
    doc,
    `${t("totalLabel")}: ${state.filtered.length} | ${t("reportImplementedLabel")}: ${implemented} | ${t("reportPendingLabel")}: ${pending}`,
    marginX,
    y,
    contentWidth,
    lineHeight,
    pageHeight,
    bottomMargin,
  );
  y += 8;

  for (let index = 0; index < state.filtered.length; index += 1) {
    const control = state.filtered[index];
    const header = `${index + 1}. ${control.id} | ${t("reportStatusLabel")}: ${getControlStatusLabel(control)} | ${t("reportLevelLabel")}: ${t("levelLabel", control.level)}`;
    const chapter = `${t("reportChapterLabel")}: ${getChapterName(control)}`;
    const section = `${t("thSection")}: ${getSectionName(control)}`;
    const description = `${t("reportDescriptionLabel")}: ${getDescription(control)}`;

    doc.setFont("helvetica", "bold");
    y = addPdfLine(doc, header, marginX, y, contentWidth, lineHeight, pageHeight, bottomMargin);
    doc.setFont("helvetica", "normal");
    y = addPdfLine(doc, chapter, marginX, y, contentWidth, lineHeight, pageHeight, bottomMargin);
    y = addPdfLine(doc, section, marginX, y, contentWidth, lineHeight, pageHeight, bottomMargin);
    y = addPdfLine(doc, description, marginX, y, contentWidth, lineHeight, pageHeight, bottomMargin);
    y += 8;
  }

  const dateStamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  doc.save(`aisvs-checklist-${dateStamp}.pdf`);
  refs.downloadPdfBtn.disabled = false;
  refs.statusText.textContent = t("pdfSuccess");
}

function updateStats(controls) {
  const formatter = getNumberFormatter();
  const implemented = controls.filter((c) => state.checkedControls.has(c.id)).length;
  const pending = Math.max(controls.length - implemented, 0);

  refs.totalCount.textContent = formatter.format(controls.length);
  refs.l1Count.textContent = formatter.format(controls.filter((c) => c.level === "1").length);
  refs.l2Count.textContent = formatter.format(controls.filter((c) => c.level === "2").length);
  refs.l3Count.textContent = formatter.format(controls.filter((c) => c.level === "3").length);
  refs.implementedCount.textContent = formatter.format(implemented);
  refs.pendingCount.textContent = formatter.format(pending);
}

function populateChapterFilter(controls) {
  refs.chapterSelect.innerHTML = "";

  const allOption = document.createElement("option");
  allOption.value = "all";
  allOption.textContent = t("allChapters");
  refs.chapterSelect.appendChild(allOption);

  const chapters = [...new Set(controls.map((item) => item.chapterEn))].sort((a, b) => a.localeCompare(b));
  for (const chapterEn of chapters) {
    const option = document.createElement("option");
    option.value = chapterEn;
    option.textContent = state.language === "en" ? chapterEn : CHAPTER_TRANSLATIONS[chapterEn] || chapterEn;
    refs.chapterSelect.appendChild(option);
  }

  refs.chapterSelect.value = state.chapter;
}

function renderTable(controls) {
  refs.tableBody.innerHTML = "";

  if (controls.length === 0) {
    refs.tableBody.innerHTML = `
      <tr>
        <td colspan="6">${t("emptyResults")}</td>
      </tr>
    `;
    return;
  }

  refs.tableBody.innerHTML = controls
    .map(
      (control) => `
      <tr class="${state.checkedControls.has(control.id) ? "is-checked" : ""}">
        <td class="check-cell" data-label="${t("cellChecklist")}">
          <input
            class="check-input"
            type="checkbox"
            data-control-id="${control.id}"
            ${state.checkedControls.has(control.id) ? "checked" : ""}
            aria-label="${state.checkedControls.has(control.id) ? t("markAsPending") : t("markAsImplemented")}"
            title="${state.checkedControls.has(control.id) ? t("markAsPending") : t("markAsImplemented")}"
          />
        </td>
        <td data-label="ID"><code>${control.id}</code></td>
        <td data-label="${t("cellLevel")}"><span class="tag level-${control.level}">${t("levelLabel", control.level)}</span></td>
        <td data-label="${t("cellChapter")}">${getChapterName(control)}</td>
        <td data-label="${t("cellSection")}">${getSectionName(control)}</td>
        <td data-label="${t("cellControl")}">${getDescription(control)}</td>
      </tr>
    `,
    )
    .join("");
}

function applyFilters() {
  const search = state.search.toLowerCase();

  state.filtered = state.controls.filter((control) => {
    const levelMatch = state.level === "all" || control.level === state.level;
    const chapterMatch = state.chapter === "all" || control.chapterEn === state.chapter;
    const chapterLocalized = getChapterName(control).toLowerCase();

    const searchMatch =
      search === "" ||
      control.id.toLowerCase().includes(search) ||
      control.rawId.toLowerCase().includes(search) ||
      control.chapterEn.toLowerCase().includes(search) ||
      control.chapterPt.toLowerCase().includes(search) ||
      chapterLocalized.includes(search) ||
      control.sectionEn.toLowerCase().includes(search) ||
      getSectionName(control).toLowerCase().includes(search) ||
      control.descriptionEn.toLowerCase().includes(search) ||
      getDescription(control).toLowerCase().includes(search);

    return levelMatch && chapterMatch && searchMatch;
  });

  refs.statusText.textContent = t("statusShown", getNumberFormatter().format(state.filtered.length));
  renderTable(state.filtered);
  void ensurePortugueseTranslations(state.filtered);
}

function bindEvents() {
  refs.levelButtons.addEventListener("click", (event) => {
    if (!(event.target instanceof HTMLButtonElement)) return;
    const level = event.target.dataset.level;
    if (!level) return;

    state.level = level;
    for (const button of refs.levelButtons.querySelectorAll("button")) {
      button.classList.toggle("active", button === event.target);
    }
    applyFilters();
  });

  refs.searchInput.addEventListener("input", (event) => {
    state.search = event.target.value.trim();
    applyFilters();
  });

  refs.chapterSelect.addEventListener("change", (event) => {
    state.chapter = event.target.value;
    applyFilters();
  });

  refs.tableBody.addEventListener("change", (event) => {
    if (!(event.target instanceof HTMLInputElement)) return;
    if (event.target.type !== "checkbox") return;

    const controlId = event.target.dataset.controlId;
    if (!controlId) return;

    if (event.target.checked) {
      state.checkedControls.add(controlId);
    } else {
      state.checkedControls.delete(controlId);
    }

    persistChecklistState();
    updateStats(state.controls);
    renderTable(state.filtered);
  });

  refs.languageSelect.addEventListener("change", (event) => {
    state.language = event.target.value === "en" ? "en" : "pt";
    setStoredValue(LANGUAGE_STORAGE_KEY, state.language);
    updateUiLanguage();
    updateStats(state.controls);
    populateChapterFilter(state.controls);
    applyFilters();
  });

  refs.downloadPdfBtn.addEventListener("click", () => {
    try {
      generatePdfReport();
    } finally {
      refs.downloadPdfBtn.disabled = false;
    }
  });
}

async function loadControls() {
  refs.statusText.textContent = t("statusLoadingList");

  const listingResponse = await fetch(API_URL);
  if (!listingResponse.ok) {
    throw new Error(`Failed to fetch file list (${listingResponse.status}).`);
  }

  const files = await listingResponse.json();
  const chapterFiles = files.filter((file) => CONTROL_FILE_PATTERN.test(file.name));
  refs.statusText.textContent = t("statusReading", chapterFiles.length);

  const markdowns = await Promise.all(
    chapterFiles.map(async (file) => {
      const response = await fetch(file.download_url);
      if (!response.ok) {
        throw new Error(`Failed to fetch ${file.name} (${response.status}).`);
      }
      return parseChapterMarkdown(await response.text(), file.name);
    }),
  );

  state.controls = markdowns.flat().sort((a, b) => a.rawId.localeCompare(b.rawId, undefined, { numeric: true }));
}

async function init() {
  setupLanguage();
  loadTranslationCache();
  loadChecklistState();
  updateUiLanguage();
  setupThemeToggle();
  bindEvents();

  try {
    await loadControls();
    updateStats(state.controls);
    populateChapterFilter(state.controls);
    applyFilters();
  } catch (error) {
    refs.statusText.textContent = t("errorLoading", error.message);
  }
}

init();
