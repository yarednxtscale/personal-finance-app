import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const SUPABASE_URL = 'https://hznphzpukdwxyqgqksrx.supabase.co';
const SUPABASE_KEY = 'sb_publishable_1CgZ5bRDG7tSltHDwIc5HQ_w1SQFR-9';
const db = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: true, autoRefreshToken: true } });

const esc = (v) => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const n = (v) => Number(String(v ?? '').replace(/,/g, '')) || 0;
const today = () => new Date().toISOString().slice(0, 10);
const money = (v, c='ETB') => new Intl.NumberFormat('en-US',{style:'currency',currency:c==='USD'?'USD':'ETB',maximumFractionDigits:2}).format(n(v));
const dateText = d => d ? new Date(`${d}T00:00:00`).toLocaleDateString(undefined,{year:'numeric',month:'short',day:'numeric'}) : '—';

const style = document.createElement('style');
style.textContent = `
  .fx-enhance-backdrop{position:fixed;inset:0;background:rgba(15,23,42,.5);z-index:10050;display:none;align-items:center;justify-content:center;padding:18px}
  .fx-enhance-modal{width:min(980px,100%);max-height:90vh;overflow:auto;background:#fff;border-radius:22px;padding:22px;box-shadow:0 30px 100px rgba(0,0,0,.28)}
  .fx-enhance-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
  .fx-enhance-card{border:1px solid var(--line);border-radius:16px;padding:16px}
  .fx-enhance-actions{display:flex;justify-content:flex-end;gap:8px;flex-wrap:wrap;margin-top:14px}
  .fx-enhance-muted{font-size:12px;color:var(--muted)}
  .fx-enhance-table{width:100%;border-collapse:collapse;margin-top:12px}
  .fx-enhance-table th,.fx-enhance-table td{padding:9px 8px;border-bottom:1px solid var(--line);text-align:left;font-size:12px;white-space:nowrap}
  .fx-enhance-badge{display:inline-block;padding:4px 8px;border-radius:999px;font-size:11px;font-weight:800}
  .fx-enhance-open{background:#fff8e7;color:#8a621d}.fx-enhance-paid{background:#eef7f4;color:#0f8a64}.fx-enhance-overdue{background:#fff1f0;color:#c0392b}
  .fx-enhance-input{width:100%;padding:10px 11px;border:1px solid var(--line);border-radius:11px;background:#fff;color:var(--text)}
  .fx-enhance-select{width:100%;padding:10px 11px;border:1px solid var(--line);border-radius:11px;background:#fff;color:var(--text)}
  .fx-enhance-label{font-size:12px;color:var(--muted);font-weight:700}
  .fx-enhance-field{display:grid;gap:6px}
  @media(max-width:760px){.fx-enhance-grid{grid-template-columns:1fr}.fx-enhance-modal{padding:16px;border-radius:18px}.fx-enhance-table-wrap{overflow:auto}.fx-enhance-actions{justify-content:stretch}.fx-enhance-actions .btn{flex:1}}
`;
document.head.appendChild(style);

function toast(message){
  const el = document.createElement('div');
  el.className='toast'; el.textContent=message; document.body.appendChild(el);
  setTimeout(()=>el.remove(),2800);
}

let enhanceObserver = null;
let debtPageActive = false;

function injectDebtNav(){
  const nav = document.querySelector('.nav');
  if(!nav || nav.querySelector('[data-fx-nav="debts"]')) return;
  const button = document.createElement('button');
  button.type='button'; button.dataset.fxNav='debts'; button.textContent='Debts';
  button.className='';
  button.addEventListener('click', openDebtPage);
  nav.appendChild(button);
}

function injectCsvButton(){
  const root=document.querySelector('#root');
  if(!root) return;
  const heading=root.querySelector('.card-head h3');
  if(!heading || heading.textContent.trim()!=='Transactions') return;
  const actions=heading.closest('.card-head')?.querySelector('div:last-child');
  if(!actions || actions.querySelector('[data-fx-csv]')) return;
  const button=document.createElement('button');
  button.className='btn btn-secondary'; button.dataset.fxCsv='1'; button.textContent='Import CSV';
  button.addEventListener('click', openCsvImport);
  actions.prepend(button);
}

function markDebtNav(){
  const pageTitle=document.querySelector('.topbar h1');
  const nav=document.querySelector('.nav');
  nav?.querySelectorAll('[data-fx-nav="debts"]').forEach(b=>b.classList.toggle('active', debtPageActive));
  if(debtPageActive && pageTitle) pageTitle.textContent='Debts';
}

function watch(){
  injectDebtNav(); injectCsvButton(); markDebtNav();
  if(!enhanceObserver){
    enhanceObserver=new MutationObserver(()=>{ injectDebtNav(); injectCsvButton(); markDebtNav(); });
    enhanceObserver.observe(document.body,{childList:true,subtree:true});
  }
}

function openOverlay(id, title, body){
  let backdrop=document.getElementById(id);
  if(backdrop) backdrop.remove();
  backdrop=document.createElement('div'); backdrop.id=id; backdrop.className='fx-enhance-backdrop';
  backdrop.innerHTML=`<div class="fx-enhance-modal"><div style="display:flex;justify-content:space-between;gap:12px;align-items:center"><div><h2 style="margin:0">${esc(title)}</h2><div class="fx-enhance-muted">Finance Hub</div></div><button class="btn btn-secondary" data-close-overlay>Close</button></div><div style="margin-top:16px">${body}</div></div>`;
  document.body.appendChild(backdrop); backdrop.style.display='flex';
  backdrop.querySelector('[data-close-overlay]')?.addEventListener('click',()=>backdrop.remove());
  backdrop.addEventListener('click',e=>{if(e.target===backdrop)backdrop.remove()});
  return backdrop;
}

async function getUser(){ return (await db.auth.getUser()).data.user; }

async function openDebtPage(){
  debtPageActive=true;
  const main=document.querySelector('.main');
  if(!main) return;
  main.innerHTML=`<div class="topbar"><div style="display:flex;align-items:center;gap:10px"><button class="mobile-menu" id="fx-debt-menu" aria-label="Open navigation">☰</button><h1>Debts</h1></div><div class="user-pill"><div>${esc((await getUser())?.email||'')}</div></div></div><div id="fx-debt-root"><div class="card empty">Loading debts…</div></div>`;
  document.getElementById('fx-debt-menu')?.addEventListener('click',()=>document.querySelector('#mobile-nav-toggle')?.click());
  await renderDebtPage();
}

async function renderDebtPage(){
  const user=await getUser(); if(!user) return;
  const {data,error}=await db.from('debts').select('*').order('status',{ascending:true}).order('due_date',{ascending:true});
  if(error){ toast(error.message); return; }
  const rows=data||[];
  const open=rows.filter(d=>d.status!=='paid');
  const owedByMe=open.filter(d=>d.direction==='owed_by_me');
  const owedToMe=open.filter(d=>d.direction==='owed_to_me');
  const owedTotal=owedByMe.reduce((s,d)=>s+n(d.remaining_amount),0);
  const receivableTotal=owedToMe.reduce((s,d)=>s+n(d.remaining_amount),0);
  const root=document.getElementById('fx-debt-root'); if(!root) return;
  root.innerHTML=`
    <div class="grid grid-4">
      <div class="card metric"><div class="label">Debt I owe</div><div class="value neg">${money(owedTotal)}</div><div class="sub">${owedByMe.length} open</div></div>
      <div class="card metric"><div class="label">Owed to me</div><div class="value pos">${money(receivableTotal)}</div><div class="sub">${owedToMe.length} open</div></div>
      <div class="card metric"><div class="label">Overdue</div><div class="value neg">${owedByMe.filter(d=>d.due_date&&d.due_date<today()).length}</div><div class="sub">Payments past due</div></div>
      <div class="card metric"><div class="label">Total records</div><div class="value">${rows.length}</div><div class="sub">Open + paid</div></div>
    </div>
    <div class="card" style="margin-top:16px">
      <div class="card-head"><div><h3 style="margin:0">My debts</h3><div class="fx-enhance-muted">Track who you owe, the remaining amount, and exactly when it is due.</div></div><button class="btn btn-primary" id="fx-add-debt">Add debt</button></div>
      <div class="fx-enhance-table-wrap"><table class="fx-enhance-table"><thead><tr><th>Debt</th><th>To / From</th><th>Remaining</th><th>Original</th><th>Due</th><th>Status</th><th></th></tr></thead><tbody>
      ${rows.map(d=>{const overdue=d.status!=='paid'&&d.due_date&&d.due_date<today();const pct=n(d.original_amount)?Math.max(0,Math.min(100,(1-n(d.remaining_amount)/n(d.original_amount))*100)):0;return `<tr><td><strong>${esc(d.name)}</strong>${d.notes?`<br><span class="fx-enhance-muted">${esc(d.notes)}</span>`:''}<div style="width:120px;height:5px;background:#edf0f5;border-radius:9px;margin-top:6px;overflow:hidden"><div style="width:${pct}%;height:100%;background:var(--gold)"></div></div></td><td>${esc(d.counterparty||'—')}<br><span class="fx-enhance-muted">${d.direction==='owed_by_me'?'I owe':'Owed to me'}</span></td><td><strong>${money(d.remaining_amount,d.currency)}</strong></td><td>${money(d.original_amount,d.currency)}</td><td>${dateText(d.due_date)}</td><td>${d.status==='paid'?'<span class="fx-enhance-badge fx-enhance-paid">Paid</span>':overdue?'<span class="fx-enhance-badge fx-enhance-overdue">Overdue</span>':'<span class="fx-enhance-badge fx-enhance-open">Open</span>'}</td><td>${d.status!=='paid'?`<button class="btn btn-primary btn-small" data-fx-pay="${d.id}">Mark paid</button>`:''} <button class="btn btn-danger btn-small" data-fx-del-debt="${d.id}">Delete</button></td></tr>`}).join('')||'<tr><td colspan="7" class="empty">No debt records yet.</td></tr>'}
      </tbody></table></div>
    </div>`;
  document.getElementById('fx-add-debt')?.addEventListener('click',openDebtModal);
  root.querySelectorAll('[data-fx-pay]').forEach(b=>b.addEventListener('click',async()=>{const {error}=await db.from('debts').update({remaining_amount:0,status:'paid',updated_at:new Date().toISOString()}).eq('id',b.dataset.fxPay);if(error)toast(error.message);else{toast('Debt marked paid');await renderDebtPage();}}));
  root.querySelectorAll('[data-fx-del-debt]').forEach(b=>b.addEventListener('click',async()=>{if(!confirm('Delete this debt?'))return;const {error}=await db.from('debts').delete().eq('id',b.dataset.fxDelDebt);if(error)toast(error.message);else{toast('Debt deleted');await renderDebtPage();}}));
}

async function openDebtModal(){
  const backdrop=openOverlay('fx-debt-modal','Add debt',`<form id="fx-debt-form" class="form"><div class="fx-enhance-grid"><div class="fx-enhance-field"><label class="fx-enhance-label">What is it?</label><input class="fx-enhance-input" id="fx-d-name" placeholder="Telus bill / Loan from John" required></div><div class="fx-enhance-field"><label class="fx-enhance-label">To / From whom?</label><input class="fx-enhance-input" id="fx-d-counterparty" placeholder="Telus or John" required></div><div class="fx-enhance-field"><label class="fx-enhance-label">Direction</label><select class="fx-enhance-select" id="fx-d-direction"><option value="owed_by_me">I owe them</option><option value="owed_to_me">They owe me</option></select></div><div class="fx-enhance-field"><label class="fx-enhance-label">Currency</label><select class="fx-enhance-select" id="fx-d-currency"><option>ETB</option><option>USD</option></select></div><div class="fx-enhance-field"><label class="fx-enhance-label">Original amount</label><input class="fx-enhance-input" id="fx-d-original" type="number" min="0.01" step="0.01" required></div><div class="fx-enhance-field"><label class="fx-enhance-label">Remaining amount</label><input class="fx-enhance-input" id="fx-d-remaining" type="number" min="0" step="0.01" required></div><div class="fx-enhance-field"><label class="fx-enhance-label">Due date</label><input class="fx-enhance-input" id="fx-d-date" type="date"></div><div class="fx-enhance-field"><label class="fx-enhance-label">Minimum payment</label><input class="fx-enhance-input" id="fx-d-min" type="number" min="0" step="0.01" value="0"></div><div class="fx-enhance-field" style="grid-column:1/-1"><label class="fx-enhance-label">Notes</label><input class="fx-enhance-input" id="fx-d-notes" placeholder="Reference, payment plan, reminder"></div></div><div class="fx-enhance-actions"><button type="button" class="btn btn-secondary" data-close-overlay>Cancel</button><button class="btn btn-primary">Save debt</button></div></form>`);
  backdrop.querySelector('#fx-debt-form').addEventListener('submit',async e=>{e.preventDefault();const user=await getUser();const original=n(document.querySelector('#fx-d-original').value);const remaining=n(document.querySelector('#fx-d-remaining').value);const payload={user_id:user.id,name:document.querySelector('#fx-d-name').value.trim(),counterparty:document.querySelector('#fx-d-counterparty').value.trim(),direction:document.querySelector('#fx-d-direction').value,currency:document.querySelector('#fx-d-currency').value,original_amount:original,remaining_amount:remaining,due_date:document.querySelector('#fx-d-date').value||null,minimum_payment:n(document.querySelector('#fx-d-min').value),notes:document.querySelector('#fx-d-notes').value.trim()||null,status:remaining<=0?'paid':'open'};const {error}=await db.from('debts').insert(payload);if(error){toast(error.message);return}backdrop.remove();toast('Debt added');await renderDebtPage();});
}

function normalizeHeader(h){return String(h||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();}
function parseCsv(text){
  const rows=[];let row=[],cell='',quoted=false;
  for(let i=0;i<text.length;i++){const ch=text[i],next=text[i+1];if(ch==='"'){if(quoted&&next==='"'){cell+='"';i++;}else quoted=!quoted;}else if(ch===','&&!quoted){row.push(cell);cell='';}else if((ch==='\n'||ch==='\r')&&!quoted){if(ch==='\r'&&next==='\n')i++;row.push(cell);cell='';if(row.some(v=>String(v).trim()!==''))rows.push(row);row=[];}else cell+=ch;}
  if(cell!==''||row.length){row.push(cell);if(row.some(v=>String(v).trim()!==''))rows.push(row);}return rows;
}
function findHeader(headers, tests){return headers.findIndex(h=>tests.some(t=>h.includes(t)));}
function parseDate(v){const s=String(v||'').trim();if(!s)return today();if(/^\d{4}-\d{2}-\d{2}$/.test(s))return s;const m=s.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{2,4})$/);if(m){let y=Number(m[3]);if(y<100)y+=2000;let a=Number(m[1]),b=Number(m[2]);if(a>12)[b,a]=[a,b];return `${y}-${String(b).padStart(2,'0')}-${String(a).padStart(2,'0')}`;}const d=new Date(s);return Number.isNaN(d.getTime())?today():d.toISOString().slice(0,10);}
function getType(amount,debit,credit,type){const t=String(type||'').toLowerCase();if(/income|deposit|credit|received|salary/.test(t))return 'income';if(/expense|debit|withdraw|purchase|payment/.test(t))return 'expense';if(n(credit)>0&&n(debit)===0)return 'income';if(n(debit)>0&&n(credit)===0)return 'expense';return n(amount)<0?'expense':'income';}

async function openCsvImport(){
  const backdrop=openOverlay('fx-csv-modal','Import transactions from CSV',`<div class="fx-enhance-muted">Upload a bank/finance CSV. The importer auto-detects common columns, matches accounts/categories, preserves the source row reference, and prevents duplicate imports when the same reference is present.</div><div style="margin-top:14px"><input id="fx-csv-file" type="file" accept=".csv,text/csv" class="fx-enhance-input"></div><div id="fx-csv-stage" style="margin-top:14px"></div>`);
  backdrop.querySelector('#fx-csv-file').addEventListener('change',async e=>{const file=e.target.files?.[0];if(!file)return;const text=await file.text();const rows=parseCsv(text);if(rows.length<2){toast('CSV is empty or invalid.');return;}await renderCsvMapping(backdrop,rows);});
}

async function renderCsvMapping(backdrop,rows){
  const headers=rows[0].map(normalizeHeader);const sample=rows.slice(1,201);const user=await getUser();
  const [{data:accounts},{data:categories},{data:existing}]=await Promise.all([
    db.from('accounts').select('*').order('name'),db.from('categories').select('*').order('name'),db.from('transactions').select('external_ref').eq('source_type','csv').limit(10000)
  ]);
  const existingRefs=new Set((existing||[]).map(x=>x.external_ref).filter(Boolean));
  const dateIdx=findHeader(headers,['date','posted','transaction date']);
  const descIdx=findHeader(headers,['description','details','memo','merchant','narrative']);
  const amountIdx=findHeader(headers,['amount','transaction amount','value']);
  const debitIdx=findHeader(headers,['debit','withdrawal','money out']);
  const creditIdx=findHeader(headers,['credit','deposit','money in']);
  const typeIdx=findHeader(headers,['type','transaction type']);
  const currencyIdx=findHeader(headers,['currency','curr']);
  const accountIdx=findHeader(headers,['account','account name']);
  const categoryIdx=findHeader(headers,['category']);
  const refIdx=findHeader(headers,['reference','ref','transaction id','id']);
  const mapping=`<div class="fx-enhance-grid"><div class="fx-enhance-field"><label class="fx-enhance-label">Date column</label><select class="fx-enhance-select" id="fx-map-date">${headers.map((h,i)=>`<option value="${i}" ${i===dateIdx?'selected':''}>${esc(rows[0][i])}</option>`).join('')}</select></div><div class="fx-enhance-field"><label class="fx-enhance-label">Description column</label><select class="fx-enhance-select" id="fx-map-desc">${headers.map((h,i)=>`<option value="${i}" ${i===descIdx?'selected':''}>${esc(rows[0][i])}</option>`).join('')}</select></div><div class="fx-enhance-field"><label class="fx-enhance-label">Amount column</label><select class="fx-enhance-select" id="fx-map-amount"><option value="-1">None (use Debit/Credit)</option>${headers.map((h,i)=>`<option value="${i}" ${i===amountIdx?'selected':''}>${esc(rows[0][i])}</option>`).join('')}</select></div><div class="fx-enhance-field"><label class="fx-enhance-label">Debit column</label><select class="fx-enhance-select" id="fx-map-debit"><option value="-1">None</option>${headers.map((h,i)=>`<option value="${i}" ${i===debitIdx?'selected':''}>${esc(rows[0][i])}</option>`).join('')}</select></div><div class="fx-enhance-field"><label class="fx-enhance-label">Credit column</label><select class="fx-enhance-select" id="fx-map-credit"><option value="-1">None</option>${headers.map((h,i)=>`<option value="${i}" ${i===creditIdx?'selected':''}>${esc(rows[0][i])}</option>`).join('')}</select></div><div class="fx-enhance-field"><label class="fx-enhance-label">Currency column</label><select class="fx-enhance-select" id="fx-map-currency"><option value="-1">Default ETB</option>${headers.map((h,i)=>`<option value="${i}" ${i===currencyIdx?'selected':''}>${esc(rows[0][i])}</option>`).join('')}</select></div><div class="fx-enhance-field"><label class="fx-enhance-label">Account column</label><select class="fx-enhance-select" id="fx-map-account"><option value="-1">Use selected account</option>${headers.map((h,i)=>`<option value="${i}" ${i===accountIdx?'selected':''}>${esc(rows[0][i])}</option>`).join('')}</select></div><div class="fx-enhance-field"><label class="fx-enhance-label">Category column</label><select class="fx-enhance-select" id="fx-map-category"><option value="-1">Auto-match category</option>${headers.map((h,i)=>`<option value="${i}" ${i===categoryIdx?'selected':''}>${esc(rows[0][i])}</option>`).join('')}</select></div><div class="fx-enhance-field"><label class="fx-enhance-label">Reference column</label><select class="fx-enhance-select" id="fx-map-ref"><option value="-1">Build reference automatically</option>${headers.map((h,i)=>`<option value="${i}" ${i===refIdx?'selected':''}>${esc(rows[0][i])}</option>`).join('')}</select></div><div class="fx-enhance-field"><label class="fx-enhance-label">Default account</label><select class="fx-enhance-select" id="fx-default-account">${(accounts||[]).map(a=>`<option value="${a.id}">${esc(a.name)} (${esc(a.currency)})</option>`).join('')}</select></div></div><div id="fx-csv-preview" style="margin-top:14px"></div><div class="fx-enhance-actions"><button class="btn btn-secondary" data-close-overlay>Cancel</button><button class="btn btn-primary" id="fx-csv-import">Import rows</button></div>`;
  backdrop.querySelector('#fx-csv-stage').innerHTML=mapping;
  const preview=()=>{const vals=sample.slice(0,5).map(r=>{const amountIdx=Number(backdrop.querySelector('#fx-map-amount').value);const debitIdx=Number(backdrop.querySelector('#fx-map-debit').value);const creditIdx=Number(backdrop.querySelector('#fx-map-credit').value);const raw=amountIdx>=0?r[amountIdx]:n(r[debitIdx])-n(r[creditIdx]);const type=getType(raw,debitIdx>=0?r[debitIdx]:'',creditIdx>=0?r[creditIdx]:'',typeIdx>=0?r[typeIdx]:'');return `<tr><td>${esc(r[Number(backdrop.querySelector('#fx-map-date').value)])}</td><td>${esc(r[Number(backdrop.querySelector('#fx-map-desc').value)])}</td><td>${type}</td><td>${raw}</td></tr>`}).join('');backdrop.querySelector('#fx-csv-preview').innerHTML=`<div class="fx-enhance-card"><strong>Preview</strong><div class="fx-enhance-table-wrap"><table class="fx-enhance-table"><thead><tr><th>Date</th><th>Description</th><th>Type</th><th>Amount</th></tr></thead><tbody>${preview}</tbody></table></div><div class="fx-enhance-muted" style="margin-top:8px">Showing ${Math.min(sample.length,5)} of ${sample.length} sample rows.</div></div>`};
  backdrop.querySelectorAll('select').forEach(s=>s.addEventListener('change',preview));preview();
  backdrop.querySelector('#fx-csv-import').addEventListener('click',async()=>{
    const dateI=Number(backdrop.querySelector('#fx-map-date').value),descI=Number(backdrop.querySelector('#fx-map-desc').value),amountI=Number(backdrop.querySelector('#fx-map-amount').value),debitI=Number(backdrop.querySelector('#fx-map-debit').value),creditI=Number(backdrop.querySelector('#fx-map-credit').value),currencyI=Number(backdrop.querySelector('#fx-map-currency').value),accountI=Number(backdrop.querySelector('#fx-map-account').value),categoryI=Number(backdrop.querySelector('#fx-map-category').value),refI=Number(backdrop.querySelector('#fx-map-ref').value),defaultAccount=backdrop.querySelector('#fx-default-account').value;
    const targetAccount=(accounts||[]).find(a=>a.id===defaultAccount);const payloads=[];let skipped=0,invalid=0;
    for(const r of sample){
      const date=parseDate(r[dateI]);const description=String(r[descI]||'').trim();const cur=currencyI>=0?(String(r[currencyI]||'ETB').toUpperCase().includes('USD')?'USD':'ETB'):(targetAccount?.currency||'ETB');
      let raw=amountI>=0?n(r[amountI]):(n(r[debitI])-n(r[creditI]));
      if(!raw && debitI<0 && creditI<0){invalid++;continue;}
      const type=getType(raw,debitI>=0?r[debitI]:'',creditI>=0?r[creditI]:'',typeIdx>=0?r[typeIdx]:'');const abs=Math.abs(raw);const ref=String(refI>=0?r[refI]:`${date}|${description}|${abs}|${cur}`).trim();const ext=`csv:${ref}`;if(existingRefs.has(ext)){skipped++;continue;}
      let account=accountI>=0?((accounts||[]).find(a=>String(a.name).trim().toLowerCase()===String(r[accountI]||'').trim().toLowerCase())):null;account=account||targetAccount;
      if(!account){invalid++;continue;}
      const catText=categoryI>=0?String(r[categoryI]||'').trim().toLowerCase():'';let cat=null;if(catText)cat=(categories||[]).find(c=>String(c.name).toLowerCase()===catText);if(!cat){const hay=description.toLowerCase();const defaults=categories||[];cat=defaults.find(c=>c.type===type&&c.is_default)||defaults.find(c=>c.type===type&&hay.includes(String(c.name).toLowerCase()));}if(!cat){invalid++;continue;}
      const fx=cur==='USD'?null:1;payloads.push({user_id:user.id,account_id:account.id,category_id:cat.id,type,amount:abs,transaction_date:date,description,source_currency:cur,original_amount:abs,fx_rate:fx,fx_rate_date:null,source_type:'csv',external_ref:ext});existingRefs.add(ext);
    }
    const batchSize=250;let inserted=0;for(let i=0;i<payloads.length;i+=batchSize){const {error}=await db.from('transactions').insert(payloads.slice(i,i+batchSize));if(error){toast(error.message);return}inserted+=Math.min(batchSize,payloads.length-i);}
    backdrop.remove();toast(`Imported ${inserted} rows${skipped?`, skipped ${skipped} duplicates`:''}${invalid?`, ${invalid} rows need review`:''}`);window.location.reload();
  });
}

watch();
setTimeout(watch,200);
setTimeout(watch,1000);
