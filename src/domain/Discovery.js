/**
 * @class Discovery
 * @description Utilidad estática para gestionar el descubrimiento de
 * arquitecturas. Opera sobre un Set<string> de IDs descubiertos,
 * proporcionando verificación, marcado, progreso y completitud.
 */
export class Discovery {
  /**
   * Verifica si una arquitectura ya fue descubierta.
   * @param {string} id - ID de la arquitectura
   * @param {Set<string>} discoveredSet - Set de IDs descubiertos
   * @returns {boolean} true si ya está en el Set
   */
  static isDiscovered(id, discoveredSet) {
    return discoveredSet.has(id);
  }

  /**
   * Marca una arquitectura como descubierta.
   * @param {string} id - ID de la arquitectura
   * @param {Set<string>} discoveredSet - Set de IDs descubiertos (mutado in-place)
   */
  static markDiscovered(id, discoveredSet) {
    discoveredSet.add(id);
  }

  /**
   * Genera texto de progreso legible.
   * @param {Set<string>} discoveredSet - Set de IDs descubiertos
   * @param {number} total - Total de arquitecturas en el juego
   * @returns {string} Ej: "3 / 6 Arquitecturas descubiertas"
   */
  static getProgress(discoveredSet, total) {
    return `${discoveredSet.size} / ${total} Arquitecturas descubiertas`;
  }

  /**
   * Verifica si se descubrieron todas las arquitecturas.
   * @param {Set<string>} discoveredSet - Set de IDs descubiertos
   * @param {number} total - Total de arquitecturas
   * @returns {boolean} true si discovered.size >= total
   */
  static isComplete(discoveredSet, total) {
    return discoveredSet.size >= total;
  }
}