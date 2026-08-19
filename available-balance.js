import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const db = createClient('https://hznphzpukdwxyqgqksrx.supabase.co','sb_publishable_1CgZ5bRDG7tSltHDwIc5HQ_w1SQFR-9',{auth:{persistSession:true,autoRefreshToken:true}});
let refreshTimer;
let running = false;
let intervalId;

const money = (v, c='ETB') => new Intl.NumberFormat('en-US',{style:'currency',currency:c==='USD'?'USD':'ETB',maximumFractionDigits:2}).format(Number(v)||0);

function findMetric(){
  return [...document.querySelectorAll('.metric')].find(el => {
    const label = el.querySelector('.label')?.textContent.trim();
    return label === 'Net cash flow' || label === 'Available balance';
  });
}

function hasNoAccountsInDashboard(){
  return [...document.querySelectorAll('.card')].some(card => {
    const title = card.querySelector('.card-head h3')?.textContent.trim();
    return title === 'Account balances' && card.textContent.includes('No accounts yet.');
  });
}

function applyMetric(metric,available){
  const label = metric.querySelector('.label');
  const value = metric.querySelector('.value');
  const sub = metric.querySelector('.sub');
  if(label) label.textContent = 'Available balance';
  if(value){ value.textContent = money(available,'ETB'); value.classList.toggle('pos',available>=0); value.classList.toggle('neg',available<0); }
  if(sub) sub.textContent = 'Across active accounts only';
}

async function updateAvailableBalance(){
  const metric = findMetric();
  if(!metric) return;

  // The dashboard is explicit: no active accounts means no current cash.
  // Keep historical transactions intact and out of the current-balance card.
  if(hasNoAccountsInDashboard()){
    applyMetric(metric,0);
    return;
  }

  if(running) return;
  running = true;
  try{
    const {data:accounts,error:ae} = await db.from('accounts').select('id,name,currency,opening_balance');
    if(ae) throw ae;

    const activeAccounts = accounts || [];
    if(activeAccounts.length === 0){
      applyMetric(metric,0);
      return;
    }

    const {data:tx,error:te} = await db.from('transactions').select('account_id,type,amount');
    if(te) throw te;

    const balances = new Map(activeAccounts.map(a=>[a.id,Number(a.opening_balance)||0]));
    for(const t of (tx||[])){
      if(!t.account_id || !balances.has(t.account_id)) continue;
      const current = balances.get(t.account_id)||0;
      balances.set(t.account_id,current + (t.type==='income' ? Number(t.amount)||0 : -(Number(t.amount)||0)));
    }

    const available = activeAccounts.reduce((sum,a)=>{
      const value = balances.get(a.id)||0;
      return sum + (a.currency==='USD' ? 0 : value);
    },0);

    applyMetric(metric,available);
  } catch(error){
    console.error('Available balance update failed',error);
  } finally {
    running = false;
  }
}

function schedule(){
  clearTimeout(refreshTimer);
  refreshTimer = setTimeout(updateAvailableBalance,50);
}

new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true});
schedule();
window.addEventListener('focus',schedule);
intervalId = setInterval(updateAvailableBalance,750);
window.addEventListener('beforeunload',()=>clearInterval(intervalId));
