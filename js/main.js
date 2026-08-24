/* 主游戏逻辑 */
(() => {
  'use strict';

  const { canvasTexture, addBox, addCyl, rand, clamp } = Utils;
  const audio = GameAudio;
  const WEAPONS = window.WEAPONS;
  const Textures = window.Textures;
  const Builders = window.Builders;

  /* ================= 常量 ================= */
  const EYE_HEIGHT = 1.7;
  const WALK_SPEED = 5.2;
  const SPRINT_SPEED = 8.6;
  const GRAVITY = 36;
  const JUMP_SPEED = 12;
  const MOUSE_SENS = 0.0021;
  const TIMED_DURATION = 180; // 限时模式 3 分钟
  const HEADSHOT_MULT = 3;          // 爆头 300%
  const EXPLOSION_RADIUS = 7;
  const EXPLOSION_DAMAGE = 150;
  const GRENADE_RADIUS = 6;
  const GRENADE_DAMAGE = 120;
  const settings = { sensitivity: 1, fov: 75, difficulty: 1, shake: 1, hitmarker: 0.1 }; // 灵敏度倍率、基础视野、难度、震动强度、命中反馈时长
  /* 键位绑定（可在设置页自定义；武器键 1-9/0/Q/E/C 与 Esc 固定） */
  const DEF_BINDS = {
    jump: 'Space', sprint: 'KeyR', reload: 'KeyV', aim: 'KeyF',
    grenade: 'KeyG', molotov: 'KeyH', frost: 'KeyJ', cannon: 'KeyT',
    bubble: 'KeyB', recruit: 'KeyX', menu: 'KeyM', crouch: 'Tab'
  };
  const BIND_NAMES = {
    jump: '跳跃', sprint: '疾跑', reload: '换弹', aim: '开镜',
    grenade: '手雷', molotov: '燃烧瓶', frost: '冰冻弹', cannon: '大炮',
    bubble: '保护罩', recruit: '招募队友', menu: '返回菜单', crouch: '蹲下/滑铲'
  };
  const KEY_NAMES = {
    Space: '空格', Tab: 'Tab', KeyR: 'R', KeyV: 'V', KeyF: 'F', KeyG: 'G', KeyH: 'H',
    KeyJ: 'J', KeyT: 'T', KeyB: 'B', KeyX: 'X', KeyM: 'M',
    ShiftLeft: '左Shift', ShiftRight: '右Shift', ControlLeft: '左Ctrl', ControlRight: '右Ctrl',
    AltLeft: '左Alt', KeyQ: 'Q', KeyE: 'E', KeyC: 'C', KeyA: 'A', KeyW: 'W', KeyS: 'S', KeyD: 'D'
  };
  function keyName(code) { return KEY_NAMES[code] || code.replace('Key', '').replace('Digit', ''); }
  function bindKey(action) { return (settings.keybinds && settings.keybinds[action]) || DEF_BINDS[action]; }
  const DIFF = {
    0: { hp: 0.7, dmg: 0.7, speed: 1 },
    1: { hp: 1, dmg: 1, speed: 1 },
    2: { hp: 1.5, dmg: 1.4, speed: 1.1 },
    3: { hp: 2.2, dmg: 1.8, speed: 1.25 } // 噩梦
  };
  function diffHp() { return DIFF[settings.difficulty] ? DIFF[settings.difficulty].hp : 1; }
  function diffDmg() { return DIFF[settings.difficulty] ? DIFF[settings.difficulty].dmg : 1; }
  function diffSpeed() { return DIFF[settings.difficulty] ? DIFF[settings.difficulty].speed : 1; }

  /* ================= DOM ================= */
  const canvas = document.getElementById('game');
  const overlay = document.getElementById('overlay');
  const cta = document.getElementById('cta');
  const title = document.getElementById('title');
  const subtitle = document.getElementById('subtitle');
  const finalstats = document.getElementById('finalstats');
  const healthFill = document.getElementById('healthfill');
  const healthNum = document.getElementById('healthnum');
  const shieldbar = document.getElementById('shieldbar');
  const shieldfill = document.getElementById('shieldfill');
  const bubblestatus = document.getElementById('bubblestatus');
  const areahint = document.getElementById('areahint');
  const leveltext = document.getElementById('leveltext');
  const xpfill = document.getElementById('xpfill');
  const minimap = document.getElementById('minimap');
  const mmCtx = minimap.getContext('2d');
  const wavetext = document.getElementById('wavetext');
  const healthbox = document.getElementById('healthbox');
  const timerbox = document.getElementById('timerbox');
  const timerEl = document.getElementById('timer');
  const timerlabel = document.getElementById('timerlabel');
  const scoreEl = document.getElementById('score');
  const killsEl = document.getElementById('kills');
  const ammoEl = document.getElementById('ammo');
  const weaponname = document.getElementById('weaponname');
  const weaponstats = document.getElementById('weaponstats');
  const reloadhint = document.getElementById('reloadhint');
  const hitmarker = document.getElementById('hitmarker');
  const dmgEl = document.getElementById('dmg');
  const banner = document.getElementById('banner');
  const dpsbox = document.getElementById('dpsbox');
  const dpsnum = document.getElementById('dpsnum');
  const crosshair = document.getElementById('crosshair');
  const scopeEl = document.getElementById('scope');
  const aimhint = document.getElementById('aimhint');
  const sightEl = document.getElementById('sight');
  const returnbtn = document.getElementById('returnbtn');
  const endbtn = document.getElementById('endbtn');
  const slotsEl = document.getElementById('slots');
  const volslider = document.getElementById('volslider');
  const vollabel = document.getElementById('vollabel');
  const sensslider = document.getElementById('sensslider');
  const fovslider = document.getElementById('fovslider');
  const difficultyEl = document.getElementById('difficulty');
  const shakeslider = document.getElementById('shakeslider');
  const hitselect = document.getElementById('hitselect');
  const dirCanvas = document.getElementById('dir-canvas');
  const dirCtx = dirCanvas.getContext('2d');
  const savecodeEl = document.getElementById('savecode');
  const saveExportEl = document.getElementById('save-export');
  const saveImportEl = document.getElementById('save-import');
  const toastEl = document.getElementById('toast');
  const grenadesEl = document.getElementById('grenades');
  const controlsEl = document.getElementById('controls');
  const shopEl = document.getElementById('shop');
  const shopCoins = document.getElementById('shop-coins');
  const shopRows = document.getElementById('shop-rows');
  const shopSkinsEl = document.getElementById('shop-skins');
  const shopReset = document.getElementById('shop-reset');
  const weaponlist = document.getElementById('weaponlist');
  const customcfgEl = document.getElementById('customcfg');
  const checkinbtn = document.getElementById('checkin-btn');

  /* ================= 场景 ================= */
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x9cc4e4);
  scene.fog = new THREE.Fog(0x9cc4e4, 30, 140);

  const camera = new THREE.PerspectiveCamera(75, innerWidth / innerHeight, 0.05, 500);
  camera.rotation.order = 'YXZ';

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setSize(innerWidth, innerHeight);
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const hemi = new THREE.HemisphereLight(0xdfeaf5, 0x5a4a3a, 0.9);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xfff2dd, 1.25);
  sun.position.set(40, 60, 25);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -90; sun.shadow.camera.right = 90;
  sun.shadow.camera.top = 90; sun.shadow.camera.bottom = -90;
  sun.shadow.camera.far = 260;
  sun.shadow.bias = -0.0004;
  scene.add(sun);

  /* ================= 地面 ================= */
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(600, 600),
    new THREE.MeshStandardMaterial({ map: Textures.ground(), roughness: 0.95, metalness: 0 })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  function setGroundTexture(tex, repeat) {
    ground.material.map = tex;
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(repeat, repeat);
    ground.material.needsUpdate = true;
  }
  setGroundTexture(Textures.ground(), 90);

  /* ================= 障碍物系统（多种 + 可站立） ================= */
  const obstacles = [];     // {x, z, w, d, base, top, h, mesh}
  const obstacleMeshes = []; // 供机器人视线检测

  function registerObstacle(mesh, x, z, w, d, base, top, hp) {
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);
    const o = { x, z, w, d, base, top, h: top - base, mesh, hp: hp || 1e9 };
    obstacles.push(o);
    obstacleMeshes.push(mesh);
    return o;
  }

  function clearObstacles() {
    for (const o of obstacles) {
      scene.remove(o.mesh);
      o.mesh.traverse((c) => {
        if (c.geometry) c.geometry.dispose();
        if (c.material) c.material.dispose();
      });
    }
    obstacles.length = 0;
    obstacleMeshes.length = 0;
  }

  /* 障碍物被炸毁（RPG 破坏地形） */
  function destroyObstacle(o) {
    const explosive = o.explosive;
    const i = obstacles.indexOf(o); if (i >= 0) obstacles.splice(i, 1);
    const j = obstacleMeshes.indexOf(o.mesh); if (j >= 0) obstacleMeshes.splice(j, 1);
    const k = raycastTargets.indexOf(o.mesh); if (k >= 0) raycastTargets.splice(k, 1);
    spawnParticles(new THREE.Vector3(o.x, (o.base + o.top) / 2 + 0.3, o.z), 0x8a6a3f, 20, 7, 8);
    spawnParticles(new THREE.Vector3(o.x, o.top, o.z), 0x555555, 10, 5, 8);
    scene.remove(o.mesh);
    o.mesh.traverse((c) => {
      if (c.geometry) c.geometry.dispose();
      if (c.material) c.material.dispose();
    });
    // 油桶爆炸（可引发连锁反应）
    if (explosive) explodeAt(new THREE.Vector3(o.x, 1, o.z), 5, 100);
  }

  function addCrate(x, z, w, h, d) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d),
      new THREE.MeshStandardMaterial({ map: Textures.wood(), roughness: 0.9 }));
    m.position.set(x, h / 2, z);
    registerObstacle(m, x, z, w, d, 0, h, 100);
  }
  function addContainer(x, z, w, h, d) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d),
      new THREE.MeshStandardMaterial({ map: Textures.metal(), metalness: 0.5, roughness: 0.5 }));
    m.position.set(x, h / 2, z);
    registerObstacle(m, x, z, w, d, 0, h, 600);
  }
  function addBarrier(x, z, w, h, d) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d),
      new THREE.MeshStandardMaterial({ map: Textures.concrete(), roughness: 0.9 }));
    m.position.set(x, h / 2, z);
    registerObstacle(m, x, z, w, d, 0, h, 300);
  }
  function addBarrel(x, z, r, h) {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 18),
      new THREE.MeshStandardMaterial({ color: 0x3f6fa0, metalness: 0.6, roughness: 0.4 }));
    m.position.set(x, h / 2, z);
    const o = registerObstacle(m, x, z, r * 2, r * 2, 0, h, 60);
    o.explosive = true; // 油桶：被摧毁时爆炸
  }
  function addRock(x, z, s) {
    const m = new THREE.Mesh(new THREE.IcosahedronGeometry(s, 0),
      new THREE.MeshStandardMaterial({ color: 0x7a7a74, roughness: 1, flatShading: true }));
    m.position.set(x, s * 0.55, z);
    m.rotation.y = Math.random() * Math.PI;
    registerObstacle(m, x, z, s * 1.4, s * 1.4, 0, s * 1.1, 500);
  }
  function addNeonBlock(x, z, w, h, d, color) {
    const mat = new THREE.MeshStandardMaterial({ color: 0x222222, emissive: color, emissiveIntensity: 1.6, roughness: 0.4 });
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x, h / 2, z);
    registerObstacle(m, x, z, w, d, 0, h, 150);
  }
  function addMachine(x, z, w, h, d) {
    const g = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(w, h, d),
      new THREE.MeshStandardMaterial({ color: 0x6a7278, metalness: 0.6, roughness: 0.5 }));
    body.position.y = h / 2; g.add(body);
    const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, w + 1, 10),
      new THREE.MeshStandardMaterial({ color: 0x8a3030, metalness: 0.5, roughness: 0.5 }));
    pipe.rotation.z = Math.PI / 2; pipe.position.set(0, h - 0.2, 0); g.add(pipe);
    g.position.set(x, 0, z);
    registerObstacle(g, x, z, w, d, 0, h, 400);
  }
  function addPalm(x, z) {
    const p = Builders.buildPalm();
    p.position.set(x, 0, z);
    p.rotation.y = Math.random() * Math.PI * 2;
    p.traverse((o) => { if (o.isMesh) o.castShadow = true; });
    scene.add(p); // 装饰物，无碰撞
  }
  function addTreeObstacle(x, z) {
    const t = Builders.buildTree();
    t.position.set(x, 0, z);
    registerObstacle(t, x, z, 1.0, 1.0, 0, 5, 400);
  }
  function addSpacePanel(x, z, w, d) {
    const mat = new THREE.MeshStandardMaterial({ color: 0x0a2a3a, emissive: 0x3ae0ff, emissiveIntensity: 1.2, roughness: 0.3 });
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, 0.1, d), mat);
    m.position.set(x, 0.6, z);
    registerObstacle(m, x, z, w, d, 0.4, 0.7, 150);
  }

  /* ================= 地图系统 ================= */
  const MAPS = [
    { id: 'grass',   name: '草原竞技场', sky: 0x9cc4e4, fog: 0x9cc4e4, groundTex: () => Textures.ground(),       repeat: 90, gravityMul: 1 },
    { id: 'desert',  name: '沙漠废墟',   sky: 0xe3c99a, fog: 0xd8c39a, groundTex: () => Textures.sand(),         repeat: 60, gravityMul: 1 },
    { id: 'snow',    name: '雪地战场',   sky: 0xc8d9e6, fog: 0xd6e2ec, groundTex: () => Textures.snow(),         repeat: 90, gravityMul: 1 },
    { id: 'neon',    name: '霓虹夜城',   sky: 0x0d1120, fog: 0x141a2c, groundTex: () => Textures.nightGround(),  repeat: 60, gravityMul: 1 },
    { id: 'factory', name: '工厂车间',   sky: 0x39404a, fog: 0x4a5158, groundTex: () => Textures.factoryFloor(), repeat: 40, gravityMul: 1 },
    { id: 'beach',   name: '海岛沙滩',   sky: 0x8fd0e8, fog: 0xa8d8e8, groundTex: () => Textures.beachSand(),    repeat: 40, gravityMul: 1 },
    { id: 'jungle',  name: '丛林秘境',   sky: 0x9cc4a0, fog: 0x8fbf92, groundTex: () => Textures.jungleGround(), repeat: 90, gravityMul: 1 },
    { id: 'space',   name: '太空站',     sky: 0x0a0a18, fog: 0x161a2c, groundTex: () => Textures.spaceGround(),  repeat: 20, gravityMul: 0.55 },
    { id: 'metro',   name: '地铁站',     sky: 0x5a6a7a, fog: 0x667584, groundTex: () => Textures.metro(),       repeat: 40, gravityMul: 1 },
    { id: 'volcano', name: '火山熔岩',   sky: 0x7a3a28, fog: 0x6e3422, groundTex: () => Textures.volcano(),     repeat: 60, gravityMul: 0.8 },
    { id: 'castle',  name: '古堡庭院',   sky: 0xa8b0a8, fog: 0x969e96, groundTex: () => Textures.castle(),      repeat: 50, gravityMul: 1 }
  ];
  let currentMap = MAPS[0];
  function pickRandomMap() {
    currentMap = MAPS[Math.floor(Math.random() * MAPS.length)];
  }

  /* 竞技场环境（对战/打靶/打猪） */
  function buildArena() {
    clearObstacles();
    scene.background = new THREE.Color(currentMap.sky);
    scene.fog = new THREE.Fog(currentMap.fog, 30, 140);
    setGroundTexture(currentMap.groundTex(), currentMap.repeat);
    // 中央攀爬楼梯
    addCrate(7, 3, 2.2, 1.2, 2.2);
    addCrate(7, 5.4, 2.2, 2.4, 2.2);
    addCrate(7, 7.8, 2.2, 3.6, 2.2);
    // 集装箱
    addContainer(15, -7, 4, 2.6, 2.4);
    addContainer(-13, 9, 3.4, 3.0, 2.4);
    addContainer(-18, -5, 3.0, 2.4, 2.4);
    // 混凝土路障
    addBarrier(2, -8, 3.6, 1.0, 1.2);
    addBarrier(-4, -11, 4.6, 1.0, 1.2);
    addBarrier(-9, 18, 3.4, 1.0, 1.2);
    // 油桶与岩石
    const barrels = [[-6, -3], [3, 6], [11, 10], [-14, -2], [16, 6]];
    for (const b of barrels) addBarrel(b[0], b[1], 0.5, 1.2);
    const rocks = [[-10, -14], [20, 12], [-20, 16], [8, -14], [-2, 15]];
    for (const r of rocks) addRock(r[0], r[1], rand(0.6, 1.0));
    // 随机散布木箱
    const placements = [];
    let tries = 0;
    while (placements.length < 14 && tries < 500) {
      tries++;
      const ang = Math.random() * Math.PI * 2;
      const dist = rand(10, 45);
      const x = Math.cos(ang) * dist, z = Math.sin(ang) * dist;
      if (Math.hypot(x, z) < 5 || (Math.abs(x - 7) < 4 && z > 0 && z < 10)) continue;
      const w = rand(1.4, 2.4), d = rand(1.4, 2.4);
      const h = [1.0, 1.4, 1.8][Math.floor(Math.random() * 3)];
      let ok = true;
      for (const p of placements) {
        if (Math.abs(p.x - x) < (p.w + w) / 2 + 1 && Math.abs(p.z - z) < (p.d + d) / 2 + 1) { ok = false; break; }
      }
      if (!ok) continue;
      placements.push({ x, z, w, d, h });
    }
    for (const p of placements) addCrate(p.x, p.z, p.w, p.h, p.d);

    // 各地图特色布景
    if (currentMap.id === 'desert') {
      for (const r of [[5, -16], [-16, -8], [18, 14], [-8, 20], [22, -14]]) addRock(r[0], r[1], rand(0.8, 1.3));
    } else if (currentMap.id === 'snow') {
      addBarrier(-14, 2, 3.4, 1.0, 1.2);
      addBarrier(12, 16, 4.0, 1.0, 1.2);
      addBarrel(-18, 14, 0.5, 1.2);
      addBarrel(18, -14, 0.5, 1.2);
    } else if (currentMap.id === 'neon') {
      const neonCols = [0xff3aa0, 0x3ae0ff, 0xffd23a, 0x7dff6a];
      for (const p of [[-12, -6], [10, -12], [16, 12], [-14, 12], [6, 18], [-4, -18]]) {
        addNeonBlock(p[0], p[1], 1.6, 2.2, 1.6, neonCols[Math.floor(Math.random() * neonCols.length)]);
      }
      addContainer(18, -2, 4, 2.6, 2.4);
    } else if (currentMap.id === 'factory') {
      for (const p of [[-10, -8], [12, -10], [-14, 14], [16, 16], [-6, 20], [22, -8]]) {
        addMachine(p[0], p[1], rand(2.2, 3.4), rand(1.6, 2.6), rand(2.2, 3.4));
      }
    } else if (currentMap.id === 'beach') {
      for (const p of [[-12, -14], [16, -10], [20, 14], [-16, 10], [-20, -4], [10, 16], [-6, 6], [2, -16]]) {
        addPalm(p[0], p[1]);
      }
    } else if (currentMap.id === 'jungle') {
      for (const p of [[-10, -10], [14, -14], [-16, 14], [18, 12], [-6, 18], [10, 18], [-20, -6], [20, -8]]) {
        addTreeObstacle(p[0], p[1]);
      }
    } else if (currentMap.id === 'space') {
      for (const p of [[-10, -8], [12, -12], [-14, 12], [16, 14]]) {
        addSpacePanel(p[0], p[1], 2.4, 2.4);
      }
    }
    // 大炮与防御阵地（固定布设）
    buildCannonModel();
    buildBunker();
  }

  /* ================= 大炮 / 防御阵地 ================= */
  const cannon = { x: 18, z: -10, yaw: 0, pitch: 0.15, cooldown: 0, active: false, barrel: null, group: null, exitPos: null };
  const bunker = { x: -16, z: -12 };

  function buildCannonModel() {
    const dark = new THREE.MeshStandardMaterial({ color: 0x2a2d31, metalness: 0.7, roughness: 0.4 });
    const wood = new THREE.MeshStandardMaterial({ color: 0x6a5230, roughness: 0.8 });
    const g = new THREE.Group();
    const base = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.4, 1.7), wood);
    base.position.y = 0.4; g.add(base);
    for (const s of [-1, 1]) {
      const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 0.12, 12), dark);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(s * 0.75, 0.45, 0);
      g.add(wheel);
    }
    const pivot = new THREE.Group();
    pivot.position.y = 0.95;
    g.add(pivot);
    const barrel = new THREE.Group();
    const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.16, 1.4, 10), dark);
    tube.rotation.x = Math.PI / 2; tube.position.z = 0.7;
    barrel.add(tube);
    const muzzle = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.19, 0.3, 10), dark);
    muzzle.rotation.x = Math.PI / 2; muzzle.position.z = 1.35;
    barrel.add(muzzle);
    pivot.add(barrel);
    g.position.set(cannon.x, 0, cannon.z);
    g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
    scene.add(g);
    cannon.barrel = barrel;
    cannon.group = g;
    registerObstacle(g, cannon.x, cannon.z, 1.4, 1.9, 0, 1.5, 999999);
  }

  function buildBunker() {
    const sand = new THREE.MeshStandardMaterial({ color: 0x9a8a62, roughness: 0.95 });
    const g = new THREE.Group();
    const wall = (w, h, d, x, z) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), sand);
      m.position.set(x, h / 2, z);
      g.add(m);
    };
    wall(3.4, 0.9, 0.6, 0, -1.0);
    wall(3.4, 0.9, 0.6, 0, 1.0);
    wall(0.6, 0.9, 2.6, -1.7, 0);
    const flag = new THREE.Mesh(new THREE.BoxGeometry(0.04, 1.4, 0.04),
      new THREE.MeshStandardMaterial({ color: 0x4a4a4a }));
    flag.position.set(0, 1.2, -1.0);
    g.add(flag);
    const flagCloth = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.28, 0.02),
      new THREE.MeshStandardMaterial({ color: 0xff4d4d, side: THREE.DoubleSide }));
    flagCloth.position.set(0.25, 1.5, -1.0);
    g.add(flagCloth);
    g.position.set(bunker.x, 0, bunker.z);
    g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
    scene.add(g);
    registerObstacle(g, bunker.x, bunker.z, 3.6, 2.8, 0, 0.9, 999999);
  }

  function nearBunker() {
    return Math.hypot(player.pos.x - bunker.x, player.pos.z - bunker.z) < 2.6;
  }

  function toggleCannon() {
    if (cannon.active) {
      cannon.active = false;
      if (cannon.exitPos) player.pos.copy(cannon.exitPos);
      toast('离开大炮');
      return;
    }
    if (Math.hypot(player.pos.x - cannon.x, player.pos.z - cannon.z) < 3.5) {
      cannon.active = true;
      cannon.exitPos = player.pos.clone();
      toast('操作大炮：鼠标瞄准 · 左键开炮 · T 离开');
    }
  }

  function cannonWorldMuzzle(out) {
    const cp = Math.cos(cannon.pitch), sp = Math.sin(cannon.pitch);
    const cy = Math.cos(cannon.yaw), sy = Math.sin(cannon.yaw);
    out.set(
      cannon.x + (-sy * cp) * 1.4,
      1.95 + sp * 1.4,
      cannon.z + (-cy * cp) * 1.4
    );
    return out;
  }

  function fireCannonball() {
    if (cannon.cooldown > 0) return;
    cannon.cooldown = 2.2;
    audio.rocketLaunch();
    const m = new THREE.Mesh(new THREE.SphereGeometry(0.13, 10, 8),
      new THREE.MeshStandardMaterial({ color: 0x222, metalness: 0.7, roughness: 0.4 }));
    const from = cannonWorldMuzzle(new THREE.Vector3());
    m.position.copy(from);
    const dir = aimForward(new THREE.Vector3());
    scene.add(m);
    rockets.push({ mesh: m, vel: dir.multiplyScalar(35), life: 4, prev: from.clone(), type: 'cannon', radius: 8, damage: 220 });
    state.recoil = 0.18;
    state.kick = 0.02;
  }

  function updateCannon(dt) {
    cannon.cooldown = Math.max(0, cannon.cooldown - dt);
    if (cannon.barrel) {
      cannon.barrel.rotation.y = cannon.yaw;
      cannon.barrel.rotation.x = cannon.pitch;
    }
    if (cannon.active && state.mode === 'playing') {
      player.pos.set(cannon.x, 2.0, cannon.z);
      player.yaw = cannon.yaw;
      player.pitch = cannon.pitch;
    }
  }

  /* ================= 保护罩 ================= */
  function activateBubble() {
    if (!state.shopUpgrades.bubble) return;
    if (state.bubbleCooldown > 0 || state.bubbleUntil > state.time) return;
    state.bubbleUntil = state.time + 5;
    state.bubbleCooldown = 40;
    audio.tone(300, 0.4, 0.3, 600);
    toast('🌀 保护罩激活：5 秒免疫');
  }

  /* ================= 招募队友 ================= */
  function recruitAlly() {
    if (allies.length >= 4) { audio.empty(); toast('最多招募 4 名队友'); return; }
    if (state.allyCooldown > 0) return;
    state.allyCooldown = 8;
    const g = Builders.buildRobot();
    g.scale.setScalar(0.7);
    // 友军标识：绿色发光 + 亮色
    g.traverse((o) => {
      if (o.isMesh && o.material) {
        o.material.emissive = o.material.emissive || new THREE.Color(0);
        o.material.emissive.setHex(0x33cc66);
        o.material.emissiveIntensity = 0.9;
      }
    });
    const ang = Math.random() * Math.PI * 2;
    g.position.set(player.pos.x + Math.cos(ang) * 2.2, 0, player.pos.z + Math.sin(ang) * 2.2);
    scene.add(g);
    allies.push({ group: g, attackTimer: 0, phase: Math.random() * 10 });
    state.ach.maxAllies = Math.max(state.ach.maxAllies || 0, allies.length);
    audio.tone(500, 0.15, 0.3, 800);
    toast('🤝 招募队友！' + allies.length + '/4');
  }

  function updateAllies(dt) {
    state.allyCooldown = Math.max(0, state.allyCooldown - dt);
    for (const a of allies) {
      const g = a.group;
      // 跟随玩家（保持 4~7 米）
      const dx = player.pos.x - g.position.x;
      const dz = player.pos.z - g.position.z;
      const dist = Math.hypot(dx, dz);
      if (dist > 7) { g.position.x += (dx / dist) * 4.5 * dt; g.position.z += (dz / dist) * 4.5 * dt; }
      else if (dist < 4) { g.position.x -= (dx / dist) * 3 * dt; g.position.z -= (dz / dist) * 3 * dt; }
      resolveCollisionsXZ(g.position, 0.4, 0);
      g.rotation.y = Math.atan2(player.pos.x - g.position.x, player.pos.z - g.position.z);
      // 走动摆动
      const parts = g.userData.parts;
      const sw = Math.sin(state.time * 10 + a.phase);
      if (parts.la) { parts.la.rotation.x = sw * 0.4; parts.ra.rotation.x = -sw * 0.4; }
      // 自动射击最近的敌人
      let target = null, bd = 30;
      for (const e of enemies) {
        if (e.dead) continue;
        const d = e.group.position.distanceTo(g.position);
        if (d < bd) { bd = d; target = e; }
      }
      for (const p of pigs) {
        if (p.dead) continue;
        const d = p.group.position.distanceTo(g.position);
        if (d < bd) { bd = d; target = p; }
      }
      a.attackTimer -= dt;
      if (target && a.attackTimer <= 0) {
        a.attackTimer = 0.5;
        const origin = g.position.clone(); origin.y += 1.2;
        const aim = target.group.position.clone(); aim.y += 1.3; // 瞄准躯干
        const dir = new THREE.Vector3().subVectors(aim, origin).normalize();
        raycaster.set(origin, dir);
        raycaster.far = 30;
        const hits = raycaster.intersectObjects(raycastTargets, true);
        if (hits.length > 0) {
          const hit = hits[0];
          const ent = findEntityFromObject(hit.object);
          if (ent && ent.kind === 'robot' && ent.robot === target && !target.dead) {
            target.hp -= 12 * dmgMul();
            target.hitFlash = 0.08;
            spawnDamageNumber(hit.point, Math.round(12 * dmgMul()), false);
            if (target.hp <= 0) killRobot(target);
          } else if (ent && ent.kind === 'pig' && ent.pig === target && !target.dead) {
            target.hp -= 12 * dmgMul();
            target.hitFlash = 0.08;
            spawnDamageNumber(hit.point, Math.round(12 * dmgMul()), false);
            if (target.hp <= 0) killPig(target);
          }
          spawnTracerLine(origin, hit.point, 0x66ffaa);
        }
      }
    }
  }

  buildArena();

  /* ================= 武器系统 ================= */
  const gunHolder = new THREE.Group();
  camera.add(gunHolder);
  scene.add(camera);

  const flashTex = canvasTexture(64, (g, s) => {
    const grad = g.createRadialGradient(s / 2, s / 2, 2, s / 2, s / 2, s / 2 - 2);
    grad.addColorStop(0, 'rgba(255,255,200,1)');
    grad.addColorStop(0.4, 'rgba(255,180,60,0.9)');
    grad.addColorStop(1, 'rgba(255,120,0,0)');
    g.fillStyle = grad; g.fillRect(0, 0, s, s);
  });
  const flashSprite = new THREE.Sprite(new THREE.SpriteMaterial({
    map: flashTex, blending: THREE.AdditiveBlending, depthTest: false, depthWrite: false
  }));
  flashSprite.scale.setScalar(0);
  gunHolder.add(flashSprite);
  const muzzleLight = new THREE.PointLight(0xffb35c, 0, 10, 2);
  gunHolder.add(muzzleLight);

  // 保护罩（免疫屏障）视觉
  const bubbleMesh = new THREE.Mesh(new THREE.SphereGeometry(1.15, 16, 12),
    new THREE.MeshBasicMaterial({ color: 0x66ddff, transparent: true, opacity: 0.16, depthWrite: false, side: THREE.DoubleSide }));
  bubbleMesh.visible = false;
  scene.add(bubbleMesh);

  for (const w of WEAPONS) {
    w.model = w.build();
    w.model.visible = false;
    w.model.traverse((o) => { if (o.isMesh) o.castShadow = true; });
    gunHolder.add(w.model);
    w.muzzleV = new THREE.Vector3(w.muzzle[0], w.muzzle[1], w.muzzle[2]);
  }

  /* ================= 游戏状态 ================= */
  const player = {
    pos: new THREE.Vector3(0, EYE_HEIGHT, 0),
    vel: new THREE.Vector3(),
    yaw: 0, pitch: 0,
    health: 100, maxHealth: 100,
    onGround: true, lastDamage: -99
  };

  const state = {
    mode: 'menu',          // menu | playing | over
    gameMode: null,        // battle | target | pig
    score: 0, kills: 0, wave: 1,
    enemiesRemaining: 0, enemiesSpawned: 0, waveDelay: 0, waveToken: 0,
    weaponIndex: 0, weaponAmmo: {},
    reloading: false, reloadTimer: 0,
    fireCooldown: 0, recoil: 0, kick: 0, shake: 0,
    time: 0, timeLeft: TIMED_DURATION,
    aiming: false, firing: false, triggerEdge: false, pigCleared: false,
    grenades: 3, molotovs: 3, frosts: 3, coins: 0, lastEarned: 0,
    shopUpgrades: { dmg: 0, hp: 0, nade: 0, speed: 0, reload: 0, fire: 0, ice: 0, lightning: 0, shield: 0, bubble: 0, silencer: 0, mag: 0, optic: 0 },
    skins: {}, activeSkin: '', activeCross: '',
    customCfg: { types: ['normal', 'drone', 'kamikaze', 'sniper', 'shield', 'assassin', 'summoner', 'boss'], count: 5, map: 'random', weather: 'random' },
    customRound: 0, customDelay: 0,
    trainDmg: [], trainDps: 0,
    checkin: { last: '', count: 0 },
    shieldPoints: 0, bubbleUntil: 0, bubbleCooldown: 0,
    streak: 0, streakTimer: 0, allyCooldown: 0,
    crouch: false, slideTimer: 0, vaultBoost: 0,
    eventTimer: 0, eventCount: 0,
    bossCount: 0, bossDelay: 0,
    level: 1, xp: 0, xpToNext: 100, jumps: 0, spaceEdge: false, lastGameDate: '',
    ach: { unlocked: {}, totalKills: 0, bestScore: 0, bestWave: 0, pigCleared: 0, bestSurvive: 0, headshots: 0, weaponKills: {}, totalGames: 0, totalScore: 0, playTime: 0 },
    highscores: {},
    quests: null,
    weekly: null
  };

  const enemies = [];   // 机器人
  const pigs = [];      // 小猪
  const targets = [];   // 靶子
  const particles = [];
  const tracers = [];
  const shells = [];
  const floaters = [];
  const rockets = [];       // RPG 火箭弹 / 弩箭
  const grenades = [];      // 投掷物（手雷/燃烧瓶/冰冻弹）
  const explosionLights = []; // 爆炸光
  const pickups = [];       // 敌人掉落补给
  const fireZones = [];     // 燃烧瓶火焰区域
  const frostZones = [];    // 冰冻弹减速光效
  const allies = [];        // 招募的队友
  const raycastTargets = [ground];

  const keys = {};
  let locked = false;

  function currentWeapon() { return WEAPONS[state.weaponIndex]; }
  function isTimed() { return state.gameMode === 'target' || state.gameMode === 'pig'; }

  /* ================= 输入 ================= */
  addEventListener('keydown', (e) => {
    if (e.code === bindKey('jump')) { e.preventDefault(); state.spaceEdge = true; }
    if (e.code === bindKey('crouch')) { if (locked) e.preventDefault(); keys[e.code] = true; return; } // 蹲下/滑铲键：锁定中阻止默认行为（防退出指针锁定暂停）
    keys[e.code] = true;
    if (e.code === bindKey('reload')) startReload();
    if (e.code === bindKey('aim') && state.mode === 'playing' && locked) setAiming(true); // 长按开镜
    if (e.code === bindKey('grenade') && state.mode === 'playing' && locked) throwGrenade('grenade');  // 手雷
    if (e.code === bindKey('molotov') && state.mode === 'playing' && locked) throwGrenade('molotov');  // 燃烧瓶
    if (e.code === bindKey('frost') && state.mode === 'playing' && locked) throwGrenade('frost');      // 冰冻弹
    if (e.code === bindKey('cannon') && state.mode === 'playing' && locked) toggleCannon();            // 大炮
    if (e.code === bindKey('bubble') && state.mode === 'playing' && locked) activateBubble();          // 保护罩
    if (e.code === bindKey('recruit') && state.mode === 'playing' && locked) recruitAlly();            // 招募队友
    if (e.code === bindKey('menu') && state.mode === 'playing') goMenu();                  // 返回主菜单
    if (e.code === 'Escape' && locked) document.exitPointerLock(); // Esc 固定：暂停
    const w = WEAPONS.find(x => x.key === e.code);
    if (w) switchWeapon(WEAPONS.indexOf(w));
  });
  addEventListener('keyup', (e) => {
    keys[e.code] = false;
    if (e.code === bindKey('aim')) setAiming(false); // 松开关镜
  });

  // ---- 开镜输入：只使用 F 键（长按开镜，松开关闭）；右键已移除 ----
  function setAiming(v) { state.aiming = !!v; }

  addEventListener('mousemove', (e) => {
    if (!locked || state.mode !== 'playing') return;
    if (cannon.active) {
      // 操作大炮：鼠标控制炮管
      cannon.yaw -= e.movementX * 0.002;
      cannon.pitch -= e.movementY * 0.002;
      cannon.pitch = Math.max(-0.6, Math.min(1.2, cannon.pitch));
      return;
    }
    // 开镜时降低灵敏度，便于精确瞄准；瞄准状态只由 F 键维护
    const sens = MOUSE_SENS * settings.sensitivity * (state.aiming ? 0.38 : 1);
    player.yaw -= e.movementX * sens;
    player.pitch -= e.movementY * sens;
    player.pitch = Math.max(-1.5, Math.min(1.5, player.pitch));
  });

  addEventListener('mousedown', (e) => {
    if (state.mode !== 'playing' || !locked) return;
    if (e.button === 0) { state.firing = true; state.triggerEdge = true; }
  });
  addEventListener('mouseup', (e) => {
    if (e.button === 0) state.firing = false;
  });
  addEventListener('contextmenu', (e) => e.preventDefault());
  addEventListener('wheel', (e) => {
    if (state.mode !== 'playing' || !locked) return;
    const dir = e.deltaY > 0 ? 1 : -1;
    switchWeapon((state.weaponIndex + dir + WEAPONS.length) % WEAPONS.length);
  });

  document.addEventListener('pointerlockchange', () => {
    locked = document.pointerLockElement === canvas;
    if (!locked) {
      state.firing = false; setAiming(false);
      if (cannon.active) { cannon.active = false; if (cannon.exitPos) player.pos.copy(cannon.exitPos); }
    }
    updateOverlay();
  });

  function requestLock() {
    try {
      const p = canvas.requestPointerLock();
      if (p && p.catch) p.catch(() => {});
    } catch (err) { /* ignore */ }
  }

  overlay.addEventListener('click', () => {
    if (state.mode === 'playing' && !locked) requestLock();
  });
  returnbtn.addEventListener('click', (e) => {
    e.stopPropagation();
    goMenu();
  });
  endbtn.addEventListener('click', (e) => {
    e.stopPropagation();
    gameOver(); // 提前结束本局并结算金币
  });
  document.querySelectorAll('.modebtn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      audio.init();
      audio.startBGM();
      audio.setVolume(volslider.value / 100); // 应用当前音量设置
      if (btn.dataset.mode === 'shop') { openShop(); return; }
      if (btn.dataset.mode === 'weapons') { openWeapons(); return; }
      if (btn.dataset.mode === 'custom') { openCustomCfg(); return; } // 自定义战斗：先打开配置面板
      setGameMode(btn.dataset.mode);
    });
  });
  document.getElementById('cc-start').addEventListener('click', (e) => { e.stopPropagation(); startCustom(); });
  document.getElementById('cc-back').addEventListener('click', (e) => { e.stopPropagation(); goMenu(); });
  checkinbtn.addEventListener('click', (e) => { e.stopPropagation(); claimCheckin(); });

  addEventListener('resize', () => {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
  });

  /* ================= 武器切换 / 换弹 ================= */
  function switchWeapon(idx) {
    if (idx === state.weaponIndex || idx < 0 || idx >= WEAPONS.length) return;
    WEAPONS[state.weaponIndex].model.visible = false;
    state.weaponIndex = idx;
    const w = WEAPONS[idx];
    w.model.visible = true;
    // 皮肤/熟练度涂装：皮肤优先，无皮肤时熟练 Lv3+ 枪身变金色
    applySkin();
    flashSprite.position.copy(w.muzzleV);
    muzzleLight.position.copy(w.muzzleV);
    state.reloading = false;
    state.triggerEdge = false;
    reloadhint.classList.remove('show');
    audio.switch();
    updateWeaponHUD();
  }

  function startReload() {
    if (state.reloading) return;
    const w = currentWeapon();
    if (state.weaponAmmo[w.id] >= magSize(w)) return;
    state.reloading = true;
    state.triggerEdge = false;
    state.reloadTimer = w.reload / (1 + 0.12 * state.shopUpgrades.reload);
    reloadhint.textContent = '换弹中…';
    reloadhint.classList.add('show');
    audio.reload();
  }

  /* ================= 实体生成 ================= */
  /* 敌人类型：normal 步枪兵 | drone 无人机 | kamikaze 自爆兵 | sniper 狙击手 | boss BOSS */
  function spawnEnemyOfType(type, scale) {
    const w = scale !== undefined ? scale : state.wave;
    let pos = new THREE.Vector3();
    for (let i = 0; i < 15; i++) {
      const ang = Math.random() * Math.PI * 2;
      const dist = 26 + Math.random() * 22;
      pos.set(Math.cos(ang) * dist, 0, Math.sin(ang) * dist);
      let inside = false;
      for (const o of obstacles) {
        if (Math.abs(pos.x - o.x) < o.w / 2 + 0.6 && Math.abs(pos.z - o.z) < o.d / 2 + 0.6) inside = true;
      }
      if (!inside) break;
    }
    let group, robot;
    if (type === 'drone') {
      group = Builders.buildDrone();
      group.scale.setScalar(1.35); // 无人机建模调大
      robot = {
        group, type, phase: Math.random() * 10,
        hp: 70 + w * 12, maxHp: 70 + w * 12,
        speed: 3.0 + w * 0.15, damage: 6 + w,
        attackTimer: 1.4, burstShots: 0, burstTimer: 0,
        hitFlash: 0, dead: false, deathTimer: 0
      };
    } else if (type === 'kamikaze') {
      group = Builders.buildRobot('kamikaze');
      robot = {
        group, type, phase: Math.random() * 10,
        hp: 80 + w * 15, maxHp: 80 + w * 15,
        speed: 4.6 + w * 0.3, damage: 28,
        attackTimer: 0, burstShots: 0, burstTimer: 0,
        hitFlash: 0, dead: false, deathTimer: 0
      };
    } else if (type === 'sniper') {
      group = Builders.buildRobot('sniper');
      robot = {
        group, type, phase: Math.random() * 10,
        hp: 120 + w * 22, maxHp: 120 + w * 22,
        speed: 2.6 + w * 0.15, damage: 22 + w * 2,
        attackTimer: 1.8, burstShots: 0, burstTimer: 0,
        hitFlash: 0, dead: false, deathTimer: 0
      };
    } else if (type === 'boss') {
      group = Builders.buildRobot('boss');
      group.scale.setScalar(1.6);
      robot = {
        group, type, phase: Math.random() * 10,
        hp: 650 + w * 70, maxHp: 650 + w * 70,
        speed: 1.8 + w * 0.06, damage: 12 + w * 0.8,
        attackTimer: 1.0, burstShots: 0, burstTimer: 0,
        hitFlash: 0, dead: false, deathTimer: 1.2
      };
    } else if (type === 'zombie') {
      group = Builders.buildRobot('zombie');
      robot = {
        group, type, phase: Math.random() * 10,
        hp: 70 + w * 12, maxHp: 70 + w * 12,
        speed: 3.2 + w * 0.15, damage: 10,
        attackTimer: 0, burstShots: 0, burstTimer: 0,
        hitFlash: 0, dead: false, deathTimer: 0
      };
    } else if (type === 'shield') {
      group = Builders.buildRobot('shield');
      robot = {
        group, type, phase: Math.random() * 10,
        hp: 500 + w * 35, maxHp: 500 + w * 35,
        speed: 1.9 + w * 0.08, damage: 18,
        attackTimer: 0, burstShots: 0, burstTimer: 0,
        hitFlash: 0, dead: false, deathTimer: 0
      };
    } else if (type === 'assassin') {
      group = Builders.buildRobot('assassin');
      robot = {
        group, type, phase: Math.random() * 10,
        hp: 150 + w * 20, maxHp: 150 + w * 20,
        speed: 5.5 + w * 0.2, damage: 25,
        attackTimer: 0, burstShots: 0, burstTimer: 0,
        hitFlash: 0, dead: false, deathTimer: 0
      };
    } else if (type === 'summoner') {
      group = Builders.buildRobot('summoner');
      robot = {
        group, type, phase: Math.random() * 10,
        hp: 260 + w * 25, maxHp: 260 + w * 25,
        speed: 2.6 + w * 0.1, damage: 10,
        attackTimer: 2.0, burstShots: 0, burstTimer: 0,
        hitFlash: 0, dead: false, deathTimer: 0
      };
    } else {
      group = Builders.buildRobot();
      robot = {
        group, type, phase: Math.random() * 10,
        hp: 160 + w * 40, maxHp: 160 + w * 40,
        speed: 3.2 + w * 0.25, damage: 12 + w * 2,
        attackTimer: 1.5 + Math.random() * 0.8, burstShots: 0, burstTimer: 0,
        hitFlash: 0, dead: false, deathTimer: 0
      };
    }
    robot.hp = Math.round(robot.hp * diffHp()); // 难度影响血量
    robot.maxHp = robot.hp;
    robot.speed *= diffSpeed();               // 难度影响移速（噩梦更快）
    robot.hpBar = addHpBar(group, type === 'drone' ? 0.9 : 2.4);
    group.position.copy(pos);
    scene.add(group);
    group.userData.kind = 'robot';
    group.userData.robot = robot;
    enemies.push(robot);
    raycastTargets.push(group);
  }

  /* 召唤者召唤的小丧尸（弱化版） */
  function spawnMinion(x, z) {
    const group = Builders.buildRobot('zombie');
    group.position.set(x + rand(-2, 2), 0, z + rand(-2, 2));
    group.scale.setScalar(0.8);
    scene.add(group);
    const robot = {
      group, type: 'zombie', phase: Math.random() * 10,
      hp: Math.round(60 * diffHp()), maxHp: Math.round(60 * diffHp()), speed: 4.2, damage: 8,
      attackTimer: 0, burstShots: 0, burstTimer: 0,
      hitFlash: 0, dead: false, deathTimer: 0
    };
    group.userData.kind = 'robot';
    group.userData.robot = robot;
    robot.hpBar = addHpBar(group, 2.4);
    enemies.push(robot);
    raycastTargets.push(group);
  }

  /* 敌人头顶血条 */
  function addHpBar(group, y) {
    const bg = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.1), new THREE.MeshBasicMaterial({ color: 0x111111, transparent: true, opacity: 0.7 }));
    bg.position.y = y;
    const fill = new THREE.Mesh(new THREE.PlaneGeometry(0.84, 0.06), new THREE.MeshBasicMaterial({ color: 0x44ff66, transparent: true, opacity: 0.95 }));
    fill.position.set(0, y, 0.01);
    group.add(bg); group.add(fill);
    return fill;
  }

  function spawnPig() {
    const ang = Math.random() * Math.PI * 2;
    const dist = 10 + Math.random() * 25;
    const group = Builders.buildPig();
    group.position.set(Math.cos(ang) * dist, 0, Math.sin(ang) * dist);
    group.rotation.y = Math.random() * Math.PI * 2;
    scene.add(group);
    const pig = {
      group, hp: 120, hitFlash: 0, dead: false, deathTimer: 0,
      wanderAngle: Math.random() * Math.PI * 2, wanderTimer: 1 + Math.random() * 2,
      fleeTimer: 0
    };
    group.userData.kind = 'pig';
    group.userData.pig = pig;
    pig.hpBar = addHpBar(group, 1.15);
    pigs.push(pig);
    raycastTargets.push(group);
  }

  function spawnTarget(x, z) {
    const group = Builders.buildTarget();
    group.position.set(x, 0, z);
    scene.add(group);
    const target = { group, x, z, flash: 0 };
    group.userData.kind = 'target';
    group.userData.target = target;
    targets.push(target);
    raycastTargets.push(group);
  }

  function removeRobot(robot) {
    const i = enemies.indexOf(robot); if (i >= 0) enemies.splice(i, 1);
    const j = raycastTargets.indexOf(robot.group); if (j >= 0) raycastTargets.splice(j, 1);
    scene.remove(robot.group);
    robot.group.traverse((o) => { if (o.geometry) o.geometry.dispose(); });
  }
  function removePig(pig) {
    const i = pigs.indexOf(pig); if (i >= 0) pigs.splice(i, 1);
    const j = raycastTargets.indexOf(pig.group); if (j >= 0) raycastTargets.splice(j, 1);
    scene.remove(pig.group);
    pig.group.traverse((o) => { if (o.geometry) o.geometry.dispose(); });
  }

  /* ================= 射击 ================= */
  const raycaster = new THREE.Raycaster();
  raycaster.far = 300;
  const _dir = new THREE.Vector3();
  const _origin = new THREE.Vector3();
  const _forward = new THREE.Vector3();
  const _right = new THREE.Vector3();
  const _move = new THREE.Vector3();

  function findEntityFromObject(obj) {
    let o = obj;
    while (o) {
      if (o.userData && o.userData.kind) return o.userData;
      o = o.parent;
    }
    return null;
  }

  function cameraLocalToWorld(lx, ly, lz, out) {
    const cy = Math.cos(player.yaw), sy = Math.sin(player.yaw);
    const cp = Math.cos(player.pitch), sp = Math.sin(player.pitch);
    out.set(
      player.pos.x + cy * lx + (sy * sp) * ly + (-sy * cp) * lz,
      player.pos.y + cp * ly + sp * lz,
      player.pos.z + (-sy) * lx + (cy * sp) * ly + (-cy * cp) * lz
    );
    return out;
  }

  function aimForward(out) {
    // 子弹沿相机实际朝向飞行（包含后坐力上扬），保证准星与弹道一致
    const p = player.pitch + state.kick;
    const cp = Math.cos(p), sp = Math.sin(p);
    const cy = Math.cos(player.yaw), sy = Math.sin(player.yaw);
    out.set(-sy * cp, sp, -cy * cp);
    return out;
  }

  function shoot() {
    if (cannon.active) { fireCannonball(); return; } // 操作大炮时开炮
    if (state.reloading) return;
    const w = currentWeapon();
    if (state.fireCooldown > 0) return;
    // 近战武器：无弹药、无换弹（内部自设冷却）
    if (w.melee) { meleeAttack(w); return; }
    if (state.weaponAmmo[w.id] <= 0) {
      audio.empty(); startReload(); return;
    }

    state.fireCooldown = 1 / w.fireRate;
    state.weaponAmmo[w.id]--;
    if (state.gameMode === 'training') state.weaponAmmo[w.id] = magSize(w); // 训练场无限弹药
    state.recoil = Math.min(state.recoil + w.recoil, 0.25);
    state.kick = Math.min(state.kick + w.kick, 0.05);
    updateAmmoHUD();

    flashSprite.scale.setScalar(0.9 + Math.random() * 0.5);
    flashSprite.material.rotation = Math.random() * Math.PI * 2;
    muzzleLight.intensity = 5;

    _origin.copy(player.pos);
    aimForward(_dir);

    // 火焰喷射器：扇形持续伤害
    if (w.flamethrower) {
      audio.flame();
      spawnShell();
      flameBurst(_dir);
      return;
    }
    // 投射物类武器
    if (w.projectile === 'rocket') {
      audio.rocketLaunch();
      spawnRocket(w);
      return;
    }
    if (w.projectile === 'arrow') {
      audio.crossbowShot();
      spawnArrow(w);
      return;
    }

    if (state.shopUpgrades.silencer) audio.noise(0.07, 0.22, 1400, 'lowpass'); // 消音
    else audio.shot(w.id);
    spawnShell();

    const spread = w.spread * (state.aiming ? 0.35 : 1) * (state.shopUpgrades.silencer ? 0.85 : 1);
    for (let p = 0; p < w.pellets; p++) {
      const dir = _dir.clone();
      if (spread > 0) {
        dir.x += (Math.random() - 0.5) * spread;
        dir.y += (Math.random() - 0.5) * spread;
        dir.z += (Math.random() - 0.5) * spread;
        dir.normalize();
      }
      raycaster.set(_origin, dir);
      raycaster.far = 300; // 必须重置：投射物的分段检测会改小 far，导致后续射击打不远
      const hits = raycaster.intersectObjects(raycastTargets, true);
      if (hits.length > 0) {
        const hit = hits[0];
        dispatchHit(hit, w);
        spawnTracer(hit.point, w.tracerColor);
      } else {
        const far = _origin.clone().addScaledVector(dir, 150);
        spawnTracer(far, w.tracerColor);
      }
    }
  }

  /* 近战攻击：短距离挥砍 */
  function meleeAttack(w) {
    state.fireCooldown = 1 / w.fireRate;
    state.recoil = Math.min(state.recoil + w.recoil, 0.25);
    state.kick = Math.min(state.kick + w.kick, 0.05);
    _origin.copy(player.pos);
    aimForward(_dir);
    raycaster.set(_origin, _dir);
    raycaster.far = 2.6;
    const hits = raycaster.intersectObjects(raycastTargets, true);
    // 挥砍轨迹特效
    const from = cameraLocalToWorld(0, -0.2, -0.6, new THREE.Vector3());
    const to = cameraLocalToWorld(0.2, -0.05, -2.6, new THREE.Vector3());
    spawnTracerLine(from, to, 0xdfe8ee);
    if (hits.length > 0) {
      const hit = hits[0];
      const ent = findEntityFromObject(hit.object);
      if (ent && ent.kind === 'robot' && !ent.robot.dead) {
        const isHead = hit.object.userData && hit.object.userData.head;
        const dmg = (isHead ? HEADSHOT_MULT : 1) * w.damage * dmgMul();
        ent.robot.hp -= dmg; ent.robot.hitFlash = 0.1;
        recordTrainDmg(dmg);
        applyElemental(ent.robot, dmg);
        spawnDamageNumber(hit.point, Math.round(dmg), isHead);
        spawnParticles(hit.point, 0xff5533, 6, 3, 6);
        showHitmarker(isHead);
        if (isHead) audio.headshot(); else audio.hit();
        state.score += isHead ? 8 : 3;
        if (ent.robot.hp <= 0) killRobot(ent.robot, isHead);
      } else if (ent && ent.kind === 'pig' && !ent.pig.dead) {
        ent.pig.hp -= w.damage * dmgMul();
        ent.pig.hitFlash = 0.12; ent.pig.fleeTimer = 1.5;
        recordTrainDmg(w.damage * dmgMul());
        applyElemental(ent.pig, w.damage * dmgMul());
        spawnDamageNumber(hit.point, Math.round(w.damage * dmgMul()), false);
        spawnParticles(hit.point, 0xf2c14e, 6, 3, 6);
        showHitmarker(false); audio.hit();
        state.score += 3;
        if (ent.pig.hp <= 0) killPig(ent.pig, false);
      } else {
        spawnParticles(hit.point, 0xcccccc, 4, 2, 5);
      }
    }
  }

  /* 火焰喷射：短程扇形灼烧 */
  function flameBurst(dir) {
    const w = currentWeapon();
    const muzzle = cameraLocalToWorld(w.muzzleV.x, w.muzzleV.y, w.muzzleV.z, new THREE.Vector3());
    // 火焰粒子
    for (let i = 0; i < 7; i++) {
      const m = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.1), new THREE.MeshBasicMaterial({ color: 0xff7722 }));
      m.position.copy(muzzle);
      const vel = dir.clone().multiplyScalar(9 + Math.random() * 5);
      vel.x += (Math.random() - 0.5) * 2; vel.y += (Math.random() - 0.5) * 2; vel.z += (Math.random() - 0.5) * 2;
      scene.add(m);
      particles.push({ mesh: m, vel, life: 0.25 + Math.random() * 0.2, gravity: 2 });
    }
    // 锥形范围伤害
    const dmg = w.damage * dmgMul();
    const range = 14, halfAngle = 0.32;
    let hitAny = false;
    for (const e of enemies) {
      if (e.dead) continue;
      const to = new THREE.Vector3().subVectors(e.group.position, muzzle);
      const d = to.length();
      if (d > range) continue;
      const cosA = to.dot(dir) / (d || 1);
      if (cosA > Math.cos(halfAngle)) {
        e.hp -= dmg;
        e.hitFlash = 0.08;
        state.score += 1;
        hitAny = true;
        if (e.hp <= 0) killRobot(e);
      }
    }
    for (const pig of pigs) {
      if (pig.dead) continue;
      const to = new THREE.Vector3().subVectors(pig.group.position, muzzle);
      const d = to.length();
      if (d > range) continue;
      const cosA = to.dot(dir) / (d || 1);
      if (cosA > Math.cos(halfAngle)) {
        pig.hp -= dmg;
        pig.hitFlash = 0.1;
        pig.fleeTimer = 1.2;
        hitAny = true;
        if (pig.hp <= 0) killPig(pig);
      }
    }
    if (hitAny) showHitmarker(false);
  }

  /* 元素子弹附加效果（火焰灼烧/冰冻减速/电击连锁） */
  function applyElemental(target, dmg) {
    const up = state.shopUpgrades;
    if (!up.fire && !up.ice && !up.lightning) return;
    if (up.fire) { target.burnUntil = state.time + 3; target.burnDps = 8; }
    if (up.ice) { target.slowUntil = state.time + 1.5; }
    if (up.lightning) {
      const list = enemies.concat(pigs);
      let best = null, bd = 6;
      for (const o of list) {
        if (o === target || o.dead) continue;
        const d = o.group.position.distanceTo(target.group.position);
        if (d < bd) { bd = d; best = o; }
      }
      if (best) {
        best.hp -= dmg * 0.5;
        best.hitFlash = 0.1;
        spawnParticles(best.group.position.clone().add(new THREE.Vector3(0, 1, 0)), 0x66eeff, 5, 3, 5);
        spawnDamageNumber(best.group.position.clone().add(new THREE.Vector3(0, 1.2, 0)), Math.round(dmg * 0.5), false);
        if (best.hp <= 0) { if (enemies.includes(best)) killRobot(best); else killPig(best); }
      }
    }
  }

  function dispatchHit(hit, w) {
    const ent = findEntityFromObject(hit.object);
    if (ent && ent.kind === 'robot') {
      const r = ent.robot;
      if (!r.dead) {
        const isHead = hit.object.userData && hit.object.userData.head;
        const dmg = (isHead ? HEADSHOT_MULT : 1) * w.damage * dmgMul();
        r.hp -= dmg;
        r.hitFlash = 0.1;
        recordTrainDmg(dmg);
        applyElemental(r, dmg);
        spawnDamageNumber(hit.point, Math.round(dmg), isHead);
        spawnParticles(hit.point, 0xffaa33, isHead ? 10 : 5, 3, 6);
        showHitmarker(isHead);
        if (isHead) audio.headshot(); else audio.hit();
        state.score += isHead ? 8 : 3;
        if (r.hp <= 0) killRobot(r, isHead);
      }
    } else if (ent && ent.kind === 'pig') {
      const pig = ent.pig;
      if (!pig.dead) {
        const isHead = hit.object.userData && hit.object.userData.head;
        pig.hp -= (isHead ? HEADSHOT_MULT : 1) * w.damage * dmgMul();
        pig.hitFlash = 0.12;
        recordTrainDmg((isHead ? HEADSHOT_MULT : 1) * w.damage * dmgMul());
        applyElemental(pig, w.damage * dmgMul());
        spawnDamageNumber(hit.point, Math.round((isHead ? HEADSHOT_MULT : 1) * w.damage * dmgMul()), isHead);
        pig.fleeTimer = 1.5;
        spawnParticles(hit.point, 0xf5a8c0, 6, 3, 6);
        showHitmarker(isHead);
        if (isHead) audio.headshot(); else audio.pigHit();
        state.score += isHead ? 8 : 3;
        if (pig.hp <= 0) killPig(pig, isHead);
      }
    } else if (ent && ent.kind === 'target') {
      const t = ent.target;
      t.flash = 0.12;
      const local = t.group.userData.board.worldToLocal(hit.point.clone());
      const d = Math.hypot(local.x, local.y);
      let pts = 0;
      if (d <= 0.1) pts = 10; else if (d <= 0.22) pts = 9;
      else if (d <= 0.4) pts = 7; else if (d <= 0.56) pts = 5;
      else if (d <= 0.7) pts = 3; else if (d <= 0.8) pts = 1;
      if (pts > 0) {
        state.score += pts;
        spawnFloater('+' + pts, hit.point, pts >= 9 ? '#ffd24d' : '#ffffff');
        showHitmarker(pts >= 9);
        if (pts >= 9) audio.bullseye(); else audio.targetHit();
      }
      spawnParticles(hit.point, 0xcccccc, 3, 2, 5);
    } else {
      spawnParticles(hit.point, 0xd8c060, 5, 2, 5);
    }
  }

  function killRobot(r, isHead) {
    r.dead = true;
    r.deathTimer = r.type === 'boss' ? 1.2 : 0.9;
    if (r.type === 'boss') state.ach.bossKills = (state.ach.bossKills || 0) + 1;
    state.kills++;
    recordKill(isHead, r.type === 'boss');
    const gain = r.type === 'boss' ? 800 : (100 + state.wave * 20);
    state.score += gain;
    addXp(r.type === 'boss' ? 120 : 15);
    spawnFloater('+' + gain, r.group.position.clone().add(new THREE.Vector3(0, 2.2, 0)), '#ffd24d');
    spawnParticles(r.group.position.clone().add(new THREE.Vector3(0, 1.2, 0)), 0xffaa33, 16, 4, 9);
    dropPickup(r.group.position.clone()); // 掉落补给
    audio.kill();
    const i = raycastTargets.indexOf(r.group); if (i >= 0) raycastTargets.splice(i, 1);
  }
  function killPig(pig, isHead) {
    pig.dead = true; pig.deathTimer = 0.8;
    state.kills++;
    recordKill(isHead, false);
    state.score += 100;
    addXp(10);
    spawnParticles(pig.group.position.clone().add(new THREE.Vector3(0, 0.6, 0)), 0xf5a8c0, 12, 3, 7);
    dropPickupPig(pig.group.position.clone()); // 掉落补给
    audio.pigDie();
    spawnFloater('+100', pig.group.position.clone().add(new THREE.Vector3(0, 1.2, 0)), '#4dff88');
    const i = raycastTargets.indexOf(pig.group); if (i >= 0) raycastTargets.splice(i, 1);
  }

  /* ================= 投射物：火箭弹 / 弩箭 / 手雷 ================= */
  function spawnRocket(w) {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.5, 8),
      new THREE.MeshStandardMaterial({ color: 0x3a5a3a, metalness: 0.6, roughness: 0.4 }));
    const from = cameraLocalToWorld(w.muzzleV.x, w.muzzleV.y, w.muzzleV.z, new THREE.Vector3());
    m.position.copy(from);
    const dir = aimForward(new THREE.Vector3());
    m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), dir);
    scene.add(m);
    rockets.push({ mesh: m, vel: dir.multiplyScalar(45), life: 2.5, prev: from.clone(), type: 'rocket' });
    spawnShell();
  }

  function spawnArrow(w) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 0.6),
      new THREE.MeshStandardMaterial({ color: 0x6a4a2a, roughness: 0.8 }));
    const from = cameraLocalToWorld(w.muzzleV.x, w.muzzleV.y, w.muzzleV.z, new THREE.Vector3());
    m.position.copy(from);
    const dir = aimForward(new THREE.Vector3());
    m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), dir);
    scene.add(m);
    rockets.push({
      mesh: m, vel: dir.multiplyScalar(50), life: 3, prev: from.clone(), type: 'arrow',
      dmg: w.damage * dmgMul()
    });
    spawnShell();
  }

  function throwGrenade(type) {
    type = type || 'grenade';
    const counts = { grenade: 'grenades', molotov: 'molotovs', frost: 'frosts' };
    if (state[counts[type]] <= 0) { audio.empty(); return; }
    state[counts[type]]--;
    updateGrenadeHUD();
    qProgressThrow();
    const colors = { grenade: 0x3a4a3a, molotov: 0xd96a1a, frost: 0x3adfe0 };
    const m = new THREE.Mesh(new THREE.SphereGeometry(0.09, 10, 8),
      new THREE.MeshStandardMaterial({ color: colors[type], metalness: 0.4, roughness: 0.5 }));
    const from = cameraLocalToWorld(0.25, -0.15, -0.4, new THREE.Vector3());
    m.position.copy(from);
    const dir = aimForward(new THREE.Vector3());
    scene.add(m);
    grenades.push({
      mesh: m, type,
      vel: dir.clone().multiplyScalar(17).add(new THREE.Vector3(0, 6, 0)), // 投掷更远
      fuse: 2.5, prev: from.clone()
    });
    audio.throwGrenade();
  }

  /* 通用爆炸：伤害实体 + 破坏地形（范围内障碍物全部炸毁） */
  function explodeAt(point, radius, damage) {
    damage = damage * dmgMul();
    audio.explosion();
    spawnParticles(point, 0xff7722, 26, 9, 6);
    spawnParticles(point, 0x333333, 12, 5, 5);
    const light = new THREE.PointLight(0xffaa44, 14, 22, 2);
    light.position.copy(point);
    scene.add(light);
    explosionLights.push({ light, life: 0.22 });
    const d = player.pos.distanceTo(point);
    if (d < 24) state.shake = Math.min(0.45, 5 / Math.max(1, d)) * settings.shake;
    for (const e of enemies) {
      if (e.dead) continue;
      const dd = e.group.position.distanceTo(point);
      if (dd < radius) {
        e.hp -= damage * (1 - dd / radius);
        e.hitFlash = 0.12;
        state.score += 3;
        if (e.hp <= 0) killRobot(e);
      }
    }
    for (const p of pigs) {
      if (p.dead) continue;
      const dd = p.group.position.distanceTo(point);
      if (dd < radius) {
        p.hp -= damage * (1 - dd / radius);
        p.hitFlash = 0.12;
        p.fleeTimer = 1.5;
        if (p.hp <= 0) killPig(p);
      }
    }
    // 爆炸波及靶子（打靶模式计分）
    for (const t of targets) {
      const dd = t.group.position.distanceTo(point);
      if (dd < radius + 1.5) {
        t.flash = 0.15;
        state.score += 5;
        spawnFloater('+5', t.group.position.clone().add(new THREE.Vector3(0, 1.5, 0)), '#ffd24d');
      }
    }
    // 破坏地形：范围内障碍物全部炸毁
    for (const o of obstacles.slice()) {
      const oc = new THREE.Vector3(o.x, (o.base + o.top) / 2, o.z);
      if (oc.distanceTo(point) < radius + Math.max(o.w, o.d) / 2) {
        destroyObstacle(o);
      }
    }
  }

  function explodeRocket(point) { explodeAt(point, EXPLOSION_RADIUS, EXPLOSION_DAMAGE); }

  function updateRockets(dt) {
    for (let i = rockets.length - 1; i >= 0; i--) {
      const r = rockets[i];
      r.life -= dt;
      r.prev.copy(r.mesh.position);
      if (r.type === 'arrow') r.vel.y -= 12 * dt; // 弩箭下坠
      r.mesh.position.addScaledVector(r.vel, dt);
      if (r.type === 'arrow') r.mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), r.vel.clone().normalize());
      if (r.type === 'rocket' && Math.random() < 0.85) spawnParticles(r.mesh.position, 0xff8833, 1, 0.6, 0);

      let hit = null;
      const seg = new THREE.Vector3().subVectors(r.mesh.position, r.prev);
      const segLen = seg.length();
      if (segLen > 1e-6) {
        raycaster.set(r.prev, seg.normalize());
        raycaster.far = segLen;
        const hits = raycaster.intersectObjects(raycastTargets, true);
        if (hits.length > 0) hit = hits[0];
      }
      let hitPoint = hit ? hit.point : null;
      if (!hitPoint) {
        for (const e of enemies) {
          if (!e.dead && e.group.position.distanceTo(r.mesh.position) < 0.6) { hitPoint = r.mesh.position.clone(); break; }
        }
        if (!hitPoint) {
          for (const p of pigs) {
            if (!p.dead && p.group.position.distanceTo(r.mesh.position) < 0.6) { hitPoint = r.mesh.position.clone(); break; }
          }
        }
      }
      if (hitPoint || r.life <= 0) {
        const point = hitPoint || r.mesh.position;
        if (r.type === 'rocket') {
          explodeRocket(point);
        } else if (r.type === 'cannon') {
          explodeAt(point, r.radius, r.damage);
        } else if (r.type === 'arrow') {
          const ent = hit ? findEntityFromObject(hit.object) : null;
          spawnParticles(point, 0x8a6a3f, 5, 3, 5);
          if (ent && ent.kind === 'robot' && !ent.robot.dead) {
            const isHead = hit.object.userData && hit.object.userData.head;
            ent.robot.hp -= r.dmg * (isHead ? HEADSHOT_MULT : 1);
            ent.robot.hitFlash = 0.1;
            applyElemental(ent.robot, r.dmg);
            spawnDamageNumber(point, Math.round(r.dmg * (isHead ? HEADSHOT_MULT : 1)), isHead);
            showHitmarker(isHead);
            if (isHead) audio.headshot(); else audio.hit();
            state.score += 5;
            if (ent.robot.hp <= 0) killRobot(ent.robot, isHead);
          } else if (ent && ent.kind === 'pig' && !ent.pig.dead) {
            ent.pig.hp -= r.dmg;
            ent.pig.hitFlash = 0.12;
            ent.pig.fleeTimer = 1.5;
            applyElemental(ent.pig, r.dmg);
            spawnDamageNumber(point, Math.round(r.dmg), false);
            audio.pigHit();
            state.score += 5;
            if (ent.pig.hp <= 0) killPig(ent.pig, false);
          } else if (ent && ent.kind === 'target') {
            // 弩箭命中靶子按环数计分
            const t = ent.target;
            t.flash = 0.12;
            const local = t.group.userData.board.worldToLocal(point.clone());
            const d = Math.hypot(local.x, local.y);
            let pts = 0;
            if (d <= 0.1) pts = 10; else if (d <= 0.22) pts = 9;
            else if (d <= 0.4) pts = 7; else if (d <= 0.56) pts = 5;
            else if (d <= 0.7) pts = 3; else if (d <= 0.8) pts = 1;
            if (pts > 0) {
              state.score += pts;
              spawnFloater('+' + pts, point, pts >= 9 ? '#ffd24d' : '#ffffff');
              showHitmarker(pts >= 9);
              if (pts >= 9) audio.bullseye(); else audio.targetHit();
            }
          }
        }
        scene.remove(r.mesh);
        r.mesh.geometry.dispose();
        r.mesh.material.dispose();
        rockets.splice(i, 1);
      }
    }
  }

  function updateGrenades(dt) {
    for (let i = grenades.length - 1; i >= 0; i--) {
      const g = grenades[i];
      g.fuse -= dt;
      g.prev.copy(g.mesh.position);
      g.vel.y -= 30 * dt;
      g.mesh.position.addScaledVector(g.vel, dt);
      let hitPoint = null;
      const seg = new THREE.Vector3().subVectors(g.mesh.position, g.prev);
      const segLen = seg.length();
      if (segLen > 1e-6) {
        raycaster.set(g.prev, seg.normalize());
        raycaster.far = segLen;
        const hits = raycaster.intersectObjects(raycastTargets, true);
        if (hits.length > 0) hitPoint = hits[0].point;
      }
      if (hitPoint || g.fuse <= 0) {
        const point = hitPoint || g.mesh.position;
        if (g.type === 'grenade') explodeAt(point, GRENADE_RADIUS, GRENADE_DAMAGE);
        else if (g.type === 'molotov') spawnFireZone(point);
        else spawnFrostZone(point);
        scene.remove(g.mesh);
        g.mesh.geometry.dispose();
        g.mesh.material.dispose();
        grenades.splice(i, 1);
      }
    }
  }

  /* 燃烧瓶：持续灼烧区域 */
  function spawnFireZone(point) {
    const light = new THREE.PointLight(0xff6600, 8, 12, 2);
    light.position.set(point.x, 0.5, point.z);
    scene.add(light);
    fireZones.push({ pos: point.clone(), life: 4, tick: 0, light });
    audio.flame();
  }
  function updateFireZones(dt) {
    for (let i = fireZones.length - 1; i >= 0; i--) {
      const f = fireZones[i];
      f.life -= dt;
      f.light.intensity = Math.max(0, f.life / 4 * 8);
      if (Math.random() < 0.7) {
        const m = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 0.12), new THREE.MeshBasicMaterial({ color: 0xff7722 }));
        m.position.set(f.pos.x + rand(-1, 1), 0.4, f.pos.z + rand(-1, 1));
        scene.add(m);
        particles.push({ mesh: m, vel: new THREE.Vector3(0, 2, 0), life: 0.4, gravity: -2 });
      }
      f.tick -= dt;
      if (f.tick <= 0) {
        f.tick = 0.25;
        for (const e of enemies) {
          if (!e.dead && e.group.position.distanceTo(f.pos) < 4.5) {
            e.hp -= 8; e.hitFlash = 0.1; state.score += 1;
            if (e.hp <= 0) killRobot(e);
          }
        }
        for (const p of pigs) {
          if (!p.dead && p.group.position.distanceTo(f.pos) < 4.5) {
            p.hp -= 8; p.hitFlash = 0.1; p.fleeTimer = 1;
            if (p.hp <= 0) killPig(p);
          }
        }
      }
      if (f.life <= 0) { scene.remove(f.light); fireZones.splice(i, 1); }
    }
  }

  /* 冰冻弹：范围减速 */
  function spawnFrostZone(point) {
    spawnParticles(point, 0x3adfe0, 18, 6, 3);
    const light = new THREE.PointLight(0x3adfe0, 6, 10, 2);
    light.position.set(point.x, 0.4, point.z);
    scene.add(light);
    frostZones.push({ light, life: 0.4 });
    for (const e of enemies) {
      if (!e.dead && e.group.position.distanceTo(point) < 5.5) e.slowUntil = state.time + 3;
    }
    for (const p of pigs) {
      if (!p.dead && p.group.position.distanceTo(point) < 5.5) p.slowUntil = state.time + 3;
    }
    audio.tone(600, 0.25, 0.2, 200);
  }

  /* ================= 机器人射击（敌方） ================= */
  function robotMuzzleWorld(robot, out) {
    const yaw = robot.group.rotation.y;
    const cos = Math.cos(yaw), sin = Math.sin(yaw);
    const m = robot.group.userData.gunMuzzle;
    out.set(
      robot.group.position.x + cos * m.lx + sin * m.lz,
      robot.group.position.y + m.ly,
      robot.group.position.z - sin * m.lx + cos * m.lz
    );
    return out;
  }

  function robotShoot(robot, dist, hitChanceBase, angleOffset) {
    const muzzle = robotMuzzleWorld(robot, new THREE.Vector3());
    const toPlayer = new THREE.Vector3().subVectors(player.pos, muzzle);
    const len = toPlayer.length();
    const dir = toPlayer.clone().normalize();
    if (angleOffset) {
      const cos = Math.cos(angleOffset), sin = Math.sin(angleOffset);
      const nx = dir.x * cos + dir.z * sin;
      const nz = -dir.x * sin + dir.z * cos;
      dir.set(nx, dir.y, nz);
    }

    const spread = 0.03 + dist * 0.003;
    const target = player.pos.clone();
    target.x += (Math.random() - 0.5) * spread * dist;
    target.y += (Math.random() - 0.5) * spread * dist;
    target.z += (Math.random() - 0.5) * spread * dist;

    raycaster.set(muzzle, dir);
    raycaster.far = len; // 视线检测距离
    const obsHits = raycaster.intersectObjects(obstacleMeshes, false);
    let endPoint = target, blocked = false;
    if (obsHits.length > 0 && obsHits[0].distance < len) {
      endPoint = obsHits[0].point;
      blocked = true;
    }

    spawnTracerLine(muzzle, endPoint, robot.type === 'drone' ? 0x66eeff : 0xff7744);
    spawnParticles(muzzle, 0xffaa33, 3, 2, 4);
    if (robot.type === 'drone') audio.droneShot(); else audio.robotShot();

    if (blocked) {
      spawnParticles(endPoint, 0xd8c060, 3, 2, 4);
    } else if (Math.random() < Math.max(0.3, (hitChanceBase || 0.8) - dist * 0.02)) {
      playerTakeDamage(robot.damage * diffDmg()); // 难度影响伤害
      spawnParticles(player.pos.clone(), 0xff3344, 4, 2, 4);
    }
  }

  /* ================= 粒子 / 弹道 / 弹壳 / 飘字 ================= */
  function spawnParticles(pos, color, count, speed, gravity) {
    for (let i = 0; i < count; i++) {
      const m = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 0.06), new THREE.MeshBasicMaterial({ color }));
      m.position.copy(pos);
      const vel = new THREE.Vector3((Math.random() - 0.5) * speed, Math.random() * speed * 0.8 + 1, (Math.random() - 0.5) * speed);
      scene.add(m);
      particles.push({ mesh: m, vel, life: 0.4 + Math.random() * 0.35, gravity });
    }
  }

  function spawnTracerLine(from, to, color) {
    const geo = new THREE.BufferGeometry().setFromPoints([from, to]);
    const mat = new THREE.LineBasicMaterial({ color: color || 0xfff2b0, transparent: true, opacity: 0.9 });
    const line = new THREE.Line(geo, mat);
    scene.add(line);
    tracers.push({ line, life: 0.1 });
  }
  function spawnTracer(toWorld, color) {
    const w = currentWeapon();
    const from = cameraLocalToWorld(w.muzzleV.x, w.muzzleV.y, w.muzzleV.z, new THREE.Vector3());
    spawnTracerLine(from, toWorld, color);
  }

  function spawnShell() {
    const m = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.05, 0.012), new THREE.MeshBasicMaterial({ color: 0xd9a441 }));
    m.position.copy(cameraLocalToWorld(0.3, -0.24, -0.1, new THREE.Vector3()));
    const sy = Math.sin(player.yaw), cy = Math.cos(player.yaw);
    const vel = new THREE.Vector3();
    vel.set(cy, 0, -sy).multiplyScalar(1.8);
    vel.y = 2.8 + Math.random() * 0.8;
    vel.x += sy * 0.7; vel.z += cy * 0.7;
    scene.add(m);
    shells.push({ mesh: m, vel, spin: new THREE.Vector3(Math.random() * 10, Math.random() * 10, Math.random() * 10), life: 2.0 });
  }

  function spawnFloater(text, pos, color) {
    const c = document.createElement('canvas'); c.width = 256; c.height = 96;
    const g = c.getContext('2d');
    g.font = 'bold 34px Arial'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.lineWidth = 6; g.strokeStyle = 'rgba(0,0,0,0.75)'; g.strokeText(text, 128, 48);
    g.fillStyle = color || '#fff'; g.fillText(text, 128, 48);
    const mat = new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthTest: false });
    const s = new THREE.Sprite(mat); s.scale.set(1.9, 0.71, 1);
    s.position.copy(pos); s.position.y += 0.3;
    scene.add(s);
    floaters.push({ sprite: s, life: 0.9, maxLife: 0.9 });
  }

  /* 伤害数字（更小、上飘更快） */
  function spawnDamageNumber(pos, text, crit) {
    const c = document.createElement('canvas'); c.width = 128; c.height = 64;
    const g = c.getContext('2d');
    g.font = 'bold 30px Arial'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.lineWidth = 4; g.strokeStyle = 'rgba(0,0,0,0.8)'; g.strokeText(text, 64, 32);
    g.fillStyle = crit ? '#ffd24d' : '#ffffff'; g.fillText(text, 64, 32);
    const mat = new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthTest: false });
    const s = new THREE.Sprite(mat); s.scale.set(0.85, 0.42, 1);
    s.position.copy(pos); s.position.y += 0.5;
    scene.add(s);
    floaters.push({ sprite: s, life: 0.7, maxLife: 0.7 });
  }

  /* ================= 敌人掉落补给 ================= */
  function spawnPickup(pos, type) {
    const colors = { health: 0x2fd65a, ammo: 0xffd24d, coin: 0xf2c14e, airdrop: 0x9b59ff };
    const m = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.32, 0.32),
      new THREE.MeshStandardMaterial({ color: colors[type], emissive: colors[type], emissiveIntensity: 0.5, roughness: 0.4 }));
    m.position.set(pos.x, 0.4, pos.z);
    scene.add(m);
    // 彩色光柱
    const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 3.2, 8),
      new THREE.MeshBasicMaterial({ color: colors[type], transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false }));
    beam.position.set(pos.x, 2.0, pos.z);
    scene.add(beam);
    pickups.push({ mesh: m, beam, type, phase: Math.random() * 10 });
  }

  function dropPickup(pos) {
    const r = Math.random();
    if (r < 0.55) spawnPickup(pos, 'health');
    else if (r < 0.8) spawnPickup(pos, 'ammo');
    else spawnPickup(pos, 'coin');
  }
  function dropPickupPig(pos) {
    const r = Math.random();
    if (r < 0.5) spawnPickup(pos, 'health');
    else if (r < 0.7) spawnPickup(pos, 'ammo');
    else spawnPickup(pos, 'coin');
  }

  function collectPickup(pk) {
    if (pk.type === 'health') {
      player.health = Math.min(player.maxHealth, player.health + 30);
      spawnFloater('+30 HP', pk.mesh.position, '#4dff88');
      audio.tone(600, 0.1, 0.25, 900);
    } else if (pk.type === 'ammo') {
      const w = currentWeapon();
      if (!w.melee) state.weaponAmmo[w.id] = w.mag;
      updateAmmoHUD();
      spawnFloater('弹药补充', pk.mesh.position, '#ffd24d');
      audio.tone(500, 0.1, 0.25, 800);
    } else if (pk.type === 'airdrop') {
      state.coins += 50;
      saveShop();
      for (const w of WEAPONS) if (!w.melee) state.weaponAmmo[w.id] = magSize(w);
      player.health = Math.min(player.maxHealth, player.health + 40);
      updateAmmoHUD();
      spawnFloater('🎁 空投大礼包 +50 金币', pk.mesh.position, '#9b59ff');
      audio.tone(700, 0.2, 0.3, 1000);
    } else {
      state.coins += 5;
      saveShop();
      spawnFloater('+5 金币', pk.mesh.position, '#f2c14e');
      audio.buy();
    }
  }

  function updatePickups(dt) {
    for (let i = pickups.length - 1; i >= 0; i--) {
      const pk = pickups[i];
      pk.mesh.position.y = 0.4 + Math.sin(state.time * 3 + pk.phase) * 0.1;
      pk.mesh.rotation.y += dt * 2;
      const d = pk.mesh.position.distanceTo(player.pos);
      // 磁吸：3 米内自动飞向玩家
      if (d < 3) {
        const dir = new THREE.Vector3().subVectors(player.pos, pk.mesh.position).normalize();
        pk.mesh.position.addScaledVector(dir, 7 * dt);
        pk.beam.position.copy(pk.mesh.position); pk.beam.position.y = 2.0;
      }
      if (d < 1.6) {
        collectPickup(pk);
        scene.remove(pk.mesh);
        scene.remove(pk.beam);
        pk.mesh.geometry.dispose();
        pk.mesh.material.dispose();
        pk.beam.geometry.dispose();
        pk.beam.material.dispose();
        pickups.splice(i, 1);
      }
    }
  }

  /* ================= HUD ================= */
  function showHitmarker(head) {
    hitmarker.classList.remove('show');
    void hitmarker.offsetWidth;
    hitmarker.textContent = head ? '✕✕' : '✕';
    hitmarker.classList.add('show');
    setTimeout(() => hitmarker.classList.remove('show'), settings.hitmarker * 1000);
  }

  function buildSlots() {
    slotsEl.innerHTML = '';
    WEAPONS.forEach((w, i) => {
      const d = document.createElement('div');
      d.className = 'slot' + (i === state.weaponIndex ? ' active' : '');
      d.innerHTML = '<b>' + (w.slotLabel || (i + 1)) + '</b>' + w.name;
      slotsEl.appendChild(d);
    });
  }

  function buildWeaponList() {
    const el = document.getElementById('weaponlist-rows');
    if (!el) return;
    el.innerHTML = '';
    WEAPONS.forEach((w) => {
      const d = document.createElement('div');
      d.className = 'wl-row';
      if (w.melee) {
        d.innerHTML = '<b>' + w.slotLabel + '</b>' + w.name + '<br>近战 · 伤害 ' + w.damage + ' · 攻速 ' + w.fireRate + '/s';
        el.appendChild(d);
        return;
      }
      const dmg = w.pellets > 1 ? (w.damage + '×' + w.pellets) : w.damage;
      const fire = w.auto ? '全自动' : '半自动';
      let trait = '';
      if (w.projectile === 'rocket') trait = '爆炸';
      else if (w.projectile === 'arrow') trait = '下坠';
      else if (w.flamethrower) trait = '范围火焰';
      else if (w.laser) trait = '激光';
      d.innerHTML = '<b>' + w.slotLabel + '</b>' + w.name + '<br>伤害 ' + dmg + ' · 射速 ' + w.fireRate + ' · 弹匣 ' + w.mag + ' · ' + fire + (trait ? ' · ' + trait : '');
      el.appendChild(d);
    });
  }

  const ENEMY_INFO = [
    { icon: '🤖', name: '步枪兵', wave: '第 1 波', desc: '基础敌人，保持距离绕圈，三连发点射。' },
    { icon: '🚁', name: '无人机', wave: '第 2 波', desc: '悬停飞行、机动灵活，单发射击。血量低，优先点杀。' },
    { icon: '💣', name: '自爆兵', wave: '第 3 波', desc: '胸口红光闪烁，高速冲向玩家，接近即自爆。' },
    { icon: '🎯', name: '狙击手', wave: '第 4 波', desc: '保持远距离单发高伤害。利用掩体对狙。' },
    { icon: '🛡️', name: '持盾兵', wave: '第 5 波', desc: '身披重盾、血厚，近战挥击。绕圈风筝。' },
    { icon: '👻', name: '隐身刺客', wave: '第 6 波', desc: '半透明高速近战，接近后高伤挥砍。' },
    { icon: '📡', name: '召唤者', wave: '第 7 波', desc: '远距离游走，周期性召唤小丧尸。优先击杀。' },
    { icon: '👹', name: 'BOSS', wave: '第 8 波（每 8 波一次）', desc: '大型重甲、血厚攻高，但行动缓慢。爆头事半功倍。' },
    { icon: '🧟', name: '丧尸（生存模式）', wave: '无限刷', desc: '成群近战冲锋，越往后越多。' }
  ];

  const THROWABLE_INFO = [
    { icon: '💣', name: '手雷 G', desc: '抛物线投掷，落地爆炸：范围伤害 + 破坏地形。' },
    { icon: '🔥', name: '燃烧瓶 H', desc: '落地形成 4 秒火焰区，范围内敌人持续灼烧。' },
    { icon: '❄️', name: '冰冻弹 J', desc: '落地范围减速 3 秒，敌人速度降至 30%。' }
  ];

  const UPGRADE_INFO = [
    { icon: '⬆️', name: '攻击/生命/手雷/移速/换弹', desc: '基础属性永久强化，价格随等级递增。' },
    { icon: '🔥', name: '火焰子弹', desc: '命中附加持续灼烧伤害。' },
    { icon: '❄️', name: '冰冻子弹', desc: '命中减速敌人。' },
    { icon: '⚡', name: '电击子弹', desc: '命中连锁电击附近敌人。' },
    { icon: '🛡️', name: '能量护盾', desc: '获得 100 点自动回复的护盾值，优先吸收伤害。' },
    { icon: '🌀', name: '保护罩', desc: '按 B 激活，5 秒免疫一切伤害，冷却 40 秒。' },
    { icon: '🔇', name: '消音器', desc: '枪声变小，命中更准（后坐力散布降低）。' },
    { icon: '📦', name: '扩容弹匣', desc: '所有武器弹匣容量 +50%。' },
    { icon: '🔭', name: '光学瞄具', desc: '开镜视野更近，放大效果更强。' }
  ];

  function buildEnemyList() {
    const el = document.getElementById('enemylist-rows');
    if (!el) return;
    el.innerHTML = '';
    ENEMY_INFO.forEach((e) => {
      const d = document.createElement('div');
      d.className = 'wl-row';
      d.innerHTML = '<b>' + e.icon + '</b>' + e.name + ' · ' + e.wave + '<br>' + e.desc;
      el.appendChild(d);
    });
  }

  function buildThrowableList() {
    const el = document.getElementById('throwable-rows');
    if (!el) return;
    el.innerHTML = '';
    THROWABLE_INFO.forEach((t) => {
      const d = document.createElement('div');
      d.className = 'wl-row';
      d.innerHTML = '<b>' + t.icon + '</b>' + t.name + '<br>' + t.desc;
      el.appendChild(d);
    });
  }

  function buildUpgradeList() {
    const el = document.getElementById('upgrade-rows');
    if (!el) return;
    el.innerHTML = '';
    UPGRADE_INFO.forEach((u) => {
      const d = document.createElement('div');
      d.className = 'wl-row';
      d.innerHTML = '<b>' + u.icon + '</b>' + u.name + '<br>' + u.desc;
      el.appendChild(d);
    });
  }
  function weaponStatsText(w) {
    if (w.melee) return '近战 · 伤害 ' + w.damage + ' · 攻速 ' + w.fireRate + '/s · 熟练 Lv' + wepLevel(w.id);
    const fire = w.auto ? '全自动' : '半自动';
    const dmg = w.pellets > 1 ? (w.damage + '×' + w.pellets) : w.damage;
    let trait = '';
    if (w.projectile === 'rocket') trait = ' · 爆炸';
    else if (w.projectile === 'arrow') trait = ' · 下坠';
    else if (w.flamethrower) trait = ' · 范围火焰';
    else if (w.laser) trait = ' · 激光';
    return '伤害 ' + dmg + ' · 射速 ' + w.fireRate + '/s · 弹匣 ' + magSize(w) + ' · ' + fire + trait + ' · 熟练 Lv' + wepLevel(w.id);
  }

  function updateWeaponHUD() {
    const w = currentWeapon();
    weaponname.textContent = w.name;
    weaponstats.textContent = weaponStatsText(w);
    updateAmmoHUD();
    [...slotsEl.children].forEach((el, i) => el.classList.toggle('active', i === state.weaponIndex));
  }
  function updateAmmoHUD() {
    const w = currentWeapon();
    ammoEl.textContent = w.melee ? '∞' : state.weaponAmmo[w.id];
    ammoEl.classList.toggle('low', !w.melee && state.weaponAmmo[w.id] <= Math.ceil(magSize(w) * 0.25));
  }

  function updateGrenadeHUD() {
    grenadesEl.textContent = '手雷' + state.grenades + ' · 燃烧' + state.molotovs + ' · 冰冻' + state.frosts;
  }

  /* ================= 永久升级商店（独立模式，金币跨局保存） ================= */
  const SHOP_ITEMS = [
    { id: 'dmg', name: '攻击强化', desc: '+10% 武器伤害', base: 200, max: 5 },
    { id: 'hp', name: '生命强化', desc: '+20 生命上限', base: 150, max: 5 },
    { id: 'nade', name: '手雷扩充', desc: '+1 初始手雷', base: 250, max: 3 },
    { id: 'speed', name: '移速强化', desc: '+6% 移动速度', base: 150, max: 5 },
    { id: 'reload', name: '快速换弹', desc: '+12% 换弹速度', base: 200, max: 5 },
    { id: 'fire', name: '火焰子弹', desc: '命中附加持续灼烧', base: 800, max: 1 },
    { id: 'ice', name: '冰冻子弹', desc: '命中减速敌人', base: 800, max: 1 },
    { id: 'lightning', name: '电击子弹', desc: '命中连锁到附近敌人', base: 1000, max: 1 },
    { id: 'shield', name: '能量护盾', desc: '100 点自动回复护盾值', base: 2000, max: 1 },
    { id: 'bubble', name: '保护罩', desc: '按 B 激活 5 秒免疫一切伤害', base: 2500, max: 1 },
    { id: 'silencer', name: '消音器', desc: '枪声变小，命中更准', base: 1200, max: 1 },
    { id: 'mag', name: '扩容弹匣', desc: '所有武器弹匣 +50%', base: 1000, max: 1 },
    { id: 'optic', name: '光学瞄具', desc: '开镜视野更近（放大更强）', base: 1000, max: 1 }
  ];

  function saveShop() {
    try { localStorage.setItem('fps_save', JSON.stringify({ coins: state.coins, up: state.shopUpgrades, skins: state.skins, activeSkin: state.activeSkin, activeCross: state.activeCross })); } catch (e) { /* ignore */ }
  }
  function loadShop() {
    try {
      const s = JSON.parse(localStorage.getItem('fps_save') || '{}');
      if (typeof s.coins === 'number') state.coins = s.coins;
      if (s.up) Object.assign(state.shopUpgrades, s.up);
      if (s.skins) Object.assign(state.skins, s.skins);
      if (s.activeSkin) state.activeSkin = s.activeSkin;
      if (s.activeCross) state.activeCross = s.activeCross;
    } catch (e) { /* ignore */ }
  }

  function clearSave() {
    state.coins = 0;
    state.shopUpgrades = { dmg: 0, hp: 0, nade: 0, speed: 0, reload: 0, fire: 0, ice: 0, lightning: 0, shield: 0, bubble: 0, silencer: 0, mag: 0, optic: 0 };
    state.skins = {}; state.activeSkin = ''; state.activeCross = '';
    try { localStorage.removeItem('fps_save'); } catch (e) { /* ignore */ }
    applySkin();
    updateShopUI();
    updateOverlay();
  }

  /* ================= 皮肤系统（枪械涂装 + 准星样式，金币购买） ================= */
  const SHOP_SKINS = [
    { id: 'skin_gold', name: '黄金涂装', desc: '全武器金色金属质感', cost: 3000, icon: '🥇' },
    { id: 'skin_camo', name: '丛林迷彩', desc: '全武器军绿迷彩', cost: 2500, icon: '🌿' },
    { id: 'skin_crimson', name: '赤红涂装', desc: '全武器红黑配色', cost: 2500, icon: '🔥' },
    { id: 'cross_green', name: '绿色准星', desc: '准星变为绿色', cost: 500, icon: '🎯' },
    { id: 'cross_dot', name: '点状准星', desc: '准星改为小圆点', cost: 800, icon: '⚫' },
    { id: 'cross_ring', name: '环形准星', desc: '准星改为空心圆环', cost: 1200, icon: '⭕' }
  ];
  function buildShopSkins() {
    const el = document.getElementById('shop-skins');
    if (!el) return;
    el.innerHTML = '';
    SHOP_SKINS.forEach((sk) => {
      const owned = !!state.skins[sk.id];
      const isSkin = sk.id.indexOf('skin_') === 0;
      const active = (isSkin ? state.activeSkin : state.activeCross) === sk.id;
      const d = document.createElement('div');
      d.className = 'shop-row';
      const info = document.createElement('div');
      info.className = 's-info';
      info.innerHTML = '<span class="s-name">' + sk.icon + ' ' + sk.name + '</span>' +
        '<span class="s-desc">' + sk.desc + (owned ? ' · 已拥有' : '') + '</span>';
      const btn = document.createElement('button');
      btn.className = 's-buy' + ((!owned && state.coins < sk.cost) ? ' disabled' : '');
      btn.dataset.skin = sk.id;
      btn.textContent = owned ? (active ? '已装备' : '装备') : (sk.cost + ' 金币');
      d.appendChild(info);
      d.appendChild(btn);
      el.appendChild(d);
    });
  }
  function buySkin(id) {
    const sk = SHOP_SKINS.find(s => s.id === id);
    if (!sk) return;
    if (!state.skins[id]) {
      if (state.coins < sk.cost) { audio.empty(); return; }
      state.coins -= sk.cost;
      state.skins[id] = true;
      saveShop();
      toast('🎨 已购买：' + sk.name);
      audio.buy();
    }
    if (sk.id.indexOf('skin_') === 0) state.activeSkin = sk.id;
    else state.activeCross = sk.id;
    saveShop();
    applySkin();
    updateShopUI();
    updateOverlay();
  }
  function applySkin() {
    const skin = state.activeSkin;
    let metal = 0x2b2f33, grip = 0x3a2f24, accent = 0x8a2f2f;
    if (skin === 'skin_gold') { metal = 0xd9a441; grip = 0x8a6a2a; accent = 0xffe08a; }
    else if (skin === 'skin_camo') { metal = 0x5a6b3a; grip = 0x3f4a2c; accent = 0x8a9a4a; }
    else if (skin === 'skin_crimson') { metal = 0x7a2a2a; grip = 0x3a2020; accent = 0xff5555; }
    else if (wepLevel(currentWeapon().id) >= 3) metal = 0xd9a441; // 无皮肤时保留熟练度金色
    GunMats.metal.color.setHex(metal);
    GunMats.grip.color.setHex(grip);
    GunMats.accent.color.setHex(accent);
    // 准星样式
    const cs = state.activeCross;
    const el = crosshair;
    el.classList.remove('style-green', 'style-dot', 'style-ring');
    if (cs === 'cross_green') el.classList.add('style-green');
    else if (cs === 'cross_dot') el.classList.add('style-dot');
    else if (cs === 'cross_ring') el.classList.add('style-ring');
  }

  function openShop() {
    state.mode = 'shop';
    if (document.pointerLockElement) document.exitPointerLock();
    updateOverlay();
  }

  function openWeapons() {
    state.mode = 'weapons';
    if (document.pointerLockElement) document.exitPointerLock();
    buildAchievements();
    buildLeaderboard();
    buildQuests();
    buildWeekly();
    buildStats();
    updateOverlay();
  }
  /* 武器熟练度：每 10 杀升 1 级（最高 5 级，+4% 伤害/级） */
  function wepLevel(id) { return Math.min(5, Math.floor((state.ach.weaponKills[id] || 0) / 10)); }
  function dmgMul() {
    const w = currentWeapon();
    return (1 + 0.1 * state.shopUpgrades.dmg) * (1 + 0.02 * (state.level - 1)) * (1 + 0.04 * wepLevel(w.id));
  }
  /* 扩容弹匣 */
  function magSize(w) { return Math.round(w.mag * (state.shopUpgrades.mag ? 1.5 : 1)); }

  /* 经验 / 等级 */
  function addXp(amount) {
    state.xp += amount;
    while (state.xp >= state.xpToNext) {
      state.xp -= state.xpToNext;
      state.level++;
      state.xpToNext = 100 + (state.level - 1) * 60;
      state.ach.maxLevel = Math.max(state.ach.maxLevel || 0, state.level);
      player.maxHealth += 10;
      player.health = player.maxHealth;
      toast('⬆️ 升级！Lv ' + state.level + ' · 生命上限 +10 · 伤害 +2%');
      audio.tone(700, 0.15, 0.25, 1200);
      checkAchievements();
    }
  }

  function updateShopUI() {
    const visible = state.mode === 'shop';
    shopEl.classList.toggle('hidden', !visible);
    if (!visible) return;
    shopCoins.textContent = state.coins;
    buildShopSkins();
    shopRows.innerHTML = '';
    SHOP_ITEMS.forEach((item) => {
      const lvl = state.shopUpgrades[item.id];
      const maxed = lvl >= item.max;
      const cost = item.base * (lvl + 1);
      const row = document.createElement('div');
      row.className = 'shop-row';
      const info = document.createElement('div');
      info.className = 's-info';
      info.innerHTML = '<span class="s-name">' + item.name + '</span>' +
        '<span class="s-desc">' + item.desc + ' · Lv' + lvl + '/' + item.max + '</span>';
      const btn = document.createElement('button');
      btn.className = 's-buy' + (maxed || state.coins < cost ? ' disabled' : '');
      btn.dataset.up = item.id;
      btn.textContent = maxed ? 'MAX' : (cost + ' 金币');
      row.appendChild(info);
      row.appendChild(btn);
      shopRows.appendChild(row);
    });
  }

  function buyUpgrade(id) {
    const item = SHOP_ITEMS.find(s => s.id === id);
    if (!item || state.shopUpgrades[id] >= item.max) return;
    const cost = item.base * (state.shopUpgrades[id] + 1);
    if (state.coins < cost) { audio.empty(); return; }
    state.coins -= cost;
    state.shopUpgrades[id]++;
    audio.buy();
    saveShop();
    updateShopUI();
  }

  /* ================= 成就系统 + 排行榜 ================= */
  const ACHIEVEMENTS = [
    { id: 'first_kill', name: '首杀', desc: '累计击杀 1', reward: 100 },
    { id: 'kills50', name: '猎手', desc: '累计击杀 50', reward: 500 },
    { id: 'score5000', name: '高分达人', desc: '单局得分 5000', reward: 500 },
    { id: 'wave5', name: '闯关者', desc: '对战到达第 5 波', reward: 300 },
    { id: 'pig_clear', name: '猪场清空', desc: '打猪模式清空猪场', reward: 300 },
    { id: 'survive120', name: '生存专家', desc: '丧尸生存存活 120 秒', reward: 400 },
    { id: 'boss_kill', name: '屠龙者', desc: '击杀 BOSS', reward: 400 },
    { id: 'streak10', name: '无双', desc: '达成 10 连杀', reward: 800 },
    { id: 'level5', name: '老兵', desc: '达到 5 级', reward: 500 },
    { id: 'squad', name: '小队指挥官', desc: '同时拥有 4 名队友', reward: 600 }
  ];

  function loadAch() {
    try {
      const s = JSON.parse(localStorage.getItem('fps_achievements') || '{}');
      state.ach = {
        unlocked: s.unlocked || {}, totalKills: s.totalKills || 0,
        bestScore: s.bestScore || 0, bestWave: s.bestWave || 0,
        pigCleared: s.pigCleared || 0, bestSurvive: s.bestSurvive || 0,
        headshots: s.headshots || 0, weaponKills: s.weaponKills || {},
        totalGames: s.totalGames || 0, totalScore: s.totalScore || 0, playTime: s.playTime || 0,
        bossKills: s.bossKills || 0, maxStreak: s.maxStreak || 0, maxLevel: s.maxLevel || 0, maxAllies: s.maxAllies || 0
      };
      state.highscores = JSON.parse(localStorage.getItem('fps_highscores') || '{}');
    } catch (e) {
      state.highscores = {};
    }
  }
  function saveAch() {
    try {
      localStorage.setItem('fps_achievements', JSON.stringify(state.ach));
      localStorage.setItem('fps_highscores', JSON.stringify(state.highscores));
    } catch (e) { /* ignore */ }
  }

  function toast(text) {
    toastEl.textContent = text;
    toastEl.classList.add('show');
    clearTimeout(toast._t);
    toast._t = setTimeout(() => toastEl.classList.remove('show'), 2600);
  }

  function checkAchievements() {
    const a = state.ach;
    const checks = {
      first_kill: a.totalKills >= 1,
      kills50: a.totalKills >= 50,
      score5000: a.bestScore >= 5000,
      wave5: a.bestWave >= 5,
      pig_clear: a.pigCleared >= 1,
      survive120: a.bestSurvive >= 120,
      boss_kill: (a.bossKills || 0) >= 1,
      streak10: (a.maxStreak || 0) >= 10,
      level5: (a.maxLevel || 0) >= 5,
      squad: (a.maxAllies || 0) >= 4
    };
    let changed = false;
    for (const ac of ACHIEVEMENTS) {
      if (!a.unlocked[ac.id] && checks[ac.id]) {
        a.unlocked[ac.id] = true;
        state.coins += ac.reward || 100; // 成就送金币
        saveShop();
        toast('🏆 成就解锁：' + ac.name + ' +' + (ac.reward || 100) + ' 金币');
        audio.buy();
        changed = true;
      }
    }
    if (changed) saveAch();
  }

  function recordKill(isHead, isBoss) {
    state.ach.totalKills++;
    if (isHead) state.ach.headshots = (state.ach.headshots || 0) + 1;
    const w = currentWeapon();
    state.ach.weaponKills[w.id] = (state.ach.weaponKills[w.id] || 0) + 1;
    qProgressKill(isHead, isBoss);    // 每日任务 + 周挑战
    state.streak++;
    state.streakTimer = 8;
    state.ach.maxStreak = Math.max(state.ach.maxStreak || 0, state.streak);
    if (state.streak >= 2 && state.streak % 3 === 0) {
      const bonus = state.streak * 20;
      const coins = state.streak * 2;
      state.score += bonus;
      state.coins += coins;
      saveShop();
      toast('💥 连杀 x' + state.streak + '！ +' + bonus + ' 分 +' + coins + ' 金币');
      audio.buy();
    }
    checkAchievements();
  }

  function buildAchievements() {
    const el = document.getElementById('achievement-rows');
    if (!el) return;
    el.innerHTML = '';
    ACHIEVEMENTS.forEach((ac) => {
      const d = document.createElement('div');
      const unlocked = state.ach.unlocked[ac.id];
      d.className = 'wl-row' + (unlocked ? ' unlocked' : '');
      d.innerHTML = (unlocked ? '✅ ' : '🔒 ') + '<b>' + ac.name + '</b> ' + ac.desc + ' · 奖励 <span style="color:#ffd24d">+' + (ac.reward || 100) + ' 金币</span>';
      el.appendChild(d);
    });
  }
  function buildLeaderboard() {
    const el = document.getElementById('leaderboard-rows');
    if (!el) return;
    el.innerHTML = '';
    const modes = [['battle', '人机对战'], ['target', '打靶子'], ['pig', '打猪'], ['zombie', '丧尸生存']];
    modes.forEach(([id, name]) => {
      const d = document.createElement('div');
      d.className = 'wl-row';
      d.innerHTML = '🏅 <b>' + name + '</b> 最高分：' + (state.highscores[id] || 0);
      el.appendChild(d);
    });
  }

  /* ================= 每日任务 ================= */
  const QUEST_POOL = [
    { id: 'kills', name: '累计击杀敌人', target: 20 },
    { id: 'kills2', name: '累计击杀敌人', target: 40 },
    { id: 'headshots', name: '累计爆头击杀', target: 8 },
    { id: 'throws', name: '使用投掷物', target: 8 },
    { id: 'score', name: '单局得分', target: 3000 }
  ];
  function todayStr() {
    const d = new Date();
    return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
  }
  function loadQuests() {
    try {
      const s = JSON.parse(localStorage.getItem('fps_quests') || '{}');
      if (s.date === todayStr() && Array.isArray(s.list)) { state.quests = s; return; }
    } catch (e) { /* ignore */ }
    const pool = QUEST_POOL.slice().sort(() => Math.random() - 0.5).slice(0, 3);
    state.quests = {
      date: todayStr(),
      list: pool.map(q => ({ id: q.id, name: q.name, target: q.target, progress: 0, done: false }))
    };
    saveQuests();
  }
  function saveQuests() {
    try { localStorage.setItem('fps_quests', JSON.stringify(state.quests)); } catch (e) { /* ignore */ }
  }
  function qProgressKill(isHead, isBoss) {
    let changed = false;
    if (state.quests) {
      state.quests.list.forEach(q => {
        if (q.done) return;
        if (q.id === 'kills' || q.id === 'kills2') q.progress++;
        if (q.id === 'headshots' && isHead) q.progress++;
        if (q.progress >= q.target) { q.done = true; state.coins += 300; saveShop(); toast('📅 任务完成：' + q.name + ' +300 金币'); audio.buy(); changed = true; }
      });
      if (changed) saveQuests();
    }
    // 周挑战（奖励更高）
    if (state.weekly) {
      let wchanged = false;
      state.weekly.list.forEach(q => {
        if (q.done) return;
        if (q.id === 'wkills') q.progress++;
        if (q.id === 'whead' && isHead) q.progress++;
        if (q.id === 'wboss' && isBoss) q.progress++;
        if (q.progress >= q.target) { q.done = true; state.coins += 1000; saveShop(); toast('📅 周挑战完成：' + q.name + ' +1000 金币！'); audio.buy(); wchanged = true; }
      });
      if (wchanged) saveWeek();
    }
  }
  function qProgressThrow() {
    if (state.quests) {
      state.quests.list.forEach(q => {
        if (q.done || q.id !== 'throws') return;
        q.progress++;
        if (q.progress >= q.target) { q.done = true; state.coins += 300; saveShop(); toast('📅 任务完成：' + q.name + ' +300 金币'); audio.buy(); }
      });
      saveQuests();
    }
    if (state.weekly) {
      let wchanged = false;
      state.weekly.list.forEach(q => {
        if (q.done || q.id !== 'wthrows') return;
        q.progress++;
        if (q.progress >= q.target) { q.done = true; state.coins += 1000; saveShop(); toast('📅 周挑战完成：' + q.name + ' +1000 金币！'); audio.buy(); wchanged = true; }
      });
      if (wchanged) saveWeek();
    }
  }
  function qScoreCheck(score) {
    if (state.quests) {
      let changed = false;
      state.quests.list.forEach(q => {
        if (q.done || q.id !== 'score') return;
        q.progress = Math.max(q.progress, score);
        if (q.progress >= q.target) { q.done = true; state.coins += 300; saveShop(); toast('📅 任务完成：' + q.name + ' +300 金币'); audio.buy(); changed = true; }
      });
      if (changed) saveQuests();
    }
    if (state.weekly) {
      let wchanged = false;
      state.weekly.list.forEach(q => {
        if (q.done || q.id !== 'wscore') return;
        q.progress = Math.max(q.progress, score);
        if (q.progress >= q.target) { q.done = true; state.coins += 1000; saveShop(); toast('📅 周挑战完成：' + q.name + ' +1000 金币！'); audio.buy(); wchanged = true; }
      });
      if (wchanged) saveWeek();
    }
  }
  function buildQuests() {
    const el = document.getElementById('quest-rows');
    if (!el) return;
    el.innerHTML = '';
    if (!state.quests || !state.quests.list) return;
    state.quests.list.forEach(q => {
      const d = document.createElement('div');
      d.className = 'wl-row' + (q.done ? ' unlocked' : '');
      const pct = Math.min(100, Math.round(q.progress / q.target * 100));
      d.innerHTML = (q.done ? '✅ ' : '📋 ') + '<b>' + q.name + '</b> ' + Math.min(q.progress, q.target) + '/' + q.target + '（' + pct + '%）· 奖励 300 金币';
      el.appendChild(d);
    });
  }

  /* ================= 周挑战（7 天一轮，奖励 1000 金币） ================= */
  const WEEK_POOL = [
    { id: 'wkills', name: '累计击杀敌人', target: 60 },
    { id: 'whead', name: '累计爆头击杀', target: 20 },
    { id: 'wscore', name: '单局得分', target: 12000 },
    { id: 'wthrows', name: '累计使用投掷物', target: 15 },
    { id: 'wboss', name: '击败 BOSS', target: 5 }
  ];
  function weekStr() {
    return 'W' + Math.floor(Date.now() / (7 * 864e5)); // 7 天一个周期
  }
  function loadWeek() {
    try {
      const s = JSON.parse(localStorage.getItem('fps_weekly') || '{}');
      if (s.week === weekStr() && Array.isArray(s.list)) { state.weekly = s; return; }
    } catch (e) { /* ignore */ }
    const pool = WEEK_POOL.slice().sort(() => Math.random() - 0.5).slice(0, 3);
    state.weekly = {
      week: weekStr(),
      list: pool.map(q => ({ id: q.id, name: q.name, target: q.target, progress: 0, done: false }))
    };
    saveWeek();
  }
  function saveWeek() {
    try { localStorage.setItem('fps_weekly', JSON.stringify(state.weekly)); } catch (e) { /* ignore */ }
  }
  function buildWeekly() {
    const el = document.getElementById('weekly-rows');
    if (!el) return;
    el.innerHTML = '';
    if (!state.weekly || !state.weekly.list) return;
    state.weekly.list.forEach(q => {
      const d = document.createElement('div');
      d.className = 'wl-row' + (q.done ? ' unlocked' : '');
      const pct = Math.min(100, Math.round(q.progress / q.target * 100));
      d.innerHTML = (q.done ? '✅ ' : '📅 ') + '<b>' + q.name + '</b> ' + Math.min(q.progress, q.target) + '/' + q.target + '（' + pct + '%）· 奖励 1000 金币';
      el.appendChild(d);
    });
  }

  /* ================= 每日签到（连续签到金币递增，断签重置） ================= */
  function loadCheckin() {
    try {
      const s = JSON.parse(localStorage.getItem('fps_checkin') || '{}');
      state.checkin = { last: s.last || '', count: s.count || 0 };
    } catch (e) { state.checkin = { last: '', count: 0 }; }
  }
  function yesterdayStr() {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
  }
  function checkinReward(streak) { return Math.min(streak, 7) * 50; } // 第1天50 → 第7天350 封顶
  function updateCheckinBtn() {
    if (!checkinbtn) return;
    if (state.checkin.last === todayStr()) {
      checkinbtn.textContent = '✅ 今日已签到（连续 ' + state.checkin.count + ' 天）';
      checkinbtn.classList.add('done');
    } else {
      const streak = state.checkin.last === yesterdayStr() ? state.checkin.count + 1 : 1;
      checkinbtn.textContent = '📅 每日签到（第 ' + streak + ' 天 +' + checkinReward(streak) + ' 金币）';
      checkinbtn.classList.remove('done');
    }
  }
  function claimCheckin() {
    if (state.checkin.last === todayStr()) { toast('今天已经签过到啦'); return; }
    const streak = state.checkin.last === yesterdayStr() ? state.checkin.count + 1 : 1;
    state.checkin = { last: todayStr(), count: streak };
    const reward = checkinReward(streak);
    state.coins += reward;
    saveShop();
    try { localStorage.setItem('fps_checkin', JSON.stringify(state.checkin)); } catch (e) { /* ignore */ }
    toast('📅 连续签到 ' + streak + ' 天！+' + reward + ' 金币');
    audio.buy();
    updateCheckinBtn();
    updateOverlay();
  }

  /* ================= 统计 ================= */
  function buildStats() {
    const el = document.getElementById('stats-rows');
    if (!el) return;
    el.innerHTML = '';
    const a = state.ach;
    const rows = [
      '总击杀 <b>' + a.totalKills + '</b>',
      '爆头 <b>' + (a.headshots || 0) + '</b>',
      '总局数 <b>' + (a.totalGames || 0) + '</b>',
      '总得分 <b>' + (a.totalScore || 0) + '</b>',
      '总时长 <b>' + Math.floor((a.playTime || 0) / 60) + ' 分 ' + Math.floor((a.playTime || 0) % 60) + ' 秒</b>'
    ];
    rows.forEach(t => {
      const d = document.createElement('div');
      d.className = 'wl-row';
      d.innerHTML = '📊 ' + t;
      el.appendChild(d);
    });
    const wk = a.weaponKills || {};
    if (Object.keys(wk).length) {
      const d = document.createElement('div');
      d.className = 'wl-row';
      const top = Object.entries(wk).sort((x, y) => y[1] - x[1])[0];
      const w = WEAPONS.find(x => x.id === top[0]);
      d.innerHTML = '🏆 最爱武器：<b>' + (w ? w.name : top[0]) + '</b>（' + top[1] + ' 杀）';
      el.appendChild(d);
    }
  }

  /* ================= 天气系统 ================= */
  let rainPoints = null;
  const weather = { type: 'clear' };
  function pickWeather() {
    const types = ['clear', 'clear', 'rain', 'fog', 'dusk'];
    weather.type = types[Math.floor(Math.random() * types.length)];
    applyWeather();
  }
  function applyWeather() {
    const bg = weather.type === 'clear' ? currentMap.sky
      : weather.type === 'rain' ? 0x7a8a94
        : weather.type === 'fog' ? 0xb8c2c8
          : 0xd97a4a;
    scene.background = new THREE.Color(bg);
    scene.fog = new THREE.Fog(bg, weather.type === 'fog' ? 8 : weather.type === 'rain' ? 25 : 30,
      weather.type === 'fog' ? 45 : weather.type === 'rain' ? 100 : 140);
    hemi.intensity = weather.type === 'clear' ? 0.9 : weather.type === 'dusk' ? 0.7 : 0.55;
    sun.intensity = weather.type === 'clear' ? 1.25 : weather.type === 'dusk' ? 0.8 : 0.7;
    if (weather.type === 'rain') makeRain(); else removeRain();
  }
  function makeRain() {
    removeRain();
    const N = 400;
    const pos = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 80;
      pos[i * 3 + 1] = Math.random() * 40;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 80;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const mat = new THREE.PointsMaterial({ color: 0x9ab8cc, size: 0.14, transparent: true, opacity: 0.7 });
    rainPoints = new THREE.Points(geo, mat);
    scene.add(rainPoints);
  }
  function removeRain() {
    if (rainPoints) { scene.remove(rainPoints); rainPoints.geometry.dispose(); rainPoints.material.dispose(); rainPoints = null; }
  }
  function updateRain(dt) {
    if (!rainPoints) return;
    const pos = rainPoints.geometry.attributes.position.array;
    for (let i = 0; i < pos.length; i += 3) {
      pos[i + 1] -= 22 * dt;
      if (pos[i + 1] < 0) pos[i + 1] += 40;
    }
    rainPoints.geometry.attributes.position.needsUpdate = true;
    rainPoints.position.set(player.pos.x, 0, player.pos.z);
    if (Math.random() < dt * 0.02) audio.tone(60, 0.8, 0.12, 28); // 远处雷声
  }

  /* ================= 敌人方向指示 ================= */
  function updateDirectionIndicators() {
    const w = innerWidth, h = innerHeight;
    if (dirCanvas.width !== w) { dirCanvas.width = w; dirCanvas.height = h; }
    dirCtx.clearRect(0, 0, w, h);
    const list = enemies.concat(pigs);
    let count = 0;
    for (const e of list) {
      if (e.dead || count >= 8) continue;
      const v = e.group.position.clone().project(camera);
      if (v.z > 1) continue;
      const sx = (v.x * 0.5 + 0.5) * w;
      const sy = (-v.y * 0.5 + 0.5) * h;
      const margin = 60;
      if (sx > margin && sx < w - margin && sy > margin && sy < h - margin) continue;
      const cx = w / 2, cy = h / 2;
      const ang = Math.atan2(sy - cy, sx - cx);
      const px = cx + Math.cos(ang) * (Math.min(w, h) / 2 - 30);
      const py = cy + Math.sin(ang) * (Math.min(w, h) / 2 - 30);
      dirCtx.save();
      dirCtx.translate(px, py);
      dirCtx.rotate(ang);
      dirCtx.fillStyle = 'rgba(255,80,80,0.9)';
      dirCtx.beginPath();
      dirCtx.moveTo(16, 0); dirCtx.lineTo(-8, -9); dirCtx.lineTo(-8, 9);
      dirCtx.closePath(); dirCtx.fill();
      dirCtx.restore();
      count++;
    }
  }

  /* ================= 小地图 ================= */
  function updateMinimap() {
    const s = 170, ctx = mmCtx;
    if (minimap.width !== s) minimap.width = minimap.height = s;
    ctx.clearRect(0, 0, s, s);
    ctx.fillStyle = 'rgba(10,14,18,0.65)';
    ctx.fillRect(0, 0, s, s);
    // 比例 1.6：可视约 ±53 米（敌人刷新距离 26~48 米内可见）
    const scale = 1.6, cx = s / 2, cy = s / 2;
    const toX = (wx) => cx + (wx - player.pos.x) * scale;
    const toY = (wz) => cy + (wz - player.pos.z) * scale;
    // 距离环（20m）
    ctx.strokeStyle = 'rgba(255,255,255,0.12)';
    ctx.beginPath(); ctx.arc(cx, cy, 20 * scale, 0, Math.PI * 2); ctx.stroke();
    // 地图边界
    ctx.strokeStyle = 'rgba(255,255,255,0.25)';
    ctx.strokeRect(0, 0, s, s);
    // 大炮 / 防御阵地
    ctx.fillStyle = '#ff8800'; ctx.fillRect(toX(cannon.x) - 2, toY(cannon.z) - 2, 4, 4);
    ctx.fillStyle = '#4488ff'; ctx.fillRect(toX(bunker.x) - 2, toY(bunker.z) - 2, 4, 4);
    // 补给
    ctx.fillStyle = '#ffd24d';
    for (const pk of pickups) {
      const x = toX(pk.mesh.position.x), y = toY(pk.mesh.position.z);
      if (x >= 0 && x <= s && y >= 0 && y <= s) ctx.fillRect(x - 1, y - 1, 2, 2);
    }
    // 队友
    ctx.fillStyle = '#44ff88';
    for (const a of allies) {
      const x = toX(a.group.position.x), y = toY(a.group.position.z);
      if (x >= 0 && x <= s && y >= 0 && y <= s) ctx.fillRect(x - 1.5, y - 1.5, 3, 3);
    }
    // 金猪
    ctx.fillStyle = '#ffb347';
    for (const p of pigs) {
      if (p.dead) continue;
      const x = toX(p.group.position.x), y = toY(p.group.position.z);
      if (x >= 0 && x <= s && y >= 0 && y <= s) ctx.fillRect(x - 1.5, y - 1.5, 3, 3);
    }
    // 敌人（BOSS 大点）
    for (const e of enemies) {
      if (e.dead) continue;
      const x = toX(e.group.position.x), y = toY(e.group.position.z);
      if (x < 0 || x > s || y < 0 || y > s) continue;
      ctx.fillStyle = e.type === 'boss' ? '#ff00ff' : '#ff4444';
      const r = e.type === 'boss' ? 3 : 1.5;
      ctx.fillRect(x - r, y - r, r * 2, r * 2);
    }
    // 玩家（白点 + 朝向线）
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.arc(cx, cy, 3, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx - Math.sin(player.yaw) * 9, cy - Math.cos(player.yaw) * 9);
    ctx.stroke();
  }

  /* ================= 存档导出 / 导入 ================= */
  function readLS(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function writeLS(k, v) { try { if (v === null || v === undefined) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) { /* ignore */ } }
  function exportSave() {
    const data = {
      save: readLS('fps_save'), ach: readLS('fps_achievements'), hs: readLS('fps_highscores'),
      st: readLS('fps_settings'), vol: readLS('fps_volume'), q: readLS('fps_quests'), wk: readLS('fps_weekly'), ci: readLS('fps_checkin')
    };
    savecodeEl.value = btoa(encodeURIComponent(JSON.stringify(data)));
    savecodeEl.select();
    toast('💾 存档代码已生成，请复制保存');
  }
  function importSave() {
    try {
      const data = JSON.parse(decodeURIComponent(atob(savecodeEl.value.trim())));
      writeLS('fps_save', data.save); writeLS('fps_achievements', data.ach); writeLS('fps_highscores', data.hs);
      writeLS('fps_settings', data.st); writeLS('fps_volume', data.vol); writeLS('fps_quests', data.q); writeLS('fps_weekly', data.wk); writeLS('fps_checkin', data.ci);
      loadShop(); loadAch(); loadQuests(); loadWeek(); loadCheckin(); loadSettings();
      updateShopUI(); updateOverlay();
      toast('✅ 存档已导入');
    } catch (e) { toast('❌ 导入失败：存档代码无效'); }
  }

  function updateHUD() {
    const pct = Math.max(0, player.health / player.maxHealth * 100);
    healthFill.style.width = pct + '%';
    healthNum.textContent = Math.ceil(player.health);
    if (pct > 60) healthFill.style.background = 'linear-gradient(90deg, #2fd65a, #7dffa0)';
    else if (pct > 30) healthFill.style.background = 'linear-gradient(90deg, #e0a11a, #ffd24d)';
    else healthFill.style.background = 'linear-gradient(90deg, #d63333, #ff6b5a)';
    scoreEl.textContent = state.score;
    killsEl.textContent = '击杀 ' + state.kills + (state.streak >= 2 ? ' · 🔥连杀 x' + state.streak : '') + (allies.length ? ' · 🤝队友 ' + allies.length : '');

    // 等级与经验
    leveltext.textContent = 'Lv ' + state.level;
    xpfill.style.width = Math.min(100, state.xp / state.xpToNext * 100) + '%';
    // 护盾条
    if (state.shopUpgrades.shield) {
      shieldbar.classList.remove('hidden');
      shieldfill.style.width = Math.max(0, state.shieldPoints) + '%';
    } else {
      shieldbar.classList.add('hidden');
    }
    // 保护罩状态
    if (state.bubbleUntil > state.time) {
      bubblestatus.textContent = '🌀 保护罩生效中';
    } else if (state.shopUpgrades.bubble && state.bubbleCooldown > 0) {
      bubblestatus.textContent = '🌀 保护罩冷却 ' + Math.ceil(state.bubbleCooldown) + 's';
    } else if (state.shopUpgrades.bubble) {
      bubblestatus.textContent = '🌀 保护罩就绪（按 ' + keyName(bindKey('bubble')) + '）';
    } else {
      bubblestatus.textContent = '';
    }
    // 区域提示（大炮 / 防御阵地）
    if (cannon.active) areahint.textContent = '🎯 操作大炮中 · ' + keyName(bindKey('cannon')) + ' 离开';
    else if (nearBunker()) areahint.textContent = '🛡️ 防御阵地：减伤 50% · 快速回血';
    else if (Math.hypot(player.pos.x - cannon.x, player.pos.z - cannon.z) < 3.5) areahint.textContent = '按 ' + keyName(bindKey('cannon')) + ' 操作大炮';
    else areahint.textContent = '';

    if (isTimed()) {
      healthbox.classList.add('hidden');
      timerbox.classList.remove('hidden');
      timerlabel.textContent = '剩余时间';
      const t = Math.max(0, Math.ceil(state.timeLeft));
      timerEl.textContent = Math.floor(t / 60) + ':' + String(t % 60).padStart(2, '0');
      timerEl.classList.toggle('low', state.timeLeft <= 30);
      wavetext.textContent = '';
    } else if (state.gameMode === 'zombie') {
      healthbox.classList.remove('hidden');
      timerbox.classList.remove('hidden');
      timerlabel.textContent = '存活时间';
      timerEl.textContent = Math.floor(state.elapsed || 0) + 's';
      timerEl.classList.remove('low');
      wavetext.textContent = '丧尸 ' + enemies.length + ' 名';
    } else if (state.gameMode === 'bossrush') {
      healthbox.classList.remove('hidden');
      timerbox.classList.add('hidden');
      wavetext.textContent = '👹 BOSS ' + (state.bossCount || 0) + ' 只已击败';
    } else if (state.gameMode === 'custom') {
      healthbox.classList.remove('hidden');
      timerbox.classList.add('hidden');
      wavetext.textContent = '回合 ' + (state.customRound || 1) + ' · 剩余 ' + enemies.length;
    } else if (state.gameMode === 'training') {
      healthbox.classList.remove('hidden');
      timerbox.classList.add('hidden');
      wavetext.textContent = '训练场 · 木桩 ' + enemies.length + ' 个';
    } else {
      healthbox.classList.remove('hidden');
      timerbox.classList.add('hidden');
      wavetext.textContent = '第 ' + state.wave + ' 波 · 剩余 ' + enemies.length;
    }
    // 训练场 DPS 面板
    if (state.gameMode === 'training') {
      dpsbox.classList.remove('hidden');
      dpsnum.textContent = Math.round(state.trainDps || 0);
    } else {
      dpsbox.classList.add('hidden');
    }
  }

  function showBanner(text) {
    banner.textContent = text;
    banner.classList.add('show');
    clearTimeout(showBanner._t);
    showBanner._t = setTimeout(() => banner.classList.remove('show'), 2200);
  }

  function updateOverlay() {
    const modesEl = document.getElementById('modes');
    if (state.mode === 'menu') {
      overlay.classList.remove('hidden');
      title.textContent = '3D 枪战游戏';
      subtitle.textContent = '选择模式开始 · 金币 ' + state.coins + '   💡 游玩获得金币，商店升级永久生效';
      modesEl.classList.remove('hidden');
      finalstats.textContent = '';
      cta.textContent = '';
      returnbtn.classList.add('hidden');
      endbtn.classList.add('hidden');
      weaponlist.classList.add('hidden');
      customcfgEl.classList.add('hidden');
      controlsEl.classList.remove('hidden');
      updateCheckinBtn();
    } else if (state.mode === 'customcfg') {
      overlay.classList.remove('hidden');
      title.textContent = '⚙️ 自定义战斗';
      subtitle.textContent = '自选敌人、数量、地图与天气';
      modesEl.classList.add('hidden');
      controlsEl.classList.add('hidden');
      finalstats.textContent = '';
      cta.textContent = '';
      returnbtn.classList.add('hidden');
      endbtn.classList.add('hidden');
      weaponlist.classList.add('hidden');
      customcfgEl.classList.remove('hidden');
      buildCustomCfg();
    } else if (state.mode === 'shop') {
      overlay.classList.remove('hidden');
      title.textContent = '🛒 武器升级商店';
      subtitle.textContent = '金币：击杀 +5，得分 +1/20 分 · 升级永久生效';
      modesEl.classList.add('hidden');
      controlsEl.classList.add('hidden');
      customcfgEl.classList.add('hidden');
      checkinbtn.classList.add('hidden');
      finalstats.textContent = '';
      cta.textContent = '';
      returnbtn.classList.remove('hidden');
      returnbtn.textContent = '返回主菜单';
      endbtn.classList.add('hidden');
      weaponlist.classList.add('hidden');
    } else if (state.mode === 'weapons') {
      overlay.classList.remove('hidden');
      title.textContent = '📖 使用手册';
      subtitle.textContent = '';
      modesEl.classList.add('hidden');
      controlsEl.classList.add('hidden');
      customcfgEl.classList.add('hidden');
      checkinbtn.classList.add('hidden');
      finalstats.textContent = '';
      cta.textContent = '';
      returnbtn.classList.remove('hidden');
      returnbtn.textContent = '返回主菜单';
      endbtn.classList.add('hidden');
      weaponlist.classList.remove('hidden');
    } else if (state.mode === 'over') {
      overlay.classList.remove('hidden');
      title.textContent = '游戏结束';
      subtitle.textContent = '';
      modesEl.classList.remove('hidden');
      returnbtn.classList.add('hidden');
      endbtn.classList.add('hidden');
      weaponlist.classList.add('hidden');
      controlsEl.classList.remove('hidden');
      customcfgEl.classList.add('hidden');
      checkinbtn.classList.add('hidden');
      const names = { battle: '人机对战', bossrush: 'Boss 专场', custom: '自定义战斗', training: '训练场', target: '打靶子', pig: '打猪', zombie: '丧尸生存' };
      let extra = '';
      if (state.gameMode === 'battle') extra = ' · 到达 <span>第 ' + state.wave + ' 波</span>';
      else if (state.gameMode === 'bossrush') extra = ' · 击败 <span>' + (state.bossCount || 0) + ' 个 BOSS</span>';
      else if (state.gameMode === 'custom') extra = ' · 到达 <span>第 ' + (state.customRound || 0) + ' 回合</span>';
      else if (state.gameMode === 'zombie') extra = ' · 存活 <span>' + Math.floor(state.elapsed || 0) + ' 秒</span>';
      else if (state.gameMode === 'pig' && state.pigCleared) extra = ' · <span>猪全部消灭！</span>';
      finalstats.innerHTML = '模式 <span>' + (names[state.gameMode] || '') + '</span> · 得分 <span>' + state.score + '</span><br>击杀 <span>' + state.kills + '</span>' + extra +
        '<br>金币 <span>+' + state.lastEarned + '</span> · 余额 <span>' + state.coins + '</span>';
      cta.textContent = '点击上方按钮选择模式重新开始';
    } else {
      modesEl.classList.add('hidden');
      weaponlist.classList.add('hidden');
      customcfgEl.classList.add('hidden');
      checkinbtn.classList.add('hidden');
      if (locked) {
        overlay.classList.add('hidden');
        returnbtn.classList.add('hidden');
        endbtn.classList.add('hidden');
      } else {
        overlay.classList.remove('hidden');
        title.textContent = '已暂停';
        subtitle.textContent = '得分 ' + state.score;
        finalstats.textContent = '';
        cta.textContent = '点击继续游戏';
        returnbtn.classList.remove('hidden');
        returnbtn.textContent = '返回主菜单（不结算）';
        endbtn.classList.remove('hidden'); // 暂停时提供提前结束
        controlsEl.classList.add('hidden');
      }
    }
    updateShopUI();
  }

  /* ================= 游戏流程 ================= */
  function setGameMode(mode) {
    state.gameMode = mode;
    resetGame();
    requestLock();
  }

  /* ================= 自定义战斗（自选敌人/数量/地图/天气） ================= */
  const CUSTOM_TYPES = [
    { id: 'normal', name: '步枪兵' }, { id: 'drone', name: '无人机' }, { id: 'kamikaze', name: '自爆兵' },
    { id: 'sniper', name: '狙击手' }, { id: 'shield', name: '持盾兵' }, { id: 'assassin', name: '隐身刺客' },
    { id: 'summoner', name: '召唤者' }, { id: 'boss', name: 'BOSS' }
  ];
  function openCustomCfg() {
    state.mode = 'customcfg';
    if (document.pointerLockElement) document.exitPointerLock();
    updateOverlay();
  }
  function buildCustomCfg() {
    const typesEl = document.getElementById('cc-types');
    if (typesEl && !typesEl.dataset.built) {
      typesEl.innerHTML = '';
      CUSTOM_TYPES.forEach((t) => {
        const label = document.createElement('label');
        label.className = 'cc-type';
        const cb = document.createElement('input');
        cb.type = 'checkbox';
        cb.checked = state.customCfg.types.indexOf(t.id) >= 0;
        cb.addEventListener('change', () => {
          const set = new Set(state.customCfg.types);
          if (cb.checked) set.add(t.id); else set.delete(t.id);
          state.customCfg.types = CUSTOM_TYPES.filter(x => set.has(x.id)).map(x => x.id);
        });
        label.appendChild(cb);
        label.appendChild(document.createTextNode(t.name));
        typesEl.appendChild(label);
      });
      typesEl.dataset.built = '1';
    }
    const countEl = document.getElementById('cc-count');
    const countLabel = document.getElementById('cc-count-label');
    if (countEl) {
      countEl.value = state.customCfg.count;
      countLabel.textContent = state.customCfg.count;
      countEl.oninput = () => { state.customCfg.count = parseInt(countEl.value, 10); countLabel.textContent = countEl.value; };
    }
    const mapEl = document.getElementById('cc-map');
    if (mapEl && !mapEl.dataset.built) {
      mapEl.innerHTML = '';
      const ropt = document.createElement('option'); ropt.value = 'random'; ropt.textContent = '随机地图'; mapEl.appendChild(ropt);
      MAPS.forEach((m) => {
        const o = document.createElement('option'); o.value = m.id; o.textContent = m.name; mapEl.appendChild(o);
      });
      mapEl.dataset.built = '1';
    }
    if (mapEl) { mapEl.value = state.customCfg.map; mapEl.onchange = () => { state.customCfg.map = mapEl.value; }; }
    const weEl = document.getElementById('cc-weather');
    if (weEl && !weEl.dataset.built) {
      weEl.innerHTML = '';
      [['random', '随机天气'], ['clear', '晴天'], ['rain', '雨天'], ['fog', '大雾'], ['dusk', '黄昏']].forEach((pair) => {
        const o = document.createElement('option'); o.value = pair[0]; o.textContent = pair[1]; weEl.appendChild(o);
      });
      weEl.dataset.built = '1';
    }
    if (weEl) { weEl.value = state.customCfg.weather; weEl.onchange = () => { state.customCfg.weather = weEl.value; }; }
  }
  function startCustom() {
    if (!state.customCfg.types.length) { toast('至少选择一种敌人'); return; }
    setGameMode('custom');
  }
  function spawnCustomWave(round) {
    const cfg = state.customCfg;
    for (let i = 0; i < cfg.count; i++) {
      const type = cfg.types[i % cfg.types.length];
      spawnEnemyOfType(type, 1 + round * 0.06);
    }
  }

  /* ================= 训练场（无限弹药 + DPS 面板 + 敌人不攻击） ================= */
  function spawnTrainingDummy() {
    spawnEnemyOfType('normal', 1);
    const r = enemies[enemies.length - 1];
    r.hp = 99999; r.maxHp = 99999; r.speed = 0; r.damage = 0; // 木桩：不掉血不打人
  }
  function recordTrainDmg(d) {
    if (state.gameMode !== 'training' || !d) return;
    state.trainDmg = state.trainDmg || [];
    state.trainDmg.push({ t: state.time, d });
  }
  function updateTrainDps() {
    const now = state.time;
    state.trainDmg = (state.trainDmg || []).filter(x => now - x.t <= 2);
    state.trainDps = state.trainDmg.reduce((s, x) => s + x.d, 0) / 2; // 最近 2 秒平均
  }

  function resetGame() {
    for (const r of enemies.slice()) removeRobot(r);
    for (const p of pigs.slice()) removePig(p);
    for (const t of targets) { scene.remove(t.group); t.group.traverse(o => { if (o.geometry) o.geometry.dispose(); }); }
    for (const p of particles) scene.remove(p.mesh);
    for (const t of tracers) { scene.remove(t.line); t.line.geometry.dispose(); t.line.material.dispose(); }
    for (const s of shells) scene.remove(s.mesh);
    for (const f of floaters) { scene.remove(f.sprite); f.sprite.material.dispose(); }
    for (const r of rockets) { scene.remove(r.mesh); r.mesh.geometry.dispose(); r.mesh.material.dispose(); }
    for (const g of grenades) { scene.remove(g.mesh); g.mesh.geometry.dispose(); g.mesh.material.dispose(); }
    for (const p of pickups) { scene.remove(p.mesh); scene.remove(p.beam); p.mesh.geometry.dispose(); p.mesh.material.dispose(); p.beam.geometry.dispose(); p.beam.material.dispose(); }
    for (const l of explosionLights) scene.remove(l.light);
    for (const f of fireZones) scene.remove(f.light);
    for (const f of frostZones) scene.remove(f.light);
    enemies.length = 0; pigs.length = 0; targets.length = 0;
    particles.length = 0; tracers.length = 0; shells.length = 0; floaters.length = 0;
    rockets.length = 0; grenades.length = 0; pickups.length = 0; explosionLights.length = 0;
    fireZones.length = 0; frostZones.length = 0;
    raycastTargets.length = 0;
    raycastTargets.push(ground);

    // 重建环境（每局随机地图；自定义战斗可指定地图与天气）
    pickRandomMap();
    if (state.gameMode === 'custom' && state.customCfg.map && state.customCfg.map !== 'random') {
      const m = MAPS.find(x => x.id === state.customCfg.map);
      if (m) currentMap = m;
    }
    buildArena();
    pickWeather();
    if (state.gameMode === 'custom' && state.customCfg.weather && state.customCfg.weather !== 'random') {
      weather.type = state.customCfg.weather;
      applyWeather();
    }
    for (const o of obstacles) raycastTargets.push(o.mesh);

    player.pos.set(0, EYE_HEIGHT, 0);
    player.vel.set(0, 0, 0);
    player.yaw = 0; player.pitch = 0;
    player.maxHealth = 100 + 20 * state.shopUpgrades.hp + 10 * (state.level - 1); // 永久升级 + 等级加成
    player.health = player.maxHealth;
    player.lastDamage = -99;
    state.shieldPoints = state.shopUpgrades.shield ? 100 : 0;
    state.bubbleUntil = 0;
    state.bubbleCooldown = 0;
    cannon.active = false;
    cannon.cooldown = 0;
    state.allyCooldown = 0;
    // 每日首局奖励
    const today = todayStr();
    if (state.lastGameDate !== today) {
      state.lastGameDate = today;
      state.coins += 200;
      saveShop();
      toast('💎 每日首局奖励 +200 金币');
    }
    try { localStorage.setItem('fps_lastgame', today); } catch (e) { /* ignore */ }
    for (const a of allies) scene.remove(a.group);
    allies.length = 0;

    state.score = 0; state.kills = 0; state.wave = 1;
    state.weaponIndex = 0;
    state.weaponAmmo = {};
    for (const w of WEAPONS) state.weaponAmmo[w.id] = magSize(w);
    state.reloading = false; state.fireCooldown = 0;
    state.recoil = 0; state.kick = 0; state.shake = 0;
    state.firing = false; state.aiming = false; state.triggerEdge = false;
    state.timeLeft = TIMED_DURATION;
    state.time = 0; state.pigCleared = false; state.elapsed = 0; state.spawnTimer = 3;
    state.eventTimer = 20 + Math.random() * 15; // 首个随机事件 20~35 秒后
    state.eventCount = 0;
    state.grenades = 3 + state.shopUpgrades.nade;
    state.molotovs = 3;
    state.frosts = 3;

    for (const w of WEAPONS) w.model.visible = false;
    WEAPONS[0].model.visible = true;
    flashSprite.position.copy(WEAPONS[0].muzzleV);
    muzzleLight.position.copy(WEAPONS[0].muzzleV);
    applySkin();

    if (state.gameMode === 'battle') {
      startWave();
    } else if (state.gameMode === 'bossrush') {
      state.bossCount = 0;
      state.bossDelay = 1.5;
      spawnEnemyOfType('boss', 1);
      showBanner('👹 Boss 专场 · 击败 BOSS 获得海量分数 · ' + currentMap.name);
    } else if (state.gameMode === 'custom') {
      state.customRound = 1;
      state.customDelay = 0;
      spawnCustomWave(1);
      showBanner('自定义战斗 · ' + state.customCfg.count + ' 名敌人 · ' + currentMap.name);
    } else if (state.gameMode === 'training') {
      state.trainDmg = [];
      state.trainDps = 0;
      for (let i = 0; i < 3; i++) spawnTrainingDummy();
      showBanner('训练场 · 无限弹药 · 敌人不反击 · ' + currentMap.name);
    } else if (state.gameMode === 'zombie') {
      for (let i = 0; i < 3; i++) spawnEnemyOfType('zombie');
      showBanner('丧尸生存 · 活下来 · ' + currentMap.name);
    } else if (state.gameMode === 'target') {
      spawnTargets();
      showBanner('原地打靶 · 3 分钟 · ' + currentMap.name);
    } else if (state.gameMode === 'pig') {
      for (let i = 0; i < 14; i++) spawnPig();
      showBanner('打金猪 · 3 分钟 · ' + currentMap.name);
    }

    state.mode = 'playing';
    updateAmmoHUD(); updateWeaponHUD(); updateHUD(); updateGrenadeHUD(); updateOverlay();
  }

  function spawnTargets() {
    const spots = [[-4, -22], [4, -22], [-9, -16], [0, -18], [9, -16], [-14, -10], [14, -10]];
    for (const s of spots) spawnTarget(s[0], s[1]);
  }

  const WAVE_TYPES = ['normal', 'drone', 'kamikaze', 'sniper', 'shield', 'assassin', 'summoner', 'boss'];
  const TYPE_NAMES = { normal: '', drone: ' · 无人机', kamikaze: ' · 自爆兵', sniper: ' · 狙击手', shield: ' · 持盾兵', assassin: ' · 隐身刺客', summoner: ' · 召唤者', boss: ' · BOSS！' };

  function startWave() {
    // 1v1：每波只生成一个敌人，类型循环（步枪兵→无人机→自爆兵→狙击手→BOSS）
    state.enemiesRemaining = 1;
    state.enemiesSpawned = 0;
    const token = ++state.waveToken;
    const type = WAVE_TYPES[(state.wave - 1) % WAVE_TYPES.length];
    setTimeout(() => {
      if (state.mode !== 'playing' || state.gameMode !== 'battle' || token !== state.waveToken) return;
      spawnEnemyOfType(type);
      state.enemiesSpawned = 1;
    }, 500);
    showBanner('第 ' + state.wave + ' 波 · 1v1' + (TYPE_NAMES[type] || '') + (state.wave === 1 ? ' · ' + currentMap.name : ''));
  }
  function nextWave() { state.wave++; state.waveDelay = 2.5; }

  /* ================= 随机事件（对战 / 丧尸 / Boss 专场） ================= */
  function updateEvents(dt) {
    if (state.eventTimer === undefined) state.eventTimer = 0;
    state.eventTimer -= dt;
    if (state.eventTimer <= 0) rollRandomEvent();
  }
  function rollRandomEvent() {
    if (state.mode !== 'playing') return;
    const pool = state.gameMode === 'zombie'
      ? ['airdrop', 'surge', 'supply', 'horde']
      : ['airdrop', 'surge', 'supply'];
    const e = pool[Math.floor(Math.random() * pool.length)];
    state.eventCount = (state.eventCount || 0) + 1;
    if (e === 'airdrop') {
      // 空投支援：紫色大礼包
      const base = new THREE.Vector3(
        player.pos.x + (Math.random() - 0.5) * 20,
        0,
        player.pos.z + (Math.random() - 0.5) * 20
      );
      base.x = Math.max(-280, Math.min(280, base.x));
      base.z = Math.max(-280, Math.min(280, base.z));
      spawnPickup(base, 'airdrop');
      toast('📦 空投支援已到达！');
      audio.tone(880, 0.3, 0.3, 900);
    } else if (e === 'surge') {
      // 敌潮涌动：同时出现 5 个敌人
      const type = state.gameMode === 'zombie' ? 'zombie' : 'normal';
      for (let i = 0; i < 5; i++) spawnEnemyOfType(type, 1 + (state.wave || 1) * 0.05);
      showBanner('⚠️ 敌潮涌动！');
      audio.explosion();
    } else if (e === 'horde') {
      // 丧尸狂潮：8 只强化丧尸
      for (let i = 0; i < 8; i++) spawnEnemyOfType('zombie', 1.2);
      showBanner('🧟 丧尸狂潮！');
      audio.tone(280, 0.35, 0.3, 140);
    } else if (e === 'supply') {
      // 补给爆发：周围刷出 5 个补给箱
      const kinds = ['health', 'ammo', 'coin'];
      for (let i = 0; i < 5; i++) {
        const p = new THREE.Vector3(
          player.pos.x + (Math.random() - 0.5) * 14,
          0,
          player.pos.z + (Math.random() - 0.5) * 14
        );
        spawnPickup(p, kinds[Math.floor(Math.random() * 3)]);
      }
      toast('🎁 补给爆发！');
      audio.buy();
    }
    state.eventTimer = 25 + Math.random() * 15; // 25~40 秒后下一个事件
  }

  function playerTakeDamage(d) {
    if (state.mode !== 'playing') return;
    state.streak = 0; // 受伤打断连杀
    if (state.bubbleUntil > state.time) return; // 保护罩：免疫一切伤害
    if (nearBunker()) d *= 0.5;                 // 防御阵地：减伤 50%
    // 能量护盾优先吸收
    if (state.shieldPoints > 0 && d > 0) {
      const absorbed = Math.min(state.shieldPoints, d);
      state.shieldPoints -= absorbed;
      d -= absorbed;
    }
    if (d <= 0) {
      player.lastDamage = state.time;
      return;
    }
    player.health -= d;
    player.lastDamage = state.time;
    dmgEl.style.opacity = 0.85;
    audio.hurt();
    if (player.health <= 0) { player.health = 0; gameOver(); }
  }
  function gameOver() {
    state.mode = 'over';
    state.firing = false; state.aiming = false;
    // 结算金币（击杀 + 得分转化），永久保存
    state.lastEarned = state.kills * 5 + Math.floor(state.score / 20);
    state.coins += state.lastEarned;
    saveShop();
    // 成就与排行榜
    const a = state.ach;
    a.totalGames = (a.totalGames || 0) + 1;
    a.totalScore = (a.totalScore || 0) + state.score;
    qScoreCheck(state.score);
    if (state.score > a.bestScore) a.bestScore = state.score;
    if (state.gameMode === 'battle' && state.wave > a.bestWave) a.bestWave = state.wave;
    if (state.gameMode === 'bossrush' && (state.bossCount || 0) > a.bestWave) a.bestWave = state.bossCount;
    if (state.gameMode === 'custom' && (state.customRound || 0) > a.bestWave) a.bestWave = state.customRound;
    if (state.gameMode === 'zombie' && Math.floor(state.elapsed || 0) > a.bestSurvive) a.bestSurvive = Math.floor(state.elapsed || 0);
    if (state.gameMode === 'pig' && state.pigCleared) a.pigCleared++;
    if (!state.highscores[state.gameMode] || state.score > state.highscores[state.gameMode]) state.highscores[state.gameMode] = state.score;
    checkAchievements();
    saveAch();
    if (document.pointerLockElement) document.exitPointerLock();
    updateOverlay();
  }
  function goMenu() {
    state.mode = 'menu';
    state.firing = false; setAiming(false);
    if (document.pointerLockElement) document.exitPointerLock();
    updateOverlay();
  }

  /* ================= 碰撞（支持跳上障碍物） ================= */
  function obstacleAhead(dist) {
    const ex = player.pos.x + _forward.x * dist;
    const ez = player.pos.z + _forward.z * dist;
    for (const o of obstacles) {
      if (o.top > 2.6) continue; // 只翻越低矮障碍
      if (Math.abs(ex - o.x) < o.w / 2 + 0.45 && Math.abs(ez - o.z) < o.d / 2 + 0.45) return true;
    }
    return false;
  }

  function resolveCollisionsXZ(pos, radius, feetY) {
    for (const o of obstacles) {
      if (o.top <= feetY + 0.02) continue;
      const hw = o.w / 2, hd = o.d / 2;
      const dx = pos.x - o.x, dz = pos.z - o.z;
      const px = Math.max(-hw, Math.min(hw, dx));
      const pz = Math.max(-hd, Math.min(hd, dz));
      const cdx = dx - px, cdz = dz - pz;
      const d2 = cdx * cdx + cdz * cdz;
      if (d2 < radius * radius) {
        if (d2 === 0) {
          const penX = hw + radius - Math.abs(dx);
          const penZ = hd + radius - Math.abs(dz);
          if (penX < penZ) pos.x = o.x + (dx >= 0 ? hw + radius : -(hw + radius));
          else pos.z = o.z + (dz >= 0 ? hd + radius : -(hd + radius));
        } else {
          const d = Math.sqrt(d2);
          const push = (radius - d) / d;
          pos.x += cdx * push; pos.z += cdz * push;
        }
      }
    }
  }

  function groundHeightAt(x, z) {
    let h = 0;
    for (const o of obstacles) {
      if (Math.abs(x - o.x) < o.w / 2 + 0.15 && Math.abs(z - o.z) < o.d / 2 + 0.15) {
        h = Math.max(h, o.top);
      }
    }
    return h;
  }

  /* ================= 更新 ================= */
  function updatePlayer(dt) {
    // 操作大炮时锁定移动
    if (cannon.active) {
      _move.set(0, 0, 0);
      player.vel.set(0, 0, 0);
      camera.position.set(cannon.x, 2.0, cannon.z);
      camera.rotation.y = cannon.yaw;
      camera.rotation.x = cannon.pitch;
      return;
    }
    const canMove = state.gameMode !== 'target'; // 打靶模式固定站位
    const fwd = canMove ? ((keys['KeyW'] ? 1 : 0) - (keys['KeyS'] ? 1 : 0)) : 0;
    const strafe = canMove ? ((keys['KeyD'] ? 1 : 0) - (keys['KeyA'] ? 1 : 0)) : 0;
    const sprint = canMove && (keys[bindKey('sprint')] || keys['ShiftLeft'] || keys['ShiftRight']);

    _forward.set(-Math.sin(player.yaw), 0, -Math.cos(player.yaw));
    _right.set(Math.cos(player.yaw), 0, -Math.sin(player.yaw));
    _move.set(0, 0, 0);
    _move.addScaledVector(_forward, fwd);
    _move.addScaledVector(_right, strafe);

    // ---- 移动技能：蹲下（默认 Tab）/ 滑铲（疾跑中按蹲下键）/ 自动翻越 ----
    const crouchKey = keys[bindKey('crouch')] && canMove;
    if (crouchKey) {
      if (player.onGround && state.slideTimer <= 0 && sprint && _move.lengthSq() > 0) {
        state.slideTimer = 0.7; // 疾跑中按 Tab 触发滑铲
        spawnParticles(player.pos.clone().add(new THREE.Vector3(0, -1.05, 0)), 0xcccccc, 10, 3, 2);
        audio.tone(160, 0.16, 0.18, 260);
      }
      state.crouch = true;
    } else if (state.slideTimer <= 0) {
      state.crouch = false;
    }
    let speedMul = 1 + 0.06 * state.shopUpgrades.speed;
    if (state.slideTimer > 0) {
      state.slideTimer -= dt;
      speedMul *= 1.9; // 滑铲冲刺
    } else if (state.crouch) {
      speedMul *= 0.55; // 蹲下减速
    }
    const speed = (sprint ? SPRINT_SPEED : WALK_SPEED) * speedMul;
    const eyeH = state.slideTimer > 0 ? 0.85 : (state.crouch ? 1.05 : EYE_HEIGHT);
    if (_move.lengthSq() > 0) _move.normalize().multiplyScalar(speed);

    const accel = 1 - Math.pow(0.0001, dt);
    player.vel.x += (_move.x - player.vel.x) * accel;
    player.vel.z += (_move.z - player.vel.z) * accel;

    if (canMove && state.spaceEdge) {
      if (player.onGround) {
        // 自动翻越：前方 1 米内有低矮障碍物时跳得更高并向前扑
        const vault = obstacleAhead(1.0);
        player.vel.y = JUMP_SPEED * (currentMap.gravityMul < 1 ? 0.85 : 1) * (vault ? 1.28 : 1);
        if (vault) {
          player.vel.x += _forward.x * 6;
          player.vel.z += _forward.z * 6;
          spawnParticles(player.pos.clone().add(new THREE.Vector3(0, -0.7, 0)), 0xffd24d, 8, 2.5, 2.5);
        }
        player.onGround = false;
        player.jumps = 1;
      } else if ((player.jumps || 0) < 2) {
        // 二段跳
        player.vel.y = JUMP_SPEED * 0.85 * (currentMap.gravityMul < 1 ? 0.85 : 1);
        player.jumps = 2;
        spawnParticles(player.pos.clone().add(new THREE.Vector3(0, -0.6, 0)), 0xffffff, 6, 2, 2);
        audio.tone(220, 0.1, 0.18, 320);
      }
      state.spaceEdge = false;
    }
    player.vel.y -= GRAVITY * currentMap.gravityMul * dt;

    player.pos.x += player.vel.x * dt;
    player.pos.z += player.vel.z * dt;
    resolveCollisionsXZ(player.pos, 0.5, player.pos.y - eyeH);
    player.pos.y += player.vel.y * dt;

    const gh = groundHeightAt(player.pos.x, player.pos.z);
    const targetY = gh + eyeH;
    if (player.vel.y <= 0 && player.pos.y <= targetY) {
      player.pos.y = targetY;
      player.vel.y = 0;
      player.onGround = true;
      player.jumps = 0;
    } else if (player.pos.y > targetY + 0.01) {
      player.onGround = false;
    }

    player.pos.x = Math.max(-290, Math.min(290, player.pos.x));
    player.pos.z = Math.max(-290, Math.min(290, player.pos.z));

    camera.position.copy(player.pos);
    const sh = state.shake;
    camera.rotation.y = player.yaw + (Math.random() - 0.5) * sh;
    camera.rotation.x = player.pitch + state.kick + (Math.random() - 0.5) * sh;
    state.shake = Math.max(0, state.shake - dt * 2);
  }

  function updateWeaponVisuals(dt) {
    const w = currentWeapon();
    const scoped = state.aiming && w.id === 'sniper';
    w.model.visible = !scoped; // 仅狙击镜隐藏枪模（全屏准镜）；其他枪保持可见
    const active = locked && state.mode === 'playing';
    const showScope = scoped && active;
    const showSight = state.aiming && !scoped && active; // 其他枪开镜：枪居中 + 红点准星
    scopeEl.style.display = showScope ? 'block' : 'none';
    sightEl.style.display = showSight ? 'block' : 'none';
    crosshair.style.display = (showScope || showSight) ? 'none' : '';
    aimhint.style.display = (w.id === 'sniper' && !state.aiming && active) ? 'block' : 'none';

    const targetFov = state.aiming ? w.adsZoom * (state.shopUpgrades.optic ? 0.8 : 1) : settings.fov;
    if (Math.abs(camera.fov - targetFov) > 0.1) {
      camera.fov += (targetFov - camera.fov) * Math.min(1, dt * 14);
      camera.updateProjectionMatrix();
    }

    const targetX = state.aiming ? 0 : 0.32;
    const targetY = state.aiming ? -0.17 : -0.28;
    const k = Math.min(1, dt * 12);
    gunHolder.position.x += (targetX - gunHolder.position.x) * k;
    gunHolder.position.y += (targetY - gunHolder.position.y) * k;
    gunHolder.position.z = (state.aiming ? -0.42 : -0.55) + state.recoil * 1.4;
    gunHolder.rotation.x = state.recoil * 0.9;

    const moving = _move.lengthSq() > 0 && player.onGround;
    const bobSpeed = (keys[bindKey('sprint')] || keys['ShiftLeft']) ? 13 : 8;
    const bobAmt = 0.011;
    if (moving) {
      gunHolder.position.y += Math.sin(state.time * bobSpeed) * bobAmt;
      gunHolder.position.x += Math.cos(state.time * bobSpeed * 0.5) * bobAmt * 0.5;
    }

    state.recoil = Math.max(0, state.recoil - dt * 0.9);
    state.kick = Math.max(0, state.kick - dt * 0.12);
    if (muzzleLight.intensity > 0) muzzleLight.intensity = Math.max(0, muzzleLight.intensity - dt * 40);
    flashSprite.scale.setScalar(Math.max(0, flashSprite.scale.x - dt * 6));
  }

  function updateShooting(dt) {
    if (state.reloading) {
      state.reloadTimer -= dt;
      if (state.reloadTimer <= 0) {
        state.reloading = false;
        state.weaponAmmo[currentWeapon().id] = magSize(currentWeapon());
        reloadhint.textContent = '按 ' + keyName(bindKey('reload')) + ' 换弹';
        reloadhint.classList.remove('show');
        updateAmmoHUD();
      }
    }
    if (state.fireCooldown > 0) state.fireCooldown -= dt;
    const w = currentWeapon();
    if (cannon.active) {
      // 操作大炮：左键直接开炮（不消耗弹药）
      if (state.firing) shoot();
    } else if (w.auto) {
      // 全自动：按住连发
      if (state.firing) shoot();
    } else if (state.triggerEdge || state.firing) {
      // 半自动：按住同样连发（射速受限），点击也会立即击发，不吞点击
      if (state.fireCooldown <= 0 && !state.reloading && state.weaponAmmo[w.id] > 0) {
        shoot();
        state.triggerEdge = false;
      } else if (state.weaponAmmo[w.id] <= 0 && !state.reloading) {
        // 空弹匣点击：提示并自动换弹
        audio.empty();
        startReload();
        state.triggerEdge = false;
      }
    }

    if (!state.reloading && !w.melee && state.weaponAmmo[w.id] > 0 && state.weaponAmmo[w.id] <= Math.ceil(magSize(w) * 0.25)) {
      reloadhint.textContent = '按 ' + keyName(bindKey('reload')) + ' 换弹';
      reloadhint.classList.add('show');
    } else if (!state.reloading) {
      reloadhint.classList.remove('show');
    }
  }

  /* 机器人 AI（对战 1v1 与城市逃杀共用） */
  function walkAnim(r) {
    const parts = r.group.userData.parts;
    if (!parts.la) return;
    const sw = Math.sin(state.time * 11);
    parts.la.rotation.x = sw * 0.5; parts.ra.rotation.x = -sw * 0.5;
    parts.ll.rotation.x = -sw * 0.4; parts.rl.rotation.x = sw * 0.4;
  }

  function explodeKamikaze(r) {
    if (r.dead) return;
    r.dead = true;
    r.deathTimer = 0.1;
    const point = r.group.position.clone().add(new THREE.Vector3(0, 1, 0));
    spawnParticles(point, 0xff5500, 24, 8, 6);
    audio.explosion();
    const d = player.pos.distanceTo(r.group.position);
    if (d < 4) playerTakeDamage(r.damage * diffDmg());
    const i = raycastTargets.indexOf(r.group); if (i >= 0) raycastTargets.splice(i, 1);
  }

  function updateRobots(dt) {
    for (const r of enemies) {
      if (r.dead) {
        r.deathTimer -= dt;
        const t = 1 - Math.max(0, r.deathTimer) / (r.type === 'boss' ? 1.2 : 0.9);
        if (r.type === 'drone') {
          r.group.position.y = 4 * (1 - t);
          r.group.rotation.z = t * 3;
        } else {
          r.group.rotation.x = -t * Math.PI / 2;
          r.group.position.y = -t * 0.4;
        }
        continue;
      }
      const dx = player.pos.x - r.group.position.x;
      const dz = player.pos.z - r.group.position.z;
      const dist = Math.hypot(dx, dz);
      const slowMul = (r.slowUntil && r.slowUntil > state.time) ? 0.3 : 1; // 冰冻减速
      // 头顶血条
      if (r.hpBar) {
        const frac = Math.max(0, Math.min(1, r.hp / r.maxHp));
        r.hpBar.scale.x = frac;
        r.hpBar.position.x = -0.42 * (1 - frac);
        r.hpBar.material.color.setHex(frac > 0.5 ? 0x44ff66 : frac > 0.25 ? 0xffd24d : 0xff4444);
        r.hpBar.visible = true;
      }
      // 燃烧持续伤害
      if (r.burnUntil && r.burnUntil > state.time) {
        r.hp -= (r.burnDps || 8) * dt;
        r.hitFlash = Math.max(r.hitFlash, 0.04);
        if (r.hp <= 0) { killRobot(r); continue; }
      }

      r.hitFlash = Math.max(0, r.hitFlash - dt);
      r.group.traverse((o) => {
        if (o.isMesh && o.material && o.material.emissive) {
          let c = r.hitFlash > 0 ? 0xcc2200 : (o.material.userData.baseEmissive || 0);
          if (r.type === 'kamikaze' && r.hitFlash <= 0 && o.material.userData.baseEmissive) {
            c = Math.sin(state.time * 12) > 0 ? 0xff2200 : 0x660000; // 胸口闪烁
          }
          o.material.emissive.setHex(c);
        }
      });

      r.group.rotation.y = Math.atan2(dx, dz);
      const dirx = dx / (dist || 1), dirz = dz / (dist || 1);

      if (r.type === 'drone') {
        /* 无人机：悬停绕圈 + 单发射击 */
        r.group.position.y = 4 + Math.sin(state.time * 2 + r.phase) * 0.25;
        let mvx = 0, mvz = 0;
        if (dist > 16) { mvx = dirx; mvz = dirz; }
        else if (dist < 10) { mvx = -dirx; mvz = -dirz; }
        else { mvx = -dirz; mvz = dirx; }
        r.group.position.x += mvx * r.speed * slowMul * dt;
        r.group.position.z += mvz * r.speed * slowMul * dt;
        for (const s of [-1, 1]) {
          const rot = r.group.userData['rotor' + s];
          if (rot) rot.rotation.y += dt * 40;
          const rotz = r.group.userData['rotorz' + s];
          if (rotz) rotz.rotation.y += dt * 40;
        }
        r.attackTimer -= dt;
        if (r.attackTimer <= 0 && dist < 35) {
          r.attackTimer = 1.6 + Math.random() * 0.6;
          robotShoot(r, dist, 0.72);
        }
      } else if (r.type === 'kamikaze' || r.type === 'zombie' || r.type === 'shield' || r.type === 'assassin') {
        /* 近战冲锋：kamikaze 接近自爆；其余接近后挥砍 */
        r.group.position.x += dirx * r.speed * slowMul * dt;
        r.group.position.z += dirz * r.speed * slowMul * dt;
        resolveCollisionsXZ(r.group.position, r.type === 'shield' ? 0.6 : 0.4, 0);
        walkAnim(r);
        if (r.type === 'kamikaze') {
          if (dist < 2.2) explodeKamikaze(r);
        } else if (dist < 1.8) {
          r.attackTimer -= dt;
          if (r.attackTimer <= 0) {
            r.attackTimer = 1.0;
            playerTakeDamage(r.damage * diffDmg());
            spawnParticles(player.pos.clone(), 0xff3344, 3, 2, 4);
          }
        }
      } else if (r.type === 'summoner') {
        /* 召唤者：保持距离，周期性召唤小丧尸 */
        let mvx = 0, mvz = 0;
        if (dist < 12) { mvx = -dirx; mvz = -dirz; }
        else if (dist > 20) { mvx = dirx; mvz = dirz; }
        else { mvx = -dirz; mvz = dirx; }
        r.group.position.x += mvx * r.speed * slowMul * dt;
        r.group.position.z += mvz * r.speed * slowMul * dt;
        resolveCollisionsXZ(r.group.position, 0.4, 0);
        walkAnim(r);
        r.attackTimer -= dt;
        if (r.attackTimer <= 0) {
          r.attackTimer = 4;
          if (enemies.length < 9) spawnMinion(r.group.position.x, r.group.position.z);
        }
      } else if (r.type === 'sniper') {
        /* 狙击手：保持 18~30m 远距离，单发高伤害 */
        let mvx = 0, mvz = 0;
        if (dist < 18) { mvx = -dirx; mvz = -dirz; }
        else if (dist > 30) { mvx = dirx; mvz = dirz; }
        else { mvx = -dirz; mvz = dirx; }
        r.group.position.x += mvx * r.speed * slowMul * dt;
        r.group.position.z += mvz * r.speed * slowMul * dt;
        resolveCollisionsXZ(r.group.position, 0.4, 0);
        walkAnim(r);
        r.attackTimer -= dt;
        if (r.attackTimer <= 0 && dist < 60) {
          r.attackTimer = 2.8;
          robotShoot(r, dist, 0.92);
        }
      } else if (r.type === 'boss') {
        /* BOSS：缓慢走位 + 随机技能（弹幕/召唤/冲锋/连发） */
        let mvx = 0, mvz = 0;
        if (dist > 14) { mvx = dirx; mvz = dirz; }
        else if (dist < 7) { mvx = -dirx; mvz = -dirz; }
        else { mvx = -dirz; mvz = dirx; }
        r.group.position.x += mvx * r.speed * slowMul * dt;
        r.group.position.z += mvz * r.speed * slowMul * dt;
        resolveCollisionsXZ(r.group.position, 0.75, 0);
        walkAnim(r);
        // 冲锋技能
        if (r.charging) {
          r.chargeTime -= dt;
          r.group.position.x += r.chargeDir.x * r.speed * 4 * dt;
          r.group.position.z += r.chargeDir.z * r.speed * 4 * dt;
          if (!r.chargeHit && dist < 1.9) {
            r.chargeHit = true;
            playerTakeDamage((r.damage + 10) * diffDmg());
            spawnParticles(player.pos.clone(), 0xff3344, 8, 3, 5);
          }
          if (r.chargeTime <= 0) r.charging = false;
        }
        if (dist < 50) {
          r.attackTimer -= dt;
          if (r.attackTimer <= 0) {
            r.attackTimer = 3.2 + Math.random() * 0.8;
            const skill = Math.random();
            if (skill < 0.3) { r.skill = 'barrage'; r.burstShots = 9; r.burstTimer = 0; r.barrageIndex = 0; }
            else if (skill < 0.5) {
              spawnMinion(r.group.position.x, r.group.position.z);
              if (Math.random() < 0.5) spawnMinion(r.group.position.x, r.group.position.z);
              spawnParticles(r.group.position.clone().add(new THREE.Vector3(0, 2, 0)), 0xaa44ff, 14, 3, 5);
              audio.tone(200, 0.2, 0.3, 300);
              r.skill = 'summon';
            } else if (skill < 0.7) {
              r.charging = true; r.chargeTime = 0.7; r.chargeHit = false;
              r.chargeDir = new THREE.Vector3(dirx, 0, dirz);
              r.skill = 'charge';
            } else { r.skill = 'burst'; r.burstShots = 3; r.burstTimer = 0; }
          }
          if (r.burstShots > 0) {
            r.burstTimer -= dt;
            if (r.burstTimer <= 0) {
              r.burstTimer = 0.16;
              r.burstShots--;
              if (r.skill === 'barrage') {
                const off = (r.barrageIndex - 4) * 0.17;
                r.barrageIndex++;
                robotShoot(r, dist, 0.5, off);
              } else {
                robotShoot(r, dist, 0.65);
              }
            }
          }
        }
      } else {
        /* 步枪兵：保持 8~16m，绕圈，三连发 */
        let mvx = 0, mvz = 0;
        if (dist > 16) { mvx = dirx; mvz = dirz; }
        else if (dist < 8) { mvx = -dirx; mvz = -dirz; }
        else { mvx = -dirz; mvz = dirx; }
        r.group.position.x += mvx * r.speed * slowMul * dt;
        r.group.position.z += mvz * r.speed * slowMul * dt;
        resolveCollisionsXZ(r.group.position, 0.4, 0);
        walkAnim(r);
        if (dist < 40) {
          r.attackTimer -= dt;
          if (r.attackTimer <= 0) {
            r.attackTimer = 2.2 + Math.random() * 0.8;
            r.burstShots = 3;
            r.burstTimer = 0;
          }
          if (r.burstShots > 0) {
            r.burstTimer -= dt;
            if (r.burstTimer <= 0) {
              r.burstTimer = 0.16;
              r.burstShots--;
              robotShoot(r, dist, 0.8);
            }
          }
        }
      }
    }

    for (let i = enemies.length - 1; i >= 0; i--) {
      if (enemies[i].dead && enemies[i].deathTimer <= 0) removeRobot(enemies[i]);
    }
  }

  function regenPlayer(dt) {
    if (player.health < player.maxHealth && state.time - player.lastDamage > 5) {
      player.health = Math.min(player.maxHealth, player.health + dt * 6);
    }
    // 护盾回复（购买能量护盾后）
    if (state.shopUpgrades.shield && state.shieldPoints < 100 && state.time - player.lastDamage > 6) {
      state.shieldPoints = Math.min(100, state.shieldPoints + dt * 8);
    }
    // 防御阵地内加速回血
    if (nearBunker() && player.health < player.maxHealth) {
      player.health = Math.min(player.maxHealth, player.health + dt * 8);
    }
    if (dmgEl.style.opacity > 0) dmgEl.style.opacity = Math.max(0, parseFloat(dmgEl.style.opacity) - dt * 2.2);
  }

  function updateBattle(dt) {
    regenPlayer(dt);
    updateRobots(dt);
    updateEvents(dt);

    if (state.enemiesSpawned >= state.enemiesRemaining && enemies.length === 0 && state.waveDelay <= 0) {
      nextWave();
    }
    if (state.waveDelay > 0) {
      state.waveDelay -= dt;
      if (state.waveDelay <= 0) startWave();
    }
  }

  function updateBossRush(dt) {
    regenPlayer(dt);
    updateRobots(dt);
    updateEvents(dt);
    state.bossDelay = (state.bossDelay === undefined ? 1.5 : state.bossDelay) - dt;
    if (enemies.length === 0 && state.bossDelay <= 0) {
      state.bossCount = (state.bossCount || 0) + 1;
      state.bossDelay = 2.5;
      spawnEnemyOfType('boss', 1 + state.bossCount * 0.35); // 每只 BOSS 更强
      showBanner('👹 BOSS ' + state.bossCount + ' 号来袭！');
      audio.explosion();
    }
  }

  function updateCustom(dt) {
    regenPlayer(dt);
    updateRobots(dt);
    updateEvents(dt);
    state.customDelay = (state.customDelay === undefined ? 0 : state.customDelay) - dt;
    if (enemies.length === 0 && state.customDelay <= 0) {
      state.customDelay = 2;
      state.customRound = (state.customRound || 1) + 1;
      spawnCustomWave(state.customRound);
      showBanner('第 ' + state.customRound + ' 回合 · 敌人变强了');
    }
  }

  function updateTraining(dt) {
    regenPlayer(dt);
    updateRobots(dt);
    updateTrainDps();
    state.customDelay = (state.customDelay === undefined ? 0 : state.customDelay) - dt;
    if (enemies.length === 0 && state.customDelay <= 0) {
      state.customDelay = 1.5;
      for (let i = 0; i < 3; i++) spawnTrainingDummy();
    }
  }

  function updateZombie(dt) {
    regenPlayer(dt);
    updateEvents(dt);
    state.elapsed = (state.elapsed || 0) + dt; // 存活时间
    state.spawnTimer = (state.spawnTimer === undefined ? 3 : state.spawnTimer) - dt;
    // 后期更多丧尸、更强、刷新更快（上限 30）
    const cap = Math.min(6 + Math.floor(state.elapsed / 8), 30);
    if (state.spawnTimer <= 0 && enemies.length < cap) {
      state.spawnTimer = Math.max(0.8, 4 - state.elapsed / 25);
      const scale = 1 + state.elapsed / 40; // 后期敌人随存活时间变强
      const r = Math.random();
      if (r < 0.7) spawnEnemyOfType('zombie', scale);
      else if (r < 0.9) spawnEnemyOfType('drone', scale);
      else spawnEnemyOfType('sniper', scale);
    }
    updateRobots(dt);
  }

  function updateTarget(dt) {
    for (const t of targets) {
      t.flash = Math.max(0, t.flash - dt);
      const board = t.group.userData.board;
      if (!board.material.emissive) board.material.emissive = new THREE.Color(0);
      board.material.emissive.setHex(t.flash > 0 ? 0x88aa44 : 0x000000);
      const dx = player.pos.x - t.x, dz = player.pos.z - t.z;
      t.group.userData.pivot.rotation.y = Math.atan2(dx, dz);
    }
  }

  function updatePig(dt) {
    for (const pig of pigs) {
      if (pig.dead) {
        pig.deathTimer -= dt;
        const t = 1 - Math.max(0, pig.deathTimer) / 0.8;
        pig.group.rotation.x = -t * Math.PI / 2;
        continue;
      }
      const dx = player.pos.x - pig.group.position.x;
      const dz = player.pos.z - pig.group.position.z;
      const dist = Math.hypot(dx, dz);

      // 头顶血条
      if (pig.hpBar) {
        const frac = Math.max(0, Math.min(1, pig.hp / 120));
        pig.hpBar.scale.x = frac;
        pig.hpBar.position.x = -0.42 * (1 - frac);
        pig.hpBar.material.color.setHex(frac > 0.5 ? 0x44ff66 : frac > 0.25 ? 0xffd24d : 0xff4444);
        pig.hpBar.visible = true;
      }

      // 燃烧持续伤害
      if (pig.burnUntil && pig.burnUntil > state.time) {
        pig.hp -= (pig.burnDps || 8) * dt;
        pig.hitFlash = Math.max(pig.hitFlash, 0.04);
        if (pig.hp <= 0) { killPig(pig); continue; }
      }

      pig.hitFlash = Math.max(0, pig.hitFlash - dt);
      pig.group.traverse((o) => {
        if (o.isMesh && o.material && o.material.emissive) {
          o.material.emissive.setHex(pig.hitFlash > 0 ? 0xff5577 : 0x000000);
        }
      });

      let dirx, dirz;
      if (pig.fleeTimer > 0 || dist < 9) {
        if (dist < 9) pig.fleeTimer = 0.4;
        pig.fleeTimer -= dt;
        dirx = -dx / (dist || 1); dirz = -dz / (dist || 1);
      } else {
        pig.wanderTimer -= dt;
        if (pig.wanderTimer <= 0) {
          pig.wanderTimer = 1.5 + Math.random() * 2;
          pig.wanderAngle = Math.random() * Math.PI * 2;
        }
        dirx = Math.sin(pig.wanderAngle); dirz = Math.cos(pig.wanderAngle);
      }
      const slowMul = (pig.slowUntil && pig.slowUntil > state.time) ? 0.3 : 1;
      const speed = ((pig.fleeTimer > 0 || dist < 9) ? 5.5 : 1.6) * slowMul;
      pig.group.position.x += dirx * speed * dt;
      pig.group.position.z += dirz * speed * dt;
      resolveCollisionsXZ(pig.group.position, 0.45, 0);
      const targetRot = Math.atan2(dirx, dirz);
      let diff = targetRot - pig.group.rotation.y;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      pig.group.rotation.y += diff * Math.min(1, dt * 6);
    }

    // 死亡的小猪直接移除，不再重生（打不死的感觉来自重生）
    for (let i = pigs.length - 1; i >= 0; i--) {
      if (pigs[i].dead && pigs[i].deathTimer <= 0) removePig(pigs[i]);
    }
    // 全部消灭：加奖励分并提前结束
    if (pigs.length === 0 && !state.pigCleared) {
      state.pigCleared = true;
      state.score += 200;
      showBanner('猪全部消灭！+200');
      setTimeout(() => {
        if (state.mode === 'playing' && state.gameMode === 'pig') gameOver();
      }, 1300);
    }
  }

  function updateEffects(dt) {
    updateRockets(dt);
    updateGrenades(dt);
    updatePickups(dt);
    updateFireZones(dt);
    for (let i = frostZones.length - 1; i >= 0; i--) {
      frostZones[i].life -= dt;
      frostZones[i].light.intensity = Math.max(0, frostZones[i].life / 0.4 * 6);
      if (frostZones[i].life <= 0) { scene.remove(frostZones[i].light); frostZones.splice(i, 1); }
    }

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        scene.remove(p.mesh); p.mesh.geometry.dispose(); p.mesh.material.dispose();
        particles.splice(i, 1); continue;
      }
      p.vel.y -= (p.gravity || 6) * dt;
      p.mesh.position.addScaledVector(p.vel, dt);
      if (p.mesh.position.y < 0.02) { p.mesh.position.y = 0.02; p.vel.y = -p.vel.y * 0.3; }
    }
    for (let i = tracers.length - 1; i >= 0; i--) {
      const t = tracers[i];
      t.life -= dt;
      t.line.material.opacity = Math.max(0, t.life / 0.1 * 0.9);
      if (t.life <= 0) {
        scene.remove(t.line); t.line.geometry.dispose(); t.line.material.dispose();
        tracers.splice(i, 1);
      }
    }
    for (let i = shells.length - 1; i >= 0; i--) {
      const s = shells[i];
      s.life -= dt;
      if (s.life <= 0) {
        scene.remove(s.mesh); s.mesh.geometry.dispose(); s.mesh.material.dispose();
        shells.splice(i, 1); continue;
      }
      s.vel.y -= 9 * dt;
      s.mesh.position.addScaledVector(s.vel, dt);
      s.mesh.rotation.x += s.spin.x * dt;
      s.mesh.rotation.z += s.spin.z * dt;
      if (s.mesh.position.y < 0.02) { s.mesh.position.y = 0.02; s.vel.set(0, 0, 0); }
    }
    for (let i = floaters.length - 1; i >= 0; i--) {
      const f = floaters[i];
      f.life -= dt;
      f.sprite.position.y += dt * 1.2;
      f.sprite.material.opacity = Math.max(0, f.life / (f.maxLife || 0.9));
      if (f.life <= 0) {
        scene.remove(f.sprite); f.sprite.material.dispose();
        floaters.splice(i, 1);
      }
    }
    for (let i = explosionLights.length - 1; i >= 0; i--) {
      const l = explosionLights[i];
      l.life -= dt;
      l.light.intensity = Math.max(0, l.life / 0.22 * 14);
      if (l.life <= 0) {
        scene.remove(l.light);
        explosionLights.splice(i, 1);
      }
    }
  }

  function update(dt) {
    state.time += dt;
    if (state.mode === 'playing') state.ach.playTime = (state.ach.playTime || 0) + dt;
    updateCannon(dt);
    if (state.bubbleCooldown > 0) state.bubbleCooldown -= dt;
    if (state.streakTimer > 0) { state.streakTimer -= dt; if (state.streakTimer <= 0) state.streak = 0; }
    if (bubbleMesh) {
      bubbleMesh.position.copy(player.pos);
      bubbleMesh.visible = state.bubbleUntil > state.time && state.mode === 'playing';
    }
    updatePlayer(dt);
    updateWeaponVisuals(dt);
    updateShooting(dt);
    updateEffects(dt);
    updateAllies(dt);
    updateRain(dt);
    updateDirectionIndicators();
    updateMinimap();

    if (state.gameMode === 'battle') updateBattle(dt);
    else if (state.gameMode === 'bossrush') updateBossRush(dt);
    else if (state.gameMode === 'custom') updateCustom(dt);
    else if (state.gameMode === 'training') updateTraining(dt);
    else if (state.gameMode === 'zombie') updateZombie(dt);
    else if (state.gameMode === 'target') updateTarget(dt);
    else if (state.gameMode === 'pig') updatePig(dt);

    if (isTimed()) {
      state.timeLeft -= dt;
      if (state.timeLeft <= 0) { state.timeLeft = 0; gameOver(); }
    }
    updateHUD();
  }

  /* ================= 渲染循环 ================= */
  let lastTime = performance.now();
  function animate(now) {
    requestAnimationFrame(animate);
    const dt = Math.min((now - lastTime) / 1000, 0.05);
    lastTime = now;
    if (state.mode === 'playing' && locked) update(dt);
    renderer.render(scene, camera);
  }

  /* ================= 调试钩子（仅供自动化测试） ================= */
  window.__gameDebug = {
    setLocked(v) { locked = v; },
    isLocked() { return locked; },
    get state() { return state; },
    get player() { return player; },
    get scopeDisplay() { return scopeEl.style.display; },
    get crosshairDisplay() { return crosshair.style.display; },
    get gunVisible() { return currentWeapon().model.visible; },
    get fov() { return camera.fov; },
    get tracerCount() { return tracers.length; },
    get flashScale() { return flashSprite.scale.x; },
    get ammoText() { return ammoEl.textContent; },
    get weaponName() { return weaponname.textContent; },
    get aiming() { return state.aiming; },
    get firing() { return state.firing; },
    get rocketCount() { return rockets.length; },
    get pickupCount() { return pickups.length; },
    get pickups() { return pickups; },
    get enemyCount() { return enemies.length; },
    get pigs() { return pigs; },
    get pigCount() { return pigs.length; },
    get weaponCount() { return WEAPONS.length; },
    get headshotMult() { return HEADSHOT_MULT; },
    get obstacleCount() { return obstacles.length; },
    get obstacles() { return obstacles; },
    get grenadeCount() { return state.grenades; },
    get coins() { return state.coins; },
    get shopUpgrades() { return state.shopUpgrades; },
    get achTotalKills() { return state.ach.totalKills; },
    get achUnlocked() { return state.ach.unlocked; },
    get cannonActive() { return cannon.active; },
    get cameraY() { return camera.position.y; },
    get cameraFov() { return camera.fov; },
    get floaterCount() { return floaters.length; },
    get quests() { return state.quests; },
    get weekly() { return state.weekly; },
    get bossCount() { return state.bossCount || 0; },
    get eventCount() { return state.eventCount || 0; },
    get crouching() { return state.crouch; },
    get sliding() { return state.slideTimer > 0; },
    get skins() { return state.skins; },
    get activeSkin() { return state.activeSkin; },
    get activeCross() { return state.activeCross; },
    get customCfg() { return state.customCfg; },
    get customRound() { return state.customRound || 0; },
    get trainDps() { return state.trainDps || 0; },
    get checkin() { return state.checkin; },
    get weatherType() { return weather.type; },
    get streak() { return state.streak; },
    get allyCount() { return allies.length; },
    get allies() { return allies; },
    get mapName() { return currentMap.name; },
    get mapList() { return MAPS.map(m => m.id); },
    get enemyTypes() { return enemies.map(e => e.type); },
    get enemies() { return enemies; },
    get keybinds() { return settings.keybinds || {}; },
    setScore(v) { state.score = v; },
    setCoins(v) { state.coins = v; saveShop(); },
    setHealth(v) { player.health = v; player.maxHealth = Math.max(player.maxHealth, v); },
    hurt(v) { playerTakeDamage(v); },
    killEnemy(idx) { if (enemies[idx]) killRobot(enemies[idx]); },
    killHead(idx) { if (enemies[idx]) killRobot(enemies[idx], true); },
    spawnEnemy(type) { spawnEnemyOfType(type); }
  };

  /* ================= 音量设置 ================= */
  volslider.addEventListener('input', () => {
    audio.setVolume(volslider.value / 100);
    vollabel.textContent = '音量 ' + volslider.value + '%';
    try { localStorage.setItem('fps_volume', volslider.value); } catch (err) { /* ignore */ }
  });
  try {
    const saved = parseInt(localStorage.getItem('fps_volume'), 10);
    if (!isNaN(saved)) {
      volslider.value = saved;
      vollabel.textContent = '音量 ' + saved + '%';
    }
  } catch (err) { /* ignore */ }

  /* ================= 灵敏度 / 视野设置 ================= */
  sensslider.addEventListener('input', () => {
    settings.sensitivity = sensslider.value / 100;
    saveSettings();
  });
  fovslider.addEventListener('input', () => {
    settings.fov = parseInt(fovslider.value, 10);
    camera.fov = settings.fov;
    camera.updateProjectionMatrix();
    saveSettings();
  });
  difficultyEl.addEventListener('change', () => {
    settings.difficulty = parseInt(difficultyEl.value, 10);
    saveSettings();
  });
  shakeslider.addEventListener('input', () => {
    settings.shake = shakeslider.value / 100;
    saveSettings();
  });
  hitselect.addEventListener('change', () => {
    settings.hitmarker = parseFloat(hitselect.value);
    saveSettings();
  });
  function loadSettings() {
    try {
      const s = JSON.parse(localStorage.getItem('fps_settings') || '{}');
      if (typeof s.sensitivity === 'number') settings.sensitivity = s.sensitivity;
      if (typeof s.fov === 'number') settings.fov = s.fov;
      if (typeof s.difficulty === 'number') settings.difficulty = s.difficulty;
      if (typeof s.shake === 'number') settings.shake = s.shake;
      if (typeof s.hitmarker === 'number') settings.hitmarker = s.hitmarker;
      if (s.keybinds) { settings.keybinds = Object.assign({}, DEF_BINDS, s.keybinds); }
    } catch (e) { /* ignore */ }
    if (!settings.keybinds) settings.keybinds = Object.assign({}, DEF_BINDS);
    sensslider.value = Math.round(settings.sensitivity * 100);
    fovslider.value = settings.fov;
    difficultyEl.value = settings.difficulty;
    shakeslider.value = Math.round(settings.shake * 100);
    hitselect.value = settings.hitmarker;
    buildKeybinds();
  }
  function saveSettings() {
    try { localStorage.setItem('fps_settings', JSON.stringify(settings)); } catch (e) { /* ignore */ }
  }

  /* ================= 键位自定义 ================= */
  let bindCapture = null; // { action } 等待按下的新键
  function buildKeybinds() {
    const el = document.getElementById('keybind-rows');
    if (!el) return;
    el.innerHTML = '';
    for (const action of Object.keys(DEF_BINDS)) {
      const d = document.createElement('div');
      d.className = 'kb-row';
      const label = document.createElement('span');
      label.className = 'kb-name';
      label.textContent = BIND_NAMES[action];
      const btn = document.createElement('button');
      btn.className = 'kb-btn';
      btn.textContent = keyName(bindKey(action));
      btn.dataset.action = action;
      if (bindCapture && bindCapture.action === action) {
        btn.classList.add('capturing');
        btn.textContent = '按下新键…';
      }
      d.appendChild(label);
      d.appendChild(btn);
      el.appendChild(d);
    }
  }
  function bindKeydownCapture(e) {
    if (!bindCapture) return;
    e.preventDefault();
    e.stopPropagation();
    const code = e.code || e.key;
    if (code === 'Escape') { // 取消改键
      bindCapture = null;
      buildKeybinds();
      return;
    }
    if (code === 'MetaLeft' || code === 'MetaRight' || code === 'F5' || code === 'F12') return; // 系统键不可绑定
    settings.keybinds[bindCapture.action] = code;
    bindCapture = null;
    saveSettings();
    buildKeybinds();
    updateHintTexts();
  }
  addEventListener('keydown', bindKeydownCapture, true);
  function updateHintTexts() {
    const h = document.getElementById('hints');
    if (!h) return;
    h.innerHTML = 'WASD 移动 · 鼠标左键射击 · 按住 ' + keyName(bindKey('aim')) + ' 开镜<br>' +
      keyName(bindKey('sprint')) + ' / Shift 疾跑 · ' + keyName(bindKey('jump')) + ' 跳跃 · ' + keyName(bindKey('reload')) + ' 换弹 · ' +
      keyName(bindKey('grenade')) + ' 手雷 · ' + keyName(bindKey('molotov')) + ' 燃烧 · ' + keyName(bindKey('frost')) + ' 冰冻<br>' +
      '1-9 / 0 / Q / E / C 切换武器 · ' + keyName(bindKey('menu')) + ' 返回菜单 · Esc 暂停<br>' +
      keyName(bindKey('recruit')) + ' 招募队友 · ' + keyName(bindKey('cannon')) + ' 操作大炮 · ' + keyName(bindKey('bubble')) + ' 保护罩';
    aimhint.textContent = '按住 ' + keyName(bindKey('aim')) + ' 开镜';
  }
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.kb-btn');
    if (!btn) return;
    e.stopPropagation();
    bindCapture = { action: btn.dataset.action };
    buildKeybinds();
  });

  /* ================= 商店按钮（事件委托） ================= */
  shopRows.addEventListener('click', (e) => {
    const btn = e.target.closest('.s-buy');
    if (!btn) return;
    e.stopPropagation();
    buyUpgrade(btn.dataset.up);
  });
  shopSkinsEl.addEventListener('click', (e) => {
    const btn = e.target.closest('.s-buy');
    if (!btn) return;
    e.stopPropagation();
    buySkin(btn.dataset.skin);
  });

  /* 清空存档（二次确认防误触） */
  let resetArmed = false;
  shopReset.addEventListener('click', (e) => {
    e.stopPropagation();
    if (!resetArmed) {
      resetArmed = true;
      shopReset.textContent = '再次点击确认清空';
      clearTimeout(shopReset._t);
      shopReset._t = setTimeout(() => { resetArmed = false; shopReset.textContent = '清空存档'; }, 3000);
    } else {
      clearTimeout(shopReset._t);
      resetArmed = false;
      shopReset.textContent = '清空存档';
      clearSave();
    }
  });
  saveExportEl.addEventListener('click', (e) => { e.stopPropagation(); exportSave(); });
  saveImportEl.addEventListener('click', (e) => { e.stopPropagation(); importSave(); });

  /* ================= 启动 ================= */
  loadShop();
  loadAch();
  loadQuests();
  loadWeek();
  loadCheckin();
  loadSettings();
  state.lastGameDate = (() => { try { return localStorage.getItem('fps_lastgame') || ''; } catch (e) { return ''; } })();
  camera.fov = settings.fov;
  camera.updateProjectionMatrix();
  buildSlots();
  buildWeaponList();
  buildEnemyList();
  buildThrowableList();
  buildUpgradeList();
  buildAchievements();
  buildLeaderboard();
  buildQuests();
  buildWeekly();
  buildStats();
  updateHUD();
  updateWeaponHUD();
  updateGrenadeHUD();
  applySkin();
  updateHintTexts();
  updateOverlay();
  requestAnimationFrame(animate);
})();
