-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- Note: Apache AGE extension requires separate installation
-- For local dev, we'll use pgvector for semantic search
-- AGE can be added when needed for graph queries

-- Create enum types
CREATE TYPE entry_type AS ENUM (
  'book',
  'journal_article',
  'conference_paper',
  'thesis',
  'report',
  'website',
  'newspaper_article',
  'magazine_article',
  'video',
  'podcast',
  'interview',
  'legal_document',
  'patent',
  'dataset',
  'software',
  'custom'
);

CREATE TYPE annotation_type AS ENUM (
  'descriptive',
  'evaluative',
  'reflective',
  'summary',
  'critical',
  'custom'
);

CREATE TYPE subscription_tier AS ENUM (
  'free',
  'light',
  'pro'
);

CREATE TYPE subscription_status AS ENUM (
  'active',
  'past_due',
  'canceled',
  'trialing',
  'incomplete'
);

CREATE TYPE share_permission AS ENUM (
  'view',
  'comment',
  'edit',
  'admin'
);

CREATE TYPE veritas_label AS ENUM (
  'exceptional',
  'high',
  'moderate',
  'limited',
  'low'
);
