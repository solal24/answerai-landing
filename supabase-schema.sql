-- AnswerAI — Supabase schema
-- À coller dans Supabase > SQL Editor > New query > Run

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Utilisateurs (un par établissement Google Business)
CREATE TABLE users (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  google_id       TEXT UNIQUE NOT NULL,
  email           TEXT NOT NULL,
  name            TEXT,
  picture         TEXT,
  access_token    TEXT,
  refresh_token   TEXT,
  -- Établissement
  place_id        TEXT,
  establishment_name TEXT,
  google_review_url  TEXT,
  rating          NUMERIC,
  review_count    INTEGER,
  -- Paramètres IA
  tone            TEXT DEFAULT 'professionnel', -- professionnel | chaleureux | formel
  auto_send       BOOLEAN DEFAULT false,
  auto_send_delay_hours NUMERIC DEFAULT 2,
  custom_instructions TEXT,
  -- Timestamps
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Avis Google (importés via Places API ou Business Profile API)
CREATE TABLE reviews (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id         UUID REFERENCES users(id) ON DELETE CASCADE,
  google_review_id TEXT,
  author_name     TEXT,
  author_photo    TEXT,
  rating          INTEGER CHECK (rating BETWEEN 1 AND 5),
  text            TEXT,
  time            TIMESTAMPTZ,
  ai_response     TEXT,
  status          TEXT DEFAULT 'pending', -- pending | approved | sent
  sent_at         TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, google_review_id)
);

-- Contacts envoyés en review gating
CREATE TABLE gating_contacts (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id         UUID REFERENCES users(id) ON DELETE CASCADE,
  name            TEXT,
  phone           TEXT,
  email           TEXT,
  channel         TEXT, -- sms | email
  status          TEXT DEFAULT 'sent', -- sent | unsatisfied (passe à 'unsatisfied' seulement si le client clique le lien de feedback privé)
  message_sent_at TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Retours des clients insatisfaits (formulaire privé)
CREATE TABLE gating_responses (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  contact_id      UUID REFERENCES gating_contacts(id) ON DELETE CASCADE,
  feedback        TEXT,
  handled         BOOLEAN DEFAULT false,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Index utiles
CREATE INDEX idx_reviews_user ON reviews(user_id, created_at DESC);
CREATE INDEX idx_gating_user ON gating_contacts(user_id, created_at DESC);
CREATE INDEX idx_gating_status ON gating_contacts(user_id, status);

-- ============================================================
-- MIGRATION — à exécuter si vous avez déjà créé les tables avant
-- l'ajout des colonnes rating / review_count (16/06/2026)
-- ============================================================
ALTER TABLE users ADD COLUMN IF NOT EXISTS rating NUMERIC;
ALTER TABLE users ADD COLUMN IF NOT EXISTS review_count INTEGER;

-- ============================================================
-- MIGRATION — délai avant envoi automatique des réponses (16/06/2026)
-- ============================================================
ALTER TABLE users ADD COLUMN IF NOT EXISTS auto_send_delay_hours NUMERIC DEFAULT 2;
