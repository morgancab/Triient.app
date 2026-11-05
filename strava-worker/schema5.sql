-- Suivi propriétaire, détail par utilisateur : appareil, app installée, Garmin, séances envoyées vers la montre, historique des visites.
-- npx wrangler d1 execute triathlon-stats --remote --file schema5.sql
ALTER TABLE users ADD COLUMN device TEXT;
ALTER TABLE users ADD COLUMN installed INTEGER;
ALTER TABLE users ADD COLUMN garmin INTEGER;
ALTER TABLE users ADD COLUMN sent INTEGER;
ALTER TABLE users ADD COLUMN acts INTEGER;
ALTER TABLE users ADD COLUMN visits INTEGER;
-- Une ligne par visite (app ouverte après au moins 30 min d'absence) ou par connexion Google ; gardées 1 an.
CREATE TABLE IF NOT EXISTS visits (user_id TEXT NOT NULL, t INTEGER NOT NULL, kind TEXT NOT NULL, device TEXT, installed INTEGER);
CREATE INDEX IF NOT EXISTS visits_user_t ON visits (user_id, t);
