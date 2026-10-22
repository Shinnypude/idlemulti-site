// Porteiro do mundo 3D: só liga quando o aparelho aguenta. Quem pediu menos movimento recebe
// o modo calmo (a cena só acompanha o scroll). Se algo falhar, a página continua como era.
const root = document.documentElement;
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const wide = window.matchMedia('(min-width: 721px)');

let world = null;
let canvases = [];
let starting = false;

function capable() {
  if (!wide.matches) return false;
  if ((navigator.deviceMemory ?? 8) < 2) return false;
  if ((navigator.hardwareConcurrency ?? 4) < 2) return false;
  return true;
}

function stop() {
  world?.destroy();
  world = null;
  canvases.forEach((c) => c.remove());
  canvases = [];
  root.classList.remove('has-world');
}

async function start() {
  if (world || starting || !capable()) return;
  starting = true;
  try {
    const { createWorld } = await import('./scene.js');
    if (!capable()) return;
    canvases = ['world-back', 'world-front'].map((name) => {
      const c = document.createElement('canvas');
      c.className = `world-canvas ${name}`;
      c.setAttribute('aria-hidden', 'true');
      document.body.prepend(c);
      return c;
    });
    root.classList.add('has-world');
    world = await createWorld(canvases[0], canvases[1], { calm: reducedMotion.matches });
  } catch (err) {
    console.warn('Mundo 3D desativado:', err);
    stop();
  } finally {
    starting = false;
  }
}

function sync() {
  if (capable()) start(); else stop();
}

reducedMotion.addEventListener('change', () => { stop(); sync(); });
wide.addEventListener('change', sync);
sync();
