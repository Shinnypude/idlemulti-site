# IdleMulti - site

Landing page estática do IdleMulti (HTML, CSS e JS puros, sem build). O código do app fica em outro repositório.

## Estrutura
- `index.html`: a página inteira.
- `styles.css`: visual (preto, títulos em pixel, brilho lilás, grade vertical).
- `main.js`: botão de download. Consulta a última release de `Shinnypude/idle-multi-releases` na API do GitHub. Se a release existir e tiver um `.exe`, o botão vira "Baixar para Windows X.Y.Z"; se não (repo privado ou sem release publicada), mostra "Em breve".
- `assets/`: logo, capturas do app e fontes (Pixelify Sans e JetBrains Mono, ambas OFL; as licenças estão em `assets/fonts/`).

## Ver localmente
```
python -m http.server 8123
```
Abra http://localhost:8123.

## Publicar (Cloudflare Pages, upload direto)
```
npx wrangler pages deploy . --project-name idlemulti-site
```
A primeira vez cria o projeto. O endereço fica `https://idlemulti-site.pages.dev`.

## Ligar o botão de download
Basta tornar público o repo `idle-multi-releases` e publicar a release (deixar de ser rascunho). O botão passa a funcionar sozinho, sem alterar o site.

## Depoimentos
Em `index.html`, o bloco `.quotes` está oculto (`hidden`) e comentado. Quando houver depoimentos reais, coloque-os ali e remova o atributo `hidden`.
