/**
 * @file GameManager.js
 * @description Orquestador principal del juego. Crea e inicializa todos los
 * subsistemas (renderizado, jugador, entorno, edificios, UI) y ejecuta
 * el bucle de animación principal con requestAnimationFrame.
 */

import { ThreeRenderer } from '../infrastructure/ThreeRenderer.js';
import { Player } from '../domain/Player.js';
import { PlayerController } from '../infrastructure/PlayerController.js';
import { BuildingFactory } from '../infrastructure/BuildingFactory.js';
import { Environment } from '../infrastructure/Environment.js';
import { ArchitectureManager } from './ArchitectureManager.js';
import { ProgressManager } from './ProgressManager.js';
import { InteractionManager } from './InteractionManager.js';
import { HUD } from '../presentation/HUD.js';
import { Compendium } from '../presentation/Compendium.js';
import { ArchitectureModal } from '../presentation/ArchitectureModal.js';
import { EndgameScreen } from '../presentation/EndgameScreen.js';
import { Storage } from '../infrastructure/Storage.js';
import { architectures } from '../data/architectures.js';

/**
 * @class GameManager
 * @description Clase principal que gestiona el ciclo de vida completo del juego.
 * En el constructor instancia todos los subsistemas y enlaza sus dependencias.
 * El método animate() ejecuta el game loop que actualiza física, entorno,
 * animaciones de edificios, interacciones y renderiza cada frame.
 */
export class GameManager {
  constructor() {
    /** @type {ThreeRenderer} Motor de renderizado 3D */
    this.renderer = new ThreeRenderer();
    /** @type {Player} Modelo de física del jugador */
    this.player = new Player();
    /** @type {PlayerController} Controla input y cámara del jugador */
    this.controller = new PlayerController(this.renderer, this.player);
    /** @type {BuildingFactory} Crea los 6 edificios 3D de arquitecturas */
    this.buildingFactory = new BuildingFactory(this.renderer.scene);
    this.buildingFactory.createAll();

    /** @type {Environment} Entorno: terreno, árboles, agua, cielo, etc. */
    this.environment = new Environment(this.renderer.scene, this.renderer.qualityTier);
    this.environment.buildAll();

    /** @type {ArchitectureManager} Gestión de arquitecturas y colisiones */
    this.architectureManager = new ArchitectureManager(this.buildingFactory.getBuildings());
    this.player.collideTest = (x, z) => this.architectureManager.isBlocked(x, z);
    /** @type {ProgressManager} Progreso del jugador (descubrimientos, XP, nivel) */
    this.progressManager = new ProgressManager(Storage.load(), architectures.length);
    
    /** @type {ArchitectureModal} Modal de información de arquitectura */
    this.modal = new ArchitectureModal(this.progressManager);
    /** @type {InteractionManager} Detección de proximidad e interacción */
    this.interactionManager = new InteractionManager(this.player, this.architectureManager, this.progressManager, this.modal);

    /** @type {HUD} Interfaz en pantalla (barra de progreso, prompt E) */
    this.hud = new HUD(architectures.length);
    /** @type {Compendium} Cuaderno de arquitecturas descubiertas */
    this.compendium = new Compendium(this.progressManager, architectures);
    /** @type {EndgameScreen} Pantalla de victoria */
    this.endgame = new EndgameScreen();

    /** @type {boolean} Estado de pausa (no se actualiza si es true) */
    this.paused = false;
    this.setupEvents();
    this.animate();
  }

  /**
   * Configura los event listeners del teclado:
   * - KeyE: interactuar con edificio cercano
   * - KeyC: abrir/cerrar compendio
   * También registra callback de completitud para EndgameScreen.
   */
  setupEvents() {
    window.addEventListener('keydown', (e) => {
      if (e.code === 'KeyE' && !this.paused) this.interactionManager.tryInteract();
      if (e.code === 'KeyC') this.compendium.toggle();
    });
    this.progressManager.onComplete(() => this.endgame.show(this.progressManager.getStats()));
  }

  /**
   * Bucle principal de animación (requestAnimationFrame).
   * En cada frame: actualiza input del jugador, entorno, edificios,
   * interacciones, HUD y renderiza la escena con postprocesamiento.
   */
  animate() {
    requestAnimationFrame(() => this.animate());
    if (!this.renderer.beginFrame()) return;
    const dt = this.renderer.getDelta();
    const time = performance.now();
    this.controller.update(dt);
    this.environment.update(dt, time, this.renderer.camera.position);
    this.buildingFactory.update(dt);
    this.interactionManager.update(dt);
    const near = this.interactionManager.getNearId();
    this.hud.show(!!near);
    this.hud.setProgress(this.progressManager.getDiscoveredCount());
    this.renderer.render();
  }
}
