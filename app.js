import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const SUPABASE_URL = 'https://hznphzpukdwxyqgqksrx.supabase.co';
const SUPABASE_KEY = 'sb_publishable_1CgZ5bRDG7tSltHDwIc5HQ_w1SQFR-9';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
});

const MAX_SESSION_MS = 6 * 60 * 60 * 1000;
const SESSION_KEY = 'finance_app_session_started_at_v2';
const state = {
  session: null,
  user: null,
  page: 'dashboard',
  modal: null,
  toast: '',
  loading: false,
  authMode: 'signin',
  data: { accounts: [], transactions: [], categories: [], budgets: [], bills: [], goals: [] },
  rate: null,
};

const $ = (selector) => document.querySelector(selector);
const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const today = () => new Date().toISOString().slice(0, 10);
const monthStart = () => `${today().slice(0, 7)}-01`;
const num = (v) => Number(v) || 0;
const money = (value, currency = 'ETB') => new Intl.NumberFormat('en-US', {
  style: 'currency', currency: currency === 'USD' ? 'USD' : 'ETB', maximumFractionDigits: 2,
}).format(num(value));
const dateText = (d) => d ? new Date(`${d}T00:00:00`).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : '—';
const monthText = (d) => d ? new Date(`${String(d).slice(0, 7)}-01T00:00:00`).toLocaleDateString(undefined, { year: 'numeric', month: 'long' }) : '—';
const toast = (message) => {
  state.toast = message;
  render();
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => { state.toast = ''; render(); }, 2800);
};

const nav = [
  ['dashboard', 'Dashboard'], ['transactions', 'Transactions'], ['accounts', 'Accounts'],
  ['budgets', 'Budgets'], ['bills', 'Bills'], ['goals', 'Savings Goals'], ['settings', 'Settings'],
];

function sessionValid() {
  const started = Number(localStorage.getItem(SESSION_KEY));
  return started > 0 && Date.now() - started < MAX_SESSION_MS;
}
function startSession() { localStorage.setItem(SESSION_KEY, String(Date.now())); }
function clearSession() { localStorage.removeItem(SESSION_KEY); }

async function enforceSession() {
  const { data: { session } } = await supabase.auth.getSession();
  if (session && sessionValid()) {
    state.session = session; state.user = session.user; return true;
  }
  if (session) await supabase.auth.signOut();
  clearSession();
  state.session = null; state.user = null;
  return false;
}

async function refreshRate(force = true) {
  try {
    if (force) await supabase.functions.invoke('refresh-exchange-rate', { body: {} });
    const { data, error } = await supabase.from('exchange_rates')
      .select('*').eq('base_currency', 'USD').eq('quote_currency', 'ETB')
      .order('rate_date', { ascending: false }).order('fetched_at', { ascending: false })
      .limit(1).maybeSingle();
    if (error) throw error;
    state.rate = data || null;
  } catch (error) {
    console.error(error);
    if (force) toast('FX refresh failed; using the last stored rate.');
  }
}

let refreshPromise = null;

// PARALLEL_REFRESH_V1: load dashboard-critical data concurrently, then hydrate secondary data.
async function refreshData() {
  if (refreshPromise) return refreshPromise;
  refreshPromise = (async () => {
    state.loading = true;
    render();

    const query = (table) => {
      let q = supabase.from(table).select('*');
      if (table === 'transactions') q = q.order('transaction_date', { ascending: false }).order('created_at', { ascending: false });
      else if (table === 'bills') q = q.order('due_date', { ascending: true });
      else if (table === 'budgets') q = q.order('month', { ascending: false });
      else q = q.order('created_at', { ascending: false });
      return q;
    };

    const criticalTables = ['accounts', 'transactions', 'categories', 'bills', 'savings_goals'];
    // Fetch FX once in the background; never let it block the dashboard.
    void refreshRate(false);
    const withTimeout = (promise, ms) => Promise.race([
      promise,
      new Promise((resolve) => setTimeout(() => resolve({ data: [], error: new Error(`Timed out loading ${ms}ms`) }), ms)),
    ]);
    const results = await Promise.all(
      criticalTables.map(async (table) => {
        const { data, error } = await withTimeout(query(table), 5000);
        if (error) console.warn(table, error);
        return [table, data || []];
      })
    );

    for (const [table, data] of results) {
      state.data[table === 'savings_goals' ? 'goals' : table] = data;
    }
    // RESILIENT_LOADING_V2\n
    state.loading = false;
    render();

    // Budgets are not needed to render the dashboard, so hydrate them after first paint.
    const { data: budgets, error: budgetsError } = await query('budgets');
    if (budgetsError) console.error('budgets', budgetsError);
    state.data.budgets = budgets || [];
    render();
  })().finally(() => {
    refreshPromise = null;
  });
  return refreshPromise;
}

function transactionTotals() {
  const tx = state.data.transactions;
  const income = tx.filter((t) => t.type === 'income').reduce((s, t) => s + num(t.amount), 0);
  const expense = tx.filter((t) => t.type === 'expense').reduce((s, t) => s + num(t.amount), 0);
  return { income, expense, net: income - expense };
}
function accountBalance(account) {
  const tx = state.data.transactions.filter((t) => t.account_id === account.id);
  return num(account.opening_balance) + tx.reduce((s, t) => s + (t.type === 'income' ? num(t.amount) : -num(t.amount)), 0);
}
function dashboardStats() {
  const totals = transactionTotals();
  const thisMonth = today().slice(0, 7);
  const monthly = state.data.transactions.filter((t) => String(t.transaction_date).slice(0, 7) === thisMonth);
  const mIncome = monthly.filter((t) => t.type === 'income').reduce((s, t) => s + num(t.amount), 0);
  const mExpense = monthly.filter((t) => t.type === 'expense').reduce((s, t) => s + num(t.amount), 0);
  const upcomingBills = state.data.bills.filter((b) => !b.is_paid).slice(0, 5);
  const savings = state.data.goals.reduce((s, g) => s + num(g.current_amount), 0);
  return { ...totals, mIncome, mExpense, upcomingBills, savings };
}

function shell(content) {
  return `<div class="app"><aside class="sidebar"><div class="logo">FINANCE HUB<small>PERSONAL FINANCE</small></div><nav class="nav">${nav.map(([id,label]) => `<button class="${state.page===id?'active':''}" data-nav="${id}">${label}</button>`).join('')}</nav><div class="sidebar-foot"><div style="color:#94a3b8;font-size:11px;padding:0 12px 10px">Application session: 6 hours</div><button class="btn btn-secondary" style="width:100%" id="signout">Sign out</button></div></aside><main class="main"><div class="topbar"><div style="display:flex;align-items:center;gap:10px"><h1>${esc(nav.find(([id]) => id === state.page)?.[1] || 'Dashboard')}</h1></div><div class="user-pill"><div>${esc(state.user?.email || '')}</div><div class="avatar">${esc((state.user?.email || '?').slice(0,1).toUpperCase())}</div></div></div>${content}</main></div>${state.toast ? `<div class="toast">${esc(state.toast)}</div>` : ''}`;
}

function authView() {
  return `<div class="auth"><div class="auth-card"><h1>Personal Finance Hub</h1><p>Secure access to your real Supabase finance data.</p><div class="auth-toggle"><button class="${state.authMode==='signin'?'active':''}" id="signin-tab">Sign in</button><button class="${state.authMode==='signup'?'active':''}" id="signup-tab">Create account</button></div><form id="auth-form" class="form"><div class="field"><label>Email</label><input id="auth-email" type="email" autocomplete="email" required></div><div class="field"><label>Password</label><input id="auth-password" type="password" autocomplete="current-password" minlength="6" required></div>${state.authMode==='signup' ? '<div class="field"><label>Confirm password</label><input id="auth-password2" type="password" autocomplete="new-password" minlength="6" required></div>' : ''}<div id="auth-error"></div><button class="btn btn-primary" type="submit">${state.authMode==='signin'?'Sign in':'Create account'}</button></form><div class="notice" style="margin-top:14px">The app expires your active application session after 6 hours. Supabase token refresh remains enabled underneath.</div></div></div>`;
}

function dashboard() {
  const s = dashboardStats();
  const rateFresh = state.rate ? Math.max(0, Math.round((Date.now() - new Date(state.rate.fetched_at).getTime()) / 60000)) : null;
  const categorySpend = state.data.categories.filter(c => c.type === 'expense').map(c => ({ name: c.name, amount: state.data.transactions.filter(t => t.type === 'expense' && t.category_id === c.id).reduce((sum,t)=>sum+num(t.amount),0) })).filter(x=>x.amount>0).sort((a,b)=>b.amount-a.amount).slice(0,5);
  return `<div class="grid grid-4"><div class="card metric"><div class="label">Net cash flow</div><div class="value ${s.net>=0?'pos':'neg'}">${money(s.net)}</div><div class="sub">All recorded income less expenses</div></div><div class="card metric"><div class="label">This month income</div><div class="value pos">${money(s.mIncome)}</div><div class="sub">${monthText(today())}</div></div><div class="card metric"><div class="label">This month expenses</div><div class="value neg">${money(s.mExpense)}</div><div class="sub">${monthText(today())}</div></div><div class="card metric"><div class="label">Savings goals</div><div class="value">${money(s.savings)}</div><div class="sub">Current goal balances</div></div></div><div class="grid grid-3" style="margin-top:16px"><div class="card"><div class="card-head"><h3>Live USD / ETB</h3><button class="btn btn-secondary btn-small" id="refresh-fx">Refresh</button></div><div class="rate"><div><div class="big">${state.rate ? num(state.rate.rate).toFixed(3) : '—'}</div><div class="muted">1 USD = ETB</div></div><span class="badge">${state.rate?'Live source':'Unavailable'}</span></div><div class="sub muted" style="margin-top:12px">${state.rate ? `Updated ${rateFresh===0?'less than a minute ago':`${rateFresh} min ago`} · ${esc(state.rate.source)}` : 'No rate loaded.'}</div></div><div class="card"><div class="card-head"><h3>Account balances</h3><button class="btn btn-secondary btn-small" data-nav="accounts">View</button></div>${state.data.accounts.length ? state.data.accounts.slice(0,5).map(a=>`<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--line)"><span>${esc(a.name)}</span><strong>${money(accountBalance(a),a.currency)}</strong></div>`).join('') : '<div class="empty">No accounts yet.</div>'}</div><div class="card"><div class="card-head"><h3>Upcoming bills</h3><button class="btn btn-secondary btn-small" data-nav="bills">View</button></div>${s.upcomingBills.length ? s.upcomingBills.map(b=>`<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--line)"><span>${esc(b.name)}<br><span class="muted" style="font-size:11px">${dateText(b.due_date)}</span></span><strong>${money(b.amount)}</strong></div>`).join('') : '<div class="empty">No unpaid bills.</div>'}</div></div><div class="grid grid-2" style="margin-top:16px"><div class="card"><div class="card-head"><h3>Top spending categories</h3><button class="btn btn-primary btn-small" id="add-tx">Add transaction</button></div>${categorySpend.length ? categorySpend.map(c=>`<div style="margin:10px 0"><div style="display:flex;justify-content:space-between;font-size:13px"><span>${esc(c.name)}</span><strong>${money(c.amount)}</strong></div><div class="progress"><div style="width:${categorySpend[0].amount ? Math.min(100,c.amount/categorySpend[0].amount*100) : 0}%"></div></div></div>`).join('') : '<div class="empty">No expense data yet.</div>'}</div><div class="card"><div class="card-head"><h3>Recent transactions</h3><button class="btn btn-secondary btn-small" data-nav="transactions">View all</button></div>${state.data.transactions.length ? `<div class="table-wrap"><table class="table"><tbody>${state.data.transactions.slice(0,7).map(t=>`<tr><td>${dateText(t.transaction_date)}</td><td>${esc(t.description||'Transaction')}</td><td class="${t.type==='income'?'pos':'neg'}">${t.type==='income'?'+':'-'}${money(t.amount)}</td></tr>`).join('')}</tbody></table></div>` : '<div class="empty">No transactions yet.</div>'}</div></div>`;
}

function transactions() {
  return `<div class="card"><div class="card-head"><div><h3 style="margin:0">Transactions</h3><div class="muted" style="font-size:12px;margin-top:4px">Historical FX is stored with each USD transaction.</div></div><div style="display:flex;gap:8px"><button class="btn btn-secondary" id="export-tx">Export CSV</button><button class="btn btn-primary" id="add-tx">Add transaction</button></div></div><div class="table-wrap"><table class="table"><thead><tr><th>Date</th><th>Description</th><th>Type</th><th>ETB Amount</th><th>Source</th><th>Original</th><th>FX</th><th></th></tr></thead><tbody>${state.data.transactions.map(t=>`<tr><td>${dateText(t.transaction_date)}</td><td>${esc(t.description||'')}</td><td>${esc(t.type)}</td><td class="${t.type==='income'?'pos':'neg'}">${money(t.amount)}</td><td>${esc(t.source_currency)}</td><td>${t.original_amount != null ? money(t.original_amount,t.source_currency) : '—'}</td><td>${t.fx_rate ? num(t.fx_rate).toFixed(3) : '—'}</td><td><button class="btn btn-danger btn-small" data-delete-tx="${t.id}">Delete</button></td></tr>`).join('') || '<tr><td colspan="8" class="empty">No transactions yet.</td></tr>'}</tbody></table></div></div>`;
}

function accounts() {
  return `<div class="card"><div class="card-head"><div><h3 style="margin:0">Accounts</h3><div class="muted" style="font-size:12px;margin-top:4px">Balances are calculated from opening balance plus recorded transactions.</div></div><button class="btn btn-primary" id="add-account">Add account</button></div><div class="grid grid-3">${state.data.accounts.map(a=>`<div class="card" style="box-shadow:none"><div class="muted" style="font-size:12px">${esc(a.type)}</div><h3 style="margin:5px 0">${esc(a.name)}</h3><div style="font-size:25px;font-weight:800">${money(accountBalance(a),a.currency)}</div><div class="muted" style="font-size:12px">Opening ${money(a.opening_balance,a.currency)}</div><button class="btn btn-danger btn-small" style="margin-top:12px" data-delete-account="${a.id}">Delete</button></div>`).join('') || '<div class="empty">No accounts yet.</div>'}</div></div>`;
}

function budgets() {
  const month = today().slice(0,7);
  const rows = state.data.budgets.map(b=>{
    const c = state.data.categories.find(x=>x.id===b.category_id);
    const spent = state.data.transactions.filter(t=>t.type==='expense' && t.category_id===b.category_id && String(t.transaction_date).slice(0,7)===String(b.month).slice(0,7)).reduce((s,t)=>s+num(t.amount),0);
    const pct = b.amount ? Math.min(100, spent/num(b.amount)*100) : 0;
    return `<div class="card" style="box-shadow:none"><div class="card-head"><strong>${esc(c?.name || 'Budget')}</strong><button class="btn btn-danger btn-small" data-delete-budget="${b.id}">Delete</button></div><div style="display:flex;justify-content:space-between"><span>${money(spent)} spent</span><span>${money(b.amount)} budget</span></div><div class="progress" style="margin:10px 0"><div style="width:${pct}%"></div></div><div class="muted" style="font-size:12px">${monthText(b.month)}${String(b.month).slice(0,7)===month?' · Current month':''}</div></div>`;
  });
  return `<div class="card"><div class="card-head"><div><h3 style="margin:0">Budgets</h3><div class="muted" style="font-size:12px;margin-top:4px">One budget per category per month.</div></div><button class="btn btn-primary" id="add-budget">Add budget</button></div><div class="grid grid-2">${rows.join('') || '<div class="empty">No budgets yet.</div>'}</div></div>`;
}

function bills() {
  return `<div class="card"><div class="card-head"><div><h3 style="margin:0">Bills</h3><div class="muted" style="font-size:12px;margin-top:4px">Track due dates and payment status.</div></div><button class="btn btn-primary" id="add-bill">Add bill</button></div><div class="table-wrap"><table class="table"><thead><tr><th>Name</th><th>Amount</th><th>Due</th><th>Frequency</th><th>Status</th><th></th></tr></thead><tbody>${state.data.bills.map(b=>`<tr><td>${esc(b.name)}</td><td>${money(b.amount)}</td><td>${dateText(b.due_date)}</td><td>${esc(b.frequency)}</td><td>${b.is_paid ? '<span class="badge">Paid</span>' : '<span class="notice" style="display:inline-block;padding:5px 8px">Open</span>'}</td><td><button class="btn ${b.is_paid?'btn-secondary':'btn-primary'} btn-small" data-toggle-bill="${b.id}" data-paid="${b.is_paid}">${b.is_paid?'Mark open':'Mark paid'}</button> <button class="btn btn-danger btn-small" data-delete-bill="${b.id}">Delete</button></td></tr>`).join('') || '<tr><td colspan="6" class="empty">No bills yet.</td></tr>'}</tbody></table></div></div>`;
}

function goals() {
  return `<div class="card"><div class="card-head"><div><h3 style="margin:0">Savings goals</h3><div class="muted" style="font-size:12px;margin-top:4px">Progress is stored directly in Supabase.</div></div><button class="btn btn-primary" id="add-goal">Add goal</button></div><div class="grid grid-2">${state.data.goals.map(g=>{const pct=Math.min(100, num(g.target_amount) ? num(g.current_amount)/num(g.target_amount)*100 : 0);return `<div class="card" style="box-shadow:none"><div class="card-head"><strong>${esc(g.name)}</strong><button class="btn btn-danger btn-small" data-delete-goal="${g.id}">Delete</button></div><div style="font-size:25px;font-weight:800">${money(g.current_amount)} <span class="muted" style="font-size:13px">/ ${money(g.target_amount)}</span></div><div class="progress" style="margin:12px 0"><div style="width:${pct}%"></div></div><div class="muted" style="font-size:12px">${pct.toFixed(0)}% · target ${g.target_date?dateText(g.target_date):'No target date'}</div></div>`;}).join('') || '<div class="empty">No savings goals yet.</div>'}</div></div>`;
}

function settings() {
  const minutes = state.rate ? Math.max(0, Math.round((Date.now() - new Date(state.rate.fetched_at).getTime()) / 60000)) : null;
  return `<div class="grid grid-2"><div class="card"><h3>Authentication</h3><p class="muted">Supabase Auth is active with automatic refresh. The app itself expires after 6 hours.</p><button class="btn btn-danger" id="signout-2">Sign out</button></div><div class="card"><h3>Live FX</h3><p class="muted">USD → ETB is refreshed through the Supabase Edge Function and stored historically in exchange_rates.</p>${state.rate?`<div><strong>1 USD = ${num(state.rate.rate).toFixed(3)} ETB</strong><div class="muted" style="font-size:12px;margin-top:6px">Updated ${minutes===0?'less than a minute ago':`${minutes} min ago`} · ${esc(state.rate.source)} · ${dateText(state.rate.rate_date)}</div></div>`:'No live rate loaded.'}</div><div class="card"><h3>Data export</h3><p class="muted">Download the finance records currently visible to your account.</p><button class="btn btn-secondary" id="export-all">Export all CSV</button></div><div class="card"><h3>Data model</h3><p class="muted">Your records live in Supabase with row-level security. Exchange-rate rows are read-only to normal users.</p><div class="grid grid-2" style="font-size:12px"><div>Accounts<br><strong>${state.data.accounts.length}</strong></div><div>Transactions<br><strong>${state.data.transactions.length}</strong></div><div>Budgets<br><strong>${state.data.budgets.length}</strong></div><div>Bills<br><strong>${state.data.bills.length}</strong></div></div></div></div>`;
}

function modal() {
  if (!state.modal) return '';
  const commonButtons = '<div class="actions"><button type="button" class="btn btn-secondary" id="modal-close">Cancel</button><button class="btn btn-primary">Save</button></div>';
  let body = '';
  if (state.modal === 'tx') {
    const expenseCats = state.data.categories.filter(c=>c.type==='expense');
    const incomeCats = state.data.categories.filter(c=>c.type==='income');
    body = `<h2>Add transaction</h2><form id="modal-form" class="form"><div class="form-grid"><div class="field"><label>Type</label><select id="m-type"><option value="expense">Expense</option><option value="income">Income</option></select></div><div class="field"><label>Date</label><input id="m-date" type="date" value="${today()}" required></div></div><div class="field"><label>Description</label><input id="m-desc" required></div><div class="form-grid"><div class="field"><label>Account</label><select id="m-account">${state.data.accounts.map(a=>`<option value="${a.id}">${esc(a.name)} (${a.currency})</option>`).join('')}</select></div><div class="field"><label>Category</label><select id="m-cat">${expenseCats.map(c=>`<option value="${c.id}" data-type="expense">${esc(c.name)}</option>`).join('')}</select></div></div><div class="form-grid"><div class="field"><label>Currency</label><select id="m-cur"><option value="ETB">ETB</option><option value="USD">USD</option></select></div><div class="field"><label>Original amount</label><input id="m-original" type="number" step="0.01" min="0.01" required></div></div><div class="notice">${state.rate?`Current live rate: 1 USD = ${num(state.rate.rate).toFixed(3)} ETB.`:'No FX rate is loaded; refresh the dashboard before creating a USD transaction.'}</div>${commonButtons}</form>`;
    setTimeout(()=>{
      const type = $('#m-type'), cat = $('#m-cat');
      const sync = () => { const list = type.value==='income' ? incomeCats : expenseCats; cat.innerHTML = list.map(c=>`<option value="${c.id}">${esc(c.name)}</option>`).join(''); };
      type?.addEventListener('change', sync);
    },0);
  } else if (state.modal === 'account') {
    body = `<h2>Add account</h2><form id="modal-form" class="form"><div class="field"><label>Name</label><input id="m-name" required></div><div class="form-grid"><div class="field"><label>Type</label><select id="m-type"><option>cash</option><option>bank</option><option>mobile_money</option><option>savings</option><option>credit</option><option>other</option></select></div><div class="field"><label>Currency</label><select id="m-cur"><option>ETB</option><option>USD</option></select></div></div><div class="field"><label>Opening balance</label><input id="m-opening" type="number" step="0.01" required></div>${commonButtons}</form>`;
  } else if (state.modal === 'budget') {
    body = `<h2>Add budget</h2><form id="modal-form" class="form"><div class="field"><label>Category</label><select id="m-cat">${state.data.categories.filter(c=>c.type==='expense').map(c=>`<option value="${c.id}">${esc(c.name)}</option>`).join('')}</select></div><div class="form-grid"><div class="field"><label>Month</label><input id="m-month" type="date" value="${monthStart()}" required></div><div class="field"><label>Amount</label><input id="m-amount" type="number" min="0" step="0.01" required></div></div>${commonButtons}</form>`;
  } else if (state.modal === 'bill') {
    body = `<h2>Add bill</h2><form id="modal-form" class="form"><div class="field"><label>Name</label><input id="m-name" required></div><div class="form-grid"><div class="field"><label>Amount</label><input id="m-amount" type="number" min="0.01" step="0.01" required></div><div class="field"><label>Due date</label><input id="m-date" type="date" required></div></div><div class="form-grid"><div class="field"><label>Frequency</label><select id="m-frequency"><option>one_time</option><option>weekly</option><option>monthly</option><option>quarterly</option><option>yearly</option></select></div><div class="field"><label>Account</label><select id="m-account"><option value="">None</option>${state.data.accounts.map(a=>`<option value="${a.id}">${esc(a.name)}</option>`).join('')}</select></div></div>${commonButtons}</form>`;
  } else if (state.modal === 'goal') {
    body = `<h2>Add savings goal</h2><form id="modal-form" class="form"><div class="field"><label>Name</label><input id="m-name" required></div><div class="form-grid"><div class="field"><label>Target amount</label><input id="m-target" type="number" min="0.01" step="0.01" required></div><div class="field"><label>Current amount</label><input id="m-current" type="number" min="0" step="0.01" value="0" required></div></div><div class="form-grid"><div class="field"><label>Target date</label><input id="m-date" type="date"></div><div class="field"><label>Account</label><select id="m-account"><option value="">None</option>${state.data.accounts.map(a=>`<option value="${a.id}">${esc(a.name)}</option>`).join('')}</select></div></div>${commonButtons}</form>`;
  }
  return `<div class="modal-backdrop"><div class="modal">${body}</div></div>`;
}

function render() {
  const root = $('#root');
  if (!state.session) { root.innerHTML = authView(); bindAuth(); return; }
  const pages = { dashboard, transactions, accounts, budgets, bills, goals, settings };
  const content = state.loading ? '<div class="card empty">Loading your finance data…</div>' : pages[state.page]();
  root.innerHTML = shell(content) + modal();
  bindApp();
}

function bindAuth() {
  $('#signin-tab')?.addEventListener('click', () => { state.authMode = 'signin'; render(); });
  $('#signup-tab')?.addEventListener('click', () => { state.authMode = 'signup'; render(); });
  $('#auth-form')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const email = $('#auth-email').value.trim();
    const password = $('#auth-password').value;
    const errorEl = $('#auth-error');
    errorEl.innerHTML = '';
    try {
      if (state.authMode === 'signup') {
        if (password !== $('#auth-password2').value) throw new Error('Passwords do not match.');
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        if (!data.session) { errorEl.innerHTML = '<div class="notice">Account created. Check your email if confirmation is required.</div>'; return; }
        startSession(); state.session = data.session; state.user = data.user; render(); return;
      }
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      startSession(); state.session = data.session; state.user = data.user; render();
    } catch (error) {
      errorEl.innerHTML = `<div class="notice">${esc(error.message || 'Unable to sign in.')}</div>`;
    }
  });
}

function bindApp() {
  document.querySelectorAll('[data-nav]').forEach((button) => button.addEventListener('click', () => { state.page = button.dataset.nav; render(); }));
  $('#signout')?.addEventListener('click', signout);
  $('#signout-2')?.addEventListener('click', signout);
  $('#refresh-fx')?.addEventListener('click', async () => { await refreshRate(true); render(); });
  $('#add-tx')?.addEventListener('click', () => openModal('tx'));
  $('#add-account')?.addEventListener('click', () => openModal('account'));
  $('#add-budget')?.addEventListener('click', () => openModal('budget'));
  $('#add-bill')?.addEventListener('click', () => openModal('bill'));
  $('#add-goal')?.addEventListener('click', () => openModal('goal'));
  $('#export-tx')?.addEventListener('click', () => exportCsv('transactions', state.data.transactions));
  $('#export-all')?.addEventListener('click', exportAll);
  $('#modal-close')?.addEventListener('click', closeModal);
  $('#modal-form')?.addEventListener('submit', saveModal);
  document.querySelectorAll('[data-delete-tx]').forEach((b) => b.addEventListener('click', () => del('transactions', b.dataset.deleteTx)));
  document.querySelectorAll('[data-delete-account]').forEach((b) => b.addEventListener('click', () => del('accounts', b.dataset.deleteAccount)));
  document.querySelectorAll('[data-delete-budget]').forEach((b) => b.addEventListener('click', () => del('budgets', b.dataset.deleteBudget)));
  document.querySelectorAll('[data-delete-bill]').forEach((b) => b.addEventListener('click', () => del('bills', b.dataset.deleteBill)));
  document.querySelectorAll('[data-delete-goal]').forEach((b) => b.addEventListener('click', () => del('savings_goals', b.dataset.deleteGoal)));
  document.querySelectorAll('[data-toggle-bill]').forEach((b) => b.addEventListener('click', () => toggleBill(b.dataset.toggleBill, b.dataset.paid === 'true')));
}

function openModal(type) { state.modal = type; render(); }
function closeModal() { state.modal = null; render(); }

async function del(table, id) {
  if (!confirm('Delete this item?')) return;
  const { error } = await supabase.from(table).delete().eq('id', id);
  if (error) { toast(error.message); return; }
  await refreshData();
  toast('Deleted');
}
async function toggleBill(id, paid) {
  const { error } = await supabase.from('bills').update({ is_paid: !paid }).eq('id', id);
  if (error) { toast(error.message); return; }
  await refreshData();
  toast(!paid ? 'Bill marked paid' : 'Bill marked open');
}

async function saveModal(event) {
  event.preventDefault();
  try {
    let table, payload;
    if (state.modal === 'account') {
      table = 'accounts';
      payload = { name: $('#m-name').value.trim(), type: $('#m-type').value, currency: $('#m-cur').value, opening_balance: num($('#m-opening').value), user_id: state.user.id };
    } else if (state.modal === 'budget') {
      table = 'budgets';
      payload = { category_id: $('#m-cat').value, month: $('#m-month').value, amount: num($('#m-amount').value), user_id: state.user.id };
    } else if (state.modal === 'bill') {
      table = 'bills';
      payload = { name: $('#m-name').value.trim(), amount: num($('#m-amount').value), due_date: $('#m-date').value, frequency: $('#m-frequency').value, is_paid: false, account_id: $('#m-account').value || null, user_id: state.user.id };
    } else if (state.modal === 'goal') {
      table = 'savings_goals';
      payload = { name: $('#m-name').value.trim(), target_amount: num($('#m-target').value), current_amount: num($('#m-current').value), target_date: $('#m-date').value || null, account_id: $('#m-account').value || null, user_id: state.user.id };
    } else if (state.modal === 'tx') {
      table = 'transactions';
      const type = $('#m-type').value;
      const cur = $('#m-cur').value;
      const original = num($('#m-original').value);
      const categoryId = $('#m-cat').value;
      const rate = cur === 'USD' ? num(currentRate()) : 1;
      if (!original || original <= 0) throw new Error('Amount must be greater than zero.');
      if (cur === 'USD' && !rate) throw new Error('Live FX rate unavailable. Refresh FX before saving a USD transaction.');
      payload = {
        type, transaction_date: $('#m-date').value, description: $('#m-desc').value.trim(),
        account_id: $('#m-account').value, category_id: categoryId, source_currency: cur,
        original_amount: original, amount: original * rate, fx_rate: cur === 'USD' ? rate : 1,
        fx_rate_date: cur === 'USD' ? (state.rate?.rate_date || today()) : null, user_id: state.user.id,
      };
    }
    const { error } = await supabase.from(table).insert(payload);
    if (error) throw error;
    closeModal(); await refreshData(); toast('Saved');
  } catch (error) { toast(error.message || 'Could not save.'); }
}

function currentRate() { return num(state.rate?.rate); }

function csvCell(value) {
  const text = String(value ?? '');
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}
function download(name, content, type='text/csv;charset=utf-8') {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = name; a.click(); URL.revokeObjectURL(url);
}
function exportCsv(name, rows) {
  if (!rows.length) { toast('Nothing to export.'); return; }
  const keys = Object.keys(rows[0]);
  const csv = [keys.join(','), ...rows.map(row => keys.map(k => csvCell(row[k])).join(','))].join('\n');
  download(`${name}-${today()}.csv`, csv);
}
function exportAll() {
  const sections = [
    ['ACCOUNTS', state.data.accounts], ['TRANSACTIONS', state.data.transactions], ['BUDGETS', state.data.budgets],
    ['BILLS', state.data.bills], ['SAVINGS_GOALS', state.data.goals], ['CATEGORIES', state.data.categories],
  ];
  const blocks = [];
  for (const [title, rows] of sections) {
    blocks.push(title);
    if (!rows.length) { blocks.push(''); continue; }
    const keys = Object.keys(rows[0]); blocks.push(keys.join(','));
    rows.forEach(r => blocks.push(keys.map(k => csvCell(r[k])).join(',')));
    blocks.push('');
  }
  download(`finance-export-${today()}.csv`, blocks.join('\n'));
}

async function signout() {
  clearSession(); await supabase.auth.signOut();
  state.session = null; state.user = null; state.data = { accounts: [], transactions: [], categories: [], budgets: [], bills: [], goals: [] };
  render();
}

supabase.auth.onAuthStateChange(async (event, session) => {
  if (event === 'SIGNED_IN' && session) {
    if (!sessionValid()) startSession();
    state.session = session; state.user = session.user; await refreshData();
  }
  if (event === 'SIGNED_OUT') { state.session = null; state.user = null; render(); }
});

setInterval(async () => {
  const started = Number(localStorage.getItem(SESSION_KEY));
  if (state.session && started && Date.now() - started >= MAX_SESSION_MS) await signout();
}, 30000);

(async () => { const ok = await enforceSession(); render(); if (ok) await refreshData(); })();
