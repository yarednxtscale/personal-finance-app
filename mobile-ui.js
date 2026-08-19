const MOBILE_BREAKPOINT = 760;

const isMobile = () => window.matchMedia(`(max-width:${MOBILE_BREAKPOINT}px)`).matches;
const q = (selector, root = document) => root.querySelector(selector);
const qa = (selector, root = document) => [...root.querySelectorAll(selector)];

const style = document.createElement('style');
style.id = 'finance-mobile-ui-styles';
style.textContent = `
@media (max-width:760px){
  body{overflow-x:hidden;padding-bottom:calc(72px + env(safe-area-inset-bottom))}
  .main{padding-bottom:calc(92px + env(safe-area-inset-bottom)) !important}
  .topbar{position:sticky;top:0;z-index:18;margin:calc(-18px - env(safe-area-inset-top)) -18px 18px;padding:calc(12px + env(safe-area-inset-top)) 14px 12px;background:rgba(246,247,251,.94);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);border-bottom:1px solid rgba(230,232,239,.9)}
  .topbar h1{font-size:20px !important;line-height:1.1}
  .user-pill>div:first-child{display:none}
  .user-pill{gap:8px}
  .avatar{width:34px;height:34px}
  .card{box-shadow:0 5px 20px rgba(23,32,51,.055)}
  .metric{min-height:118px;display:flex;flex-direction:column;justify-content:center}
  .metric .value{font-size:25px !important;line-height:1.05}
  .metric .sub{font-size:11px;line-height:1.35}
  .card-head{align-items:flex-start}
  .card-head .btn{flex:0 0 auto}
  .btn{min-height:44px;padding:10px 13px}
  .btn-small{min-height:40px}
  .field input,.field select{min-height:46px;font-size:16px}
  .actions{position:sticky;bottom:0;background:#fff;padding-top:10px;margin-inline:-2px;padding-bottom:env(safe-area-inset-bottom);z-index:2}
  .table-wrap{display:none}
  .mobile-tx-list{display:grid;gap:10px;margin-top:12px}
  .mobile-tx-card{border:1px solid var(--line);border-radius:16px;background:#fff;padding:14px;display:grid;gap:10px;box-shadow:0 4px 18px rgba(23,32,51,.04)}
  .mobile-tx-top{display:flex;align-items:flex-start;justify-content:space-between;gap:12px}
  .mobile-tx-main{min-width:0}
  .mobile-tx-description{font-weight:800;overflow-wrap:anywhere}
  .mobile-tx-date{font-size:11px;color:var(--muted);margin-top:3px}
  .mobile-tx-amount{font-weight:900;white-space:nowrap}
  .mobile-tx-meta{display:flex;flex-wrap:wrap;gap:6px}
  .mobile-tx-chip{font-size:10px;padding:5px 7px;border-radius:999px;background:#f1f3f7;color:var(--muted);font-weight:700}
  .mobile-tx-actions{display:flex;justify-content:flex-end}
  .mobile-tx-actions .btn{min-height:40px}
  .mobile-filter-bar{position:sticky;top:66px;z-index:12;display:grid;gap:8px;padding:8px 0 10px;background:linear-gradient(var(--bg) 74%,rgba(246,247,251,0))}
  .mobile-filter-row{display:flex;gap:7px;overflow-x:auto;scrollbar-width:none;padding-bottom:1px}
  .mobile-filter-row::-webkit-scrollbar{display:none}
  .mobile-filter-chip{border:1px solid var(--line);background:#fff;color:var(--text);border-radius:999px;padding:8px 12px;min-height:40px;white-space:nowrap;font-weight:800;font-size:12px}
  .mobile-filter-chip.active{background:var(--brand);color:#fff;border-color:var(--brand)}
  .mobile-search{width:100%;min-height:44px;padding:10px 13px;border:1px solid var(--line);border-radius:13px;background:#fff;outline:none;font-size:16px}
  .mobile-search:focus{border-color:#9aa8c7;box-shadow:0 0 0 3px rgba(23,37,84,.08)}
  #finance-mobile-bottom-nav{position:fixed;left:0;right:0;bottom:0;z-index:10010;display:grid;grid-template-columns:1fr 1fr 1fr 1fr 1fr;gap:4px;padding:8px 10px calc(8px + env(safe-area-inset-bottom));background:rgba(255,255,255,.96);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);border-top:1px solid var(--line);box-shadow:0 -10px 30px rgba(15,23,42,.08)}
  .finance-mobile-nav-item{border:0;background:transparent;color:var(--muted);min-height:52px;border-radius:14px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;font-weight:800;font-size:10px;touch-action:manipulation}
  .finance-mobile-nav-item .icon{font-size:18px;line-height:1}
  .finance-mobile-nav-item.active{background:#f1f3f7;color:var(--brand)}
  .finance-mobile-nav-item.add{background:var(--brand);color:#fff;margin:-3px 3px 0;min-height:58px;border-radius:18px;box-shadow:0 8px 20px rgba(23,37,84,.24)}
  .finance-mobile-nav-item.more{font-size:9px}
  #finance-mobile-fab{display:none}
  .modal-backdrop{place-items:end;padding:0 !important;z-index:10020}
  .modal{width:100% !important;max-width:none !important;max-height:min(88dvh,720px);overflow:auto;border-radius:24px 24px 0 0 !important;padding:20px 16px calc(18px + env(safe-area-inset-bottom)) !important;animation:finance-sheet-in .18s ease-out}
  .modal-backdrop:before{content:"";position:absolute;top:8px;left:50%;width:42px;height:4px;transform:translateX(-50%);border-radius:999px;background:rgba(148,163,184,.7)}
  @keyframes finance-sheet-in{from{transform:translateY(18px);opacity:.65}to{transform:translateY(0);opacity:1}}
  .toast{left:14px;right:14px;bottom:calc(82px + env(safe-area-inset-bottom));text-align:center}
  .trash-modal{width:100% !important;max-height:100dvh !important;border-radius:22px 22px 0 0 !important;padding:16px !important;margin-top:auto !important}
  .trash-head{position:sticky;top:0;background:#fff;z-index:3;padding-bottom:10px}
  .trash-bulk{position:sticky;bottom:0;z-index:4;background:rgba(250,251,252,.97);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);padding:10px;margin-inline:-2px;margin-bottom:-1px;border-radius:14px;box-shadow:0 -8px 24px rgba(15,23,42,.08)}
  .trash-bulk .trash-actions{width:100%}
  .trash-bulk .trash-actions .btn{min-height:44px}
  .trash-row{padding:13px !important;border-radius:15px !important;gap:10px !important}
  .trash-row .trash-actions{width:100% !important;display:grid !important;grid-template-columns:1fr 1fr}
  .trash-row .trash-actions .btn{width:100%}
  .trash-select{min-height:42px}
  .trash-select input,.trash-row input{width:20px !important;height:20px !important;flex:0 0 auto}
  .sidebar{padding-top:calc(20px + env(safe-area-inset-top)) !important;padding-bottom:calc(18px + env(safe-area-inset-bottom)) !important}
}
@media (min-width:761px){#finance-mobile-bottom-nav,.mobile-filter-bar,.mobile-tx-list{display:none !important}}
`;
document.head.appendChild(style);

function triggerNav(page) {
  const target = q(`.sidebar [data-nav="${page}"]`);
  if (target) target.click();
}

function currentPage() {
  return q('.topbar h1')?.textContent?.trim().toLowerCase() || '';
}

function openMore() {
  const toggle = q('#mobile-nav-toggle');
  if (toggle) toggle.click();
}

function buildBottomNav() {
  if (!isMobile() || q('#finance-mobile-bottom-nav') || !q('.sidebar')) return;
  const nav = document.createElement('nav');
  nav.id = 'finance-mobile-bottom-nav';
  nav.setAttribute('aria-label', 'Primary mobile navigation');
  nav.innerHTML = `
    <button type="button" class="finance-mobile-nav-item" data-mobile-page="dashboard"><span class="icon">⌂</span><span>Home</span></button>
    <button type="button" class="finance-mobile-nav-item" data-mobile-page="transactions"><span class="icon">↔</span><span>Transactions</span></button>
    <button type="button" class="finance-mobile-nav-item add" data-mobile-add><span class="icon">＋</span><span>Add</span></button>
    <button type="button" class="finance-mobile-nav-item" data-mobile-page="accounts"><span class="icon">▣</span><span>Accounts</span></button>
    <button type="button" class="finance-mobile-nav-item more" data-mobile-more><span class="icon">•••</span><span>More</span></button>`;
  document.body.appendChild(nav);
  nav.querySelectorAll('[data-mobile-page]').forEach((button) => {
    button.addEventListener('click', () => triggerNav(button.dataset.mobilePage));
  });
  nav.querySelector('[data-mobile-add]')?.addEventListener('click', () => {
    q('#add-tx')?.click();
  });
  nav.querySelector('[data-mobile-more]')?.addEventListener('click', openMore);
}

function syncBottomNav() {
  const nav = q('#finance-mobile-bottom-nav');
  if (!nav) return;
  const page = currentPage();
  nav.querySelectorAll('[data-mobile-page]').forEach((button) => {
    const key = button.dataset.mobilePage;
    const active = (key === 'dashboard' && page === 'dashboard') || (key === 'transactions' && page === 'transactions') || (key === 'accounts' && page === 'accounts');
    button.classList.toggle('active', active);
  });
}

function addTransactionFilters() {
  if (!isMobile()) return;
  const title = currentPage();
  if (title !== 'transactions') return;
  const card = qa('.card').find((el) => el.querySelector('.card-head h3')?.textContent.trim() === 'Transactions');
  if (!card || q('.mobile-filter-bar', card)) return;

  const filterBar = document.createElement('div');
  filterBar.className = 'mobile-filter-bar';
  filterBar.innerHTML = `
    <input class="mobile-search" id="mobile-tx-search" type="search" inputmode="search" autocomplete="off" placeholder="Search transactions…" aria-label="Search transactions">
    <div class="mobile-filter-row" role="tablist" aria-label="Transaction type">
      <button class="mobile-filter-chip active" data-tx-filter="all" type="button">All</button>
      <button class="mobile-filter-chip" data-tx-filter="income" type="button">Income</button>
      <button class="mobile-filter-chip" data-tx-filter="expense" type="button">Expenses</button>
      <button class="mobile-filter-chip" data-tx-filter="transfer" type="button">Transfers</button>
    </div>`;
  card.insertBefore(filterBar, card.querySelector('.table-wrap'));

  const runFilter = () => {
    const search = (q('#mobile-tx-search', card)?.value || '').trim().toLowerCase();
    const activeType = q('.mobile-filter-chip.active', card)?.dataset.txFilter || 'all';
    qa('.mobile-tx-card', card).forEach((row) => {
      const type = row.dataset.type || '';
      const haystack = row.textContent.toLowerCase();
      row.hidden = (activeType !== 'all' && type !== activeType) || (search && !haystack.includes(search));
    });
  };

  q('#mobile-tx-search', card)?.addEventListener('input', runFilter);
  qa('[data-tx-filter]', filterBar).forEach((button) => button.addEventListener('click', () => {
    qa('[data-tx-filter]', filterBar).forEach((item) => item.classList.remove('active'));
    button.classList.add('active');
    runFilter();
  }));
}

function buildTransactionCards() {
  if (!isMobile() || currentPage() !== 'transactions') return;
  const card = qa('.card').find((el) => el.querySelector('.card-head h3')?.textContent.trim() === 'Transactions');
  const wrap = q('.table-wrap', card);
  const table = q('.table', wrap);
  if (!card || !wrap || !table || q('.mobile-tx-list', card)) return;
  const rows = qa('tbody tr', table);
  const list = document.createElement('div');
  list.className = 'mobile-tx-list';
  rows.forEach((row) => {
    const cells = qa('td', row);
    if (cells.length < 4) return;
    const type = cells[2]?.textContent.trim().toLowerCase() || '';
    const cardRow = document.createElement('article');
    cardRow.className = 'mobile-tx-card';
    cardRow.dataset.type = type;
    const amount = cells[3]?.textContent.trim() || '';
    const description = cells[1]?.textContent.trim() || 'Transaction';
    const date = cells[0]?.textContent.trim() || '';
    const source = cells[4]?.textContent.trim();
    const original = cells[5]?.textContent.trim();
    const fx = cells[6]?.textContent.trim();
    const deleteButton = q('[data-delete-tx]', row);
    cardRow.innerHTML = `
      <div class="mobile-tx-top">
        <div class="mobile-tx-main"><div class="mobile-tx-description"></div><div class="mobile-tx-date"></div></div>
        <div class="mobile-tx-amount ${type === 'income' ? 'pos' : 'neg'}"></div>
      </div>
      <div class="mobile-tx-meta"></div>
      <div class="mobile-tx-actions"></div>`;
    q('.mobile-tx-description', cardRow).textContent = description;
    q('.mobile-tx-date', cardRow).textContent = date;
    q('.mobile-tx-amount', cardRow).textContent = amount;
    const meta = q('.mobile-tx-meta', cardRow);
    [type, source, original, fx].filter((value) => value && value !== '—').forEach((value) => {
      const chip = document.createElement('span');
      chip.className = 'mobile-tx-chip';
      chip.textContent = value;
      meta.appendChild(chip);
    });
    if (deleteButton) {
      const action = document.createElement('button');
      action.className = 'btn btn-danger btn-small';
      action.type = 'button';
      action.textContent = 'Move to Trash';
      action.addEventListener('click', () => deleteButton.click());
      q('.mobile-tx-actions', cardRow).appendChild(action);
    }
    list.appendChild(cardRow);
  });
  wrap.insertAdjacentElement('afterend', list);
}

function enhanceTouchTargets() {
  if (!isMobile()) return;
  qa('button').forEach((button) => {
    if (button.closest('#finance-mobile-bottom-nav')) return;
    if (button.classList.contains('btn') || button.matches('.nav button')) button.style.touchAction = 'manipulation';
  });
}

function removeDesktopMobileArtifacts() {
  if (isMobile()) return;
  q('#finance-mobile-bottom-nav')?.remove();
  qa('.mobile-filter-bar,.mobile-tx-list').forEach((el) => el.remove());
}

function enhance() {
  if (!isMobile()) {
    removeDesktopMobileArtifacts();
    return;
  }
  buildBottomNav();
  syncBottomNav();
  buildTransactionCards();
  addTransactionFilters();
  enhanceTouchTargets();
}

const observer = new MutationObserver(() => {
  clearTimeout(enhance.timer);
  enhance.timer = setTimeout(enhance, 80);
});
observer.observe(document.body, { childList: true, subtree: true });
window.addEventListener('resize', () => {
  clearTimeout(enhance.resizeTimer);
  enhance.resizeTimer = setTimeout(enhance, 120);
});
window.addEventListener('pageshow', enhance);

enhance();
