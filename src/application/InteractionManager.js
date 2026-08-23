import * as THREE from 'three';
import { Discovery } from '../domain/Discovery.js';

export class InteractionManager {
  constructor(player, archManager, progressManager, modal) {
    this.player = player;
    this.archManager = archManager;
    this.progressManager = progressManager;
    this.modal = modal;
    this.nearId = null;
    this.interactedBuildings = new Set();
  }

  update() {
    const px = this.player.position.x;
    const pz = this.player.position.z;

    let nearest = null;
    let bestDist = Infinity;

    this.archManager.getAll().forEach(arch => {
      const box = this.archManager.getHitbox(arch.id);
      if (!box) return;

      // Dentro de la hitbox (comparación en el plano XZ)
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

  getNearId() { return this.nearId; }

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