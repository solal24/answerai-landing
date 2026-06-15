const twilio = require('twilio');
const sgMail = require('@sendgrid/mail');
const jwt = require('jsonwebtoken');
const { getSession } = require('./utils/session');
const { getSupabase } = require('./utils/supabase');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: '' };

  const session = getSession(event);
  if (!session) return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };

  const { contacts, channel } = JSON.parse(event.body || '{}');
  if (!contacts?.length) return { statusCode: 400, body: JSON.stringify({ error: 'No contacts' }) };

  const supabase = getSupabase();
  const baseUrl = process.env.URL || 'https://ephemeral-parfait-47018d.netlify.app';

  const { data: user } = await supabase
    .from('users')
    .select('establishment_name, google_review_url')
    .eq('id', session.userId)
    .single();

  const establishmentName = user?.establishment_name || 'notre établissement';
  const googleReviewUrl = user?.google_review_url || '#';

  const results = [];

  for (const contact of contacts) {
    // Sauvegarde le contact en BDD
    const { data: dbContact } = await supabase
      .from('gating_contacts')
      .insert({
        user_id: session.userId,
        name: contact.name,
        phone: contact.phone || null,
        email: contact.email || null,
        channel,
      })
      .select('id')
      .single();

    // Token signé pour le lien de feedback privé (7 jours)
    const feedbackToken = jwt.sign(
      { contactId: dbContact.id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    const feedbackUrl = `${baseUrl}/feedback.html?t=${feedbackToken}`;

    const textMessage = [
      `Bonjour ${contact.name} ! 👋`,
      `Votre expérience chez ${establishmentName} vous a-t-elle satisfaite ?`,
      ``,
      `✅ Oui, laisser un avis Google :`,
      googleReviewUrl,
      ``,
      `❌ Non, nous contacter en privé :`,
      feedbackUrl,
    ].join('\n');

    try {
      if (channel === 'sms' && contact.phone) {
        const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
        await client.messages.create({
          body: textMessage,
          from: process.env.TWILIO_PHONE_NUMBER,
          to: contact.phone,
        });
      } else if (channel === 'email' && contact.email) {
        sgMail.setApiKey(process.env.SENDGRID_API_KEY);
        await sgMail.send({
          to: contact.email,
          from: { email: process.env.SENDGRID_FROM_EMAIL, name: establishmentName },
          subject: `Votre expérience chez ${establishmentName} — votre avis compte`,
          text: textMessage,
          html: `
            <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;">
              <h2 style="color:#0F1729;">Bonjour ${contact.name} 👋</h2>
              <p>Votre expérience chez <strong>${establishmentName}</strong> vous a-t-elle satisfaite ?</p>
              <div style="margin:28px 0;display:flex;flex-direction:column;gap:12px;">
                <a href="${googleReviewUrl}" style="display:block;background:#10B981;color:#fff;text-align:center;padding:14px 20px;border-radius:10px;text-decoration:none;font-weight:600;">✅ Oui, laisser un avis Google</a>
                <a href="${feedbackUrl}" style="display:block;background:#F3F4F6;color:#374151;text-align:center;padding:14px 20px;border-radius:10px;text-decoration:none;font-weight:600;">❌ Non, nous contacter en privé</a>
              </div>
              <p style="color:#9CA3AF;font-size:13px;">Cet email vous a été envoyé suite à votre visite. Vous ne recevrez plus de messages de notre part.</p>
            </div>
          `,
        });
      }

      await supabase
        .from('gating_contacts')
        .update({ message_sent_at: new Date().toISOString() })
        .eq('id', dbContact.id);

      results.push({ name: contact.name, status: 'sent' });
    } catch (err) {
      console.error(`Send failed for ${contact.name}:`, err.message);
      results.push({ name: contact.name, status: 'error', error: err.message });
    }
  }

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ results }),
  };
};
