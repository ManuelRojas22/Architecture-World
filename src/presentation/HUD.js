/**
 * @class HUD
 * @description Interfaz de usuario en pantalla (heads-up display).
 * Muestra el título del juego, una barra de progreso de descubrimientos
 * y un prompt contextual (tecla E) cuando el jugador está cerca de un edificio.
 */
export class HUD {
  /**
   * @param {number} [total=6] - Total de arquitecturas en el juego
   */
  constructor(total = 6) {
    /** @type {number} Total de arquitecturas */
    this.total = total;
    this.el = document.createElement('div');
    this.el.className = 'hud';
    this.el.innerHTML = `
      <div class="hud-title">ARCHITECTURE WORLD</div>
      <div class="hud-progress">
        <span class="progress-text">Progress: <span id="hud-discovered">0</span>/${this.total} Architectures Discovered</span>
        <div class="progress-bar"><div class="progress-fill" id="hud-progress-fill"></div></div>
      </div>
    `;
    document.body.appendChild(this.el);
    this.discoveredEl = document.getElementById('hud-discovered');
    this.fillEl = document.getElementById('hud-progress-fill');

    this.prompt = document.createElement('div');
    this.prompt.className = 'interact-prompt';
    this.prompt.innerHTML = `
      <span class="key-cap">E</span>
      <span class="prompt-text">Ver información</span>
    `;
    document.body.appendChild(this.prompt);
  }

  /**
   * Muestra/oculta el prompt de interacción según proximidad.
   * @param {boolean} visible - true si el jugador está cerca de un edificio
   */
  show(visible) {
    this.el.classList.toggle('nearby', visible);
    this.prompt.classList.toggle('visible', visible);
  }

  /**
   * Actualiza la barra de progreso y el contador.
   * @param {number} discovered - Cantidad de arquitecturas descubiertas
   * @param {number} [total=this.total] - Total de arquitecturas
   */
  setProgress(discovered, total = this.total) {
    this.discoveredEl.textContent = discovered;
    const pct = (discovered / total) * 100;
    this.fillEl.style.width = `${pct}%`;
  }
}
