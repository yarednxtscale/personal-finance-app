const style = document.createElement('style');
style.textContent = `.pwa-install{position:fixed;left:16px;right:16px;bottom:92px;z-index:9990;background:#111827;color:#fff;border-radius:16px;padding:14px 16px;display:none;align-items:center;gap:12px;box-shadow:0 18px 50px rgba(0,0,0,.22)}.pwa-install.show{display:flex}.pwa-install-text{flex:1;min-width:0}.pwa-install-title{font-weight:800;font-size:14px}.pwa-install-sub{font-size:11px;color:#cbd5e1;margin-top:3px;line-height:1.35}.pwa-install button{border:0;border-radius:10px;padding:9px 12px;font-weight:800;white-space:nowrap}.pwa-install .install{background:#fff;color:#111827}.pwa-install .dismiss{background:transparent;color:#cbd5e1}@media(max-width:700px){.pwa-install{left:14px;right:14px;bottom:82px;padding:12px 14px;border-radius:14px;gap:8px}.pwa-install-title{font-size:13px}.pwa-install-sub{font-size:10px}.pwa-install button{padding:8px 10px;font-size:12px}}`;
document.head.appendChild(style);

let deferredPrompt = null;
let installBanner = null;

function isStandalone(){
  return window.matchMedia('(display-mode: standalone)').matches || window.matchMedia('(display-mode: fullscreen)').matches || window.navigator.standalone === true;
}

function isIOS(){
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

function browserName(){
  const ua = window.navigator.userAgent;
  if(/crios/i.test(ua)) return 'Chrome';
  if(/fxios/i.test(ua)) return 'Firefox';
  if(/edgios/i.test(ua)) return 'Edge';
  if(/safari/i.test(ua) && !/chrome|android/i.test(ua)) return 'Safari';
  if(/android/i.test(ua) && /chrome/i.test(ua)) return 'Chrome';
  return 'your browser';
}

function showBanner(){
  if(installBanner || isStandalone()) return;

  const ios = isIOS();
  const el = document.createElement('div');
  el.className = 'pwa-install';
  el.innerHTML = `
    <div class="pwa-install-text">
      <div class="pwa-install-title">Install Finance Hub</div>
      <div class="pwa-install-sub"></div>
    </div>
    <button class="dismiss" type="button">Later</button>
    <button class="install" type="button">${ios ? 'How to install' : 'Install'}</button>`;

  document.body.appendChild(el);
  installBanner = el;

  const sub = el.querySelector('.pwa-install-sub');
  const installButton = el.querySelector('.install');

  if(ios){
    sub.textContent = 'On iPhone/iPad: tap Share, then Add to Home Screen.';
    installButton.addEventListener('click',()=>{
      sub.textContent = 'Tap the Share button in Safari, choose Add to Home Screen, then tap Add.';
      installButton.textContent = 'Got it';
    });
  } else if(deferredPrompt){
    sub.textContent = 'Add Finance Hub to your home screen for a full app experience.';
    installButton.addEventListener('click', async ()=>{
      if(!deferredPrompt) return;
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      deferredPrompt = null;
      el.remove();
      installBanner = null;
    });
  } else {
    sub.textContent = `Use ${browserName()} menu → Add to Home screen.`;
    installButton.textContent = 'How to install';
    installButton.addEventListener('click',()=>{
      sub.textContent = `Open the ${browserName()} menu and choose Add to Home screen or Install app.`;
      installButton.textContent = 'Got it';
    });
  }

  el.querySelector('.dismiss').addEventListener('click',()=>{
    el.remove();
    installBanner = null;
  });

  requestAnimationFrame(()=>setTimeout(()=>el.classList.add('show'),50));
}

window.addEventListener('beforeinstallprompt',(event)=>{
  event.preventDefault();
  deferredPrompt = event;
  showBanner();
});

window.addEventListener('appinstalled',()=>{
  deferredPrompt = null;
  document.querySelector('.pwa-install')?.remove();
  installBanner = null;
});

if(!isStandalone()) setTimeout(showBanner,1200);

if('serviceWorker' in navigator){
  window.addEventListener('load',()=>navigator.serviceWorker.register('/sw.js').catch(console.error));
}
