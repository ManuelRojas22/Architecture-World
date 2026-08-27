/**
 * @class Storage
 * @description Utilidad estática para persistencia en localStorage.
 * Gestiona dos claves: progreso del juego y flag de intro vista.
 * Todos los métodos son estáticos (no necesita instanciación).
 */
export class Storage {
  /** @const {string} Clave de localStorage para el progreso del juego */
  static KEY = 'architecture_world_progress';
  /** @const {string} Clave de localStorage para el flag de intro vista */
  static INTRO_KEY = 'architecture_world_intro_seen';

  /**
   * Carga el progreso desde localStorage.
   * @returns {{discovered: string[], completed: number, level: number, xp: number, xpMax: number}}
   *   Objeto con el progreso o valores por defecto si no existe o hay error
   */
  static load() {
    try {
      const raw = localStorage.getItem(this.KEY);
      return raw ? JSON.parse(raw) : { discovered: [], completed: 0, level: 1, xp: 0, xpMax: 1000 };
    } catch {
      return { discovered: [], completed: 0, level: 1, xp: 0, xpMax: 1000 };
    }
  }

  /**
   * Guarda el progreso en localStorage.
   * @param {Object} data - Objeto serializable con el progreso
   */
  static save(data) {
    localStorage.setItem(this.KEY, JSON.stringify(data));
  }

  /**
   * Verifica si el usuario ya vio la pantalla de introducción.
   * @returns {boolean} true si el flag está establecido como 'true'
   */
  static hasSeenIntro() {
    return localStorage.getItem(this.INTRO_KEY) === 'true';
  }

  /** Marca la introducción como vista en localStorage. */
  static markIntroSeen() {
    localStorage.setItem(this.INTRO_KEY, 'true');
  }

  /** Elimina todo el progreso y el flag de intro de localStorage. */
  static resetAll() {
    localStorage.removeItem(this.KEY);
    localStorage.removeItem(this.INTRO_KEY);
  }
}