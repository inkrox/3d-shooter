/* 程序化音效（Web Audio） */
window.GameAudio = {
  ctx: null,
  master: null,
  noiseBuf: null,
  init() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    try { this.ctx = new Ctx(); } catch (e) { return; }
    // 主音量控制
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.8;
    this.master.connect(this.ctx.destination);
    const len = this.ctx.sampleRate * 0.5;
    this.noiseBuf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const d = this.noiseBuf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  },
  setVolume(v) {
    if (this.master) this.master.gain.value = Math.max(0, Math.min(1, v));
  },
  out() { return this.master || (this.ctx && this.ctx.destination); },
  noise(dur, vol, freq, type) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuf; src.loop = true;
    const f = this.ctx.createBiquadFilter(); f.type = type || 'lowpass'; f.frequency.value = freq;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    src.connect(f); f.connect(g); g.connect(this.out());
    src.start(t); src.stop(t + dur);
  },
  tone(freq, dur, vol, slideTo) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const o = this.ctx.createOscillator(); o.type = 'sine';
    o.frequency.setValueAtTime(freq, t);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g); g.connect(this.out());
    o.start(t); o.stop(t + dur);
  },
  shot(id) {
    if (id === 'shotgun') {
      this.noise(0.22, 0.7, 900, 'lowpass'); this.tone(90, 0.2, 0.6, 35);
    } else if (id === 'sniper') {
      this.noise(0.2, 0.6, 1400, 'lowpass'); this.noise(0.08, 0.4, 6000, 'highpass'); this.tone(110, 0.18, 0.5, 40);
    } else if (id === 'pistol') {
      this.noise(0.09, 0.45, 2400, 'lowpass'); this.tone(150, 0.08, 0.4, 60);
    } else if (id === 'smg') {
      this.noise(0.07, 0.4, 3000, 'lowpass'); this.tone(170, 0.06, 0.3, 70);
    } else if (id === 'gatling') {
      this.noise(0.05, 0.35, 700, 'lowpass'); this.tone(90, 0.05, 0.3, 45);
    } else if (id === 'laser') {
      this.tone(1400, 0.06, 0.2, 500); this.noise(0.04, 0.15, 5000, 'highpass');
    } else {
      this.noise(0.11, 0.5, 2000, 'lowpass'); this.tone(130, 0.1, 0.45, 50);
    }
  },
  rocketLaunch() { this.noise(0.4, 0.5, 800, 'lowpass'); this.noise(0.25, 0.3, 2500, 'highpass'); this.tone(90, 0.3, 0.4, 40); },
  explosion() { this.noise(0.5, 0.8, 500, 'lowpass'); this.noise(0.2, 0.5, 1500); this.tone(70, 0.4, 0.7, 25); },
  flame() { this.noise(0.14, 0.3, 600, 'lowpass'); },
  crossbowShot() { this.noise(0.06, 0.35, 3000, 'bandpass'); this.tone(400, 0.06, 0.25, 200); },
  throwGrenade() { this.tone(320, 0.09, 0.16, 150); },
  switch() { this.tone(500, 0.04, 0.15, 700); },
  buy() { this.tone(700, 0.06, 0.2, 1000); this.tone(1000, 0.08, 0.15, 1400); },
  empty() { this.tone(700, 0.04, 0.15, 500); },
  reload() { this.tone(400, 0.05, 0.2); setTimeout(() => this.tone(600, 0.05, 0.2), 350); },
  hit() { this.tone(900, 0.05, 0.18, 500); },
  headshot() { this.tone(1400, 0.07, 0.22, 700); },
  kill() { this.tone(300, 0.18, 0.3, 60); this.noise(0.15, 0.2, 900); },
  hurt() { this.tone(160, 0.2, 0.4, 70); },
  robotShot() { this.noise(0.08, 0.3, 2200, 'lowpass'); this.tone(180, 0.06, 0.25, 90); },
  droneShot() { this.tone(900, 0.06, 0.2, 400); },
  pigHit() { this.tone(700, 0.08, 0.2, 300); },
  pigDie() { this.tone(500, 0.3, 0.25, 120); this.tone(700, 0.25, 0.2, 200); },
  targetHit() { this.tone(1200, 0.04, 0.2, 900); },
  bullseye() { this.tone(1600, 0.1, 0.25, 800); this.tone(2100, 0.1, 0.15, 1000); },
  // 极简背景氛围音（低音垫，音量随主音量）
  startBGM() {
    if (!this.ctx || this.bgmStarted) return;
    this.bgmStarted = true;
    const g = this.ctx.createGain(); g.gain.value = 0.035;
    const mk = (type, freq) => { const o = this.ctx.createOscillator(); o.type = type; o.frequency.value = freq; o.connect(g); o.start(); };
    mk('sine', 55); mk('sine', 82.5); mk('triangle', 110);
    const lfo = this.ctx.createOscillator(); lfo.frequency.value = 0.08;
    const lfoG = this.ctx.createGain(); lfoG.gain.value = 0.02;
    lfo.connect(lfoG); lfoG.connect(g.gain); lfo.start();
    g.connect(this.out());
  }
};
