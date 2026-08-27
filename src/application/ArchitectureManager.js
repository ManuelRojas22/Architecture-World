/**
 * @file ArchitectureManager.js
 * @description Gestiona las arquitecturas de software: sus modelos 3D,
 * hitboxes de interacción, colliders físicos y estado de selección.
 */

import { Architecture } from '../domain/Architecture.js';
import { architectures } from '../data/architectures.js';

/**
 * @class ArchitectureManager
 * @description Maintiene un mapa entre IDs de arquitectura y sus
 * representaciones 3D (mesh, hitbox, collider). Proporciona métodos
 * de consulta, verificación de colisiones y gestión de selección actual.
 */
export class ArchitectureManager {
  /**
   * @param {Array<{mesh: THREE.Group, def: Object, hitbox: THREE.Box3, collider: THREE.Box3}>} buildingList
   *   Lista de edificios creados por BuildingFactory
   */
  constructor(buildingList) {
    /** @type {Architecture[]} Instancias de dominio para cada arquitectura */
    this.architectures = architectures.map((d) => new Architecture(d));
    /** @type {Map<string, {mesh: THREE.Group, def: Object, hitbox: THREE.Box3, collider: THREE.Box3}>} */
    this.buildingMap = new Map();
    buildingList.forEach(({ mesh, def, hitbox, collider }) => this.buildingMap.set(def.id, { mesh, def, hitbox, collider }));
    /** @type {Architecture|null} Arquitectura actualmente seleccionada */
    this.current = null;
  }

  /** @returns {Architecture[]} Todas las arquitecturas */
  getAll() { return this.architectures; }

  /**
   * Busca una arquitectura por su ID.
   * @param {string} id - Identificador único
   * @returns {Architecture|undefined}
   */
  getById(id) { return this.architectures.find(a => a.id === id); }

  /**
   * Retorna el mesh Three.js de un edificio.
   * @param {string} id - ID de la arquitectura
   * @returns {THREE.Group|undefined}
   */
  getBuildingMesh(id) { return this.buildingMap.get(id)?.mesh; }

  /**
   * Retorna la hitbox de interacción (caja envolvente + margen).
   * @param {string} id - ID de la arquitectura
   * @returns {THREE.Box3|undefined}
   */
  getHitbox(id) { return this.buildingMap.get(id)?.hitbox; }

  /**
   * Retorna todos los colliders físicos (excluye elementos decorativos).
   * @returns {THREE.Box3[]}
   */
  getColliders() {
    return Array.from(this.buildingMap.values()).map(b => b.collider).filter(Boolean);
  }

  /**
   * Verifica si una posición (x, z) colisiona con algún collider.
   * @param {number} x - Coordenada X
   * @param {number} z - Coordenada Z
   * @param {number} [radius=0.5] - Radio de tolerancia
   * @returns {boolean} true si hay colisión
   */
  isBlocked(x, z, radius = 0.5) {
    return this.getColliders().some(c =>
      x > c.min.x - radius && x < c.max.x + radius &&
      z > c.min.z - radius && z < c.max.z + radius
    );
  }

  /**
   * Establece la arquitectura actualmente seleccionada.
   * @param {string} id
   */
  setCurrent(id) { this.current = this.getById(id); }

  /** @returns {Architecture|null} */
  getCurrent() { return this.current; }

  /** Limpia la selección actual. */
  clearCurrent() { this.current = null; }
}