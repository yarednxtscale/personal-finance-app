const NAV_ORDER = [
  ['section', 'Overview'],
  ['button', 'Dashboard'],
  ['section', 'Money & Planning'],
  ['button', 'My Income'],
  ['button', 'Transactions'],
  ['button', 'Accounts'],
  ['button', 'Budgets'],
  ['button', 'Bills'],
  ['button', 'Savings Goals'],
  ['button', 'Projected Expenses'],
  ['section', 'Debt & System'],
  ['button', 'Debts'],
  ['button', 'Settings'],
  ['section', 'System'],
  ['trash', 'Trash Bin'],
];

const norm = (value) => String(value || '').replace(/\s+/g, ' ').trim().toLowerCase();
let organizing = false;
let lastSignature = '';

function hardenOverlays() {
  const backdrop = document.getElementById('mobile-nav-backdrop');
  if (!backdrop) return;
  const open = backdrop.classList.contains('open');
  backdrop.style.pointerEvents = open ? 'auto' : 'none';
  backdrop.style.display = open ? 'block' : 'none';
}

function navSignature(nav) {
  return [...nav.querySelectorAll('button')].map((button) => {
    const key = norm(button.textContent);
    const role = button.dataset.mx || button.dataset.incomeTab || button.dataset.trashBin || button.dataset.nav || '';
    return `${key}:${role}`;
  }).join('|');
}

function organizeSidebar() {
  const nav = document.querySelector('.sidebar .nav');
  if (!nav || organizing) return;

  const signature = navSignature(nav);
  if (signature && signature === lastSignature && nav.dataset.hardened === '1') return;

  const buttons = [...nav.querySelectorAll('button')];
  const byText = new Map();
  for (const button of buttons) {
    const key = norm(button.textContent);
    if (!key || byText.has(key)) continue;
    byText.set(key, button);
  }

  const preferredByText = new Map();
  for (const button of buttons) {
    const key = norm(button.textContent);
    if (!key) continue;
    if (button.dataset.mx || button.dataset.incomeTab || button.dataset.trashBin) {
      preferredByText.set(key, button);
    }
  }

  const chosen = new Map(byText);
  for (const [key, button] of preferredByText) chosen.set(key, button);

  organizing = true;
  try {
    nav.querySelectorAll('.ui-hardening-section').forEach((el) => el.remove());
    const fragment = document.createDocumentFragment();
    const used = new Set();

    for (const [kind, label] of NAV_ORDER) {
      const key = norm(label);
      if (kind === 'section') {
        const heading = document.createElement('div');
        heading.className = 'nav-section-title ui-hardening-section';
        heading.textContent = label;
        fragment.appendChild(heading);
        continue;
      }

      const button = kind === 'trash'
        ? (nav.querySelector('[data-trash-bin]') || chosen.get(key))
        : chosen.get(key);
      if (!button || used.has(button)) continue;
      used.add(button);
      button.style.marginTop = '';
      fragment.appendChild(button);
    }

    for (const button of buttons) {
      if (!used.has(button)) button.remove();
    }

    nav.appendChild(fragment);
    nav.dataset.hardened = '1';
    nav.style.gap = '3px';
    nav.style.overflowY = 'auto';
    nav.style.overflowX = 'hidden';

    const trash = nav.querySelector('[data-trash-bin]');
    if (trash) {
      trash.style.marginTop = 'auto';
      trash.style.flexShrink = '0';
    }

    lastSignature = navSignature(nav);
  } finally {
    organizing = false;
  }
}

function run() {
  hardenOverlays();
  organizeSidebar();
}

const style = document.createElement('style');
style.textContent = `
  body{overflow-x:hidden!important}
  #mobile-nav-backdrop:not(.open){display:none!important;pointer-events:none!important}
  .sidebar .nav{gap:3px!important;overflow-x:hidden!important}
  .sidebar .nav .nav-section-title{margin-top:6px!important;margin-bottom:2px!important;padding-top:8px!important;padding-bottom:3px!important}
  .sidebar .nav .nav-section-title:first-child{margin-top:0!important;padding-top:2px!important}
  .sidebar .nav button{min-height:38px!important;padding:8px 10px!important}
  .sidebar .nav [data-trash-bin]{margin-top:auto!important}
  @media(max-width:760px){
    .sidebar .nav button{min-height:40px!important}
    .sidebar .nav{padding-bottom:4px!important}
  }
`;
document.head.appendChild(style);

const observer = new MutationObserver(() => {
  if (organizing) return;
  window.clearTimeout(observer.timer);
  observer.timer = window.setTimeout(() => {
    hardenOverlays();
    const nav = document.querySelector('.sidebar .nav');
    if (!nav) return;
    if (navSignature(nav) !== lastSignature) organizeSidebar();
  }, 120);
});
observer.observe(document.body, { childList: true, subtree: true });

run();
