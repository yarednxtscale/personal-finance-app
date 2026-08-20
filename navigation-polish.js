const GROUPS = [
  ['Overview', ['dashboard']],
  ['Money & Planning', ['income', 'transactions', 'accounts', 'budgets', 'bills', 'goals', 'projected-expenses']],
  ['Debt & System', ['debts', 'settings']],
];

function findNav() { return document.querySelector('.sidebar .nav'); }
function findItem(key) {
  const nav = findNav();
  if (!nav) return null;
  if (key === 'income') return nav.querySelector('[data-income-tab]');
  if (key === 'trash') return nav.querySelector('[data-trash-bin]');
  return nav.querySelector(`[data-nav="${key}"]`) || nav.querySelector(`[data-mx="${key}"]`);
}
function ensureLabel(nav, text, key) {
  let el = nav.querySelector(`[data-nav-section="${key}"]`);
  if (!el) {
    el = document.createElement('div');
    el.dataset.navSection = key;
    el.className = 'nav-section-title';
    el.textContent = text;
  }
  return el;
}
function organize() {
  const nav = findNav();
  if (!nav) return;

  const mappings = {
    dashboard: 'dashboard', income: 'income', transactions: 'transactions', accounts: 'accounts',
    budgets: 'budgets', bills: 'bills', goals: 'goals', projected: 'projected-expenses', debts: 'debts', settings: 'settings',
  };
  const nodes = {};
  Object.entries(mappings).forEach(([name, key]) => { nodes[name] = findItem(key); });
  if (nodes.goals) nodes.goals.textContent = 'Savings';
  if (nodes.income) nodes.income.textContent = 'My Income';

  // Hide the native duplicates that are replaced by the management renderer.
  ['transactions','budgets','bills','goals'].forEach((key) => {
    const native = nav.querySelector(`[data-nav="${key}"]`);
    const manager = nav.querySelector(`[data-mx="${key}"]`);
    if (native && manager) native.style.display = 'none';
  });
  if (nodes.debts) nodes.debts.style.display = '';

  const trash = nav.querySelector('[data-trash-bin]');
  if (trash) trash.style.display = '';

  GROUPS.forEach(([label, keys]) => {
    const sectionKey = label.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const title = ensureLabel(nav, label, sectionKey);
    nav.appendChild(title);
    keys.forEach((key) => {
      const lookup = key === 'projected-expenses' ? nodes.projected : nodes[key];
      if (lookup) nav.appendChild(lookup);
    });
  });

  const trashTitle = ensureLabel(nav, 'System', 'system');
  nav.appendChild(trashTitle);
  if (trash) nav.appendChild(trash);
}

function schedule() {
  clearTimeout(schedule.timer);
  schedule.timer = setTimeout(organize, 0);
}

const observer = new MutationObserver((mutations) => {
  const navMutation = mutations.some((m) => [...m.addedNodes].some((n) => n.nodeType === 1 && (n.closest?.('.sidebar .nav') || n.matches?.('.sidebar'))));
  if (navMutation) schedule();
});
observer.observe(document.body, { childList: true, subtree: true });
window.addEventListener('pageshow', schedule);
setTimeout(organize, 250);
