import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const SUPABASE_URL = 'https://hznphzpukdwxyqgqksrx.supabase.co';
const SUPABASE_KEY = 'sb_publishable_1CgZ5bRDG7tSltHDwIc5HQ_w1SQFR-9';
const db = createClient(SUPABASE_URL, SUPABASE_KEY);

const money = (value, currency = 'ETB') => new Intl.NumberFormat('en-US', {
  style: 'currency', currency: currency === 'USD' ? 'USD' : 'ETB', maximumFractionDigits: 2,
}).format(Number(value) || 0);
const n = (v) => Number(v) || 0;

function convertToAccountCurrency(transaction, accountCurrency, currentRate) {
  const sign = transaction.type === 'income' ? 1 : -1;
  const source = transaction.source_currency || 'ETB';
  const original = transaction.original_amount != null ? n(transaction.original_amount) : null;
  const etbAmount = n(transaction.amount);
  if (source === accountCurrency) return sign * (original != null ? original : etbAmount);
  if (accountCurrency === 'ETB' && source === 'USD') return sign * etbAmount;
  if (accountCurrency === 'USD' && source === 'ETB') {
    const fx = n(transaction.fx_rate) || currentRate;
    return fx > 0 ? sign * (etbAmount / fx) : 0;
  }
  return sign * etbAmount;
}

async function loadSnapshot() {
  const [accountsRes, transactionsRes, rateRes] = await Promise.all([
    db.from('accounts').select('*').order('created_at', { ascending: false }),
    db.from('transactions').select('*'),
    db.from('exchange_rates').select('*')
      .eq('base_currency', 'USD').eq('quote_currency', 'ETB')
      .order('rate_date', { ascending: false }).order('fetched_at', { ascending: false })
      .limit(1).maybeSingle(),
  ]);
  if (accountsRes.error || transactionsRes.error) return null;
  return { accounts: accountsRes.data || [], transactions: transactionsRes.data || [], rate: n(rateRes.data?.rate) };
}

function patchDashboard(snapshot) {
  if (!snapshot || !document.querySelector('.metric')) return;
  const heading = document.querySelector('h1');
  if (!heading || heading.textContent.trim() !== 'Dashboard') return;

  const balances = snapshot.accounts.map((account) => {
    const tx = snapshot.transactions.filter((t) => t.account_id === account.id);
    const nativeBalance = n(account.opening_balance) + tx.reduce(
      (sum, t) => sum + convertToAccountCurrency(t, account.currency, snapshot.rate), 0,
    );
    const etbBalance = account.currency === 'USD' ? nativeBalance * snapshot.rate : nativeBalance;
    return { account, nativeBalance, etbBalance };
  });

  const totalEtb = balances.reduce((sum, item) => sum + item.etbBalance, 0);
  const firstMetric = document.querySelector('.metric');
  if (firstMetric) {
    const label = firstMetric.querySelector('.label');
    const value = firstMetric.querySelector('.value');
    const sub = firstMetric.querySelector('.sub');
    if (label) label.textContent = 'Total balance (ETB)';
    if (value) { value.classList.remove('pos', 'neg'); value.textContent = money(totalEtb, 'ETB'); }
    if (sub) sub.textContent = snapshot.rate > 0 ? `All account balances consolidated at ${snapshot.rate.toFixed(3)} ETB/USD` : 'All account balances';
  }

  const cardTitle = [...document.querySelectorAll('h3')].find((el) => el.textContent.trim() === 'Account balances');
  const card = cardTitle?.closest('.card');
  if (card) {
    const rows = [...card.querySelectorAll(':scope > div:not(.card-head)')];
    balances.slice(0, 5).forEach((item, index) => {
      const row = rows[index];
      const strong = row?.querySelector('strong');
      if (!strong) return;
      if (item.account.currency === 'USD' && snapshot.rate > 0) {
        strong.innerHTML = `${money(item.nativeBalance, 'USD')}<div class="muted" style="font-size:11px;font-weight:600;margin-top:2px">≈ ${money(item.etbBalance, 'ETB')}</div>`;
      } else {
        strong.textContent = money(item.nativeBalance, item.account.currency);
      }
    });
  }
}

let lastSignature = '';
async function run() {
  if (!document.querySelector('.app')) return;
  const snapshot = await loadSnapshot();
  if (!snapshot) return;
  const signature = JSON.stringify([
    snapshot.rate,
    ...snapshot.accounts.map((a) => [a.id, a.opening_balance, a.currency]),
    ...snapshot.transactions.map((t) => [t.id, t.amount, t.original_amount, t.fx_rate]),
  ]);
  if (signature !== lastSignature) { lastSignature = signature; patchDashboard(snapshot); }
}

new MutationObserver(() => run().catch(console.error)).observe(document.body, { childList: true, subtree: true });
setInterval(() => run().catch(console.error), 15000);
run().catch(console.error);
