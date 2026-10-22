// Onde cada marco da fase fica no mundo, calculado a partir das seções reais da página.
// toX(s) converte uma posição de scroll (px) na posição do herói naquele momento.

const absTop = (el) => el.getBoundingClientRect().top + window.scrollY;

export function measureStops(toX) {
  const vh = window.innerHeight;
  const max = Math.max(0, document.documentElement.scrollHeight - vh);
  const sec = (id) => {
    const el = document.getElementById(id);
    const top = absTop(el);
    return { top, bottom: top + el.offsetHeight };
  };
  const demo = sec('demo');
  const ben = sec('beneficios');
  const plans = sec('planos');
  const faq = sec('faq');
  const cards = [...document.querySelectorAll('#beneficios .feat')];
  const ahead = (s) => toX(Math.max(s, 300)); // nunca em cima do herói parado

  return {
    cards,
    signs: [
      { text: 'FASE 1-1  DEMO', x: ahead(demo.top - vh * 0.75) },
      { text: 'FASE 1-2  BENEFICIOS', x: ahead(ben.top - vh * 0.75) },
      { text: 'FASE 1-3  PLANOS', x: ahead(plans.top - vh * 0.95) },
      { text: 'FASE 1-4  PERGUNTAS', x: ahead(faq.top - vh * 0.75) },
    ],
    // Um bloco "?" por card; cards na mesma linha ganham um passo de distância entre si.
    blocks: cards.map((c, i) => toX(absTop(c) + c.offsetHeight / 2 - vh * 0.7 + (i % 3) * 90)),
    // Cano de entrada e cano de saída em volta da seção de planos.
    pipes: [toX(plans.top - vh * 0.6), toX(plans.bottom - vh * 0.4)],
    flag: toX(max) - 3.6,
    castle: toX(max) + 0.3,
  };
}
