-- Drop existing tables if they exist (to handle type changes)
DROP TABLE IF EXISTS chat_messages CASCADE;
DROP TABLE IF EXISTS topics CASCADE;

-- Topics (formerly Communities) Table
CREATE TABLE topics (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  created_by TEXT NOT NULL,
  max_geographic_scope TEXT NOT NULL CHECK (max_geographic_scope IN ('neighborhood', 'city', 'state', 'national', 'global')),
  coordinates JSONB,
  is_active BOOLEAN DEFAULT true,
  member_count INTEGER DEFAULT 0,
  global_discussions TEXT[] DEFAULT '{}',
  local_discussions TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Chat Messages Table
CREATE TABLE chat_messages (
  id TEXT PRIMARY KEY,
  topic_id TEXT NOT NULL REFERENCES topics(id),
  region TEXT NOT NULL CHECK (region IN ('global', 'national', 'state', 'city', 'neighborhood')),
  thread TEXT NOT NULL CHECK (thread IN ('intro', 'content', 'events')),
  content TEXT NOT NULL,
  author_id TEXT NOT NULL,
  author_name TEXT NOT NULL,
  message_type TEXT NOT NULL DEFAULT 'text',
  -- Location context for smart filtering
  country_code TEXT DEFAULT 'US', -- ISO country code (e.g., 'US', 'UK', 'CA')
  state_code TEXT, -- State/province code (e.g., 'CA' for California, 'NY' for New York)
  city_name TEXT, -- City name (e.g., 'San Francisco', 'Oakland')
  neighborhood_name TEXT, -- Neighborhood name (e.g., 'Mission District', 'SoMa')
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_topics_scope ON topics(max_geographic_scope);
CREATE INDEX idx_topics_category ON topics(category);
CREATE INDEX idx_topics_active ON topics(is_active);
CREATE INDEX idx_topics_created_at ON topics(created_at DESC);
CREATE INDEX idx_chat_topic ON chat_messages(topic_id);
CREATE INDEX idx_chat_region ON chat_messages(region);
CREATE INDEX idx_chat_created ON chat_messages(created_at DESC);
-- Location context indexes for smart filtering
CREATE INDEX idx_chat_country ON chat_messages(country_code);
CREATE INDEX idx_chat_state ON chat_messages(state_code);
CREATE INDEX idx_chat_city ON chat_messages(city_name);
CREATE INDEX idx_chat_neighborhood ON chat_messages(neighborhood_name);

-- Enable Row Level Security
ALTER TABLE topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Allow public read access to active topics
CREATE POLICY "Public can view active topics"
  ON topics FOR SELECT
  USING (is_active = true);

-- Allow authenticated users to insert topics
CREATE POLICY "Authenticated users can create topics"
  ON topics FOR INSERT
  WITH CHECK (auth.role() = 'authenticated' OR auth.role() = 'service_role');

-- Allow service role to manage topics
CREATE POLICY "Service role can manage topics"
  ON topics FOR ALL
  USING (auth.role() = 'service_role');

-- Allow public to read chat messages
CREATE POLICY "Public can view chat messages"
  ON chat_messages FOR SELECT
  TO public
  USING (true);

-- Allow authenticated users to create chat messages
CREATE POLICY "Authenticated users can create chat messages"
  ON chat_messages FOR INSERT
  WITH CHECK (auth.role() = 'authenticated' OR auth.role() = 'service_role');

-- Allow service role to manage chat messages
CREATE POLICY "Service role can manage chat messages"
  ON chat_messages FOR ALL
  USING (auth.role() = 'service_role');

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_topics_updated_at BEFORE UPDATE ON topics
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- DEMO DATA - All sample topics and messages
-- ============================================================================

-- Insert all sample topics
INSERT INTO topics (id, name, description, category, created_by, max_geographic_scope, coordinates, member_count) VALUES
  -- City Level Topics
  ('community_sf', 'Housing & Homelessness Solutions - San Francisco', 'Community-driven initiatives to address housing affordability and homelessness through advocacy, resources, and direct support', 'Humanitarian', 'user_sf_1', 'city', '{"lat": 37.7749, "lng": -122.4194}', 4521),
  ('community_sf_tech', 'SF Tech for Good - San Francisco', 'Tech professionals using skills for social impact - volunteer coding, mentorship, and digital literacy programs', 'Technology', 'user_sf_tech_1', 'city', '{"lat": 37.7749, "lng": -122.4194}', 2891),
  ('community_sf_arts', 'San Francisco Arts Community', 'Supporting local artists, galleries, and cultural events across the city', 'Cultural', 'user_sf_arts_1', 'city', '{"lat": 37.7749, "lng": -122.4194}', 3267),
  ('community_oakland', 'Oakland Community Coalition', 'Building stronger neighborhoods across Oakland through local organizing and mutual aid', 'Community', 'user_oakland_1', 'city', '{"lat": 37.8044, "lng": -122.2712}', 1834),
  ('community_san_jose', 'San Jose Innovation Hub', 'Connecting San Jose''s diverse tech and startup community for collaboration and growth', 'Technology', 'user_sj_1', 'city', '{"lat": 37.3382, "lng": -121.8863}', 2156),
  ('community_arusha', 'Wildlife Conservation Network - Arusha', 'Protecting Tanzania''s wildlife through community-led conservation efforts and anti-poaching initiatives', 'Environmental', 'user_tanzania_1', 'city', '{"lat": -3.3667, "lng": 36.6833}', 2847),
  ('community_miami', 'Hurricane Preparedness Initiative - Miami', 'Community response network for hurricane season preparation, evacuation coordination, and disaster recovery', 'Safety', 'user_miami_1', 'city', '{"lat": 25.7617, "lng": -80.1918}', 5621),
  ('community_tokyo', 'Earthquake Response Team - Tokyo', 'Coordinating earthquake preparedness drills, emergency supplies, and rapid response protocols', 'Safety', 'user_tokyo_1', 'city', '{"lat": 35.6895, "lng": 139.6917}', 8934),
  ('community_amsterdam', 'Climate Adaptation Forum - Amsterdam', 'Building resilient infrastructure and sustainable solutions for rising sea levels and flooding', 'Environmental', 'user_amsterdam_1', 'city', '{"lat": 52.3676, "lng": 4.9041}', 3456),
  ('community_sydney', 'Bushfire Preparedness Coalition - Sydney', 'Community-driven bushfire prevention, early warning systems, and emergency evacuation planning', 'Safety', 'user_sydney_1', 'city', '{"lat": -33.8688, "lng": 151.2093}', 4732),
  ('community_mumbai', 'Monsoon Resilience Network - Mumbai', 'Preparing communities for monsoon season with drainage solutions, flood alerts, and emergency response', 'Safety', 'user_mumbai_1', 'city', '{"lat": 19.0760, "lng": 72.8777}', 6891),
  ('community_sao_paulo', 'Urban Sustainability Project - São Paulo', 'Green infrastructure, waste reduction, and sustainable urban development initiatives', 'Environmental', 'user_saopaulo_1', 'city', '{"lat": -23.5505, "lng": -46.6333}', 5234),
  ('community_dubai', 'Water Conservation Alliance - Dubai', 'Innovative water-saving technologies and desert resilience strategies for arid climates', 'Environmental', 'user_dubai_1', 'city', '{"lat": 25.2048, "lng": 55.2708}', 4123),
  ('community_vancouver', 'Indigenous Community Hub - Vancouver', 'Supporting Indigenous-led initiatives, cultural preservation, and reconciliation efforts', 'Cultural', 'user_vancouver_1', 'city', '{"lat": 49.2827, "lng": -123.1207}', 3567),
  ('community_reykjavik', 'Renewable Energy Collective - Reykjavik', 'Advancing geothermal and renewable energy solutions for sustainable communities', 'Environmental', 'user_reykjavik_1', 'city', '{"lat": 64.1466, "lng": -21.8174}', 2891),
  
  -- Neighborhood Level Topics
  ('community_mission_district', 'Mission District Neighbors', 'Hyperlocal community for Mission District residents - street fairs, local issues, and neighborhood watch', 'Community', 'user_sf_2', 'neighborhood', '{"lat": 37.7599, "lng": -122.4148}', 342),
  ('community_haight_ashbury', 'Haight-Ashbury Community Alliance', 'Supporting our historic Haight neighborhood through local businesses, events, and mutual aid', 'Community', 'user_sf_3', 'neighborhood', '{"lat": 37.7694, "lng": -122.4481}', 278),
  ('community_richmond_district', 'Richmond District Residents', 'Connect with neighbors in the Richmond - from Ocean Beach to Golden Gate Park', 'Community', 'user_sf_4', 'neighborhood', '{"lat": 37.7806, "lng": -122.4703}', 189),
  ('community_soma', 'SoMa Community Action Network', 'South of Market residents organizing for affordable housing and neighborhood improvement', 'Community', 'user_sf_5', 'neighborhood', '{"lat": 37.7790, "lng": -122.4094}', 467),
  
  -- State Level Topics
  ('community_california', 'California Climate Action Network', 'Statewide coordination for climate resilience, wildfire prevention, and sustainable policy advocacy', 'Environmental', 'user_ca_1', 'state', '{"lat": 36.7783, "lng": -119.4179}', 15642),
  ('community_texas', 'Texas Emergency Response Coalition', 'State-level coordination for disaster preparedness, extreme weather response, and power grid resilience', 'Safety', 'user_tx_1', 'state', '{"lat": 31.9686, "lng": -99.9018}', 12389),
  
  -- National Level Topics
  ('community_us_healthcare', 'National Healthcare Access Alliance', 'Nationwide advocacy for affordable healthcare, connecting communities across America', 'Humanitarian', 'user_us_1', 'national', '{"lat": 39.8283, "lng": -98.5795}', 43782),
  ('community_us_education', 'Education Equity Network USA', 'Fighting for equal educational opportunities across all states and communities', 'Education', 'user_us_2', 'national', '{"lat": 39.8283, "lng": -98.5795}', 38921),
  
  -- Global Level Topics
  ('community_climate_global', 'Global Climate Action Coalition', 'Worldwide network coordinating climate action, renewable energy transitions, and international policy', 'Environmental', 'user_global_1', 'global', '{"lat": 0, "lng": 0}', 127453),
  ('community_refugees_global', 'International Refugee Support Network', 'Cross-border coordination supporting displaced people worldwide with resources, advocacy, and resettlement', 'Humanitarian', 'user_global_2', 'global', '{"lat": 0, "lng": 0}', 89234)
ON CONFLICT (id) DO NOTHING;

-- Insert sample chat messages with location context
INSERT INTO chat_messages (id, topic_id, region, thread, content, author_id, author_name, message_type, country_code, state_code, city_name, neighborhood_name) VALUES
  -- San Francisco - Housing & Homelessness Solutions (multi-level messages)
  -- National level (since it's a city topic, users can filter down from city to neighborhood)
  ('msg_sf_1', 'community_sf', 'city', 'intro', 'Hi everyone! I''m Alex, a housing advocate working with local nonprofits. Let''s collaborate to make SF more affordable and supportive for everyone.', 'user_sf_1', 'Alex Chen', 'text', 'US', 'CA', 'San Francisco', NULL),
  ('msg_sf_2', 'community_sf', 'city', 'content', 'Our community housing initiative just secured 50 transitional housing units in the Tenderloin! We''re also expanding our job placement program. Volunteers welcome!', 'user_sf_1', 'Alex Chen', 'text', 'US', 'CA', 'San Francisco', NULL),
  -- Neighborhood level - Mission District
  ('msg_sf_mission_1', 'community_sf', 'neighborhood', 'content', 'Mission District residents: We''re hosting a community meeting next Tuesday at 7pm at the Mission Cultural Center to discuss the new affordable housing development on 24th St.', 'user_sf_mission_1', 'Maria Lopez', 'text', 'US', 'CA', 'San Francisco', 'Mission District'),
  ('msg_sf_mission_2', 'community_sf', 'neighborhood', 'content', 'Great news! The Mission housing cooperative has 3 units opening up next month. Priority for long-time Mission residents facing displacement.', 'user_sf_mission_2', 'Carlos Hernandez', 'text', 'US', 'CA', 'San Francisco', 'Mission District'),
  -- Neighborhood level - Tenderloin
  ('msg_sf_tenderloin_1', 'community_sf', 'neighborhood', 'content', 'Tenderloin update: The new transitional housing on Turk St is now accepting applications. On-site services include job training and mental health support.', 'user_sf_3', 'Jamie Wong', 'text', 'US', 'CA', 'San Francisco', 'Tenderloin'),
  -- State level - California-wide housing policy
  ('msg_sf_ca_state_1', 'community_sf', 'state', 'content', 'California just passed SB 423 extending streamlined housing approval statewide! This will help us build more affordable units faster in SF and across California.', 'user_ca_housing_1', 'Rachel Kim', 'text', 'US', 'CA', NULL, NULL),
  -- National level - US housing policy
  ('msg_sf_national_1', 'community_sf', 'national', 'content', 'Federal update: HUD announced $500M in new grants for homelessness prevention nationwide. California cities including SF are eligible to apply!', 'user_national_housing_1', 'David Miller', 'text', 'US', NULL, NULL, NULL),
  
  -- Arusha - Wildlife Conservation (city-level)
  ('msg_arusha_1', 'community_arusha', 'city', 'intro', 'Welcome! I''m Sarah, a wildlife ranger at Arusha National Park. Excited to connect with fellow conservationists!', 'user_tanzania_1', 'Sarah Mwangi', 'text', 'TZ', NULL, 'Arusha', NULL),
  ('msg_arusha_2', 'community_arusha', 'city', 'content', 'Our anti-poaching patrols spotted a herd of 15 elephants near the Athi River today. Great to see population recovery!', 'user_tanzania_2', 'James Omondi', 'text', 'TZ', NULL, 'Arusha', NULL),
  
  -- Miami - Hurricane Preparedness (city-level)
  ('msg_miami_1', 'community_miami', 'city', 'intro', 'Hi everyone, I''m Maria, emergency coordinator for Miami-Dade. Here to help keep our community safe during hurricane season!', 'user_miami_1', 'Maria Rodriguez', 'text', 'US', 'FL', 'Miami', NULL),
  ('msg_miami_2', 'community_miami', 'city', 'content', 'Hurricane season starts June 1st. Please stock up on water (1 gallon per person per day for 3 days), batteries, and non-perishable food.', 'user_miami_1', 'Maria Rodriguez', 'text', 'US', 'FL', 'Miami', NULL),
  
  -- Tokyo - Earthquake Response (city-level)
  ('msg_tokyo_1', 'community_tokyo', 'city', 'intro', 'こんにちは! I''m Kenji, disaster preparedness coordinator. Let''s work together to keep Tokyo safe.', 'user_tokyo_1', 'Kenji Tanaka', 'text', 'JP', NULL, 'Tokyo', NULL),
  ('msg_tokyo_2', 'community_tokyo', 'city', 'content', 'Reminder: Our monthly earthquake drill is this Saturday at 10am. Please participate from your neighborhoods!', 'user_tokyo_1', 'Kenji Tanaka', 'text', 'JP', NULL, 'Tokyo', NULL),
  
  -- Amsterdam - Climate Adaptation (city-level)
  ('msg_amsterdam_1', 'community_amsterdam', 'city', 'intro', 'Hoi! I''m Lars, urban planner focused on flood prevention. Amsterdam has centuries of experience living with water - let''s share it!', 'user_amsterdam_1', 'Lars van der Berg', 'text', 'NL', NULL, 'Amsterdam', NULL),
  ('msg_amsterdam_2', 'community_amsterdam', 'city', 'content', 'Just finished installing new water pumps in Noord district. Our adaptive flood barrier system saved 200+ homes during last week''s storm surge!', 'user_amsterdam_1', 'Lars van der Berg', 'text', 'NL', NULL, 'Amsterdam', 'Noord'),
  
  -- Sydney - Bushfire Preparedness (city-level)
  ('msg_sydney_1', 'community_sydney', 'city', 'intro', 'G''day everyone! I''m Rachel, volunteer firefighter. Here to help prepare our communities for bushfire season.', 'user_sydney_1', 'Rachel Thompson', 'text', 'AU', 'NSW', 'Sydney', NULL),
  ('msg_sydney_2', 'community_sydney', 'city', 'content', 'Create defensible space around your property: Clear leaves from gutters, trim trees away from house, keep lawn mowed. These simple steps save lives!', 'user_sydney_1', 'Rachel Thompson', 'text', 'AU', 'NSW', 'Sydney', NULL),
  
  -- Mumbai - Monsoon Resilience (city-level)
  ('msg_mumbai_1', 'community_mumbai', 'city', 'intro', 'Namaste! I''m Priya, monsoon preparedness coordinator for Mumbai Metropolitan Region. Here to keep our city moving during heavy rains.', 'user_mumbai_1', 'Priya Sharma', 'text', 'IN', 'MH', 'Mumbai', NULL),
  ('msg_mumbai_2', 'community_mumbai', 'city', 'content', 'Monsoon update: Heavy rainfall expected next week. Check flood-prone area list, download BMC Disaster Management app, keep emergency numbers handy.', 'user_mumbai_1', 'Priya Sharma', 'text', 'IN', 'MH', 'Mumbai', NULL),
  
  -- São Paulo - Urban Sustainability (city-level)
  ('msg_saopaulo_1', 'community_sao_paulo', 'city', 'intro', 'Olá! Sou Carlos, working on green infrastructure projects across São Paulo. Let''s make our city more sustainable together!', 'user_saopaulo_1', 'Carlos Silva', 'text', 'BR', 'SP', 'São Paulo', NULL),
  ('msg_saopaulo_2', 'community_sao_paulo', 'city', 'content', 'Our vertical garden project in Vila Madalena reduced building temperature by 5°C and improved air quality. We''re expanding to 10 more neighborhoods!', 'user_saopaulo_1', 'Carlos Silva', 'text', 'BR', 'SP', 'São Paulo', 'Vila Madalena'),
  
  -- Dubai - Water Conservation (city-level)
  ('msg_dubai_1', 'community_dubai', 'city', 'intro', 'مرحبا! I''m Fatima, water conservation engineer. In the desert, every drop counts - let''s innovate together!', 'user_dubai_1', 'Fatima Al Mansoori', 'text', 'AE', NULL, 'Dubai', NULL),
  ('msg_dubai_2', 'community_dubai', 'city', 'content', 'New desalination plant using solar power just went online! 40% more efficient than old system. Dubai is leading the way in sustainable water tech.', 'user_dubai_1', 'Fatima Al Mansoori', 'text', 'AE', NULL, 'Dubai', NULL),
  
  -- Global Climate Action (global messages have no specific location)
  ('msg_climate_global_1', 'community_climate_global', 'global', 'intro', 'Hello world! This is our global coordination hub for climate action. Together we can make a difference across all continents!', 'user_global_1', 'Dr. Emma Wilson', 'text', NULL, NULL, NULL, NULL),
  ('msg_climate_global_2', 'community_climate_global', 'global', 'content', 'Major milestone: 150 cities worldwide committed to carbon neutrality by 2040! Our grassroots advocacy is creating real policy change.', 'user_global_1', 'Dr. Emma Wilson', 'text', NULL, NULL, NULL, NULL),
  
  -- Global Refugee Support (global messages have no specific location)
  ('msg_refugees_global_1', 'community_refugees_global', 'global', 'intro', 'Welcome to our global refugee support network. We coordinate resources, legal aid, and resettlement assistance across borders.', 'user_global_2', 'Hassan Ibrahim', 'text', NULL, NULL, NULL, NULL),
  ('msg_refugees_global_2', 'community_refugees_global', 'global', 'content', 'Urgent: 5,000 families need winter supplies in northern camps. We have logistics partners ready. Please donate or volunteer if you can help.', 'user_global_2', 'Hassan Ibrahim', 'text', NULL, NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;
