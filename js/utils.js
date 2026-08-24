/* 共享工具函数 */
window.Utils = {
  // 用 canvas 绘制纹理
  canvasTexture(size, draw) {
    const c = document.createElement('canvas');
    c.width = c.height = size;
    draw(c.getContext('2d'), size);
    return new THREE.CanvasTexture(c);
  },
  boxMesh(w, h, d, mat) {
    return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  },
  addBox(parent, w, h, d, mat, x, y, z) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x, y, z);
    parent.add(m);
    return m;
  },
  addCyl(parent, r, h, mat, x, y, z, rx) {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 16), mat);
    m.position.set(x, y, z);
    if (rx) m.rotation.x = rx;
    parent.add(m);
    return m;
  },
  rand(a, b) { return a + Math.random() * (b - a); },
  clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
};
