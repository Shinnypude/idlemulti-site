// O site saiu da Cloudflare e mora na Vercel. Este Worker só existe porque versões antigas do app
// têm este endereço embutido (Termos e Privacidade): redireciona tudo, mantendo caminho e query.
const NOVO = 'https://idlemulti.vercel.app';

export default {
  fetch(request) {
    const { pathname, search } = new URL(request.url);
    return Response.redirect(NOVO + pathname + search, 301);
  },
};
