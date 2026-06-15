const { getSession } = require('./utils/session');

exports.handler = async (event) => {
  const session = getSession(event);
  if (!session) return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };

  const { q } = event.queryStringParameters || {};
  if (!q) return { statusCode: 400, body: JSON.stringify({ error: 'Missing query' }) };

  const url = new URL('https://maps.googleapis.com/maps/api/place/autocomplete/json');
  url.searchParams.set('input', q);
  url.searchParams.set('types', 'establishment');
  url.searchParams.set('language', 'fr');
  url.searchParams.set('key', process.env.GOOGLE_PLACES_API_KEY);

  const res = await fetch(url.toString());
  const data = await res.json();

  const results = (data.predictions || []).map(p => ({
    place_id: p.place_id,
    name: p.structured_formatting?.main_text || p.description,
    address: p.structured_formatting?.secondary_text || '',
  }));

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(results),
  };
};
