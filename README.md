# IdleMulti - site

Landing page estática do IdleMulti (HTML, CSS e JS puros, sem build). O código do app fica em outro repositório.

## Estrutura
- `public/index.html`: a página inicial.
- `public/termos.html` e `public/privacidade.html`: Termos de Uso e Política de Privacidade (versão `2026-10-21`, no topo de cada página).
- `public/styles.css`: visual (preto, títulos em pixel, brilho lilás, grade vertical), inclusive as páginas legais, o aviso de privacidade e o diálogo de aceite.
- `public/main.js`:
  - botão de download: consulta a última release de `Shinnypude/idle-multi-releases` na API do GitHub só para achar o `.exe`. Se existir, o botão vira "Baixar para Windows" (nav e planos: "Baixar"), sem número de versão; se não (repo privado ou sem release publicada), mostra "Em breve";
  - aviso de privacidade no rodapé da tela ("Entendi" guarda `im-aviso` no `localStorage`);
  - aceite antes de baixar: o primeiro clique em baixar abre um diálogo "Li e aceito os Termos de Uso e a Política de Privacidade"; o aceite fica em `im-aceite` (`{version, at}`). A constante `TERMS_VERSION` no topo do arquivo define a versão; ao mudá-la (junto com a data nas duas páginas), o site pede o aceite de novo.
- `public/_headers`: cabeçalhos de segurança aplicados pela Cloudflare (CSP estrita sem `unsafe-inline`, anti-iframe, nosniff, HSTS etc.). Por causa da CSP, nada de `style="..."`, `<script>` inline ou `onclick` no HTML: use classes e `main.js`.
- `public/assets/`: logo, capturas do app e fontes (Pixelify Sans e JetBrains Mono, ambas OFL; as licenças estão em `public/assets/fonts/`).
- `scripts/serve.mjs`: servidor local sem dependências que serve `public/` e aplica os cabeçalhos de `public/_headers`.
- `wrangler.jsonc`: publica só a pasta `public/` (nada da raiz do repo vai ao ar).

O site não usa cookies, rastreadores nem analytics.

## Ver localmente
```
node scripts/serve.mjs
```
Abra http://localhost:8123. O servidor aplica os mesmos cabeçalhos de `public/_headers` (CSP inclusive), então erros de CSP aparecem como apareceriam no ar. Para outra porta: `PORT=9000 node scripts/serve.mjs`.

## Publicar (Cloudflare, upload direto)
```
npx wrangler deploy
```
Endereço atual: https://idlemulti-site.geovaneleal80.workers.dev

## Ligar o botão de download
Basta tornar público o repo `idle-multi-releases` e publicar a release (deixar de ser rascunho). O botão passa a funcionar sozinho, sem alterar o site.

## Depoimentos
Em `public/index.html`, o bloco `.quotes` está oculto (`hidden`) e comentado. Quando houver depoimentos reais, coloque-os ali e remova o atributo `hidden`.
