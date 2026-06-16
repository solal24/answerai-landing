/* ============================================================
   AnswerAI — wrapper fetch commun pour les Netlify Functions
   ============================================================ */
(function () {
  async function api(path, options) {
    const res = await fetch('/.netlify/functions/' + path, Object.assign({
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    }, options));

    if (res.status === 401) {
      window.location.href = '/Auth.html';
      throw new Error('Unauthorized');
    }

    const text = await res.text();
    const data = text ? JSON.parse(text) : null;
    if (!res.ok) throw new Error((data && data.error) || res.statusText);
    return data;
  }

  function get(path) {
    return api(path);
  }
  function post(path, body) {
    return api(path, { method: 'POST', body: JSON.stringify(body || {}) });
  }

  window.AnswerAPI = { get, post };
})();
