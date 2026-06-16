const { getSession } = require('./utils/session');
const { getSupabase } = require('./utils/supabase');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: '' };

  const session = getSession(event);
  if (!session) return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };

  const { place_id } = JSON.parse(event.body || '{}');
  if (!place_id) return { statusCode: 400, body: JSON.stringify({ error: 'Missing place_id' }) };

  // Récupère les détails de l'établissement via Places API
  const url = new URL('https://maps.googleapis.com/maps/api/place/details/json');
  url.searchParams.set('place_id', place_id);
  url.searchParams.set('fields', 'name,rating,user_ratings_total');
  url.searchParams.set('language', 'fr');
  url.searchParams.set('key', process.env.GOOGLE_PLACES_API_KEY);

  const res = await fetch(url.toString());
  const data = await res.json();
  const place = data.result || {};

  // Construit l'URL de dépôt d'avis Google
  const googleReviewUrl = `https://search.google.com/local/writereview?placeid=${place_id}`;

  const supabase = getSupabase();
  await supabase
    .from('users')
    .update({
      place_id,
      establishment_name: place.name || 'Mon établissement',
      google_review_url: googleReviewUrl,
      rating: place.rating ?? null,
      review_count: place.user_ratings_total ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', session.userId);

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ success: true, name: place.name, googleReviewUrl }),
  };
};
