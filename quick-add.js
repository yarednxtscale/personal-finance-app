import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const SUPABASE_URL = 'https://hznphzpukdwxyqgqksrx.supabase.co';
const SUPABASE_KEY = 'sb_publishable_1CgZ5bRDG7tSltHDwIc5HQ_w1SQFR-9';
const db = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: true, autoRefreshToken: true } });

const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
const n = (v) => Number(v) || 0;
const today = () => new Date().toISOString().slice(0,10);
const money = (v, c='ETB') => new Intl.NumberFormat('en-US',{style:'currency',currency:c,maximumFractionDigits:2}).format(n(v));
const normalize = (s) => s.toLowerCase().replace(/[,$]/g,'').replace(/\s+/g,' ').trim();

const style = document.createElement('style');
style.textContent = `.quick-add{background:#fff;border:1px solid #e6e8ef;border-radius:18px;padding:18px;margin-bottom:16px;box-shadow:0 10px 35px rgba(23,32,51,.07)}.quick-add-head{display:flex;justify-content:space-between;align-items:center;gap:10px}.quick-add-title{font-weight:800;font-size:16px}.quick-add-sub{font-size:12px;color:#667085;margin-top:3px}.quick-add-form{display:flex;gap:10px;margin-top:12px}.quick-add-input{flex:1;border:1px solid #d8dce5;border-radius:12px;padding:12px 14px;font-size:14px;outline:none}.quick-add-input:focus{border-color:#475569;box-shadow:0 0 0 3px rgba(71,85,105,.08)}.quick-add-btn{border:0;border-radius:12px;background:#172554;color:#fff;padding:12px 16px;font-weight:800}.quick-add-examples{display:flex;flex-wrap:wrap;gap:7px;margin-top:10px}.quick-example{border:0;background:#eef1f7;border-radius:999px;padding:6px 9px;font-size:11px;color:#334155;cursor:pointer}.quick-preview{margin-top:14px;border-top:1px solid #e6e8ef;padding-top:14px}.quick-preview-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px 16px}.quick-item{display:flex;justify-content:space-between;gap:10px;font-size:13px;padding:4px 0}.quick-label{color:#667085}.quick-actions{display:flex;justify-content:flex-end;gap:8px;margin-top:12px}.quick-confirm{border:0;background:#0f8a64;color:#fff;border-radius:10px;padding:9px 13px;font-weight:800}.quick-cancel{border:0;background:#eef1f7;color:#172033;border-radius:10px;padding:9px 13px;font-weight:700}.quick-msg{margin-top:10px;font-size:12px;padding:9px 11px;border-radius:10px;background:#fff8e7;color:#8a621d}.quick-msg.ok{background:#eef7f4;color:#0f8a64}@media(max-width:760px){.quick-add-form{flex-direction:column}.quick-preview-grid{grid-template-columns:1fr}}`;
document.head.appendChild(style);

let cached = { accounts: [], categories: [], rate: 0, goals: [] };
let pending = null;

async function loadReferenceData(){
  const [{data:accounts},{data:categories},{data:goals},{data:rates}] = await Promise.all([
    db.from('accounts').select('*').order('created_at',{ascending:false}),
    db.from('categories').select('*').order('name',{ascending:true}),
    db.from('savings_goals').select('*').order('created_at',{ascending:false}),
    db.from('exchange_rates').select('*').eq('base_currency','USD').eq('quote_currency','ETB').order('rate_date',{ascending:false}).order('fetched_at',{ascending:false}).limit(1),
  ]);
  cached={accounts:accounts||[],categories:categories||[],goals:goals||[],rate:n(rates?.[0]?.rate)};
}

function findAccount(text,currency){
  const hay=normalize(text);
  const exact=cached.accounts.find(a=>hay.includes(normalize(a.name)));
  if(exact) return exact;
  const currencyMatch=cached.accounts.filter(a=>a.currency===currency);
  return currencyMatch.length===1?currencyMatch[0]:null;
}
function findCategory(text,type){
  const hay=normalize(text);
  const keywords = type==='income'
    ? [['salary','Salary'],['client','Client'],['freelance','Freelance'],['payment','Client Payment'],['income','Income']]
    : [['rent','Rent'],['internet','Internet'],['food','Food'],['transport','Transport'],['shopping','Shopping'],['utility','Utilities'],['utilities','Utilities'],['bill','Bills'],['expense','Expenses']];
  for(const [word] of keywords){
    if(hay.includes(word)){
      const cat=cached.categories.find(c=>c.type===type && normalize(c.name).includes(word));
      if(cat) return cat;
    }
  }
  return cached.categories.find(c=>c.type===type && c.is_default) || cached.categories.find(c=>c.type===type) || null;
}
function parseAmount(text){
  const m=text.match(/(?:\$|usd\s*|etb\s*|birr\s*)?([0-9]+(?:[,.][0-9]{1,2})?)/i);
  return m?Number(m[1].replace(/,/g,'')):0;
}
function parseCurrency(text){
  if(/\$|\busd\b|dollars?|\bdollar\b/i.test(text)) return 'USD';
  return 'ETB';
}
function parseDate(text){
  if(/\btoday\b|\bnow\b/i.test(text)) return today();
  if(/\byesterday\b/i.test(text)){const d=new Date();d.setDate(d.getDate()-1);return d.toISOString().slice(0,10)}
  const m=text.match(/(202\d[-/]\d{1,2}[-/]\d{1,2})/); if(m) return m[1].replaceAll('/','-');
  return today();
}
function parseType(text){
  if(/\b(received|got paid|earned|salary|income|deposit|deposited|client paid|payment from)\b/i.test(text)) return 'income';
  return 'expense';
}
function parse(text){
  const t=text.trim(); if(!t) return null;
  const currency=parseCurrency(t), amount=parseAmount(t), type=parseType(t), date=parseDate(t);
  const account=findAccount(t,currency);
  const category=findCategory(t,type);
  const isGoal=/\b(save|savings goal|put aside|set aside)\b/i.test(t);
  const goalMatch=t.match(/(?:for|toward|towards)\s+([a-zA-Z][\w\s-]{2,})/i);
  if(isGoal){
    const name=goalMatch?.[1]?.trim()?.replace(/\bby\b.*$/i,'').trim() || 'Savings goal';
    return { kind:'goal', name, target_amount:amount, current_amount:0, target_date:date, currency };
  }
  const description=t.replace(/^(i\s+)?(received|got paid|paid|spent|bought|earned|deposited|sent|spent)\s*/i,'').trim();
  return {kind:'transaction',type,currency,original_amount:amount,date,account,category,description};
}

function renderBox(){
  const page=document.querySelector('#content');
  if(!page || document.querySelector('.quick-add')) return;
  const box=document.createElement('section');
  box.className='quick-add';
  box.innerHTML=`<div class="quick-add-head"><div><div class="quick-add-title">Quick Add</div><div class="quick-add-sub">Write what happened in plain English. I’ll turn it into a finance record.</div></div><span style="font-size:18px">✨</span></div><form class="quick-add-form" id="quick-add-form"><input class="quick-add-input" id="quick-add-input" placeholder="e.g. I received $1,000 from a client into PayPal" autocomplete="off"><button class="quick-add-btn" type="submit">Interpret</button></form><div class="quick-add-examples"><button class="quick-example" data-example="I received $1,000 from a client into PayPal">Received $1,000 from client</button><button class="quick-example" data-example="Paid 2,500 birr for internet from CBE">Paid 2,500 birr for internet</button><button class="quick-example" data-example="Save 50,000 birr for rent by today">Create a savings goal</button></div><div id="quick-add-result"></div>`;
  page.prepend(box);
  box.querySelectorAll('.quick-example').forEach(b=>b.addEventListener('click',()=>{box.querySelector('#quick-add-input').value=b.dataset.example; box.querySelector('#quick-add-form').requestSubmit()}));
  box.querySelector('#quick-add-form').addEventListener('submit',async(e)=>{e.preventDefault();await interpret(box)});
}

function previewHTML(p){
  const missing=[];
  if(p.kind==='transaction' && !p.account) missing.push('Choose an account');
  if(p.kind==='transaction' && !p.category) missing.push('Choose a category');
  if(p.kind==='transaction' && p.currency==='USD' && !cached.rate) missing.push('A live USD/ETB rate');
  const converted=p.currency==='USD' && cached.rate ? p.original_amount*cached.rate : p.original_amount;
  return `<div class="quick-preview"><div style="font-weight:800;margin-bottom:8px">I understood this as:</div><div class="quick-preview-grid">${p.kind==='transaction'?`<div class="quick-item"><span class="quick-label">Type</span><strong>${esc(p.type)}</strong></div><div class="quick-item"><span class="quick-label">Original</span><strong>${money(p.original_amount,p.currency)}</strong></div><div class="quick-item"><span class="quick-label">ETB value</span><strong>${money(converted,'ETB')}</strong></div><div class="quick-item"><span class="quick-label">Date</span><strong>${esc(p.date)}</strong></div><div class="quick-item"><span class="quick-label">Account</span><strong>${esc(p.account?.name||'Not matched')}</strong></div><div class="quick-item"><span class="quick-label">Category</span><strong>${esc(p.category?.name||'Not matched')}</strong></div><div class="quick-item" style="grid-column:1/-1"><span class="quick-label">Description</span><strong>${esc(p.description)}</strong></div>`:`<div class="quick-item"><span class="quick-label">Goal</span><strong>${esc(p.name)}</strong></div><div class="quick-item"><span class="quick-label">Target</span><strong>${money(p.target_amount,p.currency)}</strong></div>`}</div>${missing.length?`<div class="quick-msg">${esc(missing.join(' · '))}</div>`:'<div class="quick-msg ok">Ready to save.</div>'}<div class="quick-actions"><button class="quick-cancel" id="quick-cancel" type="button">Cancel</button><button class="quick-confirm" id="quick-confirm" type="button">Save</button></div></div>`;
}

async function interpret(box){
  const input=box.querySelector('#quick-add-input').value.trim();
  const result=box.querySelector('#quick-add-result');
  if(!input){result.innerHTML='<div class="quick-msg">Write something like “paid 2,500 birr for internet from CBE”.</div>';return}
  result.innerHTML='<div class="quick-msg">Interpreting…</div>';
  await loadReferenceData();
  pending=parse(input);
  if(!pending){result.innerHTML='<div class="quick-msg">I could not understand that yet.</div>';return}
  result.innerHTML=previewHTML(pending);
  result.querySelector('#quick-cancel').addEventListener('click',()=>{pending=null;result.innerHTML=''});
  result.querySelector('#quick-confirm').addEventListener('click',async()=>{await savePending(result)});
}

async function savePending(result){
  if(!pending) return;
  result.innerHTML='<div class="quick-msg">Saving…</div>';
  if(pending.kind==='goal'){
    const {error}=await db.from('savings_goals').insert({user_id:(await db.auth.getUser()).data.user?.id,name:pending.name,target_amount:pending.target_amount,current_amount:0,target_date:pending.target_date});
    if(error){result.innerHTML=`<div class="quick-msg">${esc(error.message)}</div>`;return}
  } else {
    const user=(await db.auth.getUser()).data.user;
    if(!user){result.innerHTML='<div class="quick-msg">Your session has expired. Please sign in again.</div>';return}
    if(!pending.account || !pending.category){result.innerHTML='<div class="quick-msg">I need a matching account and category before I can save this.</div>';return}
    const fx=pending.currency==='USD'?cached.rate:1;
    const payload={user_id:user.id,account_id:pending.account.id,category_id:pending.category.id,type:pending.type,amount:pending.original_amount*fx,transaction_date:pending.date,description:pending.description,source_currency:pending.currency,original_amount:pending.original_amount,fx_rate:fx,fx_rate_date:pending.currency==='USD'?today():null};
    const {error}=await db.from('transactions').insert(payload);
    if(error){result.innerHTML=`<div class="quick-msg">${esc(error.message)}</div>`;return}
  }
  result.innerHTML='<div class="quick-msg ok">Saved successfully. Your finance data has been updated.</div>';
  window.dispatchEvent(new CustomEvent('quick-add-saved'));
  setTimeout(()=>result.innerHTML='',1800);
}

function observe(){
  const rerender=()=>setTimeout(renderBox,60);
  new MutationObserver(rerender).observe(document.body,{childList:true,subtree:true});
  setInterval(rerender,2000);
  renderBox();
}
observe();