-- Update webhooks to include HD Physique primary and test endpoints
-- Adds two new active webhooks with priorities for failover

-- Insert primary HD Physique webhook if it doesn't exist
INSERT INTO webhooks (name, url, is_active, priority)
SELECT 
  'HD Physique Primary Webhook',
  'https://zaytoven.app.n8n.cloud/webhook/hd-physique-chat-interface',
  true,
  1
WHERE NOT EXISTS (
  SELECT 1 FROM webhooks WHERE url = 'https://zaytoven.app.n8n.cloud/webhook/hd-physique-chat-interface'
);

-- Insert test HD Physique webhook if it doesn't exist
INSERT INTO webhooks (name, url, is_active, priority)
SELECT 
  'HD Physique Test Webhook',
  'https://zaytoven.app.n8n.cloud/webhook-test/hd-physique-chat-interface',
  true,
  2
WHERE NOT EXISTS (
  SELECT 1 FROM webhooks WHERE url = 'https://zaytoven.app.n8n.cloud/webhook-test/hd-physique-chat-interface'
);

-- Update timestamps for any existing matches (optional, trigger handles it)
UPDATE webhooks 
SET updated_at = now()
WHERE url IN (
  'https://zaytoven.app.n8n.cloud/webhook/hd-physique-chat-interface',
  'https://zaytoven.app.n8n.cloud/webhook-test/hd-physique-chat-interface'
);

-- Log the changes
DO $$
DECLARE
  primary_added INTEGER;
  test_added INTEGER;
BEGIN
  SELECT COUNT(*) INTO primary_added FROM webhooks 
  WHERE url = 'https://zaytoven.app.n8n.cloud/webhook/hd-physique-chat-interface';
  
  SELECT COUNT(*) INTO test_added FROM webhooks 
  WHERE url = 'https://zaytoven.app.n8n.cloud/webhook-test/hd-physique-chat-interface';
  
  RAISE NOTICE 'HD Physique webhooks updated: Primary=%, Test=%', primary_added, test_added;
END $$;
