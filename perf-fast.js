(() => {
  const originalFetch = window.fetch.bind(window);
  const cache = new Map();
  let primed = false;
  let priming = null;

  const isSupabaseRest = (url) => /\/rest\/v1\//.test(url);
  const isRead = (init = {}) => !init.method || String(init.method).toUpperCase() === 'GET';
  const keyFor = (url, init = {}) => {
    const headers = new Headers(init.headers || {});
    return `${url}|${headers.get('authorization') || ''}|${headers.get('apikey') || ''}`;
  };

  async function readAndCache(url, init) {
    const key = keyFor(url, init);
    if (cache.has(key)) return cache.get(key).clone();
    const response = await originalFetch(url, init);
    if (response.ok) cache.set(key, response.clone());
    return response;
  }

  async function prime(url, init) {
    if (primed || priming || !isSupabaseRest(url) || !isRead(init)) return;
    priming = (async () => {
      try {
        const base = new URL(url);
        const rest = `${base.origin}/rest/v1/`;
        const headers = new Headers(init.headers || {});
        const tables = [
          ['accounts', 'select=*&order=created_at.desc'],
          ['transactions', 'select=*&order=transaction_date.desc&order=created_at.desc'],
          ['categories', 'select=*&order=created_at.desc'],
          ['budgets', 'select=*&order=month.desc'],
          ['bills', 'select=*&order=due_date.asc'],
          ['savings_goals', 'select=*&order=created_at.desc'],
          ['exchange_rates', 'select=*&base_currency=eq.USD&quote_currency=eq.ETB&order=rate_date.desc&order=fetched_at.desc&limit=1'],
        ];
        await Promise.allSettled(tables.map(async ([table, query]) => {
          const target = `${rest}${table}?${query}`;
          const response = await originalFetch(target, { method: 'GET', headers });
          if (response.ok) cache.set(keyFor(target, { headers }), response.clone());
        }));
      } finally {
        primed = true;
        priming = null;
      }
    })();
  }

  window.fetch = async (input, init = {}) => {
    const url = typeof input === 'string' ? input : input?.url || '';
    if (!isSupabaseRest(url) || !isRead(init)) return originalFetch(input, init);

    if (!primed) await prime(url, init);

    const key = keyFor(url, init);
    const cached = cache.get(key);
    if (cached) return cached.clone();

    return readAndCache(input, init);
  };
})();
