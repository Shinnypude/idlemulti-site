// Mundo 2.5D da landing: câmera ortográfica, sprites pixelados e um herói que corre
// conforme a página rola. Tudo aqui é cenário; o conteúdo da página continua em HTML.
import * as THREE from '../vendor/three.module.min.js';
import * as S from './sprites.js';
import { measureStops } from './stages.js';

const { UNIT } = S;
const GROUND = 1.5; // altura do topo do chão, em unidades
const HERO_X = 3; // posição do herói na tela, em unidades a partir da esquerda
const HERO_BASE = GROUND + 0.5;
const BLOCK_Y = 4.5;
const PIPE_TOP = GROUND + 2;
const POLE_H = 7;
const POLE_HERO_TOP = GROUND + POLE_H - 1.3;

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (t) => t * t * (3 - 2 * t);
const ramp = (x, a, b) => clamp((x - a) / (b - a), 0, 1);
const grid = (v) => Math.round(v * UNIT) / UNIT; // alinha à grade de pixels da arte

// calm: para quem pediu menos movimento. A cena só acompanha o scroll, sem pulos, moedas nem deslizes.
export async function createWorld(backCanvas, frontCanvas, { calm = false } = {}) {
  try { await document.fonts.load('700 10px "Pixelify Sans"'); } catch { /* usa a fonte reserva */ }

  // Dois canvases: o de fundo fica atrás do conteúdo da página, o da frente carrega chão,
  // blocos, canos e herói por cima dele. Os dois compartilham a mesma câmera.
  const makeRenderer = (canvas) => {
    const r = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false, powerPreference: 'low-power' });
    r.setClearColor(0x000000, 0);
    return r;
  };
  const rBack = makeRenderer(backCanvas);
  const rFront = makeRenderer(frontCanvas);
  const sceneBack = new THREE.Scene();
  const scene = new THREE.Scene(); // frente
  const canvas = frontCanvas;
  const camera = new THREE.OrthographicCamera(0, 10, 6, 0, 0.1, 50);
  camera.position.z = 10;
  const cameraBack = new THREE.OrthographicCamera(0, 10, 6, 0, 0.1, 50);
  cameraBack.position.z = 10;

  // ---------- helpers ----------
  const disposables = [];
  function sprite(map, w, h, z, fade = false, target = scene) {
    const mat = new THREE.MeshBasicMaterial({ map, transparent: true, alphaTest: 0.01, depthWrite: false, side: THREE.DoubleSide });
    const geo = new THREE.PlaneGeometry(w, h);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.z = z;
    target.add(mesh);
    disposables.push(mat, geo, map);
    if (fade) mesh.userData.fade = true;
    return mesh;
  }
  const put = (mesh, x, y) => mesh.position.set(grid(x), grid(y), mesh.position.z);

  // Camada que se repete na horizontal. factor < 1 dá o efeito de profundidade (parallax).
  const layers = [];
  function layer(map, texW, texH, factor, yBottom, z, planeH = texH / UNIT, target = sceneBack, tall = false) {
    map.wrapS = map.wrapT = THREE.RepeatWrapping;
    const mesh = sprite(map, 1, planeH, z, false, target);
    map.repeat.y = planeH / (texH / UNIT);
    mesh.position.y = yBottom + planeH / 2;
    layers.push({ mesh, map, factor, tileW: texW / UNIT, tall, planeH });
    return mesh;
  }

  // ---------- cenário ----------
  layer(S.starsTexture(7), 128, 128, 0.08, 0, -5, undefined, undefined, true);
  layer(S.starsTexture(23), 128, 128, 0.18, 0, -4.5, undefined, undefined, true);
  layer(S.hillsTexture(), 256, 64, 0.3, GROUND, -4);
  layer(S.cloudsTexture(), 256, 128, 0.55, 0, -3, undefined, undefined, true);
  layer(S.groundTexture(), 16, 16, 1, GROUND - 2, 0, 2, scene);

  const hero = S.heroTextures();
  const heroMesh = sprite(hero.idle, 0.75, 1, 2, true);
  const heroMat = heroMesh.material;
  const swap = (mesh, tex) => { if (mesh.material.map !== tex) { mesh.material.map = tex; mesh.material.needsUpdate = true; } };

  const blockTex = S.blockTextures();
  const coinTex = S.coinTexture();
  const poleMesh = sprite(S.poleTexture(), 1, POLE_H, 0.5);
  const flagMesh = sprite(S.flagTexture(), 1, 7 / UNIT, 0.6);
  const castleMesh = sprite(S.castleTexture(), 5, 4, 0.4);
  const pipeMeshes = [sprite(S.pipeTexture(), 2, 2, 3), sprite(S.pipeTexture(), 2, 2, 3)];

  const signDefs = [];
  const signMeshes = ['FASE 1-1  DEMO', 'FASE 1-2  BENEFÍCIOS', 'FASE 1-3  PLANOS', 'FASE 1-4  PERGUNTAS'].map((t) => {
    const s = S.signTexture(t);
    const w = s.w + (s.w % 2); // largura par mantém a placa na grade de pixels
    const m = sprite(s.tex, w / UNIT, s.h / UNIT, 0.5);
    signDefs.push(m);
    return m;
  });

  let blockMeshes = [];
  let coinMeshes = [];
  function buildBlocks(n) {
    blockMeshes.forEach((m) => scene.remove(m));
    coinMeshes.forEach((m) => scene.remove(m));
    blockMeshes = Array.from({ length: n }, () => sprite(blockTex.question, 1, 1, 1));
    coinMeshes = Array.from({ length: n }, () => {
      const m = sprite(coinTex, 10 / UNIT, 10 / UNIT, 1.5, true);
      m.visible = false;
      return m;
    });
  }

  // ---------- estado ----------
  let stops = null;
  let tilePx = 48, viewW = 12, viewH = 6, viewHBack = 6, dpr = 1, ppu = 48;
  let camX = window.scrollY / ppu;
  let prevCam = camX;
  let revealed = [];
  const bumpT = [];
  const coinT = [];
  let step = 0, stepAcc = 0, face = 1;
  let slide = null, slideDone = false;
  let raf = 0, running = false, last = 0;

  const toX = (s) => s / ppu + HERO_X;

  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    dpr = Math.min(2, Math.floor(window.devicePixelRatio) || 1);
    let k = Math.round(h / (6.4 * UNIT));
    k = Math.max(1, Math.min(k, Math.floor(h / (5.4 * UNIT))));
    tilePx = UNIT * k;
    viewW = w / tilePx;
    viewH = h / tilePx;
    ppu = tilePx;
    const hBack = backCanvas.clientHeight || h;
    viewHBack = hBack / tilePx;
    rFront.setPixelRatio(dpr); rFront.setSize(w, h, false);
    rBack.setPixelRatio(dpr); rBack.setSize(w, hBack, false);
    camera.left = 0; camera.right = viewW; camera.top = viewH; camera.bottom = 0;
    camera.updateProjectionMatrix();
    cameraBack.left = 0; cameraBack.right = viewW; cameraBack.top = viewHBack; cameraBack.bottom = 0;
    cameraBack.updateProjectionMatrix();
    const width = 2 * Math.ceil((viewW + 2) / 2);
    layers.forEach((l) => {
      l.mesh.scale.x = width; l.width = width; l.map.repeat.x = width / l.tileW;
      if (l.tall) { l.mesh.scale.y = viewHBack / l.planeH; l.map.repeat.y = viewHBack / l.planeH; l.mesh.position.y = viewHBack / 2; }
    });
  }

  function layout() {
    stops = measureStops(toX);
    if (blockMeshes.length !== stops.cards.length) {
      buildBlocks(stops.cards.length);
      revealed = stops.cards.map(() => false);
    }
    signMeshes.forEach((m, i) => put(m, stops.signs[i].x, GROUND + 0.875));
    pipeMeshes.forEach((m, i) => put(m, stops.pipes[i], GROUND + 1));
    put(poleMesh, stops.flag, GROUND + POLE_H / 2);
    put(castleMesh, stops.castle, GROUND + 2);
    stops.blocks.forEach((x, i) => put(blockMeshes[i], x, BLOCK_Y));
    // Quem já passou dos blocos (ex.: recarregou no meio da página) entra revelado, sem animação.
    stops.blocks.forEach((x, i) => { if (!revealed[i] && camX + HERO_X >= x) reveal(i, true); });
    wake();
  }

  function reveal(i, silent = false) {
    revealed[i] = true;
    stops.cards[i]?.classList.add('is-revealed');
    swap(blockMeshes[i], blockTex.used);
    if (!silent && !calm) { bumpT[i] = 0; coinT[i] = 0; }
  }

  // ---------- pose do herói em função da posição no mundo ----------
  function pose(x) {
    let y = HERO_BASE, drawX = x, alpha = 1;
    const { blocks, pipes, flag, castle } = stops;

    for (const bx of blocks) {
      const d = (x - bx) / 0.55;
      if (Math.abs(d) < 1) y = Math.max(y, HERO_BASE + 1.5 * (1 - d * d));
    }

    const [a, b] = pipes;
    const top = PIPE_TOP + 0.5, under = HERO_BASE - 4;
    if (x > a - 2.2 && x < b + 2.2) {
      if (x < a - 0.8) { const t = ramp(x, a - 2.2, a - 0.8); y = lerp(HERO_BASE, top, smooth(t)) + Math.sin(Math.PI * t) * 0.9; }
      else if (x < a - 0.3) y = top;
      else if (x < a + 0.3) y = lerp(top, under, smooth(ramp(x, a - 0.3, a + 0.3)));
      else if (x < b - 0.3) y = under;
      else if (x < b + 0.3) y = lerp(under, top, smooth(ramp(x, b - 0.3, b + 0.3)));
      else if (x < b + 0.8) y = top;
      else { const t = ramp(x, b + 0.8, b + 2.2); y = lerp(top, HERO_BASE, smooth(t)) + Math.sin(Math.PI * t) * 0.6; }
    }

    if (x > flag - 1.7 && x < flag - 0.45) {
      const t = ramp(x, flag - 1.7, flag - 0.45);
      y = lerp(HERO_BASE, POLE_HERO_TOP, smooth(t)) + Math.sin(Math.PI * t) * 0.8;
    }
    if (x < flag - 1.7) { slide = null; slideDone = false; }
    return { y, drawX, alpha: 1 - ramp(x, castle - 1.0, castle - 0.3), airborne: y > HERO_BASE + 0.15 };
  }

  // ---------- quadro ----------
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;

    const target = clamp(window.scrollY, 0, Math.max(0, document.documentElement.scrollHeight - window.innerHeight)) / ppu;
    if (calm) camX = target;
    else camX += (target - camX) * Math.min(1, dt * 12);
    if (Math.abs(target - camX) < 0.5 / UNIT) camX = target;
    const snapped = grid(camX);
    const vel = dt > 0 ? (snapped - prevCam) / dt : 0;
    prevCam = snapped;
    const moving = Math.abs(vel) > 0.4;
    if (vel > 0.05) face = 1; else if (vel < -0.05) face = -1;

    const heroWorldX = snapped + HERO_X;
    stops.blocks.forEach((bx, i) => { if (!revealed[i] && heroWorldX >= bx) reveal(i); });

    let p = pose(heroWorldX);
    if (calm) p = { ...p, y: HERO_BASE, airborne: false };
    // Mastro: o herói agarra e desce enquanto a bandeira cai.
    if (!calm && !slide && !slideDone && heroWorldX >= stops.flag - 0.45) slide = { t: 0 };
    let flagY = GROUND + POLE_H - 0.3;
    if (slide) {
      slide.t += dt;
      const sp = ramp(slide.t, 0, 0.9);
      p = { ...p, y: lerp(POLE_HERO_TOP, HERO_BASE, sp), drawX: stops.flag - 0.45, airborne: true };
      flagY = lerp(GROUND + POLE_H - 0.3, GROUND + 0.6, smooth(sp));
      const u = ramp(slide.t, 0.9, 1.25);
      if (u > 0) { p.drawX = lerp(stops.flag - 0.45, heroWorldX, smooth(u)); p.airborne = u < 1; }
      if (u >= 1) { slide = null; slideDone = true; }
    } else if (slideDone || (calm && heroWorldX >= stops.flag)) {
      flagY = GROUND + 0.6;
    }

    stepAcc += dt;
    if (stepAcc > 0.11) { stepAcc = 0; step ^= 1; }
    swap(heroMesh, calm ? hero.idle : p.airborne ? hero.jump : moving ? (step ? hero.walkA : hero.walkB) : hero.idle);
    heroMesh.scale.x = face;
    heroMat.opacity = p.alpha;
    heroMesh.visible = p.alpha > 0.01;
    put(heroMesh, p.drawX, p.y);
    put(flagMesh, stops.flag + 0.5, flagY);

    let animating = !!slide || slideDone && flagMesh.position.y > GROUND + 0.7;
    blockMeshes.forEach((m, i) => {
      let off = 0;
      if (bumpT[i] !== undefined) {
        bumpT[i] += dt;
        const t = bumpT[i] / 0.2;
        if (t < 1) { off = Math.sin(Math.PI * t) * 0.35; animating = true; } else bumpT[i] = undefined;
      }
      put(m, stops.blocks[i], BLOCK_Y + off);
      const c = coinMeshes[i];
      if (coinT[i] !== undefined) {
        coinT[i] += dt;
        const t = coinT[i] / 0.7;
        if (t < 1) { c.visible = true; c.material.opacity = 1 - ramp(t, 0.6, 1); put(c, stops.blocks[i], BLOCK_Y + 0.7 + t * 1.6); animating = true; }
        else { c.visible = false; coinT[i] = undefined; }
      }
    });

    layers.forEach((l) => {
      const left = snapped - 1;
      l.mesh.position.x = left + l.width / 2;
      l.map.offset.x = (left * l.factor) / l.tileW;
    });
    camera.position.x = snapped;
    cameraBack.position.x = snapped;
    rBack.render(sceneBack, cameraBack);
    rFront.render(scene, camera);

    if (moving || animating || snapped !== target) {
      raf = requestAnimationFrame(frame);
    } else {
      running = false;
    }
  }

  function wake() {
    if (running || document.hidden || !stops) return;
    running = true;
    last = performance.now();
    raf = requestAnimationFrame(frame);
  }

  // ---------- ligações com a página ----------
  const onScroll = () => wake();
  const onResize = () => { resize(); layout(); };
  const onVisible = () => { if (document.hidden) { cancelAnimationFrame(raf); running = false; } else wake(); };
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onResize);
  document.addEventListener('visibilitychange', onVisible);
  const ro = new ResizeObserver(() => layout());
  ro.observe(document.body);

  resize();
  layout();
  camX = prevCam = grid(window.scrollY / ppu);
  wake();

  return {
    destroy() {
      cancelAnimationFrame(raf);
      running = false;
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      document.removeEventListener('visibilitychange', onVisible);
      ro.disconnect();
      disposables.forEach((d) => d.dispose?.());
      for (const r of [rBack, rFront]) { r.dispose(); r.forceContextLoss(); }
    },
  };
}
