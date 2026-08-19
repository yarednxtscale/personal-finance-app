import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const db = createClient('https://hznphzpukdwxyqgqksrx.supabase.co','sb_publishable_1CgZ5bRDG7tSltHDwIc5HQ_w1SQFR-9',{auth:{persistSession:true,autoRefreshToken:true}});
let refreshTimer;
let running = false;

const money = (v, c='ETB') => new Intl.NumberFormat('en-US',{style:'currency',currency:c==='USD'?'USD':'ETB',maximumFractionDigits:2}).format(Number(v)||0);

async function updateAvailableBalance(){
  if(running) return;
  const metric = [...document.querySelectorAll('.metric')].find(el => el.querySelector('.label')?.textContent.trim() === 'Net cash flow');
  if(!metric) return;
  running = true;
  try{
    const [{data:accounts,error:ae},{data:tx,error:te}] = await Promise.all([
      db.from('accounts').select('id,name,currency,opening_balance'),
      db.from('transactions').select('account_id,type,amount')
    ]);
    if(ae) throw ae;
    if(te) throw te;

    const balances = new Map((accounts||[]).map(a=>[a.id,Number(a.opening_balance)||0]));
    for(const t of (tx||[])){
      if(!t.account_id || !balances.has(t.account_id)) continue;
      const current = balances.get(t.account_id)||0;
      balances.set(t.account_id,current + (t.type==='income' ? Number(t.amount)||0 : -(Number(t.amount)||0)));
    }
    const available = (accounts||[]).reduce((sum,a)=>{
      const value = balances.get(a.id)||0;
      return sum + (a.currency==='USD' ? 0 : value);
    },0);

    const label = metric.querySelector('.label');
    const value = metric.querySelector('.value');
    const sub = metric.querySelector('.sub');
    if(label) label.textContent = 'Available balance';
    if(value){ value.textContent = money(available,'ETB'); value.classList.toggle('pos',available>=0); value.classList.toggle('neg',available<0); }
    if(sub) sub.textContent = 'Across active accounts only';
  } catch(error){
    console.error('Available balance update failed',error);
  } finally {
    running = false;
  }
}

function schedule(){
  clearTimeout(refreshTimer);
  refreshTimer = setTimeout(updateAvailableBalance,80);
}
new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true});
schedule();
window.addEventListener('focus',schedule);
