import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const db = createClient(
  'https://hznphzpukdwxyqgqksrx.supabase.co',
  'sb_publishable_1CgZ5bRDG7tSltHDwIc5HQ_w1SQFR-9',
  { auth: { persistSession: true, autoRefreshToken: true } }
);

const esc = (v) => String(v ?? '').replace(/[&<>\"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
const money = (v, c='ETB') => new Intl.NumberFormat('en-US', { style:'currency', currency:c==='USD'?'USD':'ETB', maximumFractionDigits:2 }).format(Number(v)||0);
const label = (table) => ({accounts:'Account',categories:'Category',transactions:'Transaction',budgets:'Budget',bills:'Bill',savings_goals:'Savings Goal',debts:'Debt'})[table] || table;
const nameFor = (item) => item.data?.name || item.data?.description || item.data?.counterparty || label(item.table_name);
const detailFor = (item) => {
  const d = item.data || {};
  if (item.table_name === 'transactions') return `${d.type || 'transaction'} · ${d.amount != null ? money(d.amount) : ''}`;
  if (item.table_name === 'debts') return `${d.counterparty || ''} · ${d.remaining_amount != null ? money(d.remaining_amount, d.currency) : ''}`;
  if (item.table_name === 'bills') return d.amount != null ? money(d.amount) : '';
  if (item.table_name === 'budgets') return d.amount != null ? money(d.amount) : '';
  if (item.table_name === 'savings_goals') return d.target_amount != null ? `Target ${money(d.target_amount)}` : '';
  if (item.table_name === 'accounts') return d.currency || '';
  return '';
};

const css = document.createElement('style');
css.textContent = `
.trash-trigger{margin-top:8px;border:0;background:transparent;color:#cbd5e1;text-align:left;padding:11px 12px;border-radius:12px;width:100%;font:inherit;font-weight:600;cursor:pointer}
.trash-trigger:hover{background:#1f2937;color:#fff}.trash-badge{display:inline-grid;place-items:center;min-width:18px;height:18px;padding:0 5px;border-radius:999px;background:#fff1f0;color:#c0392b;font-size:10px;margin-left:6px;font-weight:800}
.trash-back{position:fixed;inset:0;background:rgba(15,23,42,.45);display:grid;place-items:center;padding:18px;z-index:10030}
.trash-modal{width:min(900px,100%);max-height:88vh;overflow:auto;background:#fff;border-radius:20px;padding:20px;box-shadow:0 30px 90px rgba(0,0,0,.22)}
.trash-head{display:flex;align-items:center;justify-content:space-between;gap:12px}.trash-list{margin-top:14px;display:grid;gap:10px}.trash-row{border:1px solid var(--line);border-radius:14px;padding:14px;display:flex;justify-content:space-between;gap:12px;align-items:center}.trash-meta{font-size:12px;color:var(--muted);margin-top:4px}.trash-actions{display:flex;gap:8px;flex-wrap:wrap}.trash-empty{padding:36px;text-align:center;color:var(--muted)}
@media(max-width:760px){.trash-row{align-items:flex-start;flex-direction:column}.trash-actions{width:100%}.trash-actions .btn{flex:1}}
`;
document.head.appendChild(css);

function overlay(items) {
  const back = document.createElement('div'); back.className='trash-back';
  const rows = items.length ? items.map(item => {
    const d = item.data || {};
    return `<div class="trash-row">
      <div><strong>${esc(nameFor(item))}</strong><div class="trash-meta">${esc(label(item.table_name))} · Deleted ${new Date(item.deleted_at).toLocaleString()}${detailFor(item) ? ` · ${esc(detailFor(item))}` : ''}</div></div>
      <div class="trash-actions"><button class="btn btn-secondary" data-restore="${item.id}">Restore</button><button class="btn btn-danger" data-perm="${item.id}">Delete permanently</button></div>
    </div>`;
  }).join('') : '<div class="trash-empty">Trash Bin is empty.</div>';
  back.innerHTML = `<div class="trash-modal"><div class="trash-head"><div><h2 style="margin:0">Trash Bin</h2><div class="muted" style="font-size:12px;margin-top:4px">Deleted records are kept here until you permanently remove them.</div></div><div class="trash-actions"><button class="btn btn-secondary" data-close>Close</button>${items.length?'<button class="btn btn-danger" data-empty>Empty Trash</button>':''}</div></div><div class="trash-list">${rows}</div></div>`;
  document.body.appendChild(back);
  back.querySelector('[data-close]').onclick=()=>back.remove();
  back.querySelectorAll('[data-restore]').forEach(btn=>btn.onclick=async()=>{
    btn.disabled=true;
    const {error}=await db.rpc('restore_trash_item',{p_trash_id:btn.dataset.restore});
    if(error){alert(error.message);btn.disabled=false;return;}
    back.remove(); window.location.reload();
  });
  back.querySelectorAll('[data-perm]').forEach(btn=>btn.onclick=async()=>{
    if(!confirm('Permanently delete this item? This cannot be undone.')) return;
    btn.disabled=true;
    const {error}=await db.rpc('permanently_delete_trash_item',{p_trash_id:btn.dataset.perm});
    if(error){alert(error.message);btn.disabled=false;return;}
    openTrash();
    back.remove();
  });
  back.querySelector('[data-empty]')?.addEventListener('click',async()=>{
    if(!confirm('Permanently delete everything in Trash Bin? This cannot be undone.')) return;
    const {error}=await db.from('trash_items').delete().neq('id','00000000-0000-0000-0000-000000000000');
    if(error){alert(error.message);return;}
    back.remove(); openTrash();
  });
}

async function openTrash(){
  const {data,error}=await db.from('trash_items').select('*').order('deleted_at',{ascending:false});
  if(error){alert(error.message);return;}
  overlay(data||[]);
}

async function addButton(){
  const nav=document.querySelector('.nav');
  if(!nav || nav.querySelector('[data-trash-bin]')) return;
  const b=document.createElement('button'); b.className='trash-trigger'; b.dataset.trashBin='1'; b.innerHTML='Trash Bin <span class="trash-badge" id="trash-count" style="display:none"></span>';
  b.onclick=openTrash; nav.appendChild(b); updateCount();
}

async function updateCount(){
  const badge=document.querySelector('#trash-count'); if(!badge)return;
  const {count,error}=await db.from('trash_items').select('id',{count:'exact',head:true});
  if(error || !count){badge.style.display='none';return;}
  badge.textContent=count; badge.style.display='inline-grid';
}

const observer=new MutationObserver(()=>addButton());
observer.observe(document.body,{childList:true,subtree:true});
setTimeout(addButton,300);
