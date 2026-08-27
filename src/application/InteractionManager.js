/**
 * @file InteractionManager.js
 * @description Detecta proximidad del jugador con edificios y gestiona
 * interacciones: descubrimiento de arquitecturas, apertura de modales
 * y otorgamiento de XP por primera interacción.
 */

import * as THREE from 'three';
import { Discovery } from '../domain/Discovery.js';

/**
 * @class InteractionManager
 * @description En cada frame verifica qué edificio está más cercano al jugador
 * (dentro de su hitbox en el plano XZ). Al pulsar E, intenta interactuar:
 * descubre la arquitectura, abre el modal y otorga XP la primera vez.
 */
export class InteractionManager {
  /**
   * @param {Player} player - Modelo del jugador
   * @param {ArchitectureManager} archManager - Gestor de arquitecturas
   * @param {ProgressManager} progressManager - Gestor de progreso
   * @param {ArchitectureModal} modal - Modal de información
   */
  constructor(player, archManager, progressManager, modal) {
    this.player = player;
    this.archManager = archManager;
    this.progressManager = progressManager;
    this.modal = modal;
    /** @type {string|null} ID de la arquitectura más cercana */
    this.nearId = null;
    /** @type {Set<string>} IDs de edificios ya interactuados (para XP único) */
    this.interactedBuildings = new Set();
  }

  /**
   * Actualiza la detección de proximidad.
   * Verifica qué hitbox contiene al jugador y cuál está más cerca.
   */
  update() {
    const px = this.player.position.x;
    const pz = this.player.position.z;

    let nearest = null;
    let bestDist = Infinity;

    this.archManager.getAll().forEach(arch => {
      const box = this.archManager.getHitbox(arch.id);
      if (!box) return;

      // Verifica si el jugador está dentro de la hitbox en el plano XZ
      if (px < box.min.x || px > box.max.x || pz < box.min.z || pz > box.max.z) return;

      const center = box.getCenter(new THREE.Vector3());
      const dist = (center.x - px) ** 2 + (center.z - pz) ** 2;
      if (dist < bestDist) {
        bestDist = dist;
        nearest = arch.id;
      }
    });

    this.nearId = nearest;
  }

  /**
   * Retorna el ID de la arquitectura más cercana al jugador.
   * @returns {string|null}
   */
  getNearId() { return this.nearId; }

  /**
   * Intenta interactuar con la arquitectura cercana.
   * - Descubre la arquitectura (otorga 150 XP)
   * - Registra primera interacción (otorga 100 XP extra)
   * - Abre/cierra el modal de información
   */
  tryInteract() {
    if (!this.nearId) return;
    const arch = this.archManager.getById(this.nearId);
    if (!arch) return;
    this.archManager.setCurrent(this.nearId);
    this.progressManager.discover(this.nearId);
    
    if (!this.interactedBuildings.has(this.nearId)) {
      this.interactedBuildings.add(this.nearId);
      this.progressManager.addCompleted();
    }
    
    if (this.modal.isVisible() && this.modal.currentArch?.id === arch.id) {
      this.modal.hide();
    } else {
      this.modal.show(arch);
    }
  }
}