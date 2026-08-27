/**
 * @file ProgressManager.js
 * @description Gestiona el progreso del jugador: descubrimientos de arquitecturas,
 * sistema de niveles con XP, y persistencia automática en Storage.
 */

import { Discovery } from '../domain/Discovery.js';
import { Storage } from '../infrastructure/Storage.js';

/**
 * @class ProgressManager
 * @description Maintiene el estado de progreso (IDs descubiertos, nivel, XP)
 * y dispara eventos cuando ocurren cambios importantes (descubrimiento,
 * completitud). La subida de nivel usa un factor de crecimiento del 1.3x
 * en el XP requerido por nivel.
 */
export class ProgressManager {
  /**
   * @param {Object} initialData - Datos iniciales cargados de Storage
   * @param {string[]} initialData.discovered - IDs de arquitecturas descubiertas
   * @param {number} [initialData.completed=0] - Interacciones completadas
   * @param {number} [initialData.level=1] - Nivel actual
   * @param {number} [initialData.xp=0] - XP acumulado
   * @param {number} [initialData.xpMax=1000] - XP necesario para siguiente nivel
   * @param {number} total - Total de arquitecturas en el juego
   */
  constructor(initialData = {}, total) {
    /** @type {Set<string>} IDs de arquitecturas descubiertas */
    this.discovered = new Set(initialData.discovered || []);
    /** @type {number} Total de arquitecturas */
    this.total = total;
    /** @type {number} Veces que el jugador interactuó con un edificio nuevo */
    this.completed = initialData.completed || 0;
    /** @type {number} Nivel actual del jugador */
    this.level = initialData.level || 1;
    /** @type {number} Puntos de experiencia acumulados */
    this.xp = initialData.xp || 0;
    /** @type {number} XP necesario para alcanzar el siguiente nivel */
    this.xpMax = initialData.xpMax || 1000;
    /** @type {(() => void)|null} Callback al completar todas las arquitecturas */
    this.onCompleteCallback = null;
    /** @type {((id: string) => void)|null} Callback al descubrir una arquitectura */
    this.onDiscoverCallback = null;
  }

  /**
   * Descubre una arquitectura. Si no estaba descubierta:
   * la marca, otorga 150 XP, persiste, verifica completitud y
   * dispara evento 'arch-discovered' en la ventana.
   * @param {string} id - ID de la arquitectura a descubrir
   */
  discover(id) {
    if (!this.discovered.has(id)) {
      Discovery.markDiscovered(id, this.discovered);
      this.addXP(150);
      this.persist();
      this.checkComplete();
      if (this.onDiscoverCallback) this.onDiscoverCallback(id);
      window.dispatchEvent(new CustomEvent('arch-discovered', { detail: { id } }));
    }
  }

  /**
   * Añade XP al jugador. Si supera xpMax, sube de nivel
   * y recalcula xpMax con factor 1.3x.
   * @param {number} amount - Cantidad de XP a añadir
   */
  addXP(amount) {
    this.xp += amount;
    while (this.xp >= this.xpMax) {
      this.xp -= this.xpMax;
      this.level++;
      this.xpMax = Math.floor(this.xpMax * 1.3);
    }
    this.persist();
  }

  /** Incrementa el contador de completadas y otorga 100 XP. */
  addCompleted() {
    this.completed++;
    this.addXP(100);
    this.persist();
  }

  /**
   * @param {string} id
   * @returns {boolean} true si la arquitectura fue descubierta
   */
  isDiscovered(id) { return Discovery.isDiscovered(id, this.discovered); }

  /** @returns {string} Texto de progreso (ej: "3 / 6 Arquitecturas descubiertas") */
  getProgressText() { return Discovery.getProgress(this.discovered, this.total); }

  /** @returns {string[]} Lista de IDs descubiertos */
  getDiscoveredList() { return Array.from(this.discovered); }

  /** @returns {number} Cantidad de arquitecturas descubiertas */
  getDiscoveredCount() { return this.discovered.size; }

  /**
   * Persiste el estado actual en Storage.
   * Se llama automáticamente tras cada cambio de estado.
   */
  persist() { 
    Storage.save({ 
      discovered: this.getDiscoveredList(),
      completed: this.completed,
      level: this.level,
      xp: this.xp,
      xpMax: this.xpMax
    }); 
  }

  /**
   * Verifica si se completó el juego (todas descubiertas)
   * y ejecuta el callback si existe.
   */
  checkComplete() {
    if (Discovery.isComplete(this.discovered, this.total) && this.onCompleteCallback) {
      this.onCompleteCallback();
    }
  }

  /**
   * Registra callback de completitud.
   * @param {() => void} cb - Se ejecuta al descubrir todas las arquitecturas
   */
  onComplete(cb) { this.onCompleteCallback = cb; }

  /**
   * Registra callback de descubrimiento.
   * @param {(id: string) => void} cb - Se ejecuta al descubrir una arquitectura
   */
  onDiscover(cb) { this.onDiscoverCallback = cb; }

  /**
   * Retorna estadísticas completas del progreso.
   * @returns {{discovered: number, total: number, completed: number, level: number, xp: number, xpMax: number}}
   */
  getStats() {
    return { 
      discovered: this.getDiscoveredList().length, 
      total: this.total,
      completed: this.completed,
      level: this.level,
      xp: this.xp,
      xpMax: this.xpMax
    };
  }
}