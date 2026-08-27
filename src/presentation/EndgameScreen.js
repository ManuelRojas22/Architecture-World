/**
 * @class EndgameScreen
 * @description Pantalla de victoria que se muestra al descubrir todas las
 * arquitecturas. Incluye mensaje de felicitación, estadísticas y una
 * animación de confeti con 100 partículas de colores aleatorios.
 */
export class EndgameScreen {
  constructor() {
    this.el = document.createElement('div');
    this.el.className = 'endgame hidden';
    this.el.innerHTML = `
      <h1>ARCHITECTURE MASTER</h1>
      <p>Has descubierto las 6 arquitecturas de software.</p>
      <div class="stats"></div>
      <button id="restart">Volver a jugar</button>
    `;
    document.body.appendChild(this.el);
    this.statsEl = this.el.querySelector('.stats');
    this.el.querySelector('#restart').addEventListener('click', () => location.reload());
  }

  /**
   * Muestra la pantalla de victoria con estadísticas.
   * @param {{discovered: number, total: number}} stats - Estadísticas del juego
   */
  show(stats) {
    this.statsEl.textContent = `Descubiertas: ${stats.discovered} / ${stats.total}`;
    this.el.classList.remove('hidden');
    this.confetti();
  }

  /**
   * Genera 100 partículas de confeti con animación CSS.
   * Cada partícula tiene color aleatorio, duración 2-4s y rotación 720°.
   */
  confetti() {
    for (let i=0;i<100;i++) {
      const p = document.createElement('div');
      p.style.position='fixed';
      p.style.left=Math.random()*100+'vw';
      p.style.top='-10px';
      p.style.width='10px';
      p.style.height='10px';
      p.style.background=`hsl(${Math.random()*360},100%,50%)`;
      p.style.borderRadius='50%';
      p.style.pointerEvents='none';
      p.style.zIndex=300;
      document.body.appendChild(p);
      const dur=2+Math.random()*2;
      p.animate([
        {transform:'translateY(0) rotate(0deg)', opacity:1},
        {transform:`translateY(${window.innerHeight+20}px) rotate(720deg)`, opacity:0}
      ],{duration:dur*1000,easing:'cubic-bezier(.2,.8,.2,1)'}).onfinish=()=>p.remove();
    }
  }
}