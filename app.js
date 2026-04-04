const API_URL = "https://api.github.com/repos/OWASP/AISVS/contents/1.0/en";
const CONTROL_FILE_PATTERN = /^0x10-C\d{2}-.+\.md$/;
const NUMBER_FORMATTER = new Intl.NumberFormat("pt-BR");
const THEME_STORAGE_KEY = "aisvs-theme";

const CHAPTER_TRANSLATIONS = {
  "C1 Training Data Integrity & Traceability": "C1 Integridade e Rastreabilidade de Dados de Treinamento",
  "C2 User Input Validation": "C2 Validacao de Entrada do Usuario",
  "C3 Model Lifecycle Management": "C3 Gestao do Ciclo de Vida do Modelo",
  "C4 Infrastructure, Configuration & Deployment Security":
    "C4 Seguranca de Infraestrutura, Configuracao e Implantacao",
  "C5 Access Control & Identity": "C5 Controle de Acesso e Identidade",
  "C6 Supply Chain Security for Models, Frameworks & Data":
    "C6 Seguranca da Cadeia de Suprimentos para Modelos, Frameworks e Dados",
  "C7 Model Behavior, Output Control & Safety Assurance":
    "C7 Comportamento do Modelo, Controle de Saida e Garantia de Seguranca",
  "C8 Memory, Embeddings & Vector Database Security":
    "C8 Seguranca de Memoria, Embeddings e Banco de Vetores",
  "C9 Autonomous Orchestration & Agentic Action Security":
    "C9 Seguranca de Orquestracao Autonoma e Acoes Agenticas",
  "C10 Model Context Protocol (MCP) Security": "C10 Seguranca do Model Context Protocol (MCP)",
  "C11 Adversarial Robustness & Attack Resistance":
    "C11 Robustez Adversarial e Resistencia a Ataques",
  "C12 Privacy Protection & Personal Data Management":
    "C12 Protecao de Privacidade e Gestao de Dados Pessoais",
  "C13 Monitoring, Logging & Anomaly Detection":
    "C13 Monitoramento, Logs e Deteccao de Anomalias",
  "C14 Human Oversight and Trust": "C14 Supervisao Humana e Confianca",
};

const state = {
  controls: [],
  filtered: [],
  level: "all",
  chapter: "all",
  search: "",
};

const refs = {
  root: document.documentElement,
  statusText: document.getElementById("statusText"),
  tableBody: document.getElementById("controlsTableBody"),
  chapterSelect: document.getElementById("chapterSelect"),
  searchInput: document.getElementById("searchInput"),
  levelButtons: document.getElementById("levelButtons"),
  themeToggle: document.getElementById("themeToggle"),
  totalCount: document.getElementById("totalCount"),
  l1Count: document.getElementById("l1Count"),
  l2Count: document.getElementById("l2Count"),
  l3Count: document.getElementById("l3Count"),
};

function getPreferredTheme() {
  const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
  if (savedTheme === "light" || savedTheme === "dark") {
    return savedTheme;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyTheme(theme) {
  refs.root.dataset.theme = theme;
  refs.themeToggle.textContent = theme === "dark" ? "Modo claro" : "Modo escuro";
}

function setupThemeToggle() {
  applyTheme(getPreferredTheme());

  refs.themeToggle.addEventListener("click", () => {
    const nextTheme = refs.root.dataset.theme === "dark" ? "light" : "dark";
    applyTheme(nextTheme);
    localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
  });
}

function sanitizeDescription(description) {
  return description
    .replaceAll("**", "")
    .replace(/\s+/g, " ")
    .trim();
}

function parseChapterMarkdown(content, fileName) {
  const lines = content.split("\n");
  let chapterName = fileName;
  let currentSection = "";
  const controls = [];

  for (const line of lines) {
    if (line.startsWith("# C")) {
      const chapterHeader = line.replace(/^#\s*/, "").trim();
      chapterName = CHAPTER_TRANSLATIONS[chapterHeader] || chapterHeader;
      continue;
    }

    if (line.startsWith("## C")) {
      currentSection = line.replace(/^##\s*/, "").trim();
      continue;
    }

    const rowMatch = line.match(
      /^\|\s*\*\*([0-9]+\.[0-9]+\.[0-9]+)\*\*\s*\|\s*(.+)\s*\|\s*([123])\s*\|$/,
    );

    if (!rowMatch) continue;

    const id = rowMatch[1];
    const description = sanitizeDescription(rowMatch[2]);
    const level = rowMatch[3];

    controls.push({
      id: `v1.0-C${id}`,
      rawId: `C${id}`,
      level,
      chapter: chapterName,
      section: currentSection || "Sem secao",
      description,
    });
  }

  return controls;
}

function updateStats(controls) {
  refs.totalCount.textContent = NUMBER_FORMATTER.format(controls.length);
  refs.l1Count.textContent = NUMBER_FORMATTER.format(controls.filter((c) => c.level === "1").length);
  refs.l2Count.textContent = NUMBER_FORMATTER.format(controls.filter((c) => c.level === "2").length);
  refs.l3Count.textContent = NUMBER_FORMATTER.format(controls.filter((c) => c.level === "3").length);
}

function populateChapterFilter(controls) {
  const chapters = [...new Set(controls.map((item) => item.chapter))].sort((a, b) =>
    a.localeCompare(b),
  );

  for (const chapter of chapters) {
    const option = document.createElement("option");
    option.value = chapter;
    option.textContent = chapter;
    refs.chapterSelect.appendChild(option);
  }
}

function renderTable(controls) {
  refs.tableBody.innerHTML = "";

  if (controls.length === 0) {
    refs.tableBody.innerHTML = `
      <tr>
        <td colspan="5">Nenhum controle encontrado para o filtro aplicado.</td>
      </tr>
    `;
    return;
  }

  const rows = controls
    .map(
      (control) => `
      <tr>
        <td><code>${control.id}</code></td>
        <td><span class="tag level-${control.level}">Nível ${control.level}</span></td>
        <td>${control.chapter}</td>
        <td>${control.section}</td>
        <td>${control.description}</td>
      </tr>
    `,
    )
    .join("");

  refs.tableBody.innerHTML = rows;
}

function applyFilters() {
  const search = state.search.toLowerCase();

  state.filtered = state.controls.filter((control) => {
    const levelMatch = state.level === "all" || control.level === state.level;
    const chapterMatch = state.chapter === "all" || control.chapter === state.chapter;

    const searchMatch =
      search === "" ||
      control.id.toLowerCase().includes(search) ||
      control.rawId.toLowerCase().includes(search) ||
      control.chapter.toLowerCase().includes(search) ||
      control.section.toLowerCase().includes(search) ||
      control.description.toLowerCase().includes(search);

    return levelMatch && chapterMatch && searchMatch;
  });

  refs.statusText.textContent = `${state.filtered.length} controle(s) exibido(s).`;
  renderTable(state.filtered);
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
}

async function loadControls() {
  refs.statusText.textContent = "Buscando lista de capítulos AISVS...";

  const listingResponse = await fetch(API_URL);
  if (!listingResponse.ok) {
    throw new Error(`Falha ao obter lista de arquivos (${listingResponse.status}).`);
  }

  const files = await listingResponse.json();
  const chapterFiles = files.filter((file) => CONTROL_FILE_PATTERN.test(file.name));

  refs.statusText.textContent = `Lendo ${chapterFiles.length} capítulos...`;

  const markdowns = await Promise.all(
    chapterFiles.map(async (file) => {
      const response = await fetch(file.download_url);
      if (!response.ok) {
        throw new Error(`Falha ao obter ${file.name} (${response.status}).`);
      }

      const content = await response.text();
      return parseChapterMarkdown(content, file.name);
    }),
  );

  state.controls = markdowns
    .flat()
    .sort((a, b) => a.rawId.localeCompare(b.rawId, undefined, { numeric: true }));
}

async function init() {
  setupThemeToggle();
  bindEvents();

  try {
    await loadControls();
    updateStats(state.controls);
    populateChapterFilter(state.controls);
    applyFilters();
  } catch (error) {
    refs.statusText.textContent = `Erro ao carregar dados: ${error.message}`;
  }
}

init();
