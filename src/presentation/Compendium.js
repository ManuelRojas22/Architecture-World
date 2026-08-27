/**
 * @class Compendium
 * @description Cuaderno de arquitecturas de software. Muestra un grid de tarjetas
 * con todas las arquitecturas: las descubiertas son clickeables (abren el modal
 * de detalles) y las bloqueadas muestran un estado "locked".
 */
export class Compendium {
  /**
   * @param {ProgressManager} progressManager - Gestor de progreso
   * @param {Object[]} architectures - Lista de definiciones de arquitecturas
   */
  constructor(progressManager, architectures) {
    this.progressManager = progressManager;
    this.architectures = architectures;
    this.el = document.createElement('div');
    this.el.className = 'compendium hidden';
    this.el.innerHTML = `
      <h2>Architecture Compendium</h2>
      <div class="compendium-grid" id="comp-grid"></div>
    `;
    this.grid = this.el.querySelector('#comp-grid');
    document.body.appendChild(this.el);
    this.render();
  }

  /** Alterna la visibilidad del compendio y re-renderiza al abrir. */
  toggle() {
    this.el.classList.toggle('hidden');
    if (!this.el.classList.contains('hidden')) this.render();
  }

  /**
   * Renderiza el grid de tarjetas de arquitecturas.
   * Cada tarjeta muestra: icono (primera letra), nombre, estado y número.
   * Las tarjetas descubiertas disparan evento 'arch-open' al hacer clic.
   */
  render() {
    this.grid.innerHTML = '';
    this.architectures.forEach(def => {
      const discovered = this.progressManager.isDiscovered(def.id);
      const card = document.createElement('div');
      card.className = `comp-card ${discovered ? 'discovered' : 'locked'}`;
      // simple icon using first letter
      const icon = def.shortName.charAt(0);
      card.innerHTML = `
        <div class="comp-icon">${icon}</div>
        <div class="comp-name">${def.shortName}</div>
        <div class="comp-status">${discovered ? 'Descubierto' : 'Bloqueado'}</div>
        <div class="comp-number">#${def.order}</div>
      `;
      if (discovered) {
        card.style.cursor = 'pointer';
        card.addEventListener('click', () => window.dispatchEvent(new CustomEvent('arch-open', { detail: { ...def, description: def.description } })));
      }
      this.grid.appendChild(card);
    });
  }
}