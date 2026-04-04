-- States table
CREATE TABLE states (
  code CHAR(2) PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  slug VARCHAR(50) NOT NULL UNIQUE,
  population INTEGER,
  median_household_income INTEGER
);

-- Categories table
CREATE TABLE categories (
  slug VARCHAR(50) PRIMARY KEY,
  display_name VARCHAR(100) NOT NULL,
  description TEXT,
  seo_title_template VARCHAR(200),
  seo_description_template TEXT,
  sort_order INTEGER DEFAULT 0
);

-- Legal costs table
CREATE TABLE legal_costs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category VARCHAR(50) NOT NULL REFERENCES categories(slug),
  state_code CHAR(2) NOT NULL REFERENCES states(code),
  complexity VARCHAR(20) NOT NULL CHECK (complexity IN ('simple', 'moderate', 'complex')),
  cost_low INTEGER NOT NULL,
  cost_median INTEGER NOT NULL,
  cost_high INTEGER NOT NULL,
  hourly_rate_low INTEGER,
  hourly_rate_median INTEGER,
  hourly_rate_high INTEGER,
  typical_duration VARCHAR(50),
  common_fees JSONB DEFAULT '[]'::jsonb,
  sources JSONB DEFAULT '[]'::jsonb,
  last_verified_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(category, state_code, complexity)
);

-- Enable RLS on all tables
ALTER TABLE legal_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE states ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Public SELECT-only policies (anon role can read, cannot write/update/delete)
CREATE POLICY "Public read legal_costs" ON legal_costs FOR SELECT USING (true);
CREATE POLICY "Public read states" ON states FOR SELECT USING (true);
CREATE POLICY "Public read categories" ON categories FOR SELECT USING (true);

-- Performance indexes
CREATE INDEX idx_legal_costs_category ON legal_costs(category);
CREATE INDEX idx_legal_costs_state ON legal_costs(state_code);
CREATE INDEX idx_legal_costs_lookup ON legal_costs(category, state_code, complexity);
