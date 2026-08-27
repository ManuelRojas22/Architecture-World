/** @const {number} Gravedad aplicada al jugador (unidades/s²) */
const GRAVITY = -22;
/** @const {number} Velocidad vertical inicial del salto */
const JUMP_SPEED = 8.2;

/**
 * @class Player
 * @description Modelo del jugador con física básica: movimiento horizontal
 * por ejes separados (permite deslizamiento en paredes), salto y gravedad.
 * No depende de Three.js; es un modelo puro de dominio.
 */
export class Player {
  constructor() {
    /** @type {{x: number, y: number, z: number}} Posición世界 */
    this.position = { x: 0, y: 0, z: 0 };
    /** @type {{x: number, y: number, z: number}} Velocidad世界 */
    this.velocity = { x: 0, y: 0, z: 0 };
    /** @type {number} Velocidad base de movimiento */
    this.speed = 4;
    /** @type {number} Multiplicador de velocidad al correr */
    this.runMultiplier = 2;
    /** @type {boolean} true mientras Shift está presionado */
    this.isRunning = false;
    /** @type {boolean} true si está sobre el suelo (y <= 0) */
    this.isGrounded = true;
    /** @type {boolean} Salto pendiente para el siguiente frame */
    this.jumpQueued = false;
    /**
     * Callback de verificación de colisión.
     * Debe ser asignado por el componente que gestiona los colliders.
     * @type {((x: number, z: number) => boolean) | null}
     */
    this.collideTest = null;
  }

  /**
   * Verifica si una posición (x, z) está bloqueada por un collider.
   * @param {number} x - Coordenada X世界
   * @param {number} z - Coordenada Z世界
   * @returns {boolean} true si la posición está bloqueada
   */
  isBlocked(x, z) {
    return this.collideTest ? this.collideTest(x, z) : false;
  }

  /**
   * Procesa el input del teclado y calcula la velocidad resultante.
   * Normaliza la dirección diagonal y aplica el multiplicador de carrera.
   * @param {{forward: boolean, backward: boolean, left: boolean, right: boolean, run: boolean}} input
   */
  setInput({ forward, backward, left, right, run }) {
    this.isRunning = run;
    const dir = { x: 0, z: 0 };
    if (forward) dir.z -= 1;
    if (backward) dir.z += 1;
    if (left) dir.x -= 1;
    if (right) dir.x += 1;
    const len = Math.hypot(dir.x, dir.z);
    if (len > 0) {
      dir.x /= len;
      dir.z /= len;
    }
    const sp = this.speed * (this.isRunning ? this.runMultiplier : 1);
    this.velocity.x = dir.x * sp;
    this.velocity.z = dir.z * sp;
  }

  /** Detiene el movimiento horizontal (velocidad a cero en X y Z). */
  stop() {
    this.velocity.x = 0;
    this.velocity.z = 0;
  }

  /**
   * Encola un salto para el siguiente frame de update().
   * Solo funciona si el jugador está en el suelo.
   */
  queueJump() {
    if (this.isGrounded) {
      this.jumpQueued = true;
    }
  }

  /**
   * Actualiza la posición del jugador usando dt (delta time).
   * Resuelve el movimiento por ejes separados para permitir deslizamiento
   * en superficies de colisión. Aplica gravedad y limita y a 0 (suelo).
   * @param {number} dt - Tiempo transcurrido en segundos
   */
  update(dt) {
    // Movimiento horizontal resuelto por ejes para deslizar sobre las paredes
    const nx = this.position.x + this.velocity.x * dt;
    if (!this.isBlocked(nx, this.position.z)) {
      this.position.x = nx;
    } else {
      this.velocity.x = 0;
    }

    const nz = this.position.z + this.velocity.z * dt;
    if (!this.isBlocked(this.position.x, nz)) {
      this.position.z = nz;
    } else {
      this.velocity.z = 0;
    }

    if (this.jumpQueued && this.isGrounded) {
      this.velocity.y = JUMP_SPEED;
      this.isGrounded = false;
      this.jumpQueued = false;
    }
    this.velocity.y += GRAVITY * dt;
    this.position.y += this.velocity.y * dt;
    if (this.position.y <= 0) {
      this.position.y = 0;
      this.velocity.y = 0;
      this.isGrounded = true;
    }
  }
}