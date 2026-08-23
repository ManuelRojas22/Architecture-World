export class Compendium {
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

  toggle() {
    this.el.classList.toggle('hidden');
    if (!this.el.classList.contains('hidden')) this.render();
  }

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