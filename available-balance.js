import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const db = createClient('https://hznphzpukdwxyqgqksrx.supabase.co','sb_publishable_1CgZ5bRDG7tSltHDwIc5HQ_w1SQFR-9',{auth:{persistSession:true,autoRefreshToken:true}});
let refreshTimer;
let running = false;
let intervalId;

const money = (v, c='ETB') => new Intl.NumberFormat('en-US',{style:'currency',currency:c==='USD'?'USD':'ETB',maximumFractionDigits:2}).format(Number(v)||0);

function metricByLabel(labelText){
  return [...document.querySelectorAll('.metric')].find(el => el.querySelector('.label')?.textContent.trim() === labelText);
}

function hasNoAccountsInDashboard(){
  return [...document.querySelectorAll('.card')].some(card => {
    const title = card.querySelector('.card-head h3')?.textContent.trim();
    return title === 'Account balances' && card.textContent.includes('No accounts yet.');
  });
}

function applyAvailableBalance(value){
  const metric = metricByLabel('Net cash flow') || metricByLabel('Available balance');
  if(!metric) return;
  const label = metric.querySelector('.label');
  const valueEl = metric.querySelector('.value');
  const sub = metric.querySelector('.sub');
  if(label) label.textContent = 'Available balance';
  if(valueEl){ valueEl.textContent = money(value,'ETB'); valueEl.classList.toggle('pos',value>=0); valueEl.classList.toggle('neg',value<0); }
  if(sub) sub.textContent = 'Across active accounts only';
}

function applyDashboardTotals(net, monthlyIncome, monthlyExpenses){
  const netCard = metricByLabel('Net cash flow');
  const incomeCard = metricByLabel('This month income');
  const expenseCard = metricByLabel('This month expenses');

  if(netCard){
    const value = netCard.querySelector('.value');
    if(value){ value.textContent = money(net); value.classList.toggle('pos',net>=0); value.classList.toggle('neg',net<0); }
    const sub = netCard.querySelector('.sub');
    if(sub) sub.textContent = 'Current totals from active accounts only';
  }

  if(incomeCard){
    const value = incomeCard.querySelector('.value');
    if(value){ value.textContent = money(monthlyIncome); value.classList.add('pos'); value.classList.remove('neg'); }
    const sub = incomeCard.querySelector('.sub');
    if(sub) sub.textContent = new Date().toLocaleDateString(undefined,{year:'numeric',month:'long'});
  }

  if(expenseCard){
    const value = expenseCard.querySelector('.value');
    if(value){ value.textContent = money(monthlyExpenses); value.classList.add('neg'); value.classList.remove('pos'); }
    const sub = expenseCard.querySelector('.sub');
    if(sub) sub.textContent = new Date().toLocaleDateString(undefined,{year:'numeric',month:'long'});
  }
}

async function updateDashboardCurrentMoney(){
  if(running) return;
  running = true;
  try{
    const [{data:accounts,error:ae},{data:tx,error:te}] = await Promise.all([
      db.from('accounts').select('id,name,currency,opening_balance'),
      db.from('transactions').select('account_id,type,amount,transaction_date'),
    ]);
    if(ae) throw ae;
    if(te) throw te;

    const activeAccounts = accounts || [];
    const activeIds = new Set(activeAccounts.map(a=>a.id));
    const activeTx = (tx || []).filter(t => t.account_id && activeIds.has(t.account_id));

    if(activeAccounts.length === 0){
      applyAvailableBalance(0);
      applyDashboardTotals(0,0,0);
      return;
    }

    const balances = new Map(activeAccounts.map(a=>[a.id,Number(a.opening_balance)||0]));
    for(const t of activeTx){
      const current = balances.get(t.account_id)||0;
      balances.set(t.account_id,current + (t.type==='income' ? Number(t.amount)||0 : -(Number(t.amount)||0)));
    }

    const available = activeAccounts.reduce((sum,a)=>{
      const value = balances.get(a.id)||0;
      return sum + (a.currency==='USD' ? 0 : value);
    },0);

    const income = activeTx.filter(t=>t.type==='income').reduce((s,t)=>s+(Number(t.amount)||0),0);
    const expenses = activeTx.filter(t=>t.type==='expense').reduce((s,t)=>s+(Number(t.amount)||0),0);
    const month = new Date().toISOString().slice(0,7);
    const monthly = activeTx.filter(t=>String(t.transaction_date||'').slice(0,7)===month);
    const monthlyIncome = monthly.filter(t=>t.type==='income').reduce((s,t)=>s+(Number(t.amount)||0),0);
    const monthlyExpenses = monthly.filter(t=>t.type==='expense').reduce((s,t)=>s+(Number(t.amount)||0),0);

    // Historical transactions remain visible, but only transactions linked to active accounts count as current money.
    applyAvailableBalance(available);
    applyDashboardTotals(income-expenses, monthlyIncome, monthlyExpenses);
  } catch(error){
    console.error('Dashboard current-money update failed',error);
  } finally {
    running = false;
  }
}

function schedule(){
  clearTimeout(refreshTimer);
  refreshTimer = setTimeout(updateDashboardCurrentMoney,50);
}

new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true});
schedule();
window.addEventListener('focus',schedule);
intervalId = setInterval(updateDashboardCurrentMoney,750);
window.addEventListener('beforeunload',()=>clearInterval(intervalId));
