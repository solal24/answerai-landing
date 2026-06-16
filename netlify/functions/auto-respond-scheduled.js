const { schedule } = require('@netlify/functions');
const { getSupabase } = require('./utils/supabase');
const { generateReply } = require('./utils/ai');

async function syncReviewsForUser(supabase, user) {
  const url = new URL('https://maps.googleapis.com/maps/api/place/details/json');
  url.searchParams.set('place_id', user.place_id);
  url.searchParams.set('fields', 'reviews,rating,user_ratings_total');
  url.searchParams.set('language', 'fr');
  url.searchParams.set('reviews_sort', 'newest');
  url.searchParams.set('key', process.env.GOOGLE_PLACES_API_KEY);

  const res = await fetch(url.toString());
  const data = await res.json();
  const place = data.result || {};

  if (place.rating != null) {
    const { error: ratingError } = await supabase
      .from('users')
      .update({ rating: place.rating, review_count: place.user_ratings_total ?? null })
      .eq('id', user.id);
    if (ratingError) console.error(`auto-respond-scheduled.js rating update error for user ${user.id}:`, ratingError);
  }

  const reviews = place.reviews || [];
  for (const r of reviews) {
    const { error: upsertError } = await supabase
      .from('reviews')
      .upsert({
        user_id: user.id,
        google_review_id: `${r.author_name}_${r.time}`,
        author_name: r.author_name,
        author_photo: r.profile_photo_url,
        rating: r.rating,
        text: r.text,
        time: new Date(r.time * 1000).toISOString(),
      }, { onConflict: 'user_id,google_review_id', ignoreDuplicates: true });
    if (upsertError) console.error(`auto-respond-scheduled.js upsert error for user ${user.id}:`, upsertError);
  }
}

async function processUser(supabase, user) {
  if (!user.place_id) return;

  await syncReviewsForUser(supabase, user);

  const delayHours = user.auto_send_delay_hours ?? 2;
  const cutoff = new Date(Date.now() - delayHours * 3600 * 1000).toISOString();

  const { data: pending, error: pendingError } = await supabase
    .from('reviews')
    .select('*')
    .eq('user_id', user.id)
    .eq('status', 'pending')
    .lte('created_at', cutoff);

  if (pendingError) {
    console.error(`auto-respond-scheduled.js pending select error for user ${user.id}:`, pendingError);
    return;
  }

  for (const review of pending || []) {
    let finalResponse = review.ai_response;
    if (!finalResponse) {
      finalResponse = await generateReply({
        establishmentName: user.establishment_name,
        tone: user.tone,
        customInstructions: user.custom_instructions,
        rating: review.rating,
        reviewText: review.text,
      });
    }

    const { error: sentError } = await supabase
      .from('reviews')
      .update({
        ai_response: finalResponse,
        status: 'sent',
        sent_at: new Date().toISOString(),
      })
      .eq('id', review.id);
    if (sentError) console.error(`auto-respond-scheduled.js sent update error for review ${review.id}:`, sentError);
  }
}

const handler = async () => {
  const supabase = getSupabase();

  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('*')
    .eq('auto_send', true);

  if (usersError) {
    console.error('auto-respond-scheduled.js users select error:', usersError);
    return { statusCode: 500 };
  }

  for (const user of users || []) {
    try {
      await processUser(supabase, user);
    } catch (e) {
      console.error(`auto-respond failed for user ${user.id}:`, e);
    }
  }

  return { statusCode: 200 };
};

exports.handler = schedule('*/30 * * * *', handler);
