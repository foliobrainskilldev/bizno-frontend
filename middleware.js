export const config = {
  // Executar o middleware em todas as rotas, EXCETO na pasta assets
  matcher: [
    '/((?!assets|_next/static|_next/image|favicon.ico).*)',
  ],
};

export default function middleware(req) {
  const url = new URL(req.url);
  const hostname = req.headers.get('host') || '';

  // Ignorar ficheiros estáticos específicos e assets
  if (url.pathname.startsWith('/assets') || url.pathname.includes('.')) {
    // Se já tem extensão (ex: .css, .js, .xml, .txt), deixa passar nativamente
    return new Response(null, { headers: { 'x-middleware-next': '1' } });
  }

  // 1. LÓGICA DE SUBDOMÍNIOS
  const isMainDomain = 
    hostname === 'bizno.store' || 
    hostname === 'www.bizno.store' || 
    hostname.includes('vercel.app') || 
    hostname.includes('localhost');

  if (!isMainDomain) {

    url.pathname = '/catalogo.html';
    return new Response(null, {
      headers: {
        'x-middleware-rewrite': url.toString(),
      },
    });
  }

 
  if (url.pathname === '/') {
    url.pathname = '/index.html';
    return new Response(null, {
      headers: { 'x-middleware-rewrite': url.toString() },
    });
  }


  if (!url.pathname.includes('.')) {
    url.pathname = `${url.pathname}.html`;
    return new Response(null, {
      headers: { 'x-middleware-rewrite': url.toString() },
    });
  }

 
  return new Response(null, {
    headers: { 'x-middleware-next': '1' },
  });
}