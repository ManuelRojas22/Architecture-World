/**
 * @class ArchitectureModal
 * @description Modal detallado de arquitectura de software. Se abre al interactuar
 * con un edificio (tecla E) o desde el Compendio. Muestra información educativa:
 * qué es, cómo funciona, componentes, ventajas, desventajas, ejemplos reales
 * y un diagrama SVG. Se cierra con E, Escape o el botón de cerrar.
 */
export class ArchitectureModal {
  /**
   * @param {ProgressManager} progressManager - Para verificar estado de descubrimiento
   */
  constructor(progressManager) {
    this.progressManager = progressManager;
    this.overlay = document.createElement('div');
    this.overlay.className = 'modal-overlay hidden';
    this.overlay.innerHTML = `
      <div class="modal" role="dialog" aria-modal="true">
        <button class="close" aria-label="Cerrar">&times;</button>
        <div class="content"></div>
      </div>
    `;
    document.body.appendChild(this.overlay);
    this.currentArch = null;
    this.content = this.overlay.querySelector('.content');
    this.closeBtn = this.overlay.querySelector('.close');
    this.closeBtn.addEventListener('click', () => this.hide());
    window.addEventListener('arch-open', (e) => this.show(e.detail));
    window.addEventListener('keydown', (e) => { if(e.key==='Escape') this.hide(); });
  }

  /**
   * Convierte un número entero de color a string hexadecimal.
   * @param {number} color - Color en formato 0xRRGGBB
   * @returns {string} Color en formato '#RRGGBB'
   */
  toHex(color) {
    return '#' + color.toString(16).padStart(6, '0');
  }

  /**
   * Genera HTML de una lista de chips (ventajas, desventajas, etc.).
   * @param {string[]} items - Elementos a mostrar
   * @param {string} cls - Clase CSS adicional
   * @returns {string} HTML de la lista
   */
  chipList(items, cls) {
    return `<ul class="chip-list ${cls}">${items.map(i => `<li>${i}</li>`).join('')}</ul>`;
  }

  /**
   * Muestra el modal con la información completa de una arquitectura.
   * Bloquea el scroll del body y libera el pointer lock del canvas.
   * @param {Object} arch - Definición de la arquitectura (desde ArchitectureManager)
   */
  show(arch) {
    if (!arch) return;
    this.currentArch = arch;
    const d = arch.description;
    const accent = this.toHex(arch.color);
    const discovered = this.progressManager.isDiscovered(arch.id);

    this.overlay.style.setProperty('--accent', accent);
    this.content.innerHTML = `
      <header class="am-header">
        <div class="am-icon">${arch.shortName.charAt(0)}</div>
        <div class="am-heading">
          <span class="am-kicker">
            Arquitectura #${arch.order} / ${this.progressManager.total}
            <span class="am-status ${discovered ? 'ok' : 'new'}">${discovered ? '✓ Descubierta' : '✦ Nueva'}</span>
          </span>
          <h1>${arch.name}</h1>
        </div>
      </header>

      <div class="am-intro">
        <section>
          <h2>¿Qué es?</h2>
          <p>${d.what}</p>
        </section>
        <section>
          <h2>¿Cómo funciona?</h2>
          <p>${d.how}</p>
        </section>
      </div>

      <div class="am-cols">
        <section>
          <h2>Componentes</h2>
          ${this.chipList(d.components, 'chips-neutral')}
        </section>
        <section>
          <h2 class="pro">Ventajas</h2>
          ${this.chipList(d.advantages, 'chips-pro')}
        </section>
        <section>
          <h2 class="con">Desventajas</h2>
          ${this.chipList(d.disadvantages, 'chips-con')}
        </section>
      </div>

      <section>
        <h2>Ejemplos reales</h2>
        ${this.chipList(d.examples, 'chips-ex')}
      </section>

      <section>
        <h2>Diagrama</h2>
        <div class="am-diagram">${d.diagramSvg}</div>
      </section>

      <footer class="am-foot">
        Pulsa <span class="key-cap">E</span> de nuevo o <span class="key-cap">ESC</span> para cerrar
      </footer>
    `;
    this.overlay.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    if (document.pointerLockElement) document.exitPointerLock();
  }

  /** Oculta el modal, restaura scroll y dispara evento 'arch-close'. */
  hide() {
    this.overlay.classList.add('hidden');
    this.currentArch = null;
    document.body.style.overflow = '';
    window.dispatchEvent(new Event('arch-close'));
  }

  /** @returns {boolean} true si el modal está visible */
  isVisible() {
    return !this.overlay.classList.contains('hidden');
  }
}
