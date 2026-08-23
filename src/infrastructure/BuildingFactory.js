import * as THREE from 'three';
import { architectures } from '../data/architectures.js';

export class BuildingFactory {
  constructor(scene) {
    this.scene = scene;
    this.buildings = [];
  }

  createAll() {
    const HITBOX_MARGIN = 5;
    const COLLIDER_MARGIN = 0.6;
    architectures.forEach((def) => {
      const mesh = this.build(def);
      mesh.position.set(def.position.x, 0, def.position.z);
      mesh.userData.archId = def.id;
      mesh.rotation.y = Math.atan2(def.position.x, def.position.z);
      this.scene.add(mesh);
      mesh.updateMatrixWorld(true);

      // Hitbox de interacción: caja envolvente completa + margen extra
      const hitbox = new THREE.Box3().setFromObject(mesh);
      hitbox.expandByVector(new THREE.Vector3(HITBOX_MARGIN, HITBOX_MARGIN, HITBOX_MARGIN));
      mesh.userData.hitbox = hitbox;

      // Collider físico: solo la geometría del edificio (sin peata/anillos/efectos)
      const collider = new THREE.Box3();
      mesh.traverse((o) => {
        if (o.isMesh && o.name !== 'no-collide') collider.expandByObject(o);
      });
      collider.expandByVector(new THREE.Vector3(COLLIDER_MARGIN, 0, COLLIDER_MARGIN));
      mesh.userData.collider = collider;

      this.buildings.push({ mesh, def, hitbox, collider });
    });
  }

  build(def) {
    const group = new THREE.Group();
    const baseColor = def.color;

    const makeMat = (color, opts = {}) => new THREE.MeshStandardMaterial({
      color,
      roughness: opts.roughness ?? 0.5,
      metalness: opts.metalness ?? 0.3,
      envMapIntensity: opts.envMapIntensity ?? 0.45,
      emissive: opts.emissive,
      emissiveIntensity: opts.emissiveIntensity,
      transparent: opts.transparent,
      opacity: opts.opacity,
      side: opts.side,
    });

    // Pedestal común: plataforma de aterrizaje del distrito.
    const pedestal = new THREE.Mesh(
      new THREE.CylinderGeometry(16, 17, 0.5, 24),
      makeMat(0x1c1c22, { roughness: 0.32, metalness: 0.7, envMapIntensity: 0.8 })
    );
    pedestal.position.y = 0.25;
    pedestal.receiveShadow = true;
    pedestal.name = 'no-collide';
    group.add(pedestal);

    const ringGlow = new THREE.Mesh(
      new THREE.TorusGeometry(15.5, 0.12, 8, 48),
      new THREE.MeshBasicMaterial({ color: baseColor, transparent: true, opacity: 0.5 })
    );
    ringGlow.rotation.x = Math.PI / 2;
    ringGlow.position.y = 0.52;
    ringGlow.name = 'no-collide';
    group.add(ringGlow);
    group.userData.padRing = ringGlow;

    switch (def.id) {
      case 'microservicios': this.buildMicroservicios(group, baseColor, makeMat); break;
      case 'monolitica': this.buildMonolitica(group, baseColor, makeMat); break;
      case 'serverless': this.buildServerless(group, baseColor, makeMat); break;
      case 'encapas': this.buildEnCapas(group, baseColor, makeMat); break;
      case 'eventos': this.buildEventos(group, baseColor, makeMat); break;
      case 'headless': this.buildHeadless(group, baseColor, makeMat); break;
    }
    return group;
  }

  addPulse(group, from, to, color, speed, t) {
    const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.9 });
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(0.28, 8, 8), mat);
    mesh.name = 'no-collide';
    mesh.userData = { from: from.clone(), to: to.clone(), t: t || 0, speed: speed || 0.5 };
    group.userData.pulses = group.userData.pulses || [];
    group.userData.pulses.push(mesh);
    group.add(mesh);
  }

  makeScreen(group, w, h, color, opacity) {
    const mat = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: opacity ?? 0.6,
      side: THREE.DoubleSide,
    });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
    group.add(mesh);
    return mesh;
  }

  addGlowLine(group, a, b, color, opacity) {
    const geo = new THREE.BufferGeometry().setFromPoints([a, b]);
    const line = new THREE.Line(geo, new THREE.LineBasicMaterial({
      color,
      transparent: true,
      opacity: opacity ?? 0.4,
    }));
    group.add(line);
  }

  // MICROSERVICIOS: hub central + módulos independientes conectados por tuberías.
  buildMicroservicios(group, color, M) {
    const hubBaseMat = M(0x0e7a7a, { roughness: 0.4, metalness: 0.5 });
    const hubMat = M(color, { roughness: 0.35, metalness: 0.4 });
    const pipeMat = M(color, { emissive: 0x006666, emissiveIntensity: 0.5, metalness: 0.6, roughness: 0.3 });
    const modBaseMat = M(0x0e7a7a, { roughness: 0.5, metalness: 0.3 });
    const modMat = M(color, { roughness: 0.35, metalness: 0.35 });
    const roofMat = M(0x0a5f5f, { roughness: 0.4, metalness: 0.4 });
    const glassMat = M(0x88ffff, { emissive: 0x004444, emissiveIntensity: 0.4, transparent: true, opacity: 0.55, roughness: 0.1, metalness: 0.6 });

    const hubBase = new THREE.Mesh(new THREE.CylinderGeometry(4.5, 5, 1.2, 20), hubBaseMat);
    hubBase.position.y = 1;
    hubBase.castShadow = true;
    hubBase.receiveShadow = true;
    group.add(hubBase);

    const hubCore = new THREE.Mesh(new THREE.CylinderGeometry(3.2, 3.2, 5, 20), hubMat);
    hubCore.position.y = 1 + 0.6 + 2.5;
    hubCore.castShadow = true;
    group.add(hubCore);

    const hubDome = new THREE.Mesh(new THREE.SphereGeometry(3.2, 20, 14, 0, Math.PI * 2, 0, Math.PI / 2), hubMat);
    hubDome.position.y = 1 + 1.2 + 5;
    hubDome.castShadow = true;
    group.add(hubDome);

    const antenna = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.12, 3.5, 6), M(0x00ffff, { emissive: 0x00aaaa }));
    antenna.position.y = 1 + 1.2 + 5 + 3 + 1.75;
    group.add(antenna);
    const beacon = new THREE.Mesh(
      new THREE.SphereGeometry(0.25, 10, 10),
      new THREE.MeshBasicMaterial({ color: 0x00ffff })
    );
    beacon.position.y = 1 + 1.2 + 5 + 3 + 3.5;
    beacon.userData = { blinkSpeed: 2 };
    group.add(beacon);
    group.userData.blinkers = [beacon];

    for (let i = 0; i < 3; i++) {
      const win = new THREE.Mesh(new THREE.TorusGeometry(3.25, 0.28, 8, 40), glassMat);
      win.rotation.x = Math.PI / 2;
      win.position.y = 1 + 1.2 + 1 + i * 1.5;
      group.add(win);
    }

    const serviceNames = ['Auth', 'Users', 'Orders', 'Payments', 'Notifications'];
    for (let i = 0; i < 5; i++) {
      const angle = (i / 5) * Math.PI * 2;
      const radius = 14;
      const mx = Math.cos(angle) * radius;
      const mz = Math.sin(angle) * radius;

      const base = new THREE.Mesh(new THREE.BoxGeometry(5.5, 0.8, 5.5), modBaseMat);
      base.position.set(mx, 0.9, mz);
      base.receiveShadow = true;
      group.add(base);

      for (let f = 0; f < 3; f++) {
        const floor = new THREE.Mesh(new THREE.BoxGeometry(4.5, 3, 4.5), modMat);
        floor.position.set(mx, 1.3 + 1.5 + f * 3.2, mz);
        floor.castShadow = true;
        group.add(floor);

        for (const side of [-1, 1]) {
          const win = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.8, 3.5), glassMat);
          win.position.set(mx + side * 2.35, 1.3 + 1.5 + f * 3.2, mz);
          group.add(win);
          const win2 = new THREE.Mesh(new THREE.BoxGeometry(3.5, 1.8, 0.1), glassMat);
          win2.position.set(mx, 1.3 + 1.5 + f * 3.2, mz + side * 2.35);
          group.add(win2);
        }
      }

      const roof = new THREE.Mesh(new THREE.ConeGeometry(3.5, 2, 4), roofMat);
      roof.position.set(mx, 1.3 + 1.5 + 3 * 3.2 + 1, mz);
      roof.rotation.y = Math.PI / 4;
      roof.castShadow = true;
      group.add(roof);

      const pipeLen = radius - 6;
      const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, pipeLen, 10), pipeMat);
      pipe.position.set(mx * 0.35, 4, mz * 0.35);
      pipe.lookAt(0, 4, 0);
      pipe.rotateX(Math.PI / 2);
      group.add(pipe);

      const label = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.5, 0.1), M(0x003333));
      label.position.set(mx, 1.8, mz + 2.5);
      group.add(label);
    }

    for (let i = 0; i < 5; i++) {
      const a1 = (i / 5) * Math.PI * 2;
      const a2 = ((i + 1) / 5) * Math.PI * 2;
      this.addGlowLine(
        group,
        new THREE.Vector3(Math.cos(a1) * 14, 10, Math.sin(a1) * 14),
        new THREE.Vector3(Math.cos(a2) * 14, 10, Math.sin(a2) * 14),
        0x00ffff,
        0.45
      );
    }

    group.userData.pulses = group.userData.pulses || [];
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      this.addPulse(
        group,
        new THREE.Vector3(Math.cos(a) * 14, 4, Math.sin(a) * 14),
        new THREE.Vector3(0, 4, 0),
        0x00ffff,
        0.4 + (i % 3) * 0.12,
        Math.random()
      );
    }

    const gwMat = M(0x00ffff, { emissive: 0x00aaaa, emissiveIntensity: 0.8, metalness: 0.5 });
    for (const side of [-1, 1]) {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.45, 6, 8), gwMat);
      post.position.set(side * 3.2, 3.5, -6.8);
      post.castShadow = true;
      group.add(post);
      const tip = new THREE.Mesh(
        new THREE.SphereGeometry(0.35, 10, 8),
        new THREE.MeshBasicMaterial({ color: 0x00ffff })
      );
      tip.position.set(side * 3.2, 6.7, -6.8);
      group.add(tip);
    }
    const gwBeam = new THREE.Mesh(new THREE.BoxGeometry(7, 0.4, 0.4), gwMat);
    gwBeam.position.set(0, 6.5, -6.8);
    group.add(gwBeam);

    const holo = this.makeScreen(group, 3.4, 2, 0x00ffff, 0.45);
    holo.position.set(0, 5.2, -4.2);

    const rackMat = M(0x0a2a2a, { roughness: 0.5, metalness: 0.5 });
    const ledMat = new THREE.MeshBasicMaterial({ color: 0x00ffdd });
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2 + Math.PI / 5;
      const rx = Math.cos(a) * 11;
      const rz = Math.sin(a) * 11;
      const rack = new THREE.Mesh(new THREE.BoxGeometry(2.4, 3, 1.6), rackMat);
      rack.position.set(rx, 2, rz);
      rack.castShadow = true;
      rack.receiveShadow = true;
      group.add(rack);
      const led = new THREE.Mesh(new THREE.BoxGeometry(2, 0.14, 0.06), ledMat);
      led.position.set(rx, 2.8, rz - 0.8);
      group.add(led);
    }

    const pLight = new THREE.PointLight(0x00ffff, 20, 34, 2);
    pLight.position.set(0, 7, 0);
    group.add(pLight);
  }

  // MONOLÍTICA: fortaleza única masiva con ventanas repetitivas.
  buildMonolitica(group, color, M) {
    const darkMat = M(0x8b6000, { roughness: 0.55, metalness: 0.25 });
    const trimMat = M(0x2a1a08, { roughness: 0.65, metalness: 0.15 });
    const windowMat = M(0xffdd44, { emissive: 0x554400, emissiveIntensity: 0.55, roughness: 0.1, metalness: 0.3 });
    const goldMat = M(0xd4af37, { roughness: 0.3, metalness: 0.8 });

    const plinth = new THREE.Mesh(new THREE.BoxGeometry(24, 2.5, 24), trimMat);
    plinth.position.y = 1.75;
    plinth.castShadow = true;
    plinth.receiveShadow = true;
    group.add(plinth);

    const steps = [
      [26, 0.4, 26, 0.2],
      [25, 0.4, 25, 0.6],
    ];
    steps.forEach(([w, h, d, y]) => {
      const step = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), darkMat);
      step.position.y = y;
      step.receiveShadow = true;
      group.add(step);
    });

    const tower = new THREE.Mesh(new THREE.BoxGeometry(18, 28, 18), M(color, { roughness: 0.5, metalness: 0.2 }));
    tower.position.y = 3 + 14;
    tower.castShadow = true;
    group.add(tower);

    const pilasterGeo = new THREE.BoxGeometry(1.5, 30, 1.5);
    [[-9.5, -9.5], [9.5, -9.5], [-9.5, 9.5], [9.5, 9.5]].forEach(([px, pz]) => {
      const pil = new THREE.Mesh(pilasterGeo, darkMat);
      pil.position.set(px, 3 + 15, pz);
      pil.castShadow = true;
      group.add(pil);
    });

    for (let y = 4; y < 28; y += 4) {
      const band = new THREE.Mesh(new THREE.BoxGeometry(19, 0.5, 19), trimMat);
      band.position.y = 3 + y;
      group.add(band);
    }

    for (let floor = 0; floor < 7; floor++) {
      const fy = 3 + 2 + floor * 4;
      for (const side of [-1, 1]) {
        for (let w = 0; w < 4; w++) {
          const wx = -7 + w * 4.5;
          const win = new THREE.Mesh(new THREE.BoxGeometry(2.5, 2.5, 0.15), windowMat);
          win.position.set(wx, fy, side * 9.1);
          group.add(win);
          const win2 = new THREE.Mesh(new THREE.BoxGeometry(0.15, 2.5, 2.5), windowMat);
          win2.position.set(side * 9.1, fy, wx);
          group.add(win2);
        }
      }
    }

    const entrance = new THREE.Mesh(new THREE.BoxGeometry(6, 5, 0.2), trimMat);
    entrance.position.set(0, 3 + 2.5, -9.1);
    group.add(entrance);

    const door = new THREE.Mesh(new THREE.BoxGeometry(3, 4, 0.1), M(0x1a1a1a));
    door.position.set(0, 3 + 2, -9.2);
    group.add(door);

    const cornice = new THREE.Mesh(new THREE.BoxGeometry(20, 1.5, 20), trimMat);
    cornice.position.y = 3 + 28 + 0.75;
    cornice.castShadow = true;
    group.add(cornice);

    const roof = new THREE.Mesh(new THREE.BoxGeometry(16, 2, 16), darkMat);
    roof.position.y = 3 + 28 + 1.5 + 1;
    roof.castShadow = true;
    group.add(roof);

    const turretMat = M(0x8b6000, { roughness: 0.55, metalness: 0.25 });
    [[-11.5, -11.5], [11.5, -11.5], [-11.5, 11.5], [11.5, 11.5]].forEach(([px, pz]) => {
      const tur = new THREE.Mesh(new THREE.CylinderGeometry(1.7, 2.4, 13, 10), turretMat);
      tur.position.set(px, 3 + 6.5, pz);
      tur.castShadow = true;
      group.add(tur);
      const cap = new THREE.Mesh(new THREE.ConeGeometry(2.4, 2.8, 10), trimMat);
      cap.position.set(px, 3 + 13 + 1.4, pz);
      cap.castShadow = true;
      group.add(cap);
      const flagPole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 2, 4), goldMat);
      flagPole.position.set(px, 3 + 13 + 2.8 + 1, pz);
      group.add(flagPole);
      const flag = new THREE.Mesh(
        new THREE.PlaneGeometry(1, 0.6),
        new THREE.MeshStandardMaterial({ color: 0xffaa00, side: THREE.DoubleSide, emissive: 0x553300, emissiveIntensity: 0.3 })
      );
      flag.position.set(px + 0.5, 3 + 13 + 2.8 + 1.8, pz);
      group.add(flag);
    });

    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2 + 0.2;
      const block = new THREE.Mesh(new THREE.BoxGeometry(1.3, 1.5, 1.3), trimMat);
      block.position.set(Math.sin(a) * 9.3, 3 + 28 + 1.5 + 0.75, Math.cos(a) * 9.3);
      block.castShadow = true;
      group.add(block);
    }

    for (let i = 0; i < 4; i++) {
      const bar = new THREE.Mesh(new THREE.BoxGeometry(0.25, 4.2, 0.15), M(0x3a2a10, { metalness: 0.5, roughness: 0.4 }));
      bar.position.set(-1.6 + i * 1.07, 3 + 2.5, -9.16);
      group.add(bar);
    }

    const gateLight = new THREE.PointLight(0xffddaa, 25, 32, 2);
    gateLight.position.set(0, 4.5, -9);
    group.add(gateLight);

    group.userData.windowGlow = windowMat;
  }

  // SERVERLESS: nube etérea con contenedores de funciones flotantes.
  buildServerless(group, color, M) {
    const cloudMat = M(color, {
      transparent: true, opacity: 0.22,
      emissive: 0x003311, emissiveIntensity: 0.35,
      roughness: 0.15, metalness: 0.1
    });
    const columnMat = M(0x0a4a2a, { roughness: 0.35, metalness: 0.5 });
    const fnMat = M(0xffffff, { roughness: 0.25, metalness: 0.2 });
    const socketMat = M(color, { emissive: color, emissiveIntensity: 0.9, metalness: 0.4 });

    const puffs = [
      { r: 9, pos: [0, 0, 0] },
      { r: 7, pos: [-8, -2, 3] },
      { r: 7.5, pos: [8, -1, -3] },
      { r: 5.5, pos: [4, 3, 5] },
      { r: 5, pos: [-5, 2.5, -4] },
      { r: 6, pos: [0, 4, 1] },
    ];
    puffs.forEach(p => {
      const puff = new THREE.Mesh(new THREE.SphereGeometry(p.r, 18, 18), cloudMat);
      puff.position.set(p.pos[0], 19 + p.pos[1], p.pos[2]);
      puff.castShadow = true;
      group.add(puff);
    });

    const column = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.8, 19, 14), columnMat);
    column.position.y = 9.5;
    column.castShadow = true;
    group.add(column);
    const colBase = new THREE.Mesh(new THREE.CylinderGeometry(4, 4.5, 1.5, 14), columnMat);
    colBase.position.y = 1.25;
    colBase.castShadow = true;
    colBase.receiveShadow = true;
    group.add(colBase);

    for (let i = 0; i < 3; i++) {
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(2.5 + i * 0.8, 0.1, 8, 32),
        new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.4 })
      );
      ring.rotation.x = Math.PI / 2;
      ring.position.y = 3 + i * 4;
      ring.userData = { speed: 0.3 + i * 0.15 };
      group.add(ring);
      group.userData.columnRings = group.userData.columnRings || [];
      group.userData.columnRings.push(ring);
    }

    const fnPositions = [
      [-10, 8, -8], [10, 7, -8], [-10, 12, 8], [10, 10, 8],
      [0, 15, 0], [-6, 14, -12], [6, 9, 12]
    ];
    const fnGroups = [];
    fnPositions.forEach(([x, y, z]) => {
      const fnGroup = new THREE.Group();
      const fn = new THREE.Mesh(new THREE.BoxGeometry(3.5, 2, 3.5), fnMat);
      fn.castShadow = true;
      fnGroup.add(fn);

      const edgeMat = new THREE.MeshBasicMaterial({ color: 0x00ff88, transparent: true, opacity: 0.7 });
      const edges = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(3.5, 2, 3.5)), edgeMat);
      fnGroup.add(edges);

      const socket = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.5, 10), socketMat);
      socket.position.y = -1.25;
      fnGroup.add(socket);

      const ant = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.5, 4), M(0x888888, { metalness: 0.7 }));
      ant.position.y = 1.75;
      fnGroup.add(ant);

      fnGroup.position.set(x, y, z);
      fnGroup.rotation.y = Math.random() * 0.3 - 0.15;
      group.add(fnGroup);
      fnGroups.push(fnGroup);
    });

    group.userData.floaters = group.userData.floaters || [];
    fnPositions.forEach(([x, y, z], i) => {
      const plat = new THREE.Mesh(
        new THREE.CylinderGeometry(2.6, 2.6, 0.14, 6),
        M(0x0a4a2a, { roughness: 0.35, metalness: 0.4 })
      );
      plat.position.set(x, y - 2.2, z);
      plat.rotation.y = Math.PI / 6;
      plat.receiveShadow = true;
      group.add(plat);
      group.userData.floaters.push({
        mesh: fnGroups[i],
        base: y,
        phase: i * 1.1,
        speed: 0.5 + (i % 3) * 0.12,
        amp: 0.45,
      });
    });

    const cloudLight = new THREE.PointLight(0x00ff88, 18, 34, 2);
    cloudLight.position.set(0, 13, 0);
    group.add(cloudLight);

    const sparkMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.85 });
    const sparks = [];
    for (let i = 0; i < 24; i++) {
      const spark = new THREE.Mesh(new THREE.SphereGeometry(0.15, 6, 6), sparkMat.clone());
      spark.position.set(
        (Math.random() - 0.5) * 25,
        10 + Math.random() * 15,
        (Math.random() - 0.5) * 25
      );
      spark.userData = { basePos: spark.position.clone(), phase: Math.random() * Math.PI * 2, speed: 0.5 + Math.random() };
      group.add(spark);
      sparks.push(spark);
    }
    group.userData.sparks = sparks;
  }

  // EN CAPAS: estratos horizontales con separación visible.
  buildEnCapas(group, color, M) {
    const foundationMat = M(0x1a001a, { roughness: 0.6, metalness: 0.3 });
    const layerColors = [0xff00ff, 0xcc00cc, 0x990099];
    const trimMat = M(0xffffff, { emissive: 0xff00ff, emissiveIntensity: 0.6, roughness: 0.15, metalness: 0.4 });
    const glassMat = M(0xffffff, { transparent: true, opacity: 0.28, roughness: 0.08, metalness: 0.5 });
    const pillarMat = M(0xdddddd, { metalness: 0.6, roughness: 0.25 });

    const foundation = new THREE.Mesh(new THREE.BoxGeometry(26, 2, 20), foundationMat);
    foundation.position.y = 1.5;
    foundation.castShadow = true;
    foundation.receiveShadow = true;
    group.add(foundation);

    const layers = [
      { h: 7, w: 22, d: 16, color: layerColors[0] },
      { h: 7, w: 18, d: 13, color: layerColors[1] },
      { h: 7, w: 14, d: 10, color: layerColors[2] },
    ];

    let y = 2.5;
    layers.forEach((l, idx) => {
      const slab = new THREE.Mesh(new THREE.BoxGeometry(l.w, l.h, l.d), M(l.color, { roughness: 0.3, metalness: 0.3 }));
      slab.position.y = y + l.h / 2;
      slab.castShadow = true;
      slab.receiveShadow = true;
      group.add(slab);

      const trim = new THREE.Mesh(new THREE.BoxGeometry(l.w + 0.4, 0.5, l.d + 0.4), trimMat);
      trim.position.y = y;
      group.add(trim);

      for (let wy = 0; wy < l.h; wy += 2.5) {
        const wyPos = y + 1 + wy;
        for (const side of [-1, 1]) {
          const win = new THREE.Mesh(new THREE.BoxGeometry(l.w - 2, 1.5, 0.2), glassMat);
          win.position.set(0, wyPos, side * (l.d / 2 + 0.1));
          group.add(win);
          const win2 = new THREE.Mesh(new THREE.BoxGeometry(0.2, 1.5, l.d - 2), glassMat);
          win2.position.set(side * (l.w / 2 + 0.1), wyPos, 0);
          group.add(win2);
        }
      }

      if (idx < layers.length - 1) {
        const next = layers[idx + 1];
        const corners = [
          [next.w / 2 - 0.8, next.d / 2 - 0.8],
          [-(next.w / 2 - 0.8), next.d / 2 - 0.8],
          [next.w / 2 - 0.8, -(next.d / 2 - 0.8)],
          [-(next.w / 2 - 0.8), -(next.d / 2 - 0.8)],
        ];
        corners.forEach(([cx, cz]) => {
          const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 1, 10), pillarMat);
          pillar.position.set(cx, y + l.h + 0.5, cz);
          group.add(pillar);
        });
      }

      y += l.h;
    });

    const flowMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.95 });
    group.userData.flow = [];
    for (let i = 0; i < 6; i++) {
      const drop = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 10), flowMat.clone());
      drop.userData = {
        from: new THREE.Vector3(0, 23.5, -12),
        to: new THREE.Vector3(0, 4, -12),
        t: i / 6,
        speed: 0.28 + Math.random() * 0.1,
      };
      group.add(drop);
      group.userData.flow.push(drop);
    }

    const shaftMat = M(0xff00ff, { emissive: 0x880088, emissiveIntensity: 0.6, transparent: true, opacity: 0.35 });
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 21.5, 10, 1, true), shaftMat);
    shaft.position.set(12.6, 13, 0);
    group.add(shaft);

    const layerLight = new THREE.PointLight(0xff00ff, 20, 34, 2);
    layerLight.position.set(0, 13, 0);
    group.add(layerLight);
  }

  // EVENTOS: anillo de bus central con nodos productor/consumidor.
  buildEventos(group, color, M) {
    const busMat = M(color, { emissive: 0x550000, emissiveIntensity: 0.65, metalness: 0.4, roughness: 0.3 });
    const standMat = M(0x3a1a1a, { roughness: 0.5, metalness: 0.3 });
    const nodeMat = M(0x331111, { roughness: 0.4, metalness: 0.3 });
    const roofMat = M(0x882222, { roughness: 0.4, metalness: 0.3 });
    const lineMat = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.4 });
    const pulseMat = new THREE.MeshBasicMaterial({ color: 0xffaa44 });
    const glassMat = M(0xff8888, { transparent: true, opacity: 0.38, roughness: 0.15, metalness: 0.4 });

    const pedestal = new THREE.Mesh(new THREE.CylinderGeometry(2, 2.5, 5.5, 14), standMat);
    pedestal.position.y = 3.25;
    pedestal.castShadow = true;
    group.add(pedestal);

    const bus = new THREE.Mesh(new THREE.TorusGeometry(7, 1.2, 18, 48), busMat);
    bus.rotation.x = Math.PI / 2;
    bus.position.y = 6;
    bus.castShadow = true;
    group.add(bus);

    const innerGlow = new THREE.Mesh(
      new THREE.TorusGeometry(7, 0.3, 10, 48),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.65 })
    );
    innerGlow.rotation.x = Math.PI / 2;
    innerGlow.position.y = 6;
    group.add(innerGlow);

    const positions = [
      [-14, 0, -14], [14, 0, -14], [14, 0, 14], [-14, 0, 14]
    ];
    const pulseAnchors = [];

    positions.forEach((p, i) => {
      const isProducer = i < 2;
      const typeColor = isProducer ? 0xff6666 : 0x66ff66;

      const ped = new THREE.Mesh(new THREE.CylinderGeometry(2.5, 3, 1.2, 10), standMat);
      ped.position.set(p[0], 1.1, p[2]);
      ped.receiveShadow = true;
      group.add(ped);

      const node = new THREE.Mesh(new THREE.BoxGeometry(5, 5, 5), M(typeColor, { roughness: 0.35, metalness: 0.3 }));
      node.position.set(p[0], 1.7 + 2.5, p[2]);
      node.castShadow = true;
      group.add(node);

      const edges = new THREE.LineSegments(
        new THREE.EdgesGeometry(new THREE.BoxGeometry(5, 5, 5)),
        new THREE.LineBasicMaterial({ color: typeColor, transparent: true, opacity: 0.6 })
      );
      edges.position.copy(node.position);
      group.add(edges);

      for (const side of [-1, 1]) {
        const win = new THREE.Mesh(new THREE.BoxGeometry(0.15, 2.5, 3), glassMat);
        win.position.set(p[0] + side * 2.6, 1.7 + 2.5, p[2]);
        group.add(win);
      }

      const roof = new THREE.Mesh(new THREE.ConeGeometry(3.8, 2, 4), roofMat);
      roof.position.set(p[0], 1.7 + 5 + 1, p[2]);
      roof.rotation.y = Math.PI / 4;
      roof.castShadow = true;
      group.add(roof);

      const lineGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(p[0], 4.5, p[2]),
        new THREE.Vector3(0, 6, 0)
      ]);
      group.add(new THREE.Line(lineGeo, lineMat));

      pulseAnchors.push(new THREE.Vector3(p[0], 4.5, p[2]));
    });

    const pulses = [];
    for (let i = 0; i < 4; i++) {
      const pulse = new THREE.Mesh(new THREE.SphereGeometry(0.4, 12, 12), pulseMat.clone());
      pulse.userData.from = pulseAnchors[i];
      pulse.userData.to = new THREE.Vector3(0, 6, 0);
      pulse.userData.t = Math.random();
      pulse.userData.speed = 0.5 + Math.random() * 0.4;
      group.add(pulse);
      pulses.push(pulse);
    }
    group.userData.pulses = pulses;

    group.userData.floaters = group.userData.floaters || [];
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
      const pod = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.1, 1.1), nodeMat);
      pod.position.set(Math.cos(a) * 10, 3, Math.sin(a) * 10);
      pod.castShadow = true;
      group.add(pod);
      group.userData.floaters.push({ mesh: pod, base: 3, phase: i * 1.3, speed: 0.6, amp: 0.5 });
      const lg2 = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(pod.position.x, 3, pod.position.z),
        new THREE.Vector3(0, 6, 0),
      ]);
      group.add(new THREE.Line(lg2, lineMat));
      this.addPulse(
        group,
        new THREE.Vector3(pod.position.x, 3, pod.position.z),
        new THREE.Vector3(0, 6, 0),
        0xff8844,
        0.5,
        Math.random()
      );
    }

    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const orb = new THREE.Mesh(new THREE.SphereGeometry(0.18, 10, 10), pulseMat.clone());
      orb.position.set(Math.cos(a) * 7.5, 6.8, Math.sin(a) * 7.5);
      group.add(orb);
      group.userData.floaters.push({ mesh: orb, base: 6.8, phase: i * 0.9, speed: 0.7 + (i % 3) * 0.15, amp: 0.7 });
    }

    const eventLight = new THREE.PointLight(0xff4444, 20, 32, 2);
    eventLight.position.set(0, 7, 0);
    group.add(eventLight);
    group.userData.ringGlow = busMat;
  }

  // HEADLESS: núcleo backend con canales "head" múltiples.
  buildHeadless(group, color, M) {
    const baseMat = M(0x2d1a5e, { roughness: 0.5, metalness: 0.35 });
    const coreMat = M(color, { roughness: 0.3, metalness: 0.4 });
    const capMat = M(0x4a2e8a, { roughness: 0.4, metalness: 0.35 });
    const headColors = [0xff5555, 0x55ff88, 0x5599ff, 0xffd24a];
    const beamMat = M(0x8844ff, { emissive: 0x442288, transparent: true, opacity: 0.5 });
    const glassMat = M(0xaa88ff, { transparent: true, opacity: 0.28, roughness: 0.12, metalness: 0.5 });

    const coreBase = new THREE.Mesh(new THREE.CylinderGeometry(6.5, 7, 1.2, 12), baseMat);
    coreBase.position.y = 1.1;
    coreBase.castShadow = true;
    coreBase.receiveShadow = true;
    group.add(coreBase);

    const core = new THREE.Mesh(new THREE.BoxGeometry(9, 12, 9), coreMat);
    core.position.y = 1.7 + 6;
    core.castShadow = true;
    group.add(core);

    const coreEdges = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.BoxGeometry(9, 12, 9)),
      new THREE.LineBasicMaterial({ color: 0xaa88ff, transparent: true, opacity: 0.7 })
    );
    coreEdges.position.copy(core.position);
    group.add(coreEdges);

    for (let f = 0; f < 4; f++) {
      const fy = 1.7 + 1.5 + f * 3;
      for (const side of [-1, 1]) {
        const win = new THREE.Mesh(new THREE.BoxGeometry(7, 2, 0.2), glassMat);
        win.position.set(0, fy, side * 4.6);
        group.add(win);
        const win2 = new THREE.Mesh(new THREE.BoxGeometry(0.2, 2, 7), glassMat);
        win2.position.set(side * 4.6, fy, 0);
        group.add(win2);
      }
    }

    const cap = new THREE.Mesh(new THREE.CylinderGeometry(3, 4.5, 2, 12), capMat);
    cap.position.y = 1.7 + 12 + 1;
    cap.castShadow = true;
    group.add(cap);

    const apiAntenna = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 4, 6), M(0x8844ff, { emissive: 0x442288 }));
    apiAntenna.position.y = 1.7 + 12 + 2 + 2;
    group.add(apiAntenna);
    const apiTip = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.35, 0),
      new THREE.MeshBasicMaterial({ color: 0xaa88ff })
    );
    apiTip.position.y = 1.7 + 12 + 2 + 4;
    apiTip.userData = { rotSpeed: 1.2 };
    group.add(apiTip);
    group.userData.spinners = [apiTip];

    const heads = [
      { pos: new THREE.Vector3(-18, 0, 0), color: headColors[0] },
      { pos: new THREE.Vector3(18, 0, 0), color: headColors[1] },
      { pos: new THREE.Vector3(0, 0, -18), color: headColors[2] },
      { pos: new THREE.Vector3(0, 0, 18), color: headColors[3] },
    ];

    heads.forEach((h) => {
      const headMat = M(h.color, { emissive: h.color, emissiveIntensity: 0.45, roughness: 0.25, metalness: 0.3 });

      const ped = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 2, 1.2, 10), headMat);
      ped.position.set(h.pos.x, 1.1, h.pos.z);
      ped.castShadow = true;
      group.add(ped);

      const capsule = new THREE.Mesh(new THREE.CapsuleGeometry(1.3, 2, 8, 12), headMat);
      capsule.position.set(h.pos.x, 4, h.pos.z);
      capsule.castShadow = true;
      group.add(capsule);

      const dir = h.pos.clone().normalize();
      const win = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.8, 0.2), glassMat);
      win.position.set(h.pos.x + dir.x * 1.4, 4, h.pos.z + dir.z * 1.4);
      win.lookAt(0, 4, 0);
      group.add(win);

      const dist = h.pos.length() - 8;
      const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, dist, 8), beamMat);
      const mid = h.pos.clone().multiplyScalar(0.5);
      beam.position.set(mid.x, 3.5, mid.z);
      beam.lookAt(0, 3.5, 0);
      beam.rotateX(Math.PI / 2);
      group.add(beam);

      const ant = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 1.6, 4), M(0x8844ff, { emissive: 0x442288 }));
      ant.position.set(h.pos.x, 5.8, h.pos.z);
      ant.castShadow = true;
      group.add(ant);
    });

    group.userData.screens = group.userData.screens || [];
    const kioskSpots = [[-7, -10], [7, -10], [-3.5, -11.5], [3.5, -11.5]];
    kioskSpots.forEach(([kx, kz], i) => {
      const kiosk = new THREE.Group();
      const body = new THREE.Mesh(new THREE.BoxGeometry(1.6, 2.2, 1.1), baseMat);
      body.position.y = 1.6;
      body.castShadow = true;
      kiosk.add(body);
      const scr = this.makeScreen(kiosk, 1.2, 0.7, headColors[i % headColors.length], 0.9);
      scr.position.set(0, 2.3, -0.6);
      scr.userData = { colors: headColors, rate: 0.8 };
      kiosk.add(scr);
      kiosk.position.set(kx, 0.5, kz);
      group.add(kiosk);
      group.userData.screens.push(scr);
    });

    group.userData.pulses = group.userData.pulses || [];
    heads.forEach((h, i) => {
      this.addPulse(
        group,
        new THREE.Vector3(h.pos.x, 3.5, h.pos.z),
        new THREE.Vector3(0, 3.5, 0),
        h.color,
        0.5 + (i % 2) * 0.15,
        Math.random()
      );
    });

    const serverLight = new THREE.PointLight(0x8844ff, 20, 34, 2);
    serverLight.position.set(0, 9, 0);
    group.add(serverLight);
  }

  getBuildings() { return this.buildings; }

  update(dt) {
    this.animTime = (this.animTime || 0) + dt;
    const t = this.animTime;

    this.buildings.forEach(({ mesh }) => {
      const ud = mesh.userData;

      if (ud.padRing) {
        ud.padRing.material.opacity = 0.35 + Math.sin(t * 1.5) * 0.15;
        ud.padRing.rotation.z += dt * 0.2;
      }

      if (ud.columnRings) {
        ud.columnRings.forEach(r => {
          r.rotation.z += dt * r.userData.speed;
        });
      }

      if (ud.spinners) {
        ud.spinners.forEach(s => {
          s.rotation.y += dt * s.userData.rotSpeed;
        });
      }

      if (ud.blinkers) {
        ud.blinkers.forEach(b => {
          b.material.opacity = 0.5 + Math.sin(t * b.userData.blinkSpeed * 3) * 0.5;
          b.material.transparent = true;
        });
      }

      const sparks = ud.sparks;
      if (sparks) {
        sparks.forEach(s => {
          s.userData.phase += dt * s.userData.speed;
          s.position.x = s.userData.basePos.x + Math.sin(s.userData.phase) * 0.5;
          s.position.y = s.userData.basePos.y + Math.cos(s.userData.phase * 0.7) * 0.3;
          s.position.z = s.userData.basePos.z + Math.sin(s.userData.phase * 1.3) * 0.5;
        });
      }

      const pulses = ud.pulses;
      if (pulses) {
        pulses.forEach(p => {
          if (!p.userData) return;
          p.userData.t += dt * p.userData.speed;
          if (p.userData.t > 1) p.userData.t -= 1;
          p.position.lerpVectors(p.userData.from, p.userData.to, p.userData.t);
        });
      }

      const floaters = ud.floaters;
      if (floaters) {
        floaters.forEach(f => {
          if (f && f.mesh) {
            f.mesh.position.y = f.base + Math.sin(t * f.speed + f.phase) * f.amp;
          }
        });
      }

      const screens = ud.screens;
      if (screens) {
        screens.forEach(s => {
          if (s.userData && s.userData.colors) {
            const idx = Math.floor(t * (s.userData.rate || 1)) % s.userData.colors.length;
            s.material.color.setHex(s.userData.colors[idx]);
          }
        });
      }

      const flow = ud.flow;
      if (flow) {
        flow.forEach(f => {
          if (!f.userData) return;
          f.userData.t += dt * f.userData.speed;
          if (f.userData.t > 1) f.userData.t -= 1;
          f.position.lerpVectors(f.userData.from, f.userData.to, f.userData.t);
        });
      }

      if (ud.windowGlow) {
        ud.windowGlow.emissiveIntensity = 0.55 + Math.sin(t * 0.6) * 0.12;
      }

      if (ud.ringGlow) {
        ud.ringGlow.emissiveIntensity = 0.65 + Math.sin(t * 1.2) * 0.25;
      }
    });
  }
}