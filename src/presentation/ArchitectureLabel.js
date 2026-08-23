import * as THREE from 'three';
import { architectures } from '../data/architectures.js';

export class ArchitectureLabel {
  static createAll(scene) {
    architectures.forEach(def => {
      const sprite = this.makeSprite(`${def.order}. ${def.shortName}`);
      sprite.position.set(def.position.x, 16, def.position.z);
      sprite.userData.archId = def.id;
      scene.add(sprite);
    });
  }

  static makeSprite(text) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 512;
    canvas.height = 128;
    const padding = 18;
    const radius = 12;
    const w = canvas.width - padding*2;
    const h = canvas.height - padding*2 - 20; // space for arrow
    // background rounded rect
    ctx.shadowColor = 'rgba(0,0,0,0.55)';
    ctx.shadowBlur = 18;
    ctx.shadowOffsetY = 8;
    ctx.fillStyle = 'rgba(17,25,29,0.78)';
    ctx.beginPath();
    ctx.moveTo(padding + radius, padding);
    ctx.lineTo(padding + w - radius, padding);
    ctx.quadraticCurveTo(padding + w, padding, padding + w, padding + radius);
    ctx.lineTo(padding + w, padding + h - radius);
    ctx.quadraticCurveTo(padding + w, padding + h, padding + w - radius, padding + h);
    ctx.lineTo(padding + radius, padding + h);
    ctx.quadraticCurveTo(padding, padding + h, padding, padding + h - radius);
    ctx.lineTo(padding, padding + radius);
    ctx.quadraticCurveTo(padding, padding, padding + radius, padding);
    ctx.closePath();
    ctx.fill();
    // border
    ctx.shadowBlur = 0;
    ctx.strokeStyle = 'rgba(225,245,236,0.88)';
    ctx.lineWidth = 3;
    ctx.stroke();
    // text
    ctx.font = '700 36px "Segoe UI", sans-serif';
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, canvas.width/2, padding + h/2);
    // arrow down
    const cx = canvas.width/2;
    const ay = padding + h + 10;
    ctx.beginPath();
    ctx.moveTo(cx, ay);
    ctx.lineTo(cx - 12, ay - 14);
    ctx.lineTo(cx + 12, ay - 14);
    ctx.closePath();
    ctx.fillStyle = 'rgba(10,10,20,0.85)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(225,245,236,0.88)';
    ctx.lineWidth = 2;
    ctx.stroke();
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    const material = new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false });
    const sprite = new THREE.Sprite(material);
    sprite.scale.set(17, 4.25, 1);
    sprite.renderOrder = 999;
    return sprite;
  }

  static updateAll(camera) {
    // Sprites auto face camera
  }
}
