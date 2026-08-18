import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const SUPABASE_URL='https://hznphzpukdwxyqgqksrx.supabase.co';
const SUPABASE_KEY='sb_publishable_1CgZ5bRDG7tSltHDwIc5HQ_w1SQFR-9';
const db=createClient(SUPABASE_URL,SUPABASE_KEY,{auth:{persistSession:true,autoRefreshToken:true}});
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const n=v=>Number(v)||0;
const today=()=>new Date().toISOString().slice(0,10);
const money=(v,c='ETB')=>new Intl.NumberFormat('en-US',{style:'currency',currency:c,maximumFractionDigits:2}).format(n(v));
let ref={accounts:[],categories:[],rate:0};
let pending=null;

const style=document.createElement('style');
style.textContent=`#qafab{position:fixed;right:22px;bottom:22px;z-index:9999;border:0;border-radius:999px;background:#172554;color:#fff;padding:13px 18px;font-weight:800;font-size:14px;box-shadow:0 14px 38px rgba(23,32,51,.25);cursor:pointer}#qaoverlay{position:fixed;inset:0;background:rgba(15,23,42,.5);z-index:10000;display:none;align-items:center;justify-content:center;padding:18px}#qamodal{width:min(620px,100%);background:#fff;border-radius:22px;padding:22px;box-shadow:0 25px 90px rgba(0,0,0,.22)}#qamodal h2{margin:0;font-size:22px}#qasub{margin:5px 0 16px;color:#667085;font-size:13px}.qainput{width:100%;min-height:92px;border:1px solid #d8dce5;border-radius:14px;padding:13px;font-size:15px;resize:vertical;outline:none}.qainput:focus{border-color:#475569;box-shadow:0 0 0 3px rgba(71,85,105,.08)}.qaexamples{display:flex;flex-wrap:wrap;gap:7px;margin-top:10px}.qaexample{border:0;background:#eef1f7;border-radius:999px;padding:7px 10px;font-size:11px;color:#334155;cursor:pointer}.qaactions{display:flex;justify-content:flex-end;gap:8px;margin-top:14px}.qabtn{border:0;border-radius:11px;padding:10px 14px;font-weight:800;cursor:pointer}.qaprimary{background:#172554;color:#fff}.qasecondary{background:#eef1f7;color:#172033}.qapreview{margin-top:15px;padding:14px;border-top:1px solid #e6e8ef;background:#fafbfc;border-radius:14px}.qagrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px 14px;font-size:13px}.qaitem{display:flex;justify-content:space-between;gap:10px;padding:3px 0}.qalabel{color:#667085}.qamessage{margin-top:10px;font-size:12px;padding:9px 11px;border-radius:10px;background:#fff8e7;color:#8a621d}.qamessage.ok{background:#eef7f4;color:#0f8a64}@media(max-width:700px){#qafab{right:14px;bottom:14px}.qagrid{grid-template-columns:1fr}}`;
document.head.appendChild(style);

async function loadRef(){
 const [{data:accounts},{data:categories},{data:rates}]=await Promise.all([
  db.from('accounts').select('*').order('created_at',{ascending:false}),
  db.from('categories').select('*').order('name',{ascending:true}),
  db.from('exchange_rates').select('*').eq('base_currency','USD').eq('quote_currency','ETB').order('rate_date',{ascending:false}).order('fetched_at',{ascending:false}).limit(1)
 ]);
 ref={accounts:accounts||[],categories:categories||[],rate:n(rates?.[0]?.rate)};
}
function currency(t){return /\$|\busd\b|dollars?/i.test(t)?'USD':'ETB'}
function amount(t){const m=t.match(/(?:\$|usd\s*|etb\s*|birr\s*)?([0-9]+(?:[,.][0-9]+)?)/i);return m?n(m[1].replace(/,/g,'')):0}
function type(t){return /\b(received|earned|salary|income|deposit|deposited|client paid|got paid|payment from)\b/i.test(t)?'income':'expense'}
function date(t){if(/yesterday/i.test(t)){const d=new Date();d.setDate(d.getDate()-1);return d.toISOString().slice(0,10)}return today()}
function account(t,c){const q=t.toLowerCase();return ref.accounts.find(a=>q.includes(String(a.name).toLowerCase()))||ref.accounts.filter(a=>a.currency===c)[0]||null}
function category(t,k){const q=t.toLowerCase();const keys=k==='income'?['salary','client','payment','income']:['rent','internet','food','transport','shopping','utility','bill','expense'];for(const key of keys){const c=ref.categories.find(x=>x.type===k&&String(x.name).toLowerCase().includes(key)&&q.includes(key));if(c)return c}return ref.categories.find(x=>x.type===k&&x.is_default)||ref.categories.find(x=>x.type===k)||null}
function parse(t){
 const c=currency(t),a=amount(t),k=type(t),acct=account(t,c),cat=category(t,k);
 if(/\b(save|savings goal|put aside|set aside)\b/i.test(t)){
  const m=t.match(/(?:for|toward|towards)\s+(.+?)(?:\s+by\s+.+)?$/i);
  return {kind:'goal',name:(m?.[1]||'Savings goal').trim(),target:a,currency:c,target_date:date(t)};
 }
 return {kind:'transaction',type:k,currency:c,original:a,account:acct,category:cat,date:date(t),description:t};
}
function preview(p){const converted=p.currency==='USD'&&ref.rate?p.original*ref.rate:p.original;const missing=[];if(p.kind==='transaction'&&!p.account)missing.push('account');if(p.kind==='transaction'&&!p.category)missing.push('category');return `<div class="qapreview"><div style="font-weight:800;margin-bottom:8px">I understood this as:</div><div class="qagrid"><div class="qaitem"><span class="qalabel">Type</span><strong>${esc(p.kind==='goal'?'Savings goal':p.type)}</strong></div><div class="qaitem"><span class="qalabel">Original</span><strong>${money(p.kind==='goal'?p.target:p.original,p.currency)}</strong></div>${p.kind==='transaction'?`<div class="qaitem"><span class="qalabel">ETB value</span><strong>${money(converted,'ETB')}</strong></div><div class="qaitem"><span class="qalabel">Account</span><strong>${esc(p.account?.name||'Not matched')}</strong></div><div class="qaitem"><span class="qalabel">Category</span><strong>${esc(p.category?.name||'Not matched')}</strong></div><div class="qaitem"><span class="qalabel">Date</span><strong>${esc(p.date)}</strong></div>`:`<div class="qaitem"><span class="qalabel">Target date</span><strong>${esc(p.target_date)}</strong></div>`}</div>${missing.length?`<div class="qamessage">I need a matching ${esc(missing.join(' and '))} before I can save this.</div>`:'<div class="qamessage ok">Ready to save.</div>'}<div class="qaactions"><button class="qabtn qasecondary" id="qacancel">Cancel</button><button class="qabtn qaprimary" id="qaconfirm">Save</button></div></div>`}

function build(){
 const fab=document.createElement('button');fab.id='qafab';fab.textContent='✨ Quick Add';document.body.appendChild(fab);
 const overlay=document.createElement('div');overlay.id='qaoverlay';overlay.innerHTML=`<div id="qamodal"><h2>Quick Add</h2><div id="qasub">Tell me what happened in plain English. I’ll turn it into a finance record.</div><textarea class="qainput" id="qainput" placeholder="Example: I received $1,000 from a client into PayPal"></textarea><div class="qaexamples"><button class="qaexample" data-ex="I received $1,000 from a client into PayPal">Received $1,000 from client</button><button class="qaexample" data-ex="Paid 2,500 birr for internet from CBE">Paid 2,500 birr for internet</button><button class="qaexample" data-ex="Save 50,000 birr for rent">Create savings goal</button></div><div class="qaactions"><button class="qabtn qasecondary" id="qaclose">Close</button><button class="qabtn qaprimary" id="qainterpret">Interpret</button></div><div id="qares"></div></div>`;document.body.appendChild(overlay);
 fab.onclick=()=>{overlay.style.display='flex';setTimeout(()=>document.querySelector('#qainput')?.focus(),40)};
 overlay.querySelector('#qaclose').onclick=()=>overlay.style.display='none';
 overlay.addEventListener('click',e=>{if(e.target===overlay)overlay.style.display='none'});
 overlay.querySelectorAll('.qaexample').forEach(b=>b.onclick=()=>{overlay.querySelector('#qainput').value=b.dataset.ex;interpret()});
 overlay.querySelector('#qainterpret').onclick=interpret;
}
async function interpret(){const text=document.querySelector('#qainput').value.trim(),res=document.querySelector('#qares');if(!text){res.innerHTML='<div class="qamessage">Type something first.</div>';return}res.innerHTML='<div class="qamessage">Interpreting…</div>';await loadRef();pending=parse(text);res.innerHTML=preview(pending);res.querySelector('#qacancel').onclick=()=>{pending=null;res.innerHTML=''};res.querySelector('#qaconfirm').onclick=save}
async function save(){const res=document.querySelector('#qares');if(!pending)return;res.innerHTML='<div class="qamessage">Saving…</div>';const user=(await db.auth.getUser()).data.user;if(!user){res.innerHTML='<div class="qamessage">Session expired. Please sign in again.</div>';return}
 if(pending.kind==='goal'){const {error}=await db.from('savings_goals').insert({user_id:user.id,name:pending.name,target_amount:pending.target,current_amount:0,target_date:pending.target_date});if(error){res.innerHTML=`<div class="qamessage">${esc(error.message)}</div>`;return}}
 else {if(!pending.account||!pending.category){res.innerHTML='<div class="qamessage">I need a matching account and category before I can save this.</div>';return}const fx=pending.currency==='USD'?ref.rate:1;const payload={user_id:user.id,account_id:pending.account.id,category_id:pending.category.id,type:pending.type,amount:pending.original*fx,transaction_date:pending.date,description:pending.description,source_currency:pending.currency,original_amount:pending.original,fx_rate:fx,fx_rate_date:pending.currency==='USD'?today():null};const {error}=await db.from('transactions').insert(payload);if(error){res.innerHTML=`<div class="qamessage">${esc(error.message)}</div>`;return}}
 res.innerHTML='<div class="qamessage ok">Saved. Your dashboard will refresh with the new data.</div>';window.dispatchEvent(new CustomEvent('quick-add-saved'));setTimeout(()=>{overlay.style.display='none';res.innerHTML=''},900)}

build();