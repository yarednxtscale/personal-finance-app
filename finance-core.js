import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const db = createClient('https://hznphzpukdwxyqgqksrx.supabase.co','sb_publishable_1CgZ5bRDG7tSltHDwIc5HQ_w1SQFR-9',{auth:{persistSession:true,autoRefreshToken:true}});
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const n=v=>Number(String(v??'').replace(/,/g,''))||0;
const today=()=>new Date().toISOString().slice(0,10);
const money=(v,c='ETB')=>new Intl.NumberFormat('en-US',{style:'currency',currency:c==='USD'?'USD':'ETB',maximumFractionDigits:2}).format(n(v));
const dateText=d=>d?new Date(`${d}T00:00:00`).toLocaleDateString(undefined,{year:'numeric',month:'short',day:'numeric'}):'—';
const toast=msg=>{const el=document.createElement('div');el.className='toast';el.textContent=msg;document.body.appendChild(el);setTimeout(()=>el.remove(),2600)};

const css=document.createElement('style');
css.textContent=`.fxc-backdrop{position:fixed;inset:0;background:rgba(15,23,42,.45);display:grid;place-items:center;padding:18px;z-index:10000}.fxc-modal{width:min(1080px,100%);max-height:92vh;overflow:auto;background:#fff;border-radius:20px;padding:20px;box-shadow:0 30px 90px rgba(0,0,0,.22)}.fxc-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.fxc-field{display:grid;gap:6px}.fxc-field label{font-size:12px;color:var(--muted);font-weight:700}.fxc-field input,.fxc-field select{width:100%;padding:10px 11px;border:1px solid var(--line);border-radius:11px;background:#fff}.fxc-table{width:100%;border-collapse:collapse;margin-top:12px}.fxc-table th,.fxc-table td{padding:8px;border-bottom:1px solid var(--line);font-size:12px;text-align:left;white-space:nowrap}.fxc-actions{display:flex;justify-content:flex-end;gap:8px;flex-wrap:wrap;margin-top:14px}.fxc-help{padding:10px 12px;background:#f6f7fb;border-radius:11px;font-size:12px;color:var(--muted);line-height:1.5}@media(max-width:760px){.fxc-grid{grid-template-columns:1fr}.fxc-actions .btn{flex:1}}`;
document.head.appendChild(css);

async function getUser(){return (await db.auth.getUser()).data.user}

function navInject(){
  const nav=document.querySelector('.nav');
  if(nav&&!nav.querySelector('[data-fxc-debts]')){
    const b=document.createElement('button');
    b.type='button'; b.textContent='Debts'; b.dataset.fxcDebts='1';
    b.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();openDebts()},{capture:true});
    nav.appendChild(b);
  }
}

function settingsInject(){
  const root=document.querySelector('#root');
  if(!root)return;
  const heading=[...root.querySelectorAll('.card h3')].find(h=>h.textContent.trim()==='Data export');
  const card=heading?.closest('.card');
  if(!card||card.dataset.fxcSettings==='1')return;
  card.dataset.fxcSettings='1';
  const old=card.querySelector('#export-all');
  old?.remove();
  const actions=document.createElement('div');
  actions.className='fxc-actions';
  actions.innerHTML='<button class="btn btn-secondary" id="fxc-export">Export CSV</button><button class="btn btn-primary" id="fxc-import">Import CSV</button>';
  card.appendChild(actions);
  card.querySelector('#fxc-export').onclick=exportUnified;
  card.querySelector('#fxc-import').onclick=openImport;
}

function transactionsInject(){
  const root=document.querySelector('#root');
  const heading=[...root?.querySelectorAll('.card-head h3')||[]].find(h=>h.textContent.trim()==='Transactions');
  const card=heading?.closest('.card');
  const actions=card?.querySelector('.card-head > div:last-child');
  if(!actions||actions.querySelector('[data-fxc-tx-import]'))return;
  const b=document.createElement('button');b.className='btn btn-secondary';b.textContent='Import CSV';b.dataset.fxcTxImport='1';b.onclick=openImport;actions.prepend(b);
}

function injectAll(){navInject();settingsInject();transactionsInject()}
new MutationObserver(injectAll).observe(document.body,{childList:true,subtree:true});
setTimeout(injectAll,100);

async function openDebts(){
  const main=document.querySelector('.main'); if(!main)return;
  const u=await getUser();
  main.innerHTML=`<div class="topbar"><div style="display:flex;align-items:center;gap:10px"><button class="mobile-menu" id="fxc-menu" type="button">☰</button><h1>Debts</h1></div><div class="user-pill"><div>${esc(u?.email||'')}</div></div></div><div id="fxc-debt-root"><div class="card empty">Loading debts…</div></div>`;
  document.getElementById('fxc-menu')?.addEventListener('click',()=>document.getElementById('mobile-nav-toggle')?.click());
  try{
    const {data,error}=await db.from('debts').select('*').order('status',{ascending:true}).order('due_date',{ascending:true});
    if(error)throw error;
    const rows=data||[],open=rows.filter(d=>d.status!=='paid'),owed=open.filter(d=>d.direction==='owed_by_me'),recv=open.filter(d=>d.direction==='owed_to_me');
    const owedTotal=owed.reduce((s,d)=>s+n(d.remaining_amount),0),recvTotal=recv.reduce((s,d)=>s+n(d.remaining_amount),0);
    const root=document.getElementById('fxc-debt-root');
    root.innerHTML=`<div class="grid grid-4"><div class="card metric"><div class="label">Debt I owe</div><div class="value neg">${money(owedTotal)}</div><div class="sub">${owed.length} open</div></div><div class="card metric"><div class="label">Owed to me</div><div class="value pos">${money(recvTotal)}</div><div class="sub">${recv.length} open</div></div><div class="card metric"><div class="label">Overdue</div><div class="value neg">${owed.filter(d=>d.due_date&&d.due_date<today()).length}</div><div class="sub">Past due</div></div><div class="card metric"><div class="label">Records</div><div class="value">${rows.length}</div><div class="sub">Open + paid</div></div></div><div class="card" style="margin-top:16px"><div class="card-head"><div><h3 style="margin:0">Debt tracker</h3><div class="muted" style="font-size:12px">Track who, amount, remaining balance and due date.</div></div><button class="btn btn-primary" id="fxc-add-debt">Add debt</button></div><div class="table-wrap"><table class="fxc-table"><thead><tr><th>Debt</th><th>To / From</th><th>Remaining</th><th>Original</th><th>Due</th><th>Status</th><th></th></tr></thead><tbody>${rows.map(d=>{const overdue=d.status!=='paid'&&d.due_date&&d.due_date<today();return `<tr><td><strong>${esc(d.name)}</strong>${d.notes?`<br><span class="muted">${esc(d.notes)}</span>`:''}</td><td>${esc(d.counterparty||'—')}<br><span class="muted">${d.direction==='owed_by_me'?'I owe':'They owe me'}</span></td><td>${money(d.remaining_amount,d.currency)}</td><td>${money(d.original_amount,d.currency)}</td><td>${dateText(d.due_date)}</td><td>${d.status==='paid'?'<span class="badge">Paid</span>':overdue?'<span class="notice">Overdue</span>':'<span class="notice">Open</span>'}</td><td>${d.status!=='paid'?`<button class="btn btn-primary btn-small" data-fxc-paid="${d.id}">Mark paid</button>`:''} <button class="btn btn-danger btn-small" data-fxc-delete="${d.id}">Delete</button></td></tr>`}).join('')||'<tr><td colspan="7" class="empty">No debts yet.</td></tr>'}</tbody></table></div></div>`;
    root.querySelector('#fxc-add-debt')?.addEventListener('click',addDebt);
    root.querySelectorAll('[data-fxc-paid]').forEach(b=>b.onclick=async()=>{const {error}=await db.from('debts').update({remaining_amount:0,status:'paid',updated_at:new Date().toISOString()}).eq('id',b.dataset.fxcPaid);if(error)toast(error.message);else{toast('Debt marked paid');openDebts()}});
    root.querySelectorAll('[data-fxc-delete]').forEach(b=>b.onclick=async()=>{if(!confirm('Delete this debt?'))return;const {error}=await db.from('debts').delete().eq('id',b.dataset.fxcDelete);if(error)toast(error.message);else{toast('Debt deleted');openDebts()}});
  }catch(e){document.getElementById('fxc-debt-root').innerHTML=`<div class="card"><div class="notice">Could not load debts: ${esc(e.message||'Unknown error')}</div></div>`}
}

function overlay(title,body){const b=document.createElement('div');b.className='fxc-backdrop';b.innerHTML=`<div class="fxc-modal"><div style="display:flex;justify-content:space-between;gap:12px;align-items:center"><h2 style="margin:0">${esc(title)}</h2><button class="btn btn-secondary" data-close>Close</button></div><div style="margin-top:16px">${body}</div></div>`;document.body.appendChild(b);b.querySelector('[data-close]').onclick=()=>b.remove();return b}

async function addDebt(){const b=overlay('Add debt',`<form id="fxc-debt-form" class="form"><div class="fxc-grid"><div class="fxc-field"><label>Name</label><input id="d-name" placeholder="Telus bill / Loan from John" required></div><div class="fxc-field"><label>To / From</label><input id="d-party" required></div><div class="fxc-field"><label>Direction</label><select id="d-dir"><option value="owed_by_me">I owe them</option><option value="owed_to_me">They owe me</option></select></div><div class="fxc-field"><label>Currency</label><select id="d-cur"><option>ETB</option><option>USD</option></select></div><div class="fxc-field"><label>Original amount</label><input id="d-original" type="number" min="0.01" step="0.01" required></div><div class="fxc-field"><label>Remaining amount</label><input id="d-remaining" type="number" min="0" step="0.01" required></div><div class="fxc-field"><label>Due date</label><input id="d-date" type="date"></div><div class="fxc-field"><label>Minimum payment</label><input id="d-min" type="number" min="0" step="0.01" value="0"></div><div class="fxc-field" style="grid-column:1/-1"><label>Notes</label><input id="d-notes"></div></div><div class="fxc-actions"><button type="button" class="btn btn-secondary" data-close>Cancel</button><button class="btn btn-primary">Save debt</button></div></form>`);b.querySelector('#fxc-debt-form').onsubmit=async e=>{e.preventDefault();const u=await getUser();const remaining=n(b.querySelector('#d-remaining').value);const {error}=await db.from('debts').insert({user_id:u.id,name:b.querySelector('#d-name').value.trim(),counterparty:b.querySelector('#d-party').value.trim(),direction:b.querySelector('#d-dir').value,currency:b.querySelector('#d-cur').value,original_amount:n(b.querySelector('#d-original').value),remaining_amount:remaining,due_date:b.querySelector('#d-date').value||null,minimum_payment:n(b.querySelector('#d-min').value),notes:b.querySelector('#d-notes').value.trim()||null,status:remaining<=0?'paid':'open'});if(error)toast(error.message);else{b.remove();toast('Debt added');openDebts()}}}

function parseCsv(text){const rows=[];let row=[],cell='',q=false;for(let i=0;i<text.length;i++){const c=text[i],nx=text[i+1];if(c==='"'){if(q&&nx==='"'){cell+='"';i++}else q=!q}else if(c===','&&!q){row.push(cell);cell=''}else if((c==='\n'||c==='\r')&&!q){if(c==='\r'&&nx==='\n')i++;row.push(cell);cell='';if(row.some(x=>String(x).trim()))rows.push(row);row=[]}else cell+=c}if(cell||row.length){row.push(cell);if(row.some(x=>String(x).trim()))rows.push(row)}return rows}
const norm=s=>String(s??'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
const parseDate=v=>{const s=String(v||'').trim();if(!s)return null;if(/^\d{4}-\d{2}-\d{2}$/.test(s))return s;const d=new Date(s);return Number.isNaN(d.getTime())?null:d.toISOString().slice(0,10)};
const bool=v=>/^(1|true|yes|y|paid)$/i.test(String(v||'').trim());
const selectMap=(headers,tests)=>headers.findIndex(h=>tests.some(t=>h.includes(t)));
const fieldNames=['record_type','name','counterparty','direction','description','type','date','amount','original_amount','remaining_amount','currency','source_currency','account','account_type','opening_balance','category','month','due_date','frequency','is_paid','target_amount','current_amount','minimum_payment','notes','reference'];

function importTemplate(){return fieldNames.join(',')+'\naccount,Main Bank,,,,,,10000,,,ETB,,Main Bank,bank,10000,,,,,,,,,,\ncategory,Groceries,,,,expense,,,,ETB,,,,,Groceries,,,,,,,,,\ntransaction,,Shop,owed_by_me,Groceries,expense,2026-08-18,250,,,,ETB,Main Bank,bank,,Groceries,,,,,,,Card payment\nbudget,Groceries,,,,,2026-08-01,1500,,,,ETB,, ,bank,,Groceries,2026-08-01,,,,,,\nbill,Internet,,,,,2026-08-20,1700,,,,ETB,Main Bank,bank,,,2026-08-20,monthly,false,,,,\nsavings_goal,New laptop,,,,,2026-08-19,0,,ETB,Main Bank,bank,, , , , , , , ,15000,5000,\ndebt,Telus,,owed_by_me,Phone bill,,,0,1700,1700,CAD,,,,,,,2026-08-30,monthly,false,,,0,\n';}

async function exportUnified(){
  try{
    const u=await getUser(); if(!u)return;
    const [{data:accounts},{data:categories},{data:tx},{data:budgets},{data:bills},{data:goals},{data:debts}]=await Promise.all([
      db.from('accounts').select('*').order('name'),db.from('categories').select('*').order('name'),db.from('transactions').select('*').order('transaction_date',{ascending:false}),db.from('budgets').select('*').order('month',{ascending:false}),db.from('bills').select('*').order('due_date'),db.from('savings_goals').select('*').order('created_at',{ascending:false}),db.from('debts').select('*').order('due_date')
    ]);
    const accountMap=new Map((accounts||[]).map(a=>[a.id,a])); const catMap=new Map((categories||[]).map(c=>[c.id,c]));
    const out=[fieldNames];
    (accounts||[]).forEach(a=>out.push(['account',a.name,'','','','',a.opening_balance,'','','',a.currency,'',a.name,a.type,a.opening_balance,'','','','','','','','','']));
    (categories||[]).forEach(c=>out.push(['category',c.name,'','','',c.type,'','','','',c.type==='expense'?'ETB':'ETB','','','', '',c.name,'','','','','','','','']));
    (tx||[]).forEach(t=>{const a=accountMap.get(t.account_id),c=catMap.get(t.category_id);out.push(['transaction','', '', '',t.description||'',t.type,t.transaction_date,t.original_amount??t.amount,'','',a?.currency||t.source_currency,t.source_currency,a?.name||'','', '',c?.name||'', '', '', '', '', '', '', '', t.note||t.external_ref||''])});
    (budgets||[]).forEach(b=>{const c=catMap.get(b.category_id);out.push(['budget',c?.name||'','','','','', '',b.amount,'','','ETB','','','', '',c?.name||'',b.month,'','','','','','',''])});
    (bills||[]).forEach(b=>{const a=accountMap.get(b.account_id);out.push(['bill',b.name,'','','','', '',b.amount,'','','ETB','',a?.name||'','', '', '', '',b.due_date,b.frequency,b.is_paid,'','','',''])});
    (goals||[]).forEach(g=>{const a=accountMap.get(g.account_id);out.push(['savings_goal',g.name,'','','','', '', '', '', '',a?.currency||'ETB','',a?.name||'','', '', '', '',g.target_date,'', '',g.target_amount,g.current_amount,'',''])});
    (debts||[]).forEach(d=>out.push(['debt',d.name,d.counterparty||'',d.direction||'owed_by_me','', '', '', '',d.original_amount,d.remaining_amount,d.currency,'','','', '', '', '',d.due_date,'',d.status==='paid','', '',d.minimum_payment,d.notes||'']));
    downloadCsv('finance-hub-export.csv',out.map(r=>r.map(csvCell).join(',')).join('\n'));
  }catch(e){toast(e.message||'Could not export CSV')}
}
function csvCell(v){const s=String(v??'');return /[",\n]/.test(s)?`"${s.replace(/"/g,'""')}"`:s}
function downloadCsv(name,text){const blob=new Blob([text],{type:'text/csv;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();URL.revokeObjectURL(url)}

async function openImport(){
  const b=overlay('Import data from CSV',`<div class="fxc-help"><strong>One CSV can contain accounts, categories, transactions, budgets, bills, savings goals and debts.</strong><br>Each row needs a <code>record_type</code>. Account/category names are used to match related records. Missing categories and accounts can be created automatically.</div><input id="fxc-file" type="file" accept=".csv,text/csv" class="fxc-field" style="margin-top:14px"><div class="fxc-actions"><button class="btn btn-secondary" id="fxc-template">Download template</button></div><div id="fxc-stage" style="margin-top:14px"></div>`);
  b.querySelector('#fxc-template').onclick=()=>downloadCsv('finance-hub-import-template.csv',importTemplate());
  b.querySelector('#fxc-file').onchange=async e=>{const f=e.target.files?.[0];if(!f)return;const rows=parseCsv(await f.text());if(rows.length<2){toast('CSV needs a header and at least one data row.');return}await previewImport(b,rows)};
}

async function previewImport(b,rows){
  const headers=rows[0].map(norm), idxs={type:selectMap(headers,['record type','type']),name:selectMap(headers,['name']),party:selectMap(headers,['counterparty']),direction:selectMap(headers,['direction']),description:selectMap(headers,['description','details','memo']),amount:selectMap(headers,['amount']),original:selectMap(headers,['original amount']),remaining:selectMap(headers,['remaining amount']),currency:selectMap(headers,['currency']),sourceCurrency:selectMap(headers,['source currency']),account:selectMap(headers,['account']),accountType:selectMap(headers,['account type']),opening:selectMap(headers,['opening balance']),category:selectMap(headers,['category']),month:selectMap(headers,['month']),date:selectMap(headers,['date','transaction date']),due:selectMap(headers,['due date']),frequency:selectMap(headers,['frequency']),paid:selectMap(headers,['is paid','paid']),target:selectMap(headers,['target amount']),current:selectMap(headers,['current amount']),min:selectMap(headers,['minimum payment']),notes:selectMap(headers,['notes','note']),reference:selectMap(headers,['reference','external ref'])};
  const missing=idxs.type<0?'<div class="notice">Missing required column: record_type</div>':'';
  const preview=rows.slice(1,8).map(r=>`<tr><td>${esc(r[idxs.type]||'')}</td><td>${esc(r[idxs.name]||r[idxs.description]||'')}</td><td>${esc(r[idxs.amount]||r[idxs.original]||'')}</td><td>${esc(r[idxs.date]||r[idxs.due]||'')}</td></tr>`).join('');
  b.querySelector('#fxc-stage').innerHTML=`${missing}<table class="fxc-table"><thead><tr><th>Type</th><th>Name / Description</th><th>Amount</th><th>Date</th></tr></thead><tbody>${preview||'<tr><td colspan="4" class="empty">No preview rows.</td></tr>'}</tbody></table><div class="muted" style="font-size:12px;margin-top:8px">${rows.length-1} data rows detected.</div><div class="fxc-actions"><button class="btn btn-primary" id="fxc-run-import">Import ${rows.length-1} rows</button></div>`;
  b.querySelector('#fxc-run-import').onclick=()=>runImport(b,rows,idxs);
}

async function runImport(b,rows,i){
  const u=await getUser(); if(!u)return;
  const [{data:accounts0},{data:cats0},{data:rates}]=await Promise.all([db.from('accounts').select('*'),db.from('categories').select('*'),db.from('exchange_rates').select('*').eq('base_currency','USD').eq('quote_currency','ETB').order('rate_date',{ascending:false}).order('fetched_at',{ascending:false}).limit(1)]);
  const accounts=new Map((accounts0||[]).map(a=>[norm(a.name),a]));
  const cats=new Map((cats0||[]).map(c=>[`${c.type}:${norm(c.name)}`,c]));
  const rate=n(rates?.[0]?.rate); let imported=0, skipped=0, failed=0;
  for(const r of rows.slice(1)){
    try{
      const rt=norm(r[i.type]); if(!rt){skipped++;continue}
      const name=String(r[i.name]||'').trim(), currency=String(r[i.currency>=0?i.currency:i.sourceCurrency]||'ETB').trim().toUpperCase()||'ETB';
      if(rt==='account'){
        if(!name){skipped++;continue}
        const key=norm(name); if(!accounts.has(key)){const {data,error}=await db.from('accounts').insert({user_id:u.id,name,type:String(r[i.accountType]||'bank').trim()||'bank',currency,opening_balance:n(r[i.opening])}).select().single();if(error)throw error;accounts.set(key,data)} imported++;continue;
      }
      if(rt==='category'){
        if(!name){skipped++;continue}
        const type=String(r[i.type]||'expense').trim().toLowerCase(); const key=`${type}:${norm(name)}`; if(!cats.has(key)){const {data,error}=await db.from('categories').insert({user_id:u.id,name,type,is_default:false}).select().single();if(error)throw error;cats.set(key,data)} imported++;continue;
      }
      if(rt==='transaction'){
        let account=accounts.get(norm(r[i.account]));
        if(!account&&r[i.account]){const aName=String(r[i.account]).trim();const {data,error}=await db.from('accounts').insert({user_id:u.id,name:aName,type:String(r[i.accountType]||'bank').trim()||'bank',currency,opening_balance:0}).select().single();if(error)throw error;account=data;accounts.set(norm(aName),data)}
        if(!account)throw new Error('Transaction is missing an account');
        let type=String(r[i.type]||'').trim().toLowerCase(); if(!['income','expense'].includes(type))type=n(r[i.amount])<0?'expense':'income';
        const catName=String(r[i.category]||'').trim(); let cat=cats.get(`${type}:${norm(catName)}`);
        if(!cat){const fallback=cats.get(`${type}:uncategorized ${type}`); if(fallback)cat=fallback; else {const {data,error}=await db.from('categories').insert({user_id:u.id,name:catName||`Uncategorized ${type==='expense'?'Expense':'Income'}`,type,is_default:!catName}).select().single();if(error)throw error;cat=data;cats.set(`${type}:${norm(cat.name)}`,cat)}}
        const original=n(r[i.original]>=0?r[i.original]:r[i.amount]); if(!original)throw new Error('Transaction amount is missing');
        const baseAmount=currency==='USD'?(rate?original*rate:original):original;
        const ref=String(r[i.reference]||'').trim()||`csv:${String(r[i.date]||today())}|${String(r[i.description]||'')}|${original}`;
        const {error}=await db.from('transactions').insert({user_id:u.id,account_id:account.id,category_id:cat.id,type,amount:baseAmount,transaction_date:parseDate(r[i.date])||today(),description:String(r[i.description]||'').trim()||name||null,source_currency:currency,original_amount:original,fx_rate:currency==='USD'&&rate?rate:1,fx_rate_date:currency==='USD'&&rate?(rates?.[0]?.rate_date||today()):null,source_type:'csv',external_ref:ref});if(error)throw error; imported++;continue;
      }
      if(rt==='budget'){
        const catName=String(r[i.category]||name||'').trim(); let cat=[...cats.values()].find(c=>norm(c.name)===norm(catName)&&c.type==='expense'); if(!cat)throw new Error(`Budget category not found: ${catName}`);
        const {error}=await db.from('budgets').insert({user_id:u.id,category_id:cat.id,month:parseDate(r[i.month]||r[i.date])||`${today().slice(0,7)}-01`,amount:n(r[i.amount])});if(error)throw error; imported++;continue;
      }
      if(rt==='bill'){
        const account=accounts.get(norm(r[i.account])); const {error}=await db.from('bills').insert({user_id:u.id,name:name||'Imported bill',amount:n(r[i.amount]),due_date:parseDate(r[i.due])||today(),frequency:String(r[i.frequency]||'one_time').trim()||'one_time',is_paid:bool(r[i.paid]),account_id:account?.id||null});if(error)throw error;imported++;continue;
      }
      if(rt==='savings_goal'){
        const account=accounts.get(norm(r[i.account])); const {error}=await db.from('savings_goals').insert({user_id:u.id,name:name||'Imported goal',target_amount:n(r[i.target]),current_amount:n(r[i.current]),target_date:parseDate(r[i.due]||r[i.date]),account_id:account?.id||null});if(error)throw error;imported++;continue;
      }
      if(rt==='debt'){
        const remaining=r[i.remaining]!==''?n(r[i.remaining]):n(r[i.amount]||r[i.original]); const {error}=await db.from('debts').insert({user_id:u.id,name:name||'Imported debt',counterparty:String(r[i.party]||'').trim()||null,direction:String(r[i.direction]||'owed_by_me').trim()||'owed_by_me',original_amount:n(r[i.original]||r[i.amount]),remaining_amount:remaining,currency,status:bool(r[i.paid])||remaining<=0?'paid':'open',due_date:parseDate(r[i.due]),minimum_payment:n(r[i.min]),notes:String(r[i.notes]||'').trim()||null});if(error)throw error;imported++;continue;
      }
      if(rt==='category'){imported++;continue}
      skipped++;
    }catch(e){failed++;console.error('CSV import row failed',e,r)}
  }
  b.remove(); toast(`Imported ${imported} rows${failed?`, ${failed} failed`:''}${skipped?`, ${skipped} skipped`:''}`); location.reload();
}
