/**
 * @class TutorialHints
 * @description Sistema de pistas de tutorial y indicadores de misión.
 * Muestra secuencialmente hints de controles (WASD, Mouse, Shift, Space, E)
 * con auto-avance cada 3.5 segundos. También gestiona el indicador de
 * la primera misión que apunta hacia la arquitectura más cercana.
 */
export class TutorialHints {
  constructor() {
    this.element = this.createElement();
    document.body.appendChild(this.element);
    this.currentHint = -1;
    this.hints = [
      { keys: ['W', 'A', 'S', 'D'], text: 'Moverse' },
      { keys: ['MOUSE'], text: 'Mirar' },
      { keys: ['SHIFT'], text: 'Correr' },
      { keys: ['SPACE'], text: 'Saltar' },
      { keys: ['E'], text: 'Interactuar' }
    ];
    this.hintTimeout = null;
    this.autoAdvanceTimeout = null;
  }

  /** Crea el contenedor DOM para las pistas y lo añade al body. */
  createElement() {
    const el = document.createElement('div');
    el.className = 'tutorial-hints';
    el.innerHTML = `
      <div class="hint-container" id="hint-container"></div>
    `;
    return el;
  }

  /** Inicia la secuencia de pistas mostrando la primera. */
  start() {
    this.showNextHint();
  }

  /**
   * Muestra la siguiente pista de la secuencia.
   * Cada pista se muestra con animación de entrada y se oculta
   * automáticamente después de 3.5 segundos.
   */
  showNextHint() {
    this.currentHint++;
    if (this.currentHint >= this.hints.length) {
      this.hide();
      return;
    }

    const container = this.element.querySelector('#hint-container');
    const hint = this.hints[this.currentHint];
    
    container.innerHTML = `
      <div class="hint-card" data-hint="${this.currentHint}">
        <div class="hint-keys">
          ${hint.keys.map(k => `<kbd>${k}</kbd>`).join('')}
        </div>
        <span class="hint-text">${hint.text}</span>
      </div>
    `;

    requestAnimationFrame(() => {
      const card = container.querySelector('.hint-card');
      if (card) card.classList.add('visible');
    });

    this.autoAdvanceTimeout = setTimeout(() => {
      this.hideCurrentHint();
    }, 3500);
  }

  /**
   * Oculta la pista actual con animación de salida y
   * programa la siguiente pista después de 300ms.
   */
  hideCurrentHint() {
    const card = this.element.querySelector('.hint-card');
    if (card) {
      card.classList.remove('visible');
      card.classList.add('hiding');
      setTimeout(() => {
        card.remove();
        this.showNextHint();
      }, 300);
    }
  }

  /** Oculta todas las pistas y cancela timeouts pendientes. */
  hide() {
    if (this.autoAdvanceTimeout) clearTimeout(this.autoAdvanceTimeout);
    if (this.hintTimeout) clearTimeout(this.hintTimeout);
    this.element.classList.add('hidden');
  }

  /**
   * Muestra el indicador de la primera misión apuntando a una posición.
   * @param {{x: number, z: number}} targetPosition - Posición del objetivo
   */
  showMissionIndicator(targetPosition) {
    this.hide();
    this.element.classList.remove('hidden');
    
    const container = this.element.querySelector('#hint-container');
    container.innerHTML = `
      <div class="mission-indicator" id="mission-indicator">
        <div class="mission-header">
          <span class="mission-icon">🎯</span>
          <span class="mission-title">PRIMER OBJETIVO</span>
        </div>
        <div class="mission-body">
          <p class="mission-text">Descubre tu primera arquitectura</p>
          <div class="mission-arrow" id="mission-arrow">→</div>
          <p class="mission-hint">Dirígete al edificio cercano</p>
        </div>
      </div>
    `;

    this.updateMissionArrow(targetPosition);
    this.missionUpdateInterval = setInterval(() => this.updateMissionArrow(targetPosition), 100);
  }

  /**
   * Actualiza la dirección de la flecha del indicador de misión.
   * @param {{x: number, z: number}} targetPosition - Posición del objetivo
   */
  updateMissionArrow(targetPosition) {
    // This will be updated by GameManager with player position
    // For now, just show the indicator
  }

  /** Oculta el indicador de misión con animación de salida. */
  hideMissionIndicator() {
    if (this.missionUpdateInterval) {
      clearInterval(this.missionUpdateInterval);
    }
    const indicator = this.element.querySelector('#mission-indicator');
    if (indicator) {
      indicator.classList.add('fade-out');
      setTimeout(() => indicator.remove(), 400);
    }
  }
}