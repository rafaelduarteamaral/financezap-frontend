const CACHE_NAME = 'zela-v1';
const urlsToCache = [
  '/',
  '/index.html'
];

// Instalação do Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('✅ Service Worker: Cache aberto');
        // Tenta adicionar os arquivos ao cache, mas não falha se alguns não existirem
        return cache.addAll(urlsToCache).catch((err) => {
          console.log('⚠️ Service Worker: Alguns arquivos não puderam ser cacheados:', err);
        });
      })
  );
  // Força a ativação imediata do novo service worker
  self.skipWaiting();
});

// Ativação do Service Worker
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️ Service Worker: Removendo cache antigo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  // Assume controle de todas as páginas imediatamente
  return self.clients.claim();
});

// Estratégia: Network First, fallback para Cache
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Para requisições de API, NÃO intercepta - deixa passar direto
  // Isso garante que headers de autenticação sejam preservados 100%
  if (url.pathname.startsWith('/api/')) {
    // Não intercepta requisições de API - deixa passar direto para a rede
    // Isso evita qualquer problema com headers ou body
    return;
  }
  
  // Para outros recursos (HTML, CSS, JS, imagens), usa cache
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Só cacheia respostas bem-sucedidas e que não sejam de API
        if (response.status === 200 && !url.pathname.startsWith('/api/')) {
          // Clona a resposta
          const responseToCache = response.clone();
          
          // Adiciona ao cache
          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache);
            });
        }
        
        return response;
      })
      .catch(() => {
        // Se a rede falhar, tenta buscar do cache (apenas para recursos estáticos)
        if (!url.pathname.startsWith('/api/')) {
          return caches.match(event.request);
        }
        // Para APIs, retorna erro se a rede falhar
        return new Response('Network error', { status: 503 });
      })
  );
});

