const style=document.createElement('style');
style.textContent=`.pwa-install{position:fixed;left:12px;bottom:12px;z-index:9999;display:none;align-items:center;gap:6px;background:#111827;color:#fff;border-radius:999px;padding:7px 8px 7px 11px;box-shadow:0 10px 28px rgba(0,0,0,.20);font-size:11px;line-height:1;border:1px solid rgba(255,255,255,.08)}.pwa-install.show{display:flex}.pwa-install-label{font-weight:800;white-space:nowrap}.pwa-install button{border:0;border-radius:999px;font-weight:800;font-size:11px;line-height:1;padding:7px 10px;white-space:nowrap}.pwa-install .install{background:#fff;color:#111827}.pwa-install .dismiss{background:transparent;color:#cbd5e1;padding:7px 5px}.pwa-install-sub{display:none}@media(max-width:700px){.pwa-install{left:10px;bottom:calc(10px + env(safe-area-inset-bottom));gap:4px;padding:6px 7px 6px 10px}.pwa-install button{font-size:10px;padding:7px 9px}.pwa-install .dismiss{padding:7px 4px}}`;
document.head.appendChild(style);

let deferredPrompt=null;
let installBanner=null;

function isStandalone(){
  return window.matchMedia('(display-mode: standalone)').matches ||
    window.matchMedia('(display-mode: fullscreen)').matches ||
    window.navigator.standalone===true;
}

function isIOS(){
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent) ||
    (navigator.platform==='MacIntel' && navigator.maxTouchPoints>1);
}

function browserName(){
  const ua=window.navigator.userAgent;
  if(/crios/i.test(ua)) return 'Chrome';
  if(/fxios/i.test(ua)) return 'Firefox';
  if(/edgios/i.test(ua)) return 'Edge';
  if(/safari/i.test(ua) && !/chrome|android/i.test(ua)) return 'Safari';
  if(/android/i.test(ua) && /chrome/i.test(ua)) return 'Chrome';
  return 'your browser';
}

function removeBanner(){
  installBanner?.remove();
  installBanner=null;
}

function showBanner(){
  if(installBanner || isStandalone()) return;

  const ios=isIOS();
  const el=document.createElement('div');
  el.className='pwa-install';
  el.innerHTML=`<span class="pwa-install-label">Finance Hub</span><button class="install" type="button">${ios?'Install':'Install'}</button><button class="dismiss" type="button" aria-label="Dismiss">×</button>`;
  document.body.appendChild(el);
  installBanner=el;

  const installButton=el.querySelector('.install');

  if(ios){
    installButton.addEventListener('click',()=>{
      installButton.textContent='Share → Add to Home';
      installButton.style.background='#e5e7eb';
      installButton.style.color='#111827';
    });
  } else if(deferredPrompt){
    installButton.addEventListener('click',async()=>{
      const promptEvent=deferredPrompt;
      if(!promptEvent) return;
      promptEvent.prompt();
      await promptEvent.userChoice;
      deferredPrompt=null;
      removeBanner();
    });
  } else {
    installButton.addEventListener('click',()=>{
      installButton.textContent='Menu → Install';
    });
  }

  el.querySelector('.dismiss').addEventListener('click',removeBanner);
  requestAnimationFrame(()=>setTimeout(()=>el.classList.add('show'),50));
}

window.addEventListener('beforeinstallprompt',(event)=>{
  event.preventDefault();
  deferredPrompt=event;
  showBanner();
});

window.addEventListener('appinstalled',()=>{
  deferredPrompt=null;
  removeBanner();
});

if(!isStandalone()) setTimeout(showBanner,1200);

if('serviceWorker' in navigator){
  window.addEventListener('load',()=>navigator.serviceWorker.register('/sw.js').catch(console.error));
}
