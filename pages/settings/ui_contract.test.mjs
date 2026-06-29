import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const html = readFileSync(resolve(here, "index.html"), "utf8");
const js = readFileSync(resolve(here, "app.js"), "utf8");
const css = readFileSync(resolve(here, "styles.css"), "utf8");
const configManager = readFileSync(resolve(here, "..", "..", "core", "config_manager.py"), "utf8");

const checks = [
  ["app shell wrapper", html.includes('class="app-shell"')],
  ["release assets are cache busted", html.includes("styles.css?v=20260628_provider_runtime") && html.includes("app.js?v=20260628_provider_runtime")],
  ["top capsule navigation", html.includes('class="top-nav"')],
  ["reference-style stage grid", html.includes('class="dashboard-stage"')],
  ["right status score panel", html.includes('class="score-panel"')],
  ["dense insight metric cards", html.includes('class="insight-grid"')],
  ["bottom system information deck", html.includes('class="system-deck"') && js.includes("updateSystemInfoDeck") && css.includes(".system-deck") && !html.includes("signal-strip") && !css.includes(".signal-strip")],
  ["full viewport app shell", /body\s*\{[\s\S]*padding:\s*0;[\s\S]*overflow:\s*hidden;/.test(css) && /\.app-shell\s*\{[\s\S]*width:\s*100vw;[\s\S]*height:\s*100vh;[\s\S]*box-shadow:\s*none;/.test(css)],
  ["document scroll is locked to app shell", /html\s*\{[^}]*overflow:\s*hidden;/.test(css)],
  ["document root is not fixed", !/html,\s*body\s*\{[^}]*position:\s*fixed;/.test(css) && !/html\s*\{[^}]*position:\s*fixed;/.test(css)],
  ["old custom background path removed", !html.includes("customBackground") && !js.includes("custom_background_url") && !js.includes("applyCustomBackground") && !css.includes("--custom-bg-image") && !css.includes("data-background-mode")],
  ["compact vertical dashboard", css.includes("--topbar-height: 62px") && css.includes("--score-meter-height: 240px")],
  ["reference-like segmented score panel", css.includes("--score-meter-height: 240px") && html.includes('class="score-ring-graphic"') && html.includes('id="scoreWarmGradient"') && html.includes('class="score-segment score-warm"') && html.includes('class="score-segment score-green" d="M 223.5 62.4 A 116 116 0 0 1 292.6 198.1"') && html.includes('class="score-track" d="M 71.0 209.7 A 116 116 0 1 1 289.0 209.7"') && !html.includes("score-ghost") && /\.score-ring\s*\{[\s\S]*width:\s*360px;[\s\S]*height:\s*246px;/.test(css) && /\.score-segment\s*\{[\s\S]*stroke-width:\s*26;[\s\S]*stroke-linecap:\s*round;/.test(css) && /\.score-warm\s*\{[\s\S]*stroke:\s*url\("#scoreWarmGradient"\);/.test(css) && /\.score-cta\s*\{[\s\S]*transform:\s*translateY\(-10px\);/.test(css)],
  ["score mode controls are functional", html.includes('data-score-mode="auto"') && html.includes('data-score-mode="model"') && html.includes('data-score-mode="safety"') && js.includes("setScoreMode") && js.includes("SCORE_MODE_TO_TAB") && js.includes("scoreModeSummary")],
  ["timeline status dots use distinct colors", css.includes(".timeline-step:nth-child(1) { --step-color: var(--accent-2); }") && css.includes(".timeline-step:nth-child(2) { --step-color: var(--accent); }") && css.includes(".timeline-step:nth-child(3) { --step-color: var(--accent-3); }") && !css.includes("box-shadow: inset 0 0 0 11px #111")],
  ["interactive dashboard renderer", js.includes("renderOverviewDashboard")],
  ["score panel updater", js.includes("updateScorePanel")],
  ["boolean switches avoid nested labels", /if \(meta\.type === "bool"\)[\s\S]*<label class="switch-row">[\s\S]*`, false, "section"\);/.test(js)],
  ["switch input is anchored locally", /\.switch-row\s*\{[^}]*position:\s*relative;/.test(css) && /\.switch-row input\s*\{[^}]*inset:\s*0;[^}]*width:\s*54px;[^}]*height:\s*30px;[^}]*pointer-events:\s*auto;/.test(css)],
  ["providers render collapsed details", js.includes('document.createElement("details")') && js.includes('provider-card ${enabled ? "" : "disabled"}') && js.includes('<summary class="provider-card-head">') && css.includes(".provider-card[open]")],
  ["provider enabled toggle is wired", js.includes("data-toggle-provider") && js.includes("provider.enabled = provider.enabled === false") && css.includes(".provider-toggle")],
  ["provider enabled toggle auto saves", /data-toggle-provider[\s\S]*async event[\s\S]*provider\.enabled = provider\.enabled === false[\s\S]*await saveAll\(\)/.test(js)],
  ["disabled providers do not count as active", js.includes("const activeProviders = providers.filter(isProviderEnabled)") && js.includes("providerCount: activeProviders.length")],
  ["backend skips disabled providers", configManager.includes('self._get_bool(provider_item, "enabled", True)') && configManager.includes("continue") && configManager.includes('"enabled"')],
  ["provider edits preserve expanded details", js.includes("function providerView") && js.includes("function renderPanelKeepingProviderView") && js.includes("renderProviders(view)") && /async function saveAll\(\)[\s\S]*const view = providerView\(\)[\s\S]*renderPanel\(view\)/.test(js)],
  ["light paper design tokens", css.includes("--paper")],
  ["responsive dashboard breakpoint", css.includes("@media (max-width: 900px)")],
];

const failures = checks.filter(([, passed]) => !passed).map(([name]) => name);

if (failures.length) {
  console.error("Settings UI contract failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`Settings UI contract passed (${checks.length} checks).`);
