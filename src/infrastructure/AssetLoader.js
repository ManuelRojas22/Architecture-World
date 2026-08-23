import * as THREE from 'three';

export class AssetLoader {
  static async loadTexture(url) {
    const loader = new THREE.TextureLoader();
    return new Promise((resolve, reject) => loader.load(url, resolve, undefined, reject));
  }
  static async loadModel(url) {
    const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js');
    const loader = new GLTFLoader();
    return new Promise((resolve, reject) => loader.load(url, resolve, undefined, reject));
  }
}