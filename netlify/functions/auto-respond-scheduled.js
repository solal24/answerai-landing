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
    await supabase
      .from('users')
      .update({ rating: place.rating, review_count: place.user_ratings_total ?? null })
      .eq('id', user.id);
  }

  const reviews = place.reviews || [];
  for (const r of reviews) {
    await supabase
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
  }
}

async function processUser(supabase, user) {
  if (!user.place_id) return;

  await syncReviewsForUser(supabase, user);

  const delayHours = user.auto_send_delay_hours ?? 2;
  const cutoff = new Date(Date.now() - delayHours * 3600 * 1000).toISOString();

  const { data: pending } = await supabase
    .from('reviews')
    .select('*')
    .eq('user_id', user.id)
    .eq('status', 'pending')
    .lte('created_at', cutoff);

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

    await supabase
      .from('reviews')
      .update({
        ai_response: finalResponse,
        status: 'sent',
        sent_at: new Date().toISOString(),
      })
      .eq('id', review.id);
  }
}

const handler = async () => {
  const supabase = getSupabase();

  const { data: users } = await supabase
    .from('users')
    .select('*')
    .eq('auto_send', true);

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
