const GRAVITY = -22;
const JUMP_SPEED = 8.2;

export class Player {
  constructor() {
    this.position = { x: 0, y: 0, z: 0 };
    this.velocity = { x: 0, y: 0, z: 0 };
    this.speed = 4;
    this.runMultiplier = 2;
    this.isRunning = false;
    this.isGrounded = true;
    this.jumpQueued = false;
    this.collideTest = null;
  }

  isBlocked(x, z) {
    return this.collideTest ? this.collideTest(x, z) : false;
  }

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

  stop() {
    this.velocity.x = 0;
    this.velocity.z = 0;
  }

  queueJump() {
    if (this.isGrounded) {
      this.jumpQueued = true;
    }
  }

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