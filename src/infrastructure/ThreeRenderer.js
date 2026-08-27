/**
 * @file ThreeRenderer.js
 * @description Motor de renderizado 3D con Three.js. Configura escena, cámara,
 * renderer WebGL, postprocesamiento (bloom, film grain), sistema de iluminación
 * completo (sol, luna, hemisphere, ambient), cielo procedural con shader,
 * suelo con relieve y reflejos, envmap para reflexiones, niebla exponencial,
 * y ciclo día/noche automático con posibilidad de control manual.
 */

import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { FilmPass } from 'three/examples/jsm/postprocessing/FilmPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';

/**
 * @class ThreeRenderer
 * @description Clase principal de renderizado. Detecta calidad del hardware,
 * configura el pipeline de renderizado con EffectComposer, gestiona el ciclo
 * día/noche actualizando todas las luces, cielo y niebla, y proporciona
 * métodos para ajustar cada parámetro gráfico desde la UI de opciones.
 */
export class ThreeRenderer {
  constructor() {
    try {
      this.qualityTier = this.detectQuality();
      this.cfg = {
        high:   { maxDPR: 1.5,  shadowMap: 2048, grass: 5000, flowers: 200, groundSeg: 160, film: true },
        medium: { maxDPR: 1.25, shadowMap: 2048, grass: 3000, flowers: 120, groundSeg: 120, film: false },
        low:    { maxDPR: 1.0,  shadowMap: 1024, grass: 1400, flowers: 60,  groundSeg: 96,  film: false },
      }[this.qualityTier];
      this.resScale = 1;
      this.resMode = 'auto';
      this.fpsLimit = null;
      this._lastFrame = 0;
      this._perfAccum = 0;
      this._perfFrames = 0;
      this._perfLast = 0;

      this.scene = new THREE.Scene();
      this.camera = new THREE.PerspectiveCamera(55, 1, 0.1, 800);
      this.camera.position.set(0, 14, 30);
      this.renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true, powerPreference: "high-performance" });
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
      this.renderer.toneMappingExposure = 1.15;
      this.renderer.setClearColor(0x87ceeb, 1);
      const app = document.getElementById('app');
      if (!app) throw new Error('#app element not found');
      app.appendChild(this.renderer.domElement);

      this.composer = new EffectComposer(this.renderer);
      this.composer.addPass(new RenderPass(this.scene, this.camera));

      const bloom = new UnrealBloomPass(
        new THREE.Vector2(window.innerWidth, window.innerHeight),
        0.45, 0.5, 0.85
      );
      this.composer.addPass(bloom);
      this.bloomPass = bloom;

      const isMobile = /Mobi|Android/i.test(navigator.userAgent);
      if (this.cfg.film && !isMobile) {
        const film = new FilmPass(0.025, false);
        this.composer.addPass(film);
      }

      this.composer.addPass(new OutputPass());

      this.applyRenderSize();

      this.clock = new THREE.Clock();
      this.setupLights();
      this.setupGround();
      this.setupSky();
      this.setupEnvironment();
      this.setupFog();
      this.setupResizeHandling();
    } catch (e) {
      console.error('ThreeRenderer initialization failed:', e);
      throw e;
    }
  }

  /** @param {boolean} enabled Activa/desactiva el efecto bloom */
  setBloom(enabled) { this.bloomPass.enabled = enabled; }
  /** @param {boolean} enabled Activa/desactiva las sombras */
  setShadows(enabled) { this.renderer.shadowMap.enabled = enabled; }
  /** @param {number} val Exposición de tono mapping (ACES Filmic) */
  setExposure(val) { this.renderer.toneMappingExposure = val; }
  /** @param {number} val Densidad de la niebla exponencial */
  setFogDensity(val) { if (this.scene.fog) this.scene.fog.density = val; }
  /**
   * Ajusta el campo de visión de la cámara.
   * @param {number} val - Ángulo en grados (ej: 55)
   */
  setFOV(val) {
    this.camera.fov = val;
    this.camera.updateProjectionMatrix();
  }
  /**
   * Activa/desactiva las reflexiones del environment map.
   * @param {boolean} enabled
   */
  setReflections(enabled) {
    this.reflectionsEnabled = enabled;
    this.scene.environment = enabled ? (this.currentEnv || null) : null;
  }
  /**
   * Ajusta la intensidad de las reflexiones del environment.
   * @param {number} val - Intensidad (0.0 - 2.0 recomendado)
   */
  setReflectionsIntensity(val) {
    this.envIntensity = val;
    if (this.reflectionsEnabled !== false && 'environmentIntensity' in this.scene) {
      this.scene.environmentIntensity = val;
    }
  }
  /**
   * Alterna entre ciclo día/noche automático y control manual.
   * @param {boolean} auto - true para ciclo automático
   */
  setDayAuto(auto) { this.manualDay = !auto; }

  /**
   * Establece la hora del día manualmente (solo cuando dayAuto es false).
   * @param {number} hours - Hora del día (6-18, donde 12 es mediodía)
   */
  setDayTime(hours) { this.dayHours = hours; }

  /**
   * Cambia el tamaño del mapa de sombras de la luz direccional.
   * @param {string} sizeStr - Tamaño en píxeles ('1024', '2048', '4096')
   */
  setShadowMapSize(sizeStr) {
    const size = parseInt(sizeStr, 10);
    if (this.directionalLight && this.directionalLight.shadow) {
      this.directionalLight.shadow.mapSize.set(size, size);
      this.directionalLight.shadow.map = null;
      this.directionalLight.shadow.needsUpdate = true;
    }
  }

  /**
   * Configura el sistema de iluminación de la escena:
   * - HemisphereLight (cielo suelo)
   * - DirectionalLight principal (sol) con sombras
   * - DirectionalLight de relleno
   * - AmbientLight base
   * - DirectionalLight de luna (inicialmente apagada)
   */
  setupLights() {
    const hemi = new THREE.HemisphereLight(0xfff8e7, 0x5a7f57, 1.1);
    this.scene.add(hemi);
    this.hemiLight = hemi;

    const dir = new THREE.DirectionalLight(0xfff2cf, 2.8);
    dir.position.set(50, 100, 40);
    dir.castShadow = true;
    dir.shadow.mapSize.set(this.cfg.shadowMap, this.cfg.shadowMap);
    dir.shadow.camera.near = 1;
    dir.shadow.camera.far = 300;
    dir.shadow.camera.left = -220;
    dir.shadow.camera.right = 220;
    dir.shadow.camera.top = 220;
    dir.shadow.camera.bottom = -220;
    dir.shadow.bias = -0.0003;
    dir.shadow.normalBias = 0.03;
    this.scene.add(dir);
    this.directionalLight = dir;

    const fill = new THREE.DirectionalLight(0x8ed3ff, 0.85);
    fill.position.set(-40, 50, -30);
    this.scene.add(fill);
    this.fillLight = fill;

    const ambient = new THREE.AmbientLight(0x6c8e68, 0.35);
    this.scene.add(ambient);
    this.ambientLight = ambient;

    // Luz de luna: direccional fría que solo actúa de noche
    const moonLight = new THREE.DirectionalLight(0xa8c8ff, 0);
    this.scene.add(moonLight);
    this.moonLight = moonLight;

    this.sunLight = dir;
    this.sunAngle = Math.PI / 4;
    this.sunHeight = Math.PI / 3;
  }

  /**
   * Crea el suelo del mundo con shader personalizado que incluye:
   * - Relief procedural (sin textura externa)
   * - Reflejo especular del sol y la luna
   * - Fade de color hacia el horizonte
   * También genera flores instanciadas sobre el terreno.
   */
  setupGround() {
    const seg = this.cfg.groundSeg;

    // Uniforms compartidos para los reflejos de sol/luna en el suelo
    this.groundUniforms = {
      uSunDir: { value: new THREE.Vector3(0.5, 0.8, 0.4).normalize() },
      uMoonDir: { value: new THREE.Vector3(-0.5, 0.4, -0.4).normalize() },
      uDayF: { value: 1 },
      uNightF: { value: 0 },
    };

    const groundGeo = new THREE.PlaneGeometry(500, 500, seg, seg);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x4a9d3c,
      roughness: 0.72,
      metalness: 0.05,
      envMapIntensity: 0.3,
      flatShading: false,
    });

    groundMat.onBeforeCompile = (shader) => {
      shader.uniforms.uSunDir = this.groundUniforms.uSunDir;
      shader.uniforms.uMoonDir = this.groundUniforms.uMoonDir;
      shader.uniforms.uDayF = this.groundUniforms.uDayF;
      shader.uniforms.uNightF = this.groundUniforms.uNightF;

      shader.vertexShader = 'varying vec3 vWPos;\n' + shader.vertexShader;
      shader.vertexShader = shader.vertexShader.replace(
        '#include <begin_vertex>',
        `
        float noise = sin(position.x * 0.035 + position.z * 0.055) * 0.12 +
                      sin(position.x * 0.095 - position.z * 0.065) * 0.08 +
                      sin(position.x * 0.02 + position.z * 0.02) * 0.04;
        vec3 transformed = vec3(position.x, position.y + noise, position.z);
        vWPos = (modelMatrix * vec4(transformed, 1.0)).xyz;
        `
      );
      shader.vertexShader = shader.vertexShader.replace(
        '#include <beginnormal_vertex>',
        `
        vec3 objectNormal = vec3(
          -sin(position.x * 0.035 + position.z * 0.055) * 0.035 * 0.12
          - sin(position.x * 0.095 - position.z * 0.065) * 0.095 * 0.08,
          1.0,
          -sin(position.x * 0.035 + position.z * 0.055) * 0.055 * 0.12
          + sin(position.x * 0.095 - position.z * 0.065) * 0.065 * 0.08
        );
        objectNormal = normalize(objectNormal);
        `
      );
      shader.fragmentShader = 'varying vec3 vWPos;\n' + shader.fragmentShader;
      shader.fragmentShader = `
        uniform vec3 uSunDir;
        uniform vec3 uMoonDir;
        uniform float uDayF;
        uniform float uNightF;
      ` + shader.fragmentShader;
      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <dithering_fragment>',
        `
        // Reflejo especular del sol y la luna sobre el terreno
        {
          vec3 Vg = normalize(cameraPosition - vWPos);
          vec3 Rg = reflect(-Vg, normal);
          float sunGlare = pow(max(dot(Rg, normalize(uSunDir)), 0.0), 420.0) * 1.6
                         + pow(max(dot(Rg, normalize(uSunDir)), 0.0), 48.0) * 0.10;
          float moonGlare = pow(max(dot(Rg, normalize(uMoonDir)), 0.0), 180.0) * 1.1
                          + pow(max(dot(Rg, normalize(uMoonDir)), 0.0), 32.0) * 0.06;
          gl_FragColor.rgb += (vec3(1.0, 0.86, 0.55) * sunGlare * uDayF)
                            + (vec3(0.78, 0.84, 1.0) * moonGlare * uNightF);
        }

        float dist = length(vWPos.xz);
        float fade = smoothstep(200.0, 240.0, dist);
        vec3 horizonColor = mix(vec3(0.4, 0.6, 0.8), vec3(0.6, 0.75, 0.9), fade);
        gl_FragColor.rgb = mix(gl_FragColor.rgb, horizonColor, fade * 0.3);
        #include <dithering_fragment>
        `
      );
    };

    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);
    this.ground = ground;

    const detailGeo = new THREE.PlaneGeometry(500, 500, 64, 64);
    const detailMat = new THREE.MeshStandardMaterial({
      color: 0x3a8d2c,
      roughness: 1,
      metalness: 0,
      transparent: true,
      opacity: 0.15,
      depthWrite: false,
    });
    const detail = new THREE.Mesh(detailGeo, detailMat);
    detail.rotation.x = -Math.PI / 2;
    detail.position.y = 0.03;
    this.scene.add(detail);

    this.flowerMeshes = [];
    const flowerCount = this.cfg.flowers;
    const flowerGeo = new THREE.SphereGeometry(0.08, 6, 6);
    const flowerMat = new THREE.MeshStandardMaterial({ roughness: 0.8 });
    const flowerColors = [0xff6b6b, 0xffd93d, 0xff6bff, 0xffffff, 0xff8c42];
    const flowers = new THREE.InstancedMesh(flowerGeo, flowerMat, flowerCount);
    const fDummy = new THREE.Object3D();
    const fColor = new THREE.Color();
    for (let i = 0; i < flowerCount; i++) {
      const radius = 25 + Math.random() * 200;
      const angle = Math.random() * Math.PI * 2;
      fDummy.position.set(Math.cos(angle) * radius, 0.35 + Math.random() * 0.1, Math.sin(angle) * radius);
      fDummy.scale.setScalar(0.5 + Math.random() * 0.5);
      fDummy.updateMatrix();
      flowers.setMatrixAt(i, fDummy.matrix);
      flowers.setColorAt(i, fColor.setHex(flowerColors[i % flowerColors.length]));
    }
    flowers.instanceMatrix.needsUpdate = true;
    if (flowers.instanceColor) flowers.instanceColor.needsUpdate = true;
    flowers.castShadow = true;
    this.scene.add(flowers);
  }

  /**
   * Crea el cielo procedural con shader que incluye:
   * - Degradado día/noche/atardecer
   * - Sol con disco y halo
   * - Luna con cara y halo pulsante
   * - Estrellas (solo de noche)
   * - Textura panorámica si está disponible (sky.png/sky.jpg)
   * También crea las mallas del sol y la luna con sus coronas.
   */
  setupSky() {
    const skyGeo = new THREE.SphereGeometry(500, 48, 32);
    skyGeo.scale(-1, 1, 1);

    this.skyUniforms = {
      uTime: { value: 0 },
      uSunDirection: { value: new THREE.Vector3(0.5, 0.8, 0.4).normalize() },
      uDayT: { value: 1 },
      uNightT: { value: 0 },
      uDuskF: { value: 0 },
      uHasTex: { value: 0 },
      uSkyTex: { value: null },
    };

    const skyMat = new THREE.ShaderMaterial({
      uniforms: this.skyUniforms,
      vertexShader: `
        varying vec3 vWorldPos;
        void main() {
          vec4 worldPos = modelMatrix * vec4(position, 1.0);
          vWorldPos = worldPos.xyz;
          gl_Position = projectionMatrix * viewMatrix * worldPos;
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform vec3 uSunDirection;
        uniform float uDayT;
        uniform float uNightT;
        uniform float uDuskF;
        uniform float uHasTex;
        uniform sampler2D uSkyTex;
        varying vec3 vWorldPos;

        float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
        float noise(vec2 p) {
          vec2 i = floor(p);
          vec2 f = fract(p);
          f = f * f * (3.0 - 2.0 * f);
          return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
                     mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
        }
        float fbm(vec2 p) {
          float v = 0.0, a = 0.5;
          for (int i = 0; i < 3; i++) {
            v += a * noise(p);
            p *= 2.0; a *= 0.5;
          }
          return v;
        }

        void main() {
          vec3 dir = normalize(vWorldPos);
          vec3 skyColor;

          if (uHasTex > 0.5) {
            // Cielo panorámico (equirectangular)
            vec2 uv = vec2(
              atan(dir.z, dir.x) / 6.28318530718 + 0.5,
              asin(clamp(dir.y, -1.0, 1.0)) / 3.14159265359 + 0.5
            );
            skyColor = texture2D(uSkyTex, uv).rgb;
            // Tinte según la hora: noche oscura pero legible, cálido al amanecer/atardecer
            float dayLift = max(uDayT, uDuskF * 0.55);
            skyColor *= mix(vec3(0.12, 0.15, 0.24), vec3(1.0), dayLift);
            skyColor = mix(skyColor, skyColor * vec3(1.25, 0.78, 0.52), uDuskF * 0.9);
          } else {
            // Degradado procedural de respaldo mientras carga o si falta la imagen
            float t1 = 1.0 - uNightT;
            vec3 zenith = mix(mix(vec3(0.015, 0.03, 0.08), vec3(0.18, 0.14, 0.32), t1), vec3(0.30, 0.52, 0.86), uDayT);
            vec3 horizon = mix(mix(vec3(0.05, 0.09, 0.17), vec3(0.98, 0.48, 0.22), t1), vec3(0.72, 0.84, 0.96), uDayT);
            float horizonFade = smoothstep(-0.1, 0.25, dir.y);
            skyColor = mix(horizon * 0.55, horizon, horizonFade);
            skyColor = mix(skyColor, zenith, smoothstep(0.1, 0.9, dir.y));
          }

          // El horizonte se calienta del lado donde está el sol (amanecer/atardecer)
          float sunAz = max(dot(
            normalize(vec3(dir.x, 0.0, dir.z)),
            normalize(vec3(uSunDirection.x, 0.0001, uSunDirection.z))
          ), 0.0);
          float lowSky = smoothstep(0.38, -0.02, dir.y);
          skyColor += vec3(1.0, 0.42, 0.15) * pow(sunAz, 3.0) * lowSky * uDuskF * 0.55;

          // Sol dibujado en el cielo (disco nítido + halo cálido)
          float sunDot = max(dot(dir, normalize(uSunDirection)), 0.0);
          vec3 sunTint = mix(vec3(1.0, 0.45, 0.18), vec3(1.0, 0.92, 0.72), uDayT);
          skyColor += sunTint * pow(sunDot, 900.0) * 8.0;
          skyColor += sunTint * pow(sunDot, 40.0) * 0.35;
          skyColor += sunTint * pow(sunDot, 6.0) * 0.08;

          // Estrellas solo de noche
          float stars = pow(max(0.0, 1.0 - dir.y * 2.0), 4.0);
          float starNoise = fbm(dir.xz * 50.0);
          stars *= step(0.97, starNoise);
          skyColor += vec3(0.9, 0.93, 1.0) * stars * uNightT * 0.85;

          gl_FragColor = vec4(skyColor, 1.0);
        }
      `,
      side: THREE.BackSide,
      depthWrite: false,
    });

    const sky = new THREE.Mesh(skyGeo, skyMat);
    this.scene.add(sky);
    this.sky = sky;

    // Textura de cielo con anisotropía para nitidez cerca del horizonte
    const loader = new THREE.TextureLoader();
    const maxAniso = this.renderer.capabilities.getMaxAnisotropy();
    const applySkyTexture = (tex, label) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.mapping = THREE.EquirectangularReflectionMapping;
      tex.anisotropy = Math.min(8, maxAniso);
      this.skyUniforms.uSkyTex.value = tex;
      this.skyUniforms.uHasTex.value = 1;
      // Los reflejos pasan a usar la foto real del cielo
      this.currentEnv = tex;
      if (this.reflectionsEnabled !== false) this.scene.environment = tex;
      console.info(`[SKY] Textura de cielo aplicada (${label})`);
    };
    // ?v= evita 404/respuestas viejas cacheadas por el navegador
    console.info('[SKY] Cargando sky.png…');
    loader.load(
      './sky.png?v=2',
      (t) => applySkyTexture(t, 'sky.png'),
      undefined,
      (err) => {
        console.warn('[SKY] sky.png falló, probando sky.jpg', err);
        loader.load('./sky.jpg', (t) => applySkyTexture(t, 'sky.jpg'), undefined,
          () => console.warn('[SKY] Sin imagen de cielo; usando degradado procedural'));
      }
    );

    // Sol físico con corona aditiva
    const sunGlowTex = this.makeRadialGlowTexture('255,236,170');
    const sunMesh = new THREE.Mesh(
      new THREE.SphereGeometry(16, 24, 24),
      new THREE.MeshBasicMaterial({ color: 0xfff3c0, fog: false })
    );
    const sunCorona = new THREE.Sprite(new THREE.SpriteMaterial({
      map: sunGlowTex,
      color: 0xffe9a8,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      fog: false,
    }));
    sunCorona.scale.set(150, 150, 1);
    sunMesh.add(sunCorona);
    this.sunMesh = sunMesh;
    this.scene.add(this.sunMesh);

    // Luna estilo "css night moon": disco lavanda con cráteres en relieve
    // y halo pulsante blanco → rosa → morado (referencia CodePen stazie/JjQqjeK)
    this.moon = new THREE.Group();

    this.moonBody = new THREE.Sprite(new THREE.SpriteMaterial({
      map: this.makeMoonFaceTexture(),
      transparent: true,
      depthWrite: false,
      fog: false,
    }));
    this.moonBody.scale.set(46, 46, 1);
    this.moon.add(this.moonBody);

    this.moonGlows = [];
    [
      ['245,228,228', 100, 0.85],  // halo blanco cálido interno
      ['202,105,181', 145, 0.5],   // rosa
      ['231,114,225', 195, 0.38],  // morado externo
    ].forEach(([rgb, size, opacity]) => {
      const glow = new THREE.Sprite(new THREE.SpriteMaterial({
        map: this.makeRadialGlowTexture(rgb),
        transparent: true,
        opacity,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        fog: false,
      }));
      glow.userData.baseScale = size;
      glow.userData.baseOpacity = opacity;
      glow.scale.set(size, size, 1);
      this.moon.add(glow);
      this.moonGlows.push(glow);
    });

    this.scene.add(this.moon);
  }

  /**
   * Genera una textura de glow radial en Canvas 2D.
   * Usada para la corona del sol y los halos de la luna.
   * @param {string} rgb - Color en formato "R,G,B" (ej: "255,236,170")
   * @returns {THREE.CanvasTexture} Textura de glow
   */
  makeRadialGlowTexture(rgb) {
    const c = document.createElement('canvas');
    c.width = c.height = 128;
    const ctx = c.getContext('2d');
    const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    g.addColorStop(0, `rgba(${rgb},0.85)`);
    g.addColorStop(0.25, `rgba(${rgb},0.35)`);
    g.addColorStop(0.6, `rgba(${rgb},0.08)`);
    g.addColorStop(1, `rgba(${rgb},0)`);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 128, 128);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  // Cara de la luna según la referencia "css night moon" (CodePen stazie/JjQqjeK):
  // disco con degradado lavanda→blanco y cráteres con borde claro y sombra interior.
  /**
   * Genera la textura de la cara de la luna en Canvas 2D.
   * Incluye degradado lavanda→blanco y cráteres con borde claro y sombra interior.
   * Referencia: CodePen "css night moon" de stazie/JjQqjeK.
   * @returns {THREE.CanvasTexture} Textura de 512x512
   */
  makeMoonFaceTexture() {
    const S = 512;
    const c = document.createElement('canvas');
    c.width = c.height = S;
    const x = c.getContext('2d');
    const cx = S / 2;

    x.save();
    x.beginPath();
    x.arc(cx, cx, cx - 2, 0, Math.PI * 2);
    x.clip();

    const bg = x.createRadialGradient(cx, cx, 0, cx, cx, cx);
    bg.addColorStop(0, 'rgba(222, 213, 228, 0.89)');
    bg.addColorStop(0.55, '#ece7ee');
    bg.addColorStop(1, '#f8f6f6');
    x.fillStyle = bg;
    x.fillRect(0, 0, S, S);

    // Posiciones/diámetros de los cráteres del pen sobre su luna de 150 px
    const craters = [
      [70, 80, 30], [40, 45, 10], [50, 25, 20],
      [100, 35, 15], [60, 120, 10], [20, 90, 20],
    ];
    const k = S / 150;
    craters.forEach(([left, top, d]) => {
      const r = (d / 2) * k * 1.35;
      const px = (left + d / 2) * k;
      const py = (top + d / 2) * k;

      // Sombra interior desplazada abajo-derecha (luz desde arriba-izquierda)
      x.fillStyle = 'rgba(163, 148, 163, 0.55)';
      x.beginPath();
      x.arc(px + r * 0.14, py + r * 0.18, r, 0, Math.PI * 2);
      x.fill();

      // Base del cráter ligeramente más oscura que la superficie
      x.fillStyle = 'rgba(214, 204, 218, 0.92)';
      x.beginPath();
      x.arc(px - r * 0.05, py - r * 0.06, r * 0.9, 0, Math.PI * 2);
      x.fill();

      // Borde claro alrededor (border 4px solid rgb(216,205,219) del pen)
      x.strokeStyle = 'rgba(224, 214, 227, 0.95)';
      x.lineWidth = Math.max(2.5, r * 0.16);
      x.beginPath();
      x.arc(px, py, r, 0, Math.PI * 2);
      x.stroke();

      // Brillo inferior-derecho en el borde interior
      x.strokeStyle = 'rgba(246, 242, 247, 0.85)';
      x.lineWidth = Math.max(1.5, r * 0.1);
      x.beginPath();
      x.arc(px, py, r * 0.82, Math.PI * 0.08, Math.PI * 0.92);
      x.stroke();
    });

    x.restore();

    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  /**
   * Genera un environment map PMREM desde el cielo procedural
   * y lo aplica a toda la escena para reflexiones suaves en materiales PBR.
   * Incluye un sol tenue en el envmap para dar dirección a los brillos.
   */
  setupEnvironment() {
    // Genera un envmap PMREM desde el cielo procedural y lo aplica a toda la escena:
    // todos los materiales estándar del mapa pasan a reflejar el ambiente (suave).
    this.envIntensity = 0.35;
    this.reflectionsEnabled = true;
    try {
      const pmrem = new THREE.PMREMGenerator(this.renderer);
      pmrem.compileEquirectangularShader();

      const envScene = new THREE.Scene();
      const skyClone = this.sky.clone();
      skyClone.material = this.sky.material;
      envScene.add(skyClone);

      // Sol tenue en el envmap: da dirección a los brillos sin quemar la imagen
      const sunPos = this.skyUniforms.uSunDirection.value.clone().multiplyScalar(100);
      const sunDummy = new THREE.Mesh(
        new THREE.SphereGeometry(4, 16, 16),
        new THREE.MeshBasicMaterial({ color: 0x6e6552 })
      );
      sunDummy.position.copy(sunPos);
      envScene.add(sunDummy);

      const blur = this.qualityTier === 'high' ? 0.08 : 0.15;
      const envRT = pmrem.fromScene(envScene, blur);
      this.scene.environment = envRT.texture;
      if ('environmentIntensity' in this.scene) this.scene.environmentIntensity = this.envIntensity;
      this.envRT = envRT;
      this.currentEnv = envRT.texture;
      pmrem.dispose();
    } catch (e) {
      console.warn('Env map generation failed, continuing without reflections:', e);
    }
  }

  /** Configura niebla exponencial con color base celeste. */
  setupFog() {
    this.scene.fog = new THREE.FogExp2(0x9fd4ff, 0.0038);
  }

  /**
   * Detecta la calidad del hardware y retorna un tier ('high', 'medium', 'low').
   * Considera: user agent, núcleos de CPU, memoria del dispositivo y píxeles totales.
   * @returns {'high'|'medium'|'low'}
   */
  detectQuality() {
    const isMobile = /Mobi|Android/i.test(navigator.userAgent);
    const cores = navigator.hardwareConcurrency || 4;
    const mem = navigator.deviceMemory || 8;
    if (isMobile || cores <= 4 || mem <= 4) return 'low';
    const pixels = screen.width * screen.height * Math.min(window.devicePixelRatio || 1, 2);
    if (cores <= 8 || pixels > 4200000) return 'medium';
    return 'high';
  }

  // mode: 'auto' (según pantalla/calidad) o altura objetivo del buffer: 1080, 1440…
  /**
   * Establece el modo de resolución de renderizado.
   * @param {string|number} mode - 'auto' o altura objetivo en píxeles (1080, 1440, etc.)
   */
  setResolutionMode(mode) {
    const n = typeof mode === 'string' ? parseInt(mode, 10) : mode;
    this.resMode = Number.isFinite(n) && n >= 360 ? n : 'auto';
    this.applyRenderSize();
  }

  // fps: número (0 o inválido = sin límite). El bucle llama a beginFrame() y
  // salta los frames sobrantes en lugar de renderizar más rápido que el límite.
  /**
   * Establece el límite de FPS. El bucle llama a beginFrame() y
   * salta los frames que excedan el límite en lugar de renderizar más rápido.
   * @param {number|string} fps - Número de FPS objetivo (0 o inválido = sin límite)
   */
  setFpsLimit(fps) {
    const n = typeof fps === 'string' ? parseFloat(fps) : fps;
    this.fpsLimit = Number.isFinite(n) && n >= 10 ? n : null;
    this._lastFrame = 0;
  }

  /**
   * Verifica si el frame actual debe renderizarse según el límite de FPS.
   * @returns {boolean} true si el frame debe renderizarse
   */
  beginFrame() {
    if (!this.fpsLimit) return true;
    const now = performance.now();
    if (now - this._lastFrame < 1000 / this.fpsLimit - 0.5) return false;
    this._lastFrame = now;
    return true;
  }

  /**
   * Calcula el pixel ratio objetivo según el modo de resolución.
   * @param {number} height - Altura del viewport en píxeles
   * @returns {number} Pixel ratio a aplicar
   */
  targetPixelRatio(height) {
    if (this.resMode === 'auto') {
      return Math.min(window.devicePixelRatio || 1, this.cfg.maxDPR);
    }
    // Renderiza al alto solicitado aunque supere la ventana; el navegador
    // reescala el canvas por CSS, igual que un juego en ventana.
    return THREE.MathUtils.clamp(this.resMode / height, 0.25, 4);
  }

  /** Aplica el tamaño de renderizado actualizando pixel ratio, cámara y canvas. */
  applyRenderSize() {
    const { width, height } = this.getViewport();
    const pr = this.targetPixelRatio(height) * this.resScale;
    this.renderer.setPixelRatio(pr);
    if (this.composer) this.composer.setPixelRatio(pr);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
    if (this.composer) this.composer.setSize(width, height);
  }
  /** Configura listeners de resize con debounce por requestAnimationFrame. */
  setupResizeHandling() {
    let resizeTimer = null;
    const requestResize = () => {
      if (resizeTimer) cancelAnimationFrame(resizeTimer);
      resizeTimer = requestAnimationFrame(() => {
        resizeTimer = null;
        this.onResize();
      });
    };
    window.addEventListener('resize', requestResize);
    window.addEventListener('orientationchange', requestResize);
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', requestResize);
    }
  }

  /**
   * Retorna las dimensiones del viewport considerando visualViewport (móvil).
   * @returns {{width: number, height: number}}
   */
  getViewport() {
    const vv = window.visualViewport;
    return {
      width: Math.max(1, Math.floor(vv ? vv.width : window.innerWidth)),
      height: Math.max(1, Math.floor(vv ? vv.height : window.innerHeight)),
    };
  }

  /** Handler de resize: re-aplica tamaño de renderizado. */
  onResize() {
    this.applyRenderSize();
  }

  /**
   * Monitorea FPS promedio cada segundo y ajusta la resolución
   * si el rendimiento es bajo (<45 FPS) o alto (>58 FPS).
   */
  monitorPerformance() {
    const now = performance.now();
    if (!this._perfLast) {
      this._perfLast = now;
      return;
    }
    this._perfAccum += now - this._perfLast;
    this._perfFrames++;
    this._perfLast = now;
    if (this._perfAccum >= 1000 && this._perfFrames >= 20) {
      const avgFps = 1000 / (this._perfAccum / this._perfFrames);
      this._perfAccum = 0;
      this._perfFrames = 0;
      this.adjustResolution(avgFps);
    }
  }

  /**
   * Ajusta la escala de resolución según el FPS promedio.
   * - Si FPS < 45: reduce resScale (mínimo 0.6)
   * - Si FPS > 58: aumenta resScale (máximo 1.0)
   * No ajusta si hay FPS limit activo y se está cerca del límite.
   * @param {number} fps - FPS promedio del último segundo
   */
  adjustResolution(fps) {
    if (!isFinite(fps)) return;
    // Con límite de FPS activo, acercarse al límite NO es bajo rendimiento
    if (this.fpsLimit && fps > this.fpsLimit * 0.75) return;
    if (fps < 45 && this.resScale > 0.6) {
      this.resScale = Math.max(0.6, this.resScale - 0.12);
      this.applyRenderSize();
    } else if (fps > 58 && this.resScale < 1) {
      this.resScale = Math.min(1, this.resScale + 0.06);
      this.applyRenderSize();
    }
  }

  /**
   * Retorna el delta time del frame actual, limitado a 1/30s máximo.
   * @returns {number} Delta time en segundos
   */
  getDelta() {
    return Math.min(this.clock.getDelta(), 1 / 30);
  }

  /**
   * Actualiza el ciclo día/noche completo:
   * - Posición e intensidad del sol y la luna
   * - Tintes del cielo (día, noche, atardecer)
   * - Intensidad de todas las luces ambientales
   * - Color de la niebla
   * - Reflejos en el suelo
   * Soporta modo automático (ciclo lento) y manual (hora fija).
   * @param {number} time - Timestamp de performance.now()
   */
  updateSun(time) {
    if (!this.sunLight || !this.skyUniforms) return;

    // +π/2 → la partida arranca al mediodía (se ve el cielo foto desde el primer segundo)
    let dayCycle = (time * 0.00001 + Math.PI / 2) % (Math.PI * 2);
    if (this.manualDay && Number.isFinite(this.dayHours)) {
      // h=6 → amanecer (0), h=12 → mediodía (π/2), h=18 → atardecer (π)
      dayCycle = ((this.dayHours - 6) / 24) * Math.PI * 2;
    }

    const sunX = Math.cos(dayCycle) * Math.cos(this.sunAngle);
    const sunY = Math.sin(dayCycle);
    const sunZ = Math.cos(dayCycle) * Math.sin(this.sunAngle);
    
    this.sunLight.position.set(sunX * 100, sunY * 100, sunZ * 100);
    this.sunLight.target.position.set(0, 0, 0);
    
    const sunIntensity = Math.max(0, Math.sin(dayCycle)) * 2.8 + 0.4;
    this.sunLight.intensity = sunIntensity;
    
    this.skyUniforms.uSunDirection.value.set(sunX, sunY, sunZ).normalize();
    this.skyUniforms.uTime.value = time * 0.001;

    // Sol y luna: como en la vida real, cuando uno se oculta el otro sale
    const R = 470;
    if (this.sunMesh) {
      this.sunMesh.position.set(sunX * R, sunY * R, sunZ * R);
      this.sunMesh.visible = sunY > -0.12;
    }
    if (this.moon) {
      const moonDir = new THREE.Vector3(-sunX, Math.max(0.18, -sunY * 0.75), -sunZ).normalize();
      this.moon.position.copy(moonDir).multiplyScalar(R * 0.96);
      const fade = THREE.MathUtils.clamp((-sunY + 0.1) / 0.3, 0, 1);
      this.moon.visible = fade > 0.02 && moonDir.y > 0.02;

      // Pulso del halo cada 5 s, como la animación de la referencia
      const pulse = 0.5 + 0.5 * Math.sin((time % 5000) / 5000 * Math.PI * 2);
      if (this.moonBody) this.moonBody.material.opacity = (0.35 + 0.65 * fade);
      this.moonGlows?.forEach((glow) => {
        const k = 1 + 0.12 * pulse;
        glow.scale.set(glow.userData.baseScale * k, glow.userData.baseScale * k, 1);
        glow.material.opacity = glow.userData.baseOpacity * fade * (0.72 + 0.45 * pulse);
      });
    }

    // Tintes horarios del cielo
    this.skyUniforms.uDayT.value = THREE.MathUtils.smoothstep(sunY, 0.02, 0.35);
    this.skyUniforms.uNightT.value = 1 - THREE.MathUtils.smoothstep(sunY, -0.30, -0.02);
    this.skyUniforms.uDuskF.value = Math.max(0, 1 - Math.abs(sunY) / 0.26);

    const dayT = this.skyUniforms.uDayT.value;
    const nightT = this.skyUniforms.uNightT.value;
    const duskF = this.skyUniforms.uDuskF.value;

    // Las luces del mundo acompañan la hora
    if (this.hemiLight) this.hemiLight.intensity = 0.12 + dayT * 0.95;
    if (this.fillLight) this.fillLight.intensity = 0.18 + dayT * 0.62;
    if (this.ambientLight) this.ambientLight.intensity = 0.10 + dayT * 0.25;

    // Luz solar cálida al amanecer/atardecer
    if (this.sunLight) {
      this.sunLight.color.lerpColors(new THREE.Color(0xff8f4d), new THREE.Color(0xfff6dd), dayT);
    }

    // Luz de luna fría dirigida desde la posición de la luna
    if (this.moonLight && this.moon) {
      this.moonLight.position.copy(this.moon.position).normalize().multiplyScalar(100);
      this.moonLight.intensity = nightT * 0.5;
    }

    // Color del disco solar según la hora
    if (this.sunMesh) {
      this.sunMesh.material.color.lerpColors(new THREE.Color(0xffa060), new THREE.Color(0xfff3c0), dayT);
    }

    // Direcciones y factores para los reflejos en el suelo
    if (this.groundUniforms) {
      this.groundUniforms.uSunDir.value.set(sunX, sunY, sunZ).normalize();
      const moonH = Math.max(0.12, -sunY * 0.6);
      this.groundUniforms.uMoonDir.value.set(-sunX, moonH, -sunZ).normalize();
      this.groundUniforms.uDayF.value = THREE.MathUtils.smoothstep(sunY, -0.05, 0.15);
      this.groundUniforms.uNightF.value = THREE.MathUtils.clamp((-sunY + 0.05) / 0.25, 0, 1);
    }

    if (this.scene.fog) {
      const fogDensity = 0.0025 + Math.max(0, Math.sin(dayCycle + Math.PI * 0.3)) * 0.002;
      this.scene.fog.density = fogDensity;
      const fogColor = new THREE.Color().lerpColors(
        new THREE.Color(0x4a6a8a),
        new THREE.Color(0x9fd4ff),
        Math.max(0, Math.sin(dayCycle))
      );
      this.scene.fog.color = fogColor;
    }
  }

  /**
   * Frame principal de renderizado.
   * Actualiza el ciclo día/noche, renderiza con EffectComposer (bloom + film)
   * y monitorea rendimiento para auto-escalado.
   */
  render() {
    const time = performance.now();
    this.updateSun(time);
    this.composer.render();
    this.monitorPerformance();
  }

  /** Añade un objeto 3D a la escena. @param {THREE.Object3D} object */
  add(object) {
    this.scene.add(object);
  }

  /** Elimina un objeto 3D de la escena. @param {THREE.Object3D} object */
  remove(object) {
    this.scene.remove(object);
  }
}