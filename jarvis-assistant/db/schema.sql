-- JARVIS Hub / DiraFinder — Postgres schema
--
-- Matches the columns written by the n8n workflow
-- (n8n/unified-assistant-workflow.json, nodes "Postgres: Upsert Listing" /
-- "Postgres: Upsert Enriched" / "Postgres: Insert Error").
--
-- Run once against your database before activating the workflow:
--   psql "$DATABASE_URL" -f db/schema.sql

create table if not exists listings (
  id              bigserial primary key,
  source          text not null,
  source_id       text not null,
  url             text,
  country         text default 'IL',
  deal_type       text,
  property_kind   text,
  city            text,
  neighborhood    text,
  street          text,
  house_no        text,
  lat             double precision,
  lon             double precision,
  gush            text,
  helka           text,
  price_amount    numeric,
  price_currency  text,
  price_ils       numeric,
  built_sqm       numeric,
  plot_sqm        numeric,
  balcony_sqm     numeric,
  rooms           numeric,
  floor           numeric,
  total_floors    numeric,
  furnished       text,
  parking         numeric,
  elevator        boolean,
  condition       text,
  year_built      numeric,
  content_hash    text,
  raw             jsonb,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (source, source_id)
);

create index if not exists idx_listings_city on listings (city);
create index if not exists idx_listings_deal_type on listings (deal_type);

create table if not exists listings_enriched (
  id                          bigserial primary key,
  listing_id                  bigint not null references listings (id) on delete cascade,
  estimated_market_value_ils  numeric,
  value_low_ils               numeric,
  value_high_ils              numeric,
  price_per_sqm_ils           numeric,
  price_per_plot_sqm_ils      numeric,
  market_gap_pct              numeric,
  valuation_confidence        numeric,
  furnished_state             text,
  furnish_value_adj_ils       numeric,
  residential_score           integer,
  investment_score            integer,
  gross_rent_yield_pct        numeric,
  recommended_use             text,
  red_flags                   jsonb,
  buyer_fit_score             integer,
  rationale_he                text,
  score                       integer,
  score_breakdown             jsonb,
  model                       text,
  created_at                  timestamptz not null default now(),
  updated_at                  timestamptz not null default now(),
  unique (listing_id)
);

create index if not exists idx_listings_enriched_score on listings_enriched (score desc);

create table if not exists ingest_errors (
  id          bigserial primary key,
  source      text,
  stage       text,
  message     text,
  payload     text,
  created_at  timestamptz not null default now()
);

-- Convenience view used by the "GET /webhook/dirafinder/listings" node
-- in the n8n workflow, and by the website's DiraFinder tab.
create or replace view listings_scored as
select
  l.id,
  l.source,
  l.url,
  l.deal_type,
  l.property_kind,
  l.city,
  l.neighborhood,
  l.street,
  l.house_no,
  l.price_ils,
  l.built_sqm,
  l.rooms,
  l.floor,
  l.condition,
  l.furnished,
  e.estimated_market_value_ils,
  e.value_low_ils,
  e.value_high_ils,
  e.market_gap_pct,
  e.recommended_use,
  e.gross_rent_yield_pct,
  e.red_flags,
  e.rationale_he,
  e.score,
  e.score_breakdown,
  l.updated_at
from listings l
join listings_enriched e on e.listing_id = l.id;
