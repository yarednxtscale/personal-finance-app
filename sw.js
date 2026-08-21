const CACHE='finance-hub-v5';
const SHELL=[
  '/',
  '/index.html',
  '/app.js',
  '/dashboard-fx.js',
  '/quick-add.js',
  '/pwa-install.js',
  '/mobile-nav.js',
  '/mobile-ui.js',
  '/account-actions.js',
  '/finance-enhancements.js',
  '/finance-enhancements-v2.js',
  '/finance-management-v2.js',
  '/management-ui.js',
  '/income-tab.js',
  '/trash-bin.js',
  '/ui-stability-selection.js',
  '/ui-hardening.js',
  '/manifest.webmanifest',
  '/icon.svg',
  '/favicon.svg'
];

self.addEventListener('install',(event)=>{
  event.waitUntil(
    caches.open(CACHE)
      .then((cache)=>cache.addAll(SHELL))
      .then(()=>self.skipWaiting())
  );
});

self.addEventListener('activate',(event)=>{
  event.waitUntil(
    caches.keys()
      .then((keys)=>Promise.all(keys.filter((key)=>key!==CACHE).map((key)=>caches.delete(key))))
      .then(()=>self.clients.claim())
  );
});

self.addEventListener('fetch',(event)=>{
  const request=event.request;
  if(request.method!=='GET') return;
  const url=new URL(request.url);
  if(url.origin!==self.location.origin) return;

  const isAppAsset=/\.(?:js|css|html|svg|webmanifest)$/.test(url.pathname)||url.pathname==='/';
  if(isAppAsset){
    event.respondWith(
      fetch(request)
        .then((response)=>{
          if(response.ok){
            caches.open(CACHE).then((cache)=>cache.put(request,response.clone())).catch(()=>{});
          }
          return response;
        })
        .catch(()=>caches.match(request).then((cached)=>cached||caches.match('/index.html')))
    );
    return;
  }

  event.respondWith(
    fetch(request)
      .then((response)=>{
        const copy=response.clone();
        caches.open(CACHE).then((cache)=>cache.put(request,copy)).catch(()=>{});
        return response;
      })
      .catch(()=>caches.match(request).then((cached)=>cached||caches.match('/index.html')))
  );
});
