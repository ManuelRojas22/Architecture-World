/**
 * @class Architecture
 * @description Modelo de datos inmutable que representa una arquitectura
 * de software dentro del juego. Contiene metadatos, posición世界, color
 * y descripción detallada (qué es, cómo funciona, componentes, etc.).
 */
export class Architecture {
  /**
   * @param {Object} data - Definición de la arquitectura desde architectures.js
   * @param {string} data.id - Identificador único (ej: 'microservicios')
   * @param {number} data.order - Orden de presentación (1-6)
   * @param {string} data.name - Nombre completo en mayúsculas
   * @param {string} data.shortName - Nombre corto para UI
   * @param {{x: number, z: number}} data.position - Posición世界 en el plano XZ
   * @param {number} data.color - Color hexadecimal (ej: 0x00ffff)
   * @param {Object} data.description - Contenido educativo de la arquitectura
   */
  constructor(data) {
    this.id = data.id;
    this.order = data.order;
    this.name = data.name;
    this.shortName = data.shortName;
    this.position = data.position;
    this.color = data.color;
    this.description = data.description;
  }
}