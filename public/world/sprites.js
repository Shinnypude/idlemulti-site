// Arte pixel desenhada em código (nada de imagens externas): cada textura nasce de um canvas
// pequeno e é ampliada com filtro "nearest", então os pixels ficam nítidos.
import * as THREE from '../vendor/three.module.min.js';

export const UNIT = 16; // pixels de arte por unidade do mundo

const C = {
  ink: '#0b0713',
  violet: '#c77df0',
  violetMid: '#8f5fe0',
  violetDeep: '#6d3fd8',
  plum: '#3a2468',
  night: '#17102a',
  gold: '#ffd43b',
  goldDeep: '#d9a21b',
  blue: '#4dabf7',
  blueDeep: '#2b6aa8',
  skin: '#f2c9a0',
  white: '#f4f1fa',
  rose: '#ff6b9c',
};

export function makeTexture(w, h, draw) {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const g = canvas.getContext('2d');
  g.imageSmoothingEnabled = false;
  draw(g, w, h);
  const t = new THREE.CanvasTexture(canvas);
  t.magFilter = THREE.NearestFilter;
  t.minFilter = THREE.NearestFilter;
  t.generateMipmaps = false;
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// Cada linha da matriz é uma linha de pixels; o caractere escolhe a cor na paleta.
function fromRows(rows, pal) {
  const w = Math.max(...rows.map((r) => r.length));
  return makeTexture(w, rows.length, (g) => {
    rows.forEach((row, y) => {
      for (let x = 0; x < row.length; x++) {
        const col = pal[row[x]];
        if (!col) continue;
        g.fillStyle = col;
        g.fillRect(x, y, 1, 1);
      }
    });
  });
}

const HERO_PAL = {
  k: C.ink, h: C.violet, H: C.violetDeep, s: C.skin, e: C.ink,
  b: C.blue, B: C.blueDeep, y: C.gold, l: C.violetDeep, o: C.plum, w: C.white,
};

const HERO_TOP = [
  '....kkkk....',
  '...khhhhk...',
  '..khhhhhhk..',
  '..khhwhhhk..',
  '..kHHHHHHk..',
  '..kseessek..',
  '..kssssssk..',
  '...kssssk...',
  '..kbbbbbbk..',
  '.kbbyyyybbk.',
  '.kbBbbbbBbk.',
  '.ksbbbbbbsk.',
  '..kbbbbbbk..',
];

export function heroTextures() {
  const mk = (legs) => fromRows([...HERO_TOP, ...legs], HERO_PAL);
  return {
    idle: mk(['..kllkkllk..', '..kllkkllk..', '..kookkook..']),
    walkA: mk(['..kllkkllk..', '.kllk..kllk.', '.kook..kook.']),
    walkB: mk(['...kllllk...', '...kllllk...', '...kooook...']),
    jump: mk(['.kllk..kllk.', 'kllk....kllk', 'kook....kook']),
  };
}

export function blockTextures() {
  const question = fromRows([
    'kkkkkkkkkkkkkkkk',
    'kggggggggggggggk',
    'kgykkkkkkkkkkygk',
    'kgkggggggggggkgk',
    'kgkgggkkkkgggkgk',
    'kgkggkkkkkkggkgk',
    'kgkggkkggkkggkgk',
    'kgkggggggkkggkgk',
    'kgkgggggkkgggkgk',
    'kgkgggkkkggggkgk',
    'kgkgggkkgggggkgk',
    'kgkgggggggggggkk',
    'kgkgggkkgggggkgk',
    'kgykkkkkkkkkkygk',
    'kgddddddddddddgk',
    'kkkkkkkkkkkkkkkk',
  ], { k: C.ink, g: C.gold, y: C.white, d: C.goldDeep });
  const used = fromRows([
    'kkkkkkkkkkkkkkkk',
    'kppppppppppppppk',
    'kpdppppppppppdpk',
    'kppppppppppppppk',
    'kppppppppppppppk',
    'kppppppppppppppk',
    'kppppppppppppppk',
    'kppppppppppppppk',
    'kppppppppppppppk',
    'kppppppppppppppk',
    'kppppppppppppppk',
    'kppppppppppppppk',
    'kppppppppppppppk',
    'kpdppppppppppdpk',
    'kppppppppppppppk',
    'kkkkkkkkkkkkkkkk',
  ], { k: C.ink, p: C.plum, d: C.night });
  return { question, used };
}

export function coinTexture() {
  return fromRows([
    '...kkkk...',
    '..kggggk..',
    '.kgyyggdk.',
    '.kgygggdk.',
    '.kgygggdk.',
    '.kgygggdk.',
    '.kgygggdk.',
    '.kggggddk.',
    '..kddddk..',
    '...kkkk...',
  ], { k: C.ink, g: C.gold, y: C.white, d: C.goldDeep });
}

export function groundTexture() {
  return makeTexture(16, 16, (g) => {
    g.fillStyle = C.plum; g.fillRect(0, 0, 16, 16);
    g.fillStyle = C.violetMid; g.fillRect(0, 0, 16, 3);
    g.fillStyle = C.violet; g.fillRect(0, 0, 16, 1);
    g.fillStyle = C.ink; g.fillRect(0, 3, 16, 1);
    g.fillStyle = C.night;
    g.fillRect(0, 9, 16, 1); g.fillRect(7, 4, 1, 5); g.fillRect(3, 10, 1, 6); g.fillRect(12, 10, 1, 6);
  });
}

export function pipeTexture() {
  // 2x2 unidades: aro no topo e corpo embaixo
  return makeTexture(32, 32, (g) => {
    g.fillStyle = C.ink; g.fillRect(0, 0, 32, 12); g.fillRect(2, 12, 28, 20);
    g.fillStyle = C.violetMid; g.fillRect(1, 1, 30, 10); g.fillRect(3, 12, 26, 20);
    g.fillStyle = C.violet; g.fillRect(2, 2, 4, 8); g.fillRect(4, 12, 4, 20);
    g.fillStyle = C.violetDeep; g.fillRect(24, 2, 6, 8); g.fillRect(22, 12, 6, 20);
    g.fillStyle = C.ink; g.fillRect(1, 11, 30, 1);
  });
}

export function castleTexture() {
  // 5x4 unidades, porta no centro
  return makeTexture(80, 64, (g) => {
    g.fillStyle = C.ink; g.fillRect(8, 16, 64, 48);
    g.fillStyle = C.plum; g.fillRect(10, 18, 60, 46);
    g.fillStyle = C.ink;
    for (let i = 0; i < 5; i++) g.fillRect(8 + i * 14, 8, 10, 10);
    g.fillStyle = C.plum;
    for (let i = 0; i < 5; i++) g.fillRect(9 + i * 14, 9, 8, 9);
    g.fillStyle = C.night;
    for (let y = 22; y < 64; y += 8) g.fillRect(10, y, 60, 1);
    for (let y = 22, r = 0; y < 62; y += 8, r++) for (let x = 14 + (r % 2) * 7; x < 70; x += 14) g.fillRect(x, y, 1, 8);
    g.fillStyle = C.ink; g.fillRect(32, 34, 16, 30); g.fillRect(34, 31, 12, 3);
    g.fillStyle = C.night; g.fillRect(33, 35, 14, 29);
    g.fillStyle = C.violetDeep; g.fillRect(33, 33, 14, 2);
    g.fillStyle = C.gold; g.fillRect(16, 28, 4, 8); g.fillRect(60, 28, 4, 8);
    g.fillStyle = C.violet; g.fillRect(38, 0, 1, 9); g.fillRect(39, 1, 7, 4);
  });
}

export function poleTexture() {
  // mastro de 7 unidades, bolinha dourada no topo
  return makeTexture(16, 112, (g) => {
    g.fillStyle = C.ink; g.fillRect(7, 6, 2, 106);
    g.fillStyle = C.white; g.fillRect(7, 6, 1, 106);
    g.fillStyle = C.ink; g.fillRect(5, 0, 6, 6);
    g.fillStyle = C.gold; g.fillRect(6, 1, 4, 4);
  });
}

export function flagTexture() {
  return fromRows([
    'kkkkkkkkk.......',
    'krrrrrrrkkk.....',
    'krwrrrrrrrrkk...',
    'krrrrrrrrrrrrkk.',
    'krrrrrrrrrrkk...',
    'krrrrrrrkkk.....',
    'kkkkkkkk........',
  ], { k: C.ink, r: C.rose, w: C.white });
}

// ---- Fundo em camadas (parallax) ----

function lcg(seed) {
  let s = seed >>> 0;
  return () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296);
}

export function starsTexture(seed = 7) {
  return makeTexture(128, 128, (g) => {
    const rnd = lcg(seed);
    for (let i = 0; i < 40; i++) {
      const x = Math.floor(rnd() * 128), y = Math.floor(rnd() * 128);
      g.fillStyle = rnd() > 0.7 ? C.violet : '#4d4766';
      g.fillRect(x, y, 1, 1);
      if (rnd() > 0.85) { g.fillRect(x - 1, y, 3, 1); g.fillRect(x, y - 1, 1, 3); }
    }
  });
}

export function hillsTexture() {
  return makeTexture(256, 64, (g) => {
    g.fillStyle = '#150f26';
    for (let x = 0; x < 256; x++) {
      const h = 18 + Math.sin(x / 256 * Math.PI * 4) * 10 + Math.sin(x / 256 * Math.PI * 10 + 1) * 5;
      g.fillRect(x, 64 - Math.round(h), 1, Math.round(h));
    }
    g.fillStyle = '#1d1535';
    for (let x = 0; x < 256; x += 2) {
      const h = 18 + Math.sin(x / 256 * Math.PI * 4) * 10 + Math.sin(x / 256 * Math.PI * 10 + 1) * 5;
      g.fillRect(x, 64 - Math.round(h), 1, 1);
    }
  });
}

export function cloudsTexture() {
  return makeTexture(256, 128, (g) => {
    const cloud = (x, y, w) => {
      g.fillStyle = '#231a3e';
      g.fillRect(x + 4, y, w - 8, 4); g.fillRect(x, y + 4, w, 6);
      g.fillRect(x + 8, y - 4, 10, 4); g.fillRect(x + w - 22, y - 2, 12, 2);
      g.fillStyle = '#2d2250';
      g.fillRect(x + 2, y + 4, w - 4, 1);
    };
    cloud(14, 34, 44); cloud(112, 66, 56); cloud(192, 24, 40); cloud(70, 100, 36);
  });
}

// Placa de fase: texto em Pixelify Sans desenhado pequeno e ampliado em múltiplos inteiros.
export function signTexture(text) {
  const font = '700 10px "Pixelify Sans", monospace';
  const probe = document.createElement('canvas').getContext('2d');
  probe.font = font;
  const textW = Math.ceil(probe.measureText(text).width);
  const w = textW + 12;
  return {
    w,
    h: 28,
    tex: makeTexture(w, 28, (g) => {
      g.fillStyle = C.ink; g.fillRect(0, 0, w, 18);
      g.fillStyle = C.plum; g.fillRect(1, 1, w - 2, 16);
      g.fillStyle = C.violet; g.fillRect(1, 1, w - 2, 1);
      g.fillStyle = C.ink; g.fillRect(Math.floor(w / 2) - 1, 18, 3, 10);
      g.fillStyle = C.violetMid; g.fillRect(Math.floor(w / 2), 18, 1, 10);
      g.font = font;
      g.textBaseline = 'middle';
      g.fillStyle = C.gold;
      g.fillText(text, 6, 10);
    }),
  };
}
