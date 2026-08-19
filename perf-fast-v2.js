(() => {
  const originalFetch = window.fetch.bind(window);
  const cache = new Map();
  let warmed = false;

  const isSupabaseRest = (url) => /\/rest\/v1\//.test(url);
  const isRead = (init = {}) => !init.method || String(init.method).toUpperCase() === 'GET';
  const keyFor = (url, init = {}) => {
    const headers = new Headers(init.headers || {});
    return `${url}|${headers.get('authorization') || ''}`;
  };

  const cacheResponse = async (url, init = {}) => {
    const response = await originalFetch(url, init);
    if (response.ok) cache.set(keyFor(url, init), response.clone());
    return response;
  };

  const warm = (url, init) => {
    if (warmed || !isSupabaseRest(url) || !isRead(init)) return;
    warmed = true;
    const base = new URL(url);
    const rest = `${base.origin}/rest/v1/`;
    const headers = new Headers(init.headers || {});
    const queries = [
      ['accounts', 'select=*&order=created_at.desc'],
      ['transactions', 'select=*&order=transaction_date.desc&order=created_at.desc'],
      ['categories', 'select=*&order=created_at.desc'],
      ['budgets', 'select=*&order=month.desc'],
      ['bills', 'select=*&order=due_date.asc'],
      ['savings_goals', 'select=*&order=created_at.desc'],
      ['exchange_rates', 'select=*&base_currency=eq.USD&quote_currency=eq.ETB&order=rate_date.desc&order=fetched_at.desc&limit=1'],
    ];
    Promise.allSettled(queries.map(([table, query]) => cacheResponse(`${rest}${table}?${query}`, { method: 'GET', headers }))).catch(() => {});
  };

  window.fetch = async (input, init = {}) => {
    const url = typeof input === 'string' ? input : input?.url || '';
    if (!isSupabaseRest(url) || !isRead(init)) return originalFetch(input, init);

    warm(url, init);
    const cached = cache.get(keyFor(url, init));
    if (cached) return cached.clone();
    return cacheResponse(input, init);
  };
})();
