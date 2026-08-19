const CACHE='finance-hub-v4';
const SHELL=['/','/index.html','/app.js','/dashboard-fx.js','/quick-add.js','/pwa-install.js','/mobile-nav.js','/account-actions.js','/finance-enhancements.js','/manifest.webmanifest','/icon.svg','/favicon.svg'];

self.addEventListener('install',(event)=>{
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(SHELL)).then(()=>self.skipWaiting()));
});

self.addEventListener('activate',(event)=>{
  event.waitUntil(
    caches.keys()
      .then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key))))
      .then(()=>self.clients.claim())
  );
});

self.addEventListener('fetch',(event)=>{
  const request=event.request;
  if(request.method!=='GET') return;
  const url=new URL(request.url);
  if(url.origin!==self.location.origin) return;

  const isShell=/\.(?:js|css|html|svg|webmanifest)$/.test(url.pathname)||url.pathname==='/';
  if(isShell){
    event.respondWith(
      caches.match(request).then(cached=>{
        const network=fetch(request).then(response=>{
          if(response.ok) caches.open(CACHE).then(cache=>cache.put(request,response.clone())).catch(()=>{});
          return response;
        }).catch(()=>cached||caches.match('/index.html'));
        return cached || network;
      })
    );
    return;
  }

  event.respondWith(
    fetch(request)
      .then(response=>{
        const copy=response.clone();
        caches.open(CACHE).then(cache=>cache.put(request,copy)).catch(()=>{});
        return response;
      })
      .catch(()=>caches.match(request).then(cached=>cached||caches.match('/index.html')))
  );
});
