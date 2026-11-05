-- Suivi propriétaire : une ligne par appareil, pour qu'un appareil n'écrase pas les valeurs d'un autre (ordinateur / iPhone).
-- La fiche de l'utilisateur additionne ses appareils : app installée et Garmin si c'est vrai sur au moins un, plus grand nombre d'envois.
-- npx wrangler d1 execute triathlon-stats --remote --file schema6.sql
CREATE TABLE IF NOT EXISTS devices (user_id TEXT NOT NULL, device TEXT NOT NULL, installed INTEGER, garmin INTEGER, sent INTEGER, acts INTEGER, first INTEGER NOT NULL, last INTEGER NOT NULL, PRIMARY KEY (user_id, device));
