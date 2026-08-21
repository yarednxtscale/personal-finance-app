const root = document.documentElement;
const body = document.body;

const style = document.createElement('style');
style.id = 'ui-stability-selection-styles';
style.textContent = `
  html, body, #root { width:100%; max-width:100%; min-width:0; }
  @media (max-width:760px){
    html,body{overflow-x:hidden !important}
    .app,.main,.topbar,.card,.fm-page,.fm-card,.grid,.grid-2,.grid-3,.grid-4,.table-wrap{min-width:0;max-width:100%;}
    .main{overflow-x:clip;width:100%;}
    .table-wrap{overflow-x:auto !important;-webkit-overflow-scrolling:touch;}
    .table{min-width:0 !important;width:100% !important;table-layout:fixed;}
    .table th,.table td{white-space:normal !important;overflow-wrap:anywhere;word-break:break-word;}
    button,input,select,textarea{max-width:100%;}
    .fm-toolbar,.fm-toolbar-left,.fm-toolbar-right{min-width:0;max-width:100%;}
    .fm-toolbar-left,.fm-toolbar-right{flex:1 1 100%;}
    .fm-bulk{position:sticky;bottom:calc(70px + env(safe-area-inset-bottom));z-index:100;}
    .fm-row{width:100%;max-width:100%;}
  }
  .ui-selection-toolbar{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;margin:0 0 12px;padding:10px 12px;border:1px solid var(--line);border-radius:14px;background:rgba(255,255,255,.88);}
  .ui-selection-toolbar label{display:inline-flex;align-items:center;gap:8px;font-weight:800;}
  .ui-selection-toolbar input,.ui-selection-cell input{width:20px;height:20px;accent-color:var(--brand);}
  .ui-selection-toolbar .count{font-size:12px;color:var(--muted);}
  .ui-selection-cell{display:inline-flex;align-items:center;justify-content:center;margin-right:8px;vertical-align:middle;}
  .ui-selected{outline:2px solid rgba(143,161,255,.45);background:#f8faff !important;}
`;
document.head.appendChild(style);

const pageTitle = () => (document.querySelector('.topbar h1')?.textContent || '').trim().toLowerCase();
const isMobile = () => window.matchMedia('(max-width:760px)').matches;

function addTableSelection(table){
  if(!table || table.dataset.selectionEnhanced==='1') return;
  const rows = [...table.querySelectorAll('tbody tr')].filter(r => r.children.length && !r.querySelector('.empty'));
  if(!rows.length) return;
  table.dataset.selectionEnhanced='1';
  const head = table.querySelector('thead tr');
  if(!head) return;
  const th=document.createElement('th');
  th.innerHTML='<input type="checkbox" aria-label="Select all rows">';
  head.prepend(th);
  const selectAll=th.querySelector('input');
  rows.forEach((row,index)=>{
    const td=document.createElement('td');
    td.innerHTML='<input type="checkbox" aria-label="Select row">';
    td.className='ui-selection-cell';
    row.prepend(td);
    const check=td.querySelector('input');
    check.addEventListener('change',()=>{
      row.classList.toggle('ui-selected',check.checked);
      sync();
    });
  });
  function sync(){
    const checks=rows.map(r=>r.querySelector('td:first-child input')).filter(Boolean);
    const n=checks.filter(c=>c.checked).length;
    selectAll.checked=n===checks.length;
    selectAll.indeterminate=n>0&&n<checks.length;
    const counter=table.closest('.card')?.querySelector('.ui-selection-toolbar .count');
    if(counter) counter.textContent=`${n} selected`;
  }
  selectAll.addEventListener('change',()=>{
    rows.forEach(r=>{const c=r.querySelector('td:first-child input');if(c){c.checked=selectAll.checked;r.classList.toggle('ui-selected',c.checked)}});
    sync();
  });
}

function addCardSelection(){
  const title=pageTitle();
  if(!['accounts','budgets','bills','savings goals','debts','transactions'].includes(title)) return;
  const main=document.querySelector('.main');
  if(!main || main.querySelector('.fm-toolbar') || main.querySelector('.ui-selection-toolbar')) return;
  const cards=[...main.querySelectorAll('.grid > .card')].filter(c=>!c.closest('.topbar'));
  if(title==='accounts'){
    const candidates=[...main.querySelectorAll('.grid.grid-3 > .card')].filter(c=>c.querySelector('[data-delete-account]'));
    if(!candidates.length)return;
    installCardToolbar(main,candidates);
  }
}

function installCardToolbar(main,cards){
  if(main.querySelector('.ui-selection-toolbar'))return;
  const toolbar=document.createElement('div');
  toolbar.className='ui-selection-toolbar';
  toolbar.innerHTML=`<label><input type="checkbox" aria-label="Select all"> Select all</label><span class="count">0 selected</span>`;
  const anchor=main.querySelector('.card');
  anchor?.parentNode?.insertBefore(toolbar,anchor);
  const selectAll=toolbar.querySelector('input');
  cards.forEach(card=>{
    if(card.querySelector('.ui-card-check'))return;
    const wrap=document.createElement('label');
    wrap.className='ui-selection-cell ui-card-check';
    wrap.innerHTML='<input type="checkbox" aria-label="Select item">';
    card.querySelector('h3')?.before(wrap);
    const check=wrap.querySelector('input');
    check.addEventListener('change',()=>{card.classList.toggle('ui-selected',check.checked);sync()});
  });
  function sync(){
    const checks=cards.map(c=>c.querySelector('.ui-card-check input')).filter(Boolean);
    const n=checks.filter(c=>c.checked).length;
    selectAll.checked=n===checks.length&&checks.length>0;
    selectAll.indeterminate=n>0&&n<checks.length;
    toolbar.querySelector('.count').textContent=`${n} selected`;
  }
  selectAll.addEventListener('change',()=>{cards.forEach(c=>{const x=c.querySelector('.ui-card-check input');if(x){x.checked=selectAll.checked;c.classList.toggle('ui-selected',x.checked)}});sync()});
}

function enhance(){
  if(isMobile()){
    root.style.maxWidth='100%';
    body.style.maxWidth='100%';
    body.style.overflowX='hidden';
  }
  document.querySelectorAll('.table').forEach(addTableSelection);
  addCardSelection();
}

let timer;
const observer=new MutationObserver(()=>{clearTimeout(timer);timer=setTimeout(enhance,80)});
observer.observe(document.body,{childList:true,subtree:true});
window.addEventListener('resize',enhance);
enhance();
