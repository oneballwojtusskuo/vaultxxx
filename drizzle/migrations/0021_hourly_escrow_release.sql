CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;
SELECT cron.schedule('hourly-escrow-release','5 * * * *',
$$ SELECT net.http_post(url := 'https://vlnd.pl/api/public/escrow/process', headers := '{"Content-Type":"application/json"}'::jsonb, body := '{}'::jsonb); $$);