const style = document.createElement('style');
style.textContent = `.pwa-install{position:fixed;left:16px;right:16px;bottom:16px;z-index:100;background:#111827;color:#fff;border-radius:16px;padding:14px 16px;display:none;align-items:center;gap:12px;box-shadow:0 18px 50px rgba(0,0,0,.22)}.pwa-install.show{display:flex}.pwa-install-text{flex:1}.pwa-install-title{font-weight:800;font-size:14px}.pwa-install-sub{font-size:11px;color:#cbd5e1;margin-top:2px}.pwa-install button{border:0;border-radius:10px;padding:9px 12px;font-weight:800}.pwa-install .install{background:#fff;color:#111827}.pwa-install .dismiss{background:transparent;color:#cbd5e1}`;
document.head.appendChild(style);

let deferredPrompt = null;
function banner(){
  if(document.querySelector('.pwa-install') || window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone) return;
  const el = document.createElement('div');
  el.className = 'pwa-install';
  el.innerHTML = `<div class="pwa-install-text"><div class="pwa-install-title">Install Finance Hub</div><div class="pwa-install-sub">Use it like a mobile app from your home screen.</div></div><button class="dismiss" type="button">Later</button><button class="install" type="button">Install</button>`;
  document.body.appendChild(el);
  el.querySelector('.dismiss').addEventListener('click',()=>el.remove());
  el.querySelector('.install').addEventListener('click', async ()=>{
    if(!deferredPrompt){ el.querySelector('.pwa-install-sub').textContent='Use your browser menu → Add to Home screen.'; return; }
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    deferredPrompt = null;
    el.remove();
  });
  setTimeout(()=>el.classList.add('show'), 900);
}
window.addEventListener('beforeinstallprompt',(e)=>{e.preventDefault();deferredPrompt=e;banner()});
window.addEventListener('appinstalled',()=>document.querySelector('.pwa-install')?.remove());
if(!window.matchMedia('(display-mode: standalone)').matches && !window.navigator.standalone) setTimeout(banner,1500);
if('serviceWorker' in navigator) window.addEventListener('load',()=>navigator.serviceWorker.register('/sw.js').catch(console.error));
