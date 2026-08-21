import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const db = createClient('https://hznphzpukdwxyqgqksrx.supabase.co','sb_publishable_1CgZ5bRDG7tSltHDwIc5HQ_w1SQFR-9',{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
const $=(s,r=document)=>r.querySelector(s); const $$=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const num=v=>Number(v)||0;
const money=(v,c='ETB')=>new Intl.NumberFormat('en-US',{style:'currency',currency:c==='USD'?'USD':'ETB',maximumFractionDigits:2}).format(num(v));

const style=document.createElement('style');
style.id='finance-ui-finalizer-styles';
style.textContent=`
.nav{gap:2px !important;padding-right:2px !important}.nav button{padding:8px 10px !important;border-radius:10px !important;font-size:13px !important}.nav .nav-section-title{margin-top:6px;padding:8px 10px 3px !important}.nav [data-mx="transactions"],.nav [data-mx="budgets"],.nav [data-mx="bills"],.nav [data-mx="goals"]{display:none !important}.nav [data-mx="projected-expenses"]{order:26}.nav [data-mx="debts"]{order:31}.nav [data-income-tab]{order:20}.nav [data-nav="dashboard"]{order:10}.nav [data-nav="transactions"]{order:21}.nav [data-nav="accounts"]{order:22}.nav [data-nav="budgets"]{order:23}.nav [data-nav="bills"]{order:24}.nav [data-nav="goals"]{order:25}.nav [data-nav="settings"]{order:32}.nav [data-trash-bin]{order:100 !important;margin-top:auto !important}.finance-final-group{font-size:9px;line-height:1;text-transform:uppercase;letter-spacing:.14em;color:#73819a;font-weight:800;padding:7px 10px 2px;pointer-events:none;user-select:none}.finance-final-group.g1{order:5}.finance-final-group.g2{order:19}.finance-final-group.g3{order:29}.finance-final-group.g4{order:99}
#finance-assistant-launcher{position:fixed;right:22px;bottom:22px;z-index:10020;border:0;border-radius:999px;background:linear-gradient(135deg,#172554,#243b7a);color:#fff;padding:12px 17px;font-weight:800;box-shadow:0 14px 38px rgba(23,32,51,.24);cursor:pointer}#finance-assistant{position:fixed;right:20px;bottom:82px;width:min(420px,calc(100vw - 28px));height:min(610px,calc(100vh - 120px));z-index:10025;background:#fff;border:1px solid #e6e8ef;border-radius:22px;box-shadow:0 24px 90px rgba(15,23,42,.22);display:none;grid-template-rows:auto 1fr auto;overflow:hidden}.fa-head{padding:14px 16px;background:#0f172a;color:#fff;display:flex;justify-content:space-between;align-items:center}.fa-head strong{font-size:15px}.fa-sub{font-size:10px;color:#a8b3c7;margin-top:3px}.fa-close{border:0;background:rgba(255,255,255,.08);color:#fff;border-radius:9px;padding:7px 9px;cursor:pointer}.fa-messages{padding:14px;overflow:auto;background:#f6f8fb;display:grid;align-content:start;gap:10px}.fa-msg{max-width:88%;padding:10px 12px;border-radius:14px;font-size:13px;line-height:1.45;white-space:pre-wrap}.fa-user{justify-self:end;background:#172554;color:#fff;border-bottom-right-radius:4px}.fa-bot{justify-self:start;background:#fff;border:1px solid #e6e8ef;color:#1f2937;border-bottom-left-radius:4px}.fa-suggest{display:flex;flex-wrap:wrap;gap:6px;padding:10px 12px 0;background:#fff}.fa-suggest button{border:0;background:#eef1f7;color:#243047;border-radius:999px;padding:6px 9px;font-size:11px;font-weight:700;cursor:pointer}.fa-input{display:grid;grid-template-columns:1fr auto;gap:8px;padding:12px;background:#fff;border-top:1px solid #e6e8ef}.fa-input textarea{width:100%;min-height:46px;max-height:120px;resize:none;border:1px solid #d8dce5;border-radius:12px;padding:10px 11px;font:inherit;font-size:14px;outline:none}.fa-input textarea:focus{border-color:#64748b;box-shadow:0 0 0 3px rgba(100,116,139,.1)}.fa-send{border:0;border-radius:12px;background:#172554;color:#fff;padding:0 14px;font-weight:800;cursor:pointer}.fa-typing{opacity:.7}@media(max-width:760px){#finance-assistant-launcher{right:14px;bottom:calc(82px + env(safe-area-inset-bottom))}#finance-assistant{right:10px;left:10px;bottom:calc(78px + env(safe-area-inset-bottom));width:auto;height:min(70dvh,620px);border-radius:20px}.fa-input{padding-bottom:calc(10px + env(safe-area-inset-bottom))}}
`;
document.head.appendChild(style);

function ensureGroups(nav){
  if(!nav) return;
  nav.dataset.financeFinal='1';
  if(!nav.querySelector('.finance-final-group.g1')){
    const defs=[['g1','Overview'],['g2','Money & Planning'],['g3','Debt & System'],['g4','System']];
    defs.forEach(([cls,text])=>{const d=document.createElement('div');d.className=`finance-final-group ${cls}`;d.textContent=text;d.setAttribute('aria-hidden','true');nav.appendChild(d)});
  }
}

function normalizeNav(){
  const nav=$('.nav'); if(!nav) return;
  ensureGroups(nav);
  const hideDup=['transactions','budgets','bills','goals'];
  hideDup.forEach(id=>nav.querySelectorAll(`[data-mx="${id}"]`).forEach(b=>b.style.display='none'));
  const desired=[
    ['dashboard','Dashboard'],['income','My Income'],['transactions','Transactions'],['accounts','Accounts'],['budgets','Budgets'],['bills','Bills'],['projected-expenses','Projected Expenses'],['goals','Savings Goals'],['debts','Debts'],['settings','Settings'],['trash','Trash Bin']
  ];
  const findButton=(key,label)=>{
    if(key==='income') return nav.querySelector('[data-income-tab]');
    if(key==='projected-expenses'||key==='debts') return nav.querySelector(`[data-mx="${key}"]`);
    if(key==='trash') return nav.querySelector('[data-trash-bin]');
    return nav.querySelector(`[data-nav="${key}"]`) || $$('button',nav).find(b=>b.textContent.trim()===label && !b.dataset.mux);
  };
  desired.forEach(([key,label])=>{const b=findButton(key,label);if(b){b.title=label;b.dataset.financeFinalItem=key;if(key==='trash')b.style.order='100';}});
  nav.querySelectorAll('[data-finance-final-item]').forEach(b=>{if(b.dataset.financeFinalItem==='trash') b.style.marginTop='auto'});
}

const observer=new MutationObserver(()=>{clearTimeout(observer.timer);observer.timer=setTimeout(normalizeNav,30)}); observer.observe(document.body,{childList:true,subtree:true});
normalizeNav();

async function currentUser(){return (await db.auth.getUser()).data.user;}
async function rows(table,select='*'){try{const {data}=await db.from(table).select(select).eq('is_deleted',false);return data||[]}catch{return[]}}
async function snapshot(){
  const [accounts,tx,budgets,bills,goals,debts,cats]=await Promise.all([
    rows('accounts'),rows('transactions'),rows('budgets'),rows('bills'),rows('savings_goals'),rows('debts'),rows('categories')
  ]);
  const income=tx.filter(t=>t.type==='income').reduce((s,t)=>s+num(t.amount),0);
  const expense=tx.filter(t=>t.type==='expense').reduce((s,t)=>s+num(t.amount),0);
  const balances=accounts.map(a=>({name:a.name,currency:a.currency,balance:num(a.opening_balance)+tx.filter(t=>t.account_id===a.id).reduce((s,t)=>s+(t.type==='income'?num(t.amount):-num(t.amount)),0)}));
  return {accounts,tx,budgets,bills,goals,debts,cats,income,expense,net:income-expense,balances};
}
function openPage(key){
  const nav=$('.nav'); if(!nav)return false;
  const b=key==='income'?nav.querySelector('[data-income-tab]'):key==='projected-expenses'||key==='debts'?nav.querySelector(`[data-mx="${key}"]`):nav.querySelector(`[data-nav="${key}"]`);
  if(b){b.click();return true} return false;
}
function addMsg(text,who){const box=$('.fa-messages');if(!box)return;const d=document.createElement('div');d.className=`fa-msg ${who==='user'?'fa-user':'fa-bot'}`;d.textContent=text;box.appendChild(d);box.scrollTop=box.scrollHeight;}
function moneyList(items){return items.map(x=>`${x.name}: ${money(x.balance,x.currency||'ETB')}`).join('\n')}
async function answer(text){
  const q=text.toLowerCase();
  if(/\b(help|what can you do|how do you work)\b/.test(q)) return 'I am connected to your Finance Hub. I can read your live accounts, transactions, budgets, bills, savings goals and debts; explain your cash flow; show what is due or over budget; and open the right page for you. Try “What is my total balance?”, “How much did I spend this month?”, “Show unpaid bills”, or “Open budgets”.';
  if(/\b(open|go to|take me to|show me)\b/.test(q)){
    const map=[['dashboard','dashboard'],['home','dashboard'],['income','income'],['transactions','transactions'],['transaction','transactions'],['accounts','accounts'],['budgets','budgets'],['budget','budgets'],['bills','bills'],['savings','goals'],['goals','goals'],['projected','projected-expenses'],['debts','debts'],['settings','settings'],['trash','trash']];
    const hit=map.find(([word])=>q.includes(word)); if(hit&&openPage(hit[1])) return `Opening ${hit[0]}.`;
  }
  const s=await snapshot();
  const month=new Date().toISOString().slice(0,7); const mtx=s.tx.filter(t=>String(t.transaction_date).slice(0,7)===month); const mi=mtx.filter(t=>t.type==='income').reduce((a,t)=>a+num(t.amount),0); const me=mtx.filter(t=>t.type==='expense').reduce((a,t)=>a+num(t.amount),0);
  if(/\b(balance|balances|how much.*have|money.*have|cash)\b/.test(q)) return s.balances.length?`Your current account balances are:\n${moneyList(s.balances)}\n\nNet transaction cash flow is ${money(s.net)}.`:'You do not have any active accounts yet.';
  if(/\b(spend|spent|expenses?|expense)\b/.test(q)) return `This month you have ${money(me)} in expenses. Across all active transactions, expenses are ${money(s.expense)} and income is ${money(s.income)}, giving a net cash flow of ${money(s.net)}.`;
  if(/\b(income|earned|earnings|salary)\b/.test(q)) return `This month income is ${money(mi)}. Total active income is ${money(s.income)}.`;
  if(/\b(bill|bills|due)\b/.test(q)){const open=s.bills.filter(b=>!b.is_paid).sort((a,b)=>String(a.due_date).localeCompare(String(b.due_date))).slice(0,8);return open.length?`Unpaid bills:\n${open.map(b=>`• ${b.name}: ${money(b.amount)} due ${b.due_date||'—'}`).join('\n')}`:'You have no unpaid bills.';}
  if(/\b(budget|budgets|over budget)\b/.test(q)){if(!s.budgets.length)return 'You do not have any active budgets yet.';const lines=s.budgets.slice(0,10).map(b=>{const spent=s.tx.filter(t=>t.type==='expense'&&t.category_id===b.category_id&&String(t.transaction_date).slice(0,7)===String(b.month).slice(0,7)).reduce((a,t)=>a+num(t.amount),0);return `${money(spent)} / ${money(b.amount)}${spent>num(b.amount)?' — over budget':''}`});return `Budget status:\n${lines.join('\n')}`;}
  if(/\b(savings?|goals?)\b/.test(q)){return s.goals.length?`Savings goals:\n${s.goals.slice(0,8).map(g=>`• ${g.name}: ${money(g.current_amount)} / ${money(g.target_amount)}${g.target_date?` · target ${g.target_date}`:''}`).join('\n')}`:'You do not have any active savings goals.';}
  if(/\b(debt|debts|owe|owed)\b/.test(q)){return s.debts.length?`Debts:\n${s.debts.slice(0,8).map(d=>`• ${d.name}: ${d.direction==='owed_by_me'?'You owe':'Owed to you'} ${money(d.remaining_amount,d.currency||'ETB')} · ${d.status}`).join('\n')}`:'You do not have any active debts.';}
  if(/\b(transaction|transactions|recent)\b/.test(q)){const recent=[...s.tx].sort((a,b)=>String(b.transaction_date).localeCompare(String(a.transaction_date))).slice(0,8);return recent.length?`Recent transactions:\n${recent.map(t=>`• ${t.transaction_date||'—'} · ${t.description||'Transaction'} · ${t.type==='income'?'+':'-'}${money(t.amount)}`).join('\n')}`:'There are no active transactions.';}
  if(/\b(account|accounts)\b/.test(q)) return s.balances.length?`Accounts:\n${moneyList(s.balances)}`:'No active accounts yet.';
  if(/\b(refresh|reload|update data)\b/.test(q)){location.reload();return 'Refreshing the Finance Hub now.';}
  return `I understand the Finance Hub structure, but I need a more specific request. You can ask about balances, income, spending, budgets, bills, savings, debts, transactions, or tell me to open a page.`;
}

function buildAssistant(){
  if($('#finance-assistant-launcher'))return;
  const fab=document.createElement('button');fab.id='finance-assistant-launcher';fab.textContent='✨ Finance Assistant';document.body.appendChild(fab);
  const panel=document.createElement('div');panel.id='finance-assistant';panel.innerHTML=`<div class="fa-head"><div><strong>Finance Assistant</strong><div class="fa-sub">Live data · understands your Finance Hub</div></div><button class="fa-close" type="button">Close</button></div><div class="fa-messages"><div class="fa-msg fa-bot">I’m connected to your Finance Hub. Ask me about balances, spending, budgets, bills, savings, debts, transactions, or tell me to open a page.</div></div><div><div class="fa-suggest"><button type="button">What is my balance?</button><button type="button">How much did I spend?</button><button type="button">Show unpaid bills</button><button type="button">Open budgets</button></div><div class="fa-input"><textarea id="fa-text" placeholder="Ask about your finances…"></textarea><button class="fa-send" type="button">Send</button></div></div>`;document.body.appendChild(panel);
  const send=async()=>{const input=$('#fa-text');const text=input.value.trim();if(!text)return;input.value='';addMsg(text,'user');addMsg('Checking your live finance data…','bot');const waiting=$$('.fa-msg',panel).at(-1);waiting.classList.add('fa-typing');try{const reply=await answer(text);waiting.textContent=reply;waiting.classList.remove('fa-typing')}catch(e){waiting.textContent='I could not load your live finance data right now.';waiting.classList.remove('fa-typing')}};
  fab.onclick=()=>{panel.style.display=panel.style.display==='grid'?'none':'grid';if(panel.style.display==='grid')setTimeout(()=>$('#fa-text')?.focus(),40)};
  $('.fa-close',panel).onclick=()=>panel.style.display='none'; $('.fa-send',panel).onclick=send; $('#fa-text',panel).addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();send()}}); $$('.fa-suggest button',panel).forEach(b=>b.onclick=()=>{ $('#fa-text',panel).value=b.textContent; send(); });
}

buildAssistant();