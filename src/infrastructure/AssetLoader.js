/**
 * @class AssetLoader
 * @description Utilidad estática para cargar assets de Three.js (texturas y modelos).
 * Usa importación dinámica de GLTFLoader para mantener el bundle bajo control.
 */
import * as THREE from 'three';

export class AssetLoader {
  /**
   * Carga una textura desde una URL.
   * @param {string} url - Ruta de la imagen (ej: './textures/brick.png')
   * @returns {Promise<THREE.Texture>} Textura cargada
   */
  static async loadTexture(url) {
    const loader = new THREE.TextureLoader();
    return new Promise((resolve, reject) => loader.load(url, resolve, undefined, reject));
  }
  /**
   * Carga un modelo GLTF/GLB desde una URL.
   * Importa GLTFLoader dinámicamente para no incluirlo en el chunk principal.
   * @param {string} url - Ruta del archivo .gltf o .glb
   * @returns {Promise<THREE.Group>} Grupo raíz del modelo cargado
   */
  static async loadModel(url) {
    const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js');
    const loader = new GLTFLoader();
    return new Promise((resolve, reject) => loader.load(url, resolve, undefined, reject));
  }
}