import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const db=createClient('https://hznphzpukdwxyqgqksrx.supabase.co','sb_publishable_1CgZ5bRDG7tSltHDwIc5HQ_w1SQFR-9',{auth:{persistSession:true,autoRefreshToken:true}});
const HEAD=['record_type','name','counterparty','direction','description','type','date','amount','original_amount','remaining_amount','currency','source_currency','account','account_type','opening_balance','category','month','due_date','frequency','is_paid','target_amount','current_amount','minimum_payment','notes','reference'];
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const n=v=>Number(String(v??'').replace(/,/g,''))||0;
const today=()=>new Date().toISOString().slice(0,10);
const norm=v=>String(v??'').toLowerCase().trim();
const date=v=>{const s=String(v??'').trim();if(!s)return null;if(/^\d{4}-\d{2}-\d{2}$/.test(s))return s;const d=new Date(s);return Number.isNaN(d.getTime())?null:d.toISOString().slice(0,10)};
const bool=v=>/^(1|true|yes|y|paid)$/i.test(String(v??'').trim());
const csv=v=>{const s=String(v??'');return /[",\n]/.test(s)?`"${s.replace(/"/g,'""')}"`:s};
const parseCsv=text=>{const rows=[];let row=[],cell='',q=false;for(let i=0;i<text.length;i++){const c=text[i],nx=text[i+1];if(c==='"'){if(q&&nx==='"'){cell+='"';i++}else q=!q}else if(c===','&&!q){row.push(cell);cell=''}else if((c==='\n'||c==='\r')&&!q){if(c==='\r'&&nx==='\n')i++;row.push(cell);cell='';if(row.some(v=>String(v).trim()))rows.push(row);row=[]}else cell+=c}if(cell||row.length){row.push(cell);if(row.some(v=>String(v).trim()))rows.push(row)}return rows};
const download=(name,text)=>{const blob=new Blob([text],{type:'text/csv;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();URL.revokeObjectURL(url)};
const toast=msg=>{const e=document.createElement('div');e.className='toast';e.textContent=msg;document.body.appendChild(e);setTimeout(()=>e.remove(),2600)};
const getUser=async()=> (await db.auth.getUser()).data.user;
const money=(v,c='ETB')=>new Intl.NumberFormat('en-US',{style:'currency',currency:c==='USD'?'USD':'ETB',maximumFractionDigits:2}).format(n(v));

const css=document.createElement('style');css.textContent=`.fcv2-back{position:fixed;inset:0;background:rgba(15,23,42,.45);display:grid;place-items:center;padding:18px;z-index:10020}.fcv2-modal{width:min(1050px,100%);max-height:92vh;overflow:auto;background:#fff;border-radius:20px;padding:20px;box-shadow:0 30px 90px rgba(0,0,0,.22)}.fcv2-help{padding:11px 13px;background:#f6f7fb;border-radius:11px;font-size:12px;color:var(--muted);line-height:1.55}.fcv2-actions{display:flex;gap:8px;justify-content:flex-end;flex-wrap:wrap;margin-top:14px}.fcv2-table{width:100%;border-collapse:collapse;margin-top:12px}.fcv2-table th,.fcv2-table td{padding:8px;border-bottom:1px solid var(--line);font-size:12px;text-align:left;white-space:nowrap}@media(max-width:760px){.fcv2-actions .btn{flex:1}}`;document.head.appendChild(css);

function overlay(title,body){const b=document.createElement('div');b.className='fcv2-back';b.innerHTML=`<div class="fcv2-modal"><div style="display:flex;justify-content:space-between;gap:10px;align-items:center"><h2 style="margin:0">${esc(title)}</h2><button class="btn btn-secondary" data-close>Close</button></div><div style="margin-top:16px">${body}</div></div>`;document.body.appendChild(b);b.querySelector('[data-close]').onclick=()=>b.remove();return b}
function template(){const rows=[
HEAD,
['account','Main Bank','','','','','','','','','ETB','','','bank','10000','','','','','','','','','',''],
['category','Groceries','','','','expense','','','','','','','','','','Groceries','','','','','','','',''],
['transaction','','','','Groceries purchase','expense','2026-08-18','250','250','','ETB','ETB','Main Bank','', '', 'Groceries','','','','','','','','','BANK-001'],
['budget','Groceries','','','','','','1500','','','ETB','','','', '', 'Groceries','2026-08-01','','','','','','','',''],
['bill','Internet','','','','','','1700','','','ETB','','Main Bank','bank','','','', '2026-08-20','monthly','false','','','',''],
['savings_goal','New laptop','','','','','','','','','ETB','','Main Bank','savings','','','', '2026-12-31','','','15000','5000','','',''],
['debt','Telus','Telus','owed_by_me','Phone balance','','','1700','1700','1700','CAD','','','','','','','2026-08-30','one_time','false','','','100','','August balance',''],
];return rows.map(r=>r.map(csv).join(',')).join('\n')+'\n'}

async function exportCsv(){
  try{
    const [{data:a},{data:c},{data:t},{data:b},{data:bill},{data:g},{data:d}]=await Promise.all([db.from('accounts').select('*').order('name'),db.from('categories').select('*').order('name'),db.from('transactions').select('*').order('transaction_date',{ascending:false}),db.from('budgets').select('*').order('month',{ascending:false}),db.from('bills').select('*').order('due_date'),db.from('savings_goals').select('*').order('created_at',{ascending:false}),db.from('debts').select('*').order('due_date')]);
    const am=new Map((a||[]).map(x=>[x.id,x])),cm=new Map((c||[]).map(x=>[x.id,x]));const out=[HEAD];
    (a||[]).forEach(x=>out.push(['account',x.name,'','','','','','','','',x.currency,'','',x.type,x.opening_balance,'','','','','','','','','','']));
    (c||[]).forEach(x=>out.push(['category',x.name,'','','',x.type,'','','','','','','','','',x.name,'','','','','','','','','']));
    (t||[]).forEach(x=>{const ac=am.get(x.account_id),ca=cm.get(x.category_id);out.push(['transaction','', '', '',x.description||'',x.type,x.transaction_date,x.original_amount??x.amount,x.original_amount??x.amount,'',ac?.currency||x.source_currency,x.source_currency,ac?.name||'','', '',ca?.name||'','','','','','','','',x.note||'',x.external_ref||''])});
    (b||[]).forEach(x=>{const ca=cm.get(x.category_id);out.push(['budget',ca?.name||'','','','','','',x.amount,x.amount,'','ETB','','','', '',ca?.name||'',x.month,'','','','','','','',''])});
    (bill||[]).forEach(x=>{const ac=am.get(x.account_id);out.push(['bill',x.name,'','','','','',x.amount,x.amount,'','ETB','',ac?.name||'','', '', '', '',x.due_date,x.frequency,x.is_paid,'','','',''])});
    (g||[]).forEach(x=>{const ac=am.get(x.account_id);out.push(['savings_goal',x.name,'','','','','','','','',ac?.currency||'ETB','',ac?.name||'','', '', '', '',x.target_date,'', '',x.target_amount,x.current_amount,'',''])});
    (d||[]).forEach(x=>out.push(['debt',x.name,x.counterparty||'',x.direction||'owed_by_me','','','',x.original_amount,x.original_amount,x.remaining_amount,x.currency,'','','','','','','',x.due_date,'one_time',x.status==='paid','','',x.minimum_payment,x.notes||'','']));
    download(`finance-hub-${today()}.csv`,out.map(r=>r.map(csv).join(',')).join('\n'));toast('CSV exported');
  }catch(e){toast(e.message||'Export failed')}
}

function inject(){
  const root=document.querySelector('#root');if(!root)return;
  const settingsHeading=[...root.querySelectorAll('.card h3')].find(h=>h.textContent.trim()==='Data export');
  const settingsCard=settingsHeading?.closest('.card');
  if(settingsCard&&settingsCard.dataset.fcv2!=='1'){
    settingsCard.dataset.fcv2='1';settingsCard.querySelector('#export-all')?.remove();
    const actions=document.createElement('div');actions.className='fcv2-actions';actions.innerHTML='<button class="btn btn-secondary" id="fcv2-export">Export CSV</button><button class="btn btn-primary" id="fcv2-import">Import CSV</button>';
    settingsCard.appendChild(actions);actions.querySelector('#fcv2-export').onclick=exportCsv;actions.querySelector('#fcv2-import').onclick=()=>openImport();
  }
}
new MutationObserver(inject).observe(document.body,{childList:true,subtree:true});setTimeout(inject,150);

async function openImport(){
  const b=overlay('Import Finance Hub CSV',`<div class="fcv2-help"><strong>Use the exact Finance Hub format below.</strong><br>One CSV can contain accounts, categories, transactions, budgets, bills, savings goals, and debts. Each row is identified by <code>record_type</code>.<br><br><strong>Supported record types:</strong> account · category · transaction · budget · bill · savings_goal · debt</div><input id="fcv2-file" type="file" accept=".csv,text/csv" style="margin-top:14px"><div class="fcv2-actions"><button class="btn btn-secondary" id="fcv2-template">Download template</button></div><div id="fcv2-stage"></div>`);
  b.querySelector('#fcv2-template').onclick=()=>download('finance-hub-import-template.csv',template());
  b.querySelector('#fcv2-file').onchange=async e=>{const f=e.target.files?.[0];if(!f)return;const rows=parseCsv(await f.text());if(rows.length<2){toast('CSV needs a header and at least one data row');return}const headers=rows[0].map(norm);const ok=HEAD.every((h,i)=>headers[i]===h);if(!ok){toast('Wrong CSV header. Download the template and use it exactly.');return}b.querySelector('#fcv2-stage').innerHTML=`<table class="fcv2-table"><thead><tr><th>Record type</th><th>Name</th><th>Description</th><th>Amount</th><th>Date</th></tr></thead><tbody>${rows.slice(1,9).map(r=>`<tr><td>${esc(r[0])}</td><td>${esc(r[1])}</td><td>${esc(r[4])}</td><td>${esc(r[7])}</td><td>${esc(r[6]||r[17])}</td></tr>`).join('')}</tbody></table><div class="muted" style="font-size:12px;margin-top:8px">${rows.length-1} rows ready to import.</div><div class="fcv2-actions"><button class="btn btn-primary" id="fcv2-run">Import ${rows.length-1} rows</button></div>`;b.querySelector('#fcv2-run').onclick=()=>runImport(b,rows)};
}

async function runImport(b,rows){
  const u=await getUser();if(!u)return;
  const [{data:a0},{data:c0},{data:r0}]=await Promise.all([db.from('accounts').select('*'),db.from('categories').select('*'),db.from('exchange_rates').select('*').eq('base_currency','USD').eq('quote_currency','ETB').order('rate_date',{ascending:false}).order('fetched_at',{ascending:false}).limit(1)]);
  const accounts=new Map((a0||[]).map(x=>[norm(x.name),x])),cats=new Map((c0||[]).map(x=>[`${x.type}:${norm(x.name)}`,x])),rate=n(r0?.[0]?.rate);let ok=0,fail=0;
  const getAccount=async(name,currency='ETB',type='bank',opening=0)=>{const key=norm(name);if(!key)return null;if(accounts.has(key))return accounts.get(key);const {data,error}=await db.from('accounts').insert({user_id:u.id,name:String(name).trim(),type:type||'bank',currency:currency||'ETB',opening_balance:n(opening)}).select().single();if(error)throw error;accounts.set(key,data);return data};
  const getCategory=async(name,type)=>{const safeName=String(name||`Uncategorized ${type==='expense'?'Expense':'Income'}`).trim();const key=`${type}:${norm(safeName)}`;if(cats.has(key))return cats.get(key);const {data,error}=await db.from('categories').insert({user_id:u.id,name:safeName,type,is_default:false}).select().single();if(error)throw error;cats.set(key,data);return data};
  for(const r of rows.slice(1)){
    try{
      const rt=norm(r[0]),name=String(r[1]||'').trim(),currency=String(r[10]||'ETB').trim().toUpperCase()||'ETB',sourceCurrency=String(r[11]||currency).trim().toUpperCase()||currency;
      if(rt==='account'){await getAccount(name,currency,r[13]||'bank',r[14]);ok++;continue}
      if(rt==='category'){await getCategory(name,r[5]==='income'?'income':'expense');ok++;continue}
      if(rt==='transaction'){
        const ac=await getAccount(r[12],sourceCurrency,r[13]||'bank',0);const type=['income','expense'].includes(norm(r[5]))?norm(r[5]):(n(r[7])<0?'expense':'income');const cat=await getCategory(r[15],type);const original=n(r[8]||r[7]);if(!original)throw new Error('Missing transaction amount');const base=sourceCurrency==='USD'?(rate?original*rate:original):original;const {error}=await db.from('transactions').insert({user_id:u.id,account_id:ac.id,category_id:cat.id,type,amount:base,transaction_date:date(r[6])||today(),description:String(r[4]||'').trim()||name||null,source_currency:sourceCurrency,original_amount:original,fx_rate:sourceCurrency==='USD'&&rate?rate:1,fx_rate_date:sourceCurrency==='USD'&&rate?(r0?.[0]?.rate_date||today()):null,source_type:'csv',external_ref:String(r[24]||'').trim()||null});if(error)throw error;ok++;continue}
      if(rt==='budget'){const cat=await getCategory(r[15],'expense');const {error}=await db.from('budgets').insert({user_id:u.id,category_id:cat.id,month:date(r[16])||`${today().slice(0,7)}-01`,amount:n(r[7])});if(error)throw error;ok++;continue}
      if(rt==='bill'){const ac=r[12]?await getAccount(r[12],currency,r[13]||'bank',0):null;const {error}=await db.from('bills').insert({user_id:u.id,name:name||'Imported bill',amount:n(r[7]),due_date:date(r[17])||today(),frequency:r[18]||'one_time',is_paid:bool(r[19]),account_id:ac?.id||null});if(error)throw error;ok++;continue}
      if(rt==='savings_goal'){const ac=r[12]?await getAccount(r[12],currency,r[13]||'savings',0):null;const {error}=await db.from('savings_goals').insert({user_id:u.id,name:name||'Imported goal',target_amount:n(r[20]),current_amount:n(r[21]),target_date:date(r[17]),account_id:ac?.id||null});if(error)throw error;ok++;continue}
      if(rt==='debt'){const remaining=n(r[9]||r[7]);const {error}=await db.from('debts').insert({user_id:u.id,name:name||'Imported debt',counterparty:String(r[2]||'').trim()||null,direction:r[3]||'owed_by_me',original_amount:n(r[8]||r[7]),remaining_amount:remaining,currency,status:bool(r[19])||remaining<=0?'paid':'open',due_date:date(r[17]),minimum_payment:n(r[22]),notes:String(r[23]||'').trim()||null});if(error)throw error;ok++;continue}
    }catch(e){fail++;console.error('Import row failed',e,r)}
  }
  b.remove();toast(`Imported ${ok} rows${fail?`, ${fail} failed`:''}`);location.reload();
}

window.financeHubCsv={openImport,exportCsv,template};
