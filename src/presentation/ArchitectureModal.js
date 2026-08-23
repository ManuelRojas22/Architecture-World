export class ArchitectureModal {
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

  toHex(color) {
    return '#' + color.toString(16).padStart(6, '0');
  }

  chipList(items, cls) {
    return `<ul class="chip-list ${cls}">${items.map(i => `<li>${i}</li>`).join('')}</ul>`;
  }

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

  hide() {
    this.overlay.classList.add('hidden');
    this.currentArch = null;
    document.body.style.overflow = '';
    window.dispatchEvent(new Event('arch-close'));
  }

  isVisible() {
    return !this.overlay.classList.contains('hidden');
  }
}
