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

export class GameManager {
  constructor() {
    this.renderer = new ThreeRenderer();
    this.player = new Player();
    this.controller = new PlayerController(this.renderer, this.player);
    this.buildingFactory = new BuildingFactory(this.renderer.scene);
    this.buildingFactory.createAll();

    this.environment = new Environment(this.renderer.scene, this.renderer.qualityTier);
    this.environment.buildAll();

    this.architectureManager = new ArchitectureManager(this.buildingFactory.getBuildings());
    this.player.collideTest = (x, z) => this.architectureManager.isBlocked(x, z);
    this.progressManager = new ProgressManager(Storage.load(), architectures.length);
    
    // Modal que se abre al pulsar E cerca de una estructura
    this.modal = new ArchitectureModal(this.progressManager);
    this.interactionManager = new InteractionManager(this.player, this.architectureManager, this.progressManager, this.modal);

    this.hud = new HUD(architectures.length);
    this.compendium = new Compendium(this.progressManager, architectures);
    this.endgame = new EndgameScreen();

    this.paused = false;
    this.setupEvents();
    this.animate();
  }

  setupEvents() {
    window.addEventListener('keydown', (e) => {
      if (e.code === 'KeyE' && !this.paused) this.interactionManager.tryInteract();
      if (e.code === 'KeyC') this.compendium.toggle();
    });
    this.progressManager.onComplete(() => this.endgame.show(this.progressManager.getStats()));
  }

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
