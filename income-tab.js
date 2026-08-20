import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const db = createClient('https://hznphzpukdwxyqgqksrx.supabase.co', 'sb_publishable_1CgZ5bRDG7tSltHDwIc5HQ_w1SQFR-9', { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } });
const esc = (v) => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const n = (v) => Number(v) || 0;
const today = () => new Date().toISOString().slice(0, 10);
const money = (v, c='ETB') => new Intl.NumberFormat('en-US', { style:'currency', currency:c === 'USD' ? 'USD' : 'ETB', maximumFractionDigits:2 }).format(n(v));
const dtext = (d) => d ? new Date(`${String(d).slice(0,10)}T00:00:00`).toLocaleDateString(undefined,{year:'numeric',month:'short',day:'numeric'}) : '—';
const toast = (m) => { const e=document.createElement('div'); e.className='toast'; e.textContent=m; document.body.appendChild(e); setTimeout(()=>e.remove(),2500); };
let user=null, rows=[], selected=new Set(), categories=[], accounts=[], rate=null;

function injectNav(){
  const nav=document.querySelector('.nav'); if(!nav)return;
  if(nav.querySelector('[data-income-tab]'))return;
  const b=document.createElement('button'); b.type='button'; b.textContent='My Income'; b.dataset.incomeTab='1'; nav.appendChild(b);
  b.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();openIncome()},{capture:true});
}
async function support(){
  const [a,c]=await Promise.all([
    db.from('accounts').select('id,name,currency').eq('is_deleted',false).order('name'),
    db.from('categories').select('id,name,type').eq('is_deleted',false).order('name')
  ]);
  accounts=a.data||[]; categories=c.data||[];
  if(a.error) throw a.error; if(c.error) throw c.error;
}
async function load(){
  const {data,error}=await db.from('transactions').select('*').eq('type','income').eq('source_type','income_tab').eq('is_deleted',false).order('transaction_date',{ascending:false}).order('created_at',{ascending:false});
  if(error)throw error; rows=data||[];
}
async function refreshRate(){
  try{ await db.functions.invoke('refresh-exchange-rate',{body:{}}); }catch(e){ console.warn('FX refresh',e); }
  const {data,error}=await db.from('exchange_rates').select('*').eq('base_currency','USD').eq('quote_currency','ETB').order('rate_date',{ascending:false}).order('fetched_at',{ascending:false}).limit(1).maybeSingle();
  if(error)throw error;
  rate=data||null;
  if(!rate)throw new Error('No USD/ETB exchange rate is available.');
  return rate;
}
function main(html){
  const m=document.querySelector('.main'); if(!m)return;
  const email=user?.email||'';
  m.innerHTML=`<div class="topbar"><div style="display:flex;align-items:center;gap:10px"><button class="mobile-menu" id="income-menu" type="button">☰</button><h1>My Income</h1></div><div class="user-pill"><div>${esc(email)}</div><div class="avatar">${esc((email||'?').slice(0,1).toUpperCase())}</div></div></div>${html}`;
  document.getElementById('income-menu')?.addEventListener('click',()=>document.getElementById('mobile-nav-toggle')?.click());
}
function item(r){
  const original = r.original_amount != null ? `${money(r.original_amount,r.source_currency||'ETB')} → ${money(r.amount,'ETB')}` : money(r.amount,'ETB');
  const frequency = r.income_frequency ? ` · ${r.income_frequency === 'biweekly' ? 'Bi-weekly' : r.income_frequency === 'monthly' ? 'Monthly' : 'Other'}` : '';
  return `<div class="income-row"><input class="income-check" type="checkbox" value="${esc(r.id)}" data-income-check><div><strong>${esc(r.description||'Income')}</strong><div class="income-meta">${dtext(r.transaction_date)} · ${original}${frequency}</div></div><div class="income-actions"><button class="btn btn-secondary btn-small" data-income-edit="${esc(r.id)}">Edit</button><button class="btn btn-danger btn-small" data-income-delete="${esc(r.id)}">Delete</button></div></div>`;
}
function bar(){
  return `<div class="income-toolbar"><button class="btn btn-primary" id="income-add">Add income</button><div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap"><label style="display:flex;gap:8px;align-items:center;font-weight:800"><input id="income-all" type="checkbox"> Select all</label><span id="income-selected">0 selected</span><input id="income-search" placeholder="Search income…" aria-label="Search income"></div></div><div id="income-bulk" class="income-bulk"><span id="income-bulk-count">0 selected</span><div><button class="btn btn-secondary btn-small" id="income-deselect">Deselect all</button><button class="btn btn-danger btn-small" id="income-delete-selected">Delete selected</button></div></div>`;
}
function bind(){
  const sync=()=>{ const all=document.getElementById('income-all'); document.getElementById('income-selected').textContent=`${selected.size} selected`; document.getElementById('income-bulk-count').textContent=`${selected.size} selected`; document.getElementById('income-bulk').classList.toggle('open',selected.size>0); if(all){all.checked=selected.size===rows.length&&rows.length>0;all.indeterminate=selected.size>0&&selected.size<rows.length;} document.querySelectorAll('[data-income-check]').forEach(x=>{x.checked=selected.has(x.value);x.closest('.income-row')?.classList.toggle('selected',x.checked);}); };
  document.getElementById('income-all')?.addEventListener('change',e=>{selected=e.target.checked?new Set(rows.map(r=>r.id)):new Set();sync();});
  document.querySelectorAll('[data-income-check]').forEach(x=>x.addEventListener('change',()=>{x.checked?selected.add(x.value):selected.delete(x.value);sync();}));
  document.getElementById('income-deselect')?.addEventListener('click',()=>{selected.clear();sync();});
  document.getElementById('income-delete-selected')?.addEventListener('click',async()=>{if(!selected.size)return;if(!confirm(`Move ${selected.size} selected income item${selected.size===1?'':'s'} to Trash?`))return;const{error}=await db.from('transactions').update({is_deleted:true,deleted_at:new Date().toISOString()}).in('id',[...selected]);if(error)toast(error.message);else{toast('Income moved to Trash');openIncome();}});
  document.getElementById('income-search')?.addEventListener('input',e=>{const q=e.target.value.toLowerCase();document.querySelectorAll('.income-row').forEach(x=>x.style.display=x.textContent.toLowerCase().includes(q)?'':'none');});
  sync();
}
function modal(title,t){
  const box=document.createElement('div'); box.className='income-modal';
  const incomeCats=categories.filter(c=>c.type==='income');
  const currentOriginal = t?.source_currency === 'USD' ? (t?.original_amount ?? '') : '';
  box.innerHTML=`<div class="income-box"><div style="display:flex;justify-content:space-between;align-items:center"><h2 style="margin:0">${esc(title)}</h2><button class="btn btn-secondary" id="income-close">Close</button></div><form id="income-form" class="form" style="margin-top:16px"><div class="form-grid"><div class="field"><label>Income amount (USD)</label><input id="inc-usd" type="number" step="0.01" min="0.01" value="${esc(currentOriginal)}" required></div><div class="field"><label>Payment date</label><input id="inc-date" type="date" value="${esc(t?.transaction_date||today())}" required></div></div><div class="form-grid"><div class="field"><label>Account</label><select id="inc-account" required><option value="">Select account</option>${accounts.map(a=>`<option value="${esc(a.id)}" ${String(a.id)===String(t?.account_id||'')?'selected':''}>${esc(a.name)}${a.currency?` · ${esc(a.currency)}`:''}</option>`).join('')}</select></div><div class="field"><label>Income category</label><select id="inc-category" required><option value="">Select category</option>${incomeCats.map(c=>`<option value="${esc(c.id)}" ${String(c.id)===String(t?.category_id||'')?'selected':''}>${esc(c.name)}</option>`).join('')}</select></div></div><div class="form-grid"><div class="field"><label>Pay frequency</label><select id="inc-frequency"><option value="monthly" ${t?.income_frequency==='monthly'?'selected':''}>Monthly</option><option value="biweekly" ${t?.income_frequency==='biweekly'?'selected':''}>Bi-weekly</option><option value="other" ${t?.income_frequency==='other'?'selected':''}>Other</option></select></div><div class="field"><label>USD / ETB rate</label><input id="inc-rate" value="${rate ? Number(rate.rate).toFixed(4) : 'Loading…'}" readonly></div></div><div class="income-conversion" id="income-conversion">${rate && currentOriginal ? `<strong>Converted ETB: ${money(n(currentOriginal)*n(rate.rate),'ETB')}</strong><span class="muted">Rate date: ${esc(rate.rate_date)}</span>` : 'Current USD/ETB conversion will appear here.'}</div><div class="field"><label>Description</label><input id="inc-description" value="${esc(t?.description||'Salary / income payment')}"></div><div class="actions"><button type="button" class="btn btn-secondary" id="income-cancel">Cancel</button><button class="btn btn-primary">${t?'Save changes':'Add income'}</button></div></form></div>`;
  document.body.appendChild(box);
  const usd=box.querySelector('#inc-usd'), converted=box.querySelector('#income-conversion');
  const updateConversion=()=>{ if(rate && n(usd.value)>0){converted.innerHTML=`<strong>Converted ETB: ${money(n(usd.value)*n(rate.rate),'ETB')}</strong><span class="muted">Rate date: ${esc(rate.rate_date)} · 1 USD = ${Number(rate.rate).toFixed(4)} ETB</span>`;} };
  usd.addEventListener('input',updateConversion);
  box.querySelector('#income-close').onclick=()=>box.remove(); box.querySelector('#income-cancel').onclick=()=>box.remove();
  box.querySelector('#income-form').onsubmit=async e=>{e.preventDefault();try{const selectedRate=await refreshRate();const originalUsd=n(usd.value);const etb=originalUsd*n(selectedRate.rate);const p={type:'income',account_id:box.querySelector('#inc-account').value,category_id:box.querySelector('#inc-category').value,amount:etb,transaction_date:box.querySelector('#inc-date').value,source_currency:'USD',original_amount:originalUsd,fx_rate:n(selectedRate.rate),fx_rate_date:selectedRate.rate_date,description:box.querySelector('#inc-description').value.trim()||null,income_frequency:box.querySelector('#inc-frequency').value,source_type:'income_tab'};const q=t?db.from('transactions').update(p).eq('id',t.id):db.from('transactions').insert({...p,user_id:user.id});const{error}=await q;if(error)throw error;box.remove();toast(t?'Income updated':'Income added');openIncome();}catch(error){toast(error.message||'Could not save income.');}};
}
async function openIncome(){
  const m=document.querySelector('.main'); if(!m)return; selected=new Set();
  main('<div class="card"><div id="income-head"></div><div class="income-list" id="income-list"><div class="empty">Loading income…</div></div></div>');
  try{await support();await load(); const month=today().slice(0,7);const thisMonth=rows.filter(r=>String(r.transaction_date).slice(0,7)===month).reduce((s,r)=>s+n(r.amount),0);document.getElementById('income-head').innerHTML=`${bar()}<div class="income-summary"><div><div class="muted">This month</div><strong>${money(thisMonth)}</strong><span class="muted" style="display:block;font-size:11px;margin-top:3px">Converted to ETB for dashboard totals</span></div><div><div class="muted">Payments</div><strong>${rows.filter(r=>String(r.transaction_date).slice(0,7)===month).length}</strong></div></div>`;document.getElementById('income-list').innerHTML=rows.map(item).join('')||'<div class="empty">No income entries yet. Add your monthly or bi-weekly payment here.</div>';bind();document.getElementById('income-add').onclick=async()=>{try{rate=await refreshRate();modal('Add income',null);}catch(error){toast(error.message||'Could not load FX rate.');}};document.querySelectorAll('[data-income-edit]').forEach(b=>b.onclick=async()=>{try{rate=await refreshRate();modal('Edit income',rows.find(r=>r.id===b.dataset.incomeEdit));}catch(error){toast(error.message||'Could not load FX rate.');}});document.querySelectorAll('[data-income-delete]').forEach(b=>b.onclick=async()=>{if(!confirm('Move this income entry to Trash?'))return;const{error}=await db.from('transactions').update({is_deleted:true,deleted_at:new Date().toISOString()}).eq('id',b.dataset.incomeDelete);if(error)toast(error.message);else{toast('Income moved to Trash');openIncome();}});}catch(e){document.getElementById('income-list').innerHTML=`<div class="notice">Could not load income: ${esc(e.message||'Unknown error')}</div>`;}
}
const style=document.createElement('style');style.textContent=`.income-toolbar{display:flex;justify-content:space-between;gap:10px;align-items:center;flex-wrap:wrap}.income-toolbar>div{display:flex;gap:10px;align-items:center;flex-wrap:wrap}.income-toolbar input{padding:10px 12px;border:1px solid var(--line);border-radius:11px;min-width:220px}.income-bulk{display:none;position:sticky;top:4px;z-index:8;background:#fff;border:1px solid var(--line);border-radius:14px;padding:10px;margin-bottom:12px;justify-content:space-between;gap:8px;align-items:center}.income-bulk.open{display:flex}.income-summary{display:grid;grid-template-columns:repeat(2,1fr);gap:12px;margin:12px 0 14px}.income-summary>div{background:#f7f8fb;border-radius:14px;padding:14px}.income-list{display:grid;gap:10px}.income-row{display:grid;grid-template-columns:auto 1fr auto;gap:12px;align-items:center;border:1px solid var(--line);border-radius:14px;padding:14px;background:#fff}.income-row.selected{border-color:#aab8ff;background:#f8faff}.income-check{width:20px;height:20px}.income-meta{font-size:12px;color:var(--muted);margin-top:4px}.income-actions{display:flex;gap:7px}.income-conversion{display:flex;justify-content:space-between;gap:10px;align-items:center;flex-wrap:wrap;background:#f7f8fb;border-radius:12px;padding:12px;font-size:12px}.income-modal{position:fixed;inset:0;background:rgba(15,23,42,.5);display:grid;place-items:center;padding:16px;z-index:10070}.income-box{width:min(620px,100%);max-height:92vh;overflow:auto;background:#fff;border-radius:20px;padding:20px}@media(max-width:760px){.income-row{grid-template-columns:auto 1fr}.income-actions{grid-column:2;display:grid;grid-template-columns:1fr 1fr}.income-actions .btn{width:100%}.income-toolbar input{min-width:0;width:100%}.income-summary{grid-template-columns:1fr}.income-conversion{display:grid}.income-box{width:100%;border-radius:22px 22px 0 0;max-height:92dvh;padding:18px 16px calc(18px + env(safe-area-inset-bottom))}.income-modal{place-items:end;padding:0}.income-toolbar>div{width:100%}}`;document.head.appendChild(style);
(async()=>{user=(await db.auth.getUser()).data.user;injectNav();new MutationObserver(()=>injectNav()).observe(document.body,{childList:true,subtree:true);})();
