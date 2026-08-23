import { GameManager } from './application/GameManager.js';
import { ArchitectureLabel } from './presentation/ArchitectureLabel.js';
import { WelcomeScreen } from './presentation/WelcomeScreen.js';
import { IntroModal } from './presentation/IntroModal.js';
import { TutorialHints } from './presentation/TutorialHints.js';
import { Storage } from './infrastructure/Storage.js';
import { architectures } from './data/architectures.js';

console.log('[GAME] Script loaded, initializing');

window.addEventListener('error', (e) => {
  const loc = e.filename ? ` (${e.filename.split('/').pop()}:${e.lineno}:${e.colno})` : '';
  showErrorOverlay((e.message || 'Error desconocido') + loc + (e.error?.stack ? `\n${e.error.stack}` : ''));
});
window.addEventListener('unhandledrejection', (e) => {
  showErrorOverlay(String(e.reason || 'Promise rechazada'));
});

function showErrorOverlay(message) {
  let overlay = document.getElementById('error-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'error-overlay';
    overlay.style.cssText = 'position:fixed;bottom:12px;left:12px;right:12px;z-index:99999;background:rgba(80,10,10,0.95);color:#ffdada;padding:12px 16px;border-radius:8px;font:13px/1.5 monospace;white-space:pre-wrap;max-height:40vh;overflow:auto;border:1px solid rgba(255,120,120,0.5);';
    document.body.appendChild(overlay);
  }
  overlay.textContent += (overlay.textContent ? '\n\n' : '') + '[ERROR] ' + message;
}

let game = null;
let tutorialHints = null;
let introModal = null;

let toastTimer = null;
function showToast(message, isError = false) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.toggle('error', isError);
  toast.classList.remove('hidden');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.add('hidden'), 3200);
}

function initGame() {
  console.log(`[BUILD ${GAME_VERSION}] Script cargado`);

  // Marcador visible de la build en ejecución (abajo a la derecha)
  const tag = document.createElement('div');
  tag.textContent = 'v' + GAME_VERSION;
  tag.style.cssText = 'position:fixed;bottom:8px;right:12px;z-index:9999;font-size:11px;color:#7fa89a;text-shadow:0 1px 2px #000;pointer-events:none;';
  document.body.appendChild(tag);

  const badge = document.querySelector('.version-badge');
  if (badge) badge.textContent = `ARCHITECTURE WORLD · v${GAME_VERSION}`;

  const savedData = Storage.load();
  const hasSeenIntro = Storage.hasSeenIntro();
  const isReturningUser = hasSeenIntro && savedData.discovered.length > 0;

  const stats = {
    discovered: savedData.discovered.length,
    completed: savedData.completed || 0,
    level: savedData.level || 1,
    xp: savedData.xp || 0,
    xpMax: savedData.xpMax || 1000
  };

  new WelcomeScreen(
    () => onWelcomeComplete(isReturningUser),
    () => openCompendium(),
    () => openSettings(),
    isReturningUser,
    stats,
    GAME_VERSION
  );
}

function onWelcomeComplete(isReturningUser) {
  console.log('[GAME] Welcome screen complete, initializing GameManager');
  try {
    game = new GameManager();
    console.log('[GAME] GameManager created successfully');
    ArchitectureLabel.createAll(game.renderer.scene);
    console.log('[GAME] Architecture labels created');
    window.game = game;

    setupSettingsUI(game);
    setupGlobalEvents(game);

    if (!isReturningUser) {
      showIntroModal();
    } else {
      startTutorialHints();
    }
  } catch (err) {
    console.error('[GAME] Error initializing GameManager:', err);
    throw err;
  }
}

function showIntroModal() {
  introModal = new IntroModal(() => {
    startTutorialHints();
    showMissionIndicator();
  });
}

function startTutorialHints() {
  tutorialHints = new TutorialHints();
  tutorialHints.start();
}

function showMissionIndicator() {
  if (game && tutorialHints) {
    const firstArch = architectures[0];
    tutorialHints.showMissionIndicator(firstArch.position);

    const checkProximity = setInterval(() => {
      if (!game || !game.player) {
        clearInterval(checkProximity);
        return;
      }
      const dx = game.player.position.x - firstArch.position.x;
      const dz = game.player.position.z - firstArch.position.z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < 30) {
        clearInterval(checkProximity);
        tutorialHints.hideMissionIndicator();
      }
    }, 500);
  }
}

function openCompendium() {
  if (game && game.compendium) {
    game.compendium.toggle();
  }
}

function openSettings() {
  const panel = document.getElementById('settings-panel');
  if (panel) panel.classList.toggle('hidden');
}

const GAME_VERSION = '1.1.2';
const SETTINGS_KEY = 'architecture_world_settings';

const SETTINGS_DEFAULTS = {
  'opt-bloom': true,
  'opt-shadows': true,
  'opt-grass': true,
  'opt-fireflies': true,
  'opt-clouds': true,
  'opt-reflections': true,
  'opt-reflect-int': 0.35,
  'opt-exposure': 1.1,
  'opt-fog': 0.0055,
  'opt-shadow-map': '2048',
  'opt-resolution': 'auto',
  'opt-fps-limit': '0',
  'opt-sensitivity': 1,
  'opt-speed': 4,
  'opt-fov': 55,
  'opt-day-auto': true,
  'opt-day-time': 12,
};

function loadSettings() {
  try {
    return JSON.parse(localStorage.getItem(SETTINGS_KEY)) || {};
  } catch {
    return {};
  }
}

function saveSettings(settings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

function setupSettingsUI(game) {
  const panel = document.getElementById('settings-panel');
  const helpPanel = document.getElementById('help-panel');
  const btnOpen = document.getElementById('settings-btn');
  const btnHelp = document.getElementById('help-btn');

  const togglePanel = (el) => el && el.classList.toggle('hidden');
  const closePanel = (el) => el && el.classList.add('hidden');

  if (btnOpen) btnOpen.addEventListener('click', () => { closePanel(helpPanel); togglePanel(panel); });
  if (btnHelp) btnHelp.addEventListener('click', () => { closePanel(panel); togglePanel(helpPanel); });
  document.querySelectorAll('.panel-close').forEach((btn) => {
    btn.addEventListener('click', () => closePanel(document.getElementById(btn.dataset.close)));
  });

  // Teclas globales: ESC cierra paneles, H alterna la ayuda
  window.addEventListener('keydown', (e) => {
    const modalOpen = game.modal && typeof game.modal.isVisible === 'function' && game.modal.isVisible();
    if (e.key === 'Escape' && !modalOpen) {
      if (helpPanel && !helpPanel.classList.contains('hidden')) closePanel(helpPanel);
      else if (panel) panel.classList.toggle('hidden');
    }
    if ((e.key === 'h' || e.key === 'H') && !modalOpen
        && !document.pointerLockElement) {
      closePanel(panel);
      togglePanel(helpPanel);
    }
  });

  const renderer = game.renderer;
  const env = game.environment;
  const controller = game.controller;

  const outputs = {
    'opt-exposure': v => v.toFixed(2),
    'opt-fog': v => v.toFixed(4),
    'opt-sensitivity': v => Number(v).toFixed(1),
    'opt-speed': v => Number(v).toFixed(1),
    'opt-fov': v => `${Math.round(v)}°`,
    'opt-day-time': v => `${v}h`,
    'opt-reflect-int': v => Number(v).toFixed(2),
  };

  const applySetting = (id, value) => {
    const val = typeof value === 'string' && !isNaN(value) && value !== '' ? parseFloat(value) : value;
    switch (id) {
      case 'opt-bloom': renderer.setBloom(!!val); break;
      case 'opt-shadows': renderer.setShadows(!!val); break;
      case 'opt-grass': env.setGrassVisible(!!val); break;
      case 'opt-fireflies': env.setFirefliesVisible(!!val); break;
      case 'opt-clouds': env.setCloudsVisible(!!val); break;
      case 'opt-reflections': renderer.setReflections(!!val); break;
      case 'opt-reflect-int': renderer.setReflectionsIntensity(val); break;
      case 'opt-exposure': renderer.setExposure(val); break;
      case 'opt-fog': renderer.setFogDensity(val); break;
      case 'opt-shadow-map': renderer.setShadowMapSize(String(val)); break;
      case 'opt-resolution': renderer.setResolutionMode(val); break;
      case 'opt-fps-limit': renderer.setFpsLimit(val); break;
      case 'opt-sensitivity': controller.setMouseSensitivity(val); break;
      case 'opt-speed': game.player.speed = val; break;
      case 'opt-fov': renderer.setFOV(val); break;
      case 'opt-day-auto': renderer.setDayAuto(!!val); break;
      case 'opt-day-time': renderer.setDayTime(val); break;
    }
    const outEl = { 'opt-exposure': 'exp-val', 'opt-fog': 'fog-val', 'opt-sensitivity': 'sens-val', 'opt-speed': 'speed-val', 'opt-fov': 'fov-val', 'opt-day-time': 'day-val', 'opt-reflect-int': 'reflect-int-val' }[id];
    if (outEl && outputs[id]) document.getElementById(outEl).textContent = outputs[id](val);
    if (id === 'opt-day-auto') {
      const slider = document.getElementById('opt-day-time');
      if (slider) slider.disabled = !!val;
    }
  };

  const persist = () => {
    const s = {};
    for (const id of Object.keys(SETTINGS_DEFAULTS)) {
      const el = document.getElementById(id);
      if (!el) continue;
      s[id] = el.type === 'checkbox' ? el.checked : el.value;
    }
    saveSettings(s);
  };

  const bindControl = (id) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener(el.type === 'checkbox' || el.tagName === 'SELECT' ? 'change' : 'input', (e) => {
      const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
      applySetting(id, value);
      persist();
    });
  };

  Object.keys(SETTINGS_DEFAULTS).forEach(bindControl);

  // Restaurar ajustes guardados
  const saved = loadSettings();
  Object.keys(SETTINGS_DEFAULTS).forEach((id) => {
    const el = document.getElementById(id);
    if (!el) return;
    const value = saved[id] !== undefined ? saved[id] : SETTINGS_DEFAULTS[id];
    if (el.type === 'checkbox') el.checked = value;
    else el.value = value;
    applySetting(id, value);
  });

  // Restablecer
  document.getElementById('opt-reset')?.addEventListener('click', () => {
    localStorage.removeItem(SETTINGS_KEY);
    Object.keys(SETTINGS_DEFAULTS).forEach((id) => {
      const el = document.getElementById(id);
      if (!el) return;
      if (el.type === 'checkbox') el.checked = SETTINGS_DEFAULTS[id];
      else el.value = SETTINGS_DEFAULTS[id];
      applySetting(id, SETTINGS_DEFAULTS[id]);
    });
    saveSettings(readCurrentSettings());
    showToast('Opciones restablecidas');
  });

  // --- Gestión de partida: exportar / importar progreso ---
  const saveStatus = document.getElementById('save-status');

  function refreshSaveStatus() {
    if (!saveStatus) return;
    const data = Storage.load();
    const n = (data.discovered || []).length;
    saveStatus.textContent = `Progreso: ${n}/6 estructuras · nivel ${data.level || 1} · guardado automático`;
  }
  refreshSaveStatus();
  window.addEventListener('arch-discovered', refreshSaveStatus);

  document.getElementById('opt-export')?.addEventListener('click', async () => {
    const raw = localStorage.getItem(Storage.KEY);
    if (!raw) { showToast('No hay progreso que exportar', true); return; }
    try {
      await navigator.clipboard.writeText(btoa(unescape(encodeURIComponent(raw))));
      showToast('Progreso copiado al portapapeles ✓');
    } catch {
      showToast('No se pudo acceder al portapapeles', true);
    }
  });

  document.getElementById('opt-import')?.addEventListener('click', async () => {
    try {
      const text = await navigator.clipboard.readText();
      const json = decodeURIComponent(escape(atob(text.trim())));
      const data = JSON.parse(json);
      if (!Array.isArray(data.discovered)) throw new Error('formato');
      Storage.save(data);
      showToast('Progreso importado. Reinicia para aplicarlo.');
      refreshSaveStatus();
    } catch {
      showToast('Portapapeles sin una partida válida', true);
    }
  });

  function readCurrentSettings() {
    const s = {};
    for (const id of Object.keys(SETTINGS_DEFAULTS)) {
      const el = document.getElementById(id);
      if (!el) continue;
      s[id] = el.type === 'checkbox' ? el.checked : el.value;
    }
    return s;
  }
}

function setupGlobalEvents(game) {
  window.addEventListener('arch-discovered', (e) => {
    const arch = e.detail;
    if (tutorialHints) {
      tutorialHints.hideMissionIndicator();
    }
    console.log('[GAME] Architecture discovered:', arch.name);
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initGame);
} else {
  initGame();
}
