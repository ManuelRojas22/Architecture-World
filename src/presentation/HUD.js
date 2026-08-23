export class HUD {
  constructor(total = 6) {
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

  show(visible) {
    this.el.classList.toggle('nearby', visible);
    this.prompt.classList.toggle('visible', visible);
  }

  setProgress(discovered, total = this.total) {
    this.discoveredEl.textContent = discovered;
    const pct = (discovered / total) * 100;
    this.fillEl.style.width = `${pct}%`;
  }
}
