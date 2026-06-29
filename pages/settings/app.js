const bridge = window.AstrBotPluginPage;

const PALETTE_MODES = ["luxury", "bluewhite", "vivid", "void"];
const APPEARANCE_MODES = ["auto", "light", "dark"];
const PALETTE_LABELS = {
  luxury: "荧绿",
  bluewhite: "冰蓝",
  vivid: "玫红",
  void: "夜幕",
};
const APPEARANCE_LABELS = {
  auto: "自动",
  light: "浅色",
  dark: "深色",
};

const TAB_META = {
  overview: ["Dashboard", "把供应商、模型、额度和启动图放在同一块面板里快速核对。"],
  generation: ["生成设置", "配置默认模型、并发、超时、比例、分辨率和生图回复。"],
  providers: ["供应商矩阵", "管理多个图像模型供应商、模型列表、密钥轮换和能力开关。"],
  limits: ["权限额度", "设置会话黑白名单、频率限制、每日额度和参考图大小。"],
  tools: ["工具调用", "控制哪些 LLM 工具可以调用通用生图能力。"],
  raw: ["Raw JSON", "核对当前完整配置快照。"],
};

const LOCAL_SCHEMA = {
  enable_llm_tool: {
    type: "list",
    description: "启用 LLM 工具",
    hint: "本地预览数据。AstrBot 内会读取真实 schema。",
    options: ["astrbot", "openai", "gemini", "workflow"],
    default: ["astrbot", "workflow"],
  },
  api_providers: {
    type: "template_list",
    description: "图像模型供应商",
    hint: "配置一个或多个图像生成供应商。",
    templates: {
      gemini: {
        name: "Gemini 接口",
        display_item: "name",
        items: {
          name: { description: "供应商名称", type: "string", default: "" },
          base_url: { description: "API Base URL", type: "string", default: "" },
          api_keys: { description: "API 密钥", type: "list", default: [] },
          available_models: {
            description: "可用模型列表",
            type: "list",
            default: ["gemini-3-pro-image-preview", "gemini-2.5-flash-image"],
          },
          capability_options: {
            description: "模型能力",
            type: "list",
            options: ["文生图", "图生图", "宽高比", "分辨率"],
            default: ["文生图", "图生图", "宽高比"],
          },
          timeout: {
            description: "超时时间覆盖（秒）",
            type: "int",
            slider: { min: 0, max: 600, step: 10 },
            default: 0,
          },
          max_retry_attempts: {
            description: "失败重试次数",
            type: "int",
            slider: { min: 0, max: 10, step: 1 },
            default: 0,
          },
        },
      },
      openai: {
        name: "OpenAI 接口",
        display_item: "name",
        items: {
          name: { description: "供应商名称", type: "string", default: "" },
          base_url: { description: "API Base URL", type: "string", default: "" },
          api_keys: { description: "API 密钥", type: "list", default: [] },
          available_models: {
            description: "可用模型列表",
            type: "list",
            default: ["gpt-image-1", "dall-e-3"],
          },
          capability_options: {
            description: "模型能力",
            type: "list",
            options: ["文生图", "图生图", "宽高比", "分辨率"],
            default: ["文生图", "图生图"],
          },
          timeout: {
            description: "超时时间覆盖（秒）",
            type: "int",
            slider: { min: 0, max: 600, step: 10 },
            default: 0,
          },
          max_retry_attempts: {
            description: "失败重试次数",
            type: "int",
            slider: { min: 0, max: 10, step: 1 },
            default: 0,
          },
        },
      },
    },
  },
  generation: {
    type: "object",
    description: "生成设置",
    hint: "配置模型、并发、超时和提示消息。",
    items: {
      model: { description: "生图模型", type: "string", default: "" },
      timeout: {
        description: "全局超时时间（秒）",
        type: "int",
        slider: { min: 60, max: 600, step: 10 },
        default: 180,
      },
      max_retry_attempts: {
        description: "生图失败重试次数",
        type: "int",
        slider: { min: 0, max: 10, step: 1 },
        default: 1,
      },
      default_resolution: {
        description: "默认分辨率",
        type: "string",
        options: ["不指定", "1K", "2K", "4K"],
        default: "1K",
      },
      default_aspect_ratio: {
        description: "默认宽高比",
        type: "string",
        options: ["不指定", "1:1", "3:4", "4:3", "9:16", "16:9"],
        default: "1:1",
      },
      max_concurrent_tasks: {
        description: "最大并发任务数",
        type: "int",
        slider: { min: 1, max: 10, step: 1 },
        default: 3,
      },
      show_generation_info: { description: "完成后显示生成信息", type: "bool", default: true },
      show_model_info: { description: "完成后显示模型信息", type: "bool", default: true },
      enable_start_task_image: { description: "开始任务时发送固定图片", type: "bool", default: true },
      start_task_image_path: { description: "开始绘图回复图片", type: "file", default: [] },
      enable_start_task_image_paths: { description: "启用开始绘图回复图片列表", type: "bool", default: false },
      start_task_image_paths: { description: "开始绘图回复图片列表", type: "file", default: [] },
      completion_reply_text: { description: "生图完成回复文本", type: "text", default: "" },
      generation_failure_message_template: { description: "生图失败发送文本", type: "text", default: "生成失败" },
    },
  },
  user_limits: {
    type: "object",
    description: "使用限制",
    hint: "配置会话黑名单、白名单、频率限制和每日额度。",
    items: {
      enable_usage_limits: { description: "启用使用限制", type: "bool", default: true },
      admin_bypass_limits: { description: "管理员无视使用限制", type: "bool", default: true },
      umo_blacklist: { description: "会话 QQ 黑名单", type: "list", default: [] },
      umo_whitelist: { description: "使用限制白名单", type: "list", default: [] },
      rate_limit_seconds: {
        description: "速率限制（秒）",
        type: "int",
        slider: { min: 0, max: 60, step: 1 },
        default: 0,
      },
      max_image_size_mb: {
        description: "最大参考图大小（MB）",
        type: "int",
        slider: { min: 1, max: 30, step: 1 },
        default: 10,
      },
      enable_daily_limit: { description: "启用每日额度", type: "bool", default: false },
      daily_limit_count: {
        description: "每日额度",
        type: "int",
        slider: { min: 1, max: 50, step: 1 },
        default: 10,
      },
      blacklist_block_message: { description: "黑名单拒绝提示", type: "string", default: "当前会话无法使用生图功能" },
    },
  },
};

const LOCAL_CONFIG = {
  enable_llm_tool: ["astrbot", "workflow"],
  api_providers: [
    {
      __template_key: "gemini",
      name: "Gemini",
      base_url: "",
      api_keys: ["local-preview-key"],
      available_models: ["gemini-3-pro-image-preview", "gemini-2.5-flash-image"],
      capability_options: ["文生图", "图生图", "宽高比"],
      timeout: 0,
      max_retry_attempts: 1,
    },
    {
      __template_key: "openai",
      name: "OpenAI",
      base_url: "https://api.openai.com/v1",
      api_keys: [],
      available_models: ["gpt-image-1"],
      capability_options: ["文生图", "图生图"],
      timeout: 0,
      max_retry_attempts: 0,
    },
  ],
  generation: {
    model: "Gemini/gemini-3-pro-image-preview",
    timeout: 180,
    max_retry_attempts: 1,
    default_resolution: "1K",
    default_aspect_ratio: "1:1",
    max_concurrent_tasks: 3,
    show_generation_info: true,
    show_model_info: true,
    enable_start_task_image: true,
    start_task_image_path: [],
    enable_start_task_image_paths: false,
    start_task_image_paths: [],
    completion_reply_text: "",
    generation_failure_message_template: "生成失败",
  },
  user_limits: {
    enable_usage_limits: true,
    admin_bypass_limits: true,
    umo_blacklist: [],
    umo_whitelist: ["管理员"],
    rate_limit_seconds: 0,
    max_image_size_mb: 10,
    enable_daily_limit: false,
    daily_limit_count: 10,
    blacklist_block_message: "当前会话无法使用生图功能",
  },
};

const state = {
  schema: cloneValue(LOCAL_SCHEMA),
  config: cloneValue(LOCAL_CONFIG),
  activeTab: "overview",
  scoreMode: "auto",
  ui: {
    palette_mode: "luxury",
    appearance_mode: "light",
  },
};

const els = {
  body: document.body,
  panelMount: document.getElementById("panelMount"),
  toast: document.getElementById("toastLayer"),
  saveAllBtn: document.getElementById("saveAllBtn"),
  quickSaveBtn: document.getElementById("quickSaveBtn"),
  reloadBtn: document.getElementById("reloadBtn"),
  paletteToggleBtn: document.getElementById("paletteToggleBtn"),
  paletteModeLabel: document.getElementById("paletteModeLabel"),
  appearanceToggleBtn: document.getElementById("appearanceToggleBtn"),
  appearanceModeLabel: document.getElementById("appearanceModeLabel"),
  scoreKicker: document.getElementById("scoreKicker"),
  scoreTitle: document.getElementById("scoreTitle"),
  scoreHint: document.getElementById("scoreHint"),
  providerTabs: document.getElementById("providerTabs"),
  scoreRing: document.getElementById("scoreRing"),
  scoreNumber: document.getElementById("scoreNumber"),
  scoreDelta: document.getElementById("scoreDelta"),
  insightProviders: document.getElementById("insightProviders"),
  insightModels: document.getElementById("insightModels"),
  insightConcurrency: document.getElementById("insightConcurrency"),
  insightTimeout: document.getElementById("insightTimeout"),
  insightLimits: document.getElementById("insightLimits"),
  insightImages: document.getElementById("insightImages"),
  runtimeClock: document.getElementById("runtimeClock"),
  runtimeDate: document.getElementById("runtimeDate"),
  systemStatus: document.getElementById("systemStatus"),
  systemSummary: document.getElementById("systemSummary"),
};

function cloneValue(value) {
  if (typeof structuredClone === "function") return structuredClone(value);
  return JSON.parse(JSON.stringify(value));
}

function escapeHtml(value) {
  const map = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
  return String(value ?? "").replace(/[&<>"']/g, match => map[match]);
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function unwrap(response) {
  if (response && typeof response === "object" && Object.prototype.hasOwnProperty.call(response, "ok")) {
    if (!response.ok) throw new Error(response.message || response.error || "请求失败");
    return Object.prototype.hasOwnProperty.call(response, "data") ? response.data : response;
  }
  return response;
}

async function apiGet(endpoint, params) {
  if (bridge?.apiGet) return unwrap(await bridge.apiGet(endpoint, params));
  if (endpoint === "settings-v2/bootstrap") {
    return {
      schema: cloneValue(LOCAL_SCHEMA),
      config: cloneValue(state.config || LOCAL_CONFIG),
      start_task_image_path: "",
      upload_dir: "local-preview",
    };
  }
  if (endpoint === "settings-v2/ui-state") {
    return { state: cloneValue(state.ui) };
  }
  throw new Error(`本地预览不支持 GET ${endpoint}`);
}

async function apiPost(endpoint, body) {
  if (bridge?.apiPost) return unwrap(await bridge.apiPost(endpoint, body));
  if (endpoint === "settings-v2/config") {
    state.config = cloneValue(body.config || state.config);
    return { config: cloneValue(state.config) };
  }
  if (endpoint === "settings-v2/ui-state") {
    state.ui = { ...state.ui, ...(body || {}) };
    return { state: cloneValue(state.ui) };
  }
  if (endpoint === "settings-v2/image/upload") {
    const filename = String(body?.filename || "start-image.png").replace(/[^0-9A-Za-z_.-]+/g, "_");
    return { path: `files/generation/start_task_image_path/${filename}`, filename };
  }
  throw new Error(`本地预览不支持 POST ${endpoint}`);
}

function showToast(message) {
  if (!els.toast) return;
  els.toast.textContent = message;
  els.toast.classList.add("show");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => els.toast.classList.remove("show"), 2600);
}

function metaDefault(meta) {
  if (Object.prototype.hasOwnProperty.call(meta || {}, "default")) return cloneValue(meta.default);
  if (meta?.type === "bool") return false;
  if (meta?.type === "int" || meta?.type === "float") return 0;
  if (meta?.type === "list" || meta?.type === "file") return [];
  if (meta?.type === "object") return {};
  return "";
}

function fieldId(path) {
  return "f_" + path.map(part => String(part).replace(/[^a-zA-Z0-9_-]/g, "_")).join("_");
}

function getByPath(path) {
  return path.reduce((obj, key) => obj?.[key], state.config);
}

function setByPath(path, value) {
  let obj = state.config;
  for (let index = 0; index < path.length - 1; index += 1) {
    const key = path[index];
    if (!obj[key] || typeof obj[key] !== "object") {
      obj[key] = typeof path[index + 1] === "number" ? [] : {};
    }
    obj = obj[key];
  }
  obj[path.at(-1)] = value;
  renderRawIfVisible();
  updateScorePanel();
}

function ensureConfigShape() {
  state.config ||= {};
  state.config.generation ||= {};
  state.config.user_limits ||= {};
  state.config.api_providers = Array.isArray(state.config.api_providers) ? state.config.api_providers : [];
  state.config.enable_llm_tool = Array.isArray(state.config.enable_llm_tool) ? state.config.enable_llm_tool : [];

  hydrateObject("generation", state.schema.generation?.items || {});
  hydrateObject("user_limits", state.schema.user_limits?.items || {});

  if (!Array.isArray(state.config.enable_llm_tool)) {
    state.config.enable_llm_tool = metaDefault(state.schema.enable_llm_tool);
  }
}

function hydrateObject(configKey, items) {
  const section = state.config[configKey] || {};
  Object.entries(items).forEach(([key, meta]) => {
    if (!Object.prototype.hasOwnProperty.call(section, key)) section[key] = metaDefault(meta);
  });
  state.config[configKey] = section;
}

function isProviderEnabled(provider) {
  return provider?.enabled !== false;
}

function isModelSettingEnabled(modelSetting, providers) {
  const value = String(modelSetting || "").trim();
  if (!value) return false;
  if (!value.includes("/")) {
    return providers.some(provider => (
      Array.isArray(provider.available_models)
      && provider.available_models.map(String).includes(value)
    ));
  }
  const [providerName] = value.split("/");
  return providers.some(provider => String(provider.name || "").trim() === providerName);
}

function metrics() {
  const providers = Array.isArray(state.config.api_providers) ? state.config.api_providers : [];
  const activeProviders = providers.filter(isProviderEnabled);
  const modelNames = activeProviders.flatMap(provider => Array.isArray(provider.available_models) ? provider.available_models : []);
  const modelCount = new Set(modelNames.map(String).filter(Boolean)).size;
  const generation = state.config.generation || {};
  const limits = state.config.user_limits || {};
  const singleImage = imageValues(generation.start_task_image_path);
  const imageList = imageValues(generation.start_task_image_paths);
  const imageCount = singleImage.length + imageList.length;
  const concurrency = Number(generation.max_concurrent_tasks || 0);
  const timeout = Number(generation.timeout || 0);
  const retryCount = Number(generation.max_retry_attempts || 0);
  const toolCount = Array.isArray(state.config.enable_llm_tool) ? state.config.enable_llm_tool.length : 0;
  const requestedModel = String(generation.model || "").trim();
  const currentModel = (isModelSettingEnabled(requestedModel, activeProviders) ? requestedModel : "")
    || firstConfiguredModel(activeProviders)
    || "未指定模型";
  const score = clamp(
    580 + activeProviders.length * 32 + modelCount * 7 + concurrency * 9 + retryCount * 10
      + (limits.enable_usage_limits ? 24 : 0) + (toolCount ? 16 : 0),
    560,
    850,
  );

  return {
    providers: activeProviders,
    providerCount: activeProviders.length,
    modelCount,
    imageCount,
    concurrency,
    timeout,
    retryCount,
    toolCount,
    currentModel,
    score,
    delta: score - 760,
    limitsEnabled: Boolean(limits.enable_usage_limits),
    dailyLimit: limits.enable_daily_limit ? Number(limits.daily_limit_count || 0) : 0,
    rateLimit: Number(limits.rate_limit_seconds || 0),
    maxImageSize: Number(limits.max_image_size_mb || 0),
  };
}

function imageValues(value) {
  if (Array.isArray(value)) return value.map(item => String(item || "").trim()).filter(Boolean);
  const text = String(value || "").trim();
  return text ? [text] : [];
}

function firstConfiguredModel(providers) {
  for (const provider of providers) {
    const name = String(provider.name || "").trim();
    const model = Array.isArray(provider.available_models)
      ? String(provider.available_models.find(Boolean) || "").trim()
      : "";
    if (name && model) return `${name}/${model}`;
    if (model) return model;
  }
  return "";
}

function renderAll() {
  ensureConfigShape();
  renderPanel();
  updateScorePanel();
  updateNavState();
}

function providerView() {
  if (state.activeTab !== "providers") return null;
  return {
    scrollTop: els.panelMount?.scrollTop || 0,
    open: [...els.panelMount.querySelectorAll("details.provider-card")]
      .map((card, index) => card.open ? index : -1)
      .filter(index => index >= 0),
  };
}

function renderPanelKeepingProviderView() {
  renderPanel(providerView());
}

function renderPanel(view = null) {
  if (state.activeTab === "overview") renderOverviewDashboard();
  else if (state.activeTab === "providers") renderProviders(view);
  else if (state.activeTab === "generation") renderSection("generation", "generation");
  else if (state.activeTab === "limits") renderSection("limits", "user_limits");
  else if (state.activeTab === "tools") renderTools();
  else if (state.activeTab === "raw") renderRaw();
  bindJumpActions();
}

function renderOverviewDashboard() {
  const data = metrics();
  const rows = data.providers.length
    ? data.providers.map((provider, index) => providerLedgerRow(provider, index)).join("")
    : `<tr><td colspan="6">还没有供应商，先去供应商矩阵添加一个。</td></tr>`;

  els.panelMount.innerHTML = `
    <section class="overview-screen">
      <div class="timeline-row">
        ${timelineStep("Day 1", "触发生图", "命令或 LLM 工具收到提示词", true)}
        ${timelineStep("Day 1-3", "调度供应商", "按模型、能力和重试策略执行", data.providerCount > 0)}
        ${timelineStep("Day 5", "返回图片", "携带回复文本、模型信息和启动图", data.modelCount > 0)}
      </div>

      <div class="summary-strip">
        ${summaryChip(data.retryCount, "重试策略", "retry attempts", "hot")}
        ${summaryChip(data.providerCount, "供应商", "active providers", "green")}
        ${summaryChip(data.toolCount, "工具调用", "enabled tools", "yellow")}
      </div>

      <section class="ledger-card">
        <header class="card-head">
          <div>
            <span>Provider ledger</span>
            <h2>供应商矩阵</h2>
          </div>
          <button type="button" data-tab-jump="providers">管理供应商</button>
        </header>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>序号</th>
                <th>供应商</th>
                <th>模型数</th>
                <th>能力</th>
                <th>重试</th>
                <th>状态</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
      </section>

      <div class="overview-grid">
        <section class="mini-panel wide">
          <header>
            <span>Overview</span>
            <button type="button" data-tab-jump="generation">调整生成</button>
          </header>
          <p>当前模型：${escapeHtml(data.currentModel)}</p>
          <div class="health-bar" style="--health-gap:${Math.round((1 - data.score / 850) * 100)}%">
            <span></span>
          </div>
          <div class="balance-row">
            <div><b>${data.timeout || 0}s</b><small>超时时间</small></div>
            <div><b>${data.concurrency || 0}</b><small>并发上限</small></div>
          </div>
        </section>

        <section class="mini-panel">
          <header><span>Credit card use</span></header>
          <div class="donut-stat" style="--donut-pct:${Math.min(100, data.modelCount * 12)}%">
            <b>${data.modelCount}</b>
            <small>models</small>
          </div>
          <p>${data.modelCount ? "模型池已可用于切换。" : "还没有可用模型。"}</p>
        </section>

        <section class="mini-panel">
          <header><span>Account Details</span></header>
          <dl class="detail-list">
            <div><dt>使用限制</dt><dd>${data.limitsEnabled ? "Open" : "Closed"}</dd></div>
            <div><dt>每日额度</dt><dd>${data.dailyLimit ? `${data.dailyLimit}/day` : "None"}</dd></div>
            <div><dt>参考图</dt><dd>${data.maxImageSize || 0} MB</dd></div>
          </dl>
          <button class="full-button" type="button" data-tab-jump="limits">Dispute</button>
        </section>

        <section class="mini-panel wide">
          <header><span>Generation History</span></header>
          ${renderHistoryDots(data)}
        </section>
      </div>
    </section>`;
}

function timelineStep(day, title, text, done) {
  return `
    <article class="timeline-step ${done ? "done" : ""}">
      <span>${escapeHtml(day)}</span>
      <b>${escapeHtml(title)}</b>
      <small>${escapeHtml(text)}</small>
    </article>`;
}

function summaryChip(value, title, subtitle, tone) {
  return `
    <article class="summary-chip ${tone}">
      <strong>${escapeHtml(value)}</strong>
      <div>
        <b>${escapeHtml(title)}</b>
        <span>${escapeHtml(subtitle)}</span>
      </div>
    </article>`;
}

function providerLedgerRow(provider, index) {
  const models = Array.isArray(provider.available_models) ? provider.available_models.filter(Boolean).length : 0;
  const capabilities = Array.isArray(provider.capability_options) ? provider.capability_options.join(" / ") : "默认";
  const retry = Number(provider.max_retry_attempts || 0);
  const name = String(provider.name || "").trim() || "未命名供应商";
  return `
    <tr>
      <td>${String(index + 1).padStart(2, "0")}</td>
      <td>${escapeHtml(name)}</td>
      <td>${models}</td>
      <td>${escapeHtml(capabilities || "默认")}</td>
      <td>${retry}</td>
      <td><span class="status-pill">Open</span></td>
    </tr>`;
}

function renderHistoryDots(data) {
  const years = ["2026", "2025", "2024", "2023", "2022"];
  const months = ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"];
  const rows = years.map((year, yearIndex) => {
    const dots = months.map((month, monthIndex) => {
      const mod = (yearIndex * 3 + monthIndex + data.providerCount + data.modelCount) % 11;
      const stateClass = mod === 0 ? "warn" : mod < 8 ? "good" : "empty";
      return `<span class="${stateClass}" title="${year} ${month}"></span>`;
    }).join("");
    return `<div class="history-row"><b>${year}</b>${dots}</div>`;
  }).join("");
  return `<div class="month-labels">${months.map(month => `<span>${month}</span>`).join("")}</div><div class="history-grid">${rows}</div>`;
}

function renderSection(tab, configKey) {
  const meta = state.schema[configKey];
  const title = TAB_META[tab]?.[0] || meta?.description || "配置";
  const hint = TAB_META[tab]?.[1] || meta?.hint || "";
  els.panelMount.innerHTML = `
    <section class="config-workbench">
      <header class="workbench-head">
        <span>Configuration</span>
        <h2>${escapeHtml(title)}</h2>
        <p>${escapeHtml(hint)}</p>
      </header>
      <div class="form-grid" id="${tab}Fields"></div>
    </section>`;

  const target = document.getElementById(`${tab}Fields`);
  renderObjectFields(target, [configKey], meta?.items || {}, state.config[configKey] || {});
}

function renderProviders(view = null) {
  const meta = state.schema.api_providers || {};
  const providers = Array.isArray(state.config.api_providers) ? state.config.api_providers : [];
  const templates = meta.templates || {};
  const templateOptions = Object.entries(templates)
    .map(([key, template]) => `<option value="${escapeHtml(key)}">${escapeHtml(template.name || key)}</option>`)
    .join("");

  els.panelMount.innerHTML = `
    <section class="config-workbench">
      <header class="workbench-head provider-head">
        <div>
          <span>Matrix</span>
          <h2>${escapeHtml(meta.description || "供应商矩阵")}</h2>
          <p>${escapeHtml(meta.hint || "配置一个或多个图像生成供应商。")}</p>
        </div>
        <div class="provider-toolbar">
          <select id="templateSelect">${templateOptions}</select>
          <button id="addProvider" class="primary-small" type="button">新增供应商</button>
        </div>
      </header>
      <div class="provider-list" id="providerList"></div>
    </section>`;

  const list = document.getElementById("providerList");
  if (!providers.length) {
    list.innerHTML = `<section class="empty-state"><b>还没有供应商</b><p>选择一个模板并新增，就能开始配置模型矩阵。</p></section>`;
  }

  providers.forEach((provider, index) => {
    const templateKey = provider.__template_key || Object.keys(templates)[0] || "gemini";
    const template = templates[templateKey] || {};
    const enabled = isProviderEnabled(provider);
    const item = document.createElement("details");
    item.className = `provider-card ${enabled ? "" : "disabled"}`.trim();
    item.dataset.providerIndex = String(index);
    item.open = Boolean(view?.open?.includes(index));
    item.innerHTML = `
      <summary class="provider-card-head">
        <div>
          <span>${escapeHtml(template.name || templateKey)}</span>
          <h3>${escapeHtml(provider.name || "未命名供应商")}</h3>
        </div>
        <div class="provider-actions">
          <button class="provider-toggle ${enabled ? "enabled" : "disabled"}" type="button" data-toggle-provider="${index}" aria-pressed="${enabled ? "true" : "false"}">${enabled ? "禁用" : "启用"}</button>
          <button type="button" data-duplicate="${index}">复制</button>
          <button type="button" data-delete="${index}">删除</button>
        </div>
      </summary>
      <div class="provider-card-body form-grid compact-grid" id="providerFields_${index}"></div>`;
    list.appendChild(item);
    renderObjectFields(
      document.getElementById(`providerFields_${index}`),
      ["api_providers", index],
      template.items || {},
      provider,
    );
  });

  document.getElementById("addProvider")?.addEventListener("click", () => {
    const key = document.getElementById("templateSelect")?.value || Object.keys(templates)[0];
    if (!key) return;
    const view = providerView();
    state.config.api_providers = [...providers, templateDefaults(key)];
    renderProviders(view);
    updateScorePanel();
  });

  els.panelMount.querySelectorAll("[data-toggle-provider]").forEach(button => {
    button.addEventListener("click", async event => {
      event.preventDefault();
      event.stopPropagation();
      const index = Number(button.dataset.toggleProvider);
      const provider = state.config.api_providers[index];
      if (!provider) return;
      const view = providerView();
      provider.enabled = provider.enabled === false;
      renderProviders(view);
      updateScorePanel();
      await saveAll();
    });
  });

  els.panelMount.querySelectorAll("[data-delete]").forEach(button => {
    button.addEventListener("click", event => {
      event.preventDefault();
      event.stopPropagation();
      const view = providerView();
      state.config.api_providers.splice(Number(button.dataset.delete), 1);
      renderProviders(view);
      updateScorePanel();
    });
  });

  els.panelMount.querySelectorAll("[data-duplicate]").forEach(button => {
    button.addEventListener("click", event => {
      event.preventDefault();
      event.stopPropagation();
      const index = Number(button.dataset.duplicate);
      const view = providerView();
      state.config.api_providers.splice(index + 1, 0, cloneValue(state.config.api_providers[index]));
      renderProviders(view);
      updateScorePanel();
    });
  });
  if (view) els.panelMount.scrollTop = view.scrollTop;
}

function templateDefaults(templateKey) {
  const template = state.schema.api_providers?.templates?.[templateKey] || {};
  const provider = { __template_key: templateKey, enabled: true };
  Object.entries(template.items || {}).forEach(([key, meta]) => {
    provider[key] = metaDefault(meta);
  });
  return provider;
}

function renderTools() {
  const meta = state.schema.enable_llm_tool || LOCAL_SCHEMA.enable_llm_tool;
  els.panelMount.innerHTML = `
    <section class="config-workbench">
      <header class="workbench-head">
        <span>Tools</span>
        <h2>${escapeHtml(meta.description || "启用 LLM 工具")}</h2>
        <p>${escapeHtml(meta.hint || TAB_META.tools[1])}</p>
      </header>
      <div class="form-grid">${renderList(["enable_llm_tool"], meta, state.config.enable_llm_tool || [])}</div>
    </section>`;
  bindList(["enable_llm_tool"], meta);
}

function renderRaw() {
  els.panelMount.innerHTML = `
    <section class="config-workbench">
      <header class="workbench-head">
        <span>Raw</span>
        <h2>原始配置</h2>
        <p>高级用户可以在这里核对完整配置快照。</p>
      </header>
      <pre class="raw-json" id="rawJson">${escapeHtml(JSON.stringify(state.config, null, 2))}</pre>
    </section>`;
}

function renderRawIfVisible() {
  const raw = document.getElementById("rawJson");
  if (raw) raw.textContent = JSON.stringify(state.config, null, 2);
}

function renderObjectFields(container, basePath, schemaItems, data) {
  if (!container) return;
  container.innerHTML = Object.entries(schemaItems || {}).map(([key, meta]) => {
    const path = [...basePath, key];
    const value = data?.[key] ?? metaDefault(meta);
    if (meta.type === "object") return renderObjectShell(path, meta);
    if (meta.type === "list") return renderList(path, meta, value);
    if (meta.type === "file") return renderImagePathList(path, meta, value);
    return renderScalar(path, meta, value);
  }).join("");

  Object.entries(schemaItems || {}).forEach(([key, meta]) => {
    const path = [...basePath, key];
    if (meta.type === "object") {
      renderObjectFields(document.getElementById(fieldId(path)), path, meta.items || {}, getByPath(path) || {});
    } else if (meta.type === "list") {
      bindList(path, meta);
    } else if (meta.type === "file") {
      bindImagePathList(path);
    } else {
      bindScalar(path, meta);
    }
  });
}

function renderObjectShell(path, meta) {
  return `
    <section class="field-card wide nested-card">
      <div class="field-label">${escapeHtml(meta.description || path.at(-1))}</div>
      ${meta.hint ? `<p class="field-hint">${escapeHtml(meta.hint)}</p>` : ""}
      <div class="form-grid compact-grid" id="${fieldId(path)}"></div>
    </section>`;
}

function renderScalar(path, meta, value) {
  const id = fieldId(path);
  if (meta.type === "bool") {
    return fieldWrap(meta, `
      <label class="switch-row">
        <input id="${id}" type="checkbox" ${value === true ? "checked" : ""} />
        <span class="switch-track"><span class="switch-thumb"></span></span>
        <b>${value === true ? "已开启" : "关闭"}</b>
      </label>`, false, "section");
  }

  if (Array.isArray(meta.options)) {
    return fieldWrap(meta, `
      <select id="${id}">
        ${meta.options.map(option => `<option value="${escapeHtml(option)}" ${String(value) === String(option) ? "selected" : ""}>${escapeHtml(option)}</option>`).join("")}
      </select>`);
  }

  if (meta.type === "text") {
    return fieldWrap(meta, `<textarea id="${id}" rows="4">${escapeHtml(value ?? "")}</textarea>`, true);
  }

  if ((meta.type === "int" || meta.type === "float") && meta.slider) {
    const step = meta.slider.step ?? (meta.type === "float" ? 0.1 : 1);
    const min = meta.slider.min ?? 0;
    const max = meta.slider.max ?? 100;
    return fieldWrap(meta, `
      <div class="range-row">
        <input id="${id}" type="range" min="${min}" max="${max}" step="${step}" value="${escapeHtml(value ?? min)}" />
        <input id="${id}_number" type="number" min="${min}" max="${max}" step="${step}" value="${escapeHtml(value ?? min)}" />
      </div>`);
  }

  const inputType = meta.type === "int" || meta.type === "float" ? "number" : "text";
  return fieldWrap(meta, `<input id="${id}" type="${inputType}" value="${escapeHtml(value ?? "")}" />`);
}

function fieldWrap(meta, inner, wide = false, tag = "label") {
  return `
    <${tag} class="field-card ${wide ? "wide" : ""}">
      <span class="field-label">${escapeHtml(meta.description || "")}</span>
      ${meta.hint ? `<small class="field-hint">${escapeHtml(meta.hint)}</small>` : ""}
      ${inner}
    </${tag}>`;
}

function bindScalar(path, meta) {
  const id = fieldId(path);
  const input = document.getElementById(id);
  if (!input) return;

  if (meta.type === "bool") {
    input.addEventListener("change", () => {
      const scrollTop = els.panelMount?.scrollTop || 0;
      setByPath(path, input.checked);
      const label = input.closest(".switch-row")?.querySelector("b");
      if (label) label.textContent = input.checked ? "已开启" : "关闭";
      if (els.panelMount) els.panelMount.scrollTop = scrollTop;
    });
    return;
  }

  const parse = value => {
    if (meta.type === "int") return Number.parseInt(value || "0", 10);
    if (meta.type === "float") return Number.parseFloat(value || "0");
    return value;
  };

  if ((meta.type === "int" || meta.type === "float") && meta.slider) {
    const number = document.getElementById(`${id}_number`);
    const sync = source => {
      const next = parse(source.value);
      if (number && source !== number) number.value = source.value;
      if (source !== input) input.value = source.value;
      setByPath(path, Number.isNaN(next) ? 0 : next);
    };
    input.addEventListener("input", () => sync(input));
    number?.addEventListener("input", () => sync(number));
    return;
  }

  input.addEventListener("input", () => setByPath(path, parse(input.value)));
  input.addEventListener("change", () => setByPath(path, parse(input.value)));
}

function renderList(path, meta, value) {
  const id = fieldId(path);
  const list = Array.isArray(value) ? value : [];
  if (Array.isArray(meta.options)) {
    return fieldWrap(meta, `
      <div class="choice-grid" id="${id}">
        ${meta.options.map(option => `
          <label class="choice-row">
            <input type="checkbox" value="${escapeHtml(option)}" ${list.includes(option) ? "checked" : ""} />
            <span>${escapeHtml(option)}</span>
          </label>`).join("")}
      </div>`, true);
  }

  const isSecret = path.some(part => String(part).toLowerCase().includes("api_keys"));
  return fieldWrap(meta, `
    <div class="list-editor" id="${id}">
      ${list.map((item, index) => listRow(item, index, isSecret)).join("")}
      <button class="add-line" type="button" data-add>添加一项</button>
    </div>`, true);
}

function listRow(item, index, isSecret) {
  return `
    <div class="list-row">
      <input type="${isSecret ? "password" : "text"}" value="${escapeHtml(item)}" data-index="${index}" />
      <button type="button" data-remove="${index}">删除</button>
    </div>`;
}

function bindList(path, meta) {
  const box = document.getElementById(fieldId(path));
  if (!box) return;

  if (Array.isArray(meta.options)) {
    box.querySelectorAll("input[type='checkbox']").forEach(input => {
      input.addEventListener("change", () => {
        const values = [...box.querySelectorAll("input[type='checkbox']:checked")].map(item => item.value);
        setByPath(path, values);
      });
    });
    return;
  }

  const sync = () => {
    const values = [...box.querySelectorAll("input[data-index]")]
      .map(input => input.value)
      .filter(value => value.trim());
    setByPath(path, values);
  };

  box.querySelectorAll("input[data-index]").forEach(input => input.addEventListener("input", sync));
  box.querySelectorAll("[data-remove]").forEach(button => {
    button.addEventListener("click", () => {
      const values = Array.isArray(getByPath(path)) ? [...getByPath(path)] : [];
      values.splice(Number(button.dataset.remove), 1);
      setByPath(path, values);
      renderPanelKeepingProviderView();
    });
  });
  box.querySelector("[data-add]")?.addEventListener("click", () => {
    const values = Array.isArray(getByPath(path)) ? [...getByPath(path), ""] : [""];
    setByPath(path, values);
    renderPanelKeepingProviderView();
  });
}

function renderImagePathList(path, meta, value) {
  const id = fieldId(path);
  const values = imageValues(value);
  return fieldWrap(meta, `
    <div class="image-list" id="${id}">
      ${values.length ? values.map((item, index) => `
        <div class="image-row">
          <span>${escapeHtml(fileLabel(item))}</span>
          <button type="button" data-replace="${index}">重选</button>
          <button type="button" data-remove="${index}">删除</button>
        </div>`).join("") : `<p class="empty-inline">未选择图片</p>`}
      <button class="add-line primary-line" type="button" data-pick-add>选择图片</button>
    </div>`, true);
}

function bindImagePathList(path) {
  const box = document.getElementById(fieldId(path));
  if (!box) return;

  box.querySelectorAll("[data-remove]").forEach(button => {
    button.addEventListener("click", () => {
      const values = imageValues(getByPath(path));
      values.splice(Number(button.dataset.remove), 1);
      setByPath(path, values);
      renderPanelKeepingProviderView();
    });
  });

  box.querySelectorAll("[data-replace]").forEach(button => {
    button.addEventListener("click", async () => {
      await pickAndSetImage(path, Number(button.dataset.replace));
    });
  });

  box.querySelector("[data-pick-add]")?.addEventListener("click", async () => {
    await pickAndSetImage(path);
  });
}

async function pickAndSetImage(path, replaceIndex = null) {
  try {
    const picked = await chooseImageFile();
    if (!picked) return;
    const imagePath = await uploadImageOnly(picked);
    const values = imageValues(getByPath(path));
    if (replaceIndex === null) values.push(imagePath);
    else values[replaceIndex] = imagePath;
    setByPath(path, values);
    renderPanelKeepingProviderView();
    showToast("图片已写入配置，记得保存全部");
  } catch (error) {
    showToast(`选图失败：${error.message}`);
  }
}

function fileLabel(value) {
  return String(value || "").split(/[\\/]/).pop() || String(value || "");
}

function chooseImageFile() {
  return new Promise(resolve => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.hidden = true;
    document.body.appendChild(input);
    input.addEventListener("change", () => {
      const file = input.files?.[0] || null;
      input.remove();
      resolve(file);
    }, { once: true });
    input.click();
  });
}

function readFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(reader.error || new Error("读取图片失败"));
    reader.readAsDataURL(file);
  });
}

async function uploadImageOnly(file) {
  if (!file) return "";
  if (!String(file.type || "").startsWith("image/")) throw new Error("请选择图片文件");
  const data = await apiPost("settings-v2/image/upload", {
    filename: file.name,
    content_type: file.type,
    data: await readFile(file),
  });
  return data.path || "";
}

function updateScorePanel() {
  const data = metrics();
  const progress = clamp((data.score - 300) / 550, 0, 1);
  const deltaText = `${data.delta >= 0 ? "+" : ""}${data.delta} pts`;
  els.scoreTitle.textContent = data.currentModel === "未指定模型" ? "Hello, AstrBot" : "Hello, Image Lab";
  els.scoreHint.textContent = data.currentModel === "未指定模型"
    ? "这里是你的生图控制台"
    : `当前模型：${data.currentModel}`;
  const modeHint = scoreModeSummary(state.scoreMode, data);
  if (modeHint) els.scoreHint.textContent = modeHint;
  updateScoreModeButtons();
  els.scoreNumber.textContent = String(Math.round(data.score));
  els.scoreDelta.textContent = deltaText;
  els.scoreRing.style.setProperty("--score-progress", String(progress));
  els.scoreRing.style.setProperty("--score-angle", `${Math.round(88 + progress * 164)}deg`);
  els.insightProviders.textContent = String(data.providerCount);
  els.insightModels.textContent = String(data.modelCount);
  els.insightConcurrency.textContent = String(data.concurrency || 0);
  els.insightTimeout.textContent = `${data.timeout || 0}s`;
  els.insightLimits.textContent = data.limitsEnabled ? "On" : "Off";
  els.insightImages.textContent = String(data.imageCount);
  updateSystemInfoDeck(data);
}

function updateSystemInfoDeck(data = metrics()) {
  const now = new Date();
  const clock = new Intl.DateTimeFormat("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(now);
  const date = new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
  }).format(now);
  const status = data.providerCount && data.modelCount ? "Online" : "Standby";
  const summary = `${data.providerCount} provider · ${data.modelCount} models · ${data.toolCount} tools`;

  els.runtimeClock.textContent = clock;
  els.runtimeDate.textContent = `${date} · Local`;
  els.systemStatus.textContent = status;
  els.systemSummary.textContent = summary;
}

async function saveAll() {
  const view = providerView();
  els.saveAllBtn.disabled = true;
  els.quickSaveBtn.disabled = true;
  try {
    const data = await apiPost("settings-v2/config", { config: state.config });
    state.config = data.config || state.config;
    ensureConfigShape();
    if (view) {
      renderPanel(view);
      updateScorePanel();
      updateNavState();
    } else {
      renderAll();
    }
    showToast("全部配置已保存");
  } catch (error) {
    showToast(`保存失败：${error.message}`);
  } finally {
    els.saveAllBtn.disabled = false;
    els.quickSaveBtn.disabled = false;
  }
}

async function reloadConfig() {
  els.reloadBtn.disabled = true;
  try {
    await load();
    showToast("配置已刷新");
  } catch (error) {
    showToast(`刷新失败：${error.message}`);
  } finally {
    els.reloadBtn.disabled = false;
  }
}

async function loadUiState() {
  try {
    const data = await apiGet("settings-v2/ui-state");
    const ui = data.state || {};
    state.ui = { ...state.ui, ...ui };
  } catch (error) {
    console.warn("load ui state failed", error);
  }
  applyPalette(state.ui.palette_mode || "luxury");
  applyAppearance(state.ui.appearance_mode || "light");
}

async function saveUiState(patch) {
  try {
    const data = await apiPost("settings-v2/ui-state", patch);
    state.ui = { ...state.ui, ...(data.state || patch) };
  } catch (error) {
    showToast(`界面状态保存失败：${error.message}`);
  }
}

function applyPalette(mode = "luxury") {
  const next = PALETTE_MODES.includes(mode) ? mode : "luxury";
  state.ui.palette_mode = next;
  document.documentElement.dataset.palette = next;
  els.paletteModeLabel.textContent = PALETTE_LABELS[next] || "荧绿";
}

function resolveAppearance(mode) {
  if (mode === "light" || mode === "dark") return mode;
  return window.matchMedia?.("(prefers-color-scheme: dark)")?.matches ? "dark" : "light";
}

function applyAppearance(mode = "light") {
  const next = APPEARANCE_MODES.includes(mode) ? mode : "light";
  state.ui.appearance_mode = next;
  document.documentElement.dataset.appearance = next;
  document.documentElement.dataset.theme = resolveAppearance(next);
  els.appearanceModeLabel.textContent = APPEARANCE_LABELS[next] || "浅色";
}

async function cyclePalette() {
  const index = PALETTE_MODES.indexOf(state.ui.palette_mode || "luxury");
  applyPalette(PALETTE_MODES[(index + 1) % PALETTE_MODES.length]);
  await saveUiState({ palette_mode: state.ui.palette_mode });
}

async function cycleAppearance() {
  const index = APPEARANCE_MODES.indexOf(state.ui.appearance_mode || "light");
  applyAppearance(APPEARANCE_MODES[(index + 1) % APPEARANCE_MODES.length]);
  await saveUiState({ appearance_mode: state.ui.appearance_mode });
}

function bindJumpActions() {
  els.panelMount.querySelectorAll("[data-tab-jump]").forEach(button => {
    button.addEventListener("click", () => switchTab(button.dataset.tabJump));
  });
}

const SCORE_MODE_TO_TAB = {
  auto: "overview",
  model: "providers",
  safety: "limits",
};

const TAB_TO_SCORE_MODE = {
  overview: "auto",
  providers: "model",
  limits: "safety",
};

function updateScoreModeButtons() {
  els.providerTabs?.querySelectorAll("[data-score-mode]").forEach(button => {
    const active = button.dataset.scoreMode === state.scoreMode;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", active ? "true" : "false");
  });
}

function setScoreMode(mode) {
  if (!SCORE_MODE_TO_TAB[mode]) return;
  state.scoreMode = mode;
  updateScoreModeButtons();
  const targetTab = SCORE_MODE_TO_TAB[mode];
  if (state.activeTab !== targetTab) {
    switchTab(targetTab);
  } else {
    updateScorePanel();
  }
}

function scoreModeSummary(mode, data) {
  if (mode === "model") {
    return `模型矩阵：${data.modelCount} 个模型 · ${data.providerCount} 个供应商`;
  }
  if (mode === "safety") {
    return `安全策略：${data.limitsEnabled ? "额度已开启" : "额度未开启"} · ${data.toolCount} 个工具`;
  }
  return "";
}

function updateNavState() {
  document.querySelectorAll("[data-tab]").forEach(button => {
    button.classList.toggle("active", button.dataset.tab === state.activeTab);
  });
  els.body.dataset.activeTab = state.activeTab;
  updateScoreModeButtons();
}

function switchTab(tab) {
  if (!TAB_META[tab]) return;
  state.activeTab = tab;
  state.scoreMode = TAB_TO_SCORE_MODE[tab] || "auto";
  renderPanel();
  updateScorePanel();
  updateNavState();
}

function bindGlobalActions() {
  document.querySelectorAll("[data-tab]").forEach(button => {
    button.addEventListener("click", () => switchTab(button.dataset.tab));
  });
  document.querySelectorAll("[data-tab-link]").forEach(link => {
    link.addEventListener("click", event => {
      event.preventDefault();
      switchTab(link.dataset.tabLink);
    });
  });
  els.saveAllBtn?.addEventListener("click", saveAll);
  els.quickSaveBtn?.addEventListener("click", saveAll);
  els.reloadBtn?.addEventListener("click", reloadConfig);
  els.paletteToggleBtn?.addEventListener("click", cyclePalette);
  els.appearanceToggleBtn?.addEventListener("click", cycleAppearance);
  els.providerTabs?.querySelectorAll("[data-score-mode]").forEach(button => {
    button.addEventListener("click", () => setScoreMode(button.dataset.scoreMode));
  });
}

async function load() {
  await loadUiState();
  const data = await apiGet("settings-v2/bootstrap");
  state.schema = data.schema || cloneValue(LOCAL_SCHEMA);
  state.config = data.config || cloneValue(LOCAL_CONFIG);
  ensureConfigShape();
  renderAll();
}

async function boot() {
  bindGlobalActions();
  window.setInterval(() => updateSystemInfoDeck(), 30000);
  try {
    await load();
    showToast(bridge ? "配置已载入" : "本地预览模式已载入");
  } catch (error) {
    state.schema = cloneValue(LOCAL_SCHEMA);
    state.config = cloneValue(LOCAL_CONFIG);
    renderAll();
    showToast(`载入失败，已进入本地预览：${error.message}`);
  }
}

boot();
