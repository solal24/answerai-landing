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
  -- Paramètres IA
  tone            TEXT DEFAULT 'professionnel', -- professionnel | chaleureux | formel
  auto_send       BOOLEAN DEFAULT false,
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
  status          TEXT DEFAULT 'sent', -- sent | satisfied | unsatisfied
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
