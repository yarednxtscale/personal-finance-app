const style = document.createElement('style');
style.id = 'finance-ui-polish-v2';
style.textContent = `
body{
  position:relative;
  isolation:isolate;
  overflow-x:hidden;
  background:linear-gradient(120deg,#eef2f8,#e8efff 34%,#eef8f4 67%,#eef2f8 100%) !important;
  background-size:320% 320%;
  animation:finance-bg-shift 22s ease-in-out infinite;
}
body::before,body::after{
  content:"";
  position:fixed;
  pointer-events:none;
  z-index:-1;
  border-radius:999px;
  filter:blur(60px);
  transform:translate3d(0,0,0);
}
body::before{
  width:48vw;height:48vw;min-width:380px;min-height:380px;
  right:-14vw;top:-14vw;
  background:radial-gradient(circle at 35% 35%,rgba(86,126,255,.34),rgba(86,126,255,0) 70%);
  animation:finance-orb-a 16s ease-in-out infinite alternate;
}
body::after{
  width:44vw;height:44vw;min-width:340px;min-height:340px;
  left:-12vw;bottom:-14vw;
  background:radial-gradient(circle at 60% 45%,rgba(50,205,160,.22),rgba(50,205,160,0) 70%);
  animation:finance-orb-b 20s ease-in-out infinite alternate;
}
.app,.main{background:transparent !important}
.card{background:rgba(255,255,255,.9)!important;backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px)}
.ui-section-title{padding:10px 12px 4px;font-size:10px;line-height:1;text-transform:uppercase;letter-spacing:.12em;color:#8492aa;font-weight:800;pointer-events:none}
.ui-nav-spacer{flex:1 1 auto;min-height:10px}
.ui-trash-wrap{margin-top:8px;padding-top:12px;border-top:1px solid rgba(148,163,184,.2)}
.ui-trash-wrap button{width:100%;color:#f6b5ae!important}
.ui-trash-wrap button:hover{background:rgba(192,57,43,.12)!important;color:#fff!important}
@keyframes finance-bg-shift{0%,100%{background-position:0% 50%}50%{background-position:100% 50%}}
@keyframes finance-orb-a{from{transform:translate3d(-2vw,2vh,0) scale(1)}to{transform:translate3d(3vw,8vh,0) scale(1.12)}}
@keyframes finance-orb-b{from{transform:translate3d(0,-2vh,0) scale(1)}to{transform:translate3d(5vw,-6vh,0) scale(1.1)}}
@media(prefers-reduced-motion:reduce){body{animation:none}body::before,body::after{animation:none}}
@media(max-width:760px){body{background-size:260% 260%}.ui-section-title{padding-top:12px}}
`;
document.head.appendChild(style);

const navButtons = () => [...document.querySelectorAll('.sidebar .nav button')];
const findNavButton = (label) => navButtons().find((b) => b.textContent.trim().toLowerCase() === label.toLowerCase());
const managerButton = (key) => document.querySelector(`.sidebar .nav [data-mx="${key}"]`);

function renameSavings(){
  navButtons().forEach((button)=>{
    if(button.textContent.trim()==='Savings Goals') button.textContent='Savings';
  });
  document.querySelectorAll('.topbar h1').forEach((heading)=>{
    if(heading.textContent.trim()==='Savings Goals') heading.textContent='Savings';
  });
}

function bindManagementRouting(){
  const routes=[
    ['Transactions','transactions'],
    ['Budgets','budgets'],
    ['Bills','bills'],
    ['Savings','goals'],
    ['Debts','debts'],
  ];
  routes.forEach(([label,key])=>{
    const native=findNavButton(label);
    const manager=managerButton(key);
    if(!native||!manager||native===manager||native.dataset.financeRouteBound==='1') return;
    native.dataset.financeRouteBound='1';
    native.addEventListener('click',(event)=>{
      event.preventDefault();
      event.stopImmediatePropagation();
      manager.click();
    },{capture:true});
  });
}

function organizeSidebar(){
  const sidebar=document.querySelector('.sidebar');
  const nav=sidebar?.querySelector('.nav');
  if(!sidebar||!nav) return;

  renameSavings();
  bindManagementRouting();

  const items={
    dashboard:findNavButton('Dashboard'),
    income:nav.querySelector('[data-income-tab]')||findNavButton('My Income'),
    transactions:findNavButton('Transactions'),
    accounts:findNavButton('Accounts'),
    budgets:findNavButton('Budgets'),
    bills:findNavButton('Bills'),
    savings:findNavButton('Savings'),
    projected:managerButton('projected-expenses')||findNavButton('Projected Expenses'),
    debts:findNavButton('Debts')||nav.querySelector('[data-debt-page]'),
    settings:findNavButton('Settings'),
  };

  const desired=[
    ['Overview',[items.dashboard]],
    ['Money & Planning',[items.income,items.transactions,items.accounts,items.budgets,items.bills,items.savings,items.projected]],
    ['Debt & System',[items.debts,items.settings]],
  ];

  const marker=desired.flatMap(([section,buttons])=>[section,...buttons.filter(Boolean).map((b)=>b.dataset.mx||b.dataset.incomeTab||b.dataset.debtPage||b.dataset.nav||b.textContent.trim())]).join('|');
  if(nav.dataset.financeSidebarMarker===marker){ placeTrashBottom(sidebar); return; }

  nav.innerHTML='';
  desired.forEach(([section,buttons])=>{
    const valid=buttons.filter(Boolean);
    if(!valid.length) return;
    const heading=document.createElement('div');
    heading.className='ui-section-title';
    heading.textContent=section;
    nav.appendChild(heading);
    valid.forEach((button)=>{
      button.style.display='';
      nav.appendChild(button);
    });
  });
  nav.dataset.financeSidebarMarker=marker;
  placeTrashBottom(sidebar);
}

function placeTrashBottom(sidebar){
  const trash=[...sidebar.querySelectorAll('button,a')].find((element)=>element.textContent.trim().toLowerCase()==='trash bin');
  if(!trash) return;
  let wrap=sidebar.querySelector('.ui-trash-wrap');
  if(!wrap){
    wrap=document.createElement('div');
    wrap.className='ui-trash-wrap';
  }
  if(trash.parentElement!==wrap) wrap.appendChild(trash);

  let spacer=sidebar.querySelector('.ui-nav-spacer');
  if(!spacer){
    spacer=document.createElement('div');
    spacer.className='ui-nav-spacer';
  }
  const foot=sidebar.querySelector('.sidebar-foot');
  if(foot){
    if(spacer.parentElement!==sidebar) sidebar.insertBefore(spacer,foot);
    else sidebar.insertBefore(spacer,foot);
    if(wrap.parentElement!==sidebar) sidebar.insertBefore(wrap,foot);
    else sidebar.insertBefore(wrap,foot);
  }else{
    if(spacer.parentElement!==sidebar) sidebar.appendChild(spacer);
    if(wrap.parentElement!==sidebar) sidebar.appendChild(wrap);
  }
}

let lastRoot=document.querySelector('#root');
const refresh=()=>{ const root=document.querySelector('#root'); if(root!==lastRoot){ lastRoot=root; setTimeout(organizeSidebar,30); } else organizeSidebar(); };

setTimeout(organizeSidebar,150);
setTimeout(organizeSidebar,700);
setTimeout(organizeSidebar,1500);
setInterval(refresh,1000);
window.addEventListener('pageshow',organizeSidebar);
