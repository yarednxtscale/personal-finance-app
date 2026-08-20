import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const SUPABASE_URL = 'https://hznphzpukdwxyqgqksrx.supabase.co';
const SUPABASE_KEY = 'sb_publishable_1CgZ5bRDG7tSltHDwIc5HQ_w1SQFR-9';
const db = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: true, autoRefreshToken: true } });

const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
const num = (v) => Number(v) || 0;
const today = () => new Date().toISOString().slice(0, 10);
const money = (v, c='ETB') => new Intl.NumberFormat('en-US', { style:'currency', currency:c === 'USD' ? 'USD' : 'ETB', maximumFractionDigits:2 }).format(num(v));
const dateText = (v) => v ? new Date(`${String(v).slice(0,10)}T00:00:00`).toLocaleDateString(undefined,{year:'numeric',month:'short',day:'numeric'}) : '—';

const css = document.createElement('style');
css.id = 'finance-ui-polish-v1';
css.textContent = `
/* Live, calm financial background */
body{position:relative;isolation:isolate;background:#eef2f8 !important;overflow-x:hidden}
body::before,body::after{content:"";position:fixed;inset:auto;pointer-events:none;z-index:-1;border-radius:999px;filter:blur(55px);opacity:.38;transform:translate3d(0,0,0)}
body::before{width:52vw;height:52vw;min-width:420px;min-height:420px;right:-18vw;top:-18vw;background:radial-gradient(circle at 35% 35%,rgba(95,132,255,.28),rgba(95,132,255,0) 68%);animation:finance-orb-a 18s ease-in-out infinite alternate}
body::after{width:48vw;height:48vw;min-width:380px;min-height:380px;left:-18vw;bottom:-18vw;background:radial-gradient(circle at 60% 45%,rgba(54,211,153,.18),rgba(54,211,153,0) 68%);animation:finance-orb-b 23s ease-in-out infinite alternate}
.app{background:transparent !important}
.main{background:transparent !important}
.card{background:rgba(255,255,255,.88)!important;backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px)}
@keyframes finance-orb-a{from{transform:translate3d(-3vw,2vh,0) scale(1)}to{transform:translate3d(2vw,7vh,0) scale(1.12)}}
@keyframes finance-orb-b{from{transform:translate3d(0,-3vh,0) scale(1)}to{transform:translate3d(6vw,-7vh,0) scale(1.09)}}
@media(prefers-reduced-motion:reduce){body::before,body::after{animation:none}}

/* Sidebar organization */
.sidebar{display:flex!important;flex-direction:column!important}
.nav{display:flex!important;flex-direction:column!important;gap:5px!important}
.ui-section-title{padding:9px 12px 3px;font-size:10px;line-height:1;text-transform:uppercase;letter-spacing:.12em;color:#8492aa;font-weight:800;pointer-events:none}
.ui-nav-spacer{flex:1 1 auto;min-height:12px}
.ui-trash-wrap{margin-top:8px;padding-top:14px;border-top:1px solid rgba(148,163,184,.18)}
.ui-trash-wrap .nav button,.ui-trash-wrap button{width:100%}
.ui-trash-wrap button{color:#f6b5ae!important}
.ui-trash-wrap button:hover{background:rgba(192,57,43,.12)!important;color:#fff!important}

/* Projected Expenses fallback */
.pe-page{display:grid;gap:16px}.pe-card{background:rgba(255,255,255,.9);border:1px solid var(--line);border-radius:18px;padding:20px;box-shadow:var(--shadow);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px)}
.pe-toolbar{display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap}.pe-toolbar-left,.pe-toolbar-right{display:flex;align-items:center;gap:9px;flex-wrap:wrap}.pe-toolbar input[type=search]{min-height:42px;border:1px solid var(--line);border-radius:11px;padding:9px 11px;min-width:220px}.pe-check{width:20px;height:20px;accent-color:var(--brand)}.pe-bulk{display:none;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;background:#f8faff;border:1px solid #cbd5ff;border-radius:14px;padding:11px;margin-top:10px}.pe-bulk.open{display:flex}.pe-list{display:grid;gap:10px;margin-top:12px}.pe-row{display:grid;grid-template-columns:auto minmax(0,1fr) auto;gap:14px;align-items:center;border:1px solid var(--line);border-radius:15px;padding:14px;background:rgba(255,255,255,.9)}.pe-row.selected{border-color:#8fa1ff;background:#f8faff}.pe-title{font-weight:800}.pe-meta{font-size:12px;color:var(--muted);margin-top:4px;line-height:1.5}.pe-actions{display:flex;gap:7px;flex-wrap:wrap;justify-content:flex-end}.pe-modal{position:fixed;inset:0;background:rgba(15,23,42,.5);display:grid;place-items:center;padding:18px;z-index:10100}.pe-modal-box{width:min(620px,100%);max-height:92vh;overflow:auto;background:#fff;border-radius:20px;padding:20px}.pe-form{display:grid;gap:12px}.pe-field{display:grid;gap:6px}.pe-field label{font-size:12px;color:var(--muted);font-weight:800}.pe-field input,.pe-field select{width:100%;padding:11px;border:1px solid var(--line);border-radius:11px;background:#fff}.pe-grid2{display:grid;grid-template-columns:1fr 1fr;gap:12px}
@media(max-width:760px){.pe-card{padding:16px}.pe-toolbar,.pe-toolbar-left,.pe-toolbar-right{width:100%}.pe-toolbar input[type=search]{width:100%;min-width:0;font-size:16px}.pe-row{grid-template-columns:auto minmax(0,1fr)}.pe-actions{grid-column:2;justify-content:stretch}.pe-actions .btn{flex:1;min-height:42px}.pe-grid2{grid-template-columns:1fr}.pe-modal{place-items:end;padding:0}.pe-modal-box{width:100%;max-height:92dvh;border-radius:22px 22px 0 0;padding:18px 16px calc(18px + env(safe-area-inset-bottom))}}
`;
document.head.appendChild(css);

function navButtons() { return [...document.querySelectorAll('.sidebar .nav button')]; }
function findNavButton(label) { return navButtons().find((b) => b.textContent.trim().toLowerCase() === label.toLowerCase()); }
function managementButton(key) { return document.querySelector(`.sidebar .nav [data-mx="${key}"]`); }

function renameSavings() {
  navButtons().forEach((b) => {
    if (b.textContent.trim() === 'Savings Goals') b.textContent = 'Savings';
  });
  document.querySelectorAll('.topbar h1').forEach((h) => { if (h.textContent.trim() === 'Savings Goals') h.textContent = 'Savings'; });
  document.querySelectorAll('[data-mobile-page],.finance-mobile-nav-item').forEach((b) => { if (b.textContent.includes('Savings Goals')) b.textContent = b.textContent.replace('Savings Goals','Savings'); });
}

function bindManagementRouting() {
  const routes = [
    ['Transactions','transactions'],
    ['Budgets','budgets'],
    ['Bills','bills'],
    ['Savings','goals'],
    ['Savings Goals','goals'],
    ['Debts','debts'],
  ];
  for (const [label,key] of routes) {
    const native = findNavButton(label);
    const manager = managementButton(key);
    if (!native || !manager || native === manager || native.dataset.uiRouteBound === '1') continue;
    native.dataset.uiRouteBound = '1';
    native.addEventListener('click', (e) => {
      e.preventDefault(); e.stopImmediatePropagation(); manager.click();
    }, { capture:true });
  }
}

function organizeSidebar() {
  const sidebar = document.querySelector('.sidebar');
  const nav = sidebar?.querySelector('.nav');
  if (!sidebar || !nav) return;

  renameSavings();
  bindManagementRouting();

  const buttons = {
    dashboard: findNavButton('Dashboard'),
    income: nav.querySelector('[data-income-tab]') || findNavButton('My Income'),
    transactions: findNavButton('Transactions'),
    accounts: findNavButton('Accounts'),
    budgets: findNavButton('Budgets'),
    bills: findNavButton('Bills'),
    savings: findNavButton('Savings'),
    projected: managementButton('projected-expenses') || findNavButton('Projected Expenses'),
    debts: findNavButton('Debts') || nav.querySelector('[data-debt-page]'),
    settings: findNavButton('Settings'),
  };

  const order = [
    ['Overview', [buttons.dashboard]],
    ['Money', [buttons.income, buttons.transactions, buttons.accounts]],
    ['Planning', [buttons.budgets, buttons.bills, buttons.savings, buttons.projected]],
    ['Debt & System', [buttons.debts, buttons.settings]],
  ];

  nav.innerHTML = '';
  for (const [section, items] of order) {
    const valid = items.filter(Boolean);
    if (!valid.length) continue;
    const title = document.createElement('div');
    title.className = 'ui-section-title';
    title.textContent = section;
    nav.appendChild(title);
    valid.forEach((button) => {
      button.style.display = '';
      nav.appendChild(button);
    });
  }

  const trash = [...document.querySelectorAll('.sidebar button,.sidebar a')].find((el) => el.textContent.trim().toLowerCase() === 'trash bin');
  if (trash) {
    let wrap = sidebar.querySelector('.ui-trash-wrap');
    if (!wrap) { wrap = document.createElement('div'); wrap.className = 'ui-trash-wrap'; sidebar.appendChild(wrap); }
    wrap.appendChild(trash);
  }

  let spacer = sidebar.querySelector('.ui-nav-spacer');
  if (!spacer) { spacer = document.createElement('div'); spacer.className = 'ui-nav-spacer'; sidebar.appendChild(spacer); }
  const trashWrap = sidebar.querySelector('.ui-trash-wrap');
  const foot = sidebar.querySelector('.sidebar-foot');
  if (foot && spacer.parentNode === sidebar) sidebar.insertBefore(spacer, foot);
  if (trashWrap && foot) sidebar.insertBefore(trashWrap, foot);
}

function peToast(message) { const e = document.createElement('div'); e.className='toast'; e.textContent=message; document.body.appendChild(e); setTimeout(()=>e.remove(),2500); }
function peModal(title, body) { const el=document.createElement('div'); el.className='pe-modal'; el.innerHTML=`<div class="pe-modal-box"><div style="display:flex;justify-content:space-between;align-items:center;gap:10px"><h2 style="margin:0">${esc(title)}</h2><button type="button" class="btn btn-secondary" data-pe-close>Close</button></div><div style="margin-top:16px">${body}</div></div>`; document.body.appendChild(el); el.querySelector('[data-pe-close]').onclick=()=>el.remove(); return el; }
function peField(label, html) { return `<div class="pe-field"><label>${esc(label)}</label>${html}</div>`; }
let peRows=[]; let peSelected=new Set(); let peSupport={accounts:[],categories:[]};
async function peLoadSupport() { const [a,c]=await Promise.all([db.from('accounts').select('id,name').eq('is_deleted',false).order('name'),db.from('categories').select('id,name').eq('is_deleted',false).order('name')]); if(a.error)throw a.error;if(c.error)throw c.error;peSupport.accounts=a.data||[];peSupport.categories=c.data||[]; }
async function peLoadRows(){ const {data,error}=await db.from('projected_expenses').select('*').eq('is_deleted',false).order('projected_date',{ascending:true});if(error)throw error;peRows=data||[]; }
function peOptions(items,val){return `<option value="">None</option>${items.map(x=>`<option value="${esc(x.id)}" ${String(x.id)===String(val)?'selected':''}>${esc(x.name)}</option>`).join('')}`;}
function peSync(){const all=document.getElementById('pe-all'),bulk=document.getElementById('pe-bulk'),cnt=document.getElementById('pe-selected-count');if(cnt)cnt.textContent=`${peSelected.size} selected`;if(bulk)bulk.classList.toggle('open',peSelected.size>0);if(all){all.checked=peSelected.size===peRows.length&&peRows.length>0;all.indeterminate=peSelected.size>0&&peSelected.size<peRows.length;}document.querySelectorAll('[data-pe-check]').forEach(c=>{c.checked=peSelected.has(c.value);c.closest('.pe-row')?.classList.toggle('selected',c.checked);});}
function peToolbar(){return `<div class="pe-toolbar"><div class="pe-toolbar-left"><label style="display:flex;align-items:center;gap:8px;font-weight:800"><input id="pe-all" class="pe-check" type="checkbox"> Select all</label><span class="muted" style="font-size:12px">${peRows.length} records</span></div><div class="pe-toolbar-right"><input id="pe-search" type="search" placeholder="Search projected expenses…"></div></div><div id="pe-bulk" class="pe-bulk"><strong id="pe-selected-count">0 selected</strong><div class="pe-toolbar-right"><button type="button" class="btn btn-secondary btn-small" id="pe-deselect">Deselect all</button><button type="button" class="btn btn-danger btn-small" id="pe-delete-selected">Delete selected</button></div></div>`;}
function peRow(r){return `<div class="pe-row"><input class="pe-check" data-pe-check type="checkbox" value="${esc(r.id)}"><div><div class="pe-title">${esc(r.name)}</div><div class="pe-meta">${dateText(r.projected_date)} · ${money(r.amount)} · ${esc(r.frequency)}${r.notes?` · ${esc(r.notes)}`:''}</div></div><div class="pe-actions"><button type="button" class="btn btn-secondary btn-small" data-pe-edit="${esc(r.id)}">Edit</button><button type="button" class="btn btn-danger btn-small" data-pe-delete="${esc(r.id)}">Delete</button></div></div>`;}
function peForm(row){return `<form id="pe-form" class="pe-form">${peField('Name',`<input id="pe-name" required value="${esc(row?.name||'')}">`)}<div class="pe-grid2">${peField('Amount (ETB)',`<input id="pe-amount" type="number" min="0" step="0.01" required value="${esc(row?.amount??'')}">`)}${peField('Projected date',`<input id="pe-date" type="date" required value="${esc(row?.projected_date||today())}">`)}</div><div class="pe-grid2">${peField('Frequency',`<select id="pe-frequency"><option value="one_time" ${!row||row.frequency==='one_time'?'selected':''}>One time</option><option value="weekly" ${row?.frequency==='weekly'?'selected':''}>Weekly</option><option value="biweekly" ${row?.frequency==='biweekly'?'selected':''}>Bi-weekly</option><option value="monthly" ${row?.frequency==='monthly'?'selected':''}>Monthly</option><option value="yearly" ${row?.frequency==='yearly'?'selected':''}>Yearly</option></select>`)}${peField('Account',`<select id="pe-account">${peOptions(peSupport.accounts,row?.account_id)}</select>`)}</div>${peField('Category',`<select id="pe-category">${peOptions(peSupport.categories,row?.category_id)}</select>`)}${peField('Notes',`<input id="pe-notes" value="${esc(row?.notes||'')}">`)}<div style="display:flex;justify-content:flex-end;gap:8px"><button type="button" class="btn btn-secondary" data-pe-cancel>Cancel</button><button class="btn btn-primary">Save</button></div></form>`;}
async function peEdit(id){const row=peRows.find(r=>String(r.id)===String(id))||null;const m=peModal(row?'Edit projected expense':'Add projected expense',peForm(row));m.querySelector('[data-pe-cancel]').onclick=()=>m.remove();m.querySelector('#pe-form').onsubmit=async(e)=>{e.preventDefault();const p={name:m.querySelector('#pe-name').value.trim(),amount:num(m.querySelector('#pe-amount').value),projected_date:m.querySelector('#pe-date').value,frequency:m.querySelector('#pe-frequency').value,account_id:m.querySelector('#pe-account').value||null,category_id:m.querySelector('#pe-category').value||null,notes:m.querySelector('#pe-notes').value.trim()||null};const q=id?db.from('projected_expenses').update(p).eq('id',id):db.from('projected_expenses').insert({...p,user_id:(await db.auth.getUser()).data.user?.id});const{error}=await q;if(error)peToast(error.message);else{m.remove();peToast(row?'Projected expense updated':'Projected expense added');renderProjected();}};}
async function renderProjected(){await peLoadSupport();await peLoadRows();const main=document.querySelector('.main');if(!main)return;const email=(await db.auth.getUser()).data.user?.email||'';main.innerHTML=`<div class="topbar"><div style="display:flex;align-items:center;gap:10px"><button class="mobile-menu" id="pe-menu" type="button">☰</button><h1>Projected Expenses</h1></div><div class="user-pill"><div>${esc(email)}</div><div class="avatar">${esc((email||'?')[0].toUpperCase())}</div></div></div><div class="pe-page"><div class="pe-card"><div class="card-head"><div><h3 style="margin:0">Projected Expenses</h3><div class="muted" style="font-size:12px;margin-top:4px">Forecasts only — these do not count as actual expenses.</div></div><button class="btn btn-primary" id="pe-add">Add projected expense</button></div>${peToolbar()}<div class="pe-list">${peRows.map(peRow).join('')||'<div class="empty">No projected expenses yet.</div>'}</div></div></div>`;
 document.getElementById('pe-menu')?.addEventListener('click',()=>document.getElementById('mobile-nav-toggle')?.click());
 document.getElementById('pe-add').onclick=()=>peEdit(null);
 document.getElementById('pe-all').onchange=(e)=>{peSelected=e.target.checked?new Set(peRows.map(r=>r.id)):new Set();peSync();};
 document.querySelectorAll('[data-pe-check]').forEach(c=>c.onchange=()=>{c.checked?peSelected.add(c.value):peSelected.delete(c.value);peSync();});
 document.getElementById('pe-deselect').onclick=()=>{peSelected.clear();peSync();};
 document.getElementById('pe-delete-selected').onclick=async()=>{if(!peSelected.size)return;if(!confirm(`Move ${peSelected.size} selected projected expense${peSelected.size===1?'':'s'} to Trash?`))return;const{error}=await db.from('projected_expenses').update({is_deleted:true,deleted_at:new Date().toISOString()}).in('id',[...peSelected]);if(error)peToast(error.message);else{peToast('Selected projected expenses moved to Trash');renderProjected();}};
 document.getElementById('pe-search').oninput=(e)=>{const q=String(e.target.value||'').toLowerCase();document.querySelectorAll('.pe-row').forEach(r=>r.style.display=r.textContent.toLowerCase().includes(q)?'':'none');};
 document.querySelectorAll('[data-pe-edit]').forEach(b=>b.onclick=()=>peEdit(b.dataset.peEdit));
 document.querySelectorAll('[data-pe-delete]').forEach(b=>b.onclick=async()=>{if(!confirm('Move this projected expense to Trash?'))return;const{error}=await db.from('projected_expenses').update({is_deleted:true,deleted_at:new Date().toISOString()}).eq('id',b.dataset.peDelete);if(error)peToast(error.message);else{peToast('Moved to Trash');renderProjected();}});
 peSync();
}

function bindProjectedRouting(){
  const btn=managementButton('projected-expenses');
  if(!btn || btn.dataset.uiProjectedBound==='1')return;
  btn.dataset.uiProjectedBound='1';
  btn.addEventListener('click',(e)=>{e.preventDefault();e.stopImmediatePropagation();renderProjected();},{capture:true});
}

function reorganize(){
  const sidebar=document.querySelector('.sidebar');
  if(!sidebar)return;
  renameSavings();
  bindProjectedRouting();
  bindManagementRouting();
  organizeSidebar();
}

const observer = new MutationObserver(()=>{ clearTimeout(observer.t); observer.t=setTimeout(reorganize,60); });
observer.observe(document.body,{childList:true,subtree:true});
window.addEventListener('pageshow',reorganize);
setTimeout(reorganize,120);
