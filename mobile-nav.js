const style = document.createElement('style');
style.textContent = `
  #mobile-nav-backdrop{position:fixed;inset:0;background:rgba(15,23,42,.38);z-index:29;display:none}
  #mobile-nav-backdrop.open{display:block}
  @media(max-width:760px){
    .mobile-menu{display:inline-flex !important;align-items:center;justify-content:center;width:40px;height:40px;border:1px solid var(--line);background:#fff;color:var(--text);border-radius:12px;font-size:20px;padding:0;box-shadow:0 4px 14px rgba(23,32,51,.08)}
    .sidebar.open{box-shadow:18px 0 45px rgba(15,23,42,.24)}
  }
`;
document.head.appendChild(style);

function closeMenu(){
  document.querySelector('.sidebar')?.classList.remove('open');
  document.querySelector('#mobile-nav-backdrop')?.classList.remove('open');
}

function openMenu(){
  document.querySelector('.sidebar')?.classList.add('open');
  document.querySelector('#mobile-nav-backdrop')?.classList.add('open');
}

function setup(){
  const root = document.querySelector('#root');
  if(!root) return;
  const sidebar = document.querySelector('.sidebar');
  const topbar = document.querySelector('.topbar');
  if(!sidebar || !topbar) return;

  let button = document.querySelector('#mobile-nav-toggle');
  if(!button){
    const first = topbar.firstElementChild;
    button = document.createElement('button');
    button.id = 'mobile-nav-toggle';
    button.className = 'mobile-menu';
    button.type = 'button';
    button.setAttribute('aria-label','Open navigation');
    button.textContent = '☰';
    button.addEventListener('click', openMenu);
    first?.prepend(button);
  }

  let backdrop = document.querySelector('#mobile-nav-backdrop');
  if(!backdrop){
    backdrop = document.createElement('div');
    backdrop.id = 'mobile-nav-backdrop';
    backdrop.addEventListener('click', closeMenu);
    document.body.appendChild(backdrop);
  }

  sidebar.querySelectorAll('[data-nav]').forEach((item)=>{
    if(item.dataset.mobileBound) return;
    item.dataset.mobileBound='1';
    item.addEventListener('click', closeMenu, true);
  });
  sidebar.querySelector('#signout')?.addEventListener('click', closeMenu, true);
}

const observer = new MutationObserver(setup);
observer.observe(document.body,{childList:true,subtree:true});
setup();
