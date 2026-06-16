const { getSession } = require('./utils/session');
const { getSupabase } = require('./utils/supabase');

exports.handler = async (event) => {
  const session = getSession(event);
  if (!session) return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };

  const supabase = getSupabase();

  // Récupère l'utilisateur et son place_id
  const { data: user } = await supabase
    .from('users')
    .select('place_id, establishment_name')
    .eq('id', session.userId)
    .single();

  if (!user?.place_id) {
    return { statusCode: 400, body: JSON.stringify({ error: 'No place configured' }) };
  }

  // Appel Places API pour les avis et la note actuelle
  const url = new URL('https://maps.googleapis.com/maps/api/place/details/json');
  url.searchParams.set('place_id', user.place_id);
  url.searchParams.set('fields', 'reviews,rating,user_ratings_total');
  url.searchParams.set('language', 'fr');
  url.searchParams.set('reviews_sort', 'newest');
  url.searchParams.set('key', process.env.GOOGLE_PLACES_API_KEY);

  const res = await fetch(url.toString());
  const data = await res.json();
  const place = data.result || {};

  // Garde la note/nombre d'avis à jour sur le profil
  if (place.rating != null) {
    const { error: ratingError } = await supabase
      .from('users')
      .update({ rating: place.rating, review_count: place.user_ratings_total ?? null })
      .eq('id', session.userId);
    if (ratingError) console.error('reviews.js rating update error:', ratingError);
  }

  // Upsert les avis en base pour garder un historique
  const reviews = place.reviews || [];
  for (const r of reviews) {
    const { error: upsertError } = await supabase
      .from('reviews')
      .upsert({
        user_id: session.userId,
        google_review_id: `${r.author_name}_${r.time}`,
        author_name: r.author_name,
        author_photo: r.profile_photo_url,
        rating: r.rating,
        text: r.text,
        time: new Date(r.time * 1000).toISOString(),
      }, { onConflict: 'user_id,google_review_id', ignoreDuplicates: true });
    if (upsertError) console.error('reviews.js upsert error:', upsertError);
  }

  // Retourne les avis avec leur statut depuis la BDD
  const { data: dbReviews, error: selectError } = await supabase
    .from('reviews')
    .select('*')
    .eq('user_id', session.userId)
    .order('time', { ascending: false })
    .limit(20);

  if (selectError) {
    console.error('reviews.js select error:', selectError);
    return { statusCode: 500, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Database error' }) };
  }

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      rating: place.rating,
      total: place.user_ratings_total,
      reviews: dbReviews || [],
    }),
  };
};
