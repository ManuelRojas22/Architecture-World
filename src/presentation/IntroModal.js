import { Storage } from '../infrastructure/Storage.js';

/**
 * @class IntroModal
 * @description Modal de introducción para nuevos usuarios. Presenta 2 pasos:
 * 1. Bienvenida y explicación del concepto del juego
 * 2. Misión del jugador
 * Se omite si el usuario ya vio la intro (Storage.hasSeenIntro).
 */
export class IntroModal {
  /**
   * @param {() => void} onComplete - Callback al completar u omitir el modal
   */
  constructor(onComplete) {
    this.onComplete = onComplete;
    this.step = 0;
    this.completed = false;
    this.element = this.createElement();
    document.body.appendChild(this.element);
    this.bindEvents();
    this.showStep(0);
  }

  createElement() {
    const el = document.createElement('div');
    el.className = 'intro-modal';
    el.innerHTML = `
      <div class="intro-backdrop"></div>
      <div class="intro-container">
        <div class="intro-content" id="intro-content"></div>
        <div class="intro-nav">
          <button class="intro-btn skip" id="intro-skip">Omitir</button>
          <div class="intro-dots" id="intro-dots"></div>
          <button class="intro-btn next" id="intro-next">Siguiente</button>
        </div>
      </div>
    `;
    return el;
  }

  bindEvents() {
    this.element.querySelector('#intro-next').addEventListener('click', () => this.nextStep());
    this.element.querySelector('#intro-skip').addEventListener('click', () => this.complete());
    
    this.keyHandler = (e) => {
      if (this.completed) return;
      if (e.target.closest('button, input, select, textarea')) return;
      if (e.code === 'Enter' || e.code === 'Space') this.nextStep();
      if (e.code === 'Escape') this.complete();
    };
    document.addEventListener('keydown', this.keyHandler);
  }

  /**
   * Muestra un paso específico del intro.
   * @param {number} index - Índice del paso (0 o 1)
   */
  showStep(index) {
    const steps = [
      {
        title: 'BIENVENIDO A ARCHITECTURE WORLD',
        text: 'Aquí aprenderás cómo funcionan las principales arquitecturas de software explorándolas directamente.',
        icon: '🌍'
      },
      {
        title: 'TU MISIÓN',
        text: 'Descubre las 6 arquitecturas, completa sus desafíos y conviértete en un Arquitecto Master.',
        icon: '🎯'
      }
    ];

    const step = steps[index];
    const content = this.element.querySelector('#intro-content');
    const dots = this.element.querySelector('#intro-dots');
    const nextBtn = this.element.querySelector('#intro-next');
    const skipBtn = this.element.querySelector('#intro-skip');

    content.innerHTML = `
      <div class="intro-step" data-step="${index}">
        <div class="intro-icon">${step.icon}</div>
        <h1 class="intro-title">${step.title}</h1>
        <p class="intro-text">${step.text}</p>
      </div>
    `;

    dots.innerHTML = steps.map((_, i) => `<span class="dot ${i === index ? 'active' : ''}"></span>`).join('');

    nextBtn.textContent = index === steps.length - 1 ? 'COMENZAR MISIÓN' : 'Siguiente';
    skipBtn.style.display = index === steps.length - 1 ? 'none' : 'block';
  }

  /** Avanza al siguiente paso o completa el modal si está en el último. */
  nextStep() {
    if (this.completed) return;
    const steps = 2;
    if (this.step < steps - 1) {
      this.step++;
      this.showStep(this.step);
    } else {
      this.complete();
    }
  }

  /**
   * Completa el modal: marca intro como vista en Storage,
   * anima salida y ejecuta callback onComplete.
   */
  complete() {
    if (this.completed) return;
    this.completed = true;
    Storage.markIntroSeen();
    this.element.classList.add('fade-out');
    setTimeout(() => {
      this.element.remove();
      document.removeEventListener('keydown', this.keyHandler);
      if (this.onComplete) this.onComplete();
    }, 400);
  }
}