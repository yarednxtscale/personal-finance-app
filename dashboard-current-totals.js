import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const db = createClient(
  'https://hznphzpukdwxyqgqksrx.supabase.co',
  'sb_publishable_1CgZ5bRDG7tSltHDwIc5HQ_w1SQFR-9',
  { auth: { persistSession: true, autoRefreshToken: true } }
);

let timer = null;
let running = false;

const number = (v) => Number(v) || 0;
const money = (v) => new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'ETB',
  maximumFractionDigits: 2,
}).format(number(v));

function metricCards() { return [...document.querySelectorAll('.metric')]; }
function setMetric(labelText, value) {
  const card = metricCards().find((el) => el.querySelector('.label')?.textContent.trim() === labelText);
  if (!card) return;
  const valueEl = card.querySelector('.value');
  if (!valueEl) return;
  valueEl.textContent = money(value);
  valueEl.classList.toggle('pos', value >= 0);
  valueEl.classList.toggle('neg', value < 0);
}

async function syncDashboardTotals() {
  if (running) return;
  running = true;
  try {
    const [{ data: accounts, error: accountsError }, { data: transactions, error: transactionsError }] = await Promise.all([
      db.from('accounts').select('id'),
      db.from('transactions').select('account_id,type,amount,transaction_date'),
    ]);
    if (accountsError) throw accountsError;
    if (transactionsError) throw transactionsError;

    const activeIds = new Set((accounts || []).map((a) => a.id));
    const activeTransactions = (transactions || []).filter((t) => t.account_id && activeIds.has(t.account_id));

    const income = activeTransactions.filter((t) => t.type === 'income').reduce((sum, t) => sum + number(t.amount), 0);
    const expenses = activeTransactions.filter((t) => t.type === 'expense').reduce((sum, t) => sum + number(t.amount), 0);

    const month = new Date().toISOString().slice(0, 7);
    const monthly = activeTransactions.filter((t) => String(t.transaction_date || '').slice(0, 7) === month);
    const monthlyIncome = monthly.filter((t) => t.type === 'income').reduce((sum, t) => sum + number(t.amount), 0);
    const monthlyExpenses = monthly.filter((t) => t.type === 'expense').reduce((sum, t) => sum + number(t.amount), 0);

    setMetric('Net cash flow', income - expenses);
    setMetric('This month income', monthlyIncome);
    setMetric('This month expenses', monthlyExpenses);
  } catch (error) {
    console.error('Dashboard current totals failed', error);
  } finally {
    running = false;
  }
}

function schedule() {
  clearTimeout(timer);
  timer = setTimeout(syncDashboardTotals, 150);
}

new MutationObserver(schedule).observe(document.body, { childList: true, subtree: true });
schedule();
window.addEventListener('focus', schedule);
