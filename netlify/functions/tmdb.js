exports.handler = async (event) => {
  const q = event.queryStringParameters || {};
  const type = q.type === 'tv' ? 'tv' : 'movie';
  const clean = (s) => String(s || '').replace(/[^0-9,|]/g, '');
  const json = (code, obj) => ({ statusCode: code, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(obj) });
  if (!process.env.TMDB_TOKEN) { return json(500, { error: 'Нет переменной TMDB_TOKEN', results: [] }); }
  const params = new URLSearchParams({
    language: 'ru-RU',
    include_adult: 'false',
    sort_by: 'vote_count.desc',
    'vote_count.gte': '300',
    with_genres: clean(q.genres),
    'with_runtime.gte': clean(q.rmin) || '0',
    'with_runtime.lte': clean(q.rmax) || '400'
  });
  if (type === 'movie' && ['G', 'PG', 'PG-13', 'R', 'NC-17'].includes(q.cert)) {
    params.set('certification_country', 'US');
    params.set('certification.lte', q.cert);
  }
  try {
    const res = await fetch('https://api.themoviedb.org/3/discover/' + type + '?' + params, {
      headers: { Authorization: 'Bearer ' + process.env.TMDB_TOKEN }
    });
    if (!res.ok) { return json(502, { error: 'TMDB ответил ' + res.status, results: [] }); }
    const data = await res.json();
    return json(200, { results: (data.results || []).slice(0, 20) });
  } catch (e) {
    return json(500, { error: 'Сбой запроса', results: [] });
  }
};
