# IdleMulti - site

Landing page estática do IdleMulti (HTML, CSS e JS puros, sem build). O código do app fica em outro repositório.

## Estrutura
- `public/index.html`: a página inteira.
- `public/styles.css`: visual (preto, títulos em pixel, brilho lilás, grade vertical).
- `public/main.js`: botão de download. Consulta a última release de `Shinnypude/idle-multi-releases` na API do GitHub. Se a release existir e tiver um `.exe`, o botão vira "Baixar para Windows X.Y.Z"; se não (repo privado ou sem release publicada), mostra "Em breve".
- `public/assets/`: logo, capturas do app e fontes (Pixelify Sans e JetBrains Mono, ambas OFL; as licenças estão em `public/assets/fonts/`).
- `wrangler.jsonc`: publica só a pasta `public/` (nada da raiz do repo vai ao ar).

## Ver localmente
```
python -m http.server 8123 --directory public
```
Abra http://localhost:8123.

## Publicar (Cloudflare, upload direto)
```
npx wrangler deploy
```
Endereço atual: https://idlemulti-site.geovaneleal80.workers.dev

## Ligar o botão de download
Basta tornar público o repo `idle-multi-releases` e publicar a release (deixar de ser rascunho). O botão passa a funcionar sozinho, sem alterar o site.

## Depoimentos
Em `public/index.html`, o bloco `.quotes` está oculto (`hidden`) e comentado. Quando houver depoimentos reais, coloque-os ali e remova o atributo `hidden`.
