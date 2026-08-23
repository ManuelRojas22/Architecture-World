export class BuildingInfoPanel {
  constructor() {
    this.element = document.createElement('div');
    this.element.id = 'building-info-panel';
    this.element.className = 'building-info-panel hidden';
    document.body.appendChild(this.element);
    this.currentArch = null;
    
    // Listen for ESC key
    this.keyHandler = (e) => {
      if (e.key === 'Escape' && !this.element.classList.contains('hidden')) {
        this.hide();
      }
    };
    document.addEventListener('keydown', this.keyHandler);
  }

  show(arch) {
    if (!arch) {
      this.hide();
      return;
    }
    this.currentArch = arch;
    const d = arch.description;
    this.element.innerHTML = `
      <div class="info-header">
        <h2>${arch.name}</h2>
        <button class="info-close" aria-label="Cerrar">×</button>
      </div>
      <div class="info-scroll">
        <div class="info-section">
          <h3>¿Qué es?</h3>
          <p>${d.what}</p>
        </div>
        <div class="info-section">
          <h3>¿Cómo funciona?</h3>
          <p>${d.how}</p>
        </div>
        <div class="info-section">
          <h3>Componentes</h3>
          <ul>${d.components.map(c => `<li>${c}</li>`).join('')}</ul>
        </div>
        <div class="info-section">
          <h3>Ventajas</h3>
          <ul>${d.advantages.map(c => `<li>${c}</li>`).join('')}</ul>
        </div>
        <div class="info-section">
          <h3>Desventajas</h3>
          <ul>${d.disadvantages.map(c => `<li>${c}</li>`).join('')}</ul>
        </div>
        <div class="info-section">
          <h3>Ejemplos</h3>
          <ul>${d.examples.map(c => `<li>${c}</li>`).join('')}</ul>
        </div>
        <div class="info-section diagram-section">
          <h3>Diagrama</h3>
          <div class="diagram">${d.diagramSvg}</div>
        </div>
      </div>
    `;
    this.element.classList.remove('hidden');
    
    const closeBtn = this.element.querySelector('.info-close');
    closeBtn.addEventListener('click', () => this.hide());
  }

  hide() {
    this.element.classList.add('hidden');
    this.currentArch = null;
  }

  isVisible() {
    return !this.element.classList.contains('hidden');
  }

  toggle(arch) {
    if (this.currentArch && this.currentArch.id === arch.id && this.isVisible()) {
      this.hide();
    } else {
      this.show(arch);
    }
  }
}
