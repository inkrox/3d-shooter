/* 武器定义与枪模 */
(function () {
  'use strict';
  const { addBox, addCyl } = Utils;

  const gunMats = {
    metal: new THREE.MeshStandardMaterial({ color: 0x2b2f33, metalness: 0.75, roughness: 0.35 }),
    dark: new THREE.MeshStandardMaterial({ color: 0x1b1d20, metalness: 0.6, roughness: 0.5 }),
    grip: new THREE.MeshStandardMaterial({ color: 0x3a2f24, metalness: 0.1, roughness: 0.9 }),
    accent: new THREE.MeshStandardMaterial({ color: 0x8a2f2f, metalness: 0.5, roughness: 0.4 }),
    glow: new THREE.MeshStandardMaterial({ color: 0x06222a, emissive: 0x44ddee, emissiveIntensity: 2.0 })
  };

  window.GunMats = gunMats;

  function buildPistol() {
    const g = new THREE.Group();
    addBox(g, 0.08, 0.13, 0.3, gunMats.metal, 0, 0, -0.1);
    addBox(g, 0.05, 0.05, 0.16, gunMats.dark, 0, 0.02, -0.32);
    addBox(g, 0.07, 0.17, 0.08, gunMats.grip, 0, -0.14, 0.0);
    addBox(g, 0.03, 0.04, 0.06, gunMats.dark, 0, 0.08, -0.1);
    addBox(g, 0.03, 0.03, 0.04, gunMats.accent, 0, 0.09, 0.12);
    return g;
  }
  function buildSMG() {
    const g = new THREE.Group();
    addBox(g, 0.09, 0.14, 0.4, gunMats.metal, 0, 0, -0.12);
    addBox(g, 0.04, 0.04, 0.22, gunMats.dark, 0, 0.02, -0.4);
    addBox(g, 0.07, 0.18, 0.08, gunMats.grip, 0, -0.15, 0.0);
    addBox(g, 0.05, 0.17, 0.06, gunMats.dark, 0, -0.23, -0.05);
    addBox(g, 0.06, 0.05, 0.2, gunMats.dark, 0, -0.03, 0.24);
    addBox(g, 0.02, 0.03, 0.3, gunMats.dark, 0, 0.09, -0.1);
    addBox(g, 0.03, 0.05, 0.04, gunMats.dark, 0, 0.09, -0.42);
    return g;
  }
  function buildRifle() {
    const g = new THREE.Group();
    addBox(g, 0.08, 0.12, 0.5, gunMats.metal, 0, 0, -0.14);
    addBox(g, 0.05, 0.05, 0.45, gunMats.dark, 0, 0.02, -0.55);
    addCyl(g, 0.045, 0.08, gunMats.dark, 0, 0.02, -0.8, Math.PI / 2);
    addBox(g, 0.09, 0.08, 0.3, gunMats.grip, 0, -0.03, -0.38);
    addBox(g, 0.07, 0.17, 0.08, gunMats.grip, 0, -0.15, 0.02);
    addBox(g, 0.05, 0.15, 0.07, gunMats.dark, 0, -0.22, -0.04);
    addBox(g, 0.06, 0.09, 0.24, gunMats.dark, 0, -0.02, 0.26);
    addBox(g, 0.07, 0.1, 0.04, gunMats.grip, 0, -0.03, 0.34);
    addBox(g, 0.03, 0.06, 0.05, gunMats.dark, 0, 0.09, -0.55);
    addBox(g, 0.03, 0.06, 0.05, gunMats.dark, 0, 0.09, -0.1);
    addCyl(g, 0.025, 0.1, gunMats.metal, 0, 0.02, -0.68, Math.PI / 2);
    return g;
  }
  function buildShotgun() {
    const g = new THREE.Group();
    addBox(g, 0.09, 0.12, 0.5, gunMats.metal, 0, 0, -0.08);
    addBox(g, 0.06, 0.06, 0.6, gunMats.dark, 0, 0.02, -0.58);
    addBox(g, 0.05, 0.05, 0.4, gunMats.metal, 0, -0.06, -0.5);
    addBox(g, 0.09, 0.08, 0.16, gunMats.grip, 0, -0.05, -0.34);
    addBox(g, 0.07, 0.17, 0.08, gunMats.grip, 0, -0.14, 0.04);
    addBox(g, 0.06, 0.09, 0.26, gunMats.grip, 0, -0.02, 0.28);
    addBox(g, 0.02, 0.03, 0.03, gunMats.accent, 0, 0.06, -0.72);
    return g;
  }
  function buildSniper() {
    const g = new THREE.Group();
    addBox(g, 0.08, 0.12, 0.55, gunMats.metal, 0, 0, -0.14);
    addBox(g, 0.04, 0.04, 0.72, gunMats.dark, 0, 0.03, -0.72);
    addCyl(g, 0.05, 0.26, gunMats.dark, 0, 0.11, -0.12, Math.PI / 2);
    addCyl(g, 0.055, 0.03, gunMats.metal, 0, 0.11, -0.12, Math.PI / 2);
    addBox(g, 0.07, 0.16, 0.08, gunMats.grip, 0, -0.15, 0.04);
    addBox(g, 0.06, 0.09, 0.3, gunMats.dark, 0, -0.02, 0.28);
    addBox(g, 0.03, 0.1, 0.03, gunMats.dark, -0.05, -0.07, -0.5);
    addBox(g, 0.03, 0.1, 0.03, gunMats.dark, 0.05, -0.07, -0.5);
    return g;
  }
  function buildRPG() {
    const g = new THREE.Group();
    addCyl(g, 0.07, 0.9, gunMats.dark, 0, 0.02, -0.45, Math.PI / 2);
    addCyl(g, 0.09, 0.2, gunMats.metal, 0, 0.02, 0.05, Math.PI / 2);
    addCyl(g, 0.085, 0.1, gunMats.accent, 0, 0.02, -0.88, Math.PI / 2);
    addBox(g, 0.08, 0.2, 0.1, gunMats.grip, 0, -0.16, -0.15);
    addBox(g, 0.07, 0.16, 0.09, gunMats.grip, 0, -0.14, 0.12);
    addBox(g, 0.04, 0.05, 0.1, gunMats.dark, 0, 0.12, -0.2);
    return g;
  }
  function buildRevolver() {
    const g = new THREE.Group();
    const steel = new THREE.MeshStandardMaterial({ color: 0x4a4d52, metalness: 0.85, roughness: 0.3 });
    // 枪管
    addCyl(g, 0.035, 0.28, steel, 0, 0.03, -0.3, Math.PI / 2);
    // 枪管下退壳杆
    addCyl(g, 0.012, 0.22, gunMats.dark, 0, -0.02, -0.28, Math.PI / 2);
    // 转轮
    addCyl(g, 0.055, 0.12, gunMats.dark, 0, 0, -0.12, Math.PI / 2);
    // 转轮内 6 个弹膛
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      addCyl(g, 0.014, 0.13, steel, Math.cos(a) * 0.035, Math.sin(a) * 0.035, -0.12, Math.PI / 2);
    }
    // 枪身（机匣）
    addBox(g, 0.075, 0.11, 0.26, gunMats.metal, 0, 0.01, -0.02);
    // 准星
    addBox(g, 0.02, 0.045, 0.02, gunMats.dark, 0, 0.085, -0.42);
    // 击锤
    addBox(g, 0.035, 0.03, 0.05, steel, 0, 0.09, 0.1);
    // 扳机护圈
    addBox(g, 0.012, 0.015, 0.1, gunMats.dark, 0, -0.06, 0.12);
    addBox(g, 0.012, 0.09, 0.012, gunMats.dark, 0, -0.045, 0.165);
    // 木质握把（两段做出弧度）
    addBox(g, 0.065, 0.1, 0.075, gunMats.grip, 0, -0.13, 0.12);
    addBox(g, 0.06, 0.12, 0.07, gunMats.grip, 0, -0.22, 0.14);
    // 握把底部圆角
    addCyl(g, 0.03, 0.065, gunMats.grip, 0, -0.27, 0.145, Math.PI / 2);
    return g;
  }
  function buildLMG() {
    const g = new THREE.Group();
    // 压低顶部部件，避免开镜时挡住准星
    addBox(g, 0.1, 0.12, 0.62, gunMats.metal, 0, 0, -0.2);       // 机匣
    addBox(g, 0.05, 0.05, 0.5, gunMats.dark, 0, 0.02, -0.68);    // 枪管
    addCyl(g, 0.05, 0.1, gunMats.dark, 0, 0.02, -0.95, Math.PI / 2); // 制退器
    addBox(g, 0.11, 0.08, 0.35, gunMats.grip, 0, -0.04, -0.5);   // 护木
    addBox(g, 0.09, 0.12, 0.15, gunMats.dark, 0, 0.05, -0.15);   // 弹箱（压低）
    addBox(g, 0.07, 0.18, 0.08, gunMats.grip, 0, -0.16, 0.08);   // 握把
    addBox(g, 0.07, 0.09, 0.28, gunMats.dark, 0, -0.03, 0.3);    // 枪托
    addBox(g, 0.04, 0.04, 0.05, gunMats.dark, 0, 0.06, -0.32);   // 瞄具（压低）
    addBox(g, 0.03, 0.14, 0.03, gunMats.dark, -0.06, -0.11, -0.75); // 两脚架
    addBox(g, 0.03, 0.14, 0.03, gunMats.dark, 0.06, -0.11, -0.75);
    return g;
  }
  function buildLaser() {
    const g = new THREE.Group();
    addBox(g, 0.08, 0.12, 0.5, gunMats.metal, 0, 0, -0.15);
    addBox(g, 0.05, 0.05, 0.3, gunMats.dark, 0, 0.02, -0.5);
    addCyl(g, 0.04, 0.14, gunMats.glow, 0, 0.02, -0.68, Math.PI / 2);
    addBox(g, 0.05, 0.06, 0.1, gunMats.glow, 0, 0.07, -0.3);
    addBox(g, 0.07, 0.16, 0.08, gunMats.grip, 0, -0.14, 0.05);
    addBox(g, 0.05, 0.14, 0.06, gunMats.dark, 0, -0.2, -0.1);
    return g;
  }
  function buildGatling() {
    const g = new THREE.Group();
    addCyl(g, 0.1, 0.7, gunMats.dark, 0, 0, -0.32, Math.PI / 2);
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      addCyl(g, 0.022, 0.72, gunMats.metal, Math.cos(a) * 0.06, Math.sin(a) * 0.06, -0.32, Math.PI / 2);
    }
    addBox(g, 0.13, 0.17, 0.32, gunMats.metal, 0, -0.02, 0.1);
    addBox(g, 0.07, 0.16, 0.08, gunMats.grip, 0, -0.17, 0.15);
    addBox(g, 0.05, 0.05, 0.16, gunMats.dark, 0, 0.1, -0.1);
    return g;
  }
  function buildFlamethrower() {
    const g = new THREE.Group();
    addCyl(g, 0.06, 0.5, gunMats.dark, 0, 0.02, -0.3, Math.PI / 2);
    addCyl(g, 0.075, 0.12, gunMats.accent, 0, 0.02, -0.58, Math.PI / 2);
    addCyl(g, 0.1, 0.26, gunMats.metal, 0, -0.09, 0.05, Math.PI / 2);
    addBox(g, 0.07, 0.16, 0.08, gunMats.grip, 0, -0.15, 0.18);
    addBox(g, 0.04, 0.05, 0.1, gunMats.dark, 0, 0.08, 0.0);
    return g;
  }
  function buildCrossbow() {
    const g = new THREE.Group();
    addBox(g, 0.05, 0.06, 0.45, gunMats.grip, 0, 0, -0.15);
    addBox(g, 0.62, 0.03, 0.05, gunMats.dark, 0, 0.02, -0.32);
    addBox(g, 0.04, 0.16, 0.05, gunMats.grip, 0, -0.1, 0.1);
    addBox(g, 0.05, 0.05, 0.18, gunMats.dark, 0, 0.05, -0.3);
    addBox(g, 0.03, 0.04, 0.05, gunMats.accent, 0, 0.1, -0.12);
    return g;
  }
  function buildKnife() {
    const g = new THREE.Group();
    const steel = new THREE.MeshStandardMaterial({ color: 0xcdd4da, metalness: 0.9, roughness: 0.25 });
    addBox(g, 0.03, 0.02, 0.2, steel, 0, 0.02, -0.22);          // 刀身
    addBox(g, 0.02, 0.02, 0.1, steel, 0, 0.045, -0.32);         // 刀尖
    addBox(g, 0.05, 0.14, 0.05, gunMats.grip, 0, -0.06, 0.0);   // 握把
    addBox(g, 0.06, 0.03, 0.04, gunMats.dark, 0, -0.03, -0.1);  // 护手
    return g;
  }

  /* 武器配置：
     damage 单发伤害 | pellets 弹丸数 | fireRate 每秒射速 | auto 全自动
     spread 散布 | mag 弹匣 | reload 换弹时间 | recoil/kick 后坐力
     adsZoom 开镜视野
     projectile: 'rocket' 火箭弹 / 'arrow' 弩箭
     laser: 激光弹道 | flamethrower: 火焰喷射 | tracerColor: 弹道颜色 */
  window.WEAPONS = [
    { id: 'pistol',  name: '手枪',    key: 'Digit1', slotLabel: '1', build: buildPistol,  muzzle: [0, 0.0, -0.42],
      damage: 55, pellets: 1, fireRate: 5, auto: false, spread: 0.008, mag: 12, reload: 1.0, recoil: 0.05, kick: 0.009, adsZoom: 46 },
    { id: 'smg',     name: '冲锋枪',  key: 'Digit2', slotLabel: '2', build: buildSMG,     muzzle: [0, 0.02, -0.52],
      damage: 22, pellets: 1, fireRate: 14, auto: true, spread: 0.03, mag: 40, reload: 1.6, recoil: 0.02, kick: 0.004, adsZoom: 48 },
    { id: 'rifle',   name: '步枪',    key: 'Digit3', slotLabel: '3', build: buildRifle,   muzzle: [0, 0.02, -0.78],
      damage: 38, pellets: 1, fireRate: 9, auto: true, spread: 0.012, mag: 30, reload: 1.6, recoil: 0.035, kick: 0.006, adsZoom: 40 },
    { id: 'shotgun', name: '霰弹枪',  key: 'Digit4', slotLabel: '4', build: buildShotgun, muzzle: [0, 0.02, -0.88],
      damage: 18, pellets: 8, fireRate: 1.5, auto: false, spread: 0.06, mag: 6, reload: 2.0, recoil: 0.12, kick: 0.02, adsZoom: 50 },
    { id: 'sniper',  name: '狙击枪',  key: 'Digit5', slotLabel: '5', build: buildSniper,  muzzle: [0, 0.05, -1.1],
      damage: 240, pellets: 1, fireRate: 0.8, auto: false, spread: 0.0015, mag: 5, reload: 2.2, recoil: 0.18, kick: 0.03, adsZoom: 16 },
    { id: 'rpg',     name: '火箭筒',  key: 'Digit6', slotLabel: '6', build: buildRPG,     muzzle: [0, 0.03, -0.95],
      damage: 160, pellets: 1, fireRate: 0.7, auto: false, spread: 0.002, mag: 3, reload: 2.6, recoil: 0.22, kick: 0.045, adsZoom: 45, projectile: 'rocket' },
    { id: 'revolver', name: '左轮手枪', key: 'Digit7', slotLabel: '7', build: buildRevolver, muzzle: [0, 0.02, -0.5],
      damage: 85, pellets: 1, fireRate: 2.2, auto: false, spread: 0.007, mag: 6, reload: 2.0, recoil: 0.09, kick: 0.015, adsZoom: 46 },
    { id: 'lmg',     name: '轻机枪',  key: 'Digit8', slotLabel: '8', build: buildLMG,     muzzle: [0, 0.02, -1.0],
      damage: 28, pellets: 1, fireRate: 11, auto: true, spread: 0.05, mag: 80, reload: 3.2, recoil: 0.025, kick: 0.003, adsZoom: 48 },
    { id: 'laser',   name: '激光步枪', key: 'Digit9', slotLabel: '9', build: buildLaser,   muzzle: [0, 0.02, -0.7],
      damage: 16, pellets: 1, fireRate: 16, auto: true, spread: 0.003, mag: 60, reload: 2.0, recoil: 0.015, kick: 0.002, adsZoom: 46, laser: true, tracerColor: 0x66eeff },
    { id: 'gatling', name: '加特林',  key: 'Digit0', slotLabel: '0', build: buildGatling, muzzle: [0, 0, -0.7],
      damage: 16, pellets: 1, fireRate: 24, auto: true, spread: 0.07, mag: 200, reload: 4.0, recoil: 0.012, kick: 0.0015, adsZoom: 50 },
    { id: 'flame',   name: '火焰喷射器', key: 'KeyQ', slotLabel: 'Q', build: buildFlamethrower, muzzle: [0, 0.02, -0.65],
      damage: 12, pellets: 1, fireRate: 11, auto: true, spread: 0, mag: 100, reload: 2.5, recoil: 0.02, kick: 0.005, adsZoom: 50, flamethrower: true },
    { id: 'crossbow', name: '弓弩',   key: 'KeyE', slotLabel: 'E', build: buildCrossbow, muzzle: [0, 0.05, -0.4],
      damage: 150, pellets: 1, fireRate: 1.3, auto: false, spread: 0.001, mag: 6, reload: 2.2, recoil: 0.06, kick: 0.012, adsZoom: 28, projectile: 'arrow' },
    { id: 'knife',   name: '军刀',   key: 'KeyC', slotLabel: 'C', build: buildKnife,   muzzle: [0, 0.02, -0.4],
      damage: 120, pellets: 1, fireRate: 2.5, auto: true, spread: 0, mag: 0, reload: 0, recoil: 0.04, kick: 0.006, adsZoom: 50, melee: true }
  ];
})();
