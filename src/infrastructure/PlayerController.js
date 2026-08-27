/**
 * @file PlayerController.js
 * @description Controla el input del teclado/ratón, la cámara (primera persona
 * e isométrica) y la sincronización con el modelo Player. Construye un
 * personaje humanoid fusionado (voxel-like) optimizado con mergeGeometries.
 */

import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

/**
 * @class PlayerController
 * @description Gestiona el ciclo de vida del control del jugador:
 * - Input de teclado (WASD, Shift, Space, V)
 * - Ratón con pointer lock (solo en primera persona)
 * - Dos vistas: primera persona e isométrica (toggle con V)
 * - Modelo 3D del jugador visible solo en vista isométrica
 * - Física delegada al modelo Player
 */
export class PlayerController {
  /**
   * @param {ThreeRenderer} renderer - Motor de renderizado (acceso a cámara y escena)
   * @param {Player} player - Modelo de física del jugador
   */
  constructor(renderer, player) {
    this.renderer = renderer;
    this.player = player;
    this.enabled = true;
    this.input = { forward: false, backward: false, left: false, right: false, run: false };
    this.yaw = 0;
    this.pitch = 0;
    this.mouseSensitivity = 1;
    this.firstPerson = true;
    this.isometric = false;

    this.playerMesh = this.buildPlayerMesh();
    this.playerMesh.scale.setScalar(1.3);
    this.playerMesh.visible = false;
    this.renderer.scene.add(this.playerMesh);

    this.eyeHeight = 2.8;
    this.cameraOffset = new THREE.Vector3(34, 40, 34);
    this.player.position.x = 0;
    this.player.position.y = 0;
    this.player.position.z = 30;
    this.renderer.camera.position.set(0, this.eyeHeight, 30);
    this.renderer.camera.rotation.order = 'YXZ';

    this.setupListeners();
  }

  /**
   * Construye el modelo 3D del jugador (humanoid voxel-like).
   * Crea geometrías para cada parte del cuerpo (piernas, torso, brazos,
   * cabeza, pelo, mochila, ojos), las agrupa por material y las fusiona
   * con mergeGeometries para optimizar el renderizado.
   * @returns {THREE.Group} Grupo con todas las partes del jugador
   */
  buildPlayerMesh() {
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xffdbac, roughness: 0.6 });
    const shirtMat = new THREE.MeshStandardMaterial({ color: 0x2d6bc4, roughness: 0.7, metalness: 0.1 });
    const pantsMat = new THREE.MeshStandardMaterial({ color: 0x1a1a2e, roughness: 0.8 });
    const shoeMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.4, metalness: 0.3 });
    const hairMat = new THREE.MeshStandardMaterial({ color: 0x2d1b0e, roughness: 0.7 });
    const backpackMat = new THREE.MeshStandardMaterial({ color: 0x8b4513, roughness: 0.6 });
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x1a1a1a });

    const geometriesByMaterial = new Map();

    function addGeo(geo, material, position, rotation, scale) {
      const mesh = new THREE.Mesh(geo, material);
      if (position) mesh.position.copy(position);
      if (rotation) mesh.rotation.setFromVector3(rotation);
      if (scale) mesh.scale.copy(scale);
      mesh.updateMatrix();
      const key = material.uuid;
      if (!geometriesByMaterial.has(key)) {
        geometriesByMaterial.set(key, { material, geos: [] });
      }
      geometriesByMaterial.get(key).geos.push(mesh.geometry.clone().applyMatrix4(mesh.matrix));
    }

    const legGeo = new THREE.CapsuleGeometry(0.13, 0.55, 4, 8);
    const upperLegGeo = new THREE.CapsuleGeometry(0.14, 0.45, 4, 8);
    const hipY = 0.95;

    // LEFT LEG
    addGeo(upperLegGeo, pantsMat, new THREE.Vector3(-0.12, hipY - 0.225, 0));
    addGeo(legGeo, pantsMat, new THREE.Vector3(-0.12, hipY - 0.7, 0));
    addGeo(new THREE.BoxGeometry(0.16, 0.08, 0.35), shoeMat, new THREE.Vector3(-0.12, hipY - 1.02, 0.1));

    // RIGHT LEG
    addGeo(upperLegGeo, pantsMat, new THREE.Vector3(0.12, hipY - 0.225, 0));
    addGeo(legGeo, pantsMat, new THREE.Vector3(0.12, hipY - 0.7, 0));
    addGeo(new THREE.BoxGeometry(0.16, 0.08, 0.35), shoeMat, new THREE.Vector3(0.12, hipY - 1.02, 0.1));

    // TORSO
    const torsoY = hipY;
    addGeo(new THREE.CapsuleGeometry(0.22, 0.55, 4, 8), shirtMat, new THREE.Vector3(0, torsoY + 0.4, 0));
    addGeo(new THREE.BoxGeometry(0.3, 0.45, 0.18), backpackMat, new THREE.Vector3(0, torsoY + 0.3, -0.35));

    // ARMS
    const shoulderY = torsoY + 0.92;
    addGeo(new THREE.CapsuleGeometry(0.1, 0.35, 4, 8), shirtMat, new THREE.Vector3(-0.35, shoulderY - 0.175, 0));
    addGeo(new THREE.CapsuleGeometry(0.09, 0.3, 4, 8), skinMat, new THREE.Vector3(-0.35, shoulderY - 0.525, 0));
    addGeo(new THREE.SphereGeometry(0.09, 8, 8), skinMat, new THREE.Vector3(-0.35, shoulderY - 0.72, 0), null, new THREE.Vector3(1, 0.8, 1));
    addGeo(new THREE.CapsuleGeometry(0.1, 0.35, 4, 8), shirtMat, new THREE.Vector3(0.35, shoulderY - 0.175, 0));
    addGeo(new THREE.CapsuleGeometry(0.09, 0.3, 4, 8), skinMat, new THREE.Vector3(0.35, shoulderY - 0.525, 0));
    addGeo(new THREE.SphereGeometry(0.09, 8, 8), skinMat, new THREE.Vector3(0.35, shoulderY - 0.72, 0), null, new THREE.Vector3(1, 0.8, 1));

    // NECK & HEAD
    const neckY = shoulderY + 0.1;
    addGeo(new THREE.SphereGeometry(0.2, 16, 16), skinMat, new THREE.Vector3(0, neckY + 0.15, 0), null, new THREE.Vector3(1, 1.1, 1));
    addGeo(new THREE.SphereGeometry(0.21, 16, 16), hairMat, new THREE.Vector3(0, neckY + 0.18, 0), null, new THREE.Vector3(1.02, 1.15, 1.02));
    addGeo(new THREE.SphereGeometry(0.03, 8, 8), eyeMat, new THREE.Vector3(-0.06, neckY + 0.18, 0.18));
    addGeo(new THREE.SphereGeometry(0.03, 8, 8), eyeMat, new THREE.Vector3(0.06, neckY + 0.18, 0.18));

    const mergedMeshes = [];
    for (const { material, geos } of geometriesByMaterial.values()) {
      const mergedGeo = mergeGeometries(geos, false);
      const mesh = new THREE.Mesh(mergedGeo, material);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mergedMeshes.push(mesh);
    }

    const group = new THREE.Group();
    mergedMeshes.forEach(m => group.add(m));
    return group;
  }

  /**
   * Configura event listeners de teclado, ratón y pointer lock.
   * Incluye lógica de reintento de pointer lock (máximo 5 intentos).
   */
  setupListeners() {
    window.addEventListener('keydown', (e) => this.onKey(e, true));
    window.addEventListener('keyup', (e) => this.onKey(e, false));
    window.addEventListener('mousemove', (e) => this.onMouseMove(e));
    document.addEventListener('pointerlockchange', () => this.onPointerLockChange());
    this.renderer.renderer.domElement.addEventListener('click', () => this.acquirePointerLock());
    this.lockRetryTimer = null;
    this.lockAttempts = 0;
  }

  /**
   * Solicita pointer lock en el canvas del renderer.
   * Si falla, programa un reintento después de 1.3 segundos.
   */
  acquirePointerLock() {
    const el = this.renderer.renderer.domElement;
    if (document.pointerLockElement === el || this.lockRetryTimer) return;
    if (this.lockAttempts >= 5) return;
    try {
      const result = el.requestPointerLock();
      if (result && typeof result.catch === 'function') {
        result.catch(() => this.scheduleLockRetry());
      }
    } catch (err) {
      this.scheduleLockRetry();
    }
  }

  /**
   * Programa un reintento de pointer lock después de 1.3 segundos.
   * Solo programa uno a la vez y respeta el límite de 5 intentos.
   */
  scheduleLockRetry() {
    if (this.lockRetryTimer) return;
    this.lockAttempts++;
    this.lockRetryTimer = setTimeout(() => {
      this.lockRetryTimer = null;
      this.acquirePointerLock();
    }, 1300);
  }

  /**
   * Procesa eventos de teclado (keydown/keyup).
   * @param {KeyboardEvent} e - Evento del teclado
   * @param {boolean} down - true si es keydown, false si es keyup
   */
  onKey(e, down) {
    switch (e.code) {
      case 'KeyW': this.input.forward = down; break;
      case 'KeyS': this.input.backward = down; break;
      case 'KeyA': this.input.left = down; break;
      case 'KeyD': this.input.right = down; break;
      case 'ShiftLeft': this.input.run = down; break;
      case 'Space':
        if (down) this.player.queueJump();
        break;
      case 'KeyV': // Toggle first person/isometric
        if (down) this.toggleView();
        break;
    }
  }

  /**
   * Alterna entre vista isométrica y primera persona.
   * - Isométrica: muestra modelo del jugador, cámara elevada
   * - Primera persona: oculta modelo, cámara a altura de ojos
   */
  toggleView() {
    this.isometric = !this.isometric;
    this.firstPerson = !this.isometric;
    if (this.isometric) {
      this.playerMesh.visible = true;
      this.pitch = -0.82;
    } else {
      this.playerMesh.visible = false;
      this.pitch = 0;
    }
  }

  /**
   * Establece la sensibilidad del ratón.
   * @param {number} val - Multiplicador de sensibilidad (1 = normal)
   */
  setMouseSensitivity(val) { this.mouseSensitivity = val; }

  /**
   * Procesa el movimiento del ratón para rotar la cámara.
   * Solo funciona en primera persona con pointer lock activo.
   * @param {MouseEvent} e
   */
  onMouseMove(e) {
    if (!this.isometric && document.pointerLockElement === this.renderer.renderer.domElement) {
      this.yaw -= e.movementX * 0.002 * this.mouseSensitivity;
      this.pitch = THREE.MathUtils.clamp(this.pitch - e.movementY * 0.002 * this.mouseSensitivity, -Math.PI / 2, Math.PI / 2);
    }
  }

  /**
   * Handler de cambio de pointer lock.
   * Resetea contador de intentos y cancela reintentos pendientes
   * cuando se obtiene el lock exitosamente.
   */
  onPointerLockChange() {
    if (document.pointerLockElement === this.renderer.renderer.domElement) {
      this.lockAttempts = 0;
      if (this.lockRetryTimer) {
        clearTimeout(this.lockRetryTimer);
        this.lockRetryTimer = null;
      }
    }
  }

  /**
   * Actualiza el controller cada frame:
   * 1. Calcula dirección de movimiento según vista (primera persona o isométrica)
   * 2. Aplica velocidad al modelo Player
   * 3. Ejecuta update(dt) del Player (física)
   * 4. Sincroniza posición de cámara y modelo visual
   * @param {number} dt - Delta time en segundos
   */
  update(dt) {
    if (!this.enabled) return;

    const forward = new THREE.Vector3();
    if (this.isometric) {
      forward.set(-this.cameraOffset.x, 0, -this.cameraOffset.z).normalize();
    } else {
      this.renderer.camera.rotation.y = this.yaw;
      this.renderer.camera.rotation.x = this.pitch;
      this.renderer.camera.getWorldDirection(forward);
      forward.y = 0;
      forward.normalize();
    }

    const right = new THREE.Vector3().crossVectors(new THREE.Vector3(0, 1, 0), forward).normalize();

    const dir = new THREE.Vector3();
    if (this.input.forward) dir.add(forward);
    if (this.input.backward) dir.sub(forward);
    if (this.input.left) dir.add(right);
    if (this.input.right) dir.sub(right);
    if (dir.length() > 0) dir.normalize();

    const speed = this.player.speed * (this.input.run ? this.player.runMultiplier : 1);
    this.player.velocity.x = dir.x * speed;
    this.player.velocity.z = dir.z * speed;

    this.player.update(dt);

    // Sync player mesh position (for third person view / shadow)
    this.playerMesh.position.set(this.player.position.x, this.player.position.y, this.player.position.z);

    // First person: camera at eye height
    if (!this.isometric) {
      this.renderer.camera.position.set(
        this.player.position.x,
        this.player.position.y + this.eyeHeight,
        this.player.position.z
      );
      this.renderer.camera.rotation.y = this.yaw;
      this.renderer.camera.rotation.x = this.pitch;
    } else {
      const target = new THREE.Vector3(
        this.player.position.x,
        this.player.position.y + 1.5,
        this.player.position.z
      );
      const finalPos = target.clone().add(this.cameraOffset);
      this.renderer.camera.position.lerp(finalPos, 0.08);
      this.renderer.camera.lookAt(target.x, target.y, target.z);
    }
  }
}
