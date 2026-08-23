import { Architecture } from '../domain/Architecture.js';
import { architectures } from '../data/architectures.js';

export class ArchitectureManager {
  constructor(buildingList) {
    this.architectures = architectures.map((d) => new Architecture(d));
    this.buildingMap = new Map();
    buildingList.forEach(({ mesh, def, hitbox, collider }) => this.buildingMap.set(def.id, { mesh, def, hitbox, collider }));
    this.current = null;
  }

  getAll() { return this.architectures; }

  getById(id) { return this.architectures.find(a => a.id === id); }

  getBuildingMesh(id) { return this.buildingMap.get(id)?.mesh; }

  getHitbox(id) { return this.buildingMap.get(id)?.hitbox; }

  getColliders() {
    return Array.from(this.buildingMap.values()).map(b => b.collider).filter(Boolean);
  }

  isBlocked(x, z, radius = 0.5) {
    return this.getColliders().some(c =>
      x > c.min.x - radius && x < c.max.x + radius &&
      z > c.min.z - radius && z < c.max.z + radius
    );
  }

  setCurrent(id) { this.current = this.getById(id); }

  getCurrent() { return this.current; }

  clearCurrent() { this.current = null; }
}