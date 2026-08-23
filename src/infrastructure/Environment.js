import * as THREE from 'three';
import { architectures } from '../data/architectures.js';

function smoothstep(a, b, x) {
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
}

const _lightPos = new THREE.Vector3();

export class Environment {
  constructor(scene, quality = 'high') {
    this.scene = scene;
    this.quality = quality;
    this.treeMeshes = [];
    this.rockMeshes = [];
    this.lampMeshes = [];
    this.fireflies = [];
    this.treeSwayOffsets = [];
    this.lampFlickerOffsets = [];
    this.skyUniforms = null;
    this.waterSpots = [];
    this.waterMaterials = [];
    this.grassMesh = null;
    this.grassUniforms = { uTime: { value: 0 } };
    this.cloudMeshes = [];
    this.plazaRadius = 15;
    this.roadClearance = 10;
    this.pondX = -105;
    this.pondZ = -7;
    this.pathCurves = [];
    this.pathSamples = [];
    this.pathExits = [];
    this.districtPads = [];
    this.floatingOrbs = [];
    this.districtLeafColors = {
      microservicios: 0x1e7a7a,
      monolitica: 0xb08a4a,
      serverless: 0x3fae7a,
      encapas: 0x9a4a9a,
      eventos: 0xb05a5a,
      headless: 0x7a5ab0,
    };
    this.pathCurveProfiles = {
      microservicios: { o1: 5, o2: 4 },
      monolitica: { o1: -5, o2: 4 },
      serverless: { o1: 4, o2: 6 },
      encapas: { o1: -4, o2: 3 },
      eventos: { o1: -6, o2: 4 },
      headless: { o1: 5, o2: 4 },
    };
    this.roadMat = new THREE.MeshStandardMaterial({ color: 0x3a3a3a, roughness: 0.85, metalness: 0.05 });
    this.sidewalkMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, roughness: 0.9, metalness: 0 });
    this.curbMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 1, metalness: 0 });
  }

  buildAll() {
    this.buildPaths();
    this.buildCentralPlaza();
    this.buildWater();
    this.buildMountains();
    this.buildLamps();
    const q = this.quality;
    this.scatterTreesInstanced(q === 'low' ? 80 : q === 'medium' ? 120 : 180);
    this.scatterRocksInstanced(q === 'low' ? 30 : q === 'medium' ? 50 : 80);
    this.buildFireflies(q === 'low' ? 20 : q === 'medium' ? 36 : 60);
    this.buildClouds(q === 'low' ? 6 : q === 'medium' ? 9 : 14);
    this.buildParticleSystems();
    this.collectPointLights();
    this.buildGrass();
  }

  setGrassVisible(visible) {
    if (this.grassMesh) this.grassMesh.visible = visible;
  }

  // ¿Es una zona "verde"? (lejos de plaza, edificios, pads, agua y caminos)
  isGreenSpot(x, z) {
    if (Math.hypot(x, z) < this.plazaRadius + 3) return false;
    for (const def of architectures) {
      if (Math.hypot(x - def.position.x, z - def.position.z) < 27) return false;
    }
    for (const p of this.districtPads || []) {
      if (Math.hypot(x - p.x, z - p.z) < 14) return false;
    }
    for (const s of this.waterSpots) {
      if (Math.hypot(x - s.x, z - s.z) < s.r + 3) return false;
    }
    const clear = this.roadClearance + 1.5;
    for (const pts of this.pathSamples) {
      for (let i = 0; i < pts.length; i++) {
        if (Math.hypot(x - pts[i].x, z - pts[i].z) < clear) return false;
      }
    }
    return true;
  }

  // Césped alto instanciado por todo el mapa, con viento en shader
  buildGrass() {
    const q = this.quality;
    const count = q === 'low' ? 3500 : q === 'medium' ? 8000 : 14000;

    // Brizna: plano vertical estrecho, afinado hacia la punta y curvado
    const bladeGeo = new THREE.PlaneGeometry(0.16, 1, 1, 3);
    bladeGeo.translate(0, 0.5, 0);
    {
      const pos = bladeGeo.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const t = pos.getY(i);
        pos.setX(i, pos.getX(i) * (1 - t * 0.72));
        pos.setZ(i, Math.pow(t, 1.6) * 0.22);
      }
      pos.needsUpdate = true;
      bladeGeo.computeVertexNormals();
    }

    const bladeMat = new THREE.MeshStandardMaterial({
      color: 0x3f8f2f,
      roughness: 0.95,
      metalness: 0,
      side: THREE.DoubleSide,
    });
    bladeMat.onBeforeCompile = (shader) => {
      shader.uniforms.uTime = this.grassUniforms.uTime;
      shader.vertexShader = shader.vertexShader
        .replace('#include <common>', '#include <common>\nuniform float uTime;\nvarying float vHgt;')
        .replace('#include <begin_vertex>', `#include <begin_vertex>
vHgt = clamp(transformed.y, 0.0, 1.0);
#ifdef USE_INSTANCING
  vec3 gIp = vec3(instanceMatrix[3][0], instanceMatrix[3][1], instanceMatrix[3][2]);
  float gPhase = gIp.x * 0.35 + gIp.z * 0.28;
  float gTop = pow(vHgt, 1.4);
  float gSway = sin(uTime * 1.6 + gPhase) + sin(uTime * 2.7 + gPhase * 1.7) * 0.5;
  float gGust = sin(gIp.x * 0.045 + gIp.z * 0.03 - uTime * 0.8);
  transformed.x += (gSway * 0.10 + gGust * 0.16) * gTop;
  transformed.z += (cos(uTime * 1.9 + gPhase) * 0.06 + gGust * 0.08) * gTop;
#endif`);
      shader.fragmentShader = shader.fragmentShader
        .replace('#include <common>', '#include <common>\nvarying float vHgt;')
        .replace('vec4 diffuseColor = vec4( diffuse, opacity );',
          `vec4 diffuseColor = vec4( diffuse, opacity );
diffuseColor.rgb *= mix(vec3(0.42, 0.58, 0.30), vec3(1.08, 1.05, 0.92), pow(vHgt, 1.25));`);
    };

    const mesh = new THREE.InstancedMesh(bladeGeo, bladeMat, count);
    const dummy = new THREE.Object3D();
    const col = new THREE.Color();
    let placed = 0;
    for (let i = 0; i < count; i++) {
      let ok = false;
      let x = 0;
      let z = 0;
      for (let a = 0; a < 30 && !ok; a++) {
        const ang = Math.random() * Math.PI * 2;
        const d = 8 + Math.random() * 197;
        x = Math.sin(ang) * d;
        z = Math.cos(ang) * d;
        ok = this.isGreenSpot(x, z);
      }
      if (!ok) continue;
      dummy.position.set(x, 0, z);
      dummy.rotation.set(
        (Math.random() - 0.5) * 0.2,
        Math.random() * Math.PI * 2,
        (Math.random() - 0.5) * 0.2
      );
      dummy.scale.set(0.8 + Math.random() * 0.6, 0.7 + Math.random() * 0.8, 1);
      dummy.updateMatrix();
      mesh.setMatrixAt(placed, dummy.matrix);
      col.setHSL(0.26 + Math.random() * 0.07, 0.42 + Math.random() * 0.22, 0.30 + Math.random() * 0.13);
      mesh.setColorAt(placed, col);
      placed++;
    }
    mesh.count = placed;
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.frustumCulled = false;
    this.scene.add(mesh);
    this.grassMesh = mesh;
  }

  collectPointLights() {
    this.pointLights = [];
    const _tmp = new THREE.Vector3();
    this.scene.traverse((obj) => {
      if (obj.isPointLight) {
        if (obj.userData.baseIntensity === undefined) obj.userData.baseIntensity = obj.intensity;
        obj.getWorldPosition(_tmp);
        this.pointLights.push(obj);
      }
    });
  }

  buildCentralPlaza() {
    const pathHeight = 0.15;
    
    const plazaGeo = new THREE.CylinderGeometry(this.plazaRadius, this.plazaRadius, pathHeight, 64);
    const plaza = new THREE.Mesh(plazaGeo, this.sidewalkMat);
    plaza.position.y = pathHeight / 2;
    plaza.receiveShadow = true;
    plaza.castShadow = true;
    this.scene.add(plaza);

    const borderGeo = new THREE.TorusGeometry(this.plazaRadius, 0.8, 16, 64);
    const border = new THREE.Mesh(borderGeo, this.curbMat);
    border.position.y = pathHeight + 0.15;
    border.receiveShadow = true;
    this.scene.add(border);

    const hexInlay = new THREE.Mesh(
      new THREE.CylinderGeometry(10, 10, 0.06, 6),
      new THREE.MeshStandardMaterial({ color: 0xd4c29b, roughness: 0.85, metalness: 0.1 })
    );
    hexInlay.position.y = pathHeight + 0.03;
    hexInlay.receiveShadow = true;
    this.scene.add(hexInlay);

    const innerRing = new THREE.Mesh(
      new THREE.RingGeometry(7.5, 8.2, 64),
      new THREE.MeshStandardMaterial({ color: 0xb8a07a, roughness: 0.8, metalness: 0.1, side: THREE.DoubleSide })
    );
    innerRing.rotation.x = -Math.PI / 2;
    innerRing.position.y = pathHeight + 0.05;
    innerRing.receiveShadow = true;
    this.scene.add(innerRing);

    const centerGlow = new THREE.Mesh(
      new THREE.CircleGeometry(4, 32),
      new THREE.MeshBasicMaterial({ 
        color: 0x00ffff, 
        transparent: true, 
        opacity: 0.08,
        side: THREE.DoubleSide,
        depthWrite: false
      })
    );
    centerGlow.rotation.x = -Math.PI / 2;
    centerGlow.position.y = pathHeight + 0.06;
    this.scene.add(centerGlow);
    this.centerGlow = centerGlow;

    this.buildCentralMonument();

    this.plazaHeight = pathHeight;

    const benchPositions = [
      { angle: 0, dist: 10 },
      { angle: Math.PI / 3, dist: 10 },
      { angle: 2 * Math.PI / 3, dist: 10 },
      { angle: Math.PI, dist: 10 },
      { angle: 4 * Math.PI / 3, dist: 10 },
      { angle: 5 * Math.PI / 3, dist: 10 },
    ];
    benchPositions.forEach(pos => {
      this.addBench(
        Math.sin(pos.angle) * pos.dist,
        Math.cos(pos.angle) * pos.dist,
        -pos.angle + Math.PI / 2,
        1
      );
    });

    const lampPositions = [
      { angle: Math.PI / 6, dist: 12 },
      { angle: Math.PI / 2, dist: 12 },
      { angle: 5 * Math.PI / 6, dist: 12 },
      { angle: 7 * Math.PI / 6, dist: 12 },
      { angle: 3 * Math.PI / 2, dist: 12 },
      { angle: 11 * Math.PI / 6, dist: 12 },
    ];
    lampPositions.forEach(pos => {
      this.addLamp(
        Math.sin(pos.angle) * pos.dist,
        Math.cos(pos.angle) * pos.dist,
        true
      );
    });
  }

  // Monumento central: núcleo holográfico con los 6 colores de los distritos.
  buildCentralMonument() {
    const coreGroup = new THREE.Group();

    const platform = new THREE.Mesh(
      new THREE.CylinderGeometry(7, 7, 0.4, 6),
      new THREE.MeshStandardMaterial({ color: 0x111122, metalness: 0.7, roughness: 0.25 })
    );
    platform.position.y = 0.4;
    platform.receiveShadow = true;
    coreGroup.add(platform);

    const beamMat = new THREE.MeshBasicMaterial({
      color: 0x00ffff,
      transparent: true,
      opacity: 0.1,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 1.4, 16, 14, 1, true), beamMat);
    beam.position.y = 8;
    coreGroup.add(beam);
    this.coreBeam = beam;

    const core = new THREE.Mesh(
      new THREE.SphereGeometry(1.2, 32, 32),
      new THREE.MeshStandardMaterial({
        color: 0x00ffff,
        emissive: 0x00ffff,
        emissiveIntensity: 1.6,
        metalness: 0.3,
        roughness: 0.05,
        transparent: true,
        opacity: 0.65,
      })
    );
    core.position.y = 1.8;
    coreGroup.add(core);
    this.coreMesh = core;

    this.ringMeshes = [];
    for (let i = 0; i < 3; i++) {
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(2 + i * 0.6, 2.2 + i * 0.6, 64),
        new THREE.MeshBasicMaterial({
          color: 0x00ffff,
          transparent: true,
          opacity: 0.18,
          side: THREE.DoubleSide,
        })
      );
      ring.rotation.x = -Math.PI / 2;
      ring.position.y = 1.8;
      ring.userData.speed = 0.2 + i * 0.15;
      coreGroup.add(ring);
      this.ringMeshes.push(ring);
    }

    architectures.forEach((def, idx) => {
      const a = (idx / 6) * Math.PI * 2 + 0.3;
      this.addDistrictBeacon(Math.sin(a) * 5.9, Math.cos(a) * 5.9, def.color);
    });

    this.coreParticles = [];
    const particleGeo = new THREE.SphereGeometry(0.08, 8, 8);
    for (let i = 0; i < 70; i++) {
      const p = new THREE.Mesh(
        particleGeo,
        new THREE.MeshBasicMaterial({ color: 0x00ffff, transparent: true, opacity: 0.8, depthWrite: false })
      );
      const radius = 1.5 + Math.random() * 1.5;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      p.position.set(
        radius * Math.sin(phi) * Math.cos(theta),
        1.8 + radius * Math.cos(phi),
        radius * Math.sin(phi) * Math.sin(theta)
      );
      p.userData = { baseRadius: radius, theta, phi, speed: 0.5 + Math.random() };
      coreGroup.add(p);
      this.coreParticles.push(p);
    }

    coreGroup.position.set(0, 0, 0);
    this.scene.add(coreGroup);
  }

  buildRibbon(points, widths, y, material, offset) {
    const positions = [];
    const indices = [];
    const n = points.length;
    for (let i = 0; i < n; i++) {
      const p = points[i];
      let dir;
      if (i === 0) dir = new THREE.Vector3().subVectors(points[1], points[0]);
      else if (i === n - 1) dir = new THREE.Vector3().subVectors(points[i], points[i - 1]);
      else dir = new THREE.Vector3().subVectors(points[i + 1], points[i - 1]);
      dir.y = 0;
      dir.normalize();
      const perp = new THREE.Vector3(-dir.z, 0, dir.x);
      const half = widths[i] / 2;
      const off = typeof offset === 'function' ? offset(i) : (offset || 0);
      const l = p.clone().addScaledVector(perp, half + off);
      const r = p.clone().addScaledVector(perp, -half + off);
      positions.push(l.x, y, l.z, r.x, y, r.z);
    }
    for (let i = 0; i < n - 1; i++) {
      const a = i * 2, b = i * 2 + 1, c = i * 2 + 2, d = i * 2 + 3;
      indices.push(a, c, b, b, c, d);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    const mesh = new THREE.Mesh(geo, material);
    mesh.receiveShadow = true;
    mesh.castShadow = true;
    return mesh;
  }

  buildPaths() {
    const pathHeight = 0.15;
    architectures.forEach((def) => this.buildPathTo(def, pathHeight));

    this.pathExits.forEach(({ dir, perp, color }) => {
      for (const side of [-1, 1]) {
        const gx = dir.x * (this.plazaRadius + 2.5) + perp.x * side * 4.5;
        const gz = dir.z * (this.plazaRadius + 2.5) + perp.z * side * 4.5;
        this.addGatePost(gx, gz, color);
      }
      const disc = new THREE.Mesh(
        new THREE.CircleGeometry(1.3, 16),
        new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.5, roughness: 0.4, metalness: 0.2 })
      );
      disc.rotation.x = -Math.PI / 2;
      disc.position.set(dir.x * (this.plazaRadius - 2.5), 0.2, dir.z * (this.plazaRadius - 2.5));
      this.scene.add(disc);
    });
  }

  buildPathTo(def, pathHeight) {
    const bx = def.position.x;
    const bz = def.position.z;
    const dist = Math.hypot(bx, bz);
    if (dist <= this.plazaRadius + 4) return;

    const dir = new THREE.Vector3(bx / dist, 0, bz / dist);
    const perp = new THREE.Vector3(-dir.z, 0, dir.x);
    const start = this.plazaRadius + 2;
    const end = dist - 18;
    const prof = this.pathCurveProfiles[def.id] || { o1: 0, o2: 0 };

    const p0 = dir.clone().multiplyScalar(start);
    const p1 = dir.clone().multiplyScalar(start + (end - start) * 0.4).addScaledVector(perp, prof.o1);
    const p2 = dir.clone().multiplyScalar(start + (end - start) * 0.7).addScaledVector(perp, prof.o2);
    const p3 = dir.clone().multiplyScalar(end);

    const curve = new THREE.CatmullRomCurve3([p0, p1, p2, p3], false, 'centripetal', 0.5);
    const points = curve.getPoints(40);
    this.pathCurves.push(curve);
    this.pathSamples.push(points.map((p) => new THREE.Vector3(p.x, 0, p.z)));
    this.pathExits.push({ dir, perp, color: def.color });
    this.districtPads.push(new THREE.Vector3(p3.x, 0, p3.z));

    const n = points.length;
    const roadWidth = points.map((_, i) => {
      const t = i / (n - 1);
      return 6.5 + 3 * smoothstep(0, 0.2, t) - 0.8 * smoothstep(0.75, 1, t);
    });
    // Semiancho de la calzada en cualquier t del recorrido (para despejar el paso)
    const halfRoadAt = (t) =>
      (6.5 + 3 * smoothstep(0, 0.2, t) - 0.8 * smoothstep(0.75, 1, t)) / 2;
    const yRoad = pathHeight / 2;

    this.scene.add(this.buildRibbon(points, roadWidth, yRoad, this.roadMat));

    const swW = 1.4;
    const curbW = 0.3;
    for (const side of [-1, 1]) {
      this.scene.add(this.buildRibbon(
        points,
        points.map(() => swW),
        yRoad + 0.02,
        this.sidewalkMat,
        (i) => side * (roadWidth[i] / 2 + swW / 2 + 0.05)
      ));
      this.scene.add(this.buildRibbon(
        points,
        points.map(() => curbW),
        yRoad + 0.07,
        this.curbMat,
        (i) => side * (roadWidth[i] / 2 + curbW / 2)
      ));
    }

    const stripeMat = new THREE.MeshStandardMaterial({
      color: def.color,
      emissive: def.color,
      emissiveIntensity: 0.6,
      roughness: 0.2,
      metalness: 0.3,
    });
    this.scene.add(this.buildRibbon(points, points.map(() => 0.65), yRoad + 0.1, stripeMat));

    const spaced = curve.getSpacedPoints(120);
    const arcLen = curve.getLength();
    const pathLen = Math.max(1, spaced.length - 2);
    // Borde exterior de la acera en cada punto muestreado
    const curbAt = (i) => halfRoadAt(i / (spaced.length - 1)) + 1.55;

    const lampStep = Math.max(1, Math.floor((11 / arcLen) * pathLen));
    let flip = 0;
    for (let i = lampStep; i < spaced.length - 1; i += lampStep) {
      const p = spaced[i];
      const d = new THREE.Vector3().subVectors(spaced[Math.min(i + 1, spaced.length - 1)], p);
      d.y = 0; d.normalize();
      const pp = new THREE.Vector3(-d.z, 0, d.x);
      const side = flip++ % 2 === 0 ? 1 : -1;
      this.addLamp(p.x + pp.x * side * (curbAt(i) + 0.9), p.z + pp.z * side * (curbAt(i) + 0.9), false);
    }

    const benchStep = Math.max(1, Math.floor((22 / arcLen) * pathLen));
    let bFlip = 0;
    for (let i = benchStep; i < spaced.length - 1; i += benchStep) {
      const p = spaced[i];
      const d = new THREE.Vector3().subVectors(spaced[Math.min(i + 1, spaced.length - 1)], p);
      d.y = 0; d.normalize();
      const pp = new THREE.Vector3(-d.z, 0, d.x);
      const side = bFlip++ % 2 === 0 ? 1 : -1;
      this.addBench(p.x + pp.x * side * (curbAt(i) + 1.6), p.z + pp.z * side * (curbAt(i) + 1.6), -Math.atan2(d.x, d.z), side);
    }

    const treeStep = Math.max(1, Math.floor((15 / arcLen) * pathLen));
    let tFlip = 0;
    for (let i = treeStep; i < spaced.length - 1; i += treeStep) {
      const p = spaced[i];
      const d = new THREE.Vector3().subVectors(spaced[Math.min(i + 1, spaced.length - 1)], p);
      d.y = 0; d.normalize();
      const pp = new THREE.Vector3(-d.z, 0, d.x);
      const side = tFlip++ % 2 === 0 ? 1 : -1;
      this.addPathTree(p.x + pp.x * side * (curbAt(i) + 2.6), p.z + pp.z * side * (curbAt(i) + 2.6));
    }

    const flowerStep = Math.max(1, Math.floor((8 / arcLen) * pathLen));
    for (let i = flowerStep; i < spaced.length - 1; i += flowerStep) {
      const p = spaced[i];
      const d = new THREE.Vector3().subVectors(spaced[Math.min(i + 1, spaced.length - 1)], p);
      d.y = 0; d.normalize();
      const pp = new THREE.Vector3(-d.z, 0, d.x);
      for (const side of [-1, 1]) {
        if (Math.random() < 0.4) {
          this.addFlower(p.x + pp.x * side * (curbAt(i) + 0.7), p.z + pp.z * side * (curbAt(i) + 0.7));
        }
      }
    }

    const pad = new THREE.Mesh(
      new THREE.CylinderGeometry(12, 12, pathHeight + 0.06, 32),
      this.sidewalkMat
    );
    pad.position.set(p3.x, (pathHeight + 0.06) / 2, p3.z);
    pad.receiveShadow = true;
    pad.castShadow = true;
    this.scene.add(pad);

    const padBorder = new THREE.Mesh(
      new THREE.TorusGeometry(12, 0.45, 12, 32),
      new THREE.MeshStandardMaterial({ color: def.color, emissive: def.color, emissiveIntensity: 0.6, roughness: 0.3, metalness: 0.2 })
    );
    padBorder.position.set(p3.x, pathHeight + 0.12, p3.z);
    padBorder.receiveShadow = true;
    this.scene.add(padBorder);

    for (const side of [-1, 1]) {
      this.addDistrictBeacon(p3.x + perp.x * 9.5 * side, p3.z + perp.z * 9.5 * side, def.color);
    }

    const padAng = Math.atan2(dir.x, dir.z);
    this.addBench(p3.x + perp.x * 6.5, p3.z + perp.z * 6.5, -padAng, 1);
    this.addBench(p3.x - perp.x * 6.5, p3.z - perp.z * 6.5, -padAng, -1);

    const leafColor = this.districtLeafColors[def.id] || 0x2e7d32;
    for (const side of [-1, 1]) {
      this.addPathTree(p3.x + perp.x * 15 * side, p3.z + perp.z * 15 * side, leafColor);
      this.addPathTree(p3.x + perp.x * 13.2 * side, p3.z + perp.z * 13.2 * side, leafColor);
    }
    this.addPathTree(p3.x - dir.x * 14.5, p3.z - dir.z * 14.5, leafColor);

    this.buildDistrictAmbience(def, p3, perp, dir);
  }

  buildDistrictAmbience(def, padPos, perp, dir) {
    const accent = def.color;
    const backX = padPos.x - dir.x * 14;
    const backZ = padPos.z - dir.z * 14;
    switch (def.id) {
      case 'microservicios': {
        for (let i = 0; i < 4; i++) {
          const a = Math.atan2(dir.x, dir.z) + Math.PI + (i - 1.5) * 1.0;
          this.addDataPylon(padPos.x + Math.sin(a) * 15, padPos.z + Math.cos(a) * 15, accent);
        }
        for (let i = 0; i < 3; i++) {
          this.addHologramPad(padPos.x + perp.x * (8 + i * 4), padPos.z + perp.z * (8 + i * 4), accent);
        }
        break;
      }
      case 'monolitica': {
        this.addBanner(padPos.x + perp.x * 14, padPos.z + perp.z * 14, accent);
        this.addBanner(padPos.x - perp.x * 14, padPos.z - perp.z * 14, accent);
        this.addStatue(padPos.x, padPos.z - dir.z * 16, accent);
        break;
      }
      case 'encapas': {
        this.addLayerColumn(backX, backZ, accent);
        this.addLayerColumn(backX - perp.x * 5, backZ - perp.z * 5, accent);
        this.addLayerColumn(backX + perp.x * 5, backZ + perp.z * 5, accent);
        break;
      }
      case 'headless': {
        this.addKiosk(padPos.x + perp.x * 14, padPos.z + perp.z * 14, accent);
        this.addKiosk(padPos.x - perp.x * 14, padPos.z - perp.z * 14, accent);
        this.addTerminal(padPos.x - dir.x * 16, padPos.z - dir.z * 16, accent);
        break;
      }
      case 'eventos': {
        this.addGlowOrb(padPos.x + perp.x * 13, 3, padPos.z + perp.z * 13, accent, 0.8);
        this.addGlowOrb(padPos.x - perp.x * 13, 3.8, padPos.z - perp.z * 13, accent, 0.7);
        this.addEventEmitter(padPos.x, padPos.z - dir.z * 18, accent);
        break;
      }
      case 'serverless': {
        this.addGlowOrb(backX, 4, backZ, accent, 1.0);
        this.addGlowOrb(padPos.x + perp.x * 13, 4.5, padPos.z + perp.z * 13, accent, 0.85);
        this.addFunctionPod(padPos.x - dir.x * 16 + perp.x * 4, padPos.z - dir.z * 16 + perp.z * 4, accent);
        this.addFunctionPod(padPos.x - dir.x * 16 - perp.x * 4, padPos.z - dir.z * 16 - perp.z * 4, accent);
        break;
      }
    }
  }

  addDataPylon(x, z, color) {
    const poleMat = new THREE.MeshStandardMaterial({ color: 0x2a2a2e, roughness: 0.5, metalness: 0.6 });
    const capMat = new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 1.4, roughness: 0.2, metalness: 0.5 });
    const g = new THREE.Group();
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.18, 4, 8), poleMat);
    pole.position.y = 2;
    pole.castShadow = true;
    g.add(pole);
    const cap = new THREE.Mesh(new THREE.OctahedronGeometry(0.4, 0), capMat);
    cap.position.y = 4.4;
    g.add(cap);
    const rings = 3;
    for (let i = 0; i < rings; i++) {
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(0.5 + i * 0.3, 0.6 + i * 0.3, 16),
        new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.3, side: THREE.DoubleSide })
      );
      ring.rotation.x = -Math.PI / 2;
      ring.position.y = 2.5 + i * 0.5;
      ring.userData = { speed: 0.3 + i * 0.1, rot: Math.random() };
      g.add(ring);
      this.pylonRings = this.pylonRings || [];
      this.pylonRings.push(ring);
    }
    g.position.set(x, 0, z);
    this.scene.add(g);
  }

  addHologramPad(x, z, color) {
    const base = new THREE.Mesh(
      new THREE.CylinderGeometry(1.2, 1.2, 0.15, 8),
      new THREE.MeshStandardMaterial({ color: 0x0a2a2a, roughness: 0.4, metalness: 0.6 })
    );
    base.position.y = 0.07;
    base.receiveShadow = true;
    this.scene.add(base);

    const holo = new THREE.Mesh(
      new THREE.CylinderGeometry(1, 1, 2.5, 8, 1, true),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.25, side: THREE.DoubleSide })
    );
    holo.position.y = 1.4;
    holo.userData = { rotSpeed: 0.2 + Math.random() * 0.2 };
    this.holograms = this.holograms || [];
    this.holograms.push(holo);
    this.scene.add(holo);

    const top = new THREE.Mesh(
      new THREE.CircleGeometry(1, 8),
      new THREE.MeshBasicMaterial({ color, emissive: color, emissiveIntensity: 0.6 })
    );
    top.rotation.x = -Math.PI / 2;
    top.position.y = 2.65;
    this.scene.add(top);

    const light = new THREE.PointLight(color, 8, 8, 2);
    light.position.set(x, 2, z);
    this.scene.add(light);
  }

  addBanner(x, z, color) {
    const poleMat = new THREE.MeshStandardMaterial({ color: 0x3a3a3a, roughness: 0.6, metalness: 0.5 });
    const g = new THREE.Group();
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 5.5, 6), poleMat);
    pole.position.y = 2.75;
    pole.castShadow = true;
    g.add(pole);
    const flag = new THREE.Mesh(
      new THREE.PlaneGeometry(2.2, 1.2),
      new THREE.MeshStandardMaterial({ color, roughness: 0.5, side: THREE.DoubleSide, metalness: 0.1 })
    );
    flag.position.set(1.1, 4, 0);
    g.add(flag);
    g.position.set(x, 0, z);
    this.scene.add(g);
  }

  addStatue(x, z, color) {
    const g = new THREE.Group();
    const body = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.8, 2.5, 6, 8),
      new THREE.MeshStandardMaterial({ color: 0xcccccc, roughness: 0.3, metalness: 0.4 })
    );
    body.position.y = 2.5;
    body.castShadow = true;
    g.add(body);
    const head = new THREE.Mesh(
      new THREE.SphereGeometry(0.6, 16, 16),
      new THREE.MeshStandardMaterial({ color: 0xcccccc, roughness: 0.3, metalness: 0.4 })
    );
    head.position.y = 4.3;
    g.add(head);
    g.position.set(x, 0, z);
    this.scene.add(g);
  }

  addLayerColumn(x, z, color) {
    const g = new THREE.Group();
    const bands = [0xff00ff, 0xcc00cc, 0x990099, 0xff00ff];
    for (let i = 0; i < 5; i++) {
      const band = new THREE.Mesh(
        new THREE.CylinderGeometry(0.55, 0.55, 1.3, 10),
        new THREE.MeshStandardMaterial({ color: bands[i % 4], emissive: bands[i % 4], emissiveIntensity: 0.6, roughness: 0.3 })
      );
      band.position.y = 0.65 + i * 1.45;
      g.add(band);
      const glow = new THREE.Mesh(
        new THREE.CylinderGeometry(0.6, 0.6, 0.08, 10),
        new THREE.MeshBasicMaterial({ color: bands[i % 4], transparent: true, opacity: 0.4 })
      );
      glow.rotation.x = -Math.PI / 2;
      glow.position.y = 0.65 + i * 1.45 + 0.65;
      g.add(glow);
    }
    g.position.set(x, 0, z);
    this.scene.add(g);
  }

  addKiosk(x, z, color) {
    const g = new THREE.Group();
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(2, 2.5, 1.2),
      new THREE.MeshStandardMaterial({ color: 0x2a2a2e, roughness: 0.5, metalness: 0.4 })
    );
    body.position.y = 1.25;
    body.castShadow = true;
    g.add(body);
    const scr = new THREE.Mesh(
      new THREE.PlaneGeometry(1.5, 1),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.9 })
    );
    scr.position.set(0, 1.8, 0.61);
    g.add(scr);
    const base = new THREE.Mesh(
      new THREE.CylinderGeometry(1.2, 1.4, 0.2, 8),
      new THREE.MeshStandardMaterial({ color: 0x2a2a2e, roughness: 0.5 })
    );
    base.position.y = 0.1;
    g.add(base);
    g.position.set(x, 0, z);
    this.scene.add(g);
  }

  addTerminal(x, z, color) {
    const g = new THREE.Group();
    const screen = new THREE.Mesh(
      new THREE.PlaneGeometry(3, 2),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.8 })
    );
    screen.position.y = 2;
    g.add(screen);
    const stand = new THREE.Mesh(
      new THREE.BoxGeometry(0.8, 3.5, 0.8),
      new THREE.MeshStandardMaterial({ color: 0x2a2a2e, roughness: 0.5 })
    );
    stand.position.y = 0.75;
    g.add(stand);
    const base = new THREE.Mesh(
      new THREE.CylinderGeometry(1, 1.2, 0.3, 8),
      new THREE.MeshStandardMaterial({ color: 0x2a2a2e, roughness: 0.5 })
    );
    base.position.y = 0.15;
    g.add(base);
    g.position.set(x, 0, z);
    this.scene.add(g);
  }

  addGlowOrb(x, y, z, color, amp) {
    const orb = new THREE.Mesh(
      new THREE.SphereGeometry(0.4, 16, 16),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.7 })
    );
    orb.position.set(x, y, z);
    orb.userData = {
      baseY: y,
      phase: Math.random() * Math.PI * 2,
      speed: 0.5 + Math.random() * 0.4,
      amp: amp || 0.7,
    };
    this.scene.add(orb);
    this.floatingOrbs.push(orb);

    const glow = new THREE.Mesh(
      new THREE.SphereGeometry(0.8, 16, 16),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.15, depthWrite: false })
    );
    glow.position.set(x, y, z);
    glow.userData = { baseY: y, scaleSpeed: 0.3 + Math.random() * 0.2 };
    this.glowOrbs = this.glowOrbs || [];
    this.glowOrbs.push(glow);
    this.scene.add(glow);
  }

  addEventEmitter(x, z, color) {
    const g = new THREE.Group();
    const core = new THREE.Mesh(
      new THREE.OctahedronGeometry(1.2, 0),
      new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 1.2, roughness: 0.2, metalness: 0.5 })
    );
    core.position.y = 3;
    core.userData = { rotSpeed: 0.4 };
    this.eventEmitters = this.eventEmitters || [];
    this.eventEmitters.push(core);
    g.add(core);

    for (let i = 0; i < 3; i++) {
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(1.8 + i * 0.5, 2 + i * 0.5, 32),
        new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.15, side: THREE.DoubleSide })
      );
      ring.rotation.x = -Math.PI / 2;
      ring.position.y = 3;
      ring.userData = { speed: 0.2 + i * 0.1 };
      g.add(ring);
    }

    const particles = 12;
    for (let i = 0; i < particles; i++) {
      const p = new THREE.Mesh(
        new THREE.SphereGeometry(0.1, 8, 8),
        new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.8 })
      );
      p.userData = { angle: (i / particles) * Math.PI * 2, radius: 2.5, speed: 0.5 + Math.random() * 0.5, y: 3 };
      g.add(p);
      this.eventParticles = this.eventParticles || [];
      this.eventParticles.push(p);
    }

    g.position.set(x, 0, z);
    this.scene.add(g);
  }

  addFunctionPod(x, z, color) {
    const g = new THREE.Group();
    const pod = new THREE.Mesh(
      new THREE.BoxGeometry(1.5, 1, 1.5),
      new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2, metalness: 0.2 })
    );
    pod.position.y = 1.5;
    pod.castShadow = true;
    g.add(pod);
    const glow = new THREE.Mesh(
      new THREE.BoxGeometry(1.5, 0.15, 1.5),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.6 })
    );
    glow.position.y = 0.3;
    g.add(glow);
    g.position.set(x, 0, z);
    this.functionPods = this.functionPods || [];
    this.functionPods.push(g);
    this.scene.add(g);
  }

  // Lámparas exteriores adicionales alrededor del estanque.
  buildLamps() {
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 + Math.PI / 12;
      this.addLamp(
        this.pondX + Math.cos(a) * 21,
        this.pondZ + Math.sin(a) * 21,
        true
      );
    }
    this.addLamp(this.pondX - 22, this.pondZ + 4, true);
  }

  addLamp(x, z, withLight) {
    const lamp = this.makeLamp(x, z, withLight);
    this.scene.add(lamp);
    this.lampMeshes.push(lamp);
    this.lampFlickerOffsets.push(Math.random() * Math.PI * 2);
  }

  makeLamp(x, z, withLight) {
    const group = new THREE.Group();
    const poleMat = new THREE.MeshStandardMaterial({ color: 0x2a2a2e, roughness: 0.3, metalness: 0.7 });
    const glassMat = new THREE.MeshStandardMaterial({
      color: 0xfff8e7,
      transparent: true,
      opacity: 0.25,
      roughness: 0.1,
      emissive: 0xfff8e7,
      emissiveIntensity: 0,
    });
    const glowMat = new THREE.MeshBasicMaterial({
      color: 0xfff8e7,
      transparent: true,
      opacity: 0,
      depthWrite: false,
    });

    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.13, 5, 8), poleMat);
    pole.position.y = 2.5;
    pole.castShadow = true;
    pole.receiveShadow = true;
    group.add(pole);

    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.8, 6), poleMat);
    arm.position.set(0, 4.7, 0.9);
    arm.rotation.z = -Math.PI / 2;
    arm.castShadow = true;
    group.add(arm);

    const housing = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.6, 0.4), poleMat);
    housing.position.set(0.9, 5, 0);
    housing.castShadow = true;
    group.add(housing);

    for (let side = 0; side < 4; side++) {
      const pane = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.5), glassMat);
      const angle = (side / 4) * Math.PI * 2;
      pane.position.set(
        0.9 + Math.sin(angle) * 0.2,
        5,
        Math.cos(angle) * 0.2
      );
      pane.rotation.y = -angle;
      group.add(pane);
      if (side === 0) this.lampGlass = pane;
    }

    const roof = new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.25, 4), poleMat);
    roof.position.set(0.9, 5.35, 0);
    roof.castShadow = true;
    group.add(roof);

    const glow = new THREE.Mesh(new THREE.SphereGeometry(0.25, 16, 16), glowMat);
    glow.position.set(0.9, 5, 0);
    glow.renderOrder = 1;
    group.add(glow);
    group.userData.glowMesh = glow;
    group.userData.glowMat = glowMat;
    group.userData.withLight = withLight;

    if (withLight) {
      const light = new THREE.PointLight(0xfff8e7, 18, 22, 2);
      light.position.set(0.9, 5, 0);
      group.add(light);
      group.userData.pointLight = light;
    }

    const base = new THREE.Mesh(
      new THREE.CylinderGeometry(0.35, 0.45, 0.4, 8),
      poleMat
    );
    base.position.y = 0.2;
    base.receiveShadow = true;
    group.add(base);

    group.position.set(x, 0, z);
    return group;
  }

  addGatePost(x, z, color) {
    const poleMat = new THREE.MeshStandardMaterial({ color: 0x2a2a2e, roughness: 0.5, metalness: 0.6 });
    const capMat = new THREE.MeshStandardMaterial({
      color,
      emissive: color,
      emissiveIntensity: 1.4,
      roughness: 0.2,
      metalness: 0.5,
    });
    const group = new THREE.Group();
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 3.8, 8), poleMat);
    pole.position.y = 1.9;
    pole.castShadow = true;
    pole.receiveShadow = true;
    group.add(pole);
    const cap = new THREE.Mesh(new THREE.SphereGeometry(0.35, 12, 10), capMat);
    cap.position.y = 4.1;
    group.add(cap)
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.6, 0.35, 8), poleMat);
    base.position.y = 0.175;
    base.receiveShadow = true;
    group.add(base);
    group.position.set(x, 0, z);
    this.scene.add(group);
  }

  addPathTree(x, z, leafColor) {
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x5d4037, roughness: 1 });
    const leafMat = new THREE.MeshStandardMaterial({ color: leafColor ?? 0x2e7d32, roughness: 0.8 });
    const group = new THREE.Group();
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.2, 1.8, 6), trunkMat);
    trunk.position.y = 0.9;
    trunk.castShadow = true;
    group.add(trunk);
    const leaves = new THREE.Mesh(new THREE.IcosahedronGeometry(0.85, 0), leafMat);
    leaves.position.y = 2.1;
    leaves.castShadow = true;
    group.add(leaves);
    group.position.set(x, 0, z);
    group.rotation.y = Math.random() * Math.PI * 2;
    this.scene.add(group);
  }

  addFlower(x, z) {
    const colors = [0xff6b6b, 0xffd93d, 0xff6bff, 0xffffff, 0xff8c42, 0x6bff6b];
    const color = colors[Math.floor(Math.random() * colors.length)];
    const geo = new THREE.SphereGeometry(0.06, 6, 6);
    const mat = new THREE.MeshStandardMaterial({
      color, emissive: color, emissiveIntensity: 0.4, roughness: 0.8
    });
    const flower = new THREE.Mesh(geo, mat);
    flower.position.set(x, 0.25 + Math.random() * 0.1, z);
    flower.scale.setScalar(0.5 + Math.random() * 0.5);
    flower.castShadow = true;
    this.scene.add(flower);
  }

  addDistrictBeacon(x, z, color) {
    const poleMat = new THREE.MeshStandardMaterial({ color: 0x2a2a2e, roughness: 0.5, metalness: 0.6 });
    const capMat = new THREE.MeshStandardMaterial({
      color,
      emissive: color,
      emissiveIntensity: 1.4,
      roughness: 0.2,
      metalness: 0.5,
    });
    const group = new THREE.Group();
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.28, 6, 8), poleMat);
    pole.position.y = 3;
    pole.castShadow = true;
    pole.receiveShadow = true;
    group.add(pole);
    const cap = new THREE.Mesh(new THREE.SphereGeometry(0.5, 16, 12), capMat);
    cap.position.y = 6.3;
    group.add(cap);
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(0.6, 0.7, 16),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.4, side: THREE.DoubleSide })
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 6.5;
    ring.userData = { speed: 0.3 };
    this.beaconRings = this.beaconRings || [];
    this.beaconRings.push(ring);
    group.add(ring);
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.85, 0.4, 8), poleMat);
    base.position.y = 0.2;
    base.receiveShadow = true;
    group.add(base);
    group.position.set(x, 0, z);
    this.scene.add(group);
  }

  buildWater() {
    // Cuerpos de agua repartidos por el mapa (el estanque original + 3 nuevos)
    this.waterSpots = [
      { x: this.pondX, z: this.pondZ, r: 16 },   // estanque con muelle y nenúfares
      { x: 145, z: -145, r: 26 },                // lago del noreste
      { x: 55, z: 155, r: 18 },                  // laguna sur
      { x: -165, z: 85, r: 12 },                 // charca oeste
    ];

    this.waterMaterials = [];

    const makeWaterMat = () => {
      // PBR estándar: no emite luz propia; el brillo viene del sol/lunas y
      // las reflexiones del envmap (cielo fotográfico) con roughness muy bajo.
      const mat = new THREE.MeshStandardMaterial({
        color: 0x0d3548,
        roughness: 0.08,
        metalness: 0.0,
        transparent: true,
        opacity: 0.93,
      });
      mat.onBeforeCompile = (shader) => {
        shader.uniforms.uTime = { value: 0 };
        shader.vertexShader = shader.vertexShader
          .replace('#include <common>', '#include <common>\nvarying vec3 vWPos;')
          .replace('#include <begin_vertex>', '#include <begin_vertex>\nvWPos = (modelMatrix * vec4(position, 1.0)).xyz;');
        shader.fragmentShader = shader.fragmentShader
          .replace('#include <common>', `#include <common>
uniform float uTime;
varying vec3 vWPos;
vec2 waterRipples(vec3 p, float t) {
  float nx =
    cos(p.x * 0.85 + t * 1.05) * 0.05 +
    cos((p.x + p.z) * 1.7 - t * 0.80) * 0.03 +
    cos(p.z * 2.30 + t * 1.40) * 0.02;
  float nz =
    cos(p.z * 1.15 - t * 0.95) * 0.05 +
    cos((p.x - p.z) * 1.9 + t * 0.75) * 0.03 +
    cos(p.x * 2.10 - t * 1.30) * 0.02;
  return vec2(nx, nz);
}`)
          .replace('#include <normal_fragment_begin>', `#include <normal_fragment_begin>
vec2 rip = waterRipples(vWPos, uTime);
vec3 wNormal = normalize(vec3(rip.x, 1.0, rip.y));
normal = normalize((viewMatrix * vec4(wNormal, 0.0)).xyz);`);
        mat.userData.shader = shader;
      };
      return mat;
    };

    this.waterSpots.forEach((spot, idx) => {
      const waterMat = makeWaterMat();
      this.waterMaterials.push(waterMat);

      const water = new THREE.Mesh(
        new THREE.CircleGeometry(spot.r, 48),
        waterMat
      );
      water.rotation.x = -Math.PI / 2;
      water.position.set(spot.x, 0.18, spot.z);
      water.receiveShadow = true;
      this.scene.add(water);
      if (idx === 0) this.water = water;

      // Anillo de rocas en la orilla (más denso en cuerpos grandes)
      const rockCount = spot.r >= 20 ? 34 : spot.r >= 15 ? 26 : 14;
      for (let i = 0; i < rockCount; i++) {
        const a = ((i + Math.random() * 0.5) / rockCount) * Math.PI * 2;
        const rock = this.makeRock(0.6 + Math.random() * 0.7 + spot.r * 0.012);
        rock.position.set(
          spot.x + Math.cos(a) * (spot.r + 1.2),
          0.35,
          spot.z + Math.sin(a) * (spot.r + 1.2)
        );
        this.scene.add(rock);
      }
    });

    // Nenúfares solo en el estanque principal
    for (let i = 0; i < 16; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = 3 + Math.random() * 10;
      const pad = new THREE.Mesh(
        new THREE.CircleGeometry(0.9 + Math.random() * 0.6, 8),
        new THREE.MeshStandardMaterial({ color: 0x2d6b2d, roughness: 0.9, side: THREE.DoubleSide })
      );
      pad.rotation.x = -Math.PI / 2;
      pad.position.set(this.pondX + Math.cos(a) * r, 0.2, this.pondZ + Math.sin(a) * r);
      pad.rotation.z = Math.random() * Math.PI * 2;
      this.scene.add(pad);
    }

    const dockGeo = new THREE.BoxGeometry(6, 0.3, 2);
    const dockMat = new THREE.MeshStandardMaterial({ color: 0x5d4037, roughness: 0.9 });
    const dock = new THREE.Mesh(dockGeo, dockMat);
    dock.position.set(this.pondX - 18, 0.4, this.pondZ);
    dock.rotation.y = 0.3;
    dock.castShadow = true;
    dock.receiveShadow = true;
    this.scene.add(dock);
  }

  makeRock(scale = 1) {
    const group = new THREE.Group();
    const rockMat = new THREE.MeshStandardMaterial({ color: 0x7a7a76, roughness: 1 });
    const main = new THREE.Mesh(new THREE.DodecahedronGeometry(0.7 * scale, 0), rockMat);
    main.rotation.set(Math.random(), Math.random(), Math.random());
    main.scale.set(1, 0.7 + Math.random() * 0.3, 1);
    main.castShadow = true;
    main.receiveShadow = true;
    group.add(main);
    const small = new THREE.Mesh(new THREE.DodecahedronGeometry(0.4 * scale, 0), rockMat);
    small.position.set(0.4 * scale, -0.1 * scale, 0.2 * scale);
    small.rotation.set(Math.random(), Math.random(), Math.random());
    small.castShadow = true;
    small.receiveShadow = true;
    group.add(small);
    return group;
  }

  buildFireflies(count) {
    const fireflyGeo = new THREE.SphereGeometry(0.05, 6, 6);
    const fireflyMat = new THREE.MeshBasicMaterial({
      color: 0xfff0a0,
      transparent: true,
      opacity: 1,
      depthWrite: false,
    });

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = 12 + Math.random() * 14;
      const mesh = new THREE.Mesh(fireflyGeo, fireflyMat.clone());
      mesh.position.set(
        this.pondX + Math.cos(angle) * r,
        0.6 + Math.random() * 4,
        this.pondZ + Math.sin(angle) * r
      );
      mesh.userData = {
        baseX: mesh.position.x,
        baseZ: mesh.position.z,
        baseY: mesh.position.y,
        phase: Math.random() * Math.PI * 2,
        speed: 0.25 + Math.random() * 0.35,
        wander: 0.6 + Math.random() * 1.2,
      };
      this.scene.add(mesh);
      this.fireflies.push(mesh);
    }
  }

  buildClouds(count) {
    const cloudMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.65,
      roughness: 1,
      metalness: 0,
    });

    for (let i = 0; i < count; i++) {
      const group = new THREE.Group();
      const puffCount = 4 + Math.floor(Math.random() * 5);
      for (let j = 0; j < puffCount; j++) {
        const puff = new THREE.Mesh(
          new THREE.SphereGeometry(2.5 + Math.random() * 3.5, 8, 6),
          cloudMat
        );
        puff.position.set(
          (Math.random() - 0.5) * 10,
          (Math.random() - 0.5) * 3,
          (Math.random() - 0.5) * 10
        );
        puff.scale.set(1, 0.45 + Math.random() * 0.45, 1);
        group.add(puff);
      }
      group.position.set(
        (Math.random() - 0.5) * 240,
        38 + Math.random() * 18,
        (Math.random() - 0.5) * 240
      );
      group.userData.speed = 0.15 + Math.random() * 0.25;
      group.userData.direction = new THREE.Vector2(
        Math.cos(Math.random() * Math.PI * 2),
        Math.sin(Math.random() * Math.PI * 2)
      ).normalize();
      this.scene.add(group);
      this.cloudMeshes.push(group);
    }
  }

  buildMountains() {
    const mountainMat = new THREE.MeshStandardMaterial({ color: 0x55686c, roughness: 1 });
    const snowMat = new THREE.MeshStandardMaterial({ color: 0xf0f5f8, roughness: 0.8 });
    const forestMat = new THREE.MeshStandardMaterial({ color: 0x2a5a3a, roughness: 1 });

    const spots = [
      { x: 190, z: -180, s: 1.6 },
      { x: -180, z: -190, s: 1.4 },
      { x: -190, z: 180, s: 1.5 },
      { x: 180, z: 190, s: 1.3 },
      { x: 15, z: -210, s: 1.3 },
      { x: -35, z: 205, s: 1.2 },
      { x: 210, z: 20, s: 1.4 },
      { x: -220, z: -10, s: 1.3 },
    ];

    spots.forEach(({ x, z, s }) => {
      const group = new THREE.Group();
      const base = new THREE.Mesh(new THREE.ConeGeometry(16 * s, 25 * s, 8), mountainMat);
      base.position.y = 12.5 * s;
      base.rotation.y = Math.random() * Math.PI;
      base.castShadow = true;
      group.add(base);

      const cap = new THREE.Mesh(new THREE.ConeGeometry(6 * s, 7 * s, 8), snowMat);
      cap.position.y = 22.5 * s;
      group.add(cap);

      for (let i = 0; i < 10; i++) {
        const a = (i / 10) * Math.PI * 2;
        const r = 18 * s;
        const tree = new THREE.Mesh(
          new THREE.ConeGeometry(1.8 * s, 6 * s, 6),
          forestMat
        );
        tree.position.set(Math.sin(a) * r, 3 * s, Math.cos(a) * r);
        tree.rotation.y = Math.random() * Math.PI;
        tree.castShadow = true;
        group.add(tree);
      }

      group.position.set(x, 0, z);
      this.scene.add(group);
    });
  }

  buildParticleSystems() {
    const q = this.quality;
    const dustCount = q === 'low' ? 100 : q === 'medium' ? 180 : 300;
    const positions = new Float32Array(dustCount * 3);
    const velocities = [];
    const phases = new Float32Array(dustCount);
    for (let i = 0; i < dustCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 300;
      positions[i * 3 + 1] = 2 + Math.random() * 15;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 300;
      velocities.push(new THREE.Vector3(
        (Math.random() - 0.5) * 0.1,
        (Math.random() - 0.5) * 0.05,
        (Math.random() - 0.5) * 0.1
      ));
      phases[i] = Math.random() * Math.PI * 2;
    }
    const dustGeo = new THREE.BufferGeometry();
    dustGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const dustMat = new THREE.PointsMaterial({
      color: 0xffeedd, size: 0.09, transparent: true, opacity: 0.45,
      depthWrite: false, sizeAttenuation: true,
    });
    const dustPoints = new THREE.Points(dustGeo, dustMat);
    this.scene.add(dustPoints);
    this.dustPoints = { geo: dustGeo, positions, velocities, phases };

    this.butterflies = [];
    const butterflyGeo = new THREE.PlaneGeometry(0.3, 0.25);
    for (let i = 0; i < 15; i++) {
      const color = [0xff6b6b, 0xffd93d, 0x6bff6b, 0xff6bff][Math.floor(Math.random() * 4)];
      const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.8, side: THREE.DoubleSide });
      const bf = new THREE.Mesh(butterflyGeo, mat);
      bf.position.set(
        (Math.random() - 0.5) * 200,
        2 + Math.random() * 5,
        (Math.random() - 0.5) * 200
      );
      bf.userData = {
        angle: Math.random() * Math.PI * 2,
        radius: 5 + Math.random() * 10,
        height: bf.position.y,
        speed: 0.5 + Math.random() * 0.5,
        wingPhase: Math.random() * Math.PI * 2,
      };
      this.scene.add(bf);
      this.butterflies.push(bf);
    }
  }

  scatterTreesInstanced(count) {
    const trunkGeo = new THREE.CylinderGeometry(0.2, 0.3, 2.5, 7);
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x6b4a2f, roughness: 0.9 });
    const leafGeo = new THREE.IcosahedronGeometry(1.2, 0);
    const leafColors = [0x2f7d32, 0x3f9142, 0x2a6b2e, 0x4a8d3a];
    const leafMats = leafColors.map(c =>
      new THREE.MeshStandardMaterial({ color: c, roughness: 0.85 })
    );

    const positions = [];
    const scales = [];
    const rotations = [];
    const leafIndices = [];

    for (let i = 0; i < count; i++) {
      const pos = this.randomFreeSpot(20, 180);
      if (!pos) continue;

      const scale = 0.7 + Math.random() * 0.9;
      const rotY = Math.random() * Math.PI * 2;
      const leafIdx = Math.floor(Math.random() * leafMats.length);
      const clusterCount = 2 + Math.floor(Math.random() * 3);

      positions.push(pos.x, 1.25 * scale, pos.z);
      scales.push(scale);
      rotations.push(rotY);
      leafIndices.push(leafIdx);

      this.treeSwayOffsets.push({
        phase: Math.random() * Math.PI * 2,
        speed: 0.35 + Math.random() * 0.25,
        amplitude: 0.015 + Math.random() * 0.025,
      });

      for (let c = 0; c < clusterCount; c++) {
        const offsetY = (2.5 + c * 0.8) * scale;
        positions.push(pos.x, offsetY, pos.z);
        scales.push(scale * (0.85 + Math.random() * 0.3));
        rotations.push(rotY + Math.random() * 0.6);
        leafIndices.push(leafIdx);
        this.treeSwayOffsets.push({
          phase: Math.random() * Math.PI * 2,
          speed: 0.45 + Math.random() * 0.35,
          amplitude: 0.03 + Math.random() * 0.04,
        });
      }
    }

    this.createTreeMeshes(positions, scales, rotations, leafIndices, trunkGeo, trunkMat, leafGeo, leafMats);
  }

  createTreeMeshes(positions, scales, rotations, leafIndices, trunkGeo, trunkMat, leafGeo, leafMats) {
    for (let i = 0; i < positions.length; i += 3) {
      const x = positions[i];
      const y = positions[i + 1];
      const z = positions[i + 2];
      const scale = scales[i / 3];
      const rotY = rotations[i / 3];
      const leafIdx = leafIndices[i / 3];

      const group = new THREE.Group();
      const trunk = new THREE.Mesh(trunkGeo, trunkMat);
      trunk.position.set(0, 1.25 * scale, 0);
      trunk.scale.set(scale, scale, scale);
      trunk.castShadow = true;
      group.add(trunk);

      const leaf = new THREE.Mesh(leafGeo, leafMats[leafIdx]);
      leaf.position.set(0, y, 0);
      leaf.scale.setScalar(scale);
      leaf.castShadow = true;
      group.add(leaf);

      group.position.set(x, 0, z);
      group.rotation.y = rotY;
      this.scene.add(group);
      this.treeMeshes.push({ group, trunk, leaf, leafIdx });
    }
  }

  scatterRocksInstanced(count) {
    const rockGeo = new THREE.DodecahedronGeometry(1, 0);
    const rockMat = new THREE.MeshStandardMaterial({ color: 0x7a7a76, roughness: 1 });

    for (let i = 0; i < count; i++) {
      const pos = this.randomFreeSpot(20, 170);
      if (!pos) continue;

      const scale = 0.6 + Math.random() * 1.0;
      const group = new THREE.Group();

      const main = new THREE.Mesh(rockGeo, rockMat);
      main.scale.set(scale, scale * (0.7 + Math.random() * 0.3), scale);
      main.rotation.set(Math.random(), Math.random(), Math.random());
      main.castShadow = true;
      main.receiveShadow = true;
      group.add(main);

      const small = new THREE.Mesh(rockGeo, rockMat);
      small.scale.set(scale * 0.5, scale * 0.35, scale * 0.5);
      small.position.set(0.4 * scale, -0.1 * scale, 0.2 * scale);
      small.rotation.set(Math.random(), Math.random(), Math.random());
      small.castShadow = true;
      small.receiveShadow = true;
      group.add(small);

      group.position.set(pos.x, 0, pos.z);
      this.scene.add(group);
      this.rockMeshes.push(group);
    }
  }

  randomFreeSpot(minRadius, maxRadius) {
    const samples = this.pathSamples;
    const pads = this.districtPads || [];
    for (let attempt = 0; attempt < 30; attempt++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = minRadius + Math.random() * (maxRadius - minRadius);
      const x = Math.sin(angle) * dist;
      const z = Math.cos(angle) * dist;

      if (Math.hypot(x, z) < this.plazaRadius + 3) continue;
      const nearBuilding = architectures.some(
        (def) => Math.hypot(x - def.position.x, z - def.position.z) < 30
      );
      const nearWater = this.waterSpots.some(
        (spot) => Math.hypot(x - spot.x, z - spot.z) < spot.r + 4
      );
      const nearPad = pads.some((p) => Math.hypot(x - p.x, z - p.z) < 14);
      let nearPath = false;
      for (const pts of samples) {
        for (let i = 0; i < pts.length; i++) {
          if (Math.hypot(x - pts[i].x, z - pts[i].z) < this.roadClearance) {
            nearPath = true;
            break;
          }
        }
        if (nearPath) break;
      }

      if (!nearBuilding && !nearWater && !nearPad && !nearPath) {
        return { x, z };
      }
    }
    return null;
  }

  update(dt, time, cameraPos) {
    this.waterMaterials.forEach((mat) => {
      if (mat.userData.shader) mat.userData.shader.uniforms.uTime.value = time * 0.001;
    });
    if (this.grassUniforms) this.grassUniforms.uTime.value = time * 0.001;

    this.treeMeshes.forEach((tree, i) => {
      if (!tree || !tree.group) return;
      const offset = this.treeSwayOffsets[i];
      if (!offset) return;
      const sway = Math.sin(time * 0.001 * offset.speed + offset.phase) * offset.amplitude;
      tree.group.rotation.x = sway * 0.4;
      tree.group.rotation.z = sway * 0.25;
      if (tree.leaf) {
        tree.leaf.rotation.y += dt * 0.08;
      }
    });

    this.lampMeshes.forEach((lamp, i) => {
      if (!lamp || !lamp.userData) return;
      const offset = this.lampFlickerOffsets[i] || 0;
      const flicker = Math.sin(time * 0.001 * 3.5 + offset) * 0.12 + 0.88;
      const pulse = Math.sin(time * 0.001 * 1.8 + offset * 2) * 0.04 + 1.0;
      const intensity = flicker * pulse;

      if (lamp.userData.glowMat && lamp.userData.glowMesh) {
        lamp.userData.glowMat.opacity = lamp.userData.withLight ? 0 : intensity * 0.5;
        lamp.userData.glowMat.needsUpdate = true;
        lamp.userData.glowMesh.scale.setScalar(0.75 + intensity * 0.5);
      }
      if (lamp.userData.pointLight) {
        lamp.userData.pointLight.userData.lightLevel = intensity;
      }
    });

    this.fireflies.forEach((fly) => {
      if (!fly || !fly.userData) return;
      const ud = fly.userData;
      const t = time * 0.001 * ud.speed + ud.phase;
      fly.position.x = ud.baseX + Math.sin(t) * ud.wander;
      fly.position.z = ud.baseZ + Math.cos(t * 0.7) * ud.wander;
      fly.position.y = ud.baseY + Math.sin(t * 1.3) * 0.6;
      const glow = (Math.sin(t * 4.5) * 0.5 + 0.5) * 0.4 + 0.6;
      if (fly.material) fly.material.opacity = glow;
      fly.scale.setScalar(0.6 + glow * 0.8);
    });

    this.cloudMeshes.forEach((cloud) => {
      if (!cloud || !cloud.userData) return;
      const speed = cloud.userData.speed;
      const dir = cloud.userData.direction;
      if (!dir) return;
      cloud.position.x += dir.x * speed * dt * 12;
      cloud.position.z += dir.y * speed * dt * 12;
      if (cloud.position.x > 240) cloud.position.x = -240;
      if (cloud.position.x < -240) cloud.position.x = 240;
      if (cloud.position.z > 240) cloud.position.z = -240;
      if (cloud.position.z < -240) cloud.position.z = 240;
    });

    if (this.centerGlow) {
      this.centerGlow.material.opacity = 0.05 + Math.sin(time * 0.001 * 2) * 0.03;
      this.centerGlow.rotation.z += dt * 0.1;
    }

    if (this.ringMeshes) {
      this.ringMeshes.forEach(r => {
        r.rotation.z += dt * r.userData.speed;
      });
    }

    if (this.coreMesh) {
      const pulse = 1 + Math.sin(time * 0.001 * 2.5) * 0.08;
      this.coreMesh.scale.setScalar(pulse);
      this.coreMesh.rotation.y += dt * 0.4;
    }

    if (this.coreBeam) {
      this.coreBeam.material.opacity = 0.07 + Math.sin(time * 0.001 * 1.8) * 0.03;
      this.coreBeam.rotation.y += dt * 0.15;
    }

    if (this.coreParticles) {
      this.coreParticles.forEach(p => {
        p.userData.theta += dt * p.userData.speed * 0.4;
        const r = p.userData.baseRadius;
        p.position.x = r * Math.sin(p.userData.phi) * Math.cos(p.userData.theta);
        p.position.z = r * Math.sin(p.userData.phi) * Math.sin(p.userData.theta);
        p.position.y = 1.8 + r * Math.cos(p.userData.phi);
      });
    }

    if (this.pylonRings) {
      this.pylonRings.forEach(r => {
        r.rotation.z += dt * r.userData.speed;
      });
    }

    if (this.holograms) {
      this.holograms.forEach(h => {
        h.rotation.y += dt * h.userData.rotSpeed;
        h.material.opacity = 0.2 + Math.sin(time * 0.001 * 3) * 0.05;
      });
    }

    if (this.glowOrbs) {
      this.glowOrbs.forEach(g => {
        g.scale.setScalar(1 + Math.sin(time * 0.001 * g.userData.scaleSpeed) * 0.15);
        g.material.opacity = 0.1 + Math.sin(time * 0.001 * 2 + g.userData.scaleSpeed) * 0.05;
      });
    }

    if (this.beaconRings) {
      this.beaconRings.forEach(r => {
        r.rotation.z += dt * r.userData.speed;
        r.material.opacity = 0.3 + Math.sin(time * 0.001 * 2) * 0.1;
      });
    }

    if (this.eventEmitters) {
      this.eventEmitters.forEach(e => {
        e.rotation.y += dt * e.userData.rotSpeed;
        e.rotation.x += dt * e.userData.rotSpeed * 0.5;
        e.material.emissiveIntensity = 1.0 + Math.sin(time * 0.001 * 4) * 0.3;
      });
    }

    if (this.eventParticles) {
      this.eventParticles.forEach(p => {
        p.userData.angle += dt * p.userData.speed;
        p.position.x = Math.cos(p.userData.angle) * p.userData.radius;
        p.position.z = Math.sin(p.userData.angle) * p.userData.radius;
        p.position.y = p.userData.y + Math.sin(time * 0.001 * 3 + p.userData.angle) * 0.3;
      });
    }

    if (this.functionPods) {
      this.functionPods.forEach(f => {
        f.position.y = Math.sin(time * 0.001 * 1.5 + f.position.x * 0.1) * 0.3;
        f.rotation.y += dt * 0.15;
      });
    }

    if (this.dustPoints) {
      const { geo, positions, velocities } = this.dustPoints;
      for (let i = 0; i < velocities.length; i++) {
        const ix = i * 3;
        positions[ix] += velocities[i].x * dt * 60;
        positions[ix + 1] += velocities[i].y * dt * 60;
        positions[ix + 2] += velocities[i].z * dt * 60;
        if (positions[ix + 1] > 20 || positions[ix + 1] < 0.5) {
          velocities[i].y *= -1;
        }
        if (Math.abs(positions[ix]) > 160 || Math.abs(positions[ix + 2]) > 160) {
          positions[ix] = (Math.random() - 0.5) * 300;
          positions[ix + 2] = (Math.random() - 0.5) * 300;
        }
      }
      geo.attributes.position.needsUpdate = true;
    }

    if (this.butterflies) {
      this.butterflies.forEach(b => {
        b.userData.angle += dt * b.userData.speed;
        b.userData.wingPhase += dt * 15;
        b.position.x = Math.cos(b.userData.angle) * b.userData.radius;
        b.position.z = Math.sin(b.userData.angle) * b.userData.radius;
        b.position.y = b.userData.height + Math.sin(b.userData.wingPhase * 0.3) * 0.5;
        b.rotation.y = b.userData.angle + Math.PI / 2;
        b.scale.y = 0.5 + Math.sin(b.userData.wingPhase) * 0.5;
      });
    }

    if (this.flowerMeshes) {
      this.flowerMeshes.forEach((f, i) => {
        f.rotation.y += dt * 0.2;
        f.position.y = 0.35 + Math.sin(time * 0.001 * 1.2 + i) * 0.05;
      });
    }

    if (this.pointLights && cameraPos) {
      for (let i = 0; i < this.pointLights.length; i++) {
        const l = this.pointLights[i];
        l.getWorldPosition(_lightPos);
        const d = _lightPos.distanceTo(cameraPos);
        const fade = Math.max(0, Math.min(1, (130 - d) / 50));
        l.intensity = (l.userData.baseIntensity || 0) * (l.userData.lightLevel ?? 1) * fade;
      }
    }
  }

  setFirefliesVisible(visible) { this.fireflies.forEach(f => f.visible = visible); }
  setCloudsVisible(visible) { this.cloudMeshes.forEach(c => c.visible = visible); }

  addBench(x, z, rotY, side) {
    const benchMat = new THREE.MeshStandardMaterial({ color: 0x4a3528, roughness: 0.9 });
    const seatGeo = new THREE.BoxGeometry(2.2, 0.12, 0.55);
    const legGeo = new THREE.BoxGeometry(0.12, 0.45, 0.12);
    const group = new THREE.Group();
    const seat = new THREE.Mesh(seatGeo, benchMat);
    seat.position.y = 0.5;
    seat.castShadow = true;
    group.add(seat);
    const offsets = [[-1, -0.22], [1, -0.22], [-1, 0.22], [1, 0.22]];
    offsets.forEach(([ox, oz]) => {
      const leg = new THREE.Mesh(legGeo, benchMat);
      leg.position.set(ox, 0.225, oz);
      leg.castShadow = true;
      group.add(leg);
    });
    const backGeo = new THREE.BoxGeometry(2.2, 0.7, 0.08);
    const back = new THREE.Mesh(backGeo, benchMat);
    back.position.set(0, 0.95, -0.3);
    back.castShadow = true;
    group.add(back);
    group.position.set(x, 0, z);
    group.rotation.y = rotY;
    this.scene.add(group);
  }
}