-- Tactics Expansion Migration
-- New columns on tactics_players
ALTER TABLE tactics_players ADD COLUMN IF NOT EXISTS campaign_level integer DEFAULT 0 NOT NULL;
ALTER TABLE tactics_players ADD COLUMN IF NOT EXISTS warfare_attack_squad jsonb;
ALTER TABLE tactics_players ADD COLUMN IF NOT EXISTS warfare_defense_squad jsonb;
ALTER TABLE tactics_players ADD COLUMN IF NOT EXISTS warfare_rating integer DEFAULT 1000 NOT NULL;
ALTER TABLE tactics_players ADD COLUMN IF NOT EXISTS warfare_wins integer DEFAULT 0 NOT NULL;
ALTER TABLE tactics_players ADD COLUMN IF NOT EXISTS warfare_losses integer DEFAULT 0 NOT NULL;
ALTER TABLE tactics_players ADD COLUMN IF NOT EXISTS login_streak integer DEFAULT 0 NOT NULL;
ALTER TABLE tactics_players ADD COLUMN IF NOT EXISTS last_login_date varchar(10);

-- New column on tactics_matches
ALTER TABLE tactics_matches ADD COLUMN IF NOT EXISTS match_type varchar(20) DEFAULT 'standard' NOT NULL;

-- Campaign attempts table
CREATE TABLE IF NOT EXISTS tactics_campaign_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id uuid NOT NULL REFERENCES tactics_players(id) ON DELETE CASCADE,
  level integer NOT NULL,
  won boolean NOT NULL,
  stars integer DEFAULT 0 NOT NULL,
  currency_earned integer DEFAULT 0 NOT NULL,
  duration_ticks integer NOT NULL,
  created_at timestamp DEFAULT now() NOT NULL
);

-- Game config table
CREATE TABLE IF NOT EXISTS tactics_game_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key varchar(100) NOT NULL UNIQUE,
  value jsonb NOT NULL,
  description text,
  updated_at timestamp DEFAULT now() NOT NULL
);
