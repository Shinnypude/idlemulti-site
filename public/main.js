// Site do IdleMulti: botão de download, aviso de privacidade e aceite dos Termos antes de baixar.
// Sem cookies e sem rastreadores. O navegador guarda só duas chaves em localStorage:
//   im-aviso  -> "1" quando o visitante dispensou o aviso de privacidade
//   im-aceite -> {"version": TERMS_VERSION, "at": data ISO} quando aceitou os Termos para baixar
(() => {
  'use strict';

  // Versão atual dos Termos de Uso e da Política de Privacidade (a mesma do topo de termos.html e privacidade.html).
  // Ao mudar, quem já aceitou precisa aceitar de novo antes de baixar.
  const TERMS_VERSION = '2026-10-21';

  const REPO = 'Shinnypude/idle-multi-releases';
  const API = `https://api.github.com/repos/${REPO}/releases/latest`;
  const KEY_NOTICE = 'im-aviso';
  const KEY_ACCEPT = 'im-aceite';

  // localStorage pode faltar (modo privado, bloqueado): tudo funciona sem ele.
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch { /* sem armazenamento: só não lembra */ } },
  };

  // ---------- Botão de download ----------
  // Enquanto o repo estiver privado (ou sem release publicada), a API responde 404 e o botão fica "Em breve".
  const buttons = [...document.querySelectorAll('.js-download')];
  const note = document.querySelector('.js-download-note');
  let downloadUrl = null;

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
    downloadUrl = url;
    for (const btn of buttons) {
      btn.href = url;
      btn.removeAttribute('aria-disabled');
      // botões grandes (com span, fora dos planos): "Baixar para Windows"; nav e planos: "Baixar"
      setLabel(btn, btn.querySelector('.js-download-label') && !btn.closest('.plan') ? 'Baixar para Windows' : 'Baixar');
    }
    if (note) note.textContent = 'Windows 10 e 11. Grátis para 2 contas, sem cartão.';
  }

  async function initDownload() {
    if (!buttons.length) return;
    try {
      const res = await fetch(API, { headers: { Accept: 'application/vnd.github+json' } });
      if (!res.ok) throw new Error(String(res.status));
      const rel = await res.json();
      const exe = (rel.assets || []).find((a) => /\.exe$/i.test(a.name));
      if (!exe || !/^https:\/\//.test(exe.browser_download_url)) throw new Error('sem instalador');
      ready(exe.browser_download_url);
    } catch {
      soon();
    }
  }

  // ---------- Aceite dos Termos antes de baixar ----------
  function hasAccepted() {
    try {
      const v = JSON.parse(store.get(KEY_ACCEPT));
      return !!v && v.version === TERMS_VERSION;
    } catch {
      return false;
    }
  }

  let dialog = null;
  let trigger = null;

  function buildDialog() {
    const d = document.createElement('dialog');
    d.className = 'accept';
    d.setAttribute('aria-labelledby', 'accept-title');
    d.setAttribute('aria-describedby', 'accept-desc');
    d.innerHTML = `
      <div class="accept-body">
        <h2 class="pixel" id="accept-title">Antes de baixar</h2>
        <p id="accept-desc">Para baixar o IdleMulti, confirme que leu e aceita os documentos abaixo. Eles abrem em uma nova aba.</p>
        <label class="accept-check">
          <input type="checkbox" class="js-accept-box">
          <span>Li e aceito os <a href="/termos.html" target="_blank" rel="noopener">Termos de Uso</a> e a <a href="/privacidade.html" target="_blank" rel="noopener">Política de Privacidade</a></span>
        </label>
        <div class="accept-actions">
          <button type="button" class="btn btn-ghost js-accept-cancel">Cancelar</button>
          <button type="button" class="btn btn-solid js-accept-ok" disabled>Continuar e baixar</button>
        </div>
      </div>`;
    const box = d.querySelector('.js-accept-box');
    const ok = d.querySelector('.js-accept-ok');
    box.addEventListener('change', () => { ok.disabled = !box.checked; });
    d.querySelector('.js-accept-cancel').addEventListener('click', () => d.close());
    ok.addEventListener('click', () => {
      if (!box.checked || !downloadUrl) return;
      store.set(KEY_ACCEPT, JSON.stringify({ version: TERMS_VERSION, at: new Date().toISOString() }));
      const url = downloadUrl;
      d.close();
      window.location.href = url;
    });
    // Esc dispara "cancel" e fecha sem aceitar; ao fechar, o foco volta para o botão que abriu.
    d.addEventListener('close', () => {
      if (trigger && document.contains(trigger)) trigger.focus();
      trigger = null;
    });
    document.body.append(d);
    return d;
  }

  function openAccept(btn) {
    if (!dialog) dialog = buildDialog();
    trigger = btn;
    const box = dialog.querySelector('.js-accept-box');
    box.checked = false;
    dialog.querySelector('.js-accept-ok').disabled = true;
    dialog.showModal();
    box.focus();
  }

  document.addEventListener('click', (e) => {
    const btn = e.target instanceof Element ? e.target.closest('.js-download') : null;
    // Só intercepta quando o botão aponta para o instalador de verdade (não no "Em breve" nem antes da API responder).
    if (!btn || !downloadUrl || btn.getAttribute('href') !== downloadUrl) return;
    if (hasAccepted()) return; // já aceitou esta versão: baixa direto
    e.preventDefault();
    openAccept(btn);
  });

  // ---------- Aviso de privacidade ----------
  function initNotice() {
    if (store.get(KEY_NOTICE) === '1') return;
    const bar = document.createElement('div');
    bar.className = 'privacy-bar';
    bar.setAttribute('role', 'region');
    bar.setAttribute('aria-label', 'Aviso de privacidade');
    bar.innerHTML = `
      <p>Este site não usa cookies nem rastreadores. <a href="/privacidade.html">Política de Privacidade</a></p>
      <button type="button" class="btn btn-ghost">Entendi</button>`;
    bar.querySelector('button').addEventListener('click', () => {
      store.set(KEY_NOTICE, '1');
      bar.remove();
      document.documentElement.classList.remove('has-privacy-bar');
    });
    document.body.append(bar);
    document.documentElement.classList.add('has-privacy-bar');
  }

  initNotice();
  initDownload();
})();
