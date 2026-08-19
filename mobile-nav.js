const style = document.createElement('style');
style.textContent = `
  #mobile-nav-backdrop{position:fixed;inset:0;background:rgba(15,23,42,.38);z-index:9990;display:none}
  #mobile-nav-backdrop.open{display:block}
  @media(max-width:760px){
    .mobile-menu{display:flex !important;align-items:center;justify-content:center;width:42px;height:42px;border:1px solid var(--line);background:#fff;color:var(--text);border-radius:12px;font-size:21px;padding:0;box-shadow:0 4px 14px rgba(23,32,51,.08);flex:0 0 auto}
    .sidebar{position:fixed !important;left:-280px !important;top:0 !important;bottom:0 !important;height:100dvh !important;z-index:9991 !important;transition:left .18s ease !important}
    .sidebar.open{left:0 !important;box-shadow:18px 0 45px rgba(15,23,42,.24)}
    .main{width:100%;min-width:0}
    .topbar>div:first-child{display:flex !important;align-items:center !important;gap:10px !important;min-width:0}
  }
`;
document.head.appendChild(style);

function closeMenu(){
  document.querySelector('.sidebar')?.classList.remove('open');
  document.querySelector('#mobile-nav-backdrop')?.classList.remove('open');
}

function openMenu(){
  const sidebar=document.querySelector('.sidebar');
  if(!sidebar) return;
  sidebar.classList.add('open');
  document.querySelector('#mobile-nav-backdrop')?.classList.add('open');
}

function setup(){
  const sidebar=document.querySelector('.sidebar');
  const topbar=document.querySelector('.topbar');
  if(!sidebar || !topbar) return;

  const first=topbar.firstElementChild;
  if(first){
    let button=document.querySelector('#mobile-nav-toggle');
    if(!button){
      button=document.createElement('button');
      button.id='mobile-nav-toggle';
      button.className='mobile-menu';
      button.type='button';
      button.setAttribute('aria-label','Open navigation');
      button.setAttribute('title','Open navigation');
      button.textContent='☰';
      button.addEventListener('click',(event)=>{event.preventDefault();event.stopPropagation();openMenu();});
      first.prepend(button);
    }
  }

  let backdrop=document.querySelector('#mobile-nav-backdrop');
  if(!backdrop){
    backdrop=document.createElement('div');
    backdrop.id='mobile-nav-backdrop';
    backdrop.addEventListener('click',closeMenu);
    document.body.appendChild(backdrop);
  }

  sidebar.querySelectorAll('[data-nav]').forEach((item)=>{
    if(item.dataset.mobileBound==='1') return;
    item.dataset.mobileBound='1';
    item.addEventListener('click',()=>setTimeout(closeMenu,0),true);
  });
  sidebar.querySelector('#signout')?.addEventListener('click',()=>setTimeout(closeMenu,0),true);
}

const observer=new MutationObserver(setup);
observer.observe(document.body,{childList:true,subtree:true});
setup();
