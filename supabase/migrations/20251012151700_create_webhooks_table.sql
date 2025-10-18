-- Create webhooks table for dynamic webhook management
CREATE TABLE webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  priority INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX idx_webhooks_is_active ON webhooks(is_active);
CREATE INDEX idx_webhooks_priority ON webhooks(priority);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to call the function before any update
CREATE TRIGGER update_webhooks_updated_at
  BEFORE UPDATE ON webhooks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert default webhook record
INSERT INTO webhooks (name, url, is_active, priority)
VALUES (
  'Primary n8n Webhook',
  'https://zaytoven.app.n8n.cloud/webhook/jn-in-a-box',
  true,
  1
);

-- Enable Row Level Security
ALTER TABLE webhooks ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anonymous read access (for Edge Function queries)
CREATE POLICY "Allow anonymous read access"
  ON webhooks
  FOR SELECT
  TO anon
  USING (true);

-- Create policy to allow all operations for now (to be restricted with proper auth later)
CREATE POLICY "Allow all operations for authenticated users"
  ON webhooks
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create policy to allow all operations for service role (Edge Functions)
CREATE POLICY "Allow all operations for service role"
  ON webhooks
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
