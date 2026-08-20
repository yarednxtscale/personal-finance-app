let currentTrashTrigger = null;

function getSidebar() { return document.querySelector('.sidebar'); }
function getTrashTrigger() { return document.querySelector('.sidebar [data-trash-bin]'); }

function installTrashBottom() {
  const sidebar = getSidebar();
  if (!sidebar) return;
  const trigger = getTrashTrigger();
  let wrap = sidebar.querySelector('.ui-trash-bottom');
  if (!wrap) {
    wrap = document.createElement('div');
    wrap.className = 'ui-trash-bottom';
    wrap.style.cssText = 'margin-top:8px;padding-top:14px;border-top:1px solid rgba(148,163,184,.18);';
    const foot = sidebar.querySelector('.sidebar-foot');
    if (foot) sidebar.insertBefore(wrap, foot);
    else sidebar.appendChild(wrap);
  }
  if (trigger) {
    trigger.style.display = 'none';
    currentTrashTrigger = trigger;
  }
  let button = wrap.querySelector('[data-trash-bottom-button]');
  if (!button) {
    button = document.createElement('button');
    button.type = 'button';
    button.dataset.trashBottomButton = '1';
    button.textContent = 'Trash Bin';
    button.className = 'trash-trigger';
    button.style.cssText = 'margin:0;border:0;background:transparent;color:#f6b5ae;text-align:left;padding:11px 12px;border-radius:12px;width:100%;font:inherit;font-weight:700;cursor:pointer;';
    button.addEventListener('click', () => {
      const live = currentTrashTrigger || getTrashTrigger();
      live?.click();
    });
    wrap.appendChild(button);
  }
}

const observer = new MutationObserver(() => { clearTimeout(observer.t); observer.t = setTimeout(installTrashBottom, 80); });
observer.observe(document.body, { childList:true, subtree:true });
window.addEventListener('pageshow', installTrashBottom);
setTimeout(installTrashBottom, 500);
