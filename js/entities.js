/* 纹理与实体模型构建 */
(function () {
  'use strict';
  const { canvasTexture, addBox, addCyl } = Utils;

  window.Textures = {
    // 草原
    ground() {
      return canvasTexture(256, (g) => {
        g.fillStyle = '#4a5247'; g.fillRect(0, 0, 256, 256);
        g.strokeStyle = '#3c433a'; g.lineWidth = 2;
        for (let i = 0; i <= 256; i += 64) {
          g.beginPath(); g.moveTo(i, 0); g.lineTo(i, 256); g.stroke();
          g.beginPath(); g.moveTo(0, i); g.lineTo(256, i); g.stroke();
        }
        for (let i = 0; i < 900; i++) {
          g.fillStyle = 'rgba(0,0,0,' + (Math.random() * 0.12) + ')';
          g.fillRect(Math.random() * 256, Math.random() * 256, 2, 2);
        }
      });
    },
    // 沙漠沙地
    sand() {
      return canvasTexture(256, (g) => {
        g.fillStyle = '#d9c184'; g.fillRect(0, 0, 256, 256);
        g.strokeStyle = '#c9b174'; g.lineWidth = 2;
        for (let i = 0; i <= 256; i += 64) {
          g.beginPath(); g.moveTo(i, 0); g.lineTo(i, 256); g.stroke();
          g.beginPath(); g.moveTo(0, i); g.lineTo(256, i); g.stroke();
        }
        for (let i = 0; i < 900; i++) {
          g.fillStyle = 'rgba(120,90,40,' + (Math.random() * 0.2) + ')';
          g.fillRect(Math.random() * 256, Math.random() * 256, 2, 2);
        }
      });
    },
    // 雪地
    snow() {
      return canvasTexture(256, (g) => {
        g.fillStyle = '#e9eef2'; g.fillRect(0, 0, 256, 256);
        g.strokeStyle = '#d5dde3'; g.lineWidth = 2;
        for (let i = 0; i <= 256; i += 64) {
          g.beginPath(); g.moveTo(i, 0); g.lineTo(i, 256); g.stroke();
          g.beginPath(); g.moveTo(0, i); g.lineTo(256, i); g.stroke();
        }
        for (let i = 0; i < 700; i++) {
          g.fillStyle = 'rgba(180,200,215,' + (Math.random() * 0.35) + ')';
          g.fillRect(Math.random() * 256, Math.random() * 256, 2, 2);
        }
      });
    },
    // 夜晚霓虹城：暗色柏油 + 霓虹光点
    nightGround() {
      return canvasTexture(256, (g) => {
        g.fillStyle = '#22262d'; g.fillRect(0, 0, 256, 256);
        g.strokeStyle = '#2c323c'; g.lineWidth = 2;
        for (let i = 0; i <= 256; i += 64) {
          g.beginPath(); g.moveTo(i, 0); g.lineTo(i, 256); g.stroke();
          g.beginPath(); g.moveTo(0, i); g.lineTo(256, i); g.stroke();
        }
        for (let i = 0; i < 400; i++) {
          g.fillStyle = 'rgba(0,0,0,' + (Math.random() * 0.3) + ')';
          g.fillRect(Math.random() * 256, Math.random() * 256, 2, 2);
        }
        const neon = ['#ff3aa0', '#3ae0ff', '#ffd23a', '#7dff6a'];
        for (let i = 0; i < 40; i++) {
          g.fillStyle = neon[i % neon.length];
          g.globalAlpha = 0.5 + Math.random() * 0.5;
          g.fillRect(Math.random() * 256, Math.random() * 256, 2, 2);
        }
        g.globalAlpha = 1;
      });
    },
    // 工厂室内：水泥地 + 黄色警戒线
    factoryFloor() {
      return canvasTexture(256, (g) => {
        g.fillStyle = '#5a5d61'; g.fillRect(0, 0, 256, 256);
        for (let i = 0; i < 600; i++) {
          g.fillStyle = 'rgba(0,0,0,' + (Math.random() * 0.18) + ')';
          g.fillRect(Math.random() * 256, Math.random() * 256, 2, 2);
        }
        g.fillStyle = '#d8c04a';
        for (let x = 0; x < 256; x += 48) g.fillRect(x, 20, 24, 6);
      });
    },
    // 丛林：深绿草地
    jungleGround() {
      return canvasTexture(256, (g) => {
        g.fillStyle = '#2f4a2f'; g.fillRect(0, 0, 256, 256);
        g.strokeStyle = '#27401f'; g.lineWidth = 2;
        for (let i = 0; i <= 256; i += 64) {
          g.beginPath(); g.moveTo(i, 0); g.lineTo(i, 256); g.stroke();
          g.beginPath(); g.moveTo(0, i); g.lineTo(256, i); g.stroke();
        }
        for (let i = 0; i < 900; i++) {
          g.fillStyle = 'rgba(40,90,30,' + (Math.random() * 0.3) + ')';
          g.fillRect(Math.random() * 256, Math.random() * 256, 2, 2);
        }
      });
    },
    // 太空站：深色金属网格
    spaceGround() {
      return canvasTexture(256, (g) => {
        g.fillStyle = '#191d26'; g.fillRect(0, 0, 256, 256);
        g.strokeStyle = '#2e3542'; g.lineWidth = 2;
        for (let i = 0; i <= 256; i += 32) {
          g.beginPath(); g.moveTo(i, 0); g.lineTo(i, 256); g.stroke();
          g.beginPath(); g.moveTo(0, i); g.lineTo(256, i); g.stroke();
        }
        g.strokeStyle = '#3ae0ff'; g.globalAlpha = 0.5; g.lineWidth = 1;
        for (let i = 0; i <= 256; i += 64) {
          g.beginPath(); g.moveTo(i, 0); g.lineTo(i, 256); g.stroke();
          g.beginPath(); g.moveTo(0, i); g.lineTo(256, i); g.stroke();
        }
        g.globalAlpha = 1;
      });
    },
    // 海岛沙滩（浅色沙）
    beachSand() {
      return canvasTexture(256, (g) => {
        g.fillStyle = '#e8d6a0'; g.fillRect(0, 0, 256, 256);
        for (let i = 0; i < 800; i++) {
          g.fillStyle = 'rgba(150,120,70,' + (Math.random() * 0.25) + ')';
          g.fillRect(Math.random() * 256, Math.random() * 256, 2, 2);
        }
      });
    },
    // 地铁站：灰蓝地砖
    metro() {
      return canvasTexture(256, (g) => {
        g.fillStyle = '#59616d'; g.fillRect(0, 0, 256, 256);
        g.strokeStyle = '#474e59'; g.lineWidth = 3;
        for (let i = 0; i <= 256; i += 64) {
          g.beginPath(); g.moveTo(i, 0); g.lineTo(i, 256); g.stroke();
          g.beginPath(); g.moveTo(0, i); g.lineTo(256, i); g.stroke();
        }
        g.strokeStyle = '#ffd24d'; g.globalAlpha = 0.4; g.lineWidth = 2;
        for (let i = 32; i < 256; i += 128) {
          g.beginPath(); g.moveTo(i, 0); g.lineTo(i, 256); g.stroke();
        }
        g.globalAlpha = 1;
        for (let i = 0; i < 600; i++) {
          g.fillStyle = 'rgba(0,0,0,' + (Math.random() * 0.15) + ')';
          g.fillRect(Math.random() * 256, Math.random() * 256, 2, 2);
        }
      });
    },
    // 火山熔岩：暗红岩地 + 裂纹
    volcano() {
      return canvasTexture(256, (g) => {
        g.fillStyle = '#46281f'; g.fillRect(0, 0, 256, 256);
        g.strokeStyle = '#3a211a'; g.lineWidth = 2;
        for (let i = 0; i <= 256; i += 64) {
          g.beginPath(); g.moveTo(i, 0); g.lineTo(i, 256); g.stroke();
          g.beginPath(); g.moveTo(0, i); g.lineTo(256, i); g.stroke();
        }
        for (let i = 0; i < 40; i++) {
          g.strokeStyle = 'rgba(255,120,50,' + (Math.random() * 0.5 + 0.2) + ')';
          g.lineWidth = Math.random() * 2 + 1;
          g.beginPath();
          g.moveTo(Math.random() * 256, Math.random() * 256);
          g.lineTo(Math.random() * 256, Math.random() * 256);
          g.stroke();
        }
        g.fillStyle = 'rgba(0,0,0,0.2)';
        for (let i = 0; i < 500; i++) {
          g.fillRect(Math.random() * 256, Math.random() * 256, 2, 2);
        }
      });
    },
    // 古堡庭院：石板 + 苔藓
    castle() {
      return canvasTexture(256, (g) => {
        g.fillStyle = '#7d7f82'; g.fillRect(0, 0, 256, 256);
        g.strokeStyle = '#696b6e'; g.lineWidth = 3;
        for (let i = 0; i <= 256; i += 64) {
          g.beginPath(); g.moveTo(i, 0); g.lineTo(i, 256); g.stroke();
          g.beginPath(); g.moveTo(0, i); g.lineTo(256, i); g.stroke();
        }
        for (let i = 0; i < 300; i++) {
          g.fillStyle = 'rgba(70,110,60,' + (Math.random() * 0.3) + ')';
          g.fillRect(Math.random() * 256, Math.random() * 256, 3, 2);
        }
        for (let i = 0; i < 500; i++) {
          g.fillStyle = 'rgba(0,0,0,' + (Math.random() * 0.12) + ')';
          g.fillRect(Math.random() * 256, Math.random() * 256, 2, 2);
        }
      });
    },
    // 木箱
    wood() {
      return canvasTexture(128, (g) => {
        g.fillStyle = '#8a6a3f'; g.fillRect(0, 0, 128, 128);
        g.fillStyle = '#7a5c34'; g.fillRect(8, 8, 112, 112);
        g.strokeStyle = '#5d4426'; g.lineWidth = 4; g.strokeRect(4, 4, 120, 120);
        g.lineWidth = 3;
        g.beginPath(); g.moveTo(4, 4); g.lineTo(124, 124); g.stroke();
        g.beginPath(); g.moveTo(124, 4); g.lineTo(4, 124); g.stroke();
      });
    },
    metal() {
      return canvasTexture(128, (g) => {
        g.fillStyle = '#5a6a72'; g.fillRect(0, 0, 128, 128);
        g.strokeStyle = '#46545c'; g.lineWidth = 5; g.strokeRect(3, 3, 122, 122);
        g.strokeStyle = '#3a464d'; g.lineWidth = 2;
        for (let x = 0; x < 128; x += 16) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 128); g.stroke(); }
        for (let y = 0; y < 128; y += 16) { g.beginPath(); g.moveTo(0, y); g.lineTo(128, y); g.stroke(); }
        g.fillStyle = 'rgba(0,0,0,0.12)';
        for (let i = 0; i < 60; i++) g.fillRect(Math.random() * 128, Math.random() * 128, 3, 3);
      });
    },
    concrete() {
      return canvasTexture(128, (g) => {
        g.fillStyle = '#8f9390'; g.fillRect(0, 0, 128, 128);
        g.strokeStyle = '#7a7e7b'; g.lineWidth = 4; g.strokeRect(2, 2, 124, 124);
        g.fillStyle = 'rgba(0,0,0,0.15)';
        for (let i = 0; i < 400; i++) g.fillRect(Math.random() * 128, Math.random() * 128, 2, 2);
      });
    },
    target() {
      return canvasTexture(256, (g) => {
        const cx = 128, cy = 128;
        const rings = [
          { r: 122, c: '#151515' }, { r: 100, c: '#f2f2f2' }, { r: 82, c: '#d33a3a' },
          { r: 64, c: '#f2f2f2' }, { r: 46, c: '#d33a3a' }, { r: 26, c: '#f6d748' }, { r: 10, c: '#d33a3a' }
        ];
        for (const ring of rings) { g.beginPath(); g.arc(cx, cy, ring.r, 0, Math.PI * 2); g.fillStyle = ring.c; g.fill(); }
      });
    }
  };

  /* ================= 敌人模型 ================= */
  // variant: normal | sniper | kamikaze | boss | zombie | shield | assassin | summoner
  function buildRobot(variant) {
    const v = variant || 'normal';
    const g = new THREE.Group();
    const matMetal = new THREE.MeshStandardMaterial({ color: 0x4b515a, metalness: 0.8, roughness: 0.35 });
    const matDark = new THREE.MeshStandardMaterial({ color: 0x26292e, metalness: 0.7, roughness: 0.45 });
    const accentMap = {
      sniper: 0x2a6a9a, kamikaze: 0x9a2a2a, zombie: 0x4a8a2a,
      shield: 0x2a5a8a, assassin: 0x5a2a8a, summoner: 0x8a5a2a
    };
    const accentColor = accentMap[v] || 0x9a3030;
    const matAccent = new THREE.MeshStandardMaterial({ color: accentColor, metalness: 0.6, roughness: 0.4 });
    const glowMap = { sniper: 0x33ddff, zombie: 0x44ff44, shield: 0x4488ff, assassin: 0xaa44ff, summoner: 0xffaa44 };
    const glowColor = glowMap[v] || 0xff3311;
    const matGlow = new THREE.MeshStandardMaterial({ color: 0x111111, emissive: glowColor, emissiveIntensity: v === 'kamikaze' ? 3.2 : 2.0 });
    matGlow.userData.baseEmissive = glowColor;

    addBox(g, 0.66, 0.9, 0.42, matMetal, 0, 1.28, 0);
    addBox(g, 0.22, 0.22, 0.06, matGlow, 0, 1.34, 0.22);
    addBox(g, 0.5, 0.22, 0.32, matDark, 0, 0.82, 0);
    addBox(g, 0.2, 0.16, 0.3, matAccent, -0.46, 1.62, 0);
    addBox(g, 0.2, 0.16, 0.3, matAccent, 0.46, 1.62, 0);
    if (v === 'boss') {
      addBox(g, 0.8, 0.1, 0.5, matAccent, 0, 1.72, 0);
      addBox(g, 0.26, 0.26, 0.08, matGlow, 0, 1.3, 0.26);
    }
    if (v === 'shield') {
      addBox(g, 0.5, 1.0, 0.08, new THREE.MeshStandardMaterial({ color: 0x3a6a9a, metalness: 0.7, roughness: 0.4 }), 0, 1.2, 0.3); // 盾牌
    }
    if (v === 'summoner') {
      addCyl(g, 0.03, 0.5, matGlow, 0, 2.1, 0); // 召唤天线
    }
    const head = addBox(g, 0.36, 0.3, 0.36, matDark, 0, 1.86, 0);
    head.userData.head = true;
    addBox(g, 0.28, 0.08, 0.04, matGlow, 0, 1.88, 0.19);

    const la = new THREE.Group(); la.position.set(-0.46, 1.55, 0); g.add(la);
    addBox(la, 0.15, 0.6, 0.15, matMetal, 0, -0.28, 0);
    addBox(la, 0.13, 0.5, 0.13, matDark, 0, -0.72, 0);
    const ra = new THREE.Group(); ra.position.set(0.46, 1.55, 0); g.add(ra);
    addBox(ra, 0.15, 0.6, 0.15, matMetal, 0, -0.28, 0);
    addBox(ra, 0.13, 0.5, 0.13, matDark, 0, -0.72, 0);
    const ll = new THREE.Group(); ll.position.set(-0.18, 0.82, 0); g.add(ll);
    addBox(ll, 0.2, 0.72, 0.2, matDark, 0, -0.36, 0);
    const rl = new THREE.Group(); rl.position.set(0.18, 0.82, 0); g.add(rl);
    addBox(rl, 0.2, 0.72, 0.2, matDark, 0, -0.36, 0);

    // 手持武器（狙击型枪管更长；近战型不用枪）
    const meleeType = (v === 'kamikaze' || v === 'zombie' || v === 'shield' || v === 'assassin');
    if (!meleeType) {
      const gunLen = v === 'sniper' ? 1.0 : 0.5;
      const rgun = new THREE.Group();
      rgun.position.set(0.46, 1.34, 0.18);
      addBox(rgun, 0.07, 0.11, gunLen, matDark, 0, 0, 0.12);
      addBox(rgun, 0.05, 0.05, gunLen * 0.6, matMetal, 0, 0.02, 0.12 + gunLen * 0.45);
      addBox(rgun, 0.06, 0.09, 0.08, matDark, 0, -0.08, 0.12);
      g.add(rgun);
    }

    g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
    if (v === 'assassin') {
      g.traverse((o) => { if (o.isMesh && o.material) { o.material.transparent = true; o.material.opacity = 0.12; } });
    }
    g.userData.parts = { la, ra, ll, rl };
    g.userData.gunMuzzle = { lx: 0.46, ly: 1.36, lz: 0.9 };
    return g;
  }

  // 飞行无人机
  function buildDrone() {
    const g = new THREE.Group();
    const matBody = new THREE.MeshStandardMaterial({ color: 0x3a4048, metalness: 0.8, roughness: 0.35 });
    const matDark = new THREE.MeshStandardMaterial({ color: 0x1d2024, metalness: 0.7, roughness: 0.5 });
    const matGlow = new THREE.MeshStandardMaterial({ color: 0x111111, emissive: 0xff3311, emissiveIntensity: 2.0 });
    matGlow.userData.baseEmissive = 0xff3311;

    const body = addBox(g, 0.5, 0.3, 0.5, matBody, 0, 0, 0);
    addBox(g, 0.14, 0.1, 0.06, matGlow, 0, 0.02, 0.27);
    for (const s of [-1, 1]) {
      const arm = addBox(g, 0.9, 0.05, 0.08, matDark, s * 0.35, 0.08, 0);
      const rotor = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.02, 12),
        new THREE.MeshStandardMaterial({ color: 0x222, metalness: 0.5, roughness: 0.6 }));
      rotor.position.set(s * 0.8, 0.16, 0);
      g.add(rotor);
      g.userData['rotor' + s] = rotor;
    }
    for (const s of [-1, 1]) {
      const arm = addBox(g, 0.08, 0.05, 0.9, matDark, 0, 0.08, s * 0.35);
      const rotor = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.02, 12),
        new THREE.MeshStandardMaterial({ color: 0x222, metalness: 0.5, roughness: 0.6 }));
      rotor.position.set(0, 0.16, s * 0.8);
      g.add(rotor);
      g.userData['rotorz' + s] = rotor;
    }
    g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
    g.userData.parts = {};
    g.userData.gunMuzzle = { lx: 0, ly: 0, lz: 0.3 };
    return g;
  }

  window.Builders = {
    buildRobot,
    buildDrone,
    /* 金色小猪（无攻击性） */
    buildPig() {
      const g = new THREE.Group();
      const gold = new THREE.MeshStandardMaterial({ color: 0xf2c14e, roughness: 0.35, metalness: 0.3 });
      const darkGold = new THREE.MeshStandardMaterial({ color: 0xd6a033, roughness: 0.35, metalness: 0.3 });
      const black = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.5 });

      const body = new THREE.Mesh(new THREE.SphereGeometry(0.5, 18, 14), gold);
      body.scale.set(1.05, 0.9, 1.35); body.position.y = 0.55; g.add(body);
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.3, 16, 12), gold);
      head.position.set(0, 0.75, 0.55); head.userData.head = true; g.add(head);
      const snout = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 0.1, 12), darkGold);
      snout.rotation.x = Math.PI / 2; snout.position.set(0, 0.72, 0.82); g.add(snout);
      for (const s of [-1, 1]) {
        const eye = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 8), black);
        eye.position.set(s * 0.12, 0.84, 0.68); g.add(eye);
        const ear = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.16, 8), darkGold);
        ear.position.set(s * 0.16, 1.0, 0.52); ear.rotation.z = s * 0.5; g.add(ear);
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.08, 0.5, 10), darkGold);
        leg.position.set(s * 0.26, 0.25, s * 0.3); g.add(leg);
      }
      for (const s of [-1, 1]) {
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.08, 0.5, 10), darkGold);
        leg.position.set(s * 0.26, 0.25, -s * 0.3); g.add(leg);
      }
      const tail = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.02, 6, 12), darkGold);
      tail.position.set(0, 0.7, -0.62); tail.rotation.x = Math.PI / 2; g.add(tail);

      g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
      return g;
    },
    /* 靶子 */
    buildTarget() {
      const g = new THREE.Group();
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.07, 1.25, 10),
        new THREE.MeshStandardMaterial({ color: 0x666, metalness: 0.4, roughness: 0.5 }));
      pole.position.y = 0.62; pole.castShadow = true; g.add(pole);
      const pivot = new THREE.Group(); pivot.position.y = 1.35; g.add(pivot);
      const board = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.6),
        new THREE.MeshStandardMaterial({ map: Textures.target(), side: THREE.DoubleSide, roughness: 0.8 }));
      board.castShadow = true; pivot.add(board);
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.8, 0.04, 8, 32),
        new THREE.MeshStandardMaterial({ color: 0x222, metalness: 0.5, roughness: 0.4 }));
      ring.position.z = -0.02; pivot.add(ring);
      g.userData.pivot = pivot;
      g.userData.board = board;
      return g;
    },
    /* 棕榈树（装饰） */
    buildPalm() {
      const g = new THREE.Group();
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.18, 4.5, 8),
        new THREE.MeshStandardMaterial({ color: 0x8a6a45, roughness: 0.9 }));
      trunk.position.y = 2.25; trunk.castShadow = true; g.add(trunk);
      const leafMat = new THREE.MeshStandardMaterial({ color: 0x2f8a3f, roughness: 0.8, side: THREE.DoubleSide });
      for (let i = 0; i < 6; i++) {
        const leaf = new THREE.Mesh(new THREE.ConeGeometry(0.5, 1.6, 4), leafMat);
        const a = (i / 6) * Math.PI * 2;
        leaf.position.set(Math.cos(a) * 0.7, 4.4, Math.sin(a) * 0.7);
        leaf.rotation.z = Math.cos(a) * 0.7;
        leaf.rotation.x = Math.sin(a) * 0.7;
        leaf.castShadow = true;
        g.add(leaf);
      }
      return g;
    },
    /* 丛林大树（树干有碰撞） */
    buildTree() {
      const g = new THREE.Group();
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.5, 5, 10),
        new THREE.MeshStandardMaterial({ color: 0x5d4630, roughness: 0.9 }));
      trunk.position.y = 2.5; trunk.castShadow = true; g.add(trunk);
      const leaves = new THREE.Mesh(new THREE.SphereGeometry(1.8, 10, 8),
        new THREE.MeshStandardMaterial({ color: 0x2a5a2a, roughness: 0.9 }));
      leaves.position.y = 5.4; leaves.castShadow = true; g.add(leaves);
      return g;
    }
  };
})();
