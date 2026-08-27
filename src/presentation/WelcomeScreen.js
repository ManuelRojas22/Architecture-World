/**
 * @file WelcomeScreen.js
 * @description Pantalla de bienvenida con 4 fases: intro animada, menú principal,
 * pantalla de continuar (usuarios recurrentes) y pantalla de carga simulada.
 * Incluye sistema de partículas en Canvas 2D, vista previa de arquitecturas
 * y gestión de stats del jugador.
 */

import { Storage } from '../infrastructure/Storage.js';
import { architectures } from '../data/architectures.js';

/**
 * @class WelcomeScreen
 * @description Interfaz completa de bienvenida que se muestra antes del juego.
 * Gestiona transiciones entre fases con animaciones CSS y un canvas de
 * partículas de fondo con líneas técnicas rotativas.
 */
export class WelcomeScreen {
  /**
   * @param {() => void} onStart - Callback al iniciar el juego
   * @param {() => void} onCompendium - Callback al abrir compendio
   * @param {() => void} onSettings - Callback al abrir configuración
   * @param {boolean} isReturningUser - true si tiene progreso guardado
   * @param {{discovered: number, completed: number, level: number, xp: number, xpMax: number}} stats
   *   Estadísticas del jugador (solo para usuarios recurrentes)
   * @param {string} [version='1.1.2'] - Versión del juego
   */
  constructor(onStart, onCompendium, onSettings, isReturningUser, stats, version) {
    this.onStart = onStart;
    this.onCompendium = onCompendium;
    this.onSettings = onSettings;
    this.isReturningUser = isReturningUser;
    this.version = version || '1.1.2';
    this.stats = stats || { discovered: 0, completed: 0, level: 1, xp: 0, xpMax: 1000 };
    this.element = null;
    this.currentPhase = 'intro';
    this.transitioned = false;
    this.hidden = false;
    this.animationId = null;
    this.particles = [];
    this.techLines = [];
    this.createElement();
    document.body.appendChild(this.element);
    this.bindEvents();
    this.startIntro();
  }

  /**
   * Crea el elemento DOM completo con todas las fases:
   * intro, main, returning, loading.
   */
  createElement() {
    this.element = document.createElement('div');
    this.element.id = 'welcome-screen';
    this.element.className = 'welcome-screen';
    this.element.innerHTML = `
      <div class="welcome-bg">
        <canvas id="welcome-canvas"></canvas>
        <div class="welcome-vignette"></div>
      </div>
      <div class="welcome-content" id="welcome-content">
        <div class="welcome-intro" id="welcome-intro">
          <div class="intro-logo">
            <svg class="logo-svg" viewBox="0 0 120 120" fill="none">
              <circle cx="60" cy="60" r="54" stroke="url(#logoGlow)" stroke-width="3" fill="rgba(45,107,196,0.08)"/>
              <path d="M30 60 L52 78 L90 38" stroke="url(#logoGlow)" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
              <defs>
                <linearGradient id="logoGlow" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stop-color="#2d6bc4"/>
                  <stop offset="50%" stop-color="#00d4ff"/>
                  <stop offset="100%" stop-color="#65d6b3"/>
                </linearGradient>
              </defs>
            </svg>
          </div>
          <h1 class="intro-title">ARCHITECTURE WORLD</h1>
          <p class="intro-subtitle">Explora. Comprende. Construye.</p>
        </div>

        <div class="welcome-main hidden" id="welcome-main">
          <div class="main-header">
            <div class="main-logo">
              <svg class="logo-svg-small" viewBox="0 0 80 80" fill="none">
                <circle cx="40" cy="40" r="36" stroke="url(#logoGlowSmall)" stroke-width="2.5" fill="rgba(45,107,196,0.1)"/>
                <path d="M20 40 L35 50 L60 25" stroke="url(#logoGlowSmall)" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
                <defs>
                  <linearGradient id="logoGlowSmall" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="#2d6bc4"/>
                    <stop offset="50%" stop-color="#00d4ff"/>
                    <stop offset="100%" stop-color="#65d6b3"/>
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <h1 class="main-title">ARCHITECTURE WORLD</h1>
            <p class="main-subtitle">Explora el mundo de las arquitecturas de software</p>
          </div>

          <div class="main-buttons" id="main-buttons">
            <button class="main-btn primary" id="btn-start" data-action="start">
              <span class="btn-icon">▶</span>
              <span class="btn-text">
                <span class="btn-label">COMENZAR A EXPLORAR</span>
                <span class="btn-desc">Inicia tu viaje arquitectónico</span>
              </span>
            </button>
            <button class="main-btn secondary" id="btn-compendium" data-action="compendium">
              <span class="btn-icon">📖</span>
              <span class="btn-text">
                <span class="btn-label">COMPENDIO</span>
                <span class="btn-desc">Arquitecturas descubiertas</span>
              </span>
            </button>
            <button class="main-btn secondary" id="btn-settings" data-action="settings">
              <span class="btn-icon">⚙</span>
              <span class="btn-text">
                <span class="btn-label">CONFIGURACIÓN</span>
                <span class="btn-desc">Opciones gráficas y controles</span>
              </span>
            </button>
          </div>

          <div class="architectures-preview" id="architectures-preview">
            <div class="arch-divider">
              <span class="divider-line"></span>
              <span class="divider-text">ARQUITECTURAS</span>
              <span class="divider-line"></span>
            </div>
            <div class="arch-list" id="arch-list"></div>
          </div>

          <div class="main-footer" id="main-footer">
            <div class="version-info">v${this.version} — Modo Exploración</div>
          </div>
        </div>

        <div class="welcome-returning hidden" id="welcome-returning">
          <div class="returning-header">
            <div class="returning-logo">
              <svg class="logo-svg-small" viewBox="0 0 80 80" fill="none">
                <circle cx="40" cy="40" r="36" stroke="url(#logoGlowSmall)" stroke-width="2.5" fill="rgba(45,107,196,0.1)"/>
                <path d="M20 40 L35 50 L60 25" stroke="url(#logoGlowSmall)" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
              </svg>
            </div>
            <h1 class="returning-title">CONTINUAR EXPLORACIÓN</h1>
            <p class="returning-subtitle">Tu progreso te espera</p>
          </div>
          <div class="stats-grid" id="stats-grid">
            <div class="stat-card">
              <span class="stat-value" id="stat-discovered">${this.stats.discovered}</span>
              <span class="stat-label">Arquitecturas</span>
              <span class="stat-max">/ 6</span>
            </div>
            <div class="stat-card">
              <span class="stat-value" id="stat-completed">${this.stats.completed}</span>
              <span class="stat-label">Retos</span>
            </div>
            <div class="stat-card">
              <span class="stat-value" id="stat-level">${this.stats.level}</span>
              <span class="stat-label">Nivel</span>
            </div>
            <div class="stat-card">
              <span class="stat-value" id="stat-xp">${this.stats.xp}</span>
              <span class="stat-label">XP</span>
              <span class="stat-max">/ ${this.stats.xpMax}</span>
            </div>
          </div>
          <div class="xp-bar-container">
            <div class="xp-bar-bg">
              <div class="xp-bar-fill" id="xp-bar-fill" style="width: ${(this.stats.xp / this.stats.xpMax) * 100}%"></div>
            </div>
          </div>
          <div class="returning-buttons">
            <button class="main-btn primary large" id="btn-continue" data-action="continue">
              <span class="btn-icon">▶</span>
              <span class="btn-label">CONTINUAR</span>
            </button>
            <button class="main-btn secondary" id="btn-new-game" data-action="newgame">
              <span class="btn-label">NUEVA PARTIDA</span>
            </button>
          </div>
        </div>

        <div class="loading-screen hidden" id="loading-screen">
          <div class="loading-content">
            <div class="loading-logo">
              <svg class="logo-svg" viewBox="0 0 120 120" fill="none">
                <circle cx="60" cy="60" r="54" stroke="url(#logoGlow)" stroke-width="3" fill="rgba(45,107,196,0.08)"/>
                <path d="M30 60 L52 78 L90 38" stroke="url(#logoGlow)" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
              </svg>
            </div>
            <h1 class="loading-title">ARCHITECTURE WORLD</h1>
            <p class="loading-status" id="loading-status">Inicializando mundo...</p>
            <div class="loading-bar-container">
              <div class="loading-bar-bg">
                <div class="loading-bar-fill" id="loading-bar-fill"></div>
              </div>
              <span class="loading-percent" id="loading-percent">0%</span>
            </div>
            <p class="loading-hint" id="loading-hint">Construyendo el mundo...</p>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Vincula event listeners de botones (data-action) y teclado
   * (Enter/Space para avanzar, Escape para omitir).
   */
  bindEvents() {
    this.element.querySelectorAll('[data-action]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const action = e.currentTarget.dataset.action;
        this.handleAction(action);
      });
    });

    this.keyHandler = (e) => {
      if (e.target.closest('button, input, select, textarea')) return;
      if (e.code === 'Enter' || e.code === 'Space') {
        if (this.currentPhase === 'intro') this.skipIntro();
        else if (this.currentPhase === 'main') this.handleAction('start');
        else if (this.currentPhase === 'returning') this.handleAction('continue');
      }
    };
    document.addEventListener('keydown', this.keyHandler);
  }

  /**
   * Inicia la fase de intro con canvas de partículas.
   * Transiciona automáticamente a main después de 1.8 segundos.
   */
  startIntro() {
    this.currentPhase = 'intro';
    const introEl = this.element.querySelector('#welcome-intro');
    const contentEl = this.element.querySelector('#welcome-content');
    
    this.initCanvas();
    this.animateParticles();

    requestAnimationFrame(() => {
      contentEl.classList.add('visible');
      introEl.classList.add('visible');
    });

    setTimeout(() => {
      this.transitionToMain();
    }, 1800);
  }

  /** Omite la intro y transiciona directamente a la fase principal. */
  skipIntro() {
    if (this.currentPhase !== 'intro') return;
    this.transitionToMain();
  }

  /**
   * Transición de la fase intro a la fase principal.
   * Muestra 'welcome-main' para nuevos usuarios o 'welcome-returning'
   * para usuarios con progreso existente.
   */
  transitionToMain() {
    if (this.transitioned) return;
    this.transitioned = true;

    const introEl = this.element.querySelector('#welcome-intro');
    const mainEl = this.element.querySelector('#welcome-main');
    const returningEl = this.element.querySelector('#welcome-returning');

    introEl.classList.add('fade-out');
    
    setTimeout(() => {
      introEl.classList.add('hidden');
      introEl.classList.remove('visible');
      
      if (this.isReturningUser) {
        this.currentPhase = 'returning';
        returningEl.classList.remove('hidden');
        requestAnimationFrame(() => returningEl.classList.add('visible'));
      } else {
        this.currentPhase = 'main';
        mainEl.classList.remove('hidden');
        requestAnimationFrame(() => mainEl.classList.add('visible'));
        this.populateArchitectures();
      }
    }, 600);
  }

  /**
   * Rellena el grid de vista previa de arquitecturas con nombre y color.
   */
  populateArchitectures() {
    const archList = this.element.querySelector('#arch-list');
    const icons = ['◈', '◆', '◇', '◆', '◈', '◇'];

    archList.innerHTML = architectures.map((arch, i) => {
      const color = `#${arch.color.toString(16).padStart(6, '0')}`;
      return `
      <div class="arch-item" style="--delay: ${i * 80}ms; --color: ${color};">
        <span class="arch-icon">${icons[i % icons.length]}</span>
        <span class="arch-name">${(arch.shortName || arch.name).toUpperCase()}</span>
        <span class="arch-glow"></span>
      </div>
    `;
    }).join('');
  }

  /**
   * Maneja las acciones de los botones del menú.
   * @param {string} action - Acción: 'start', 'continue', 'compendium', 'settings', 'newgame'
   */
  handleAction(action) {
    const btn = this.element.querySelector(`[data-action="${action}"]`);
    if (btn) btn.classList.add('pressed');
    
    setTimeout(() => {
      if (btn) btn.classList.remove('pressed');
    }, 150);

    switch (action) {
      case 'start':
      case 'continue':
        this.startGame();
        break;
      case 'compendium':
        if (this.onCompendium) this.onCompendium();
        break;
      case 'settings':
        if (this.onSettings) this.onSettings();
        break;
      case 'newgame':
        if (confirm('¿Estás seguro? Se perderá todo tu progreso actual.')) {
          Storage.resetAll();
          location.reload();
        }
        break;
    }
  }

  /**
   * Inicia la transición a la pantalla de carga.
   * Oculta el menú actual y muestra la barra de progreso.
   */
  startGame() {
    this.currentPhase = 'loading';
    const mainEl = this.element.querySelector('#welcome-main');
    const returningEl = this.element.querySelector('#welcome-returning');
    const loadingEl = this.element.querySelector('#loading-screen');

    if (mainEl) mainEl.classList.add('fade-out');
    if (returningEl) returningEl.classList.add('fade-out');

    setTimeout(() => {
      mainEl?.classList.add('hidden');
      returningEl?.classList.add('hidden');
      loadingEl.classList.remove('hidden');
      requestAnimationFrame(() => loadingEl.classList.add('visible'));
      
      this.simulateLoading();
    }, 400);
  }

  /**
   * Simula una barra de progreso de carga con mensajes secuenciales.
   * Al llegar al 100%, oculta el welcome screen y ejecuta onStart.
   */
  simulateLoading() {
    const messages = [
      'Construyendo el mundo...',
      'Inicializando arquitecturas...',
      'Preparando el entorno...',
      'Conectando servicios...',
      'Cargando mundo...',
      'Sincronizando sistemas...',
      'Casi listo...'
    ];
    
    const barFill = this.element.querySelector('#loading-bar-fill');
    const percentEl = this.element.querySelector('#loading-percent');
    const statusEl = this.element.querySelector('#loading-status');
    const hintEl = this.element.querySelector('#loading-hint');

    let progress = 0;
    let messageIndex = 0;
    
    const updateLoading = () => {
      progress += Math.random() * 8 + 4;
      if (progress >= 100) progress = 100;
      
      barFill.style.width = `${progress}%`;
      percentEl.textContent = `${Math.floor(progress)}%`;

      if (progress > 25 && messageIndex < 1) {
        messageIndex = 1; statusEl.textContent = 'Preparando arquitectura...'; hintEl.textContent = messages[1];
      } else if (progress > 45 && messageIndex < 2) {
        messageIndex = 2; statusEl.textContent = 'Inicializando sistemas...'; hintEl.textContent = messages[2];
      } else if (progress > 65 && messageIndex < 3) {
        messageIndex = 3; statusEl.textContent = 'Conectando servicios...'; hintEl.textContent = messages[3];
      } else if (progress > 85 && messageIndex < 4) {
        messageIndex = 4; statusEl.textContent = 'Cargando mundo...'; hintEl.textContent = messages[4];
      }

      if (progress < 100) {
        requestAnimationFrame(updateLoading);
      } else {
        setTimeout(() => {
          this.hide();
        }, 300);
      }
    };
    
    requestAnimationFrame(updateLoading);
  }

  /**
   * Inicializa el canvas 2D con sistema de partículas:
   * 40 partículas circulares y 15 líneas técnicas rotativas.
   */
  initCanvas() {
    const canvas = this.element.querySelector('#welcome-canvas');
    const ctx = canvas.getContext('2d');
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);
    this.canvas = canvas;
    this.ctx = ctx;
    this.resizeHandler = resize;

    this.particles = Array.from({ length: 40 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      size: Math.random() * 1.5 + 0.5,
      opacity: Math.random() * 0.5 + 0.1,
      color: ['#2d6bc4', '#00d4ff', '#65d6b3', '#f3df7a'][Math.floor(Math.random() * 4)]
    }));

    this.techLines = Array.from({ length: 15 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      length: Math.random() * 100 + 50,
      angle: Math.random() * Math.PI * 2,
      speed: (Math.random() - 0.5) * 0.002,
      opacity: Math.random() * 0.15 + 0.05,
      color: ['#2d6bc4', '#00d4ff', '#65d6b3'][Math.floor(Math.random() * 3)]
    }));
  }

  /**
   * Bucle de animación del canvas de partículas.
   * Renderiza: líneas técnicas, partículas con conexiones,
   * y anillos concéntricos pulsantes durante la fase intro.
   */
  animateParticles() {
    if (!this.ctx || !this.canvas) return;
    
    const ctx = this.ctx;
    const canvas = this.canvas;
    
    const render = () => {
      if (this.currentPhase === 'loading' && this.element.querySelector('#loading-screen.visible')) {
        return;
      }
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const time = performance.now() * 0.001;
      
      this.techLines.forEach(line => {
        line.angle += line.speed;
        const x1 = line.x + Math.cos(line.angle) * line.length * 0.5;
        const y1 = line.y + Math.sin(line.angle) * line.length * 0.5;
        const x2 = line.x - Math.cos(line.angle) * line.length * 0.5;
        const y2 = line.y - Math.sin(line.angle) * line.length * 0.5;
        
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.strokeStyle = `${line.color}${Math.floor(line.opacity * 255).toString(16).padStart(2, '0')}`;
        ctx.lineWidth = 1;
        ctx.stroke();
      });

      this.particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;
        
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `${p.color}${Math.floor(p.opacity * 255).toString(16).padStart(2, '0')}`;
        ctx.fill();
      });

      this.particles.forEach((p, i) => {
        this.particles.forEach((p2, j) => {
          if (i >= j) return;
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(45, 107, 196, ${0.03 * (1 - dist / 120)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        });
      });

      if (this.currentPhase === 'intro') {
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const pulse = Math.sin(time * 2) * 0.5 + 0.5;
        
        for (let r = 50; r < 300; r += 50) {
          ctx.beginPath();
          ctx.arc(centerX, centerY, r + pulse * 20, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(0, 212, 255, ${0.02 * (1 - r / 300)})`;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }

      this.animationId = requestAnimationFrame(render);
    };
    
    render();
  }

  /**
   * Oculta el welcome screen con animación de salida.
   * Limpia canvas, event listeners y ejecuta callback onStart.
   */
  hide() {
    if (this.hidden) return;
    this.hidden = true;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    if (this.resizeHandler) {
      window.removeEventListener('resize', this.resizeHandler);
    }
    document.removeEventListener('keydown', this.keyHandler);
    
    this.element.classList.add('hidden');
    setTimeout(() => {
      this.element.remove();
      if (this.onStart) this.onStart();
    }, 500);
  }
}