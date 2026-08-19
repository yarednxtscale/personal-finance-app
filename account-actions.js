import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const SUPABASE_URL = 'https://hznphzpukdwxyqgqksrx.supabase.co';
const SUPABASE_KEY = 'sb_publishable_1CgZ5bRDG7tSltHDwIc5HQ_w1SQFR-9';
const db = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: true, autoRefreshToken: true } });

const style = document.createElement('style');
style.textContent = `
  #account-delete-card{margin-top:16px;border:1px solid #fecaca;background:#fff7f7;border-radius:18px;padding:18px}
  #account-delete-card h3{margin:0 0 6px;color:#991b1b;font-size:16px}
  #account-delete-card p{margin:0;color:#7f1d1d;font-size:12px;line-height:1.5}
  #account-delete-card button{margin-top:12px;border:0;border-radius:11px;padding:10px 14px;font-weight:800;background:#b91c1c;color:#fff}
  #account-delete-card button:disabled{opacity:.6}
`;
document.head.appendChild(style);

function currentPageIsSettings(){
  const title = document.querySelector('.topbar h1');
  return title && title.textContent.trim().toLowerCase() === 'settings';
}

async function addDeleteCard(){
  if(!currentPageIsSettings() || document.querySelector('#account-delete-card')) return;
  const main = document.querySelector('.main');
  if(!main) return;
  const card = document.createElement('section');
  card.id = 'account-delete-card';
  card.innerHTML = `
    <h3>Delete account</h3>
    <p>This permanently deletes your Finance Hub account and all finance data tied to it. This cannot be undone.</p>
    <button id="delete-account-button" type="button">Delete my account</button>
  `;
  main.appendChild(card);
  card.querySelector('#delete-account-button').addEventListener('click', deleteAccount);
}

async function deleteAccount(){
  const button = document.querySelector('#delete-account-button');
  if(!button) return;
  const first = window.confirm('Delete your Finance Hub account and all associated financial data?');
  if(!first) return;
  const second = window.prompt('Type DELETE to permanently confirm.');
  if(second !== 'DELETE') return;

  button.disabled = true;
  button.textContent = 'Deleting…';
  try{
    const { data: { session } } = await db.auth.getSession();
    if(!session) throw new Error('Your session has expired. Please sign in again.');
    const { error } = await db.functions.invoke('delete-account', {
      body: {},
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    if(error) throw error;
    localStorage.clear();
    sessionStorage.clear();
    await db.auth.signOut();
    window.location.replace('/');
  }catch(error){
    console.error(error);
    button.disabled = false;
    button.textContent = 'Delete my account';
    alert(error?.message || 'Could not delete account.');
  }
}

const observer = new MutationObserver(() => addDeleteCard());
observer.observe(document.body, { childList: true, subtree: true });
addDeleteCard();
