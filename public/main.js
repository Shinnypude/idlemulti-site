// Botão de download: acha o instalador da release mais recente publicada no repo de releases.
// Enquanto o repo estiver privado (ou sem release publicada), a API responde 404 e o botão fica "Em breve".
(() => {
  'use strict';
  const REPO = 'Shinnypude/idle-multi-releases';
  const API = `https://api.github.com/repos/${REPO}/releases/latest`;
  const buttons = [...document.querySelectorAll('.js-download')];
  const note = document.querySelector('.js-download-note');

  const setLabel = (btn, text) => {
    const span = btn.querySelector('.js-download-label');
    (span || btn).textContent = text;
  };

  function soon() {
    for (const btn of buttons) {
      btn.setAttribute('aria-disabled', 'true');
      btn.removeAttribute('href');
      setLabel(btn, 'Em breve');
    }
    if (note) note.textContent = 'O instalador para Windows será liberado em breve.';
  }

  // A versão serve só para achar o instalador; nunca aparece na tela.
  function ready(url) {
    for (const btn of buttons) {
      btn.href = url;
      btn.removeAttribute('aria-disabled');
      // botões grandes (com span, fora dos planos): "Baixar para Windows"; nav e planos: "Baixar"
      setLabel(btn, btn.querySelector('.js-download-label') && !btn.closest('.plan') ? 'Baixar para Windows' : 'Baixar');
    }
    if (note) note.textContent = 'Windows 10 e 11. Grátis para 2 contas, sem cartão.';
  }

  async function init() {
    try {
      const res = await fetch(API, { headers: { Accept: 'application/vnd.github+json' } });
      if (!res.ok) throw new Error(String(res.status));
      const rel = await res.json();
      const exe = (rel.assets || []).find((a) => /\.exe$/i.test(a.name));
      if (!exe) throw new Error('sem instalador');
      ready(exe.browser_download_url);
    } catch {
      soon();
    }
  }

  init();
})();
